# 002-任务分解与开发计划

## Document Relationships
- **Parent Documents**: 
  - `001-project-overview-and-setup.md` - 项目概览与环境设置
- **Related Documents**: 
  - `开发文档/思路设计/1.md` - 核心设计哲学
  - `开发文档/思路设计/2.md` - Phase 1 实施指南
- **Child Documents**: 
  - `003-technical-architecture.md` - 技术架构设计
  - `004-development-progress-tracking.md` - 开发进度跟踪
- **Status**: ✅ Created | 📝 In Progress | ⏳ Pending

---

## 开发阶段总览

### Phase 1: Foundation Setup 🏗️
**目标**: 建立插件基础架构和开发环境
**预估时间**: 2-3 小时
**优先级**: 🔴 Critical

### Phase 2: Core Card Library Implementation 📚
**目标**: 实现全局卡片库核心功能
**预估时间**: 4-5 小时
**优先级**: 🔴 Critical

### Phase 3: Context-Aware Filtering System 🔍
**目标**: 添加智能筛选和搜索功能
**预估时间**: 3-4 小时
**优先级**: 🟡 High

### Phase 4: Enhanced Canvas Integration 🎨
**目标**: 实现画布集成和拖拽功能
**预估时间**: 4-5 小时
**优先级**: 🔴 Critical

### Phase 5: Testing and Refinement 🧪
**目标**: 测试、优化和生产准备
**预估时间**: 2-3 小时
**优先级**: 🟡 High

---

## 详细任务分解

## Phase 1: Foundation Setup

### 1.1 Update plugin metadata and configuration
**时间**: ~20 分钟
**描述**: 更新插件基础配置文件
**具体任务**:
- [ ] 修改 `manifest.json`: 更新 id, name, description, author
- [ ] 更新 `package.json`: 修改 name, description, keywords
- [ ] 确认 Obsidian API 版本兼容性

### 1.2 Restructure main.ts with core plugin architecture
**时间**: ~30 分钟
**描述**: 重构主插件文件，建立核心架构
**具体任务**:
- [ ] 移除示例代码，保留基础插件结构
- [ ] 添加插件设置接口定义
- [ ] 创建插件主类基础结构
- [ ] 添加视图类型常量定义

### 1.3 Set up TypeScript interfaces and types
**时间**: ~25 分钟
**描述**: 定义核心数据结构和类型
**具体任务**:
- [ ] 定义 `CardData` 接口（文件卡和原生卡）
- [ ] 定义 `CanvasNode` 接口（符合 Canvas 格式）
- [ ] 定义 `FilterState` 接口（筛选状态）
- [ ] 定义 `PluginSettings` 接口

### 1.4 Create basic CSS structure
**时间**: ~15 分钟
**描述**: 建立样式基础结构
**具体任务**:
- [ ] 清理示例样式
- [ ] 添加卡片库基础样式类
- [ ] 添加响应式设计基础
- [ ] 设置 CSS 变量和主题适配

## Phase 2: Core Card Library Implementation

### 2.1 Create CardLibraryView class structure
**时间**: ~25 分钟
**描述**: 实现卡片库视图基础结构
**具体任务**:
- [ ] 创建 `CardLibraryView` 类继承 `ItemView`
- [ ] 实现 `getViewType()`, `getDisplayText()`, `getIcon()`
- [ ] 实现 `onOpen()` 和 `onClose()` 生命周期
- [ ] 添加容器元素初始化

### 2.2 Implement basic card listing functionality
**时间**: ~30 分钟
**描述**: 实现基础卡片列表显示
**具体任务**:
- [ ] 实现 `renderCardList()` 方法
- [ ] 获取所有 Markdown 文件
- [ ] 创建卡片项 DOM 元素
- [ ] 添加卡片项基础样式

### 2.3 Add drag and drop event handling
**时间**: ~25 分钟
**描述**: 实现拖拽事件处理
**具体任务**:
- [ ] 为卡片项添加 `draggable` 属性
- [ ] 实现 `dragstart` 事件监听
- [ ] 设置 `dataTransfer` 数据格式
- [ ] 添加拖拽视觉反馈

### 2.4 Register view and add ribbon icon
**时间**: ~20 分钟
**描述**: 注册视图并添加访问入口
**具体任务**:
- [ ] 在插件 `onload` 中注册视图
- [ ] 添加 Ribbon 图标
- [ ] 实现 `activateCardLibraryView()` 方法
- [ ] 测试视图打开和关闭

## Phase 3: Context-Aware Filtering System

### 3.1 Add canvas selector dropdown
**时间**: ~30 分钟
**描述**: 创建画布选择下拉菜单
**具体任务**:
- [ ] 在卡片库顶部添加筛选器容器
- [ ] 创建画布选择下拉菜单
- [ ] 获取所有 `.canvas` 文件并填充选项
- [ ] 添加选择变化事件监听

### 3.2 Implement canvas-specific card filtering
**时间**: ~35 分钟
**描述**: 实现画布特定的卡片筛选
**具体任务**:
- [ ] 修改 `renderCardList()` 支持筛选模式
- [ ] 实现画布文件解析逻辑
- [ ] 提取画布中的文件节点和文本节点
- [ ] 区分显示文件卡和原生卡

### 3.3 Add native tag integration
**时间**: ~30 分钟
**描述**: 集成 Obsidian 原生标签系统
**具体任务**:
- [ ] 扫描当前视图中卡片的标签
- [ ] 创建标签筛选 UI 组件
- [ ] 实现标签点击筛选逻辑
- [ ] 添加标签高亮显示

### 3.4 Create search functionality
**时间**: ~25 分钟
**描述**: 添加实时搜索功能
**具体任务**:
- [ ] 添加搜索框 UI 组件
- [ ] 实现实时搜索事件监听
- [ ] 添加搜索结果高亮
- [ ] 优化搜索性能（防抖）

## Phase 4: Enhanced Canvas Integration

### 4.1 Implement canvas drop zone handling
**时间**: ~30 分钟
**描述**: 实现画布拖放区域处理
**具体任务**:
- [ ] 获取活动画布视图引用
- [ ] 添加 `dragover` 事件监听
- [ ] 添加 `drop` 事件监听
- [ ] 处理拖放数据验证

### 4.2 Create node generation logic
**时间**: ~35 分钟
**描述**: 实现画布节点生成逻辑
**具体任务**:
- [ ] 实现文件节点生成函数
- [ ] 实现文本节点生成函数
- [ ] 添加唯一 ID 生成逻辑
- [ ] 确保节点格式符合 Canvas 规范

### 4.3 Add canvas data persistence
**时间**: ~30 分钟
**描述**: 实现画布数据持久化
**具体任务**:
- [ ] 实现画布数据读取功能
- [ ] 实现画布数据保存功能
- [ ] 添加 JSON 格式验证
- [ ] 处理文件读写错误

### 4.4 Handle coordinate calculation
**时间**: ~25 分钟
**描述**: 实现坐标计算逻辑
**具体任务**:
- [ ] 获取鼠标在画布中的坐标
- [ ] 实现坐标转换逻辑
- [ ] 处理画布缩放和平移
- [ ] 添加节点位置优化

## Phase 5: Testing and Refinement

### 5.1 Write unit tests for core functionality
**时间**: ~40 分钟
**描述**: 编写核心功能单元测试
**具体任务**:
- [ ] 测试卡片库视图创建和渲染
- [ ] 测试筛选和搜索功能
- [ ] 测试拖拽数据处理
- [ ] 测试画布节点生成

### 5.2 Perform integration testing
**时间**: ~30 分钟
**描述**: 执行集成测试
**具体任务**:
- [ ] 测试完整的拖拽工作流
- [ ] 测试不同内容类型处理
- [ ] 测试错误场景处理
- [ ] 验证 Canvas 格式兼容性

### 5.3 Optimize performance and memory usage
**时间**: ~25 分钟
**描述**: 性能优化和内存管理
**具体任务**:
- [ ] 分析大型库的性能表现
- [ ] 优化卡片渲染性能
- [ ] 实现虚拟滚动（如需要）
- [ ] 优化内存使用

### 5.4 Bug fixes and edge case handling
**时间**: ~25 分钟
**描述**: 修复问题和处理边界情况
**具体任务**:
- [ ] 修复测试中发现的问题
- [ ] 处理空文件和损坏文件
- [ ] 添加用户友好的错误提示
- [ ] 完善异常处理机制

---

## 开发里程碑

- **Milestone 1**: 基础架构完成 (Phase 1)
- **Milestone 2**: 卡片库可用 (Phase 2)
- **Milestone 3**: 筛选系统就绪 (Phase 3)
- **Milestone 4**: 画布集成完成 (Phase 4)
- **Milestone 5**: 生产就绪 (Phase 5)

---

**创建时间**: 2025-01-18  
**最后更新**: 2025-01-18  
**状态**: 📝 任务规划完成，等待开发启动
