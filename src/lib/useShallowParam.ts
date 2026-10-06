'use client'
import { useCallback, useEffect, useState } from 'react'

let timer = 0
let pending: URL | null = null
/**
 * 주소만 조용히 바꾼다 (shallow).
 * - Next 가 덧씌운 history.replaceState 를 거치지 않고 원래 함수를 부른다. 라우터가 다시 그리지 않아 가장 빠르다.
 * - Next 가 history.state 에 넣어 둔 값은 그대로 넘겨서 뒤로 가기 복원이 깨지지 않게 한다.
 * - 입력 중에 연달아 불리면 마지막 것만 쓴다 (브라우저의 호출 횟수 제한 대비).
 */
export function writeUrl(mutate: (url: URL) => void) {
  const url = pending ?? new URL(window.location.href)
  mutate(url)
  pending = url
  window.clearTimeout(timer)
  timer = window.setTimeout(flushUrl, 120)
}
export function flushUrl() {
  window.clearTimeout(timer)
  if (!pending) return
  const url = pending
  pending = null
  // 그 사이 다른 페이지로 넘어갔다면 쓰지 않는다
  if (url.pathname !== window.location.pathname) return
  History.prototype.replaceState.call(window.history, window.history.state, '', url)
}

/**
 * 주소의 쿼리 값 하나를 상태로 쓴다.
 * 새로고침, 뒤로 가기, 링크 공유 때는 주소에서 값을 되읽는다.
 * 첫 렌더는 기본값으로 그려서 정적 HTML과 어긋나지 않게 한다.
 */
export function useShallowParam(key: string, initial = ''): [string, (v: string) => void, boolean] {
  const [value, setValue] = useState(initial)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const read = () => setValue(new URLSearchParams(window.location.search).get(key) ?? initial)
    read()
    setReady(true)
    window.addEventListener('popstate', read)
    return () => { window.removeEventListener('popstate', read); flushUrl() }
  }, [key, initial])

  const set = useCallback(
    (next: string) => {
      setValue(next)
      writeUrl((url) => {
        if (next && next !== initial) url.searchParams.set(key, next)
        else url.searchParams.delete(key)
      })
    },
    [key, initial],
  )
  return [value, set, ready]
}
