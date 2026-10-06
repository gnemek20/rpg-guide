'use client'
import { useCallback, useEffect, useState } from 'react'

/**
 * 주소의 쿼리 값 하나를 상태로 쓴다 (shallow).
 * 바꿀 때는 replaceState로 주소만 고치므로 라우트를 다시 불러오지 않고,
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
    return () => window.removeEventListener('popstate', read)
  }, [key, initial])

  const set = useCallback(
    (next: string) => {
      setValue(next)
      const url = new URL(window.location.href)
      if (next && next !== initial) url.searchParams.set(key, next)
      else url.searchParams.delete(key)
      window.history.replaceState(null, '', url)
    },
    [key, initial],
  )
  return [value, set, ready]
}
