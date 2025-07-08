export type NotificationType = 'success' | 'error' | 'warning' | 'info'

export interface NotificationOptions {
    duration?: number
    position?: 'top' | 'bottom'
}

export class NotificationManager {
    private static instance: NotificationManager
    private container: HTMLElement

    private constructor() {
        this.container = this.createContainer()
        document.body.appendChild(this.container)
    }

    static getInstance(): NotificationManager {
        if (!NotificationManager.instance) {
            NotificationManager.instance = new NotificationManager()
        }
        return NotificationManager.instance
    }

    private createContainer(): HTMLElement {
        const container = document.createElement('div')
        container.className = 'notification-container'
        Object.assign(container.style, {
            position: 'fixed',
            top: '80px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: '2000',
            pointerEvents: 'none',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            maxWidth: '400px',
            width: '100%'
        })
        return container
    }

    show(message: string, type: NotificationType = 'info', options: NotificationOptions = {}): void {
        const { duration = 3000, position = 'top' } = options
        
        const notification = this.createNotification(message, type)
        this.container.appendChild(notification)

        // Animate in
        requestAnimationFrame(() => {
            notification.style.opacity = '1'
            notification.style.transform = 'translateY(0)'
        })

        // Auto remove
        setTimeout(() => {
            this.removeNotification(notification)
        }, duration)
    }

    private createNotification(message: string, type: NotificationType): HTMLElement {
        const notification = document.createElement('div')
        notification.className = `notification notification-${type}`
        
        const colors = {
            success: '#48bb78',
            error: '#f56565',
            warning: '#ed8936',
            info: '#667eea'
        }

        const icons = {
            success: '✓',
            error: '✕',
            warning: '⚠',
            info: 'ℹ'
        }

        Object.assign(notification.style, {
            padding: '12px 16px',
            borderRadius: '8px',
            color: 'white',
            fontWeight: '500',
            background: colors[type],
            opacity: '0',
            transform: 'translateY(-20px)',
            transition: 'all 0.3s ease',
            pointerEvents: 'auto',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '14px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            cursor: 'pointer'
        })

        notification.innerHTML = `
            <span style="font-size: 16px;">${icons[type]}</span>
            <span>${message}</span>
        `

        // Click to dismiss
        notification.addEventListener('click', () => {
            this.removeNotification(notification)
        })

        return notification
    }

    private removeNotification(notification: HTMLElement): void {
        notification.style.opacity = '0'
        notification.style.transform = 'translateY(-20px)'
        
        setTimeout(() => {
            if (notification.parentNode) {
                this.container.removeChild(notification)
            }
        }, 300)
    }

    success(message: string, options?: NotificationOptions): void {
        this.show(message, 'success', options)
    }

    error(message: string, options?: NotificationOptions): void {
        this.show(message, 'error', options)
    }

    warning(message: string, options?: NotificationOptions): void {
        this.show(message, 'warning', options)
    }

    info(message: string, options?: NotificationOptions): void {
        this.show(message, 'info', options)
    }
}