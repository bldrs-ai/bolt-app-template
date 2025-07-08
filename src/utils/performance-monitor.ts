export interface PerformanceMetrics {
    loadTime: number
    fileSize: number
    fileName: string
    timestamp: Date
}

export class PerformanceMonitor {
    private static instance: PerformanceMonitor
    private metrics: PerformanceMetrics[] = []
    private startTime: number = 0

    private constructor() {}

    static getInstance(): PerformanceMonitor {
        if (!PerformanceMonitor.instance) {
            PerformanceMonitor.instance = new PerformanceMonitor()
        }
        return PerformanceMonitor.instance
    }

    startTiming(): void {
        this.startTime = performance.now()
    }

    endTiming(fileName: string, fileSize: number): PerformanceMetrics {
        const loadTime = performance.now() - this.startTime
        
        const metric: PerformanceMetrics = {
            loadTime,
            fileSize,
            fileName,
            timestamp: new Date()
        }

        this.metrics.push(metric)
        
        // Keep only last 10 metrics
        if (this.metrics.length > 10) {
            this.metrics = this.metrics.slice(-10)
        }

        console.log(`Performance: ${fileName} loaded in ${loadTime.toFixed(2)}ms`)
        return metric
    }

    getMetrics(): PerformanceMetrics[] {
        return [...this.metrics]
    }

    getAverageLoadTime(): number {
        if (this.metrics.length === 0) return 0
        
        const total = this.metrics.reduce((sum, metric) => sum + metric.loadTime, 0)
        return total / this.metrics.length
    }

    exportMetrics(): void {
        const data = {
            metrics: this.metrics,
            averageLoadTime: this.getAverageLoadTime(),
            exportedAt: new Date().toISOString()
        }

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'performance-metrics.json'
        a.click()
        URL.revokeObjectURL(url)
    }
}