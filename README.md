# Visual Knowledge Workbench - Obsidian Plugin

🎯 **一个以卡片为核心的可视化知识管理工作台，深度集成于 Obsidian 的 Canvas 功能**

> **🆕 最新更新 (2025-07-19)**: 完成筛选功能增强和UI美化，新增15项重大功能改进！

## ✨ 核心特性

### 🗂️ 智能卡片库 (Enhanced Card Library)
- **现代化设计**: 全新的卡片UI，支持响应式布局和深色模式
- **文件夹筛选**: 替代全局模式，支持根目录和子文件夹精确筛选
- **智能排序**: 支持按标题、修改时间、创建时间排序
- **一键访问**: 点击卡片直接打开对应笔记
- **拖拽操作**: 直接拖拽卡片到 Canvas 创建节点
- **文档优先**: 优先显示有文档支持的节点

### 🔍 高级筛选系统 (Advanced Filtering System)
- **文件夹筛选**: 基于文件夹结构的精确内容筛选
- **画布组织**: 按文件夹组织画布文件，显示节点数量和元数据
- **原生标签集成**: 完整的frontmatter标签提取和原生Obsidian样式
- **组合筛选**: 文件夹 + 标签 + 搜索的同时筛选
- **状态持久化**: 筛选偏好在会话间自动保存
- **可视化状态**: 实时显示当前筛选条件和结果统计
- **一键清除**: 快速清除所有筛选条件

### 🎨 增强型 Canvas 集成 (Enhanced Canvas Integration)
- **格式严格合规**: 完全符合 Obsidian Canvas 规范
- **双节点类型支持**:
  - 📄 **文件节点**: `{"type":"file","file":"path/to/file.md"}`
  - 📝 **文本节点**: `{"type":"text","text":"content"}`
- **增强拖拽体验**: 3D 预览、类型指示器、实时反馈
- **自动坐标计算**: 智能定位和节点布局

### 🎨 现代化UI/UX (Modern UI/UX)
- **响应式设计**: 支持480px-1400px+全屏幕尺寸适配
- **现代卡片设计**: 流畅动画、阴影效果和视觉层次
- **统一标签样式**: 与Obsidian原生外观完全一致
- **深色模式优化**: 完美适配所有Obsidian主题
- **触摸设备支持**: 44px最小触摸目标，优化移动体验

### ♿ 可访问性支持 (Accessibility)
- **键盘导航**: 完整的Tab、Enter、Space键支持
- **屏幕阅读器**: ARIA标签和描述，完整语义化
- **高对比度模式**: 自动适配系统高对比度设置
- **减少动画模式**: 尊重用户的动画偏好设置
- **强制颜色模式**: 支持Windows高对比度主题

### ⚡ 性能优化
- **缓存机制**: 30秒智能缓存，减少重复计算
- **防抖处理**: 搜索和筛选操作优化
- **大库支持**: 支持10000+文件的超大型知识库
- **虚拟滚动**: 可选的性能优化模式
- **状态管理**: FilterStateManager类实现高效状态管理

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
2. **文件夹筛选**: 使用顶部下拉菜单选择特定文件夹或画布
3. **搜索卡片**: 在搜索框中输入关键词进行实时搜索
4. **标签筛选**: 点击标签按钮进行筛选（支持多标签组合）
5. **拖拽到画布**: 将卡片拖拽到 Canvas 自动创建节点
6. **键盘导航**: 使用Tab键导航，Enter/Space键激活卡片

### 高级功能
- **组合筛选**: 同时使用文件夹、标签和搜索进行精确筛选
- **筛选状态**: 查看当前筛选条件，一键清除所有筛选
- **文档优先**: 启用文档节点优先显示模式
- **状态持久化**: 筛选偏好自动保存，重启后恢复
- **响应式界面**: 完美适配手机、平板和桌面设备
- **可访问性**: 支持屏幕阅读器和键盘操作

### 新功能亮点 🆕
- **文件夹筛选**: 替代全局模式，支持精确的文件夹内容筛选
- **画布组织**: 画布文件按文件夹分组，显示节点数量和元数据
- **现代UI**: 全新的卡片设计，流畅动画和视觉效果
- **完整标签支持**: frontmatter标签提取和原生Obsidian样式

## 🏗️ 技术架构

### 核心组件
- **VisualKnowledgeWorkbenchPlugin**: 主插件类
- **CardLibraryView**: 卡片库视图管理
- **FilterStateManager**: 筛选状态管理和持久化 🆕
- **CanvasIntegration**: Canvas 集成逻辑
- **AdvancedFiltering**: 高级筛选系统 🆕

### 技术栈
- **TypeScript**: 完整类型支持 (3000+ 行代码)
- **Obsidian API**: 深度集成原生功能
- **CSS3**: 现代响应式设计和可访问性
- **状态管理**: 持久化筛选状态系统
- **性能优化**: 缓存机制和虚拟滚动

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

## 📊 项目统计

**开发历程**:
- **Phase 1-3**: 初始开发 (6个阶段，4.5小时)
- **Phase 4-6**: 筛选增强和UI美化 (5个阶段，8小时) 🆕

**代码规模**:
- **TypeScript**: 3000+ 行 (增长100%)
- **CSS**: 800+ 行现代响应式样式
- **功能**: 15项重大功能增强

**文档**:
- **开发文档**: 10个详细文档，完整开发记录
- **用户手册**: 完整的使用指南和API文档

**状态**: ✅ 生产就绪，功能完整

**最新分支**: `筛选功能增强和美化UI` - 包含所有最新功能
