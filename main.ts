import {
	App,
	ItemView,
	Notice,
	Plugin,
	PluginSettingTab,
	Setting,
	TFile,
	WorkspaceLeaf
} from 'obsidian';

// =======================================================
// ==                   工具函数                        ==
// =======================================================

// 防抖函数
function debounce<T extends (...args: any[]) => any>(func: T, wait: number): T {
	let timeout: NodeJS.Timeout;
	return ((...args: any[]) => {
		clearTimeout(timeout);
		timeout = setTimeout(() => func.apply(this, args), wait);
	}) as T;
}

// =======================================================
// ==                   常量定义                        ==
// =======================================================
export const CARD_LIBRARY_VIEW_TYPE = "card-library-view";

// =======================================================
// ==                   接口定义                        ==
// =======================================================

// 卡片数据接口
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

// 画布节点接口
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

// =======================================================
// ==              布局算法相关接口                     ==
// =======================================================

interface LayoutConfig {
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

interface ChildNodePosition {
	x: number;
	y: number;
	index: number;          // 在子节点列表中的索引
	level: number;          // 层级深度
	isSymmetric: boolean;   // 是否为对称布局
	avoidanceApplied: boolean; // 是否应用了避让
}

interface LayoutResult {
	positions: ChildNodePosition[];
	totalHeight: number;    // 总布局高度
	totalWidth: number;     // 总布局宽度
	centerY: number;        // 布局中心Y坐标
	warnings: string[];     // 布局警告信息
}

interface NodeRelationship {
	nodeId: string;
	parentId: string | null;
	childIds: string[];
	siblingIds: string[];
	level: number;  // 在层级树中的深度
}

interface NodeTree {
	roots: string[];  // 根节点ID列表
	relationships: Map<string, NodeRelationship>;
}

// 筛选状态接口
interface FilterState {
	mode: 'folder' | 'canvas'; // 将'global'替换为'folder'
	selectedFolder?: string;    // 新增：选中的文件夹路径
	selectedCanvas?: string;
	selectedTags: string[];
	searchQuery: string;
	sortBy: 'title' | 'modified' | 'created';
	sortOrder: 'asc' | 'desc';
}

// 文件夹节点接口
interface FolderNode {
	path: string;
	name: string;
	children: FolderNode[];
	fileCount: number;
}

// 筛选统计接口
interface FilterStats {
	total: number;
	filtered: number;
	fileCards: number;
	nativeCards: number;
	taggedCards: number;
}

// 插件设置接口
interface PluginSettings {
	cardLibraryPosition: 'left' | 'right';
	defaultSortBy: 'title' | 'modified' | 'created';
	showFileExtensions: boolean;
	maxCardsPerView: number;
	enableVirtualScrolling: boolean;
	autoSaveInterval: number;
	prioritizeDocumentNodes: boolean; // 新增：优先显示文档支持的节点
	persistFilterState: boolean; // 新增：是否持久化筛选状态
	lastFilterState?: FilterState; // 新增：上次的筛选状态
}

const DEFAULT_SETTINGS: PluginSettings = {
	cardLibraryPosition: 'right',
	defaultSortBy: 'modified',
	showFileExtensions: false,
	maxCardsPerView: 1000,
	enableVirtualScrolling: true,
	autoSaveInterval: 2000,
	prioritizeDocumentNodes: true, // 默认启用文档节点优先
	persistFilterState: true // 默认启用筛选状态持久化
}

// =======================================================
// ==              Canvas集成类                        ==
// =======================================================
export class CanvasIntegration {
	private app: App;
	private relationshipAnalyzer: NodeRelationshipAnalyzer | null = null;
	private layoutCalculator: SymmetricLayoutCalculator;

	constructor(app: App) {
		this.app = app;
		this.layoutCalculator = new SymmetricLayoutCalculator();
		this.setupGlobalDropHandling();
	}

	// 设置全局拖放处理
	private setupGlobalDropHandling() {
		// 监听工作区变化，为新的Canvas视图设置拖放处理
		this.app.workspace.on('layout-change', () => {
			this.setupCanvasDropZones();
		});

		// 初始设置
		this.setupCanvasDropZones();
	}

	// 为所有Canvas视图设置拖放区域
	private setupCanvasDropZones() {
		// 获取所有Canvas视图
		const canvasLeaves = this.app.workspace.getLeavesOfType('canvas');

		canvasLeaves.forEach(leaf => {
			if (leaf.view && leaf.view.containerEl) {
				this.setupCanvasDropZone(leaf.view.containerEl, leaf);
			}
		});
	}

	// 为单个Canvas设置拖放区域
	private setupCanvasDropZone(canvasContainer: HTMLElement, leaf: any) {
		// 创建绑定的处理函数
		const boundDragOver = this.handleDragOver.bind(this);
		const boundDrop = (event: DragEvent) => this.handleDrop(event, leaf);

		// 移除现有的事件监听器（如果有）
		canvasContainer.removeEventListener('dragover', boundDragOver);
		canvasContainer.removeEventListener('drop', boundDrop);

		// 添加新的事件监听器
		canvasContainer.addEventListener('dragover', boundDragOver);
		canvasContainer.addEventListener('drop', boundDrop);
	}

	// 处理拖拽悬停
	private handleDragOver = (event: DragEvent) => {
		event.preventDefault();
		if (event.dataTransfer) {
			event.dataTransfer.dropEffect = 'copy';
		}

		// 添加视觉反馈
		const target = event.currentTarget as HTMLElement;
		target.classList.add('canvas-drop-zone-active');
	}

	// 处理拖放
	private handleDrop = async (event: DragEvent, leaf: any) => {
		event.preventDefault();

		// 移除视觉反馈
		const target = event.currentTarget as HTMLElement;
		target.classList.remove('canvas-drop-zone-active');

		// 获取拖拽数据
		const jsonData = event.dataTransfer?.getData('application/json');
		const textData = event.dataTransfer?.getData('text/plain');

		if (!jsonData && !textData) return;

		try {
			let cardData: any = null;

			if (jsonData) {
				cardData = JSON.parse(jsonData);
			} else if (textData) {
				// 解析文本数据（格式：[[path]]）
				const match = textData.match(/\[\[(.*?)\]\]/);
				if (match) {
					cardData = {
						type: 'file',
						path: match[1],
						title: match[1].split('/').pop()?.replace('.md', '') || match[1]
					};
				}
			}

			if (cardData) {
				await this.createCanvasNode(cardData, event, leaf);
			}
		} catch (error) {
			console.error('Error handling drop:', error);
		}
	}

	// 创建Canvas节点
	private async createCanvasNode(cardData: any, event: DragEvent, leaf: any) {
		const canvasView = leaf.view;
		if (!canvasView || !canvasView.canvas) {
			console.error('Canvas view not found');
			return;
		}

		// 获取鼠标在Canvas中的坐标
		const rect = canvasView.canvas.wrapperEl.getBoundingClientRect();
		const x = event.clientX - rect.left;
		const y = event.clientY - rect.top;

		// 转换为Canvas坐标系
		const canvasCoords = canvasView.canvas.posFromEvt({
			clientX: event.clientX,
			clientY: event.clientY
		} as MouseEvent);

		// 生成唯一ID
		const nodeId = this.generateNodeId();

		// 创建节点数据（严格按照Canvas格式）
		let newNode: CanvasNode;

		if (cardData.type === 'file') {
			// 文件节点 - 使用标准化创建函数
			newNode = this.createFileNode(
				nodeId,
				cardData.path,
				canvasCoords.x,
				canvasCoords.y
			);
		} else {
			// 文本节点 - 使用标准化创建函数
			const textContent = cardData.content || cardData.title || '';
			newNode = this.createTextNode(
				nodeId,
				textContent,
				canvasCoords.x,
				canvasCoords.y
			);
		}

		// 验证节点格式
		if (!this.validateCanvasNode(newNode)) {
			console.error('Generated canvas node failed validation:', newNode);
			return;
		}

		// 添加节点到Canvas
		await this.addNodeToCanvas(newNode, canvasView);
	}

	// 添加节点到Canvas - 增强版本
	private async addNodeToCanvas(node: CanvasNode, canvasView: any) {
		try {
			// 获取当前Canvas数据
			const canvasFile = canvasView.file;
			if (!canvasFile) {
				console.error('Canvas file not found');
				return;
			}

			const content = await this.app.vault.read(canvasFile);
			let canvasData: CanvasData;

			try {
				canvasData = JSON.parse(content);
			} catch (parseError) {
				console.error('Invalid Canvas JSON format:', parseError);
				return;
			}

			// 验证Canvas数据结构
			if (!this.validateCanvasData(canvasData)) {
				console.error('Invalid Canvas data structure');
				return;
			}

			// 检查节点ID是否已存在
			if (canvasData.nodes.some(existingNode => existingNode.id === node.id)) {
				console.warn('Node ID already exists, generating new ID');
				node.id = this.generateNodeId();
			}

			// 添加新节点
			canvasData.nodes.push(node);

			// 生成格式化的JSON（与Obsidian格式一致）
			const newContent = JSON.stringify(canvasData, null, '\t');

			// 保存Canvas数据
			await this.app.vault.modify(canvasFile, newContent);

			// 刷新Canvas视图
			if (canvasView.requestSave) {
				canvasView.requestSave();
			}

			console.log('Successfully added node to canvas:', node.type, node.id);

		} catch (error) {
			console.error('Error adding node to canvas:', error);
		}
	}

	// 验证Canvas数据结构
	private validateCanvasData(canvasData: any): boolean {
		if (!canvasData || typeof canvasData !== 'object') return false;
		if (!Array.isArray(canvasData.nodes)) return false;
		if (!Array.isArray(canvasData.edges)) return false;
		return true;
	}

	// 测试Canvas格式生成
	public testCanvasFormatGeneration(): void {
		console.log('Testing Canvas format generation...');

		// 测试文件节点
		const fileNode = this.createFileNode('test-file-id', 'test/file.md', 100, 200);
		console.log('File node:', JSON.stringify(fileNode, null, 2));
		console.log('File node validation:', this.validateCanvasNode(fileNode));

		// 测试文本节点
		const textNode = this.createTextNode('test-text-id', 'Test content', 300, 400);
		console.log('Text node:', JSON.stringify(textNode, null, 2));
		console.log('Text node validation:', this.validateCanvasNode(textNode));

		// 测试Canvas数据结构
		const testCanvasData: CanvasData = {
			nodes: [fileNode, textNode],
			edges: []
		};
		console.log('Canvas data validation:', this.validateCanvasData(testCanvasData));
		console.log('Complete Canvas JSON:', JSON.stringify(testCanvasData, null, '\t'));
	}

	// 生成唯一节点ID
	private generateNodeId(): string {
		return Math.random().toString(36).substring(2, 18);
	}

	// Canvas格式验证函数
	private validateCanvasNode(node: CanvasNode): boolean {
		// 基础属性验证
		if (!node.id || typeof node.id !== 'string') return false;
		if (typeof node.x !== 'number' || typeof node.y !== 'number') return false;
		if (typeof node.width !== 'number' || typeof node.height !== 'number') return false;
		if (!node.type || (node.type !== 'file' && node.type !== 'text')) return false;

		// 文件节点特定验证
		if (node.type === 'file') {
			if (!node.file || typeof node.file !== 'string') return false;
			if (node.text !== undefined) return false; // 文件节点不应该有text属性
		}

		// 文本节点特定验证
		if (node.type === 'text') {
			if (!node.text || typeof node.text !== 'string') return false;
			if (node.file !== undefined) return false; // 文本节点不应该有file属性
		}

		return true;
	}

	// 创建标准化的文件节点
	private createFileNode(nodeId: string, filePath: string, x: number, y: number): CanvasNode {
		return {
			id: nodeId,
			x: x,
			y: y,
			width: 400,
			height: 400,
			type: 'file',
			file: filePath
		};
	}

	// 创建标准化的文本节点
	private createTextNode(nodeId: string, textContent: string, x: number, y: number): CanvasNode {
		return {
			id: nodeId,
			x: x,
			y: y,
			width: 250,
			height: 60,
			type: 'text',
			text: textContent
		};
	}

	// =======================================================
	// ==              思维导图式交互方法                   ==
	// =======================================================

	// 在指定位置创建子节点 (带连接线) - 使用动态重新布局
	async createChildNodeAt(parentNode: any, position: {x: number, y: number}, canvasView: any) {
		try {
			// 初始化关系分析器
			await this.initializeRelationshipAnalyzer(canvasView);

			// 获取现有子节点
			const existingChildren = await this.getExistingChildNodes(parentNode.id, canvasView);

			console.log(`创建子节点: 父节点 ${parentNode.id} 现有 ${existingChildren.length} 个子节点`);

			// 计算包含新节点的所有位置（动态重新布局）
			const allPositions = this.layoutCalculator.calculateSymmetricPositions(
				parentNode,
				existingChildren.length + 1,
				0
			);

			// 1. 重新布局现有子节点
			if (existingChildren.length > 0) {
				const existingUpdates = existingChildren.map((child, index) => ({
					nodeId: child.id,
					x: allPositions[index].x,
					y: allPositions[index].y
				}));

				console.log(`重新布局 ${existingChildren.length} 个现有子节点`);
				const updateResult = await this.batchUpdateNodePositions(existingUpdates, canvasView);

				if (!updateResult.success) {
					console.warn('部分现有节点位置更新失败:', updateResult.failedNodes);
				}
			}

			// 2. 创建新节点
			const newNodePosition = allPositions[existingChildren.length];
			const newNodeId = this.generateNodeId();

			// 创建新的文本节点（使用计算出的位置）
			const newNode = this.createTextNode(
				newNodeId,
				'新建子节点',
				newNodePosition.x,
				newNodePosition.y
			);

			// 添加节点到Canvas
			await this.addNodeToCanvas(newNode, canvasView);

			// 创建连接线 (父节点 -> 子节点)
			const newEdge = {
				id: `edge-${parentNode.id}-${newNodeId}`,
				fromNode: parentNode.id,
				toNode: newNodeId,
				fromSide: 'right',
				toSide: 'left'
			};

			await this.addEdgeToCanvas(newEdge, canvasView);

			console.log(`动态布局完成: 重新排列 ${existingChildren.length} 个现有节点，创建 1 个新节点`);

		} catch (error) {
			console.error('Error creating child node with dynamic layout:', error);
			// 回退到原始位置创建
			await this.createChildNodeAtPosition(parentNode, position, canvasView);
		}
	}

	// 回退方法：在指定位置创建子节点（原始逻辑）
	private async createChildNodeAtPosition(parentNode: any, position: {x: number, y: number}, canvasView: any) {
		// 生成新节点ID
		const newNodeId = this.generateNodeId();

		// 创建新的文本节点
		const newNode = this.createTextNode(
			newNodeId,
			'新建子节点',
			position.x,
			position.y
		);

		// 添加节点到Canvas
		await this.addNodeToCanvas(newNode, canvasView);

		// 创建连接线 (父节点 -> 子节点)
		const newEdge = {
			id: `edge-${parentNode.id}-${newNodeId}`,
			fromNode: parentNode.id,
			toNode: newNodeId,
			fromSide: 'right',
			toSide: 'left'
		};

		await this.addEdgeToCanvas(newEdge, canvasView);
	}

	// 在指定位置创建同级节点 (无连接线)
	async createSiblingNodeAt(siblingNode: any, position: {x: number, y: number}, canvasView: any) {
		// 生成新节点ID
		const newNodeId = this.generateNodeId();

		// 创建新的文本节点
		const newNode = this.createTextNode(
			newNodeId,
			'新建同级节点',
			position.x,
			position.y
		);

		// 添加节点到Canvas (不创建连接线)
		await this.addNodeToCanvas(newNode, canvasView);
	}

	// 添加连接线到Canvas
	private async addEdgeToCanvas(edge: any, canvasView: any) {
		try {
			// 获取当前Canvas数据
			const canvasFile = canvasView.file;
			if (!canvasFile) {
				console.error('Canvas file not found');
				return;
			}

			const content = await this.app.vault.read(canvasFile);
			let canvasData: CanvasData;

			try {
				canvasData = JSON.parse(content);
			} catch (parseError) {
				console.error('Invalid Canvas JSON format:', parseError);
				return;
			}

			// 确保edges数组存在
			if (!canvasData.edges) {
				canvasData.edges = [];
			}

			// 添加新连接线
			canvasData.edges.push(edge);

			// 保存更新后的Canvas数据
			const updatedContent = JSON.stringify(canvasData, null, '\t');
			await this.app.vault.modify(canvasFile, updatedContent);

			// 刷新Canvas视图
			if (canvasView.canvas && canvasView.canvas.requestSave) {
				canvasView.canvas.requestSave();
			}
		} catch (error) {
			console.error('Error adding edge to canvas:', error);
		}
	}

	// =======================================================
	// ==              关系检测和布局集成方法               ==
	// =======================================================

	// 获取Canvas数据并初始化关系分析器
	private async initializeRelationshipAnalyzer(canvasView: any): Promise<void> {
		try {
			const canvasFile = canvasView.file;
			if (!canvasFile) {
				console.error('Canvas file not found');
				return;
			}

			const content = await this.app.vault.read(canvasFile);
			const canvasData: CanvasData = JSON.parse(content);

			this.relationshipAnalyzer = new NodeRelationshipAnalyzer(canvasData);

			// 设置现有节点给布局计算器（用于碰撞检测）
			this.layoutCalculator.setExistingNodes(canvasData.nodes);
		} catch (error) {
			console.error('Error initializing relationship analyzer:', error);
			this.relationshipAnalyzer = null;
		}
	}

	// 获取现有子节点（核心方法）
	async getExistingChildNodes(parentNodeId: string, canvasView: any): Promise<CanvasNode[]> {
		await this.initializeRelationshipAnalyzer(canvasView);

		if (!this.relationshipAnalyzer) {
			console.warn('Relationship analyzer not initialized');
			return [];
		}

		return this.relationshipAnalyzer.getChildNodes(parentNodeId);
	}

	// 获取兄弟节点
	async getSiblingNodes(nodeId: string, canvasView: any): Promise<CanvasNode[]> {
		await this.initializeRelationshipAnalyzer(canvasView);

		if (!this.relationshipAnalyzer) {
			console.warn('Relationship analyzer not initialized');
			return [];
		}

		return this.relationshipAnalyzer.getSiblingNodes(nodeId);
	}

	// 获取父节点
	async getParentNode(childNodeId: string, canvasView: any): Promise<CanvasNode | null> {
		await this.initializeRelationshipAnalyzer(canvasView);

		if (!this.relationshipAnalyzer) {
			console.warn('Relationship analyzer not initialized');
			return null;
		}

		return this.relationshipAnalyzer.getParentNode(childNodeId);
	}

	// 创建独立节点（用于根节点的同级节点）
	async createIndependentNodeAt(position: {x: number, y: number}, canvasView: any) {
		// 生成新节点ID
		const newNodeId = this.generateNodeId();

		// 创建新的文本节点
		const newNode = this.createTextNode(
			newNodeId,
			'新建独立节点',
			position.x,
			position.y
		);

		// 添加节点到Canvas（不创建连接线）
		await this.addNodeToCanvas(newNode, canvasView);

		console.log(`创建独立节点: ${newNodeId} at (${position.x}, ${position.y})`);
	}

	// =======================================================
	// ==              动态重新布局系统                     ==
	// =======================================================

	// 更新单个节点位置
	async updateNodePosition(nodeId: string, x: number, y: number, canvasView: any): Promise<boolean> {
		try {
			// 获取当前Canvas数据
			const canvasFile = canvasView.file;
			if (!canvasFile) {
				console.error('Canvas file not found');
				return false;
			}

			const content = await this.app.vault.read(canvasFile);
			let canvasData: CanvasData;

			try {
				canvasData = JSON.parse(content);
			} catch (parseError) {
				console.error('Invalid Canvas JSON format:', parseError);
				return false;
			}

			// 查找并更新节点位置
			const node = canvasData.nodes.find(n => n.id === nodeId);
			if (!node) {
				console.error(`Node ${nodeId} not found in canvas`);
				return false;
			}

			// 更新节点位置
			const oldPosition = { x: node.x, y: node.y };
			node.x = x;
			node.y = y;

			// 保存更新后的Canvas数据
			const updatedContent = JSON.stringify(canvasData, null, '\t');
			await this.app.vault.modify(canvasFile, updatedContent);

			// 刷新Canvas视图
			if (canvasView.canvas && canvasView.canvas.requestSave) {
				canvasView.canvas.requestSave();
			}

			console.log(`节点位置更新: ${nodeId} from (${oldPosition.x}, ${oldPosition.y}) to (${x}, ${y})`);
			return true;

		} catch (error) {
			console.error('Error updating node position:', error);
			return false;
		}
	}

	// 批量更新节点位置
	async batchUpdateNodePositions(
		updates: Array<{nodeId: string, x: number, y: number}>,
		canvasView: any
	): Promise<{success: boolean, updatedNodes: string[], failedNodes: string[]}> {
		const result = {
			success: true,
			updatedNodes: [] as string[],
			failedNodes: [] as string[]
		};

		try {
			// 获取当前Canvas数据
			const canvasFile = canvasView.file;
			if (!canvasFile) {
				console.error('Canvas file not found');
				result.success = false;
				return result;
			}

			const content = await this.app.vault.read(canvasFile);
			let canvasData: CanvasData;

			try {
				canvasData = JSON.parse(content);
			} catch (parseError) {
				console.error('Invalid Canvas JSON format:', parseError);
				result.success = false;
				return result;
			}

			// 批量更新节点位置
			updates.forEach(update => {
				const node = canvasData.nodes.find(n => n.id === update.nodeId);
				if (node) {
					node.x = update.x;
					node.y = update.y;
					result.updatedNodes.push(update.nodeId);
				} else {
					result.failedNodes.push(update.nodeId);
					console.warn(`Node ${update.nodeId} not found for position update`);
				}
			});

			// 保存更新后的Canvas数据
			const updatedContent = JSON.stringify(canvasData, null, '\t');
			await this.app.vault.modify(canvasFile, updatedContent);

			// 刷新Canvas视图
			if (canvasView.canvas && canvasView.canvas.requestSave) {
				canvasView.canvas.requestSave();
			}

			console.log(`批量位置更新完成: 成功 ${result.updatedNodes.length} 个，失败 ${result.failedNodes.length} 个`);

			// 如果有失败的更新，标记为部分成功
			if (result.failedNodes.length > 0) {
				result.success = false;
			}

		} catch (error) {
			console.error('Error in batch position update:', error);
			result.success = false;
		}

		return result;
	}
}

// =======================================================
// ==              节点关系分析器                       ==
// =======================================================

class NodeRelationshipAnalyzer {
	private canvasData: CanvasData;
	private relationshipCache: Map<string, NodeRelationship>;

	constructor(canvasData: CanvasData) {
		this.canvasData = canvasData;
		this.relationshipCache = new Map();
		this.buildRelationshipCache();
	}

	// 核心方法：获取指定节点的所有子节点
	getChildNodes(parentId: string): CanvasNode[] {
		const relationship = this.relationshipCache.get(parentId);
		if (!relationship) return [];

		return relationship.childIds
			.map(childId => this.findNodeById(childId))
			.filter(node => node !== null) as CanvasNode[];
	}

	// 获取父节点
	getParentNode(childId: string): CanvasNode | null {
		const relationship = this.relationshipCache.get(childId);
		if (!relationship || !relationship.parentId) return null;

		return this.findNodeById(relationship.parentId);
	}

	// 获取兄弟节点
	getSiblingNodes(nodeId: string): CanvasNode[] {
		const relationship = this.relationshipCache.get(nodeId);
		if (!relationship) return [];

		return relationship.siblingIds
			.map(siblingId => this.findNodeById(siblingId))
			.filter(node => node !== null) as CanvasNode[];
	}

	// 构建完整的层级树
	buildHierarchyTree(): NodeTree {
		const tree: NodeTree = {
			roots: [],
			relationships: this.relationshipCache
		};

		// 找出所有根节点（没有父节点的节点）
		for (const [nodeId, relationship] of this.relationshipCache) {
			if (!relationship.parentId) {
				tree.roots.push(nodeId);
			}
		}

		return tree;
	}

	// 私有方法：构建关系缓存
	private buildRelationshipCache(): void {
		// 初始化所有节点的关系对象
		this.canvasData.nodes.forEach(node => {
			this.relationshipCache.set(node.id, {
				nodeId: node.id,
				parentId: null,
				childIds: [],
				siblingIds: [],
				level: 0
			});
		});

		// 基于edges构建父子关系
		this.canvasData.edges.forEach(edge => {
			const parentRelation = this.relationshipCache.get(edge.fromNode);
			const childRelation = this.relationshipCache.get(edge.toNode);

			if (parentRelation && childRelation) {
				// 建立父子关系
				parentRelation.childIds.push(edge.toNode);
				childRelation.parentId = edge.fromNode;
			}
		});

		// 构建兄弟关系
		for (const [nodeId, relationship] of this.relationshipCache) {
			if (relationship.parentId) {
				const parentRelation = this.relationshipCache.get(relationship.parentId);
				if (parentRelation) {
					// 所有同一父节点的子节点互为兄弟
					relationship.siblingIds = parentRelation.childIds.filter(id => id !== nodeId);
				}
			}
		}

		// 计算层级深度
		this.calculateNodeLevels();
	}

	// 私有方法：计算节点层级
	private calculateNodeLevels(): void {
		const visited = new Set<string>();

		// 从根节点开始递归计算层级
		for (const [nodeId, relationship] of this.relationshipCache) {
			if (!relationship.parentId && !visited.has(nodeId)) {
				this.calculateLevelRecursive(nodeId, 0, visited);
			}
		}
	}

	private calculateLevelRecursive(nodeId: string, level: number, visited: Set<string>): void {
		if (visited.has(nodeId)) return;

		visited.add(nodeId);
		const relationship = this.relationshipCache.get(nodeId);
		if (relationship) {
			relationship.level = level;

			// 递归处理子节点
			relationship.childIds.forEach(childId => {
				this.calculateLevelRecursive(childId, level + 1, visited);
			});
		}
	}

	// 私有方法：根据ID查找节点
	private findNodeById(nodeId: string): CanvasNode | null {
		return this.canvasData.nodes.find(node => node.id === nodeId) || null;
	}
}

// =======================================================
// ==              对称布局计算器                       ==
// =======================================================

// 默认配置 - 优化后的视觉效果
const DEFAULT_LAYOUT_CONFIG: LayoutConfig = {
	horizontalSpacing: 100,
	verticalSpacing: 80,        // 增加间距，改善视觉效果
	symmetryMode: 'vertical',
	centerAlignment: true,
	maxVerticalSpread: 800,
	collisionDetection: true,
	avoidanceMargin: 20,
	defaultNodeWidth: 250,
	defaultNodeHeight: 60
};

class SymmetricLayoutCalculator {
	private config: LayoutConfig;
	private existingNodes: CanvasNode[];

	constructor(config: LayoutConfig = DEFAULT_LAYOUT_CONFIG) {
		this.config = config;
		this.existingNodes = [];
	}

	// 核心方法：计算子节点位置
	calculateChildNodePosition(
		parentNode: CanvasNode,
		existingChildren: CanvasNode[],
		newChildIndex?: number
	): LayoutResult {
		// 1. 分析现有子节点布局
		const existingLayout = this.analyzeExistingLayout(parentNode, existingChildren);

		// 2. 计算新的完整布局
		const totalChildren = existingChildren.length + 1; // 包含新节点
		const insertIndex = newChildIndex ?? existingChildren.length;

		// 3. 计算对称分布位置
		const symmetricPositions = this.calculateSymmetricPositions(
			parentNode,
			totalChildren,
			insertIndex
		);

		// 4. 应用碰撞检测和避让
		const finalPositions = this.applyCollisionAvoidance(symmetricPositions, parentNode);

		// 5. 生成布局结果
		return this.generateLayoutResult(finalPositions, parentNode);
	}

	// 分析现有子节点布局
	private analyzeExistingLayout(
		parentNode: CanvasNode,
		existingChildren: CanvasNode[]
	): { isSymmetric: boolean; centerY: number; spacing: number } {
		if (existingChildren.length === 0) {
			return {
				isSymmetric: true,
				centerY: parentNode.y + parentNode.height / 2,
				spacing: this.config.verticalSpacing
			};
		}

		// 计算现有子节点的中心Y坐标
		const childrenY = existingChildren.map(child => child.y + child.height / 2);
		const minY = Math.min(...childrenY);
		const maxY = Math.max(...childrenY);
		const centerY = (minY + maxY) / 2;

		// 检查是否为对称布局
		const parentCenterY = parentNode.y + parentNode.height / 2;
		const isSymmetric = Math.abs(centerY - parentCenterY) < 10; // 10px容差

		// 计算平均间距
		const spacing = existingChildren.length > 1
			? (maxY - minY) / (existingChildren.length - 1)
			: this.config.verticalSpacing;

		return { isSymmetric, centerY, spacing };
	}

	// 计算对称分布位置 - 优化后的视觉中心对齐 (公共方法)
	calculateSymmetricPositions(
		parentNode: CanvasNode,
		totalChildren: number,
		insertIndex: number
	): ChildNodePosition[] {
		const positions: ChildNodePosition[] = [];

		// 计算布局参数
		const parentCenterY = parentNode.y + parentNode.height / 2;
		const childHeight = this.config.defaultNodeHeight;

		// 计算总布局高度（考虑节点高度）
		const totalHeight = (totalChildren - 1) * this.config.verticalSpacing;

		// 计算起始Y坐标，使子节点的视觉中心对称分布
		const firstChildCenterY = parentCenterY - totalHeight / 2;
		const startY = firstChildCenterY - childHeight / 2;

		// 计算X坐标（父节点右侧）
		const childX = parentNode.x + parentNode.width + this.config.horizontalSpacing;

		// 为每个子节点计算位置
		for (let i = 0; i < totalChildren; i++) {
			// 计算子节点的Y坐标（顶部坐标）
			const childY = startY + i * this.config.verticalSpacing;

			positions.push({
				x: childX,
				y: childY,
				index: i,
				level: 1, // 假设为第一级子节点
				isSymmetric: true,
				avoidanceApplied: false
			});
		}

		// 添加调试信息
		console.log(`对称布局计算: 父节点中心Y=${parentCenterY}, 总子节点=${totalChildren}, 总高度=${totalHeight}`);
		console.log(`子节点位置:`, positions.map(p => `(${p.x}, ${p.y})`));

		return positions;
	}

	// 应用碰撞检测和避让
	private applyCollisionAvoidance(
		positions: ChildNodePosition[],
		parentNode: CanvasNode
	): ChildNodePosition[] {
		if (!this.config.collisionDetection) {
			return positions;
		}

		const adjustedPositions = [...positions];

		for (let i = 0; i < adjustedPositions.length; i++) {
			const position = adjustedPositions[i];
			const nodeRect = {
				x: position.x,
				y: position.y,
				width: this.config.defaultNodeWidth,
				height: this.config.defaultNodeHeight
			};

			// 检查与现有节点的碰撞
			const collision = this.detectCollision(nodeRect);
			if (collision) {
				// 应用避让策略
				const avoidedPosition = this.applyAvoidanceStrategy(position, collision);
				adjustedPositions[i] = {
					...avoidedPosition,
					avoidanceApplied: true
				};
			}
		}

		return adjustedPositions;
	}

	// 碰撞检测
	private detectCollision(nodeRect: { x: number; y: number; width: number; height: number }): CanvasNode | null {
		for (const existingNode of this.existingNodes) {
			if (this.isRectOverlap(nodeRect, existingNode)) {
				return existingNode;
			}
		}
		return null;
	}

	// 矩形重叠检测
	private isRectOverlap(
		rect1: { x: number; y: number; width: number; height: number },
		rect2: { x: number; y: number; width: number; height: number }
	): boolean {
		const margin = this.config.avoidanceMargin;

		return !(
			rect1.x + rect1.width + margin < rect2.x ||
			rect2.x + rect2.width + margin < rect1.x ||
			rect1.y + rect1.height + margin < rect2.y ||
			rect2.y + rect2.height + margin < rect1.y
		);
	}

	// 避让策略
	private applyAvoidanceStrategy(
		position: ChildNodePosition,
		collision: CanvasNode
	): ChildNodePosition {
		// 简单策略：向下偏移
		const avoidanceOffset = collision.height + this.config.avoidanceMargin;

		return {
			...position,
			y: collision.y + avoidanceOffset
		};
	}

	// 生成布局结果
	private generateLayoutResult(
		positions: ChildNodePosition[],
		parentNode: CanvasNode
	): LayoutResult {
		const warnings: string[] = [];

		// 计算布局范围
		const yCoords = positions.map(p => p.y);
		const minY = Math.min(...yCoords);
		const maxY = Math.max(...yCoords);
		const totalHeight = maxY - minY + this.config.defaultNodeHeight;
		const totalWidth = this.config.horizontalSpacing + this.config.defaultNodeWidth;
		const centerY = (minY + maxY) / 2;

		// 检查布局质量
		if (totalHeight > this.config.maxVerticalSpread) {
			warnings.push(`布局高度 (${totalHeight}px) 超过最大限制 (${this.config.maxVerticalSpread}px)`);
		}

		const avoidanceCount = positions.filter(p => p.avoidanceApplied).length;
		if (avoidanceCount > 0) {
			warnings.push(`${avoidanceCount} 个节点应用了碰撞避让`);
		}

		return {
			positions,
			totalHeight,
			totalWidth,
			centerY,
			warnings
		};
	}

	// 设置现有节点（用于碰撞检测）
	setExistingNodes(nodes: CanvasNode[]): void {
		this.existingNodes = nodes;
	}

	// 更新配置
	updateConfig(newConfig: Partial<LayoutConfig>): void {
		this.config = { ...this.config, ...newConfig };
	}
}
export default class VisualKnowledgeWorkbenchPlugin extends Plugin {
	settings: PluginSettings;
	canvasIntegration: CanvasIntegration;

	async onload() {
		await this.loadSettings();

		// 初始化Canvas集成
		this.canvasIntegration = new CanvasIntegration(this.app);

		// 注册全局卡片库视图
		this.registerView(
			CARD_LIBRARY_VIEW_TYPE,
			(leaf) => new CardLibraryView(leaf, this)
		);

		// 添加 Ribbon 图标来打开卡片库
		this.addRibbonIcon('library', '打开全局卡片库', () => {
			this.activateCardLibraryView();
		});

		// 添加命令：打开卡片库
		this.addCommand({
			id: 'open-card-library',
			name: '打开全局卡片库',
			callback: () => {
				this.activateCardLibraryView();
			}
		});

		// 添加命令：创建子节点 (思维导图式交互)
		this.addCommand({
			id: 'create-child-node',
			name: '创建子节点',
			checkCallback: (checking: boolean) => {
				const activeCanvas = this.getActiveCanvasView();
				const hasSelection = this.hasSelectedCanvasNode();

				if (activeCanvas && hasSelection) {
					if (!checking) {
						this.createChildNode();
					}
					return true;
				}
				return false;
			}
		});

		// 添加命令：创建同级节点 (思维导图式交互)
		this.addCommand({
			id: 'create-sibling-node',
			name: '创建同级节点',
			checkCallback: (checking: boolean) => {
				const activeCanvas = this.getActiveCanvasView();
				const hasSelection = this.hasSelectedCanvasNode();

				if (activeCanvas && hasSelection) {
					if (!checking) {
						this.createSiblingNode();
					}
					return true;
				}
				return false;
			}
		});

		// 添加设置选项卡
		this.addSettingTab(new VisualKnowledgeWorkbenchSettingTab(this.app, this));

		// 开发模式：运行集成测试
		if (process.env.NODE_ENV === 'development') {
			this.runIntegrationTests();
		}

		console.log('Visual Knowledge Workbench Plugin loaded');
	}

	onunload() {
		console.log('Visual Knowledge Workbench Plugin unloaded');
	}

	async activateCardLibraryView() {
		// 移除现有的卡片库视图
		this.app.workspace.detachLeavesOfType(CARD_LIBRARY_VIEW_TYPE);

		// 在右侧边栏创建新的卡片库视图
		const leaf = this.settings.cardLibraryPosition === 'left'
			? this.app.workspace.getLeftLeaf(false)
			: this.app.workspace.getRightLeaf(false);

		if (leaf) {
			await leaf.setViewState({
				type: CARD_LIBRARY_VIEW_TYPE,
				active: true,
			});

			// 显示视图
			this.app.workspace.revealLeaf(
				this.app.workspace.getLeavesOfType(CARD_LIBRARY_VIEW_TYPE)[0]
			);
		}
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	// =======================================================
	// ==              Canvas交互辅助方法                   ==
	// =======================================================

	// 获取当前活动的Canvas视图
	getActiveCanvasView(): any | null {
		const activeLeaf = this.app.workspace.activeLeaf;
		if (activeLeaf && activeLeaf.view.getViewType() === 'canvas') {
			return activeLeaf.view;
		}
		return null;
	}

	// 检查是否有选中的Canvas节点
	hasSelectedCanvasNode(): boolean {
		const canvasView = this.getActiveCanvasView();
		if (!canvasView || !canvasView.canvas) {
			return false;
		}

		// 检查Canvas中是否有选中的节点
		const selection = canvasView.canvas.selection;
		return selection && selection.size > 0;
	}

	// 获取选中的Canvas节点
	getSelectedCanvasNodes(): any[] {
		const canvasView = this.getActiveCanvasView();
		if (!canvasView || !canvasView.canvas) {
			return [];
		}

		const selection = canvasView.canvas.selection;
		if (!selection || selection.size === 0) {
			return [];
		}

		return Array.from(selection);
	}

	// 创建子节点 (思维导图式交互)
	async createChildNode() {
		const canvasView = this.getActiveCanvasView();
		const selectedNodes = this.getSelectedCanvasNodes();

		if (!canvasView || selectedNodes.length !== 1) {
			new Notice('请选择一个节点来创建子节点');
			return;
		}

		const parentNode = selectedNodes[0];

		// 计算子节点位置 (父节点右侧)
		const childPosition = {
			x: parentNode.x + (parentNode.width || 250) + 100,
			y: parentNode.y
		};

		// 通过CanvasIntegration创建节点
		await this.canvasIntegration.createChildNodeAt(parentNode, childPosition, canvasView);

		new Notice('已创建子节点');
	}

	// 创建同级节点 (思维导图式交互) - 修复后的正确逻辑
	async createSiblingNode() {
		const canvasView = this.getActiveCanvasView();
		const selectedNodes = this.getSelectedCanvasNodes();

		if (!canvasView || selectedNodes.length !== 1) {
			new Notice('请选择一个节点来创建同级节点');
			return;
		}

		const selectedNode = selectedNodes[0];

		try {
			// 1. 检测选中节点的父节点
			const parentNode = await this.canvasIntegration.getParentNode(selectedNode.id, canvasView);

			if (parentNode) {
				// 2. 选中节点有父节点 - 创建真正的同级节点
				console.log(`创建同级节点: 选中节点 ${selectedNode.id} 的父节点是 ${parentNode.id}`);

				// 3. 获取现有子节点（包括选中节点本身）
				const existingChildren = await this.canvasIntegration.getExistingChildNodes(parentNode.id, canvasView);
				console.log(`父节点 ${parentNode.id} 现有 ${existingChildren.length} 个子节点`);

				// 4. 使用智能布局在父节点下创建新子节点
				await this.canvasIntegration.createChildNodeAt(parentNode, { x: 0, y: 0 }, canvasView);

				new Notice(`已在父节点下创建同级节点 (共 ${existingChildren.length + 1} 个子节点)`);

			} else {
				// 5. 选中节点是根节点 - 创建独立的同级根节点
				console.log(`创建独立节点: 选中节点 ${selectedNode.id} 是根节点`);

				const independentPosition = this.calculateIndependentNodePosition(selectedNode);
				await this.canvasIntegration.createIndependentNodeAt(independentPosition, canvasView);

				new Notice('已创建独立的同级节点');
			}

		} catch (error) {
			console.error('Error creating sibling node:', error);
			new Notice('创建同级节点失败，请重试');
		}
	}

	// 计算独立节点位置（用于根节点的同级节点）
	private calculateIndependentNodePosition(referenceNode: any): {x: number, y: number} {
		const spacing = 70; // 默认间距
		return {
			x: referenceNode.x,
			y: referenceNode.y + (referenceNode.height || 60) + spacing
		};
	}

	// 运行集成测试
	private runIntegrationTests() {
		console.log('🧪 Running Visual Knowledge Workbench Integration Tests...');

		// 测试Canvas格式生成
		this.canvasIntegration.testCanvasFormatGeneration();

		// 测试卡片数据处理
		this.testCardDataProcessing();

		console.log('✅ Integration tests completed');
	}

	// 测试卡片数据处理
	private testCardDataProcessing() {
		console.log('Testing card data processing...');

		// 模拟文件卡片数据
		const fileCardData = {
			type: 'file',
			path: 'test/example.md',
			title: 'Example File',
			id: 'test-file-card'
		};

		// 模拟原生卡片数据
		const nativeCardData = {
			type: 'native',
			content: 'This is a test native card content',
			title: 'Test Native Card',
			id: 'test-native-card'
		};

		console.log('File card data:', JSON.stringify(fileCardData, null, 2));
		console.log('Native card data:', JSON.stringify(nativeCardData, null, 2));

		// 验证数据格式
		const isFileCardValid = fileCardData.type === 'file' && fileCardData.path && fileCardData.title;
		const isNativeCardValid = nativeCardData.type === 'native' && nativeCardData.content && nativeCardData.title;

		console.log('File card validation:', isFileCardValid);
		console.log('Native card validation:', isNativeCardValid);
	}
}

// =======================================================
// ==              筛选状态管理器                      ==
// =======================================================
class FilterStateManager {
	private plugin: VisualKnowledgeWorkbenchPlugin;
	private currentState: FilterState;
	private defaultState: FilterState;

	constructor(plugin: VisualKnowledgeWorkbenchPlugin) {
		this.plugin = plugin;
		this.defaultState = {
			mode: 'folder',
			selectedFolder: '',
			selectedCanvas: undefined,
			selectedTags: [],
			searchQuery: '',
			sortBy: 'modified',
			sortOrder: 'desc'
		};
		this.currentState = { ...this.defaultState };
	}

	// 初始化状态管理器
	async initialize(): Promise<void> {
		if (this.plugin.settings.persistFilterState && this.plugin.settings.lastFilterState) {
			// 恢复上次保存的状态
			const savedState = this.plugin.settings.lastFilterState;
			if (this.validateFilterState(savedState)) {
				this.currentState = { ...savedState };
			}
		}
	}

	// 获取当前筛选状态
	getState(): FilterState {
		return { ...this.currentState };
	}

	// 更新筛选状态
	async updateState(updates: Partial<FilterState>): Promise<void> {
		const newState = { ...this.currentState, ...updates };

		if (this.validateFilterState(newState)) {
			this.currentState = newState;

			// 如果启用了持久化，保存到设置中
			if (this.plugin.settings.persistFilterState) {
				await this.saveState();
			}
		}
	}

	// 重置到默认状态
	async resetState(): Promise<void> {
		this.currentState = { ...this.defaultState };
		if (this.plugin.settings.persistFilterState) {
			await this.saveState();
		}
	}

	// 验证筛选状态的有效性
	private validateFilterState(state: FilterState): boolean {
		// 验证模式
		if (!['folder', 'canvas'].includes(state.mode)) {
			return false;
		}

		// 验证排序字段
		if (!['title', 'modified', 'created'].includes(state.sortBy)) {
			return false;
		}

		// 验证排序顺序
		if (!['asc', 'desc'].includes(state.sortOrder)) {
			return false;
		}

		// 验证标签数组
		if (!Array.isArray(state.selectedTags)) {
			return false;
		}

		// 验证搜索查询
		if (typeof state.searchQuery !== 'string') {
			return false;
		}

		return true;
	}

	// 保存状态到插件设置
	private async saveState(): Promise<void> {
		this.plugin.settings.lastFilterState = { ...this.currentState };
		await this.plugin.saveSettings();
	}

	// 获取状态摘要（用于调试）
	getStateSummary(): string {
		const state = this.currentState;
		const parts = [
			`模式: ${state.mode}`,
			state.selectedFolder ? `文件夹: ${state.selectedFolder}` : '',
			state.selectedCanvas ? `画布: ${state.selectedCanvas}` : '',
			state.selectedTags.length > 0 ? `标签: ${state.selectedTags.join(', ')}` : '',
			state.searchQuery ? `搜索: "${state.searchQuery}"` : '',
			`排序: ${state.sortBy} (${state.sortOrder})`
		].filter(Boolean);

		return parts.join(' | ');
	}
}

// =======================================================
// ==              卡片库视图类                        ==
// =======================================================
export class CardLibraryView extends ItemView {
	private plugin: VisualKnowledgeWorkbenchPlugin;
	private cardListEl: HTMLElement;
	private filterEl: HTMLElement;
	private canvasSelector: HTMLSelectElement;
	private tagFilterEl: HTMLElement;
	private searchEl: HTMLInputElement;
	private currentFilterMode: 'folder' | 'canvas' = 'folder';
	private selectedFolderPath: string | null = null; // 新增：选中的文件夹路径
	private selectedCanvasPath: string | null = null;
	private selectedTags: string[] = [];
	private searchQuery: string = '';
	private filterStateManager: FilterStateManager;
	private filterStatusEl: HTMLElement;

	constructor(leaf: WorkspaceLeaf, plugin: VisualKnowledgeWorkbenchPlugin) {
		super(leaf);
		this.plugin = plugin;
		this.filterStateManager = new FilterStateManager(plugin);
	}

	getViewType() {
		return CARD_LIBRARY_VIEW_TYPE;
	}

	getDisplayText() {
		return "全局卡片库";
	}

	getIcon() {
		return "library";
	}

	async onOpen() {
		const container = this.containerEl.children[1];
		container.empty();
		container.createEl("h4", { text: "全局卡片库" });

		// 初始化筛选状态管理器
		await this.filterStateManager.initialize();

		// 恢复筛选状态
		await this.restoreFilterState();

		// 创建筛选器容器
		this.filterEl = container.createDiv('card-library-filters');
		this.createCanvasSelector();
		this.createSearchBox();
		this.createTagFilter();
		this.createDocumentPriorityToggle();

		// 创建筛选状态显示区域
		this.createFilterStatusDisplay();

		// 创建卡片列表容器
		this.cardListEl = container.createDiv('card-library-list');

		// 渲染卡片列表
		await this.renderCardList();
	}

	async onClose() {
		// 保存当前筛选状态
		await this.saveCurrentFilterState();
	}

	// 恢复筛选状态
	private async restoreFilterState(): Promise<void> {
		const state = this.filterStateManager.getState();

		// 恢复筛选模式和选择
		this.currentFilterMode = state.mode;
		this.selectedFolderPath = state.selectedFolder || null;
		this.selectedCanvasPath = state.selectedCanvas || null;
		this.selectedTags = [...state.selectedTags];
		this.searchQuery = state.searchQuery;
	}

	// 保存当前筛选状态
	private async saveCurrentFilterState(): Promise<void> {
		const currentState: FilterState = {
			mode: this.currentFilterMode,
			selectedFolder: this.selectedFolderPath || '',
			selectedCanvas: this.selectedCanvasPath || undefined,
			selectedTags: [...this.selectedTags],
			searchQuery: this.searchQuery,
			sortBy: 'modified', // 可以从UI获取
			sortOrder: 'desc'   // 可以从UI获取
		};

		await this.filterStateManager.updateState(currentState);
	}

	// 更新筛选状态（统一入口）
	private async updateFilterState(updates: Partial<FilterState>): Promise<void> {
		await this.filterStateManager.updateState(updates);

		// 同步到本地变量
		const newState = this.filterStateManager.getState();
		this.currentFilterMode = newState.mode;
		this.selectedFolderPath = newState.selectedFolder || null;
		this.selectedCanvasPath = newState.selectedCanvas || null;
		this.selectedTags = [...newState.selectedTags];
		this.searchQuery = newState.searchQuery;
	}

	// 恢复选择器状态到UI
	private restoreSelectorState(): void {
		// 恢复内容选择器状态
		if (this.currentFilterMode === 'folder') {
			const folderValue = `folder:${this.selectedFolderPath || ''}`;
			this.canvasSelector.value = folderValue;
		} else if (this.currentFilterMode === 'canvas' && this.selectedCanvasPath) {
			this.canvasSelector.value = this.selectedCanvasPath;
		}

		// 恢复搜索框状态
		if (this.searchEl) {
			this.searchEl.value = this.searchQuery;
		}
	}

	// 创建内容选择器（文件夹和画布）
	private createCanvasSelector() {
		// 创建选择器标签
		this.filterEl.createEl('label', {
			text: '选择内容:',
			cls: 'canvas-selector-label'
		});

		// 创建下拉选择器
		this.canvasSelector = this.filterEl.createEl('select', {
			cls: 'canvas-selector'
		});

		// 更新选择器选项
		this.updateSelectorOptions();

		// 恢复选择器状态
		this.restoreSelectorState();

		// 监听选择变化
		this.canvasSelector.addEventListener('change', async () => {
			const selectedValue = this.canvasSelector.value;

			// 更新筛选状态
			if (selectedValue.startsWith('folder:')) {
				await this.updateFilterState({
					mode: 'folder',
					selectedFolder: selectedValue.replace('folder:', ''),
					selectedCanvas: undefined
				});
			} else {
				await this.updateFilterState({
					mode: 'canvas',
					selectedCanvas: selectedValue,
					selectedFolder: ''
				});
			}

			// 重新渲染卡片列表
			await this.renderCardList();
		});
	}

	// 创建搜索框
	private createSearchBox() {
		// 创建搜索框标签
		this.filterEl.createEl('label', {
			text: '搜索:',
			cls: 'search-label'
		});

		// 创建搜索输入框
		this.searchEl = this.filterEl.createEl('input', {
			cls: 'card-library-search',
			attr: {
				type: 'text',
				placeholder: '搜索卡片...'
			}
		});

		// 添加搜索事件监听
		this.searchEl.addEventListener('input', async () => {
			// 更新筛选状态
			await this.updateFilterState({
				searchQuery: this.searchEl.value
			});

			this.debounceRenderCardList();
		});
	}

	// 创建标签筛选器
	private createTagFilter() {
		// 创建标签筛选器容器
		this.tagFilterEl = this.filterEl.createDiv('card-library-tags');

		// 标签筛选器标题
		this.filterEl.createEl('label', {
			text: '标签筛选:',
			cls: 'tag-filter-label'
		});

		// 标签将在渲染卡片时动态添加
		this.updateTagFilter();
	}

	// 创建文档优先切换
	private createDocumentPriorityToggle() {
		// 创建切换容器
		const toggleContainer = this.filterEl.createDiv('document-priority-toggle');

		// 创建复选框
		const checkbox = toggleContainer.createEl('input', {
			type: 'checkbox',
			cls: 'document-priority-checkbox'
		});
		checkbox.checked = this.plugin.settings.prioritizeDocumentNodes;

		// 创建标签
		const label = toggleContainer.createEl('label', {
			text: '优先显示文档节点',
			cls: 'document-priority-label'
		});
		label.setAttribute('for', 'document-priority-checkbox');

		// 添加点击事件
		checkbox.addEventListener('change', async () => {
			this.plugin.settings.prioritizeDocumentNodes = checkbox.checked;
			await this.plugin.saveSettings();

			// 重新渲染卡片列表
			this.renderCardList();
		});
	}

	// 创建筛选状态显示区域
	private createFilterStatusDisplay() {
		this.filterStatusEl = this.filterEl.createDiv('filter-status-display');
		this.updateFilterStatusDisplay();
	}

	// 更新筛选状态显示
	private updateFilterStatusDisplay() {
		if (!this.filterStatusEl) return;

		this.filterStatusEl.empty();

		// 创建状态摘要
		const statusSummary = this.filterStatusEl.createDiv('filter-status-summary');

		// 显示当前筛选模式
		const modeDisplay = statusSummary.createSpan('filter-mode');
		if (this.currentFilterMode === 'folder') {
			const folderName = this.selectedFolderPath || '根目录';
			modeDisplay.setText(`📁 ${folderName}`);
		} else if (this.currentFilterMode === 'canvas' && this.selectedCanvasPath) {
			const canvasName = this.selectedCanvasPath.split('/').pop()?.replace('.canvas', '') || '画布';
			modeDisplay.setText(`🎨 ${canvasName}`);
		}

		// 显示活跃筛选条件
		const activeFilters = this.getActiveFilters();
		if (activeFilters.length > 0) {
			const filtersDisplay = statusSummary.createDiv('active-filters');
			activeFilters.forEach(filter => {
				const filterChip = filtersDisplay.createSpan('filter-chip');
				filterChip.setText(filter);
			});
		}

		// 添加清除筛选按钮
		if (this.hasActiveFilters()) {
			const clearButton = statusSummary.createEl('button', {
				text: '清除筛选',
				cls: 'filter-clear-button'
			});

			clearButton.addEventListener('click', async () => {
				await this.clearAllFilters();
			});
		}
	}

	// 获取活跃的筛选条件
	private getActiveFilters(): string[] {
		const filters: string[] = [];

		if (this.searchQuery.trim()) {
			filters.push(`搜索: "${this.searchQuery}"`);
		}

		if (this.selectedTags.length > 0) {
			filters.push(`标签: ${this.selectedTags.join(', ')}`);
		}

		if (this.plugin.settings.prioritizeDocumentNodes) {
			filters.push('文档优先');
		}

		return filters;
	}

	// 检查是否有活跃的筛选条件
	private hasActiveFilters(): boolean {
		return this.searchQuery.trim() !== '' ||
			   this.selectedTags.length > 0 ||
			   this.plugin.settings.prioritizeDocumentNodes;
	}

	// 清除所有筛选条件
	private async clearAllFilters() {
		// 清除搜索
		this.searchQuery = '';
		if (this.searchEl) {
			this.searchEl.value = '';
		}

		// 清除标签选择
		this.selectedTags = [];

		// 更新筛选状态
		await this.updateFilterState({
			searchQuery: '',
			selectedTags: []
		});

		// 重新渲染
		this.updateTagFilter();
		this.updateFilterStatusDisplay();
		await this.renderCardList();
	}

	// 可访问性辅助方法
	private getCardAriaLabel(card: CardData): string {
		const cardType = card.type === 'native' ? '原生卡片' : '文件卡片';
		const cardTitle = card.title || '无标题';
		const cardTags = this.getCardTags(card);
		const tagsText = cardTags.length > 0 ? `，标签：${cardTags.join('，')}` : '';

		return `${cardType}：${cardTitle}${tagsText}`;
	}

	private getCardDescription(card: CardData, index: number): string {
		const parts = [];

		if (card.path) {
			parts.push(`路径：${card.path}`);
		}

		if (card.type === 'native' && card.content) {
			const preview = card.content.length > 100
				? card.content.substring(0, 100) + '...'
				: card.content;
			parts.push(`内容预览：${preview}`);
		}

		parts.push(`在列表中的位置：第${index + 1}项`);

		return parts.join('，');
	}

	// 更新标签筛选器
	private async updateTagFilter() {
		this.tagFilterEl.empty();

		// 获取当前视图中的所有卡片
		let cards: CardData[] = [];
		if (this.currentFilterMode === 'folder') {
			cards = await this.getFolderCards();
		} else if (this.currentFilterMode === 'canvas' && this.selectedCanvasPath) {
			cards = await this.getCanvasCards(this.selectedCanvasPath);
		}

		// 提取所有标签
		const allTags = this.extractTagsFromCards(cards);

		// 如果没有标签，显示提示
		if (allTags.length === 0) {
			this.tagFilterEl.createSpan({
				text: '(没有标签)',
				cls: 'no-tags-message'
			});
			return;
		}

		// 创建原生样式标签按钮
		allTags.forEach(tag => {
			const tagButton = this.createNativeTagElement(tag, this.selectedTags.includes(tag));
			this.tagFilterEl.appendChild(tagButton);

			// 添加点击事件
			tagButton.addEventListener('click', async () => {
				let newSelectedTags: string[];

				if (this.selectedTags.includes(tag)) {
					// 移除标签
					newSelectedTags = this.selectedTags.filter(t => t !== tag);
					tagButton.removeClass('is-active');
				} else {
					// 添加标签
					newSelectedTags = [...this.selectedTags, tag];
					tagButton.addClass('is-active');
				}

				// 更新筛选状态
				await this.updateFilterState({
					selectedTags: newSelectedTags
				});

				// 重新渲染卡片列表
				this.renderCardList();
			});
		});
	}

	// 从卡片中提取标签 - 增强版支持frontmatter
	private extractTagsFromCards(cards: CardData[]): string[] {
		// 收集所有标签
		const tagSet = new Set<string>();

		cards.forEach(card => {
			if (card.type === 'file' && card.path) {
				// 从文件中提取标签
				const file = this.app.vault.getAbstractFileByPath(card.path) as TFile;
				if (file) {
					const cache = this.app.metadataCache.getFileCache(file);
					if (cache) {
						// 提取内联标签 (原有功能)
						if (cache.tags) {
							cache.tags.forEach(tag => {
								tagSet.add(tag.tag);
							});
						}

						// 提取frontmatter/文档属性标签 (新增功能)
						if (cache.frontmatter && cache.frontmatter.tags) {
							const frontmatterTags = cache.frontmatter.tags;
							this.extractFrontmatterTags(frontmatterTags, tagSet);
						}
					}
				}
			} else if (card.type === 'native' && card.content) {
				// 从文本内容中提取标签
				const tagRegex = /#[a-zA-Z0-9_-]+/g;
				const matches = card.content.match(tagRegex);
				if (matches) {
					matches.forEach(tag => tagSet.add(tag));
				}
			}
		});

		// 转换为数组并排序
		return Array.from(tagSet).sort();
	}

	// 提取frontmatter标签的辅助方法
	private extractFrontmatterTags(frontmatterTags: any, tagSet: Set<string>): void {
		if (Array.isArray(frontmatterTags)) {
			// 处理数组格式: tags: [tag1, tag2, tag3]
			frontmatterTags.forEach(tag => {
				if (typeof tag === 'string' && tag.trim()) {
					// 确保标签以#开头，保持一致性
					const normalizedTag = tag.startsWith('#') ? tag : `#${tag}`;
					tagSet.add(normalizedTag);
				}
			});
		} else if (typeof frontmatterTags === 'string') {
			// 处理字符串格式: tags: "tag1, tag2, tag3" 或 tags: tag1
			const tagStrings = frontmatterTags.split(',');
			tagStrings.forEach(tag => {
				const trimmedTag = tag.trim();
				if (trimmedTag) {
					// 确保标签以#开头，保持一致性
					const normalizedTag = trimmedTag.startsWith('#') ? trimmedTag : `#${trimmedTag}`;
					tagSet.add(normalizedTag);
				}
			});
		}
	}

	// 创建原生Obsidian样式的标签元素
	private createNativeTagElement(tag: string, isActive: boolean = false): HTMLElement {
		// 创建标签容器，使用Obsidian原生标签样式
		const tagEl = document.createElement('a');
		tagEl.className = `tag ${isActive ? 'is-active' : ''}`;
		tagEl.setAttribute('href', tag);
		tagEl.setAttribute('data-tag-name', tag.replace('#', ''));
		tagEl.setAttribute('target', '_blank');
		tagEl.setAttribute('rel', 'noopener');

		// 设置标签文本
		tagEl.textContent = tag;

		// 添加点击样式和交互
		tagEl.style.cursor = 'pointer';
		tagEl.style.textDecoration = 'none';

		// 阻止默认链接行为
		tagEl.addEventListener('click', (e) => {
			e.preventDefault();
			e.stopPropagation();
		});

		return tagEl;
	}

	// 优先显示文档支持的节点
	private prioritizeDocumentBackedNodes(cards: CardData[]): CardData[] {
		// 将卡片分为文件卡和原生卡
		const fileCards = cards.filter(card => card.type === 'file');
		const nativeCards = cards.filter(card => card.type === 'native');

		// 文件卡优先，然后是原生卡
		// 在每个类别内保持原有的排序
		return [...fileCards, ...nativeCards];
	}

	// 渲染卡片标签
	private renderCardTags(container: HTMLElement, card: CardData): void {
		// 获取卡片的标签
		const tags = this.getCardTags(card);

		if (tags.length === 0) {
			return; // 没有标签就不显示标签区域
		}

		// 创建标签容器
		const tagsContainer = container.createDiv('card-tags');

		// 限制显示的标签数量，避免界面过于拥挤
		const maxTagsToShow = 3;
		const tagsToShow = tags.slice(0, maxTagsToShow);
		const hasMoreTags = tags.length > maxTagsToShow;

		// 渲染标签
		tagsToShow.forEach(tag => {
			const tagElement = this.createNativeTagElement(tag, false);
			tagElement.classList.add('card-tag'); // 添加卡片标签特定样式
			tagsContainer.appendChild(tagElement);
		});

		// 如果有更多标签，显示省略号
		if (hasMoreTags) {
			const moreIndicator = tagsContainer.createSpan('card-tags-more');
			moreIndicator.setText(`+${tags.length - maxTagsToShow}`);
			moreIndicator.setAttribute('title', `还有 ${tags.length - maxTagsToShow} 个标签: ${tags.slice(maxTagsToShow).join(', ')}`);
		}
	}

	// 防抖渲染函数 - 性能优化
	private debounceRenderCardList = debounce(() => {
		this.renderCardList();
	}, 300);

	// 缓存变量 - 性能优化
	private cardCache: Map<string, CardData[]> = new Map();
	private lastCacheUpdate: number = 0;
	private readonly CACHE_DURATION = 30000; // 30秒缓存

	// 清理缓存
	private clearCache() {
		this.cardCache.clear();
		this.lastCacheUpdate = 0;
	}

	// 检查缓存是否有效
	private isCacheValid(): boolean {
		return Date.now() - this.lastCacheUpdate < this.CACHE_DURATION;
	}

	// 更新选择器选项（文件夹和画布）
	private updateSelectorOptions() {
		// 清除现有选项
		this.canvasSelector.innerHTML = '';

		// 添加文件夹选项
		this.addFolderOptions();

		// 添加分隔符
		const separator = this.canvasSelector.createEl('option', {
			text: '--- 画布文件 ---',
			attr: { disabled: 'true' }
		});
		separator.style.fontStyle = 'italic';

		// 添加画布文件选项
		this.addCanvasOptions();
	}

	// 添加文件夹选项
	private addFolderOptions() {
		// 添加根目录选项
		this.canvasSelector.createEl('option', {
			text: '📁 根目录',
			value: 'folder:'
		});

		// 获取所有文件夹
		const folders = this.getFolderStructure();

		// 添加文件夹选项
		folders.forEach(folder => {
			this.canvasSelector.createEl('option', {
				text: `📁 ${folder.name} (${folder.fileCount})`,
				value: `folder:${folder.path}`
			});
		});
	}

	// 添加画布选项 - 增强版本，按文件夹组织
	private addCanvasOptions() {
		// 获取所有 canvas 文件
		const canvasFiles = this.app.vault.getFiles().filter(file => file.extension === 'canvas');

		if (canvasFiles.length === 0) {
			this.canvasSelector.createEl('option', {
				text: '(没有找到画布文件)',
				value: '',
				attr: { disabled: 'true' }
			});
			return;
		}

		// 按文件夹组织画布文件
		const canvasByFolder = this.organizeCanvasByFolder(canvasFiles);

		// 添加根目录的画布文件
		if (canvasByFolder.has('')) {
			const rootCanvases = canvasByFolder.get('')!;
			this.addCanvasGroup('根目录', rootCanvases);
		}

		// 添加其他文件夹的画布文件
		const sortedFolders = Array.from(canvasByFolder.keys())
			.filter(folder => folder !== '')
			.sort();

		sortedFolders.forEach(folderPath => {
			const canvases = canvasByFolder.get(folderPath)!;
			const folderName = folderPath.split('/').pop() || folderPath;
			this.addCanvasGroup(folderName, canvases);
		});
	}

	// 按文件夹组织画布文件
	private organizeCanvasByFolder(canvasFiles: TFile[]): Map<string, TFile[]> {
		const canvasByFolder = new Map<string, TFile[]>();

		canvasFiles.forEach(file => {
			const folderPath = file.parent?.path || '';

			if (!canvasByFolder.has(folderPath)) {
				canvasByFolder.set(folderPath, []);
			}
			canvasByFolder.get(folderPath)!.push(file);
		});

		// 对每个文件夹内的画布按修改时间排序（最新的在前）
		canvasByFolder.forEach(canvases => {
			canvases.sort((a, b) => b.stat.mtime - a.stat.mtime);
		});

		return canvasByFolder;
	}

	// 添加画布组（文件夹分组）
	private addCanvasGroup(groupName: string, canvases: TFile[]) {
		// 添加分组标题（如果不是第一组）
		if (this.canvasSelector.options.length > 1) { // 已有文件夹选项
			const separator = this.canvasSelector.createEl('option', {
				text: `--- ${groupName} (${canvases.length}) ---`,
				attr: { disabled: 'true' }
			});
			separator.style.fontStyle = 'italic';
			separator.style.color = 'var(--text-muted)';
		}

		// 添加该组的画布文件
		canvases.forEach(async (file) => {
			const modifiedDate = new Date(file.stat.mtime).toLocaleDateString();
			const nodeCount = await this.getCanvasNodeCount(file);

			let displayText = `🎨 ${file.basename}`;
			if (nodeCount > 0) {
				displayText += ` (${nodeCount}节点, ${modifiedDate})`;
			} else {
				displayText += ` (${modifiedDate})`;
			}

			const option = this.canvasSelector.createEl('option', {
				text: displayText,
				value: file.path
			});

			// 添加详细的工具提示信息
			const tooltipInfo = [
				`路径: ${file.path}`,
				`节点数量: ${nodeCount}`,
				`文件大小: ${this.formatFileSize(file.stat.size)}`,
				`创建时间: ${new Date(file.stat.ctime).toLocaleString()}`,
				`修改时间: ${new Date(file.stat.mtime).toLocaleString()}`
			];
			option.title = tooltipInfo.join('\n');
		});
	}

	// 获取画布节点数量
	private async getCanvasNodeCount(canvasFile: TFile): Promise<number> {
		try {
			const content = await this.app.vault.read(canvasFile);
			const canvasData = JSON.parse(content);
			return canvasData.nodes ? canvasData.nodes.length : 0;
		} catch (error) {
			console.warn(`Failed to read canvas file ${canvasFile.path}:`, error);
			return 0;
		}
	}

	// 格式化文件大小
	private formatFileSize(bytes: number): string {
		if (bytes === 0) return '0 B';
		const k = 1024;
		const sizes = ['B', 'KB', 'MB', 'GB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
	}

	// 获取文件夹结构
	private getFolderStructure(): FolderNode[] {
		const folders: FolderNode[] = [];
		const allFiles = this.app.vault.getMarkdownFiles();
		const folderMap = new Map<string, number>();

		// 统计每个文件夹的文件数量
		allFiles.forEach(file => {
			const pathParts = file.path.split('/');
			if (pathParts.length > 1) {
				// 文件在子文件夹中
				const folderPath = pathParts.slice(0, -1).join('/');
				folderMap.set(folderPath, (folderMap.get(folderPath) || 0) + 1);
			}
		});

		// 创建文件夹节点
		folderMap.forEach((fileCount, folderPath) => {
			const folderName = folderPath.split('/').pop() || folderPath;
			folders.push({
				path: folderPath,
				name: folderName,
				children: [], // 暂时不实现嵌套结构
				fileCount: fileCount
			});
		});

		// 按名称排序
		return folders.sort((a, b) => a.name.localeCompare(b.name));
	}

	// 高级筛选系统 - 组合所有筛选条件
	private async getFilteredCards(): Promise<CardData[]> {
		// 1. 获取基础卡片集合
		let baseCards: CardData[] = [];

		if (this.currentFilterMode === 'folder') {
			baseCards = await this.getFolderCards();
		} else if (this.currentFilterMode === 'canvas' && this.selectedCanvasPath) {
			baseCards = await this.getCanvasCards(this.selectedCanvasPath);
		}

		// 2. 应用组合筛选
		return this.applyAdvancedFilters(baseCards);
	}

	// 应用高级组合筛选
	private applyAdvancedFilters(cards: CardData[]): CardData[] {
		let filteredCards = [...cards];

		// 应用搜索筛选（优先级最高，因为通常最具选择性）
		if (this.searchQuery.trim()) {
			filteredCards = this.filterCardsBySearch(filteredCards, this.searchQuery);
		}

		// 应用标签筛选（支持多标签AND/OR逻辑）
		if (this.selectedTags.length > 0) {
			filteredCards = this.filterCardsByTagsAdvanced(filteredCards, this.selectedTags);
		}

		// 应用内容类型筛选（如果有其他筛选条件）
		filteredCards = this.filterByContentType(filteredCards);

		return filteredCards;
	}

	// 高级标签筛选（支持AND/OR逻辑）
	private filterCardsByTagsAdvanced(cards: CardData[], tags: string[]): CardData[] {
		return cards.filter(card => {
			const cardTags = this.getCardTags(card);

			// 默认使用OR逻辑：卡片包含任一选中标签即显示
			// 可以扩展为支持AND逻辑的高级模式
			return tags.some(selectedTag =>
				cardTags.some(cardTag =>
					cardTag.toLowerCase().includes(selectedTag.toLowerCase().replace('#', ''))
				)
			);
		});
	}

	// 按内容类型筛选
	private filterByContentType(cards: CardData[]): CardData[] {
		// 可以根据需要添加更多内容类型筛选
		// 例如：只显示有标签的卡片、只显示最近修改的卡片等
		return cards;
	}

	// 筛选结果统计和分析
	private getFilterStats(originalCards: CardData[], filteredCards: CardData[]): FilterStats {
		const stats: FilterStats = {
			total: originalCards.length,
			filtered: filteredCards.length,
			fileCards: filteredCards.filter(c => c.type === 'file').length,
			nativeCards: filteredCards.filter(c => c.type === 'native').length,
			taggedCards: filteredCards.filter(c => this.getCardTags(c).length > 0).length
		};

		return stats;
	}

	private async renderCardList() {
		this.cardListEl.empty();

		// 使用高级筛选系统
		const cardsToShow = await this.getFilteredCards();

		// 应用文档节点优先筛选
		const prioritizedCards = this.plugin.settings.prioritizeDocumentNodes
			? this.prioritizeDocumentBackedNodes(cardsToShow)
			: cardsToShow;

		// 更新筛选状态显示
		this.updateFilterStatusDisplay();

		// 如果没有卡片，显示空状态
		if (prioritizedCards.length === 0) {
			const emptyState = this.cardListEl.createDiv('card-library-empty');
			emptyState.createDiv('card-library-empty-icon').setText('📝');
			let emptyText = '没有找到匹配的卡片';
			if (this.searchQuery.trim()) {
				emptyText = `没有找到包含 "${this.searchQuery}" 的卡片`;
			} else if (this.selectedTags.length > 0) {
				emptyText = `没有找到包含标签 ${this.selectedTags.join(', ')} 的卡片`;
			} else if (this.currentFilterMode === 'canvas') {
				emptyText = '该画布中没有卡片';
			} else {
				emptyText = '没有找到笔记';
			}
			emptyState.createSpan().setText(emptyText);
			return;
		}

		// 根据设置排序卡片
		const sortedCards = this.sortCards(prioritizedCards);

		// 限制显示数量
		const maxCards = this.plugin.settings.maxCardsPerView;
		const cardsToDisplay = sortedCards.slice(0, maxCards);

		// 创建卡片项
		cardsToDisplay.forEach((card, index) => {
			const cardItem = this.cardListEl.createDiv({
				cls: `card-library-item ${card.type === 'native' ? 'native-card-item' : ''}`,
				attr: {
					'data-path': card.path || '',
					'data-type': card.type,
					'data-id': card.id,
					'draggable': 'true',
					'title': card.path || card.content || '', // 悬停提示
					// 可访问性属性
					'role': 'button',
					'tabindex': '0',
					'aria-label': this.getCardAriaLabel(card),
					'aria-describedby': `card-${index}-description`
				}
			});

			// 创建卡片内容容器
			const cardContent = cardItem.createDiv('card-content');

			// 创建标题元素
			const cardTitle = cardContent.createDiv('card-title');
			cardTitle.setText(card.title);

			// 添加标签显示
			this.renderCardTags(cardContent, card);

			// 创建隐藏的描述元素（用于屏幕阅读器）
			const cardDescription = cardItem.createDiv({
				cls: 'sr-only',
				attr: {
					'id': `card-${index}-description`
				}
			});
			cardDescription.setText(this.getCardDescription(card, index));

			// 添加点击事件
			const handleCardActivation = (event: Event) => {
				// 如果是拖拽开始，不触发点击
				if (cardItem.classList.contains('dragging')) return;

				if (card.type === 'file' && card.path) {
					// 打开文件笔记
					this.app.workspace.openLinkText(card.path, '', false);
				} else if (card.type === 'native' && card.canvasId) {
					// 打开画布并定位到节点
					this.app.workspace.openLinkText(card.canvasId, '', false);
				}
				event.preventDefault();
			};

			cardItem.addEventListener('click', handleCardActivation);

			// 添加键盘导航支持
			cardItem.addEventListener('keydown', (event) => {
				if (event.key === 'Enter' || event.key === ' ') {
					handleCardActivation(event);
				}
			});
		});

		// 如果有更多卡片未显示，添加提示
		if (sortedCards.length > maxCards) {
			const moreInfo = this.cardListEl.createDiv('card-library-more-info');
			moreInfo.setText(`显示 ${maxCards}/${sortedCards.length} 个卡片`);
		}

		// 更新标签筛选器（在渲染完成后）
		this.updateTagFilter();

		// 设置拖拽事件监听
		this.setupDragHandling();
	}

	// 根据搜索查询筛选卡片
	private filterCardsBySearch(cards: CardData[], query: string): CardData[] {
		const lowerQuery = query.toLowerCase();
		return cards.filter(card => {
			return card.title.toLowerCase().includes(lowerQuery) ||
				   (card.path && card.path.toLowerCase().includes(lowerQuery)) ||
				   (card.content && card.content.toLowerCase().includes(lowerQuery));
		});
	}

	// 根据标签筛选卡片
	private filterCardsByTags(cards: CardData[], tags: string[]): CardData[] {
		return cards.filter(card => {
			// 获取卡片的标签
			const cardTags = this.getCardTags(card);
			// 检查是否包含所有选中的标签
			return tags.every(tag => cardTags.includes(tag));
		});
	}

	// 获取卡片的标签 - 增强版支持frontmatter
	private getCardTags(card: CardData): string[] {
		const tags: string[] = [];

		if (card.type === 'file' && card.path) {
			// 从文件中获取标签
			const file = this.app.vault.getAbstractFileByPath(card.path) as TFile;
			if (file) {
				const cache = this.app.metadataCache.getFileCache(file);
				if (cache) {
					// 获取内联标签 (原有功能)
					if (cache.tags) {
						cache.tags.forEach(tag => {
							tags.push(tag.tag);
						});
					}

					// 获取frontmatter/文档属性标签 (新增功能)
					if (cache.frontmatter && cache.frontmatter.tags) {
						const frontmatterTags = cache.frontmatter.tags;
						const tagSet = new Set<string>();
						this.extractFrontmatterTags(frontmatterTags, tagSet);
						tags.push(...Array.from(tagSet));
					}
				}
			}
		} else if (card.type === 'native' && card.content) {
			// 从文本内容中提取标签
			const tagRegex = /#[a-zA-Z0-9_-]+/g;
			const matches = card.content.match(tagRegex);
			if (matches) {
				tags.push(...matches);
			}
		}

		return tags;
	}

	// 获取文件夹卡片（基于选定文件夹的文件卡）
	private async getFolderCards(): Promise<CardData[]> {
		let notesToProcess: TFile[];

		if (this.selectedFolderPath === null || this.selectedFolderPath === '') {
			// 如果没有选择文件夹，显示根目录的文件
			notesToProcess = this.app.vault.getMarkdownFiles().filter(file =>
				!file.path.includes('/')
			);
		} else {
			// 获取选定文件夹中的文件
			notesToProcess = this.app.vault.getMarkdownFiles().filter(file =>
				file.path.startsWith(this.selectedFolderPath + '/')
			);
		}

		// 性能优化：限制处理的文件数量
		const maxFiles = this.plugin.settings.maxCardsPerView;
		const limitedNotes = notesToProcess.slice(0, maxFiles * 2); // 预留一些余量用于筛选

		return limitedNotes.map(note => {
			// 提取文件标签
			const cache = this.app.metadataCache.getFileCache(note);
			const tags: string[] = [];

			if (cache) {
				// 提取内联标签
				if (cache.tags) {
					cache.tags.forEach(tag => {
						tags.push(tag.tag);
					});
				}

				// 提取frontmatter标签
				if (cache.frontmatter && cache.frontmatter.tags) {
					const tagSet = new Set<string>();
					this.extractFrontmatterTags(cache.frontmatter.tags, tagSet);
					tags.push(...Array.from(tagSet));
				}
			}

			return {
				id: note.path,
				type: 'file' as const,
				title: this.plugin.settings.showFileExtensions
					? note.basename
					: note.basename.replace('.md', ''),
				path: note.path,
				tags: tags,
				lastModified: note.stat.mtime
			};
		});
	}

	// 获取全局卡片（所有文件卡）- 保留用于兼容性
	private async getGlobalCards(): Promise<CardData[]> {
		const allNotes = this.app.vault.getMarkdownFiles();

		// 性能优化：限制处理的文件数量
		const maxFiles = this.plugin.settings.maxCardsPerView;
		const notesToProcess = allNotes.slice(0, maxFiles * 2);

		return notesToProcess.map(note => {
			// 提取文件标签
			const cache = this.app.metadataCache.getFileCache(note);
			const tags: string[] = [];

			if (cache) {
				// 提取内联标签
				if (cache.tags) {
					cache.tags.forEach(tag => {
						tags.push(tag.tag);
					});
				}

				// 提取frontmatter标签
				if (cache.frontmatter && cache.frontmatter.tags) {
					const tagSet = new Set<string>();
					this.extractFrontmatterTags(cache.frontmatter.tags, tagSet);
					tags.push(...Array.from(tagSet));
				}
			}

			return {
				id: note.path,
				type: 'file' as const,
				title: this.plugin.settings.showFileExtensions
					? note.basename
					: note.basename.replace('.md', ''),
				path: note.path,
				tags: tags,
				lastModified: note.stat.mtime
			};
		});
	}

	// 获取画布卡片（文件卡 + 原生卡）- 增强错误处理
	private async getCanvasCards(canvasPath: string): Promise<CardData[]> {
		// 边界情况：检查路径是否有效
		if (!canvasPath || typeof canvasPath !== 'string') {
			console.warn('Invalid canvas path provided:', canvasPath);
			return [];
		}

		const canvasFile = this.app.vault.getAbstractFileByPath(canvasPath) as TFile;
		if (!canvasFile) {
			console.warn('Canvas file not found:', canvasPath);
			return [];
		}

		try {
			const content = await this.app.vault.read(canvasFile);

			// 边界情况：检查文件内容是否为空
			if (!content || content.trim() === '') {
				console.warn('Canvas file is empty:', canvasPath);
				return [];
			}

			let canvasData: CanvasData;
			try {
				canvasData = JSON.parse(content) as CanvasData;
			} catch (parseError) {
				console.error('Invalid JSON in canvas file:', canvasPath, parseError);
				return [];
			}

			// 边界情况：检查数据结构
			if (!canvasData || !Array.isArray(canvasData.nodes)) {
				console.warn('Invalid canvas data structure:', canvasPath);
				return [];
			}

			const cards: CardData[] = [];

			canvasData.nodes.forEach((node, index) => {
				try {
					// 边界情况：检查节点基本属性
					if (!node || !node.id || !node.type) {
						console.warn(`Invalid node at index ${index} in canvas:`, canvasPath);
						return;
					}

					if (node.type === 'file' && node.file) {
						// 文件卡 - 增强验证
						if (typeof node.file !== 'string' || node.file.trim() === '') {
							console.warn(`Invalid file path in node ${node.id}:`, node.file);
							return;
						}

						// 提取文件标签
						const file = this.app.vault.getAbstractFileByPath(node.file) as TFile;
						const tags: string[] = [];

						if (file) {
							const cache = this.app.metadataCache.getFileCache(file);
							if (cache) {
								// 提取内联标签
								if (cache.tags) {
									cache.tags.forEach(tag => {
										tags.push(tag.tag);
									});
								}

								// 提取frontmatter标签
								if (cache.frontmatter && cache.frontmatter.tags) {
									const tagSet = new Set<string>();
									this.extractFrontmatterTags(cache.frontmatter.tags, tagSet);
									tags.push(...Array.from(tagSet));
								}
							}
						}

						const fileName = node.file.split('/').pop()?.replace('.md', '') || node.file;
						cards.push({
							id: `${canvasPath}#${node.id}`,
							type: 'file',
							title: this.plugin.settings.showFileExtensions
								? fileName + '.md'
								: fileName,
							path: node.file,
							tags: tags,
							lastModified: canvasFile.stat.mtime
						});
					} else if (node.type === 'text' && node.text) {
						// 原生卡 - 增强验证
						if (typeof node.text !== 'string' || node.text.trim() === '') {
							console.warn(`Invalid text content in node ${node.id}`);
							return;
						}

						// 从文本内容中提取标签
						const tags: string[] = [];
						const tagRegex = /#[a-zA-Z0-9_-]+/g;
						const matches = node.text.match(tagRegex);
						if (matches) {
							tags.push(...matches);
						}

						const title = node.text.length > 50
							? node.text.substring(0, 50) + '...'
							: node.text;
						cards.push({
							id: `${canvasPath}#${node.id}`,
							type: 'native',
							title: title.trim(),
							content: node.text,
							canvasId: canvasPath,
							tags: tags,
							lastModified: canvasFile.stat.mtime
						});
					}
				} catch (nodeError) {
					console.error(`Error processing node ${index} in canvas ${canvasPath}:`, nodeError);
				}
			});

			return cards;
		} catch (error) {
			console.error('Error reading canvas file:', canvasPath, error);
			return [];
		}
	}

	// 根据设置对卡片进行排序
	private sortCards(cards: CardData[]): CardData[] {
		const { defaultSortBy } = this.plugin.settings;

		return [...cards].sort((a, b) => {
			switch (defaultSortBy) {
				case 'title':
					return a.title.localeCompare(b.title);
				case 'modified':
					return b.lastModified - a.lastModified; // 最近修改的优先
				case 'created':
					return b.lastModified - a.lastModified; // 使用修改时间作为创建时间的替代
				default:
					return 0;
			}
		});
	}

	// 根据设置对笔记进行排序（保留用于兼容性）
	private sortNotes(notes: TFile[]): TFile[] {
		const { defaultSortBy } = this.plugin.settings;

		return [...notes].sort((a, b) => {
			switch (defaultSortBy) {
				case 'title':
					return a.basename.localeCompare(b.basename);
				case 'modified':
					return b.stat.mtime - a.stat.mtime; // 最近修改的优先
				case 'created':
					return b.stat.ctime - a.stat.ctime; // 最近创建的优先
				default:
					return 0;
			}
		});
	}

	private setupDragHandling() {
		// 拖拽开始事件 - 增强版本
		this.registerDomEvent(this.containerEl, 'dragstart', (evt) => {
			const target = evt.target as HTMLElement;
			if (target.classList.contains('card-library-item')) {
				const path = target.dataset.path;
				const type = target.dataset.type;
				const cardId = target.dataset.id;

				// 验证拖拽数据
				if (!this.validateDragData(target)) {
					evt.preventDefault();
					this.showDragError('无效的卡片数据');
					return;
				}

				if (evt.dataTransfer) {
					// 准备拖拽数据
					const dragData = this.prepareDragData(target, type, path, cardId);

					// 设置拖拽数据
					evt.dataTransfer.setData('text/plain', dragData.textData);
					evt.dataTransfer.setData('application/json', JSON.stringify(dragData.jsonData));

					// 设置拖拽效果
					evt.dataTransfer.effectAllowed = 'copy';

					// 添加拖拽样式和反馈
					this.applyDragStartStyles(target);

					// 创建增强的拖拽预览
					this.createEnhancedDragImage(target, evt.dataTransfer, type);

					// 显示拖拽提示
					this.showDragHint(type);
				}
			}
		});

		// 拖拽结束事件 - 增强版本
		this.registerDomEvent(this.containerEl, 'dragend', (evt) => {
			const target = evt.target as HTMLElement;
			if (target.classList.contains('card-library-item')) {
				// 恢复原始样式
				this.resetDragStyles(target);

				// 移除所有拖拽提示
				this.clearDragHints();

				// 根据拖拽结果显示反馈
				if (evt.dataTransfer?.dropEffect === 'copy') {
					this.showDragSuccess();
				}
			}
		});

		// 鼠标悬停事件（增强用户体验）
		this.registerDomEvent(this.containerEl, 'mouseover', (evt) => {
			const target = evt.target as HTMLElement;
			if (target.classList.contains('card-library-item')) {
				target.style.cursor = 'grab';
			}
		});

		// 鼠标按下事件
		this.registerDomEvent(this.containerEl, 'mousedown', (evt) => {
			const target = evt.target as HTMLElement;
			if (target.classList.contains('card-library-item')) {
				target.style.cursor = 'grabbing';
			}
		});

		// 鼠标释放事件
		this.registerDomEvent(this.containerEl, 'mouseup', (evt) => {
			const target = evt.target as HTMLElement;
			if (target.classList.contains('card-library-item')) {
				target.style.cursor = 'grab';
			}
		});
	}

	// 验证拖拽数据
	private validateDragData(target: HTMLElement): boolean {
		const type = target.dataset.type;
		const path = target.dataset.path;
		const id = target.dataset.id;

		if (!type || !id) return false;

		if (type === 'file' && (!path || path.trim() === '')) return false;
		if (type === 'native' && !target.textContent?.trim()) return false;

		return true;
	}

	// 准备拖拽数据
	private prepareDragData(target: HTMLElement, type: string | undefined, path: string | undefined, cardId: string | undefined) {
		const title = target.textContent || '';

		const jsonData = {
			type: type || 'file',
			path: path,
			title: title,
			id: cardId,
			content: type === 'native' ? title : undefined
		};

		const textData = type === 'file' && path ? `[[${path}]]` : title;

		return { jsonData, textData };
	}

	// 应用拖拽开始样式
	private applyDragStartStyles(target: HTMLElement) {
		target.classList.add('dragging');
		target.style.opacity = '0.7';
		target.style.transform = 'scale(0.95)';
	}

	// 创建增强的拖拽预览
	private createEnhancedDragImage(target: HTMLElement, dataTransfer: DataTransfer, type: string | undefined) {
		const dragImage = target.cloneNode(true) as HTMLElement;

		// 增强拖拽预览样式
		dragImage.style.position = 'absolute';
		dragImage.style.top = '-1000px';
		dragImage.style.left = '-1000px';
		dragImage.style.opacity = '0.9';
		dragImage.style.transform = 'rotate(3deg) scale(1.05)';
		dragImage.style.boxShadow = '0 8px 16px rgba(0,0,0,0.3)';
		dragImage.style.borderRadius = '8px';
		dragImage.style.zIndex = '9999';

		// 添加类型指示器
		const typeIndicator = document.createElement('div');
		typeIndicator.style.position = 'absolute';
		typeIndicator.style.top = '-5px';
		typeIndicator.style.right = '-5px';
		typeIndicator.style.width = '20px';
		typeIndicator.style.height = '20px';
		typeIndicator.style.borderRadius = '50%';
		typeIndicator.style.fontSize = '12px';
		typeIndicator.style.display = 'flex';
		typeIndicator.style.alignItems = 'center';
		typeIndicator.style.justifyContent = 'center';

		if (type === 'file') {
			typeIndicator.style.backgroundColor = '#4CAF50';
			typeIndicator.textContent = '📄';
		} else {
			typeIndicator.style.backgroundColor = '#2196F3';
			typeIndicator.textContent = '📝';
		}

		dragImage.appendChild(typeIndicator);
		document.body.appendChild(dragImage);

		dataTransfer.setDragImage(dragImage, 20, 20);

		// 清理拖拽预览
		setTimeout(() => {
			if (document.body.contains(dragImage)) {
				document.body.removeChild(dragImage);
			}
		}, 0);
	}

	// 显示拖拽提示
	private showDragHint(type: string | undefined) {
		const hint = document.createElement('div');
		hint.className = 'drag-hint';
		hint.style.position = 'fixed';
		hint.style.top = '20px';
		hint.style.right = '20px';
		hint.style.padding = '8px 12px';
		hint.style.backgroundColor = 'var(--background-primary)';
		hint.style.border = '1px solid var(--background-modifier-border)';
		hint.style.borderRadius = '6px';
		hint.style.fontSize = '12px';
		hint.style.zIndex = '10000';
		hint.style.opacity = '0.9';

		const cardType = type === 'file' ? '文件卡片' : '原生卡片';
		hint.textContent = `拖拽 ${cardType} 到画布`;

		document.body.appendChild(hint);

		// 自动移除提示
		setTimeout(() => {
			if (document.body.contains(hint)) {
				document.body.removeChild(hint);
			}
		}, 2000);
	}

	// 显示拖拽错误
	private showDragError(message: string) {
		const error = document.createElement('div');
		error.className = 'drag-error';
		error.style.position = 'fixed';
		error.style.top = '20px';
		error.style.right = '20px';
		error.style.padding = '8px 12px';
		error.style.backgroundColor = '#f44336';
		error.style.color = 'white';
		error.style.borderRadius = '6px';
		error.style.fontSize = '12px';
		error.style.zIndex = '10000';

		error.textContent = message;
		document.body.appendChild(error);

		// 自动移除错误提示
		setTimeout(() => {
			if (document.body.contains(error)) {
				document.body.removeChild(error);
			}
		}, 3000);
	}

	// 重置拖拽样式
	private resetDragStyles(target: HTMLElement) {
		target.classList.remove('dragging');
		target.style.opacity = '';
		target.style.transform = '';
		target.style.cursor = 'grab';
	}

	// 清理拖拽提示
	private clearDragHints() {
		const hints = document.querySelectorAll('.drag-hint, .drag-error, .drag-success');
		hints.forEach(hint => {
			if (document.body.contains(hint)) {
				document.body.removeChild(hint);
			}
		});
	}

	// 显示拖拽成功
	private showDragSuccess() {
		const success = document.createElement('div');
		success.className = 'drag-success';
		success.style.position = 'fixed';
		success.style.top = '20px';
		success.style.right = '20px';
		success.style.padding = '8px 12px';
		success.style.backgroundColor = '#4CAF50';
		success.style.color = 'white';
		success.style.borderRadius = '6px';
		success.style.fontSize = '12px';
		success.style.zIndex = '10000';

		success.textContent = '✓ 卡片已添加到画布';
		document.body.appendChild(success);

		// 自动移除成功提示
		setTimeout(() => {
			if (document.body.contains(success)) {
				document.body.removeChild(success);
			}
		}, 2000);
	}
}

// =======================================================
// ==              设置选项卡类                        ==
// =======================================================
class VisualKnowledgeWorkbenchSettingTab extends PluginSettingTab {
	plugin: VisualKnowledgeWorkbenchPlugin;

	constructor(app: App, plugin: VisualKnowledgeWorkbenchPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		containerEl.createEl('h2', {text: 'Visual Knowledge Workbench 设置'});

		new Setting(containerEl)
			.setName('卡片库位置')
			.setDesc('选择卡片库在侧边栏的位置')
			.addDropdown(dropdown => dropdown
				.addOption('left', '左侧边栏')
				.addOption('right', '右侧边栏')
				.setValue(this.plugin.settings.cardLibraryPosition)
				.onChange(async (value: 'left' | 'right') => {
					this.plugin.settings.cardLibraryPosition = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('默认排序方式')
			.setDesc('设置卡片的默认排序方式')
			.addDropdown(dropdown => dropdown
				.addOption('title', '按标题')
				.addOption('modified', '按修改时间')
				.addOption('created', '按创建时间')
				.setValue(this.plugin.settings.defaultSortBy)
				.onChange(async (value: 'title' | 'modified' | 'created') => {
					this.plugin.settings.defaultSortBy = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('显示文件扩展名')
			.setDesc('在卡片标题中显示 .md 扩展名')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.showFileExtensions)
				.onChange(async (value) => {
					this.plugin.settings.showFileExtensions = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('每页最大卡片数')
			.setDesc('设置单页显示的最大卡片数量')
			.addSlider(slider => slider
				.setLimits(100, 5000, 100)
				.setValue(this.plugin.settings.maxCardsPerView)
				.setDynamicTooltip()
				.onChange(async (value) => {
					this.plugin.settings.maxCardsPerView = value;
					await this.plugin.saveSettings();
				}));
	}
}
