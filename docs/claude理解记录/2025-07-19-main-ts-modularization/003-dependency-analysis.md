# 003 - Dependency Analysis

## Document Relationships
- **Previous Document**: 002-task-breakdown-and-planning.md
- **Current Document**: 003-dependency-analysis.md
- **Next Document**: 004-rsc-folder-structure.md (to be created)
- **Related Documents**: main.ts source code analysis

## Import Dependencies Analysis

### External Dependencies (Obsidian API)
```typescript
import {
    App,           // Core Obsidian application instance
    ItemView,      // Base class for custom views
    Notice,        // User notification system
    Plugin,        // Base plugin class
    PluginSettingTab, // Settings UI base class
    Setting,       // Individual setting component
    TFile,         // File system abstraction
    WorkspaceLeaf  // UI workspace management
} from 'obsidian';
```

### Internal Dependencies Map

#### 1. Constants and Exports
```typescript
export const CARD_LIBRARY_VIEW_TYPE = "card-library-view";
```
- **Used by**: CardLibraryView.getViewType(), Plugin.registerView()
- **Risk Level**: Low (simple constant)
- **Module Target**: `rsc/types/constants.ts`

#### 2. Interface Dependencies
```typescript
interface CardData {
    id: string;
    type: 'file' | 'native';
    title: string;
    path?: string;
    content?: string;
    tags: string[];
    lastModified: number;
    canvasId?: string;
}

interface FilterState {
    mode: 'global' | 'canvas';
    selectedCanvas?: string;
    selectedTags: string[];
    searchQuery: string;
    sortBy: 'title' | 'modified' | 'created';
    sortOrder: 'asc' | 'desc';
}

interface PluginSettings {
    cardLibraryPosition: 'left' | 'right';
    defaultSortBy: 'title' | 'modified' | 'created';
    showFileExtensions: boolean;
    maxCardsPerView: number;
    enableVirtualScrolling: boolean;
    autoSaveInterval: number;
}
```
- **Used by**: All major classes
- **Risk Level**: Low (type definitions only)
- **Module Target**: `rsc/types/interfaces.ts`

#### 3. Utility Function Dependencies
```typescript
function debounce<T extends (...args: any[]) => any>(func: T, wait: number): T
```
- **Used by**: CardLibraryView (search functionality)
- **Dependencies**: None (pure function)
- **Risk Level**: Low
- **Module Target**: `rsc/utils/debounce.ts`

#### 4. Class Interdependencies

##### CanvasIntegration Class
- **Dependencies**: 
  - `App` (Obsidian API)
  - Coordinate conversion utilities
  - Canvas node validation functions
- **Used by**: VisualKnowledgeWorkbenchPlugin
- **Risk Level**: Medium (complex Canvas operations)
- **Module Target**: `rsc/canvas/canvas-integration.ts`

##### CardLibraryView Class
- **Dependencies**:
  - `ItemView` (Obsidian API)
  - `WorkspaceLeaf` (Obsidian API)
  - `VisualKnowledgeWorkbenchPlugin` (plugin instance)
  - `debounce` utility function
  - `CardData`, `FilterState` interfaces
  - `CARD_LIBRARY_VIEW_TYPE` constant
- **Used by**: VisualKnowledgeWorkbenchPlugin.registerView()
- **Risk Level**: Medium (UI component with events)
- **Module Target**: `rsc/views/card-library-view.ts`

##### VisualKnowledgeWorkbenchPlugin Class
- **Dependencies**:
  - `Plugin` (Obsidian API)
  - `CanvasIntegration` class
  - `CardLibraryView` class
  - `PluginSettings` interface
  - `DEFAULT_SETTINGS` constant
- **Used by**: Obsidian plugin system (entry point)
- **Risk Level**: High (main entry point)
- **Module Target**: `rsc/core/plugin.ts`

## Dependency Flow Analysis

### Data Flow
```
Plugin.onload() 
    ↓
CanvasIntegration.constructor(app)
    ↓
CardLibraryView.constructor(leaf, plugin)
    ↓
CardLibraryView.renderCardList()
    ↓
debounce(searchFunction)
```

### Event Flow
```
User Interaction (drag/drop)
    ↓
CanvasIntegration.handleDrop()
    ↓
CanvasIntegration.createCanvasNode()
    ↓
Canvas API calls
```

### Settings Flow
```
Plugin.loadSettings()
    ↓
DEFAULT_SETTINGS merge
    ↓
CardLibraryView configuration
    ↓
CanvasIntegration configuration
```

## Critical Dependencies for Modularization

### High Priority (Must Extract First)
1. **Type Definitions** - No dependencies, used everywhere
2. **Constants** - No dependencies, used everywhere  
3. **Utility Functions** - Pure functions, minimal dependencies

### Medium Priority (Extract Second)
1. **CanvasIntegration** - Self-contained, clear interface
2. **CardLibraryView** - UI component, depends on utilities

### Low Priority (Extract Last)
1. **Main Plugin Class** - Entry point, depends on everything

## Circular Dependency Risks

### Identified Risks
1. **Plugin ↔ CardLibraryView**: Plugin creates CardLibraryView, CardLibraryView needs Plugin reference
   - **Solution**: Pass only required data/methods, not full plugin instance

2. **CanvasIntegration ↔ Plugin**: Plugin creates CanvasIntegration, CanvasIntegration may need Plugin methods
   - **Solution**: Use dependency injection pattern

### Mitigation Strategies
1. **Interface Segregation**: Define minimal interfaces for cross-module communication
2. **Dependency Injection**: Pass specific dependencies rather than full objects
3. **Event-Driven Architecture**: Use events for loose coupling

## Module Export Strategy

### rsc/types/interfaces.ts
```typescript
export interface CardData { ... }
export interface FilterState { ... }
export interface PluginSettings { ... }
```

### rsc/types/constants.ts
```typescript
export const CARD_LIBRARY_VIEW_TYPE = "card-library-view";
export const DEFAULT_SETTINGS: PluginSettings = { ... };
```

### rsc/utils/debounce.ts
```typescript
export function debounce<T>(...): T { ... }
```

### rsc/canvas/canvas-integration.ts
```typescript
export class CanvasIntegration { ... }
```

### rsc/views/card-library-view.ts
```typescript
export class CardLibraryView extends ItemView { ... }
```

### rsc/core/plugin.ts
```typescript
export default class VisualKnowledgeWorkbenchPlugin extends Plugin { ... }
```

## Import Update Strategy

### Phase 1: Update main.ts imports
```typescript
// Replace internal definitions with module imports
import { CardData, FilterState, PluginSettings } from './rsc/types/interfaces';
import { CARD_LIBRARY_VIEW_TYPE, DEFAULT_SETTINGS } from './rsc/types/constants';
import { debounce } from './rsc/utils/debounce';
```

### Phase 2: Update cross-module imports
```typescript
// In CardLibraryView
import { debounce } from '../utils/debounce';
import { CardData, FilterState } from '../types/interfaces';
```

## Validation Strategy
1. **Incremental Testing**: Test after each module extraction
2. **Build Verification**: Ensure TypeScript compilation succeeds
3. **Runtime Testing**: Verify plugin loads and functions correctly
4. **Regression Testing**: Ensure all existing functionality preserved

---
**Document Created**: 2025-07-19  
**Last Updated**: 2025-07-19  
**Status**: Dependency Analysis Complete
