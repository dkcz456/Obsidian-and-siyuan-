# 004 - RSC Folder Structure

## Document Relationships
- **Previous Document**: 003-dependency-analysis.md
- **Current Document**: 004-rsc-folder-structure.md
- **Next Document**: 005-phase2-utility-extraction.md (to be created)
- **Related Documents**: Folder structure implementation

## RSC Folder Structure Created

### Complete Folder Hierarchy
```
Obsidian-siyuan--master/rsc/
├── types/
│   ├── interfaces.ts      ✅ CREATED - Core interfaces and type definitions
│   └── constants.ts       ✅ CREATED - Constants and default configurations
├── utils/
│   ├── debounce.ts       ✅ CREATED - Debounce and throttle utilities
│   ├── coordinates.ts    ✅ CREATED - Coordinate conversion utilities
│   └── validation.ts     ✅ CREATED - Canvas node validation functions
├── canvas/
│   ├── canvas-integration.ts  ✅ CREATED - Main CanvasIntegration class (placeholder)
│   ├── node-factory.ts       ✅ CREATED - Node creation functions (placeholder)
│   ├── drag-drop.ts          ✅ CREATED - Drag and drop handling (placeholder)
│   └── layout-calculator.ts  ✅ CREATED - Layout calculation logic (placeholder)
├── views/
│   ├── card-library-view.ts  ✅ CREATED - CardLibraryView class (placeholder)
│   └── settings-tab.ts       ✅ CREATED - Settings tab component (placeholder)
└── core/
    ├── plugin.ts             ✅ CREATED - Main plugin class (placeholder)
    └── settings-manager.ts   ✅ CREATED - Settings management (placeholder)
```

## Module Status Overview

### ✅ Completed Modules (Ready for Extraction)

#### 1. Types Module (`rsc/types/`)
- **interfaces.ts**: Complete type definitions
  - `CardData`, `FilterState`, `PluginSettings`
  - Canvas-related types (`CanvasNode`, `CanvasFileNode`, `CanvasTextNode`)
  - Coordinate and layout types
  - Event types for drag-drop operations
- **constants.ts**: Complete constants and defaults
  - `CARD_LIBRARY_VIEW_TYPE`, `DEFAULT_SETTINGS`
  - Canvas layout constants, CSS classes, icons
  - Performance settings, validation rules
  - Error/success messages, debug settings

#### 2. Utils Module (`rsc/utils/`)
- **debounce.ts**: Complete utility functions
  - `debounce()`, `debounceAsync()`, `throttle()`, `once()`
  - Performance optimization utilities
- **coordinates.ts**: Complete coordinate utilities
  - Screen/canvas coordinate conversion
  - Distance calculation, center calculation
  - Point-in-bounds checking, grid snapping
  - Bounding box calculation, interpolation
- **validation.ts**: Complete validation functions
  - Canvas node validation (`validateCanvasNode`, `validateCanvasFileNode`)
  - Card data validation, file path validation
  - Search query validation, coordinate validation
  - String sanitization utilities

### 🔄 Placeholder Modules (Ready for Implementation)

#### 3. Canvas Module (`rsc/canvas/`)
- **canvas-integration.ts**: Placeholder with method signatures
  - Main `CanvasIntegration` class structure
  - Method signatures for drag-drop, node creation, validation
- **node-factory.ts**: Placeholder with factory pattern
  - `NodeFactory` class with static methods
  - Node creation, ID generation, dimension calculation
- **drag-drop.ts**: Placeholder with event handling structure
  - `DragDropHandler` class with static methods
  - Event handling, visual feedback, coordinate conversion
- **layout-calculator.ts**: Placeholder with layout algorithms
  - `LayoutCalculator` class with static methods
  - Layout calculation, positioning, overlap resolution

#### 4. Views Module (`rsc/views/`)
- **card-library-view.ts**: Placeholder with UI structure
  - `CardLibraryView` class extending `ItemView`
  - Method signatures for UI rendering, filtering, events
- **settings-tab.ts**: Placeholder with settings structure
  - `VisualKnowledgeWorkbenchSettingTab` class
  - Settings display and management methods

#### 5. Core Module (`rsc/core/`)
- **plugin.ts**: Placeholder with plugin structure
  - `VisualKnowledgeWorkbenchPlugin` class extending `Plugin`
  - Lifecycle methods, component initialization
- **settings-manager.ts**: Placeholder with settings management
  - `SettingsManager` class for settings operations
  - Load, save, validate, migrate settings

## Import/Export Strategy

### Module Exports
Each module exports its main functionality:
```typescript
// rsc/types/interfaces.ts
export interface CardData { ... }
export interface FilterState { ... }
export interface PluginSettings { ... }

// rsc/types/constants.ts
export const CARD_LIBRARY_VIEW_TYPE = "card-library-view";
export const DEFAULT_SETTINGS: PluginSettings = { ... };

// rsc/utils/debounce.ts
export function debounce<T>(...): T { ... }

// rsc/canvas/canvas-integration.ts
export class CanvasIntegration { ... }

// rsc/views/card-library-view.ts
export class CardLibraryView extends ItemView { ... }

// rsc/core/plugin.ts
export default class VisualKnowledgeWorkbenchPlugin extends Plugin { ... }
```

### Cross-Module Dependencies
```typescript
// Views depend on types and utils
import { CardData, FilterState } from '../types/interfaces';
import { debounce } from '../utils/debounce';

// Canvas depends on types and utils
import { CanvasNode, Coordinates } from '../types/interfaces';
import { validateCanvasNode } from '../utils/validation';

// Core depends on all modules
import { PluginSettings } from '../types/interfaces';
import { CanvasIntegration } from '../canvas/canvas-integration';
import { CardLibraryView } from '../views/card-library-view';
```

## Next Steps for Phase 2

### Ready for Immediate Extraction
1. **Types Module**: Can be extracted immediately (no dependencies)
2. **Utils Module**: Can be extracted immediately (pure functions)

### Implementation Required
1. **Canvas Module**: Needs actual implementation extracted from main.ts
2. **Views Module**: Needs actual implementation extracted from main.ts
3. **Core Module**: Needs actual implementation extracted from main.ts

## Validation Checklist

### ✅ Structure Validation
- [x] All folders created
- [x] All placeholder files created
- [x] TypeScript syntax valid
- [x] Import/export structure defined
- [x] No circular dependencies in design

### 🔄 Implementation Validation (Next Phase)
- [ ] Extract utility functions from main.ts
- [ ] Extract type definitions from main.ts
- [ ] Update main.ts imports
- [ ] Test build process
- [ ] Validate functionality

## Risk Assessment

### Low Risk (Ready Now)
- Types and constants extraction
- Utility functions extraction
- Basic import updates

### Medium Risk (Next Phase)
- Canvas integration extraction
- View component extraction
- Cross-module dependency management

### High Risk (Final Phase)
- Main plugin class modification
- Entry point updates
- Full integration testing

## TODO List (Real-time Updates)
- [x] Create rsc/ folder structure
- [x] Create type definitions
- [x] Create utility functions
- [x] Create placeholder modules
- [x] Document folder structure
- [ ] Begin Phase 2: Utility extraction
- [ ] Update main.ts imports
- [ ] Test build process

---
**Document Created**: 2025-07-19  
**Last Updated**: 2025-07-19  
**Status**: RSC Folder Structure Complete
