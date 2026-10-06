import Link from 'next/link'
import type { CSSProperties, ReactNode } from 'react'
import { iconFor, iconId, potionMat } from '@/lib/pixel/shapes'
import s from './ui.module.css'

export const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? ''
export const cx = (...c: (string | false | undefined | null)[]) => c.filter(Boolean).join(' ')
export { s as ui }

// ---------------------------------------------------------------- 아이콘
export function Icon({ shape, mat = 'gray', size = 16, className }: { shape: string; mat?: string; size?: number; className?: string }) {
  const id = iconId(shape, mat)
  return (
    <svg className={cx('ic', className)} data-ic={id} width={size} height={size} viewBox="0 0 16 16" aria-hidden="true">
      <use href={`${BASE}/gen/icons.svg#${id}`} />
    </svg>
  )
}
/** 마인크래프트 아이템 이름으로 고르는 아이콘 */
export function iconOf(material: string | undefined, name = ''): [string, string] {
  const [shape, mat] = iconFor(material)
  return shape === 'potion' && material === 'POTION' ? [shape, potionMat(name)] : [shape, mat]
}
export function ItemIcon({ material, name, size = 32 }: { material?: string; name?: string; size?: number }) {
  const [shape, mat] = iconOf(material, name)
  return <Icon shape={shape} mat={mat} size={size} />
}

// ---------------------------------------------------------------- 뼈대
export function Page({ title, lead, icon, crumb, children }: {
  title: string; lead?: ReactNode; icon?: [string, string]; crumb?: { href: string; label: string }; children: ReactNode
}) {
  return (
    <main className={s.page}>
      <header className={s.head}>
        {icon && (
          <div className={s.headIcon} data-hot>
            <Icon shape={icon[0]} mat={icon[1]} size={32} />
          </div>
        )}
        <div className={s.headText}>
          {crumb && (
            <div className={s.crumb}>
              <Link href={crumb.href}>{crumb.label}</Link>
              <span>/</span>
            </div>
          )}
          <h1 className={s.title}>{title}</h1>
          {lead && (typeof lead === 'string' ? <p className={s.lead}>{lead}</p> : <div className={s.lead}>{lead}</div>)}
        </div>
      </header>
      {children}
    </main>
  )
}

export function Panel({ title, aside, tex, children, className, id, group }: {
  title?: ReactNode; aside?: ReactNode; tex?: string; children: ReactNode; className?: string; id?: string; group?: boolean
}) {
  return (
    <section className={cx(s.panel, className)} id={id} data-group={group ? '' : undefined}>
      {tex && <div className={s.strip} style={{ backgroundImage: `var(--tex-${tex})` }} />}
      {(title || aside) && (
        <div className={s.panelHead}>
          <h2 className={s.panelTitle}>{title}</h2>
          {aside}
        </div>
      )}
      <div className={s.panelBody}>{children}</div>
    </section>
  )
}

export function BlockLink({ href, children, icon, tone, small, current }: {
  href: string; children: ReactNode; icon?: [string, string]; tone?: 'grass' | 'dirt' | 'wood' | 'dark'; small?: boolean; current?: boolean
}) {
  const tones = { grass: s.btnGrass, dirt: s.btnDirt, wood: s.btnWood, dark: s.btnDark }
  return (
    <Link href={href} className={cx(s.btn, tone && tones[tone], small && s.btnSm)} aria-current={current ? 'page' : undefined} data-hot>
      {icon && <Icon shape={icon[0]} mat={icon[1]} />}
      <span>{children}</span>
    </Link>
  )
}

export function Chip({ children, color }: { children: ReactNode; color?: string }) {
  return <span className={s.chip} style={color ? ({ '--chip': color } as CSSProperties) : undefined}>{children}</span>
}

// ---------------------------------------------------------------- 표
export type Col = { label: string; w?: number; right?: boolean; main?: boolean }
/** flex 행으로 만든 표. 좁은 화면에서는 행이 카드로 바뀌고 칸마다 라벨이 붙는다. */
/** hrefs 를 주면 그 행 전체가 링크가 된다. 행 안에 다른 링크를 넣지 않는다. */
export function Table({ cols, rows, keys, keep, hrefs }: { cols: Col[]; rows: ReactNode[][]; keys?: string[]; keep?: boolean; hrefs?: (string | undefined)[] }) {
  const style = (c: Col): CSSProperties => (c.w ? { flex: `${c.w} 1 0` } : {})
  return (
    <div className={cx(s.table, !keep && s.cards)} role="table">
      <div className={cx(s.tr, s.th)} role="row">
        {cols.map((c) => (
          <div key={c.label} className={cx(s.td, c.right && s.tdR)} style={style(c)} role="columnheader">
            <span>{c.label}</span>
          </div>
        ))}
      </div>
      {rows.map((r, i) => {
        const cells = r.map((cell, j) => {
            const empty = cell === null || cell === undefined || cell === '' || cell === false
            return (
              <div key={j} className={cx(s.td, cols[j].right && s.tdR, cols[j].main && s.tdMain, empty && s.tdEmpty)} style={style(cols[j])} role="cell">
                <span className={s.tdLabel}>{cols[j].label}</span>
                <div className={s.cellBody}>{typeof cell === 'string' || typeof cell === 'number' ? <span>{cell}</span> : cell}</div>
              </div>
            )
          })
        const href = hrefs?.[i]
        return href ? (
          <Link key={keys?.[i] ?? i} href={href} className={cx(s.tr, s.trLink)} role="row" data-hot>{cells}</Link>
        ) : (
          <div key={keys?.[i] ?? i} className={s.tr} role="row">{cells}</div>
        )
      })}
    </div>
  )
}

export function KV({ rows }: { rows: [ReactNode, ReactNode][] }) {
  return (
    <div className={s.kv}>
      {rows.map(([k, v], i) => (
        <div key={i} className={s.kvRow}>
          <span className={s.kvKey}>{k}</span>
          <div className={s.kvVal}>{typeof v === 'string' || typeof v === 'number' ? <span>{v}</span> : v}</div>
        </div>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------- 아이템
export function Slot({ href, material, name, amount, size = 32 }: { href?: string; material?: string; name: string; amount?: number; size?: number }) {
  const inner = (
    <>
      <ItemIcon material={material} name={name} size={size} />
      {amount !== undefined && amount !== 1 && <span className={s.slotAmt}>{amount}</span>}
    </>
  )
  return href ? (
    <Link href={href} className={s.slot} title={name} aria-label={name} data-hot>{inner}</Link>
  ) : (
    <div className={s.slot} title={name} data-hot>{inner}</div>
  )
}

/** 아이콘 + 이름 + 수량. href가 있으면 링크 */
export function ItemRef({ href, material, name, amount, suffix }: { href?: string; material?: string; name: string; amount?: number | string; suffix?: ReactNode }) {
  const inner = (
    <>
      <ItemIcon material={material} name={name} size={16} />
      <span className={s.refName}>{name}</span>
      {amount !== undefined && <span className="t-dim t-num">x{amount}</span>}
      {suffix}
    </>
  )
  return href ? (
    <Link href={href} className={cx(s.ref, 'row')} data-hot>{inner}</Link>
  ) : (
    <div className={cx(s.ref, s.refPlain, 'row')} style={{ alignItems: 'center' }}>{inner}</div>
  )
}
