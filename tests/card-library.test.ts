import { CardLibraryView } from '../main';
import { App, TFile, WorkspaceLeaf } from 'obsidian';
import VisualKnowledgeWorkbenchPlugin from '../main';

// 模拟 Obsidian API
const mockApp = {
    vault: {
        getMarkdownFiles: jest.fn().mockReturnValue([
            { path: 'test1.md', basename: 'test1', stat: { mtime: 1000, ctime: 900 } },
            { path: 'test2.md', basename: 'test2', stat: { mtime: 2000, ctime: 1900 } }
        ]),
        getFiles: jest.fn().mockReturnValue([
            { path: 'test1.md', basename: 'test1', extension: 'md', stat: { mtime: 1000, ctime: 900 } },
            { path: 'test2.md', basename: 'test2', extension: 'md', stat: { mtime: 2000, ctime: 1900 } },
            { path: 'test.canvas', basename: 'test', extension: 'canvas', stat: { mtime: 3000, ctime: 2900 } }
        ]),
        getAbstractFileByPath: jest.fn().mockImplementation((path) => {
            if (path === 'test.canvas') {
                return { path: 'test.canvas', basename: 'test', stat: { mtime: 3000, ctime: 2900 } };
            }
            return null;
        }),
        read: jest.fn().mockImplementation((file) => {
            if (file.path === 'test.canvas') {
                return Promise.resolve(JSON.stringify({
                    nodes: [
                        { id: 'node1', type: 'file', file: 'test1.md', x: 100, y: 100, width: 400, height: 400 },
                        { id: 'node2', type: 'text', text: 'Test text', x: 200, y: 200, width: 250, height: 60 }
                    ],
                    edges: []
                }));
            }
            return Promise.resolve('');
        })
    },
    metadataCache: {
        getFileCache: jest.fn().mockImplementation((file) => {
            if (file.path === 'test1.md') {
                return {
                    tags: [{ tag: '#test', position: { start: { line: 0, col: 0 }, end: { line: 0, col: 5 } } }]
                };
            }
            return null;
        })
    },
    workspace: {
        getActiveViewOfType: jest.fn(),
        getLeavesOfType: jest.fn().mockReturnValue([]),
        getLeftLeaf: jest.fn().mockReturnValue({ setViewState: jest.fn() }),
        getRightLeaf: jest.fn().mockReturnValue({ setViewState: jest.fn() }),
        revealLeaf: jest.fn(),
        detachLeavesOfType: jest.fn()
    }
} as unknown as App;

// 模拟 WorkspaceLeaf
const mockLeaf = {
    view: {}
} as unknown as WorkspaceLeaf;

// 模拟插件
const mockPlugin = {
    app: mockApp,
    settings: {
        cardLibraryPosition: 'right',
        defaultSortBy: 'modified',
        showFileExtensions: false,
        maxCardsPerView: 1000,
        enableVirtualScrolling: true,
        autoSaveInterval: 2000
    }
} as unknown as VisualKnowledgeWorkbenchPlugin;

describe('CardLibraryView', () => {
    let cardLibraryView: CardLibraryView;

    beforeEach(() => {
        // 重置所有模拟函数
        jest.clearAllMocks();
        
        // 创建 CardLibraryView 实例
        cardLibraryView = new CardLibraryView(mockLeaf, mockPlugin);
        
        // 模拟 DOM 元素
        cardLibraryView['containerEl'] = {
            children: [null, document.createElement('div')],
            createEl: jest.fn().mockImplementation((tag, options) => {
                const el = document.createElement(tag);
                if (options?.text) el.textContent = options.text;
                if (options?.cls) el.className = options.cls;
                return el;
            }),
            addEventListener: jest.fn(),
            removeEventListener: jest.fn()
        } as any;
        
        cardLibraryView['cardListEl'] = document.createElement('div');
        cardLibraryView['filterEl'] = document.createElement('div');
        cardLibraryView['tagFilterEl'] = document.createElement('div');
        cardLibraryView['searchEl'] = document.createElement('input');
        cardLibraryView['canvasSelector'] = document.createElement('select');
    });

    test('getGlobalCards should return all markdown files as cards', async () => {
        const cards = await cardLibraryView['getGlobalCards']();
        
        expect(cards).toHaveLength(2);
        expect(cards[0].type).toBe('file');
        expect(cards[0].title).toBe('test1');
        expect(cards[0].path).toBe('test1.md');
        expect(cards[1].title).toBe('test2');
    });

    test('getCanvasCards should parse canvas file and return cards', async () => {
        const cards = await cardLibraryView['getCanvasCards']('test.canvas');
        
        expect(cards).toHaveLength(2);
        expect(cards[0].type).toBe('file');
        expect(cards[0].path).toBe('test1.md');
        expect(cards[1].type).toBe('native');
        expect(cards[1].content).toBe('Test text');
    });

    test('sortCards should sort cards by title', () => {
        const cards = [
            { id: '1', type: 'file' as const, title: 'B', lastModified: 1000, tags: [] },
            { id: '2', type: 'file' as const, title: 'A', lastModified: 2000, tags: [] }
        ];
        
        const plugin = { ...mockPlugin, settings: { ...mockPlugin.settings, defaultSortBy: 'title' } };
        cardLibraryView['plugin'] = plugin as any;
        
        const sortedCards = cardLibraryView['sortCards'](cards);
        
        expect(sortedCards[0].title).toBe('A');
        expect(sortedCards[1].title).toBe('B');
    });

    test('sortCards should sort cards by modified time', () => {
        const cards = [
            { id: '1', type: 'file' as const, title: 'A', lastModified: 1000, tags: [] },
            { id: '2', type: 'file' as const, title: 'B', lastModified: 2000, tags: [] }
        ];
        
        const plugin = { ...mockPlugin, settings: { ...mockPlugin.settings, defaultSortBy: 'modified' } };
        cardLibraryView['plugin'] = plugin as any;
        
        const sortedCards = cardLibraryView['sortCards'](cards);
        
        expect(sortedCards[0].title).toBe('B'); // 最近修改的优先
        expect(sortedCards[1].title).toBe('A');
    });

    test('filterCardsBySearch should filter cards by title', () => {
        const cards = [
            { id: '1', type: 'file' as const, title: 'Test A', path: 'testA.md', lastModified: 1000, tags: [] },
            { id: '2', type: 'file' as const, title: 'Example B', path: 'exampleB.md', lastModified: 2000, tags: [] }
        ];
        
        const filteredCards = cardLibraryView['filterCardsBySearch'](cards, 'test');
        
        expect(filteredCards).toHaveLength(1);
        expect(filteredCards[0].title).toBe('Test A');
    });

    test('filterCardsByTags should filter cards by tags', () => {
        const cards = [
            { id: '1', type: 'file' as const, title: 'A', path: 'A.md', lastModified: 1000, tags: ['#tag1'] },
            { id: '2', type: 'file' as const, title: 'B', path: 'B.md', lastModified: 2000, tags: ['#tag2'] }
        ];
        
        // 模拟 getCardTags 方法
        cardLibraryView['getCardTags'] = jest.fn().mockImplementation((card) => {
            return card.tags || [];
        });
        
        const filteredCards = cardLibraryView['filterCardsByTags'](cards, ['#tag1']);
        
        expect(filteredCards).toHaveLength(1);
        expect(filteredCards[0].title).toBe('A');
    });
});
