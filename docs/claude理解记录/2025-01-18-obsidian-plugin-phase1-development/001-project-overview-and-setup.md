# 001-项目概览与环境设置

## Document Relationships
- **Parent Documents**: 
  - `开发文档/思路设计/1.md` - 核心设计哲学与模块分解
  - `开发文档/思路设计/2.md` - Phase 1 实施指南
- **Related Documents**: 
  - `002-task-breakdown-and-planning.md` - 详细任务分解
  - `003-technical-architecture.md` - 技术架构设计
- **Child Documents**: None yet
- **Status**: ✅ Created | 📝 In Progress | ⏳ Pending

---

## 项目概览

### 项目名称
**思源笔记的 Obsidian 可视化工作台** - Phase 1 开发

### 核心目标
打造一个以卡片为核心、深度集成于 Obsidian 的可视化知识管理工作台，实现高效的卢曼卡片盒（Zettelkasten）笔记法。

### 设计哲学
- **原子化知识**: 每一条笔记、每一个想法都是独立的"卡片"
- **可视化连接**: 在无限画布上自由布局、连接、组合卡片
- **促进演化**: 将零散想法发展为结构化的永久笔记
- **增强而非颠覆**: 基于 Obsidian 成熟生态，深度增强 Canvas 功能

## Phase 1 核心模块

### 模块一：全局卡片库 (Universal Card Library)
- **功能**: 侧边栏视图，作为知识调度中心
- **特性**: 
  - 双轨制卡片来源（文件卡 + 原生卡）
  - 上下文感知筛选（全局/白板模式）
  - 原生标签系统集成
  - 实时全文检索

### 模块二：增强型白板 (Enhanced Canvas)
- **功能**: 思考与创作工作室
- **特性**:
  - 拖拽即用交互
  - 思维导图式快捷操作
  - 节点类型区分与直接编辑
  - 卡片升级功能

### 模块三：网格视图与辅助工具 (Grid Dashboard & Utilities)
- **功能**: 白板辅助管理视图
- **特性**:
  - 切换式网格视图
  - 时间胶囊模式
  - 无感自动保存
  - 小地图与撤销/重做

## 技术要求

### Canvas 格式要求
1. **Obsidian 文档/文件节点**:
```json
{
  "nodes": [
    {"id":"fc1c07bfb294aa91","x":258,"y":-2535,"width":400,"height":400,"type":"file","file":"未命名/阿萨德.md"}
  ],
  "edges": []
}
```

2. **Canvas 文本节点**:
```json
{
  "nodes": [
    {"id":"8c3fd1f38b37735c","x":270,"y":-2446,"width":250,"height":60,"type":"text","text":""}
  ],
  "edges": []
}
```

### 开发环境
- **基础**: Obsidian Plugin Template
- **位置**: `d:\思源白板插件开发\Obsidian-siyuan--master\`
- **构建工具**: esbuild + TypeScript
- **API**: Obsidian API (latest)

## 当前状态

### 已有资源
- ✅ 标准 Obsidian 插件模板
- ✅ 开发环境配置 (package.json, tsconfig.json, esbuild.config.mjs)
- ✅ 设计文档完整
- ✅ Canvas 格式规范明确

### 待开发
- 🔄 插件基础结构重构
- 🔄 CardLibraryView 实现
- 🔄 Canvas 集成逻辑
- 🔄 拖拽交互系统
- 🔄 筛选与搜索功能

## 开发原则

1. **遵循 Obsidian 生态**: 充分利用原生功能，避免重复造轮子
2. **渐进式开发**: 每个模块独立开发，逐步集成
3. **测试驱动**: 每个功能完成后立即编写测试
4. **文档同步**: 实时更新开发文档，保持信息同步
5. **用户体验优先**: 确保交互流畅，性能优化

## 下一步行动

参考 `002-task-breakdown-and-planning.md` 中的详细任务分解，按照优先级逐步实施。

---

**创建时间**: 2025-01-18  
**最后更新**: 2025-01-18  
**状态**: 📝 项目启动阶段
