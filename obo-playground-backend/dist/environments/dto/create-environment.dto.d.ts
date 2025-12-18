export declare class CreateEnvironmentDto {
    environment_name: string;
    environment_code: string;
    description?: string;
    thumbnail?: string;
    environment_path: string;
    scene_config?: {
        modelUrl?: string;
        groundTexture?: string;
        groundColor?: string;
        obstacles?: Array<{
            type: 'box' | 'sphere' | 'cylinder' | 'wall';
            position: [number, number, number];
            size: [number, number, number];
            color?: string;
            rotation?: [number, number, number];
        }>;
        lighting?: {
            ambient?: string;
            directional?: {
                direction: [number, number, number];
                intensity: number;
            };
        };
        camera?: {
            alpha?: number;
            beta?: number;
            radius?: number;
            target?: [number, number, number];
        };
    };
    difficulty?: string;
    tags?: string[];
    is_active?: boolean;
}
