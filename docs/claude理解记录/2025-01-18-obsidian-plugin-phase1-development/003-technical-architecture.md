# 003-技术架构设计

## Document Relationships
- **Parent Documents**: 
  - `002-task-breakdown-and-planning.md` - 任务分解与开发计划
- **Related Documents**: 
  - `001-project-overview-and-setup.md` - 项目概览
  - `开发文档/思路设计/1.md` - 核心设计哲学
- **Child Documents**: 
  - `004-development-progress-tracking.md` - 开发进度跟踪
- **Status**: ✅ Created | 📝 In Progress | ⏳ Pending

---

## 架构概览

### 核心组件架构
```
VisualKnowledgeWorkbenchPlugin
├── CardLibraryView (侧边栏视图)
│   ├── FilterManager (筛选管理器)
│   ├── SearchEngine (搜索引擎)
│   └── DragHandler (拖拽处理器)
├── CanvasIntegration (画布集成)
│   ├── DropZoneManager (拖放区域管理)
│   ├── NodeFactory (节点工厂)
│   └── DataPersistence (数据持久化)
└── SettingsManager (设置管理)
```

## 核心接口定义

### 1. 卡片数据接口
```typescript
interface CardData {
  id: string;
  type: 'file' | 'native';
  title: string;
  path?: string; // 文件卡路径
  content?: string; // 原生卡内容
  tags: string[];
  lastModified: number;
  canvasId?: string; // 所属画布ID（原生卡）
}

interface FileCard extends CardData {
  type: 'file';
  path: string;
  file: TFile;
}

interface NativeCard extends CardData {
  type: 'native';
  content: string;
  canvasId: string;
  nodeId: string;
}
```

### 2. 画布节点接口
```typescript
interface CanvasNode {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'file' | 'text';
  file?: string; // 文件节点路径
  text?: string; // 文本节点内容
}

interface CanvasData {
  nodes: CanvasNode[];
  edges: CanvasEdge[];
}

interface CanvasEdge {
  id: string;
  fromNode: string;
  fromSide: string;
  toNode: string;
  toSide: string;
}
```

### 3. 筛选状态接口
```typescript
interface FilterState {
  mode: 'global' | 'canvas';
  selectedCanvas?: string;
  selectedTags: string[];
  searchQuery: string;
  sortBy: 'title' | 'modified' | 'created';
  sortOrder: 'asc' | 'desc';
}
```

### 4. 插件设置接口
```typescript
interface PluginSettings {
  cardLibraryPosition: 'left' | 'right';
  defaultSortBy: 'title' | 'modified' | 'created';
  showFileExtensions: boolean;
  maxCardsPerView: number;
  enableVirtualScrolling: boolean;
  autoSaveInterval: number;
}
```

## 核心类设计

### 1. CardLibraryView 类
```typescript
export class CardLibraryView extends ItemView {
  private filterManager: FilterManager;
  private searchEngine: SearchEngine;
  private dragHandler: DragHandler;
  private cardListEl: HTMLElement;
  private filterEl: HTMLElement;
  
  constructor(leaf: WorkspaceLeaf, plugin: VisualKnowledgeWorkbenchPlugin);
  
  // ItemView 接口实现
  getViewType(): string;
  getDisplayText(): string;
  getIcon(): string;
  
  // 生命周期方法
  async onOpen(): Promise<void>;
  async onClose(): Promise<void>;
  
  // 核心功能方法
  private createFilterUI(): void;
  private renderCardList(cards: CardData[]): void;
  private setupDragHandling(): void;
  
  // 事件处理
  private onFilterChange(filterState: FilterState): void;
  private onSearchInput(query: string): void;
  private onCardDragStart(card: CardData, event: DragEvent): void;
}
```

### 2. FilterManager 类
```typescript
export class FilterManager {
  private state: FilterState;
  private app: App;
  
  constructor(app: App);
  
  // 筛选逻辑
  async getFilteredCards(): Promise<CardData[]>;
  private getGlobalCards(): Promise<FileCard[]>;
  private getCanvasCards(canvasPath: string): Promise<(FileCard | NativeCard)[]>;
  
  // 标签处理
  private extractTagsFromCards(cards: CardData[]): string[];
  private filterByTags(cards: CardData[], tags: string[]): CardData[];
  
  // 搜索处理
  private filterBySearch(cards: CardData[], query: string): CardData[];
  
  // 状态管理
  updateFilter(updates: Partial<FilterState>): void;
  getState(): FilterState;
}
```

### 3. CanvasIntegration 类
```typescript
export class CanvasIntegration {
  private app: App;
  private nodeFactory: NodeFactory;
  private dataPersistence: DataPersistence;
  
  constructor(app: App);
  
  // 拖放处理
  setupDropZone(canvasEl: HTMLElement): void;
  private onDragOver(event: DragEvent): void;
  private onDrop(event: DragEvent): Promise<void>;
  
  // 节点创建
  private async createNodeFromCard(card: CardData, position: {x: number, y: number}): Promise<CanvasNode>;
  
  // 画布操作
  private getActiveCanvas(): CanvasView | null;
  private addNodeToCanvas(node: CanvasNode): Promise<void>;
}
```

### 4. NodeFactory 类
```typescript
export class NodeFactory {
  // 节点创建工厂方法
  createFileNode(filePath: string, position: {x: number, y: number}): CanvasNode;
  createTextNode(content: string, position: {x: number, y: number}): CanvasNode;
  
  // 工具方法
  private generateNodeId(): string;
  private calculateNodeSize(content: string): {width: number, height: number};
  private validateNodeFormat(node: CanvasNode): boolean;
}
```

## 数据流设计

### 1. 卡片加载流程
```
用户打开卡片库
    ↓
FilterManager.getFilteredCards()
    ↓
根据当前筛选状态获取卡片
    ↓
CardLibraryView.renderCardList()
    ↓
显示卡片列表
```

### 2. 筛选流程
```
用户更改筛选条件
    ↓
FilterManager.updateFilter()
    ↓
触发 onFilterChange 事件
    ↓
重新获取和渲染卡片
```

### 3. 拖拽流程
```
用户开始拖拽卡片
    ↓
DragHandler.onCardDragStart()
    ↓
设置 dataTransfer 数据
    ↓
用户拖拽到画布
    ↓
CanvasIntegration.onDrop()
    ↓
NodeFactory.createNode()
    ↓
添加节点到画布
    ↓
DataPersistence.saveCanvas()
```

## 性能优化策略

### 1. 虚拟滚动
- 对于大型库（>1000 个文件），实现虚拟滚动
- 只渲染可见区域的卡片项
- 使用 `IntersectionObserver` 监听滚动

### 2. 防抖和节流
- 搜索输入使用 300ms 防抖
- 筛选操作使用节流限制频率
- 自动保存使用 2 秒防抖

### 3. 缓存策略
- 缓存文件列表和元数据
- 监听文件系统变化更新缓存
- 使用 LRU 缓存限制内存使用

### 4. 异步加载
- 分批加载大量卡片
- 使用 `requestIdleCallback` 在空闲时处理
- 优先加载可见区域内容

## 错误处理策略

### 1. 文件系统错误
- 处理文件不存在或无法访问
- 优雅降级，显示错误状态
- 提供重试机制

### 2. 画布格式错误
- 验证 JSON 格式
- 处理损坏的画布文件
- 备份机制防止数据丢失

### 3. 用户操作错误
- 友好的错误提示
- 操作撤销机制
- 状态恢复功能

## 扩展性设计

### 1. 插件系统
- 预留插件接口
- 支持自定义卡片类型
- 支持自定义筛选器

### 2. 主题系统
- CSS 变量支持
- 响应式设计
- 深色/浅色主题适配

### 3. 国际化支持
- 文本外部化
- 多语言支持框架
- 本地化配置

## 测试策略

### 1. 单元测试
- 核心逻辑函数测试
- 数据处理函数测试
- 工具函数测试

### 2. 集成测试
- 组件间交互测试
- API 调用测试
- 文件系统操作测试

### 3. 端到端测试
- 完整用户流程测试
- 性能基准测试
- 兼容性测试

---

**创建时间**: 2025-01-18  
**最后更新**: 2025-01-18  
**状态**: 📝 架构设计完成，等待实施
