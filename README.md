# Visual Knowledge Workbench - Obsidian Plugin

🎯 **一个以卡片为核心的可视化知识管理工作台，深度集成于 Obsidian 的 Canvas 功能**

## ✨ 核心特性

### 🗂️ 全局卡片库 (Universal Card Library)
- **侧边栏视图**: 统一管理所有 Markdown 文件作为可视化卡片
- **智能排序**: 支持按标题、修改时间、创建时间排序
- **一键访问**: 点击卡片直接打开对应笔记
- **拖拽操作**: 直接拖拽卡片到 Canvas 创建节点

### 🔍 智能筛选系统 (Context-Aware Filtering)
- **双模式切换**: 全局库模式 ↔ 画布特定模式
- **画布选择器**: 下拉菜单快速切换不同画布的卡片视图
- **原生标签集成**: 自动提取和筛选 Obsidian 标签
- **实时搜索**: 300ms 防抖优化的模糊搜索功能

### 🎨 增强型 Canvas 集成 (Enhanced Canvas Integration)
- **格式严格合规**: 完全符合 Obsidian Canvas 规范
- **双节点类型支持**:
  - 📄 **文件节点**: `{"type":"file","file":"path/to/file.md"}`
  - 📝 **文本节点**: `{"type":"text","text":"content"}`
- **增强拖拽体验**: 3D 预览、类型指示器、实时反馈
- **自动坐标计算**: 智能定位和节点布局

### ⚡ 性能优化
- **缓存机制**: 30秒智能缓存，减少重复计算
- **防抖处理**: 搜索和筛选操作优化
- **大库支持**: 支持 1000+ 文件的大型知识库
- **虚拟滚动**: 可选的性能优化模式

## 🚀 快速开始

### 安装要求
- Obsidian 版本 ≥ 0.15.0
- 支持 Windows, macOS, Linux

### 安装步骤

#### 方法一：手动安装（推荐）
1. 下载插件文件：`main.js`, `manifest.json`, `styles.css`
2. 在你的 Obsidian 库中创建目录：`.obsidian/plugins/visual-knowledge-workbench/`
3. 将三个文件复制到该目录
4. 重启 Obsidian 并在设置中启用插件

#### 方法二：开发者安装
```bash
# 克隆仓库
git clone https://github.com/dkcz456/Obsidian-and-siyuan-.git
cd Obsidian-and-siyuan-

# 安装依赖
npm install

# 构建插件
npm run build
```

### 验证安装
1. 重启 Obsidian
2. 检查右侧边栏是否出现 📚 图标
3. 点击图标打开"全局卡片库"
4. 创建 Canvas 文件测试拖拽功能

## 📖 使用指南

### 基础操作
1. **打开卡片库**: 点击右侧边栏的 📚 图标
2. **切换模式**: 使用顶部下拉菜单在全局/画布模式间切换
3. **搜索卡片**: 在搜索框中输入关键词进行实时搜索
4. **标签筛选**: 点击标签按钮进行筛选（支持多标签）
5. **拖拽到画布**: 将卡片拖拽到 Canvas 自动创建节点

### 高级功能
- **性能设置**: 在插件设置中调整缓存和显示选项
- **自定义排序**: 选择适合的排序方式
- **响应式界面**: 支持不同屏幕尺寸和主题

## 🏗️ 技术架构

### 核心组件
- **VisualKnowledgeWorkbenchPlugin**: 主插件类
- **CardLibraryView**: 卡片库视图管理
- **CanvasIntegration**: Canvas 集成逻辑
- **FilterManager**: 智能筛选系统

### 技术栈
- **TypeScript**: 完整类型支持 (1500+ 行代码)
- **Obsidian API**: 深度集成原生功能
- **CSS3**: 响应式设计和主题适配

## 📚 文档

完整的开发文档位于 [`docs/`](docs/) 目录：

- [项目概览与设置](docs/claude理解记录/2025-01-18-obsidian-plugin-phase1-development/001-project-overview-and-setup.md)
- [任务分解与规划](docs/claude理解记录/2025-01-18-obsidian-plugin-phase1-development/002-task-breakdown-and-planning.md)
- [技术架构设计](docs/claude理解记录/2025-01-18-obsidian-plugin-phase1-development/003-technical-architecture.md)
- [开发进度跟踪](docs/claude理解记录/2025-01-18-obsidian-plugin-phase1-development/004-development-progress-tracking.md)
- [部署指南与用户手册](docs/claude理解记录/2025-01-18-obsidian-plugin-phase1-development/005-deployment-guide-and-user-manual.md)

## 🛠️ 开发

### 开发环境设置
```bash
# 安装依赖
npm install

# 开发模式（监听文件变化）
npm run dev

# 构建生产版本
npm run build
```

### 项目结构
```
├── main.ts              # 主插件文件
├── styles.css           # 样式文件
├── manifest.json        # 插件元数据
├── docs/                # 完整开发文档
└── README.md           # 项目说明
```

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

本项目采用 MIT 许可证

## 🙏 致谢

- [Obsidian](https://obsidian.md/) - 强大的知识管理平台
- [Obsidian Plugin API](https://github.com/obsidianmd/obsidian-api) - 官方插件开发文档

## 📞 支持

如果您遇到问题或有建议，请：

1. 查看 [用户手册](docs/claude理解记录/2025-01-18-obsidian-plugin-phase1-development/005-deployment-guide-and-user-manual.md)
2. 搜索现有的 [Issues](https://github.com/dkcz456/Obsidian-and-siyuan-/issues)
3. 创建新的 Issue 描述问题

---

**开发时间**: 6个阶段，4.5小时  
**代码行数**: 1500+ 行 TypeScript + CSS  
**文档**: 5个详细文档，完整开发记录  
**状态**: ✅ 生产就绪
