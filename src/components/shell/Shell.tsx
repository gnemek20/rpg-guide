'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState, type ReactNode } from 'react'
import { NAV, navOf } from '@/lib/nav'
import { Icon, cx } from '../ui'
import Search from './Search'
import s from './shell.module.css'

const BAR = ['/', '/items/', '/tree/', '/monsters/']

export default function Shell({ children, siteName }: { children: ReactNode; siteName: string }) {
  const pathname = usePathname()
  const active = navOf(pathname).href
  const [menu, setMenu] = useState(false)

  // 페이지를 옮기면 메뉴를 닫는다
  useEffect(() => setMenu(false), [pathname])
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
          <Link href="/" className={s.topLogo} data-hot aria-label={siteName}>
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

      {menu && (
        <div className={s.sheet} role="dialog" aria-label="전체 메뉴">
          <div className={s.sheetStrip} />
          <div className={s.sheetBody}>{links(true)}</div>
        </div>
      )}
    </div>
  )
}
