# Car Model Directory

Place your car 3D model in this directory.

The playground will automatically load it if available, otherwise it will use a placeholder car.

## Supported Formats (in order of preference):
1. `obocar.glb` - Binary GLTF (recommended, single file)
2. `obocar.gltf` - GLTF with external assets

## Converting FBX to GLB:
If you have an FBX file, convert it using:
- **Blender**: File → Import → FBX, then File → Export → glTF 2.0 (.glb)
- **Online**: Upload to [gltf.report](https://gltf.report/) or similar converters

## Model Guidelines:
- Dimensions: Approximately 4 x 1.5 x 6 units (width x height x depth)
- Forward direction: +Z axis
- Center pivot at base of car
- Include wheels as separate meshes (optional)
