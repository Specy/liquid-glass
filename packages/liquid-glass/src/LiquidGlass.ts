import {
  WebGLRenderer,
  Scene,
  CanvasTexture,
  ClampToEdgeWrapping,
  Material,
  Mesh,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  OrthographicCamera,
  PlaneGeometry,
  type Texture,
} from "three";

import { PillGeometry } from "./PillGeometry";
import { PaintLayerCache } from "./PaintLayerCache";

// Constants
const DEFAULT_GLASS_STYLE = {
  depth: 24,
  segments: 86,
  radius: 16,
  tint: null as number | null,
  roughness: 0.3,
  transmission: 1,
  reflectivity: 0.9,
  ior: 2,
  thickness: 32,
  dispersion: 10,
} as const;

const DEFAULT_PIXEL_RATIO_LIMIT = 2;
const CAMERA_NEAR = 0.1;
const CAMERA_FAR = 20000;
const CAMERA_Z_POSITION = 512;

const FLOATING_DIV_STYLES = `
  position: relative;
  overflow: hidden;
`;

const CONTENT_ELEMENT_STYLES = `
  z-index: 10;
  position: relative;
`;

const THREE_CANVAS_STYLES = `
  width: 100%;
  height: 100%;
  display: block;
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
`;

export interface GlassStyle {
  depth?: number;
  segments?: number;
  radius?: number;
  tint?: number | null;
  roughness?: number;
  transmission?: number;
  reflectivity?: number;
  ior?: number;
  dispersion?: number;
  thickness?: number;
}

interface Dimensions {
  width: number;
  height: number;
}

interface ScrollbarSizes {
  x: number;
  y: number;
}

export class LiquidGlass {
  private readonly targetElement: HTMLElement;
  private readonly floatingDiv: HTMLDivElement;
  private readonly contentElement: HTMLDivElement;
  private readonly resizeObserver: ResizeObserver;
  private readonly customStyle: string;
  private glassStyle: Required<GlassStyle>;
  private readonly paintCache: PaintLayerCache;
  private paintCacheCallback: ((canvas: HTMLCanvasElement) => void) | null = null;

  // ThreeJS components
  private threeCanvas: HTMLCanvasElement | null = null;
  private renderer: WebGLRenderer | null = null;
  private scene: Scene | null = null;
  private camera: OrthographicCamera | null = null;
  private glassMesh: Mesh | null = null;
  private backgroundMesh: Mesh | null = null;
  private backgroundTexture: Texture | null = null;
  
  // State management
  private animationId: number | null = null;
  private isInitialized: boolean = false;

  constructor(
    targetElement: HTMLElement,
    customStyle: string = "",
    glassStyle: GlassStyle = {},
  ) {
    this.targetElement = targetElement;
    this.customStyle = customStyle;
    this.paintCache = PaintLayerCache.getInstance();

    this.glassStyle = this.createGlassStyle(glassStyle);
    this.contentElement = this.createContentElement();
    this.floatingDiv = this.createFloatingDiv();
    this.resizeObserver = this.createResizeObserver();

    this.initialize();
  }
  // Public getters
  get element(): HTMLElement {
    return this.floatingDiv;
  }

  get content(): HTMLDivElement {
    return this.contentElement;
  }

  // Private helper methods
  private createGlassStyle(glassStyle: GlassStyle): Required<GlassStyle> {
    const style = { ...DEFAULT_GLASS_STYLE, ...glassStyle };

    // Apply constraints
    style.radius = Math.min(style.radius, style.depth / 2);
    style.thickness = Math.min(style.thickness, style.depth * 2);

    return style;
  }

  private createContentElement(): HTMLDivElement {
    const contentElement = document.createElement("div");
    contentElement.style.cssText = CONTENT_ELEMENT_STYLES;
    return contentElement;
  }
  
  private createFloatingDiv(): HTMLDivElement {
    const div = document.createElement("div");
    div.setAttribute("data-html2canvas-ignore", "true");

    // Apply styles
    div.style.cssText = `
      ${FLOATING_DIV_STYLES}
      border-radius: calc(${this.glassStyle.radius}px * 2);
      ${this.customStyle}
    `;

    div.appendChild(this.contentElement);
    return div;
  }

  private createResizeObserver(): ResizeObserver {
    return new ResizeObserver(() => {
      this.handleResize();
    });
  }

  private handleResize(): void {
    if (
      !this.isInitialized ||
      !this.renderer ||
      !this.camera ||
      !this.threeCanvas
    )
      return;

    const { width, height } = this.getCurrentDimensions();

    this.updateRendererSize(width, height);
    this.updateCameraProjection(width, height);
    this.updateGlassGeometry(width, height);
    this.updateBackgroundPosition();
  }

  private getCurrentDimensions(): Dimensions {
    return {
      width: this.floatingDiv.clientWidth || 1,
      height: this.floatingDiv.clientHeight || 1,
    };
  }

  private updateRendererSize(width: number, height: number): void {
    if (this.renderer) {
      this.renderer.setSize(width, height);
    }
  }

  private updateCameraProjection(width: number, height: number): void {
    if (this.camera) {
      this.camera.left = -width / 2;
      this.camera.right = width / 2;
      this.camera.top = height / 2;
      this.camera.bottom = -height / 2;
      this.camera.updateProjectionMatrix();
    }
  }

  private updateGlassGeometry(width: number, height: number): void {
    if (this.glassMesh) {
      this.glassMesh.geometry.dispose();
      this.glassMesh.geometry = this.createPillGeometry(width, height);
    }
  }

  private createPillGeometry(width: number, height: number): PillGeometry {
    return new PillGeometry(
      width,
      height,
      this.glassStyle.depth,
      this.glassStyle.segments,
      this.glassStyle.radius,
    );
  }

  private async initialize(): Promise<void> {
    try {
      await this.initializeThreeJS();
      await this.registerWithPaintCache();
      this.resizeObserver.observe(this.floatingDiv);
      this.startAnimation();
      this.handleResize();
      this.addEventListeners();

      this.isInitialized = true;
      console.log("LiquidGlass initialized successfully");
    } catch (error) {
      console.error("Failed to initialize LiquidGlass:", error);
      throw error;
    }
  }
  private async registerWithPaintCache(): Promise<void> {
    this.paintCacheCallback = (canvas: HTMLCanvasElement) => {
      if (this.isInitialized) {
        this.updateBackgroundTexture(canvas);
      }
    };

    await this.paintCache.register(
      this.targetElement,
      this.paintCacheCallback
    );
  }

  private startAnimation(): void {
    const animate = () => {
      if (!this.renderer || !this.scene || !this.camera) return;

      this.renderer.render(this.scene, this.camera);
      this.animationId = requestAnimationFrame(animate);
    };
    animate();
  }

  private async initializeThreeJS(): Promise<void> {
    const { width, height } = this.getCurrentDimensions();

    this.createThreeCanvas();
    this.setupRenderer(width, height);
    this.setupCamera(width, height);
    this.setupScene();

    this.createGlassMesh(width, height);
  }

  private createThreeCanvas(): void {
    this.threeCanvas = document.createElement("canvas");
    this.threeCanvas.style.cssText = THREE_CANVAS_STYLES;
    this.floatingDiv.appendChild(this.threeCanvas);
  }

  private setupRenderer(width: number, height: number): void {
    if (!this.threeCanvas) throw new Error("Canvas not created");

    this.renderer = new WebGLRenderer({
      canvas: this.threeCanvas,
      alpha: true,
      antialias: true,
    });

    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(
      Math.min(window.devicePixelRatio, DEFAULT_PIXEL_RATIO_LIMIT),
    );
    this.renderer.setClearColor(0x000000, 0); // Transparent background
  }

  private setupCamera(width: number, height: number): void {
    this.camera = new OrthographicCamera(
      -width / 2,
      width / 2,
      height / 2,
      -height / 2,
      CAMERA_NEAR,
      CAMERA_FAR,
    );
    this.camera.position.set(0, 0, CAMERA_Z_POSITION);
  }

  private setupScene(): void {
    this.scene = new Scene();
  }

  private createGlassMesh(width: number, height: number): void {
    const glassGeometry = this.createPillGeometry(width, height);
    const glassMaterial = this.createGlassMaterial();

    this.glassMesh = new Mesh(glassGeometry, glassMaterial);
    this.glassMesh.position.set(0, 0, 0);

    this.scene?.add(this.glassMesh);
  }

  private createGlassMaterial(): MeshPhysicalMaterial {
    const material = new MeshPhysicalMaterial({
      roughness: this.glassStyle.roughness,
      transmission: this.glassStyle.transmission,
      thickness: this.glassStyle.thickness,
      ior: this.glassStyle.ior,
      reflectivity: this.glassStyle.reflectivity,
      dispersion: this.glassStyle.dispersion
    });
    if (typeof this.glassStyle.tint === "number") {
      material.color.set(this.glassStyle.tint);
    }

    return material;
  }

  private getTargetSize(): Dimensions {
    return {
      width: this.targetElement.scrollWidth,
      height: this.targetElement.scrollHeight,
    };
  }

  private getScrollbarSizes(): ScrollbarSizes {
    if (this.targetElement === document.body) {
      return {
        x: window.innerWidth - document.documentElement.clientWidth,
        y: window.innerHeight - document.documentElement.clientHeight,
      };
    }
    return {
      x: this.targetElement.offsetWidth - this.targetElement.clientWidth,
      y: this.targetElement.offsetHeight - this.targetElement.clientHeight,
    };
  }

  private updateBackgroundTexture(canvas: HTMLCanvasElement): void {
    this.disposeBackgroundTexture();

    this.backgroundTexture = new CanvasTexture(canvas);
    this.backgroundTexture.wrapS = ClampToEdgeWrapping;
    this.backgroundTexture.wrapT = ClampToEdgeWrapping;

    const sizes = this.getTargetSize();

    if (!this.backgroundMesh) {
      this.createBackgroundMesh(sizes);
    } else {
      this.updateExistingBackgroundMesh(sizes);
    }

    this.updateBackgroundPosition();
  }

  private disposeBackgroundTexture(): void {
    if (this.backgroundTexture) {
      this.backgroundTexture.dispose();
    }
  }

  private createBackgroundMesh(sizes: Dimensions): void {
    if (!this.backgroundTexture || !this.scene) return;

    const bgGeometry = new PlaneGeometry(sizes.width, sizes.height);
    const bgMaterial = new MeshBasicMaterial({
      map: this.backgroundTexture,
      transparent: false,
    });

    this.backgroundMesh = new Mesh(bgGeometry, bgMaterial);
    this.backgroundMesh.position.set(0, 0, -this.glassStyle.depth);
    this.scene.add(this.backgroundMesh);
  }

  private updateExistingBackgroundMesh(sizes: Dimensions): void {
    if (!this.backgroundMesh || !this.backgroundTexture) return;

    const material = this.backgroundMesh.material as MeshBasicMaterial;
    material.map = this.backgroundTexture;
    material.needsUpdate = true;

    this.backgroundMesh.geometry.dispose();
    this.backgroundMesh.geometry = new PlaneGeometry(sizes.width, sizes.height);
  }

  private updateBackgroundPosition(): void {
    if (
      !this.backgroundMesh ||
      !this.backgroundTexture ||
      !this.floatingDiv ||
      !this.camera
    )
      return;

    const floatingRect = this.floatingDiv.getBoundingClientRect();
    const scrollbarSize = this.getScrollbarSizes();

    const floatingCenter = {
      x: floatingRect.left + floatingRect.width / 2,
      y: floatingRect.top + floatingRect.height / 2,
    };

    const absolutePosition = {
      x: floatingCenter.x + window.scrollX,
      y: floatingCenter.y + window.scrollY,
    };

    const canvasSize = {
      width: this.backgroundTexture.image.width,
      height: this.backgroundTexture.image.height,
    };

    const offset = {
      x: absolutePosition.x - canvasSize.width / 2 + scrollbarSize.x / 2,
      y: absolutePosition.y - canvasSize.height / 2,
    };

    this.backgroundMesh.position.set(
      -offset.x,
      offset.y,
      -this.glassStyle.depth / 2,
    );
  }

  // Public methods
  public async updateScreenshot(): Promise<void> {
    await this.paintCache.forceUpdate(this.targetElement);
  }

  public async forceUpdate(): Promise<void> {
    await this.updateScreenshot();
  }

  public setSize(width: number, height: number): void {
    this.updateRendererSize(width, height);
    this.updateCameraProjection(width, height);
  }

  public updateGlassStyle(newGlassStyle: Partial<GlassStyle>): void {
    this.glassStyle = { ...this.glassStyle, ...newGlassStyle };

    this.updateGlassMaterial();
    this.updateGlassGeometryIfNeeded(newGlassStyle);
  }

  public getGlassStyle(): Required<GlassStyle> {
    return { ...this.glassStyle };
  }

  private updateGlassMaterial(): void {
    if (
      this.glassMesh &&
      this.glassMesh.material instanceof MeshPhysicalMaterial
    ) {
      const material = this.glassMesh.material;
      material.roughness = this.glassStyle.roughness;
      material.transmission = this.glassStyle.transmission;
      material.thickness = this.glassStyle.thickness;
      material.ior = this.glassStyle.ior;

      if (typeof this.glassStyle.tint === "number") {
        material.color.set(this.glassStyle.tint);
      }

      material.needsUpdate = true;
    }
  }

  private updateGlassGeometryIfNeeded(
    newGlassStyle: Partial<GlassStyle>,
  ): void {
    const geometryChanged =
      newGlassStyle.depth || newGlassStyle.segments || newGlassStyle.radius;

    if (this.glassMesh && geometryChanged) {
      const { width, height } = this.getCurrentDimensions();

      this.glassMesh.geometry.dispose();
      this.glassMesh.geometry = this.createPillGeometry(width, height);
    }
  }

  public destroy(): void {
    this.stopAnimation();
    this.cleanupThreeJS();
    this.unregisterFromPaintCache();
    this.removeEventListeners();
    this.resizeObserver.disconnect();
    this.removeDOMElements();

    this.isInitialized = false;
    console.log("LiquidGlass destroyed");
  }

  private stopAnimation(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  private cleanupThreeJS(): void {
    this.disposeRenderer();
    this.disposeTextures();
    this.disposeMeshes();
    this.clearThreeJSReferences();
  }

  private disposeRenderer(): void {
    if (this.renderer) {
      this.renderer.dispose();
      this.renderer = null;
    }
  }

  private disposeTextures(): void {
    if (this.backgroundTexture) {
      this.backgroundTexture.dispose();
      this.backgroundTexture = null;
    }
  }

  private disposeMeshes(): void {
    this.disposeMesh(this.glassMesh);
    this.disposeMesh(this.backgroundMesh);
    this.glassMesh = null;
    this.backgroundMesh = null;
  }

  private disposeMesh(mesh: Mesh | null): void {
    if (!mesh) return;

    mesh.geometry.dispose();
    if (mesh.material instanceof Material) {
      mesh.material.dispose();
    }
  }

  private clearThreeJSReferences(): void {
    this.scene = null;
    this.camera = null;
    this.threeCanvas = null;
  }

  private removeDOMElements(): void {
    if (this.floatingDiv.parentNode) {
      this.floatingDiv.parentNode.removeChild(this.floatingDiv);
    }
  }
  private unregisterFromPaintCache(): void {
    if (this.paintCacheCallback) {
      this.paintCache.unregister(this.targetElement, this.paintCacheCallback);
      this.paintCacheCallback = null;
    }
  }

  // Event handling
  private addEventListeners(): void {
    window.addEventListener("scroll", this.handleScroll, { passive: true });
    window.addEventListener("resize", this.handleWindowResize, {
      passive: true,
    });
  }

  private handleScroll = (): void => {
    this.updateBackgroundPosition();
  };

  private handleWindowResize = (): void => {
    this.handleResize();
  };

  private removeEventListeners(): void {
    window.removeEventListener("scroll", this.handleScroll);
    window.removeEventListener("resize", this.handleWindowResize);
  }
}
