export interface FileValidationResult {
    isValid: boolean
    error?: string
    fileType?: string
}

export class FileValidator {
    private static readonly MODEL_EXTENSIONS = ['.ifc', '.step', '.stp', '.gltf', '.glb', '.obj']
    private static readonly HDR_EXTENSIONS = ['.hdr']
    private static readonly MAX_FILE_SIZE = 500 * 1024 * 1024 // 500MB

    static validateModelFile(file: File): FileValidationResult {
        return this.validateFile(file, this.MODEL_EXTENSIONS, 'model')
    }

    static validateHDRFile(file: File): FileValidationResult {
        return this.validateFile(file, this.HDR_EXTENSIONS, 'HDR environment map')
    }

    private static validateFile(file: File, allowedExtensions: string[], fileType: string): FileValidationResult {
        // Check file size
        if (file.size > this.MAX_FILE_SIZE) {
            return {
                isValid: false,
                error: `File size exceeds maximum limit of ${this.MAX_FILE_SIZE / (1024 * 1024)}MB`
            }
        }

        // Check file extension
        const fileName = file.name.toLowerCase()
        const hasValidExtension = allowedExtensions.some(ext => fileName.endsWith(ext))

        if (!hasValidExtension) {
            return {
                isValid: false,
                error: `Invalid file type. Expected ${fileType} file with extensions: ${allowedExtensions.join(', ')}`
            }
        }

        // Determine file type
        const extension = allowedExtensions.find(ext => fileName.endsWith(ext))
        
        return {
            isValid: true,
            fileType: extension?.substring(1).toUpperCase()
        }
    }

    static getModelType(filename: string): 'ifc' | 'step' | 'gltf' | 'obj' | 'unknown' {
        const extension = this.getFileExtension(filename)
        
        switch (extension) {
            case 'ifc':
                return 'ifc'
            case 'step':
            case 'stp':
                return 'step'
            case 'gltf':
            case 'glb':
                return 'gltf'
            case 'obj':
                return 'obj'
            default:
                return 'unknown'
        }
    }

    static getFileExtension(filename: string): string {
        return filename.toLowerCase().split('.').pop() || ''
    }

    static formatFileSize(bytes: number): string {
        if (bytes === 0) return '0 Bytes'
        
        const k = 1024
        const sizes = ['Bytes', 'KB', 'MB', 'GB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    }
}