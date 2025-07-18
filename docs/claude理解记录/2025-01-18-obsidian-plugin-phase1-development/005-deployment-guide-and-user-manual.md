# 005-部署指南与用户手册

## Document Relationships
- **Parent Documents**: 
  - `004-development-progress-tracking.md` - 开发进度跟踪
  - `003-technical-architecture.md` - 技术架构设计
- **Related Documents**: 
  - `001-project-overview-and-setup.md` - 项目概览
  - `002-task-breakdown-and-planning.md` - 任务分解
- **Child Documents**: None
- **Status**: ✅ Created | 📝 In Progress | ⏳ Pending

---

## 🚀 部署指南

### 系统要求
- **Obsidian 版本**: 0.15.0 或更高
- **操作系统**: Windows, macOS, Linux
- **依赖**: 无额外依赖，纯原生 Obsidian 插件

### 安装步骤

#### 方法一：手动安装（推荐）
1. **下载插件文件**
   - `main.js` - 主插件文件
   - `manifest.json` - 插件元数据
   - `styles.css` - 样式文件

2. **创建插件目录**
   ```
   [Obsidian库]/.obsidian/plugins/visual-knowledge-workbench/
   ```

3. **复制文件**
   将下载的三个文件复制到插件目录中

4. **启用插件**
   - 打开 Obsidian 设置
   - 进入"第三方插件"
   - 找到"Visual Knowledge Workbench"
   - 点击启用

#### 方法二：开发者安装
1. **克隆代码库**
   ```bash
   git clone [repository-url]
   cd visual-knowledge-workbench
   ```

2. **安装依赖**
   ```bash
   npm install
   ```

3. **构建插件**
   ```bash
   npm run build
   ```

4. **复制到 Obsidian**
   将 `main.js`, `manifest.json`, `styles.css` 复制到插件目录

### 验证安装
1. 重启 Obsidian
2. 检查右侧边栏是否出现"📚"图标
3. 点击图标，应该打开"全局卡片库"视图
4. 创建一个测试 Canvas 文件，尝试拖拽卡片

---

## 📖 用户手册

### 核心功能

#### 1. 全局卡片库 (Universal Card Library)
**位置**: 右侧边栏（可在设置中调整为左侧）  
**图标**: 📚 (library)

**功能**:
- 显示库中所有 Markdown 文件作为卡片
- 支持多种排序方式：标题、修改时间、创建时间
- 点击卡片直接打开对应笔记
- 拖拽卡片到 Canvas 创建节点

#### 2. 智能筛选系统
**画布选择器**:
- 下拉菜单选择特定画布
- "显示全局库所有卡片" - 显示所有文件
- 选择具体画布 - 只显示该画布中的卡片

**搜索功能**:
- 实时搜索卡片标题和内容
- 支持模糊匹配
- 300ms 防抖优化

**标签筛选**:
- 自动提取 Obsidian 原生标签
- 点击标签按钮进行筛选
- 支持多标签组合筛选

#### 3. Canvas 集成
**支持的节点类型**:

1. **文件节点** (File Cards)
   - 拖拽 Markdown 文件到 Canvas
   - 自动创建文件类型节点
   - 格式：`{"type":"file","file":"path/to/file.md"}`
   - 默认尺寸：400x400

2. **文本节点** (Native Cards)
   - 拖拽画布中的文本卡片
   - 自动创建文本类型节点
   - 格式：`{"type":"text","text":"content"}`
   - 默认尺寸：250x60

**拖拽体验**:
- 增强的拖拽预览
- 实时类型指示器（📄文件 / 📝文本）
- 拖拽提示和成功反馈
- 自动坐标计算和定位

### 设置选项

#### 基础设置
- **卡片库位置**: 左侧边栏 / 右侧边栏
- **默认排序方式**: 标题 / 修改时间 / 创建时间
- **显示文件扩展名**: 开启/关闭 .md 扩展名显示

#### 性能设置
- **每页最大卡片数**: 100-5000 (默认 1000)
- **启用虚拟滚动**: 大型库性能优化
- **自动保存间隔**: 2000ms (默认)

### 使用场景

#### 场景一：知识卡片整理
1. 打开全局卡片库
2. 使用搜索功能找到相关笔记
3. 创建新的 Canvas 文件
4. 拖拽相关卡片到 Canvas 进行可视化整理

#### 场景二：项目规划
1. 选择特定的项目 Canvas
2. 查看该 Canvas 中已有的卡片
3. 从全局库中拖拽新的相关文件
4. 使用标签筛选找到相关资源

#### 场景三：思维导图创建
1. 在 Canvas 中创建文本节点作为中心主题
2. 切换到画布模式查看现有节点
3. 拖拽相关文件节点作为分支
4. 使用 Canvas 的连线功能建立关系

### 故障排除

#### 常见问题

**Q: 插件无法启用**
A: 检查 Obsidian 版本是否 ≥ 0.15.0，确保三个文件都已正确复制

**Q: 拖拽无效果**
A: 确保目标是 Canvas 视图，检查浏览器控制台是否有错误信息

**Q: 卡片库为空**
A: 检查库中是否有 Markdown 文件，尝试刷新插件

**Q: 搜索不工作**
A: 清除搜索框内容，检查是否有特殊字符

#### 性能优化建议
- 大型库（>1000文件）建议启用虚拟滚动
- 定期清理不需要的 Canvas 文件
- 使用标签和搜索减少显示的卡片数量

#### 调试模式
开发者可以在浏览器控制台中查看详细日志：
- Canvas 节点创建日志
- 拖拽操作反馈
- 格式验证结果

---

## 🔄 更新日志

### Phase 6 (2025-01-18) - Canvas Format Optimization
- ✅ 优化 Canvas 节点格式，确保完全符合 Obsidian 规范
- ✅ 增强拖拽用户体验，添加视觉反馈和错误处理
- ✅ 添加格式验证和集成测试
- ✅ 创建部署指南和用户手册

### Phase 1-5 (2025-01-18) - 核心功能开发
- ✅ 基础插件架构和配置
- ✅ 全局卡片库实现
- ✅ 上下文感知筛选系统
- ✅ Canvas 集成和拖拽功能
- ✅ 性能优化和错误处理

---

**创建时间**: 2025-01-18  
**最后更新**: 2025-01-18 14:00  
**状态**: 📝 部署就绪
