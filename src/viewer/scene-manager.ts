import { SimpleViewerScene, ShadowQuality } from '@bldrs-ai/conway/compiled/src/rendering/threejs/simple_viewer_scene.js'
import SceneObject from '@bldrs-ai/conway/compiled/src/rendering/threejs/scene_object'
import { initViewer } from '@bldrs-ai/conway/compiled/src/rendering/threejs/html_viewer.js'
import { ModelLoader, LoadedModel, ModelMetadata } from './model-loader'
import { FileValidator } from '../utils/file-validator'
import * as THREE from 'three'

export interface ViewerScene {
    ambientOcclusion: boolean
    hasAmbientLight: boolean
    shadowsEnabled: boolean
    shadowQuality: ShadowQuality
    load(buffer: ArrayBuffer): Promise<void>
    loadEquirectangularEnvironmentMapHDR(url: string): Promise<void>
    onload?: (scene: SimpleViewerScene, object: SceneObject) => void
}

export class SceneManager {
    private scene: ViewerScene | null = null
    private threeScene: THREE.Scene | null = null
    private modelLoader = new ModelLoader()
    private currentMetadata: ModelMetadata | null = null
    private isInitialized = false

    async initialize(): Promise<ViewerScene> {
        if (this.isInitialized && this.scene) {
            return this.scene
        }

        try {
            this.scene = initViewer() as ViewerScene
            this.scene.hasAmbientLight = true
            
            // Get access to the Three.js scene for non-Conway models
            this.threeScene = this.getThreeScene()
            
            this.isInitialized = true
            
            console.log('Conway viewer initialized successfully')
            return this.scene
        } catch (error) {
            console.error('Failed to initialize Conway viewer:', error)
            throw new Error('Failed to initialize 3D viewer')
        }
    }

    private getThreeScene(): THREE.Scene | null {
        // Try to access the Three.js scene from Conway viewer
        // This might need adjustment based on Conway's actual API
        try {
            return (this.scene as any).scene || null
        } catch (error) {
            console.warn('Could not access Three.js scene from Conway viewer')
            return null
        }
    }

    getScene(): ViewerScene | null {
        return this.scene
    }

    getCurrentMetadata(): ModelMetadata | null {
        return this.currentMetadata
    }

    async loadModel(file: File): Promise<void> {
        if (!this.scene) {
            throw new Error('Scene not initialized')
        }

        const modelType = FileValidator.getModelType(file.name)
        
        try {
            if (modelType === 'ifc' || modelType === 'step') {
                // Use Conway loader for IFC and STEP files
                const buffer = await file.arrayBuffer()
                this.onLoad((scene, obj) => {
                  // Center and scale the model
                  this.centerAndScaleModel(obj)
                })

                console.log('Loading with Conway: ', file.name)
                await this.scene.load(buffer)
                
                // Create basic metadata for Conway-loaded models
                this.currentMetadata = {
                    fileName: file.name,
                    fileSize: file.size,
                    fileType: modelType.toUpperCase(),
                    customProperties: {
                        loadedWith: 'Conway Loader'
                    }
                }
            } else {
                // Use Three.js loaders for other formats
                const loadedModel = await this.modelLoader.loadModel(file)
                
                if (this.threeScene) {
                    // Clear previous models
                    this.clearThreeScene()
                    
                    // Add the new model to the scene
                    this.threeScene.add(loadedModel.object)
                    
                    // Center and scale the model
                    this.centerAndScaleModel(loadedModel.object)
                }
                
                this.currentMetadata = loadedModel.metadata
            }
        } catch (error) {
            console.error('Failed to load model:', error)
            throw new Error('Failed to load model. Please check the file format.')
        }
    }

    private clearThreeScene(): void {
        if (!this.threeScene) return
        
        // Remove all non-essential objects (keep lights, cameras, etc.)
        const objectsToRemove: THREE.Object3D[] = []
        
        this.threeScene.traverse((child) => {
            if (child instanceof THREE.Mesh || child instanceof THREE.Group) {
                if (child.parent === this.threeScene) {
                    objectsToRemove.push(child)
                }
            }
        })
        
        objectsToRemove.forEach(obj => {
            this.threeScene!.remove(obj)
            if (obj instanceof THREE.Mesh) {
                obj.geometry.dispose()
                if (Array.isArray(obj.material)) {
                    obj.material.forEach(mat => mat.dispose())
                } else {
                    obj.material.dispose()
                }
            }
        })
    }

    private centerAndScaleModel(object: THREE.Object3D): void {
        const box = new THREE.Box3().setFromObject(object)
        const center = box.getCenter(new THREE.Vector3())
        const size = box.getSize(new THREE.Vector3())
        
        // Center the model
        object.position.sub(center)
        
        // Scale the model to fit in a reasonable size
        const maxDimension = Math.max(size.x, size.y, size.z)
        if (maxDimension > 10) {
            const scale = 10 / maxDimension
            object.scale.setScalar(scale)
        }
    }

    async loadEnvironmentMap(dataUrl: string): Promise<void> {
        if (!this.scene) {
            throw new Error('Scene not initialized')
        }

        try {
            await this.scene.loadEquirectangularEnvironmentMapHDR(dataUrl)
            this.scene.hasAmbientLight = false
        } catch (error) {
            console.error('Failed to load environment map:', error)
            throw new Error('Failed to load environment map')
        }
    }

    resetView(): void {
        // Implementation would depend on Conway API
        console.log('View reset requested')
    }

    dispose(): void {
        this.scene = null
        this.isInitialized = false
    }
}