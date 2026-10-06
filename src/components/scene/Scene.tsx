'use client'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { sceneOf } from '@/lib/nav'
import s from './scene.module.css'

type Engine = { setScene: (k: ReturnType<typeof sceneOf>) => void; dispose: () => void }

/** 루트 레이아웃에 한 번만 올라가는 배경. 페이지를 옮겨도 캔버스는 그대로 두고 씬만 바꾼다. */
export default function SceneCanvas() {
  const pathname = usePathname()
  const canvas = useRef<HTMLCanvasElement>(null)
  const engine = useRef<Engine | null>(null)
  const [on, setOn] = useState(false)
  const key = sceneOf(pathname)
  const keyRef = useRef(key)
  keyRef.current = key

  useEffect(() => {
    let dead = false
    const start = async () => {
      try {
        const { createEngine } = await import('./engine')
        if (dead || !canvas.current) return
        // 터치 기기, 좁은 화면, 동작 줄이기 설정에서는 한 장만 그려 둔다
        const animate = window.matchMedia('(hover: hover) and (min-width: 960px)').matches && !window.matchMedia('(prefers-reduced-motion: reduce)').matches
        engine.current = createEngine(canvas.current, { animate })
        engine.current.setScene(keyRef.current)
        setOn(true)
      } catch {
        // WebGL을 못 쓰는 환경: 배경색만 남긴다
      }
    }
    const idle = window.requestIdleCallback ?? ((f: () => void) => window.setTimeout(f, 200))
    const id = idle(start)
    return () => {
      dead = true
      ;(window.cancelIdleCallback ?? window.clearTimeout)(id as number)
      engine.current?.dispose()
      engine.current = null
    }
  }, [])

  useEffect(() => {
    if (!engine.current) return
    // 씬이 바뀔 때는 잠깐 어둡게 했다가 다시 밝힌다
    setOn(false)
    const t = window.setTimeout(() => {
      engine.current?.setScene(key)
      setOn(true)
    }, 140)
    return () => window.clearTimeout(t)
  }, [key])

  return (
    <div className={s.wrap} aria-hidden="true">
      <canvas ref={canvas} className={s.canvas} data-on={on} />
      <div className={s.shade} />
    </div>
  )
}
