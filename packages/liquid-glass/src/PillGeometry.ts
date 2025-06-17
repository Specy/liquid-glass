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
        const y = -shapeHeight / 2;        // Create rounded rectangle shape with proper segment subdivision
        // Start from bottom-left corner and go clockwise
        shape.moveTo(x + clampedRadius, y);
        
        // Bottom edge
        shape.lineTo(x + shapeWidth - clampedRadius, y);
        
        // Bottom-right corner (90-degree arc)
        PillGeometry.addRoundedCorner(shape, 
            x + shapeWidth - clampedRadius, y + clampedRadius, // center
            clampedRadius, 
            -Math.PI / 2, 0, // from -90° to 0°
            segments
        );
        
        // Right edge
        shape.lineTo(x + shapeWidth, y + shapeHeight - clampedRadius);
        
        // Top-right corner (90-degree arc)
        PillGeometry.addRoundedCorner(shape,
            x + shapeWidth - clampedRadius, y + shapeHeight - clampedRadius, // center
            clampedRadius,
            0, Math.PI / 2, // from 0° to 90°
            segments
        );
        
        // Top edge
        shape.lineTo(x + clampedRadius, y + shapeHeight);
        
        // Top-left corner (90-degree arc)
        PillGeometry.addRoundedCorner(shape,
            x + clampedRadius, y + shapeHeight - clampedRadius, // center
            clampedRadius,
            Math.PI / 2, Math.PI, // from 90° to 180°
            segments
        );
        
        // Left edge
        shape.lineTo(x, y + clampedRadius);
        
        // Bottom-left corner (90-degree arc)
        PillGeometry.addRoundedCorner(shape,
            x + clampedRadius, y + clampedRadius, // center
            clampedRadius,
            Math.PI, 3 * Math.PI / 2, // from 180° to 270°
            segments
        );

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

    /**
     * Helper method to add a smooth rounded corner to a shape
     * @param shape - The Three.js Shape to add the corner to
     * @param centerX - X coordinate of the corner's center
     * @param centerY - Y coordinate of the corner's center
     * @param radius - Radius of the corner
     * @param startAngle - Starting angle in radians
     * @param endAngle - Ending angle in radians
     * @param segments - Number of segments to subdivide the arc
     */
    private static addRoundedCorner(
        shape: Shape,
        centerX: number,
        centerY: number,
        radius: number,
        startAngle: number,
        endAngle: number,
        segments: number
    ): void {
        // Ensure we have at least 2 segments for a smooth corner
        const cornerSegments = Math.max(2, Math.floor(segments / 4));
        const angleStep = (endAngle - startAngle) / cornerSegments;
        
        for (let i = 1; i <= cornerSegments; i++) {
            const angle = startAngle + (angleStep * i);
            const x = centerX + Math.cos(angle) * radius;
            const y = centerY + Math.sin(angle) * radius;
            shape.lineTo(x, y);
        }
    }
}