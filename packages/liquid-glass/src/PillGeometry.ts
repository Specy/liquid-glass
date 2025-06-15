import {ExtrudeGeometry, Shape, type ExtrudeGeometryOptions} from 'three';

export class PillGeometry extends ExtrudeGeometry {
    /**
     * Creates an instance of PillGeometry.
     * @param {number} [width=1] - The width of the box.
     * @param {number} [height=1] - The height of the box.
     * @param {number} [depth=1] - The total depth (thickness) of the box.
     * @param {number} [segments=16] - The number of segments used to create the rounded edges.
     * @param {number} [radius=0.1] - The radius of the corners and edges.
     */
    constructor(
        width: number = 1,
        height: number = 1,
        depth: number = 0.5,
        segments: number = 16,
        radius: number = 0.1
    ) {
        // Clamp the radius to be no more than half the smallest dimension.
        const clampedRadius = Math.min(radius, width / 2, height / 2, depth / 2);

        // The depth of the central flat part of the box.
        const extrudeDepth = depth - 2 * clampedRadius;

        // Create the 2D shape (a rounded rectangle) for the extrusion.
        // IMPORTANT: Account for bevel size in the shape dimensions
        const shapeWidth = width - 2 * clampedRadius;
        const shapeHeight = height - 2 * clampedRadius;
        
        const shape = new Shape();
        const x = -shapeWidth / 2;
        const y = -shapeHeight / 2;

        // Create rounded rectangle shape
        shape.moveTo(x + clampedRadius, y);
        shape.lineTo(x + shapeWidth - clampedRadius, y);
        shape.quadraticCurveTo(x + shapeWidth, y, x + shapeWidth, y + clampedRadius);
        shape.lineTo(x + shapeWidth, y + shapeHeight - clampedRadius);
        shape.quadraticCurveTo(x + shapeWidth, y + shapeHeight, x + shapeWidth - clampedRadius, y + shapeHeight);
        shape.lineTo(x + clampedRadius, y + shapeHeight);
        shape.quadraticCurveTo(x, y + shapeHeight, x, y + shapeHeight - clampedRadius);
        shape.lineTo(x, y + clampedRadius);
        shape.quadraticCurveTo(x, y, x + clampedRadius, y);

        // Define the extrusion settings
        const extrudeSettings: ExtrudeGeometryOptions = {
            depth: extrudeDepth,
            bevelEnabled: true,
            bevelThickness: clampedRadius,
            bevelSize: clampedRadius,
            bevelOffset: 0,
            bevelSegments: segments
        };
        
        // Call the parent constructor
        super(shape, extrudeSettings);

        // DON'T call this.center() - we want the geometry positioned correctly
        // this.center();
        
        // Instead, manually translate to ensure proper bounds
        this.center();
    }
}