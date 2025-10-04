interface Window {
  terminalOutput?: (message: string, type?: 'info' | 'error' | 'warning' | 'success') => void;
  loadPyodide?: () => Promise<any>;
  carControlAPI?: any;
  oboCarAPI?: any;
  pyodideInstance?: any;
}

// WebGPU Type Declarations
interface Navigator {
  gpu?: GPU;
}

interface GPU {
  requestAdapter(options?: GPURequestAdapterOptions): Promise<GPUAdapter | null>;
}

interface GPURequestAdapterOptions {
  powerPreference?: 'low-power' | 'high-performance';
  forceFallbackAdapter?: boolean;
}

interface GPUAdapter {
  features: GPUSupportedFeatures;
  limits: GPUSupportedLimits;
  isFallbackAdapter: boolean;
  requestDevice(descriptor?: GPUDeviceDescriptor): Promise<GPUDevice>;
}

interface GPUSupportedFeatures extends Set<string> {}

interface GPUSupportedLimits {
  [key: string]: number;
}

interface GPUDeviceDescriptor {
  requiredFeatures?: Iterable<string>;
  requiredLimits?: Record<string, number>;
  label?: string;
}

interface GPUDevice {
  features: GPUSupportedFeatures;
  limits: GPUSupportedLimits;
  queue: GPUQueue;
  destroy(): void;
  createBuffer(descriptor: any): any;
  createTexture(descriptor: any): any;
  createSampler(descriptor?: any): any;
  createBindGroup(descriptor: any): any;
  createBindGroupLayout(descriptor: any): any;
  createPipelineLayout(descriptor: any): any;
  createRenderPipeline(descriptor: any): any;
  createComputePipeline(descriptor: any): any;
  createCommandEncoder(descriptor?: any): any;
  createShaderModule(descriptor: any): any;
  createRenderBundleEncoder(descriptor: any): any;
  createQuerySet(descriptor: any): any;
}

interface GPUQueue {
  submit(commandBuffers: any[]): void;
  writeBuffer(buffer: any, bufferOffset: number, data: any, dataOffset?: number, size?: number): void;
  writeTexture(destination: any, data: any, dataLayout: any, size: any): void;
}