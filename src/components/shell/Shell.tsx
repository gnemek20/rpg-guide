'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { NAV, navOf } from '@/lib/nav'
import { usePresence } from '@/lib/usePresence'
import { Icon, cx } from '../ui'
import Search from './Search'
import s from './shell.module.css'

const BAR = ['/', '/items/', '/tree/', '/monsters/']

/** 지나온 페이지의 이름. 상세 페이지는 구분해서 부른다 */
function labelOf(path: string): string {
  const n = navOf(path)
  if (/^\/items\/[^/]+/.test(path)) return '이전 아이템'
  if (/^\/(guide|notices)\/[^/]+/.test(path)) return `이전 ${n.label}`
  return n.label
}

export default function Shell({ children, siteName }: { children: ReactNode; siteName: string }) {
  const pathname = usePathname()
  const router = useRouter()
  const active = navOf(pathname).href
  const [menu, setMenu] = useState(false)
  const sheet = usePresence(menu)

  // 사이트 안에서 지나온 경로. 뒤로 가기 버튼에 "어디로 돌아가는지" 적기 위해 쌓아 둔다
  const stack = useRef<string[]>([])
  const last = useRef(pathname)
  const popping = useRef(false)
  const [back, setBack] = useState<string | null>(null)
  useEffect(() => {
    const pop = () => { popping.current = true }
    window.addEventListener('popstate', pop)
    return () => window.removeEventListener('popstate', pop)
  }, [])
  useEffect(() => {
    if (last.current !== pathname) {
      if (popping.current) {
        // 뒤로 간 경우: 돌아온 곳이 바로 아래 칸이면 한 칸 걷어 낸다. 아니면(앞으로 가기 등) 기록을 비운다
        if (stack.current[stack.current.length - 1] === pathname) stack.current.pop()
        else stack.current = []
      } else stack.current.push(last.current)
      last.current = pathname
    }
    popping.current = false
    const prev = stack.current[stack.current.length - 1]
    setBack(prev ? labelOf(prev) : null)
    setMenu(false)
  }, [pathname])

  useEffect(() => {
    document.documentElement.style.overflow = menu ? 'hidden' : ''
  }, [menu])

  const links = (onDark?: boolean) =>
    NAV.map((g) => (
      <div key={g.group} className={s.group}>
        <span className={s.groupLabel}>{g.group}</span>
        <ul className={cx(s.links, onDark && s.linksGrid)}>
          {g.items.map((n) => (
            <li key={n.href}>
              <Link href={n.href} className={s.link} aria-current={active === n.href ? 'page' : undefined} data-hot>
                <span className={s.linkIcon}><Icon shape={n.icon[0]} mat={n.icon[1]} /></span>
                <span className={s.linkLabel}>{n.label}</span>
                <span className={s.linkHint}>{n.hint}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    ))

  return (
    <div className={s.shell}>
      <aside className={s.side}>
        <Link href="/" className={s.logo} data-hot>
          <Icon shape="island" size={32} />
          <span className={s.logoText}>{siteName}</span>
        </Link>
        <nav className={s.nav} aria-label="주 메뉴">{links()}</nav>
      </aside>

      <div className={s.main}>
        <header className={s.top}>
          {/* 뒤로 가기: 자리는 항상 차지하고, 돌아갈 곳이 있을 때만 보인다 */}
          <button type="button" className={s.back} data-on={!!back} tabIndex={back ? 0 : -1} aria-hidden={!back} onClick={() => router.back()} data-hot>
            <Icon shape="arrow" className={s.backIcon} />
            <span className={s.backText}>{back ?? ''}</span>
          </button>
          <Link href="/" className={s.topLogo} data-hot data-back={!!back} aria-label={siteName}>
            <Icon shape="island" size={32} />
            <span className={s.logoText}>{siteName}</span>
          </Link>
          <Search />
        </header>
        {children}
        <footer className={s.foot}>
          <span>{siteName} / 수치는 패치로 바뀔 수 있습니다.</span>
          <span>마인크래프트 공식 제품이 아니며 Mojang, Microsoft와 관련이 없습니다.</span>
        </footer>
      </div>

      <nav className={s.bar} aria-label="빠른 메뉴">
        {NAV.flatMap((g) => g.items).filter((n) => BAR.includes(n.href)).map((n) => (
          <Link key={n.href} href={n.href} className={s.barBtn} aria-current={active === n.href ? 'page' : undefined}>
            <Icon shape={n.icon[0]} mat={n.icon[1]} size={16} />
            <span>{n.label}</span>
          </Link>
        ))}
        <button type="button" className={s.barBtn} aria-expanded={menu} onClick={() => setMenu((v) => !v)}>
          <Icon shape={menu ? 'close' : 'menu'} size={16} />
          <span>{menu ? '닫기' : '메뉴'}</span>
        </button>
      </nav>

      {sheet.mounted && (
        <div className={s.sheet} role="dialog" aria-label="전체 메뉴" data-shown={sheet.shown} onTransitionEnd={sheet.onTransitionEnd}>
          <div className={s.sheetStrip} />
          <div className={s.sheetBody}>{links(true)}</div>
        </div>
      )}
    </div>
  )
}
