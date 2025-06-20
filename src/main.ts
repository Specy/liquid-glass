import './style.css'
import { LiquidGlass, PaintLayerCache } from '../packages/liquid-glass/src/index'

// Configure the paint cache for better perf  ormance
PaintLayerCache.useHtml2CanvasPro(true)

const row = document.createElement('div')
row.style.cssText = `
display: flex;
align-items: center;
justify-content: space-between;
position: fixed;
bottom: 0.5rem;
width: fit-content;
max-width: calc(100vw - 1rem);
margin: 0 auto;
left: 0.5rem;
gap: 1rem;
right: 0.5rem;
  z-index: 1000;
`

document.body.appendChild(row)

// Left glass element (existing one)
const glassEffect1 = new LiquidGlass(
  document.body,
  `
  padding: 0.75rem 3rem;
  overflow: hidden;
  `,
  {
    radius: 22,
    depth: 24,
  }
)

const el = `
<a href="https://github.com/Specy/liquid-glass">
Star it on Github!
</a>
`

const element = document.createElement('div')
element.innerHTML = el
glassEffect1.content.appendChild(element)

// Right glass element (small circular one)
const glassEffect2 = new LiquidGlass(
  document.body,
  `
  width: 3rem;
  height: 3rem;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  `,
  {
    radius: 30,
    depth: 24,
  }
)

// Add icon/content to the circular glass element
const circleContent = document.createElement('div')
circleContent.innerHTML = '🖤'
circleContent.style.cssText = `
  font-size: 24px;
  color: rgba(255, 255, 255, 0.9);
  text-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
`
glassEffect2.content.appendChild(circleContent)

// Add both glass elements to the row
row.appendChild(glassEffect1.element)
row.appendChild(glassEffect2.element)


const target = document.getElementById('target')!

const targetElement = new LiquidGlass(
  target,
  `
  inset: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  position: absolute;
  `,
)
// Add the target element to the body
target.appendChild(targetElement.element)

targetElement.content.innerHTML = `
<h1>Liquid Glass Effect</h1>
<p>
  This is a demonstration of the liquid glass effect  
  </p>
<p>
`

//make the bottom bar bounnce up and down by 100px

let bounce = 0;

setInterval(() => {
  bounce += 0.01;
  const offset = Math.sin(bounce) * 100;
  row.style.bottom = `${0.5 + offset}px`;
  targetElement.forcePositionUpdate()
}, 16); // ~60 FPS