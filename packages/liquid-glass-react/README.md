# @specy/liquid-glass-react

React wrapper for [@specy/liquid-glass](https://github.com/Specy/liquid-glass) - A Three.js powered glass effect component that recreates apple's liquid glass .

## Installation

```bash
npm install @specy/liquid-glass-react
```

## Basic Usage
Initialization is expensive, try to minimize re-renders and unnecessary unmouts.

```tsx
import React, { useMemo } from 'react';
import { LiquidGlass } from '@specy/liquid-glass-react';

function App() {
  // ⚠️ IMPORTANT: Memoize the glassStyle object to prevent unnecessary re-renders
  const glassStyle = useMemo(() => ({
    depth: 0.5,
    segments: 32,
    radius: 0.2,
    roughness: 0.1,
    transmission: 1,
    reflectivity: 0.5,
    ior: 1.5,
    dispersion: 0.1,
    thickness: 0.5
  }), []);

  return (
    <LiquidGlass
      glassStyle={glassStyle}
      wrapperStyle={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        width: 'fit-content',\
        margin: '0 auto',
      }}
      style={`padding: 1rem;`}
    >
      <div>
        <h1>Hello World!</h1>
        <p>This content is rendered inside the liquid glass effect.</p>
      </div>
    </LiquidGlass>
  );
}
```

## Advanced Usage with Ref

```tsx
import React, { useRef, useMemo, useCallback } from 'react';
import { LiquidGlass, type LiquidGlassRef } from '@specy/liquid-glass-react';

function AdvancedExample() {
  const glassRef = useRef<LiquidGlassRef>(null);

  // ⚠️ IMPORTANT: Memoize all objects and callbacks
  const glassStyle = useMemo(() => ({
    depth: 0.8,
    segments: 64,
    radius: 0.3,
    transmission: 0.95,
    roughness: 0.05
  }), []);

  const onReady = useCallback((instance) => {
    console.log('LiquidGlass instance ready:', instance);
  }, []);

  const handleUpdateScreenshot = useCallback(async () => {
    await glassRef.current?.updateScreenshot();
  }, []);

  const handleUpdateStyle = useCallback(() => {
    glassRef.current?.updateGlassStyle({
      depth: Math.random(),
      transmission: 0.8 + Math.random() * 0.2
    });
  }, []);

  return (
    <div>
      <LiquidGlass
        ref={glassRef}
        glassStyle={glassStyle}
        onReady={onReady}
      >
        <div style={{ padding: '30px' }}>
          <h2>Interactive Glass Effect</h2>
          <button onClick={handleUpdateScreenshot}>
            Update Screenshot
          </button>
          <button onClick={handleUpdateStyle}>
            Randomize Style
          </button>
        </div>
      </LiquidGlass>
    </div>
  );
}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `style` | `string` | `''` | Custom CSS styles to apply to the glass container |
| `wrapperStyle` | `React.CSSProperties` | `{}` | React CSS properties to apply to the wrapper div |
| `glassStyle` | `GlassStyle` | `{}` | Glass material properties (see GlassStyle interface) |
| `children` | `React.ReactNode` | `undefined` | Content to render inside the glass container |
| `onReady` | `(instance: LiquidGlass) => void` | `undefined` | Callback when the liquid glass instance is ready |
| `targetElement` | `HTMLElement` | `document.body` | The target element to capture for the glass background effect |

## GlassStyle Interface

```tsx
interface GlassStyle {
  depth?: number;        // Depth of the glass effect (0-1)
  segments?: number;     // Number of geometry segments for smoothness
  radius?: number;       // Border radius (0-1)
  tint?: number | null;  // Color tint (hex number or null)
  roughness?: number;    // Surface roughness (0-1)
  transmission?: number; // Light transmission (0-1)
  reflectivity?: number; // Surface reflectivity (0-1)
  ior?: number;         // Index of refraction
  dispersion?: number;   // Chromatic dispersion effect
  thickness?: number;   // Glass thickness
}
```

## Ref Methods

The component exposes several methods through the ref:

```tsx
interface LiquidGlassRef {
  getInstance(): LiquidGlass | null;
  updateScreenshot(): Promise<void>;
  forceUpdate(): Promise<void>;
  updateGlassStyle(style: Partial<GlassStyle>): void;
  getGlassStyle(): Required<GlassStyle> | null;
  getElement(): HTMLElement | null;
  getContent(): HTMLDivElement | null;
}
```

## Contributing

Issues and pull requests are welcome at the [main repository](https://github.com/Specy/liquid-glass).
