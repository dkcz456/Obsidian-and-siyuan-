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
 * Updated to match main.ts structure
 */
export interface NativeCard extends CardData {
    type: 'native';
    content: string;
    canvasId: string;
    nodeId: string; // Added from main.ts
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
 * Updated to match main.ts structure exactly
 */
export interface CanvasNode {
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
    type: 'file' | 'text';
    file?: string; // 文件节点路径
    text?: string; // 文本节点内容
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
 * Canvas edge interface
 * Extracted from main.ts
 */
export interface CanvasEdge {
    id: string;
    fromNode: string;
    fromSide: string;
    toNode: string;
    toSide: string;
}

/**
 * Canvas data structure
 * Updated to use proper CanvasEdge type
 */
export interface CanvasData {
    nodes: CanvasNode[];
    edges: CanvasEdge[];
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

// =======================================================
// ==              Layout Algorithm Interfaces         ==
// =======================================================

/**
 * Layout configuration interface
 * Extracted from main.ts
 */
export interface LayoutConfig {
    horizontalSpacing: number;      // 水平间距 (父子节点间)
    verticalSpacing: number;        // 垂直间距 (兄弟节点间)
    symmetryMode: 'vertical' | 'horizontal' | 'radial';
    centerAlignment: boolean;       // 是否以父节点为中心对齐
    maxVerticalSpread: number;      // 最大垂直展开范围
    collisionDetection: boolean;    // 是否启用碰撞检测
    avoidanceMargin: number;        // 避让边距
    defaultNodeWidth: number;       // 默认节点宽度
    defaultNodeHeight: number;      // 默认节点高度
}

/**
 * Child node position interface
 * Extracted from main.ts
 */
export interface ChildNodePosition {
    x: number;
    y: number;
    index: number;          // 在子节点列表中的索引
    level: number;          // 层级深度
    isSymmetric: boolean;   // 是否为对称布局
    avoidanceApplied: boolean; // 是否应用了避让
}

/**
 * Layout result interface
 * Extracted from main.ts
 */
export interface LayoutResult {
    positions: ChildNodePosition[];
    totalHeight: number;    // 总布局高度
    totalWidth: number;     // 总布局宽度
    centerY: number;        // 布局中心Y坐标
    warnings: string[];     // 布局警告信息
}

/**
 * Node relationship interface
 * Extracted from main.ts
 */
export interface NodeRelationship {
    nodeId: string;
    parentId: string | null;
    childIds: string[];
    siblingIds: string[];
    level: number;  // 在层级树中的深度
}

/**
 * Node tree interface
 * Extracted from main.ts
 */
export interface NodeTree {
    roots: string[];  // 根节点ID列表
    relationships: Map<string, NodeRelationship>;
}
