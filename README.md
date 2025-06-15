# @specy/liquid-glass

An apple styled liquid glass effect for the web. A pretty weird attempt at making liquid glass for the web.

## Installation

```bash
npm install @specy/liquid-glass
```

## Basic Usage

```typescript
import { LiquidGlass } from '@specy/liquid-glass';

// Create a glass effect on an element
const glassEffect = new LiquidGlass(
  document.body, // Target element
  {
    // html2canvas options for screenshot
    allowTaint: true,
    useCORS: true,
    scale: 1,
  },
  `
    /* Custom CSS for the glass container */
    position: fixed;
    bottom: 1rem;
    left: 50%;
    transform: translateX(-50%);
    padding: 1rem 2rem;
    border-radius: 16px;
  `,
  {
    // Glass style options
    radius: 16,
    roughness: 0.2,
    transmission: 1,
    ior: 1.5,
    thickness: 32,
  }
);

// Add the glass effect to the DOM
document.body.appendChild(glassEffect.element);

// Add content to the glass container
const content = document.createElement('div');
content.innerHTML = '<h1>Hello, Glass World!</h1>';
glassEffect.content.appendChild(content);
```

## API Reference

### LiquidGlass

The main class for creating glass effects.

#### Constructor

```typescript
new LiquidGlass(
  targetElement: HTMLElement,
  screenshotOptions?: Partial<Options>,
  customStyle?: string,
  glassStyle?: GlassStyle
)
```

**Parameters:**

- `targetElement`: The HTML element to capture for the background effect
- `screenshotOptions`: Options for html2canvas screenshot capture
- `customStyle`: Custom CSS styles for the glass container
- `glassStyle`: Glass material properties

#### Glass Style Options

```typescript
interface GlassStyle {
  depth?: number;      // Geometry depth (default: 32)
  segments?: number;   // Geometry segments (default: 32)
  radius?: number;     // Border radius (default: 16)
  tint?: number | null; // Glass tint color (default: null)
  roughness?: number;  // Surface roughness 0-1 (default: 0.3)
  transmission?: number; // Light transmission 0-1 (default: 1)
  ior?: number;        // Index of refraction (default: 2)
  thickness?: number;  // Glass thickness (default: 64)
}
```

#### Properties

- `element`: The main glass container element
- `content`: The content container element for adding child elements

#### Methods

- `destroy()`: Clean up and remove the glass effect

### PillGeometry

Custom Three.js geometry for creating pill-shaped (rounded rectangle) objects.

```typescript
import { PillGeometry } from '@specy/liquid-glass';

const geometry = new PillGeometry(width, height, depth, segments, radius);
```

### takeElementScreenshot

Utility function for taking screenshots of DOM elements.

```typescript
import { takeElementScreenshot } from '@specy/liquid-glass';

const canvas = await takeElementScreenshot(element, {
  allowTaint: true,
  useCORS: true,
  scale: 1
});
```
## Development

To build the package locally:

```bash
npm install
npm run build
```

To watch for changes during development:

```bash
npm run build:watch
```

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
