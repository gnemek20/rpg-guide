'use client'
import { useCallback, useEffect, useRef, useState, type TransitionEvent } from 'react'

/**
 * 나타나고 사라지는 요소용. 효과는 전부 CSS transition 으로 만들고,
 * 사라질 때는 transition 이 끝난 것(transitionend)을 신호로 삼아 DOM 에서 뺀다.
 * 도중에 다시 열리면 그 자리에서 되돌아간다.
 *
 * 쓰는 법: mounted 일 때만 그리고, data-shown={shown} 으로 CSS 상태를 바꾸고, onTransitionEnd 를 건다.
 */
export function usePresence(open: boolean) {
  const [mounted, setMounted] = useState(open)
  const [shown, setShown] = useState(false)
  const wasShown = useRef(false)
  const openRef = useRef(open)
  openRef.current = open

  useEffect(() => {
    if (open) {
      setMounted(true)
      // 닫힌 모습으로 한 번 그려진 뒤에 열린 상태로 바꿔야 transition 이 걸린다
      let b = 0
      const a = requestAnimationFrame(() => { b = requestAnimationFrame(() => { wasShown.current = true; setShown(true) }) })
      return () => { cancelAnimationFrame(a); cancelAnimationFrame(b) }
    }
    setShown(false)
    // 열리기도 전에 닫혔다면 transition 이 일어나지 않으므로 바로 뺀다
    if (!wasShown.current) setMounted(false)
  }, [open])

  const onTransitionEnd = useCallback((e: TransitionEvent) => {
    if (e.target !== e.currentTarget) return
    if (!openRef.current) { wasShown.current = false; setMounted(false) }
  }, [])

  return { mounted, shown, onTransitionEnd }
}
