import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js'
import { FileValidator } from '../utils/file-validator'

export interface ModelMetadata {
    fileName: string
    fileSize: number
    fileType: string
    vertexCount?: number
    faceCount?: number
    materialCount?: number
    textureCount?: number
    boundingBox?: THREE.Box3
    animations?: string[]
    customProperties?: Record<string, any>
}

export interface LoadedModel {
    object: THREE.Object3D
    metadata: ModelMetadata
}

export class ModelLoader {
    private gltfLoader = new GLTFLoader()
    private objLoader = new OBJLoader()

    async loadModel(file: File): Promise<LoadedModel> {
        const modelType = FileValidator.getModelType(file.name)
        const buffer = await file.arrayBuffer()

        switch (modelType) {
            case 'gltf':
                return this.loadGLTF(file, buffer)
            case 'obj':
                return this.loadOBJ(file, buffer)
            case 'ifc':
            case 'step':
                // These will be handled by Conway loader
                throw new Error(`${modelType.toUpperCase()} files should be handled by Conway loader`)
            default:
                throw new Error(`Unsupported file format: ${file.name}`)
        }
    }

    private async loadGLTF(file: File, buffer: ArrayBuffer): Promise<LoadedModel> {
        return new Promise((resolve, reject) => {
            this.gltfLoader.parse(buffer, '', (gltf) => {
                const object = gltf.scene
                const metadata = this.extractGLTFMetadata(file, gltf)
                resolve({ object, metadata })
            }, reject)
        })
    }

    private async loadOBJ(file: File, buffer: ArrayBuffer): Promise<LoadedModel> {
        const text = new TextDecoder().decode(buffer)
        const object = this.objLoader.parse(text)
        const metadata = this.extractOBJMetadata(file, object)
        return { object, metadata }
    }

    private extractGLTFMetadata(file: File, gltf: any): ModelMetadata {
        const scene = gltf.scene
        const animations = gltf.animations || []
        
        let vertexCount = 0
        let faceCount = 0
        let materialCount = 0
        let textureCount = 0
        const materials = new Set()
        const textures = new Set()

        scene.traverse((child: THREE.Object3D) => {
            if (child instanceof THREE.Mesh) {
                const geometry = child.geometry
                if (geometry.attributes.position) {
                    vertexCount += geometry.attributes.position.count
                }
                if (geometry.index) {
                    faceCount += geometry.index.count / 3
                } else if (geometry.attributes.position) {
                    faceCount += geometry.attributes.position.count / 3
                }

                if (child.material) {
                    const material = Array.isArray(child.material) ? child.material : [child.material]
                    material.forEach(mat => {
                        materials.add(mat.uuid)
                        // Check for textures
                        Object.values(mat).forEach(value => {
                            if (value instanceof THREE.Texture) {
                                textures.add(value.uuid)
                            }
                        })
                    })
                }
            }
        })

        materialCount = materials.size
        textureCount = textures.size

        const boundingBox = new THREE.Box3().setFromObject(scene)

        return {
            fileName: file.name,
            fileSize: file.size,
            fileType: 'GLTF',
            vertexCount,
            faceCount,
            materialCount,
            textureCount,
            boundingBox,
            animations: animations.map((anim: any) => anim.name || 'Unnamed Animation'),
            customProperties: {
                hasAnimations: animations.length > 0,
                animationCount: animations.length,
                sceneNodes: this.countSceneNodes(scene)
            }
        }
    }

    private extractOBJMetadata(file: File, object: THREE.Object3D): ModelMetadata {
        let vertexCount = 0
        let faceCount = 0
        let materialCount = 0
        const materials = new Set()

        object.traverse((child: THREE.Object3D) => {
            if (child instanceof THREE.Mesh) {
                const geometry = child.geometry
                if (geometry.attributes.position) {
                    vertexCount += geometry.attributes.position.count
                }
                if (geometry.index) {
                    faceCount += geometry.index.count / 3
                } else if (geometry.attributes.position) {
                    faceCount += geometry.attributes.position.count / 3
                }

                if (child.material) {
                    const material = Array.isArray(child.material) ? child.material : [child.material]
                    material.forEach(mat => materials.add(mat.uuid))
                }
            }
        })

        materialCount = materials.size
        const boundingBox = new THREE.Box3().setFromObject(object)

        return {
            fileName: file.name,
            fileSize: file.size,
            fileType: 'OBJ',
            vertexCount,
            faceCount,
            materialCount,
            textureCount: 0, // OBJ files don't typically include texture data
            boundingBox,
            customProperties: {
                sceneNodes: this.countSceneNodes(object)
            }
        }
    }

    private countSceneNodes(object: THREE.Object3D): number {
        let count = 0
        object.traverse(() => count++)
        return count
    }
}