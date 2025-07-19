/**
 * Validation utilities for canvas nodes and data structures
 * 
 * This module provides validation functions to ensure data integrity
 * and compliance with Obsidian Canvas format specifications.
 */

import { CanvasNode, CanvasFileNode, CanvasTextNode, CardData } from '../types/interfaces';
import { VALIDATION } from '../types/constants';

/**
 * Validates a canvas node structure
 * 
 * @param node - Canvas node to validate
 * @returns True if node is valid
 */
export function validateCanvasNode(node: any): node is CanvasNode {
    if (!node || typeof node !== 'object') {
        return false;
    }
    
    // Check required properties
    if (typeof node.id !== 'string' || !node.id.trim()) {
        return false;
    }
    
    if (typeof node.type !== 'string' || !node.type.trim()) {
        return false;
    }
    
    if (typeof node.x !== 'number' || !isFinite(node.x)) {
        return false;
    }
    
    if (typeof node.y !== 'number' || !isFinite(node.y)) {
        return false;
    }
    
    if (typeof node.width !== 'number' || node.width <= 0 || !isFinite(node.width)) {
        return false;
    }
    
    if (typeof node.height !== 'number' || node.height <= 0 || !isFinite(node.height)) {
        return false;
    }
    
    // Type-specific validation
    if (node.type === 'file') {
        return validateCanvasFileNode(node);
    } else if (node.type === 'text') {
        return validateCanvasTextNode(node);
    }
    
    return true;
}

/**
 * Validates a canvas file node
 * 
 * @param node - Canvas file node to validate
 * @returns True if file node is valid
 */
export function validateCanvasFileNode(node: any): node is CanvasFileNode {
    if (!validateCanvasNode(node)) {
        return false;
    }
    
    if (node.type !== 'file') {
        return false;
    }
    
    if (typeof node.file !== 'string' || !node.file.trim()) {
        return false;
    }
    
    return true;
}

/**
 * Validates a canvas text node
 * 
 * @param node - Canvas text node to validate
 * @returns True if text node is valid
 */
export function validateCanvasTextNode(node: any): node is CanvasTextNode {
    if (!validateCanvasNode(node)) {
        return false;
    }
    
    if (node.type !== 'text') {
        return false;
    }
    
    if (typeof node.text !== 'string') {
        return false;
    }
    
    if (node.text.length > VALIDATION.maxContentLength) {
        return false;
    }
    
    return true;
}

/**
 * Validates card data structure
 * 
 * @param cardData - Card data to validate
 * @returns True if card data is valid
 */
export function validateCardData(cardData: any): cardData is CardData {
    if (!cardData || typeof cardData !== 'object') {
        return false;
    }
    
    // Check required properties
    if (typeof cardData.id !== 'string' || !cardData.id.trim()) {
        return false;
    }
    
    if (!['file', 'native'].includes(cardData.type)) {
        return false;
    }
    
    if (typeof cardData.title !== 'string' || !cardData.title.trim()) {
        return false;
    }
    
    if (cardData.title.length > VALIDATION.maxTitleLength) {
        return false;
    }
    
    if (!Array.isArray(cardData.tags)) {
        return false;
    }
    
    if (cardData.tags.length > VALIDATION.maxTagsPerCard) {
        return false;
    }
    
    // Validate tags
    for (const tag of cardData.tags) {
        if (typeof tag !== 'string' || tag.length > VALIDATION.maxTagLength) {
            return false;
        }
    }
    
    if (typeof cardData.lastModified !== 'number' || !isFinite(cardData.lastModified)) {
        return false;
    }
    
    // Type-specific validation
    if (cardData.type === 'file') {
        if (typeof cardData.path !== 'string' || !cardData.path.trim()) {
            return false;
        }
    } else if (cardData.type === 'native') {
        if (typeof cardData.content !== 'string') {
            return false;
        }
        
        if (cardData.content.length > VALIDATION.maxContentLength) {
            return false;
        }
        
        if (typeof cardData.canvasId !== 'string' || !cardData.canvasId.trim()) {
            return false;
        }
    }
    
    return true;
}

/**
 * Validates a file path
 * 
 * @param path - File path to validate
 * @returns True if path is valid
 */
export function validateFilePath(path: string): boolean {
    if (typeof path !== 'string' || !path.trim()) {
        return false;
    }
    
    // Check for invalid characters
    const invalidChars = /[<>:"|?*]/;
    if (invalidChars.test(path)) {
        return false;
    }
    
    // Check for relative path traversal
    if (path.includes('..')) {
        return false;
    }
    
    return true;
}

/**
 * Validates a search query
 * 
 * @param query - Search query to validate
 * @returns True if query is valid
 */
export function validateSearchQuery(query: string): boolean {
    if (typeof query !== 'string') {
        return false;
    }
    
    if (query.length < VALIDATION.minSearchQueryLength) {
        return false;
    }
    
    if (query.length > VALIDATION.maxSearchQueryLength) {
        return false;
    }
    
    return true;
}

/**
 * Validates coordinates
 * 
 * @param x - X coordinate
 * @param y - Y coordinate
 * @returns True if coordinates are valid
 */
export function validateCoordinates(x: number, y: number): boolean {
    return typeof x === 'number' && 
           typeof y === 'number' && 
           isFinite(x) && 
           isFinite(y);
}

/**
 * Validates dimensions
 * 
 * @param width - Width value
 * @param height - Height value
 * @returns True if dimensions are valid
 */
export function validateDimensions(width: number, height: number): boolean {
    return typeof width === 'number' && 
           typeof height === 'number' && 
           width > 0 && 
           height > 0 && 
           isFinite(width) && 
           isFinite(height);
}

/**
 * Sanitizes a string for safe use
 * 
 * @param input - Input string to sanitize
 * @param maxLength - Maximum allowed length
 * @returns Sanitized string
 */
export function sanitizeString(input: string, maxLength: number = 1000): string {
    if (typeof input !== 'string') {
        return '';
    }
    
    // Remove potentially dangerous characters
    let sanitized = input.replace(/[<>]/g, '');
    
    // Trim whitespace
    sanitized = sanitized.trim();
    
    // Limit length
    if (sanitized.length > maxLength) {
        sanitized = sanitized.substring(0, maxLength);
    }
    
    return sanitized;
}

/**
 * Validates a tag string
 * 
 * @param tag - Tag to validate
 * @returns True if tag is valid
 */
export function validateTag(tag: string): boolean {
    if (typeof tag !== 'string' || !tag.trim()) {
        return false;
    }
    
    if (tag.length > VALIDATION.maxTagLength) {
        return false;
    }
    
    // Tags should not contain special characters
    const invalidChars = /[<>:"|?*\s]/;
    if (invalidChars.test(tag)) {
        return false;
    }
    
    return true;
}
