/**
 * Constants and default configurations for the Visual Knowledge Workbench Plugin
 * 
 * This module contains all constant values, default settings, and configuration
 * options used throughout the plugin.
 */

import { PluginSettings } from './interfaces';

// =======================================================
// ==                View Type Constants               ==
// =======================================================

/**
 * Unique identifier for the card library view type
 */
export const CARD_LIBRARY_VIEW_TYPE = "card-library-view";

// =======================================================
// ==              Default Settings                    ==
// =======================================================

/**
 * Default plugin settings configuration
 * Extracted from main.ts - exact values preserved
 */
export const DEFAULT_SETTINGS: PluginSettings = {
    cardLibraryPosition: 'right',
    defaultSortBy: 'modified',
    showFileExtensions: false,
    maxCardsPerView: 1000,
    enableVirtualScrolling: true,
    autoSaveInterval: 2000
};

// =======================================================
// ==              Canvas Constants                    ==
// =======================================================

/**
 * Default canvas node dimensions
 */
export const DEFAULT_NODE_DIMENSIONS = {
    width: 250,
    height: 60,
    minWidth: 100,
    minHeight: 40,
    maxWidth: 800,
    maxHeight: 600
};

/**
 * Canvas layout constants
 */
export const CANVAS_LAYOUT = {
    defaultSpacing: 20,
    gridSize: 10,
    snapThreshold: 5,
    defaultZoom: 1.0,
    minZoom: 0.1,
    maxZoom: 5.0
};

// =======================================================
// ==              UI Constants                        ==
// =======================================================

/**
 * CSS class names for styling
 */
export const CSS_CLASSES = {
    cardLibraryView: 'card-library-view',
    cardLibraryFilters: 'card-library-filters',
    cardLibraryList: 'card-library-list',
    cardLibraryItem: 'card-library-item',
    nativeCardItem: 'native-card-item',
    dragging: 'dragging',
    dropZone: 'drop-zone',
    dropZoneActive: 'drop-zone-active'
};

/**
 * Icon names for UI elements
 */
export const ICONS = {
    library: 'library',
    search: 'search',
    filter: 'filter',
    sort: 'sort',
    settings: 'settings',
    canvas: 'canvas',
    file: 'file-text',
    tag: 'tag'
};

// =======================================================
// ==              Performance Constants               ==
// =======================================================

/**
 * Performance and optimization settings
 */
export const PERFORMANCE = {
    debounceDelay: 300,
    cacheTimeout: 30000, // 30 seconds
    maxCacheSize: 1000,
    virtualScrollThreshold: 100,
    batchSize: 50
};

// =======================================================
// ==              Validation Constants                ==
// =======================================================

/**
 * Validation rules and limits
 */
export const VALIDATION = {
    maxTitleLength: 200,
    maxContentLength: 10000,
    maxTagsPerCard: 20,
    maxTagLength: 50,
    minSearchQueryLength: 1,
    maxSearchQueryLength: 100
};

// =======================================================
// ==              Error Messages                      ==
// =======================================================

/**
 * Standard error messages
 */
export const ERROR_MESSAGES = {
    canvasNotFound: 'Canvas file not found',
    invalidNodeData: 'Invalid canvas node data',
    dragDropFailed: 'Failed to create canvas node from drag and drop',
    settingsLoadFailed: 'Failed to load plugin settings',
    settingsSaveFailed: 'Failed to save plugin settings',
    cardDataInvalid: 'Invalid card data format',
    filterApplyFailed: 'Failed to apply card filters'
};

// =======================================================
// ==              Success Messages                    ==
// =======================================================

/**
 * Standard success messages
 */
export const SUCCESS_MESSAGES = {
    nodeCreated: 'Canvas node created successfully',
    settingsSaved: 'Settings saved successfully',
    cardLibraryRefreshed: 'Card library refreshed',
    filterApplied: 'Filters applied successfully'
};

// =======================================================
// ==              Development Constants               ==
// =======================================================

/**
 * Development and debugging constants
 */
export const DEBUG = {
    enableLogging: process.env.NODE_ENV === 'development',
    logPrefix: '[Visual Knowledge Workbench]',
    enableIntegrationTests: process.env.NODE_ENV === 'development'
};

// =======================================================
// ==              File Extensions                     ==
// =======================================================

/**
 * Supported file extensions and types
 */
export const FILE_TYPES = {
    markdown: ['.md', '.markdown'],
    canvas: ['.canvas'],
    supported: ['.md', '.markdown', '.canvas']
};

// =======================================================
// ==              Keyboard Shortcuts                  ==
// =======================================================

/**
 * Default keyboard shortcuts
 */
export const KEYBOARD_SHORTCUTS = {
    openCardLibrary: 'Ctrl+Shift+L',
    searchCards: 'Ctrl+F',
    refreshLibrary: 'F5',
    toggleFilters: 'Ctrl+Shift+F'
};
