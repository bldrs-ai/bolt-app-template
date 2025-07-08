import { ModelMetadata } from '../viewer/model-loader'
import { FileValidator } from '../utils/file-validator'

export class MetadataPanel {
    private panel: HTMLElement
    private isVisible = false

    constructor() {
        this.panel = this.createPanel()
        document.body.appendChild(this.panel)
    }

    private createPanel(): HTMLElement {
        const panel = document.createElement('div')
        panel.className = 'metadata-panel'
        panel.innerHTML = `
            <div class="metadata-header">
                <h3>Model Information</h3>
                <button id="closeMetadata" class="close-btn">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                        <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                    </svg>
                </button>
            </div>
            <div class="metadata-content" id="metadataContent">
                <p class="no-data">No model loaded</p>
            </div>
        `

        // Add event listener for close button
        panel.querySelector('#closeMetadata')?.addEventListener('click', () => {
            this.hide()
        })

        return panel
    }

    show(metadata: ModelMetadata): void {
        this.updateContent(metadata)
        this.panel.style.display = 'block'
        this.isVisible = true
        
        // Animate in
        requestAnimationFrame(() => {
            this.panel.style.opacity = '1'
            this.panel.style.transform = 'translateX(0)'
        })
    }

    hide(): void {
        this.panel.style.opacity = '0'
        this.panel.style.transform = 'translateX(100%)'
        
        setTimeout(() => {
            this.panel.style.display = 'none'
            this.isVisible = false
        }, 300)
    }

    toggle(metadata?: ModelMetadata): void {
        if (this.isVisible) {
            this.hide()
        } else if (metadata) {
            this.show(metadata)
        }
    }

    private updateContent(metadata: ModelMetadata): void {
        const content = this.panel.querySelector('#metadataContent')!
        
        const sections = [
            this.createFileInfoSection(metadata),
            this.createGeometrySection(metadata),
            this.createMaterialSection(metadata),
            this.createBoundingBoxSection(metadata),
            this.createAnimationSection(metadata),
            this.createCustomPropertiesSection(metadata)
        ].filter(Boolean)

        content.innerHTML = sections.join('')
    }

    private createFileInfoSection(metadata: ModelMetadata): string {
        return `
            <div class="metadata-section">
                <h4>File Information</h4>
                <div class="metadata-grid">
                    <div class="metadata-item">
                        <span class="label">Name:</span>
                        <span class="value">${metadata.fileName}</span>
                    </div>
                    <div class="metadata-item">
                        <span class="label">Size:</span>
                        <span class="value">${FileValidator.formatFileSize(metadata.fileSize)}</span>
                    </div>
                    <div class="metadata-item">
                        <span class="label">Type:</span>
                        <span class="value format-tag">${metadata.fileType}</span>
                    </div>
                </div>
            </div>
        `
    }

    private createGeometrySection(metadata: ModelMetadata): string {
        if (!metadata.vertexCount && !metadata.faceCount) return ''

        return `
            <div class="metadata-section">
                <h4>Geometry</h4>
                <div class="metadata-grid">
                    ${metadata.vertexCount ? `
                        <div class="metadata-item">
                            <span class="label">Vertices:</span>
                            <span class="value">${metadata.vertexCount.toLocaleString()}</span>
                        </div>
                    ` : ''}
                    ${metadata.faceCount ? `
                        <div class="metadata-item">
                            <span class="label">Faces:</span>
                            <span class="value">${Math.floor(metadata.faceCount).toLocaleString()}</span>
                        </div>
                    ` : ''}
                </div>
            </div>
        `
    }

    private createMaterialSection(metadata: ModelMetadata): string {
        if (!metadata.materialCount && !metadata.textureCount) return ''

        return `
            <div class="metadata-section">
                <h4>Materials & Textures</h4>
                <div class="metadata-grid">
                    ${metadata.materialCount ? `
                        <div class="metadata-item">
                            <span class="label">Materials:</span>
                            <span class="value">${metadata.materialCount}</span>
                        </div>
                    ` : ''}
                    ${metadata.textureCount ? `
                        <div class="metadata-item">
                            <span class="label">Textures:</span>
                            <span class="value">${metadata.textureCount}</span>
                        </div>
                    ` : ''}
                </div>
            </div>
        `
    }

    private createBoundingBoxSection(metadata: ModelMetadata): string {
        if (!metadata.boundingBox) return ''

        const box = metadata.boundingBox
        const size = box.getSize(new (window as any).THREE.Vector3())
        const center = box.getCenter(new (window as any).THREE.Vector3())

        return `
            <div class="metadata-section">
                <h4>Bounding Box</h4>
                <div class="metadata-grid">
                    <div class="metadata-item">
                        <span class="label">Size:</span>
                        <span class="value">${size.x.toFixed(2)} × ${size.y.toFixed(2)} × ${size.z.toFixed(2)}</span>
                    </div>
                    <div class="metadata-item">
                        <span class="label">Center:</span>
                        <span class="value">${center.x.toFixed(2)}, ${center.y.toFixed(2)}, ${center.z.toFixed(2)}</span>
                    </div>
                </div>
            </div>
        `
    }

    private createAnimationSection(metadata: ModelMetadata): string {
        if (!metadata.animations || metadata.animations.length === 0) return ''

        return `
            <div class="metadata-section">
                <h4>Animations</h4>
                <div class="metadata-grid">
                    <div class="metadata-item">
                        <span class="label">Count:</span>
                        <span class="value">${metadata.animations.length}</span>
                    </div>
                </div>
                <div class="animation-list">
                    ${metadata.animations.map(name => `
                        <div class="animation-item">${name}</div>
                    `).join('')}
                </div>
            </div>
        `
    }

    private createCustomPropertiesSection(metadata: ModelMetadata): string {
        if (!metadata.customProperties || Object.keys(metadata.customProperties).length === 0) return ''

        return `
            <div class="metadata-section">
                <h4>Additional Properties</h4>
                <div class="metadata-grid">
                    ${Object.entries(metadata.customProperties).map(([key, value]) => `
                        <div class="metadata-item">
                            <span class="label">${this.formatPropertyName(key)}:</span>
                            <span class="value">${this.formatPropertyValue(value)}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `
    }

    private formatPropertyName(key: string): string {
        return key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())
    }

    private formatPropertyValue(value: any): string {
        if (typeof value === 'boolean') {
            return value ? 'Yes' : 'No'
        }
        if (typeof value === 'number') {
            return value.toLocaleString()
        }
        return String(value)
    }
}