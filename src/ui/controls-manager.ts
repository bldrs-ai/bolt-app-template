import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js'
import { ShadowQuality } from '@bldrs-ai/conway/compiled/src/rendering/threejs/simple_viewer_scene.js'
import { versionString } from '@bldrs-ai/conway/compiled/src'
import { ViewerScene } from '../viewer/scene-manager'

export class ControlsManager {
    private gui: GUI | null = null
    private scene: ViewerScene | null = null
    private isCollapsed = false

    constructor(private container: HTMLElement) {}

    initialize(scene: ViewerScene): void {
        this.scene = scene
        this.setupGUI()
    }

    private setupGUI(): void {
        if (!this.scene) return

        // Clear existing GUI
        if (this.gui) {
            this.gui.destroy()
        }

        // Create GUI container
        const guiContainer = document.createElement('div')
        this.container.appendChild(guiContainer)

        this.gui = new GUI({ container: guiContainer })

        // Add version info
        const versionInfo = { version: versionString.substring(versionString.indexOf('v')) }
        const versionController = this.gui.add(versionInfo, 'version').name('Conway Version').disable()
        this.styleVersionController(versionController)

        // Add rendering controls
        const renderingFolder = this.gui.addFolder('Rendering')
        renderingFolder.add(this.scene, 'ambientOcclusion').name('Ambient Occlusion')
        renderingFolder.add(this.scene, 'hasAmbientLight').name('Ambient Light')
        renderingFolder.add(this.scene, 'shadowsEnabled').name('Shadows')
        renderingFolder.add(this.scene, 'shadowQuality', {
            Low: ShadowQuality.LOW,
            Medium: ShadowQuality.MEDIUM,
            High: ShadowQuality.HIGH
        }).name('Shadow Quality')

        // Add action buttons
        const actionsFolder = this.gui.addFolder('Actions')
        const actions = {
            loadModel: () => this.triggerFileInput('loadModel'),
            loadEnvironment: () => this.triggerFileInput('loadEnvironmentMap'),
            resetView: () => this.resetView(),
            exportSettings: () => this.exportSettings(),
            importSettings: () => this.importSettings()
        }

        actionsFolder.add(actions, 'loadModel').name('📁 Load Model')
        actionsFolder.add(actions, 'loadEnvironment').name('🌅 Load Environment')
        actionsFolder.add(actions, 'resetView').name('🔄 Reset View')
        actionsFolder.add(actions, 'exportSettings').name('💾 Export Settings')
        actionsFolder.add(actions, 'importSettings').name('📂 Import Settings')

        // Open folders by default
        renderingFolder.open()
        actionsFolder.open()
    }

    private styleVersionController(controller: any): void {
        controller.domElement.classList.remove('disabled')
        controller.domElement.style.color = '#667eea'
        controller.$input.style.color = '#667eea'
        controller.$input.style.fontWeight = '600'
    }

    private triggerFileInput(inputId: string): void {
        const input = document.getElementById(inputId) as HTMLInputElement
        if (input) {
            input.click()
        }
    }

    private resetView(): void {
        // Implement view reset logic
        console.log('Resetting view...')
    }

    private exportSettings(): void {
        if (!this.scene) return

        const settings = {
            ambientOcclusion: this.scene.ambientOcclusion,
            hasAmbientLight: this.scene.hasAmbientLight,
            shadowsEnabled: this.scene.shadowsEnabled,
            shadowQuality: this.scene.shadowQuality,
            exportedAt: new Date().toISOString()
        }

        const blob = new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'viewer-settings.json'
        a.click()
        URL.revokeObjectURL(url)
    }

    private importSettings(): void {
        const input = document.createElement('input')
        input.type = 'file'
        input.accept = '.json'
        input.onchange = (e) => {
            const file = (e.target as HTMLInputElement).files?.[0]
            if (file) {
                const reader = new FileReader()
                reader.onload = (e) => {
                    try {
                        const settings = JSON.parse(e.target?.result as string)
                        this.applySettings(settings)
                    } catch (error) {
                        console.error('Failed to import settings:', error)
                    }
                }
                reader.readAsText(file)
            }
        }
        input.click()
    }

    private applySettings(settings: any): void {
        if (!this.scene) return

        if (typeof settings.ambientOcclusion === 'boolean') {
            this.scene.ambientOcclusion = settings.ambientOcclusion
        }
        if (typeof settings.hasAmbientLight === 'boolean') {
            this.scene.hasAmbientLight = settings.hasAmbientLight
        }
        if (typeof settings.shadowsEnabled === 'boolean') {
            this.scene.shadowsEnabled = settings.shadowsEnabled
        }
        if (typeof settings.shadowQuality === 'number') {
            this.scene.shadowQuality = settings.shadowQuality
        }

        this.updateDisplay()
    }

    updateDisplay(): void {
        if (this.gui) {
            this.gui.controllersRecursive().forEach(controller => {
                controller.updateDisplay()
            })
        }
    }

    toggle(): void {
        const content = this.container
        const toggleBtn = document.getElementById('toggleControls')!
        
        this.isCollapsed = !this.isCollapsed

        if (this.isCollapsed) {
            content.style.display = 'none'
            toggleBtn.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <polyline points="6,9 12,15 18,9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
            `
        } else {
            content.style.display = 'block'
            toggleBtn.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <polyline points="18,15 12,9 6,15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
            `
        }
    }

    destroy(): void {
        if (this.gui) {
            this.gui.destroy()
            this.gui = null
        }
    }
}