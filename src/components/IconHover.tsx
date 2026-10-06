'use client'
import { useEffect } from 'react'
import type { Seg, segments as SegFn } from '@/lib/pixel/shapes'

const NS = 'http://www.w3.org/2000/svg'
// 도형별 움직임: 쌓기(위에서 떨어져 조립), 물결(대각선으로 차례로 밀림), 밀기(줄마다 엇갈림), 흩기(바깥으로 튀었다 복귀)
const STACK = new Set(['block', 'chest', 'craft', 'anvil', 'house', 'sign', 'tower', 'island', 'book', 'scroll', 'paper', 'ingot', 'trophy', 'lantern', 'chat', 'helmet', 'chestplate', 'leggings', 'boots'])
const WAVE = new Set(['sword', 'pickaxe', 'axe', 'hoe', 'mace', 'rod', 'wand', 'fishingrod', 'feather', 'veg', 'shard'])
const SHEAR = new Set(['menu', 'close', 'arrow', 'search', 'chain', 'web', 'fish'])

function keyframes(shape: string, sg: Seg, i: number, n: number): [Keyframe[], number] {
  const cx = sg.x + sg.w / 2 - 8, cy = sg.y - 7.5
  if (STACK.has(shape))
    return [[{ transform: `translate(0,-${10 + (15 - sg.y) * 0.6}px)`, opacity: 0 }, { opacity: 1, offset: 0.5 }, { transform: 'none', opacity: 1 }], (15 - sg.y) * 22]
  if (WAVE.has(shape))
    return [[{ transform: 'none' }, { transform: 'translate(3px,-3px)', offset: 0.45 }, { transform: 'translate(-1px,1px)', offset: 0.8 }, { transform: 'none' }], (sg.x + (15 - sg.y)) * 12]
  if (SHEAR.has(shape))
    return [[{ transform: 'none' }, { transform: `translate(${sg.y % 2 ? 5 : -5}px,0)`, offset: 0.4 }, { transform: 'none' }], sg.y * 14]
  const k = 0.55 + ((i * 37) % 10) / 20
  return [[
    { transform: 'none' },
    { transform: `translate(${(cx * k).toFixed(1)}px,${(cy * k).toFixed(1)}px) rotate(${i % 2 ? 90 : -90}deg)`, offset: 0.42 },
    { transform: 'none' },
  ], (i / n) * 90]
}

function play(svg: SVGSVGElement, busy: WeakSet<Element>, segments: typeof SegFn) {
  if (busy.has(svg)) return
  const id = svg.dataset.ic
  if (!id) return
  const cut = id.indexOf('-')
  const shape = id.slice(0, cut), mat = id.slice(cut + 1)
  let g = svg.querySelector('g')
  const segs = segments(shape, mat)
  if (!g) {
    // 처음 올렸을 때만 선분으로 분해해 둔다
    g = document.createElementNS(NS, 'g')
    for (const sg of segs) {
      const r = document.createElementNS(NS, 'rect')
      r.setAttribute('x', String(sg.x)); r.setAttribute('y', String(sg.y))
      r.setAttribute('width', String(sg.w)); r.setAttribute('height', '1')
      r.setAttribute('fill', sg.c)
      g.appendChild(r)
    }
    svg.querySelector('use')?.setAttribute('display', 'none')
    svg.appendChild(g)
  }
  busy.add(svg)
  let longest = 0
  Array.from(g.children).forEach((el, i) => {
    const [frames, delay] = keyframes(shape, segs[i], i, segs.length)
    longest = Math.max(longest, delay + 420)
    el.animate(frames, { duration: 420, delay, easing: 'steps(6, end)', fill: 'backwards' })
  })
  window.setTimeout(() => busy.delete(svg), longest)
}

/** hover가 되는 기기에서만, data-hot 요소에 올리면 안의 아이콘이 선분 단위로 흩어졌다 조립된다. */
export default function IconHover() {
  useEffect(() => {
    if (!window.matchMedia('(hover: hover)').matches) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const busy = new WeakSet<Element>()
    // 도형 데이터는 첫 화면 이후에 따로 받는다
    let seg: typeof SegFn | null = null
    import('@/lib/pixel/shapes').then((m) => (seg = m.segments))
    const over = (e: PointerEvent) => {
      const host = (e.target as Element | null)?.closest?.('[data-hot]')
      if (!host || !seg) return
      const fn = seg
      const from = e.relatedTarget as Node | null
      if (from && host.contains(from)) return
      host.querySelectorAll<SVGSVGElement>('svg[data-ic]').forEach((svg) => play(svg, busy, fn))
    }
    document.addEventListener('pointerover', over, { passive: true })
    return () => document.removeEventListener('pointerover', over)
  }, [])
  return null
}
