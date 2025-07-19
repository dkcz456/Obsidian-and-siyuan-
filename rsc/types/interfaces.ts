/**
 * Type definitions and interfaces for the Visual Knowledge Workbench Plugin
 * 
 * This module contains all the core interfaces and type definitions used
 * throughout the plugin for type safety and consistency.
 */

import { TFile } from 'obsidian';

// =======================================================
// ==                 Core Interfaces                  ==
// =======================================================

/**
 * Base interface for card data representation
 */
export interface CardData {
    id: string;
    type: 'file' | 'native';
    title: string;
    path?: string; // File card path
    content?: string; // Native card content
    tags: string[];
    lastModified: number;
    canvasId?: string; // Canvas ID for native cards
}

/**
 * Extended interface for file-based cards
 */
export interface FileCard extends CardData {
    type: 'file';
    path: string;
    file: TFile;
}

/**
 * Extended interface for native canvas cards
 */
export interface NativeCard extends CardData {
    type: 'native';
    content: string;
    canvasId: string;
}

/**
 * Filter state for card library views
 */
export interface FilterState {
    mode: 'global' | 'canvas';
    selectedCanvas?: string;
    selectedTags: string[];
    searchQuery: string;
    sortBy: 'title' | 'modified' | 'created';
    sortOrder: 'asc' | 'desc';
}

/**
 * Plugin settings configuration
 */
export interface PluginSettings {
    cardLibraryPosition: 'left' | 'right';
    defaultSortBy: 'title' | 'modified' | 'created';
    showFileExtensions: boolean;
    maxCardsPerView: number;
    enableVirtualScrolling: boolean;
    autoSaveInterval: number;
}

// =======================================================
// ==              Canvas-Related Types                ==
// =======================================================

/**
 * Canvas node base interface
 */
export interface CanvasNode {
    id: string;
    type: string;
    x: number;
    y: number;
    width: number;
    height: number;
}

/**
 * File-based canvas node
 */
export interface CanvasFileNode extends CanvasNode {
    type: 'file';
    file: string;
}

/**
 * Text-based canvas node
 */
export interface CanvasTextNode extends CanvasNode {
    type: 'text';
    text: string;
}

/**
 * Canvas data structure
 */
export interface CanvasData {
    nodes: CanvasNode[];
    edges: any[]; // Canvas edge structure
}

// =======================================================
// ==              Coordinate Types                    ==
// =======================================================

/**
 * 2D coordinate representation
 */
export interface Coordinates {
    x: number;
    y: number;
}

/**
 * Rectangle bounds
 */
export interface Bounds {
    x: number;
    y: number;
    width: number;
    height: number;
}

// =======================================================
// ==              Event Types                         ==
// =======================================================

/**
 * Drag and drop event data
 */
export interface DragDropEventData {
    cardData: CardData;
    sourceElement: HTMLElement;
    targetCanvas?: string;
    coordinates: Coordinates;
}

/**
 * Card selection event data
 */
export interface CardSelectionEventData {
    cardId: string;
    cardData: CardData;
    isSelected: boolean;
}

// =======================================================
// ==              Layout Types                        ==
// =======================================================

/**
 * Layout calculation options
 */
export interface LayoutOptions {
    spacing: number;
    alignment: 'left' | 'center' | 'right';
    distribution: 'even' | 'compact';
}

/**
 * Node positioning data
 */
export interface NodePosition {
    nodeId: string;
    x: number;
    y: number;
    width: number;
    height: number;
}
