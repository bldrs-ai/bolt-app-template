import { initViewer } from '@bldrs-ai/conway/compiled/src/rendering/threejs/html_viewer.js'
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js'
import { ShadowQuality, SimpleViewerScene } from '@bldrs-ai/conway/compiled/src/rendering/threejs/simple_viewer_scene.js'
import SceneObject from '@bldrs-ai/conway/compiled/src/rendering/threejs/scene_object'
import { versionString } from '@bldrs-ai/conway/compiled/src'

interface ViewerScene {
    ambientOcclusion: boolean
    hasAmbientLight: boolean
    shadowsEnabled: boolean
    shadowQuality: ShadowQuality
    load(buffer: ArrayBuffer): Promise<void>
    loadEquirectangularEnvironmentMapHDR(url: string): Promise<void>
    onload?: (scene: SimpleViewerScene, object: SceneObject) => void
}

class ModernIFCViewer {
    private scene: ViewerScene | null = null
    private gui: GUI | null = null
    private isModelLoaded = false

    // DOM elements
    private welcomeScreen!: HTMLElement
    private viewerContainer!: HTMLElement
    private controlsPanel!: HTMLElement
    private loadingOverlay!: HTMLElement
    private dropOverlay!: HTMLElement
    private loadModelInput!: HTMLInputElement
    private loadEnvInput!: HTMLInputElement

    constructor() {
        this.welcomeScreen = document.getElementById('welcomeScreen')!
        this.viewerContainer = document.getElementById('viewerContainer')!
        this.controlsPanel = document.getElementById('controlsPanel')!
        this.loadingOverlay = document.getElementById('loadingOverlay')!
        this.dropOverlay = document.getElementById('dropOverlay')!
        this.loadModelInput = document.getElementById('loadModel') as HTMLInputElement
        this.loadEnvInput = document.getElementById('loadEnvironmentMap') as HTMLInputElement
        this.setupEventListeners()
        this.setupDragAndDrop()
    }

    private setupEventListeners(): void {
        // Header buttons
        document.getElementById('loadModelBtn')?.addEventListener('click', () => {
            this.loadModelInput.click()
        })

        document.getElementById('loadEnvBtn')?.addEventListener('click', () => {
            this.loadEnvInput.click()
        })

        // Welcome screen button
        document.getElementById('welcomeLoadBtn')?.addEventListener('click', () => {
            this.loadModelInput.click()
        })

        // File input handlers
        this.loadModelInput.addEventListener('change', this.handleModelLoad.bind(this))
        this.loadEnvInput.addEventListener('change', this.handleEnvironmentLoad.bind(this))

        // Controls panel toggle
        document.getElementById('toggleControls')?.addEventListener('click', this.toggleControlsPanel.bind(this))
    }

    private setupDragAndDrop(): void {
        let dragCounter = 0

        const handleDragEnter = (e: DragEvent) => {
            e.preventDefault()
            dragCounter++
            this.dropOverlay.style.display = 'flex'
        }

        const handleDragLeave = (e: DragEvent) => {
            e.preventDefault()
            dragCounter--
            if (dragCounter === 0) {
                this.dropOverlay.style.display = 'none'
            }
        }

        const handleDragOver = (e: DragEvent) => {
            e.preventDefault()
        }

        const handleDrop = (e: DragEvent) => {
            e.preventDefault()
            dragCounter = 0
            this.dropOverlay.style.display = 'none'

            const files = e.dataTransfer?.files
            if (files && files.length > 0) {
                const file = files[0]
                if (this.isValidModelFile(file)) {
                    this.loadModelFromFile(file)
                } else {
                    this.showNotification('Please drop a valid IFC, STEP, or STP file', 'error')
                }
            }
        }

        // Add event listeners to document
        document.addEventListener('dragenter', handleDragEnter)
        document.addEventListener('dragleave', handleDragLeave)
        document.addEventListener('dragover', handleDragOver)
        document.addEventListener('drop', handleDrop)
    }

    private isValidModelFile(file: File): boolean {
        const validExtensions = ['.ifc', '.step', '.stp']
        const fileName = file.name.toLowerCase()
        return validExtensions.some(ext => fileName.endsWith(ext))
    }

    private async handleModelLoad(): Promise<void> {
        if (this.loadModelInput.files && this.loadModelInput.files.length > 0) {
            const file = this.loadModelInput.files[0]
            await this.loadModelFromFile(file)
        }
    }

    private async loadModelFromFile(file: File): Promise<void> {
        try {
            this.showLoading('Loading model...')
            
            if (!this.scene) {
                await this.initializeViewer()
            }

            const buffer = await file.arrayBuffer()
            await this.scene!.load(buffer)
            
            this.isModelLoaded = true
            this.showViewer()
            this.showNotification(`Successfully loaded ${file.name}`, 'success')
            
        } catch (error) {
            console.error('Error loading model:', error)
            this.showNotification('Failed to load model. Please check the file format.', 'error')
        } finally {
            this.hideLoading()
        }
    }

    private async handleEnvironmentLoad(): Promise<void> {
        if (!this.scene) {
            this.showNotification('Please load a model first', 'warning')
            return
        }

        if (this.loadEnvInput.files && this.loadEnvInput.files.length > 0) {
            try {
                this.showLoading('Loading environment map...')
                
                const file = this.loadEnvInput.files[0]
                const fileReader = new FileReader()

                fileReader.onload = async () => {
                    try {
                        await this.scene!.loadEquirectangularEnvironmentMapHDR(fileReader.result as string)
                        this.scene!.hasAmbientLight = false
                        this.updateGUI()
                        this.showNotification('Environment map loaded successfully', 'success')
                    } catch (error) {
                        console.error('Error loading environment map:', error)
                        this.showNotification('Failed to load environment map', 'error')
                    } finally {
                        this.hideLoading()
                    }
                }

                fileReader.readAsDataURL(file)
            } catch (error) {
                console.error('Error reading environment file:', error)
                this.showNotification('Failed to read environment file', 'error')
                this.hideLoading()
            }
        }
    }

    private async initializeViewer(): Promise<void> {
        // Initialize the Conway viewer
        this.scene = initViewer() as ViewerScene
        this.scene.hasAmbientLight = true

        // Setup GUI
        this.setupGUI()

        console.log('Conway viewer initialized')
    }

    private setupGUI(): void {
        if (!this.scene) return

        const controlsContent = document.getElementById('controlsContent')!
        
        // Create GUI container
        const guiContainer = document.createElement('div')
        controlsContent.appendChild(guiContainer)

        this.gui = new GUI({ container: guiContainer })

        // Add version info
        const versionInfo = { version: versionString.substring(versionString.indexOf('v')) }
        const versionController = this.gui.add(versionInfo, 'version').name('Conway Version').disable()
        versionController.domElement.classList.remove('disabled')
        versionController.domElement.style.color = '#667eea'
        versionController.$input.style.color = '#667eea'
        versionController.$input.style.fontWeight = '600'

        // Add rendering controls
        this.gui.add(this.scene, 'ambientOcclusion').name('Ambient Occlusion')
        this.gui.add(this.scene, 'hasAmbientLight').name('Ambient Light')
        this.gui.add(this.scene, 'shadowsEnabled').name('Shadows')
        this.gui.add(this.scene, 'shadowQuality', {
            Low: ShadowQuality.LOW,
            Medium: ShadowQuality.MEDIUM,
            High: ShadowQuality.HIGH
        }).name('Shadow Quality')

        // Add action buttons
        const actions = {
            loadModel: () => this.loadModelInput.click(),
            loadEnvironment: () => this.loadEnvInput.click(),
            resetView: () => this.resetView()
        }

        this.gui.add(actions, 'loadModel').name('📁 Load Model')
        this.gui.add(actions, 'loadEnvironment').name('🌅 Load Environment')
        this.gui.add(actions, 'resetView').name('🔄 Reset View')
    }

    private updateGUI(): void {
        if (this.gui) {
            this.gui.controllersRecursive().forEach(controller => {
                controller.updateDisplay()
            })
        }
    }

    private showViewer(): void {
        this.welcomeScreen.style.display = 'none'
        this.viewerContainer.style.display = 'block'
        this.controlsPanel.style.display = 'block'
    }

    private showLoading(message: string = 'Loading...'): void {
        const loadingText = this.loadingOverlay.querySelector('.loading-text') as HTMLElement
        loadingText.textContent = message
        this.loadingOverlay.style.display = 'flex'
    }

    private hideLoading(): void {
        this.loadingOverlay.style.display = 'none'
    }

    private toggleControlsPanel(): void {
        const content = document.getElementById('controlsContent')!
        const toggleBtn = document.getElementById('toggleControls')!
        const isCollapsed = content.style.display === 'none'

        if (isCollapsed) {
            content.style.display = 'block'
            toggleBtn.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <polyline points="18,15 12,9 6,15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
            `
        } else {
            content.style.display = 'none'
            toggleBtn.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <polyline points="6,9 12,15 18,9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
            `
        }
    }

    private resetView(): void {
        // This would reset the camera view - implementation depends on Conway API
        this.showNotification('View reset', 'info')
    }

    private showNotification(message: string, type: 'success' | 'error' | 'warning' | 'info'): void {
        // Create notification element
        const notification = document.createElement('div')
        notification.className = `notification notification-${type}`
        notification.textContent = message

        // Add styles
        Object.assign(notification.style, {
            position: 'fixed',
            top: '80px',
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '12px 24px',
            borderRadius: '8px',
            color: 'white',
            fontWeight: '500',
            zIndex: '2000',
            opacity: '0',
            transition: 'all 0.3s ease',
            pointerEvents: 'none'
        })

        // Set background color based on type
        const colors = {
            success: '#48bb78',
            error: '#f56565',
            warning: '#ed8936',
            info: '#667eea'
        }
        notification.style.background = colors[type]

        document.body.appendChild(notification)

        // Animate in
        requestAnimationFrame(() => {
            notification.style.opacity = '1'
            notification.style.transform = 'translateX(-50%) translateY(0)'
        })

        // Remove after delay
        setTimeout(() => {
            notification.style.opacity = '0'
            notification.style.transform = 'translateX(-50%) translateY(-20px)'
            setTimeout(() => {
                document.body.removeChild(notification)
            }, 300)
        }, 3000)
    }
}

// Initialize the application when the page loads
window.addEventListener('load', () => {
    new ModernIFCViewer()
})