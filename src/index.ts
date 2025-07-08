import { SceneManager } from './viewer/scene-manager'
import { NotificationManager } from './ui/notification-manager'
import { ControlsManager } from './ui/controls-manager'
import { LoadingManager } from './ui/loading-manager'
import { FileValidator } from './utils/file-validator'
import { PerformanceMonitor } from './utils/performance-monitor'

class ModernIFCViewer {
    private sceneManager: SceneManager
    private notificationManager: NotificationManager
    private controlsManager: ControlsManager
    private loadingManager: LoadingManager
    private performanceMonitor: PerformanceMonitor
    private isModelLoaded = false

    // DOM elements
    private welcomeScreen!: HTMLElement
    private viewerContainer!: HTMLElement
    private controlsPanel!: HTMLElement
    private dropOverlay!: HTMLElement
    private loadModelInput!: HTMLInputElement
    private loadEnvInput!: HTMLInputElement

    constructor() {
        this.initializeDOMElements()
        this.sceneManager = new SceneManager()
        this.notificationManager = NotificationManager.getInstance()
        this.loadingManager = new LoadingManager()
        this.performanceMonitor = PerformanceMonitor.getInstance()
        this.controlsManager = new ControlsManager(document.getElementById('controlsContent')!)
        
        this.setupEventListeners()
        this.setupDragAndDrop()
        this.setupKeyboardShortcuts()
    }

    private initializeDOMElements(): void {
        this.welcomeScreen = document.getElementById('welcomeScreen')!
        this.viewerContainer = document.getElementById('viewerContainer')!
        this.controlsPanel = document.getElementById('controlsPanel')!
        this.dropOverlay = document.getElementById('dropOverlay')!
        this.loadModelInput = document.getElementById('loadModel') as HTMLInputElement
        this.loadEnvInput = document.getElementById('loadEnvironmentMap') as HTMLInputElement
    }

    private setupEventListeners(): void {
        // Header buttons
        document.getElementById('loadModelBtn')?.addEventListener('click', () => {
            this.loadModelInput.click()
        })

        document.getElementById('loadEnvBtn')?.addEventListener('click', () => {
            if (!this.isModelLoaded) {
                this.notificationManager.warning('Please load a model first')
                return
            }
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
        document.getElementById('toggleControls')?.addEventListener('click', () => {
            this.controlsManager.toggle()
        })

        // Window resize handler
        window.addEventListener('resize', this.handleResize.bind(this))

        // Prevent default drag behaviors on document
        document.addEventListener('dragover', (e) => e.preventDefault())
        document.addEventListener('drop', (e) => e.preventDefault())
    }

    private setupKeyboardShortcuts(): void {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + O: Open file
            if ((e.ctrlKey || e.metaKey) && e.key === 'o') {
                e.preventDefault()
                this.loadModelInput.click()
            }

            // Ctrl/Cmd + E: Load environment
            if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
                e.preventDefault()
                if (this.isModelLoaded) {
                    this.loadEnvInput.click()
                } else {
                    this.notificationManager.warning('Please load a model first')
                }
            }

            // Escape: Close any open dialogs or reset view
            if (e.key === 'Escape') {
                this.resetView()
            }

            // F11: Toggle fullscreen
            if (e.key === 'F11') {
                e.preventDefault()
                this.toggleFullscreen()
            }
        })
    }

    private setupDragAndDrop(): void {
        let dragCounter = 0

        const handleDragEnter = (e: DragEvent): void => {
            e.preventDefault()
            e.stopPropagation()
            dragCounter++
            this.dropOverlay.style.display = 'flex'
        }

        const handleDragLeave = (e: DragEvent): void => {
            e.preventDefault()
            e.stopPropagation()
            dragCounter--
            if (dragCounter === 0) {
                this.dropOverlay.style.display = 'none'
            }
        }

        const handleDragOver = (e: DragEvent): void => {
            e.preventDefault()
            e.stopPropagation()
            // Add visual feedback
            this.dropOverlay.style.background = 'rgba(102, 126, 234, 0.98)'
        }

        const handleDrop = (e: DragEvent): void => {
            e.preventDefault()
            e.stopPropagation()
            dragCounter = 0
            this.dropOverlay.style.display = 'none'
            this.dropOverlay.style.background = 'rgba(102, 126, 234, 0.95)'

            const files = e.dataTransfer?.files
            if (files && files.length > 0) {
                this.handleDroppedFiles(files)
            }
        }

        // Add event listeners to document and body
        const targets = [document, document.body, this.viewerContainer]
        
        targets.forEach(target => {
            target.addEventListener('dragenter', handleDragEnter)
            target.addEventListener('dragleave', handleDragLeave)
            target.addEventListener('dragover', handleDragOver)
            target.addEventListener('drop', handleDrop)
        })
    }

    private async handleDroppedFiles(files: FileList): Promise<void> {
        const file = files[0]
        
        // Check if it's a model file
        const modelValidation = FileValidator.validateModelFile(file)
        if (modelValidation.isValid) {
            await this.loadModelFromFile(file)
            return
        }

        // Check if it's an HDR file
        const hdrValidation = FileValidator.validateHDRFile(file)
        if (hdrValidation.isValid) {
            if (!this.isModelLoaded) {
                this.notificationManager.warning('Please load a model before adding an environment map')
                return
            }
            await this.loadEnvironmentFromFile(file)
            return
        }

        // Neither valid file type
        this.notificationManager.error('Please drop a valid IFC, STEP, STP, or HDR file')
    }

    private async handleModelLoad(): Promise<void> {
        if (this.loadModelInput.files && this.loadModelInput.files.length > 0) {
            const file = this.loadModelInput.files[0]
            await this.loadModelFromFile(file)
        }
    }

    private async loadModelFromFile(file: File): Promise<void> {
        const validation = FileValidator.validateModelFile(file)
        if (!validation.isValid) {
            this.notificationManager.error(validation.error!)
            return
        }

        try {
            this.loadingManager.show(`Loading ${file.name}...`)
            this.performanceMonitor.startTiming()
            
            // Initialize viewer if not already done
            const scene = await this.sceneManager.initialize()
            
            // Load the model
            this.loadingManager.updateMessage('Processing model data...')
            this.loadingManager.setProgress(25)
            
            const buffer = await file.arrayBuffer()
            
            this.loadingManager.updateMessage('Rendering model...')
            this.loadingManager.setProgress(50)
            
            await this.sceneManager.loadModel(buffer)
            
            this.loadingManager.setProgress(100)
            
            // Record performance metrics
            const metrics = this.performanceMonitor.endTiming(file.name, file.size)
            
            // Initialize controls
            this.controlsManager.initialize(scene)
            
            this.isModelLoaded = true
            this.showViewer()
            
            this.notificationManager.success(
                `Successfully loaded ${file.name} (${FileValidator.formatFileSize(file.size)}) in ${metrics.loadTime.toFixed(0)}ms`
            )
            
        } catch (error) {
            console.error('Error loading model:', error)
            this.notificationManager.error(
                error instanceof Error ? error.message : 'Failed to load model. Please check the file format.'
            )
        } finally {
            this.loadingManager.hide()
        }
    }

    private async handleEnvironmentLoad(): Promise<void> {
        if (this.loadEnvInput.files && this.loadEnvInput.files.length > 0) {
            const file = this.loadEnvInput.files[0]
            await this.loadEnvironmentFromFile(file)
        }
    }

    private async loadEnvironmentFromFile(file: File): Promise<void> {
        const validation = FileValidator.validateHDRFile(file)
        if (!validation.isValid) {
            this.notificationManager.error(validation.error!)
            return
        }

        if (!this.isModelLoaded) {
            this.notificationManager.warning('Please load a model first')
            return
        }

        try {
            this.loadingManager.show('Loading environment map...')
            
            const fileReader = new FileReader()
            
            fileReader.onload = async () => {
                try {
                    await this.sceneManager.loadEnvironmentMap(fileReader.result as string)
                    this.controlsManager.updateDisplay()
                    this.notificationManager.success(`Environment map "${file.name}" loaded successfully`)
                } catch (error) {
                    console.error('Error loading environment map:', error)
                    this.notificationManager.error('Failed to load environment map')
                } finally {
                    this.loadingManager.hide()
                }
            }

            fileReader.onerror = () => {
                this.notificationManager.error('Failed to read environment file')
                this.loadingManager.hide()
            }

            fileReader.readAsDataURL(file)
            
        } catch (error) {
            console.error('Error reading environment file:', error)
            this.notificationManager.error('Failed to read environment file')
            this.loadingManager.hide()
        }
    }

    private showViewer(): void {
        this.welcomeScreen.style.display = 'none'
        this.viewerContainer.style.display = 'block'
        this.controlsPanel.style.display = 'block'
        
        // Trigger resize to ensure proper canvas sizing
        setTimeout(() => {
            window.dispatchEvent(new Event('resize'))
        }, 100)
    }

    private resetView(): void {
        this.sceneManager.resetView()
        this.notificationManager.info('View reset')
    }

    private handleResize(): void {
        // Handle window resize - the Conway viewer should handle this automatically
        // but we can add any additional resize logic here
    }

    private toggleFullscreen(): void {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(() => {
                this.notificationManager.error('Failed to enter fullscreen mode')
            })
        } else {
            document.exitFullscreen().catch(() => {
                this.notificationManager.error('Failed to exit fullscreen mode')
            })
        }
    }

    // Public API methods
    public async loadModelFromUrl(url: string): Promise<void> {
        try {
            this.loadingManager.show('Downloading model...')
            
            const response = await fetch(url)
            if (!response.ok) {
                throw new Error(`Failed to download model: ${response.statusText}`)
            }
            
            const buffer = await response.arrayBuffer()
            const filename = url.split('/').pop() || 'model'
            
            this.performanceMonitor.startTiming()
            await this.sceneManager.loadModel(buffer)
            this.performanceMonitor.endTiming(filename, buffer.byteLength)
            
            this.isModelLoaded = true
            this.showViewer()
            
            this.notificationManager.success(`Model loaded from URL: ${filename}`)
            
        } catch (error) {
            console.error('Error loading model from URL:', error)
            this.notificationManager.error('Failed to load model from URL')
        } finally {
            this.loadingManager.hide()
        }
    }

    public exportPerformanceMetrics(): void {
        this.performanceMonitor.exportMetrics()
    }

    public getLoadedModelInfo(): { isLoaded: boolean; metrics?: any } {
        return {
            isLoaded: this.isModelLoaded,
            metrics: this.isModelLoaded ? this.performanceMonitor.getMetrics() : undefined
        }
    }
}

// Initialize the application when the page loads
window.addEventListener('load', () => {
    const viewer = new ModernIFCViewer()
    
    // Expose viewer to global scope for debugging
    ;(window as any).ifcViewer = viewer
    
    console.log('Modern IFC Viewer initialized successfully')
})

// Handle unhandled errors
window.addEventListener('error', (event) => {
    console.error('Unhandled error:', event.error)
    NotificationManager.getInstance().error('An unexpected error occurred')
})

window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason)
    NotificationManager.getInstance().error('An unexpected error occurred')
})