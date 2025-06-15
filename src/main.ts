import './style.css'
import { LiquidGlass } from '../packages/liquid-glass/src/LiquidGlass'

const glassEffect = new LiquidGlass(document.body, {
  allowTaint: true,
  useCORS: true,
  scale: 1, // Match device pixel ratio for better quality
  logging: false,
  backgroundColor: null, // Preserve original background colors
}, `
position: fixed;
bottom: 0.5rem;
width: fit-content;
max-width: calc(100vw - 1rem);
left: 0;
right: 0;
margin: 0 auto;
padding: 0.8rem 3rem;
overflow: hidden;
`, {

  radius: 22,
  depth: 36,
  segments: 32,
  roughness: 0.2,
})

document.body.appendChild(glassEffect.element)

const el = `
<div>
<h1 style='font-size: 1.8rem'>Liquid Glass</h1>
<p>
This is a demo for the Liquid Glass effect.
</p>
</div>
`

const element = document.createElement('div')
element.innerHTML = el

glassEffect.content.appendChild(element)

console.log(glassEffect.element)