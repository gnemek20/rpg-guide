import type { ReactNode } from 'react'
import { itemById, itemHref } from '@/lib/data'
import { ItemRef, Slot } from './ui'

type R = { id: string; name: string; amount?: number }
/** 데이터의 { id, name, amount } 참조를 아이콘 붙은 링크로 그린다. items.yml에 없으면 글자만 */
export function Ref({ r, amount, suffix }: { r: R; amount?: number | string; suffix?: ReactNode }) {
  const it = itemById(r.id)
  return <ItemRef href={it ? itemHref(r.id) : undefined} material={it?.icon_material ?? r.id} name={it?.name ?? r.name} amount={amount ?? r.amount} suffix={suffix} />
}
export function RefSlot({ r, amount }: { r: R; amount?: number }) {
  const it = itemById(r.id)
  return <Slot href={it ? itemHref(r.id) : undefined} material={it?.icon_material ?? r.id} name={it?.name ?? r.name} amount={amount ?? r.amount} />
}
