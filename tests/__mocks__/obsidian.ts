// Mock for Obsidian API
export class Plugin {
    app: App;
    manifest: any;
    
    constructor(app: App, manifest: any) {
        this.app = app;
        this.manifest = manifest;
    }
    
    loadData() {
        return Promise.resolve({});
    }
    
    saveData(data: any) {
        return Promise.resolve();
    }
    
    registerView(type: string, viewCreator: any) {}
    
    addRibbonIcon(icon: string, title: string, callback: (evt: MouseEvent) => any) {
        return { addClass: (cls: string) => {} };
    }
    
    addStatusBarItem() {
        return document.createElement('div');
    }
    
    addCommand(command: any) {}
    
    addSettingTab(tab: any) {}
    
    registerDomEvent(el: HTMLElement, type: string, callback: (evt: any) => any) {}
    
    registerInterval(id: number) {}
}

export class ItemView {
    app: App;
    containerEl: HTMLElement;
    
    constructor(leaf: WorkspaceLeaf) {
        this.app = leaf.view.app;
        this.containerEl = document.createElement('div');
    }
    
    onOpen() {
        return Promise.resolve();
    }
    
    onClose() {
        return Promise.resolve();
    }
    
    getViewType() {
        return '';
    }
    
    getDisplayText() {
        return '';
    }
    
    getIcon() {
        return '';
    }
}

export class PluginSettingTab {
    app: App;
    plugin: Plugin;
    
    constructor(app: App, plugin: Plugin) {
        this.app = app;
        this.plugin = plugin;
    }
    
    display() {}
    
    hide() {}
}

export class Setting {
    settingEl: HTMLElement;
    
    constructor(containerEl: HTMLElement) {
        this.settingEl = document.createElement('div');
        containerEl.appendChild(this.settingEl);
    }
    
    setName(name: string) {
        return this;
    }
    
    setDesc(desc: string) {
        return this;
    }
    
    addText(cb: (text: any) => any) {
        return this;
    }
    
    addToggle(cb: (toggle: any) => any) {
        return this;
    }
    
    addDropdown(cb: (dropdown: any) => any) {
        return this;
    }
    
    addSlider(cb: (slider: any) => any) {
        return this;
    }
}

export class App {
    vault: Vault;
    workspace: Workspace;
    metadataCache: MetadataCache;
    
    constructor() {
        this.vault = new Vault();
        this.workspace = new Workspace();
        this.metadataCache = new MetadataCache();
    }
}

export class Vault {
    getMarkdownFiles() {
        return [];
    }
    
    getFiles() {
        return [];
    }
    
    getAbstractFileByPath(path: string) {
        return null;
    }
    
    read(file: TFile) {
        return Promise.resolve('');
    }
    
    modify(file: TFile, data: string) {
        return Promise.resolve();
    }
}

export class Workspace {
    getActiveViewOfType(type: any) {
        return null;
    }
    
    getLeavesOfType(type: string) {
        return [];
    }
    
    getLeftLeaf(active: boolean) {
        return null;
    }
    
    getRightLeaf(active: boolean) {
        return null;
    }
    
    revealLeaf(leaf: WorkspaceLeaf) {}
    
    detachLeavesOfType(type: string) {}
    
    openLinkText(text: string, sourcePath: string, newLeaf: boolean) {
        return null;
    }
    
    on(name: string, callback: (...args: any[]) => any) {
        return { unregister: () => {} };
    }
}

export class MetadataCache {
    getFileCache(file: TFile) {
        return null;
    }
}

export class TFile {
    path: string;
    basename: string;
    extension: string;
    stat: {
        mtime: number;
        ctime: number;
    };
    
    constructor(path: string, basename: string, extension: string) {
        this.path = path;
        this.basename = basename;
        this.extension = extension;
        this.stat = {
            mtime: Date.now(),
            ctime: Date.now()
        };
    }
}

export class WorkspaceLeaf {
    view: any;
    
    constructor() {
        this.view = {
            app: new App()
        };
    }
    
    setViewState(state: any) {
        return Promise.resolve();
    }
}

export class Notice {
    constructor(message: string, timeout?: number) {}
}

export class Modal {
    app: App;
    contentEl: HTMLElement;
    
    constructor(app: App) {
        this.app = app;
        this.contentEl = document.createElement('div');
    }
    
    open() {}
    
    close() {}
    
    onOpen() {}
    
    onClose() {}
}
