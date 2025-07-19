/**
 * Coordinate conversion and calculation utilities
 * 
 * This module provides functions for converting between different coordinate systems,
 * calculating positions, and handling spatial operations for canvas elements.
 */

import { Coordinates, Bounds } from '../types/interfaces';

/**
 * Converts screen coordinates to canvas coordinates
 * Extracted from main.ts drag-drop functionality
 *
 * @param screenX - Screen X coordinate (event.clientX)
 * @param screenY - Screen Y coordinate (event.clientY)
 * @param canvasElement - The canvas DOM element
 * @returns Canvas coordinates
 */
export function screenToCanvasCoordinates(
    screenX: number,
    screenY: number,
    canvasElement: HTMLElement
): Coordinates {
    const rect = canvasElement.getBoundingClientRect();
    return {
        x: screenX - rect.left,
        y: screenY - rect.top
    };
}

/**
 * Converts drag event to canvas coordinates
 * This is the specific implementation used in main.ts
 *
 * @param event - Drag event
 * @param canvasWrapperEl - Canvas wrapper element
 * @returns Canvas coordinates
 */
export function dragEventToCanvasCoordinates(
    event: DragEvent,
    canvasWrapperEl: HTMLElement
): Coordinates {
    const rect = canvasWrapperEl.getBoundingClientRect();
    return {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
    };
}

/**
 * Converts canvas coordinates to screen coordinates
 * 
 * @param canvasX - Canvas X coordinate
 * @param canvasY - Canvas Y coordinate
 * @param canvasElement - The canvas DOM element
 * @returns Screen coordinates
 */
export function canvasToScreenCoordinates(
    canvasX: number, 
    canvasY: number, 
    canvasElement: HTMLElement
): Coordinates {
    const rect = canvasElement.getBoundingClientRect();
    return {
        x: canvasX + rect.left,
        y: canvasY + rect.top
    };
}

/**
 * Calculates the distance between two points
 * 
 * @param point1 - First point
 * @param point2 - Second point
 * @returns Distance between the points
 */
export function calculateDistance(point1: Coordinates, point2: Coordinates): number {
    const dx = point2.x - point1.x;
    const dy = point2.y - point1.y;
    return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Calculates the center point of a rectangle
 * 
 * @param bounds - Rectangle bounds
 * @returns Center coordinates
 */
export function calculateCenter(bounds: Bounds): Coordinates {
    return {
        x: bounds.x + bounds.width / 2,
        y: bounds.y + bounds.height / 2
    };
}

/**
 * Checks if a point is within a rectangle
 * 
 * @param point - Point to check
 * @param bounds - Rectangle bounds
 * @returns True if point is within bounds
 */
export function isPointInBounds(point: Coordinates, bounds: Bounds): boolean {
    return point.x >= bounds.x && 
           point.x <= bounds.x + bounds.width &&
           point.y >= bounds.y && 
           point.y <= bounds.y + bounds.height;
}

/**
 * Snaps coordinates to a grid
 * 
 * @param coordinates - Original coordinates
 * @param gridSize - Size of the grid
 * @returns Snapped coordinates
 */
export function snapToGrid(coordinates: Coordinates, gridSize: number): Coordinates {
    return {
        x: Math.round(coordinates.x / gridSize) * gridSize,
        y: Math.round(coordinates.y / gridSize) * gridSize
    };
}

/**
 * Constrains coordinates within bounds
 * 
 * @param coordinates - Original coordinates
 * @param bounds - Constraining bounds
 * @returns Constrained coordinates
 */
export function constrainToBounds(coordinates: Coordinates, bounds: Bounds): Coordinates {
    return {
        x: Math.max(bounds.x, Math.min(bounds.x + bounds.width, coordinates.x)),
        y: Math.max(bounds.y, Math.min(bounds.y + bounds.height, coordinates.y))
    };
}

/**
 * Calculates the bounding box for a set of coordinates
 * 
 * @param points - Array of coordinates
 * @returns Bounding box
 */
export function calculateBoundingBox(points: Coordinates[]): Bounds {
    if (points.length === 0) {
        return { x: 0, y: 0, width: 0, height: 0 };
    }
    
    let minX = points[0].x;
    let minY = points[0].y;
    let maxX = points[0].x;
    let maxY = points[0].y;
    
    for (const point of points) {
        minX = Math.min(minX, point.x);
        minY = Math.min(minY, point.y);
        maxX = Math.max(maxX, point.x);
        maxY = Math.max(maxY, point.y);
    }
    
    return {
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY
    };
}

/**
 * Interpolates between two coordinates
 * 
 * @param start - Starting coordinates
 * @param end - Ending coordinates
 * @param t - Interpolation factor (0-1)
 * @returns Interpolated coordinates
 */
export function interpolateCoordinates(
    start: Coordinates, 
    end: Coordinates, 
    t: number
): Coordinates {
    return {
        x: start.x + (end.x - start.x) * t,
        y: start.y + (end.y - start.y) * t
    };
}

/**
 * Rotates a point around a center point
 * 
 * @param point - Point to rotate
 * @param center - Center of rotation
 * @param angle - Rotation angle in radians
 * @returns Rotated coordinates
 */
export function rotatePoint(
    point: Coordinates, 
    center: Coordinates, 
    angle: number
): Coordinates {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const dx = point.x - center.x;
    const dy = point.y - center.y;
    
    return {
        x: center.x + dx * cos - dy * sin,
        y: center.y + dx * sin + dy * cos
    };
}
