/**
 * WebGPU Detection and Utility Functions
 * Provides helper functions to detect and configure WebGPU support
 */

export interface WebGPUInfo {
  isAvailable: boolean
  adapter?: GPUAdapter
  device?: GPUDevice
  features: string[]
  limits: Record<string, number>
  errorMessage?: string
}

/**
 * Detect WebGPU availability and capabilities
 */
export async function detectWebGPU(): Promise<WebGPUInfo> {
  const info: WebGPUInfo = {
    isAvailable: false,
    features: [],
    limits: {},
  }

  try {
    // Check if WebGPU API exists
    if (!navigator.gpu) {
      info.errorMessage = 'WebGPU API not available in this browser'
      return info
    }

    // Try to get GPU adapter
    const adapter = await navigator.gpu.requestAdapter({
      powerPreference: 'high-performance',
    })

    if (!adapter) {
      info.errorMessage = 'No WebGPU adapter found'
      return info
    }

    info.adapter = adapter
    info.isAvailable = true

    // Get features
    adapter.features.forEach((feature) => {
      info.features.push(feature)
    })

    // Get limits
    Object.entries(adapter.limits).forEach(([key, value]) => {
      info.limits[key] = value as number
    })

    // Try to get device
    try {
      const device = await adapter.requestDevice()
      info.device = device
      console.log('✅ WebGPU device acquired successfully')
      console.log('📊 WebGPU Features:', info.features)
      console.log('📈 WebGPU Limits:', info.limits)
    } catch (deviceError) {
      info.errorMessage = 'WebGPU adapter found but device request failed'
      console.warn('⚠️ WebGPU device request failed:', deviceError)
    }
  } catch (error) {
    info.errorMessage = `WebGPU detection error: ${error}`
    console.error('❌ Error detecting WebGPU:', error)
  }

  return info
}

/**
 * Check if WebGPU is supported in the current browser
 */
export function isWebGPUSupported(): boolean {
  return typeof navigator !== 'undefined' && !!navigator.gpu
}

/**
 * Get WebGPU capabilities as a readable string array
 */
export function getWebGPUCapabilities(): string[] {
  const capabilities: string[] = []

  if (typeof navigator !== 'undefined') {
    if (navigator.gpu) {
      capabilities.push('✅ WebGPU API Available')
    } else {
      capabilities.push('❌ WebGPU Not Supported')
      
      // Provide browser-specific guidance
      const userAgent = navigator.userAgent.toLowerCase()
      if (userAgent.includes('chrome') || userAgent.includes('edge')) {
        capabilities.push('💡 Update Chrome/Edge to version 113+')
      } else if (userAgent.includes('firefox')) {
        capabilities.push('💡 Enable dom.webgpu.enabled in about:config')
      } else if (userAgent.includes('safari')) {
        capabilities.push('💡 Safari support coming soon')
      }
    }
  }

  return capabilities
}

/**
 * Log detailed WebGPU information to console
 */
export async function logWebGPUInfo(): Promise<void> {
  console.group('🔍 WebGPU Detection')
  
  const info = await detectWebGPU()
  
  console.log('Available:', info.isAvailable)
  
  if (info.errorMessage) {
    console.warn('Error:', info.errorMessage)
  }
  
  if (info.adapter) {
    console.log('Adapter:', info.adapter)
    console.log('Features:', info.features)
    console.log('Limits:', info.limits)
  }
  
  if (info.device) {
    console.log('Device:', info.device)
  }
  
  const capabilities = getWebGPUCapabilities()
  console.log('Capabilities:', capabilities)
  
  console.groupEnd()
}

/**
 * Get optimal renderer settings based on WebGPU availability
 */
export interface RendererSettings {
  useWebGPU: boolean
  antialias: boolean
  logarithmicDepthBuffer: boolean
  powerPreference: 'low-power' | 'high-performance' | 'default'
  toneMapping: number
  toneMappingExposure: number
}

export async function getOptimalRendererSettings(): Promise<RendererSettings> {
  const webGPUInfo = await detectWebGPU()
  
  return {
    useWebGPU: webGPUInfo.isAvailable,
    antialias: true,
    logarithmicDepthBuffer: !webGPUInfo.isAvailable, // WebGPU handles this differently
    powerPreference: 'high-performance',
    toneMapping: 4, // THREE.ACESFilmicToneMapping
    toneMappingExposure: 1.2,
  }
}
