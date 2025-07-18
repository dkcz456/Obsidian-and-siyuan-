// Jest setup file
import 'jest-dom/extend-expect';

// Mock DOM methods
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock HTMLElement methods
HTMLElement.prototype.createEl = function(tag: string, options?: any) {
  const el = document.createElement(tag);
  if (options?.text) el.textContent = options.text;
  if (options?.cls) el.className = options.cls;
  if (options?.attr) {
    Object.entries(options.attr).forEach(([key, value]) => {
      el.setAttribute(key, value as string);
    });
  }
  this.appendChild(el);
  return el;
};

HTMLElement.prototype.createDiv = function(cls?: string) {
  const div = document.createElement('div');
  if (cls) div.className = cls;
  this.appendChild(div);
  return div;
};

HTMLElement.prototype.createSpan = function(options?: any) {
  const span = document.createElement('span');
  if (options?.text) span.textContent = options.text;
  if (options?.cls) span.className = options.cls;
  this.appendChild(span);
  return span;
};

HTMLElement.prototype.empty = function() {
  this.innerHTML = '';
};

HTMLElement.prototype.addClass = function(cls: string) {
  this.classList.add(cls);
};

HTMLElement.prototype.removeClass = function(cls: string) {
  this.classList.remove(cls);
};

HTMLElement.prototype.setText = function(text: string) {
  this.textContent = text;
};
