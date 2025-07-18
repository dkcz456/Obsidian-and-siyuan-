import { CanvasIntegration } from '../main';
import { App, TFile } from 'obsidian';

// 模拟 Obsidian API
const mockApp = {
    vault: {
        read: jest.fn().mockImplementation((file) => {
            if (file.path === 'test.canvas') {
                return Promise.resolve(JSON.stringify({
                    nodes: [
                        { id: 'node1', type: 'file', file: 'test1.md', x: 100, y: 100, width: 400, height: 400 }
                    ],
                    edges: []
                }));
            }
            return Promise.resolve('');
        }),
        modify: jest.fn().mockResolvedValue(undefined)
    },
    workspace: {
        getLeavesOfType: jest.fn().mockReturnValue([
            {
                view: {
                    containerEl: document.createElement('div'),
                    file: { path: 'test.canvas' },
                    canvas: {
                        wrapperEl: document.createElement('div'),
                        posFromEvt: jest.fn().mockReturnValue({ x: 150, y: 150 })
                    },
                    requestSave: jest.fn()
                }
            }
        ])
    }
} as unknown as App;

describe('CanvasIntegration', () => {
    let canvasIntegration: CanvasIntegration;

    beforeEach(() => {
        // 重置所有模拟函数
        jest.clearAllMocks();
        
        // 创建 CanvasIntegration 实例
        canvasIntegration = new CanvasIntegration(mockApp);
    });

    test('setupCanvasDropZones should add event listeners to canvas views', () => {
        const canvasEl = document.createElement('div');
        const leaf = {
            view: {
                containerEl: canvasEl
            }
        };

        // 模拟 addEventListener 方法
        const addEventListenerSpy = jest.spyOn(canvasEl, 'addEventListener');
        
        canvasIntegration['setupCanvasDropZone'](canvasEl, leaf);
        
        expect(addEventListenerSpy).toHaveBeenCalledWith('dragover', expect.any(Function));
        expect(addEventListenerSpy).toHaveBeenCalledWith('drop', expect.any(Function));
    });

    test('handleDragOver should prevent default and set dropEffect', () => {
        const event = {
            preventDefault: jest.fn(),
            dataTransfer: {
                dropEffect: ''
            },
            currentTarget: document.createElement('div')
        } as unknown as DragEvent;
        
        canvasIntegration['handleDragOver'](event);
        
        expect(event.preventDefault).toHaveBeenCalled();
        expect(event.dataTransfer?.dropEffect).toBe('copy');
        expect((event.currentTarget as HTMLElement).classList.contains('canvas-drop-zone-active')).toBe(true);
    });

    test('handleDrop should create canvas node for file card', async () => {
        const event = {
            preventDefault: jest.fn(),
            dataTransfer: {
                getData: jest.fn().mockImplementation((format) => {
                    if (format === 'application/json') {
                        return JSON.stringify({
                            type: 'file',
                            path: 'test1.md',
                            title: 'Test 1'
                        });
                    }
                    return '';
                })
            },
            clientX: 200,
            clientY: 200,
            currentTarget: document.createElement('div')
        } as unknown as DragEvent;
        
        const leaf = {
            view: {
                file: { path: 'test.canvas' },
                canvas: {
                    wrapperEl: document.createElement('div'),
                    posFromEvt: jest.fn().mockReturnValue({ x: 150, y: 150 })
                }
            }
        };
        
        // 模拟 generateNodeId 方法
        canvasIntegration['generateNodeId'] = jest.fn().mockReturnValue('new-node-id');
        
        // 模拟 addNodeToCanvas 方法
        canvasIntegration['addNodeToCanvas'] = jest.fn();
        
        await canvasIntegration['handleDrop'](event, leaf);
        
        expect(event.preventDefault).toHaveBeenCalled();
        expect(canvasIntegration['addNodeToCanvas']).toHaveBeenCalledWith(
            expect.objectContaining({
                id: 'new-node-id',
                type: 'file',
                file: 'test1.md',
                x: 150,
                y: 150,
                width: 400,
                height: 400
            }),
            leaf.view
        );
    });

    test('handleDrop should create canvas node for text card', async () => {
        const event = {
            preventDefault: jest.fn(),
            dataTransfer: {
                getData: jest.fn().mockImplementation((format) => {
                    if (format === 'application/json') {
                        return JSON.stringify({
                            type: 'native',
                            content: 'Test content',
                            title: 'Test Title'
                        });
                    }
                    return '';
                })
            },
            clientX: 200,
            clientY: 200,
            currentTarget: document.createElement('div')
        } as unknown as DragEvent;
        
        const leaf = {
            view: {
                file: { path: 'test.canvas' },
                canvas: {
                    wrapperEl: document.createElement('div'),
                    posFromEvt: jest.fn().mockReturnValue({ x: 150, y: 150 })
                }
            }
        };
        
        // 模拟 generateNodeId 方法
        canvasIntegration['generateNodeId'] = jest.fn().mockReturnValue('new-node-id');
        
        // 模拟 addNodeToCanvas 方法
        canvasIntegration['addNodeToCanvas'] = jest.fn();
        
        await canvasIntegration['handleDrop'](event, leaf);
        
        expect(event.preventDefault).toHaveBeenCalled();
        expect(canvasIntegration['addNodeToCanvas']).toHaveBeenCalledWith(
            expect.objectContaining({
                id: 'new-node-id',
                type: 'text',
                text: 'Test content',
                x: 150,
                y: 150,
                width: 250,
                height: 60
            }),
            leaf.view
        );
    });

    test('addNodeToCanvas should add node to canvas data and save', async () => {
        const node = {
            id: 'new-node-id',
            type: 'file',
            file: 'test1.md',
            x: 150,
            y: 150,
            width: 400,
            height: 400
        };
        
        const canvasView = {
            file: { path: 'test.canvas' },
            requestSave: jest.fn()
        };
        
        await canvasIntegration['addNodeToCanvas'](node, canvasView);
        
        expect(mockApp.vault.read).toHaveBeenCalledWith(canvasView.file);
        expect(mockApp.vault.modify).toHaveBeenCalledWith(
            canvasView.file,
            expect.stringContaining('new-node-id')
        );
        expect(canvasView.requestSave).toHaveBeenCalled();
    });

    test('generateNodeId should return a string of correct length', () => {
        const nodeId = canvasIntegration['generateNodeId']();
        
        expect(typeof nodeId).toBe('string');
        expect(nodeId.length).toBeGreaterThan(0);
    });
});
