import * as d from '@/lib/data'
import { iconOf } from '@/components/ui'
import { iconId } from '@/lib/pixel/shapes'
import { guides } from '@/lib/content'
import type { Entry } from '@/components/shell/Search'
import { plain } from '@/lib/markdown'

export const dynamic = 'force-static'

/** 검색 인덱스. 빌드 때 한 번 만들어 정적 파일로 내보낸다. */
export async function GET() {
  const out: Entry[] = []
  for (const i of d.items()) {
    const [sh, m] = iconOf(i.icon_material, i.name)
    out.push({ n: i.name, t: i.category, h: d.itemHref(i.id), i: iconId(sh, m), d: i.set ? `${i.set} 세트` : i.slot ?? i.level_band })
  }
  for (const r of d.regions())
    for (const m of r.monsters) out.push({ n: m.name, t: '몬스터', h: `/monsters/?r=${r.id}#${m.id}`, i: 'skull-white', d: `${r.name}, Lv.${m.level}` })
  for (const e of d.enchants().enchants)
    out.push({ n: e.name, t: '잠재능력', h: `/enchants/?for=${encodeURIComponent(e.for)}#${e.id}`, i: 'book-purple', d: `${e.for}, ${e.grade}, ${plain(e.effect_at_max)}` })
  for (const sp of d.spells().spells) out.push({ n: plain(sp.name), t: '마법', h: `/spells/?s=${sp.id}`, i: 'scroll-sand', d: `${sp.grade}, ${plain(sp.status_effect)}` })
  for (const c of d.commands().commands) out.push({ n: c.command, t: '명령어', h: '/commands/', i: 'chat-gray', d: [...c.aliases, plain(c.description)].join(' ') })
  for (const c of d.fishing().catches) if (!c.item || !d.itemById(c.item)) out.push({ n: c.name, t: '낚시', h: '/fishing/', i: 'fish-sand', d: c.rarity })
  for (const b of d.challenges().boss_raid.bosses) out.push({ n: b.name, t: '보스', h: '/challenges/', i: 'skull-red', d: `권장 Lv.${b.recommended_level}` })
  for (const s of d.sets()) out.push({ n: `${s.name} 세트`, t: '세트', h: `/items/?f=${encodeURIComponent(s.name)}`, i: 'chestplate-iron' })
  for (const g of guides()) out.push({ n: g.title, t: '가이드', h: `/guide/${g.slug}/`, i: 'book-red', d: plain(g.lead) })
  return Response.json(out)
}
