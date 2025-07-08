export class LoadingManager {
    private overlay: HTMLElement
    private loadingText: HTMLElement
    private progressBar: HTMLElement | null = null
    private isVisible = false

    constructor() {
        this.overlay = document.getElementById('loadingOverlay')!
        this.loadingText = this.overlay.querySelector('.loading-text')!
        this.setupProgressBar()
    }

    private setupProgressBar(): void {
        const loadingContent = this.overlay.querySelector('.loading-content')!
        
        this.progressBar = document.createElement('div')
        this.progressBar.className = 'progress-bar'
        Object.assign(this.progressBar.style, {
            width: '200px',
            height: '4px',
            background: 'rgba(255, 255, 255, 0.2)',
            borderRadius: '2px',
            margin: '16px auto 0',
            overflow: 'hidden'
        })

        const progressFill = document.createElement('div')
        progressFill.className = 'progress-fill'
        Object.assign(progressFill.style, {
            width: '0%',
            height: '100%',
            background: 'white',
            borderRadius: '2px',
            transition: 'width 0.3s ease'
        })

        this.progressBar.appendChild(progressFill)
        loadingContent.appendChild(this.progressBar)
    }

    show(message: string = 'Loading...'): void {
        this.loadingText.textContent = message
        this.overlay.style.display = 'flex'
        this.isVisible = true
        this.setProgress(0)
    }

    hide(): void {
        this.overlay.style.display = 'none'
        this.isVisible = false
    }

    updateMessage(message: string): void {
        if (this.isVisible) {
            this.loadingText.textContent = message
        }
    }

    setProgress(percentage: number): void {
        if (this.progressBar && this.isVisible) {
            const fill = this.progressBar.querySelector('.progress-fill') as HTMLElement
            fill.style.width = `${Math.max(0, Math.min(100, percentage))}%`
        }
    }

    simulateProgress(duration: number = 2000): void {
        if (!this.isVisible) return

        let progress = 0
        const increment = 100 / (duration / 50)
        
        const interval = setInterval(() => {
            progress += increment
            if (progress >= 100) {
                this.setProgress(100)
                clearInterval(interval)
            } else {
                this.setProgress(progress)
            }
        }, 50)
    }
}