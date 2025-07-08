import { SimpleViewerScene, ShadowQuality } from '@bldrs-ai/conway/compiled/src/rendering/threejs/simple_viewer_scene.js'
import SceneObject from '@bldrs-ai/conway/compiled/src/rendering/threejs/scene_object'
import { initViewer } from '@bldrs-ai/conway/compiled/src/rendering/threejs/html_viewer.js'

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
    private isInitialized = false

    async initialize(): Promise<ViewerScene> {
        if (this.isInitialized && this.scene) {
            return this.scene
        }

        try {
            this.scene = initViewer() as ViewerScene
            this.scene.hasAmbientLight = true
            this.isInitialized = true
            
            console.log('Conway viewer initialized successfully')
            return this.scene
        } catch (error) {
            console.error('Failed to initialize Conway viewer:', error)
            throw new Error('Failed to initialize 3D viewer')
        }
    }

    getScene(): ViewerScene | null {
        return this.scene
    }

    async loadModel(buffer: ArrayBuffer): Promise<void> {
        if (!this.scene) {
            throw new Error('Scene not initialized')
        }

        try {
            await this.scene.load(buffer)
        } catch (error) {
            console.error('Failed to load model:', error)
            throw new Error('Failed to load model. Please check the file format.')
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