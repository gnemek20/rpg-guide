'use client'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState, type TransitionEvent } from 'react'
import { sceneOf, type SceneKey } from '@/lib/nav'
import s from './scene.module.css'

type Engine = { setScene: (k: SceneKey) => void; dispose: () => void }

/** 루트 레이아웃에 한 번만 올라가는 배경. 페이지를 옮겨도 캔버스는 그대로 두고 씬만 바꾼다. */
export default function SceneCanvas() {
  const pathname = usePathname()
  const canvas = useRef<HTMLCanvasElement>(null)
  const engine = useRef<Engine | null>(null)
  const [on, setOn] = useState(false)
  const key = sceneOf(pathname)
  const keyRef = useRef(key)
  keyRef.current = key
  const shownKey = useRef<SceneKey | null>(null)

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
        shownKey.current = keyRef.current
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

  // 씬이 바뀌면 먼저 어둡게 만든다. 실제 교체는 어두워지는 transition 이 끝난 뒤(아래 onEnd)에 한다
  useEffect(() => {
    if (engine.current && shownKey.current !== key) setOn(false)
  }, [key])

  const onEnd = (e: TransitionEvent) => {
    if (e.propertyName !== 'opacity' || !engine.current) return
    if (shownKey.current !== keyRef.current) {
      // 다 어두워졌다: 가장 최근에 요청된 씬으로 바꾸고 다시 밝힌다
      engine.current.setScene(keyRef.current)
      shownKey.current = keyRef.current
      setOn(true)
    }
  }
  // 어두워지는 도중에 원래 씬으로 돌아온 경우: 바꿀 것이 없으니 그 자리에서 다시 밝힌다
  useEffect(() => {
    if (engine.current && shownKey.current === key && !on) setOn(true)
  }, [key, on])

  return (
    <div className={s.wrap} aria-hidden="true">
      <canvas ref={canvas} className={s.canvas} data-on={on} onTransitionEnd={onEnd} />
      <div className={s.shade} />
    </div>
  )
}
