import html2canvaspro, { type Options } from 'html2canvas-pro'
import html2canvas from 'html2canvas'

const DEBOUNCE_DELAY = 16;

interface ScreenshotCache {
  canvas: HTMLCanvasElement;
  lastUpdate: number;
  callbacks: Map<(canvas: HTMLCanvasElement) => void, (element: Node) => boolean>;
  mutationObserver?: MutationObserver;
  debounceTimeout?: number;
  pendingUpdate?: Promise<void>;
}

export class PaintLayerCache {
  private static instance: PaintLayerCache | null = null;
  private static screenshotCache = new Map<HTMLElement, ScreenshotCache>();
  private static html2canvas = html2canvaspro as typeof html2canvaspro | typeof html2canvas;

  private constructor() {}

  static getInstance(): PaintLayerCache {
    if (!PaintLayerCache.instance) {
      PaintLayerCache.instance = new PaintLayerCache();
    }
    return PaintLayerCache.instance;
  }

  static useHtml2CanvasPro(val: boolean) {
    if (val) {
      PaintLayerCache.html2canvas = html2canvaspro;
    } else {
      PaintLayerCache.html2canvas = html2canvas;
    }
  }

  async register(
    targetElement: HTMLElement,
    callback: (canvas: HTMLCanvasElement) => void,
    screenshotOptions: Partial<Options> = {},
    ignoreElementCallback: (element: Node) => boolean = () => false
  ): Promise<void> {
    // Initialize screenshot cache for this target element if it doesn't exist
    if (!PaintLayerCache.screenshotCache.has(targetElement)) {
      PaintLayerCache.screenshotCache.set(targetElement, {
        canvas: document.createElement('canvas'),
        lastUpdate: 0,
        callbacks: new Map(),
      });
    }

    // Add callback and ignore function
    const cache = PaintLayerCache.screenshotCache.get(targetElement)!;
    cache.callbacks.set(callback, ignoreElementCallback);

    // Set up mutation observer if this is the first callback for this target
    if (cache.callbacks.size === 1) {
      this.setupMutationObserver(targetElement);
    }    // If cache doesn't have a valid canvas yet, create initial screenshot
    if (!cache.canvas.width || !cache.canvas.height || cache.lastUpdate === 0) {
      // Wait for existing update if one is pending
      if (cache.pendingUpdate) {
        await cache.pendingUpdate;
        callback(cache.canvas);
      } else {
        await this.updateScreenshot(targetElement, screenshotOptions);
      }
    } else {
      // Use existing cached screenshot
      callback(cache.canvas);
    }
  }

  unregister(
    targetElement: HTMLElement,
    callback: (canvas: HTMLCanvasElement) => void
  ): void {
    const cache = PaintLayerCache.screenshotCache.get(targetElement);

    if (cache) {
      cache.callbacks.delete(callback);

      // If this was the last callback, clean up the shared resources
      if (cache.callbacks.size === 0) {
        if (cache.mutationObserver) {
          cache.mutationObserver.disconnect();
        }
        if (cache.debounceTimeout) {
          clearTimeout(cache.debounceTimeout);
        }
        PaintLayerCache.screenshotCache.delete(targetElement);
      }
    }
  }

  async forceUpdate(targetElement: HTMLElement, screenshotOptions: Partial<Options> = {}): Promise<void> {
    await this.updateScreenshot(targetElement, screenshotOptions);
  }

  private setupMutationObserver(targetElement: HTMLElement): void {
    const cache = PaintLayerCache.screenshotCache.get(targetElement);
    if (!cache) return;

    cache.mutationObserver = new MutationObserver((mutations) => {
      if (this.shouldIgnoreMutation(targetElement, mutations)) {
        return;
      }
      this.debouncedUpdate(targetElement);
    });

    cache.mutationObserver.observe(targetElement, {
      childList: true,
      subtree: true,
    });
  }

  private shouldIgnoreMutation(targetElement: HTMLElement, mutations: MutationRecord[]): boolean {
    const cache = PaintLayerCache.screenshotCache.get(targetElement);
    if (!cache || cache.callbacks.size === 0) return false;

    const first = mutations[0];
    const nodes = [
      ...first.addedNodes,
      ...first.removedNodes,
      ...(first.attributeName ? [first.target] : []),
    ];

    return nodes.some(element => {
      let currentElement: Node | null = element;
      while (currentElement) {
        // Check if element should be ignored by any of the callbacks
        for (const [, ignoreCallback] of cache.callbacks) {
          if (this.isIgnoredElementByCallback(currentElement, ignoreCallback)) {
            return true;
          }
        }
        currentElement = currentElement.parentNode;
      }
      return false;
    });
  }

  private isIgnoredElementByCallback(element: Node, callback: (element: Node) => boolean): boolean {
    if (element instanceof HTMLElement) {
      return (
        element.dataset.html2canvasIgnore === "true" ||
        element.classList.contains("html2canvas-ignore") ||
        element.classList.contains("html2canvas-container") ||
        element.textContent === 'Hidden Text' ||
        callback(element)
      );
    }
    return false;
  }

  private debouncedUpdate(targetElement: HTMLElement): void {
    const cache = PaintLayerCache.screenshotCache.get(targetElement);
    if (!cache) return;

    clearTimeout(cache.debounceTimeout);
    cache.debounceTimeout = setTimeout(() => {
      this.updateScreenshot(targetElement);
    }, DEBOUNCE_DELAY);
  }
  private async updateScreenshot(targetElement: HTMLElement, screenshotOptions: Partial<Options> = {}): Promise<void> {
    const cache = PaintLayerCache.screenshotCache.get(targetElement);
    if (!cache) return;

    // If update is already pending, return the existing promise
    if (cache.pendingUpdate) {
      return cache.pendingUpdate;
    }

    // Create and store the update promise
    cache.pendingUpdate = this.performScreenshotUpdate(targetElement, screenshotOptions);
    
    try {
      await cache.pendingUpdate;
    } finally {
      // Clear the pending promise when done
      cache.pendingUpdate = undefined;
    }
  }

  private async performScreenshotUpdate(targetElement: HTMLElement, screenshotOptions: Partial<Options> = {}): Promise<void> {
    const cache = PaintLayerCache.screenshotCache.get(targetElement);
    if (!cache) return;

    try {
      const canvas = await this.takeElementScreenshot(targetElement, screenshotOptions);

      cache.canvas = canvas;
      cache.lastUpdate = Date.now();

      // Notify all callbacks
      for (const [callback] of cache.callbacks) {
        callback(canvas);
      }
      console.log("Screenshot updated for target element");

    } catch (error) {
      console.error("Failed to update screenshot:", error);
      throw error;
    }
  }

  private async takeElementScreenshot(element: HTMLElement, options: Partial<Options> = {}): Promise<HTMLCanvasElement> {
    try {
      // Default options for best quality screenshot
      const defaultOptions: Partial<Options> = {
        allowTaint: true,
        useCORS: true,
        logging: false,
        scale: 1,
        ...options
      };

      console.log('took screenshot of', element);
      // Capture the specified element
      return await PaintLayerCache.html2canvas(
        element.tagName === 'BODY' ? (document.body.parentElement ?? element) : element,
      //@ts-ignore
        defaultOptions
      );

    } catch (error) {
      console.error('Error taking screenshot:', error);
      throw error;
    }
  }
}

export async function takeElementScreenshot(element: HTMLElement, options: Partial<Options> = {}) {
  const cache = PaintLayerCache.getInstance();
  return cache['takeElementScreenshot'](element, options);
}
