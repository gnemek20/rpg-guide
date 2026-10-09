// 도전 과제 판(Board)에 넘길 배치와 설명을 빌드 때 계산한다.
import type { BDetail, BNode, BoardData } from '@/components/map/Board'
import { iconOf } from '@/components/ui'
import * as d from './data'
import { iconId } from './pixel/shapes'

const STEP = 64, NODE = 48, LABEL_W = 112, COLS = 6, LANE_GAP = 72
const icOf = (it?: d.Item, fallback = '') => iconId(...iconOf(it?.icon_material ?? fallback, it?.name ?? ''))
const statLines = (st?: Record<string, number>) => (st ? Object.entries(st).map(([k, v]) => `${k} +${v}`) : [])

function itemDetail(it: d.Item): BDetail {
  const recipe = d.recipeFor(it.id)
  const uses = d.usedIn(it.id)
  const drops = d.dropsOf(it.id).sort((a, b) => b.drop.chance_percent - a.drop.chance_percent)
  const region = it.set ? d.regionOfSet(it.set) : d.regionOfItem(it.id)
  const others = it.sources.filter((x) => !/^(제작|양조)/.test(x) && !/처치 [\d.]+%/.test(x)).map(d.clean)
  const sections: NonNullable<BDetail['sections']> = []
  if (recipe)
    sections.push({
      title: recipe.kind === 'brew' ? `양조 재료 (농사 Lv.${recipe.farming_level}, ${recipe.seconds}초)` : `제작 재료${recipe.result.amount > 1 ? ` (${recipe.result.amount}개 완성)` : ''}`,
      rows: recipe.ingredients.map((g) => ({ ic: icOf(d.itemById(g.id), g.id), text: d.itemById(g.id)?.name ?? g.name, sub: `x${g.amount}`, go: g.id })),
    })
  if (recipe) {
    const totals = [...d.rawTotals(it.id)]
    if (totals.some(([id]) => !recipe.ingredients.some((g) => g.id === id)))
      sections.push({ title: '바닥 재료 합계', rows: totals.map(([id, n]) => ({ ic: icOf(d.itemById(id), id), text: d.itemById(id)?.name ?? id, sub: `x${n}`, go: id })) })
  }
  const src: NonNullable<BDetail['sections']>[number]['rows'] = [
    ...drops.slice(0, 6).map((x) => ({ ic: 'skull-white', text: x.monster.name, sub: `${x.region.name} ${d.pct(x.drop.chance_percent)}`, href: `/monsters/?r=${x.region.id}#${x.monster.id}` })),
    ...(drops.length > 6 ? [{ text: `외 ${drops.length - 6}종`, href: d.itemHref(it.id) }] : []),
    ...others.map((o) => ({ text: o })),
  ]
  if (src.length) sections.push({ title: '얻는 곳', rows: src })
  if (uses.length)
    sections.push({
      title: `쓰이는 곳 ${uses.length}`,
      rows: [
        ...uses.slice(0, 10).map((u) => ({ ic: icOf(d.itemById(u.result.id), u.result.id), text: d.itemById(u.result.id)?.name ?? u.result.name, sub: `x${u.ingredients.find((g) => g.id === it.id)?.amount}`, go: u.result.id })),
        ...(uses.length > 10 ? [{ text: `외 ${uses.length - 10}종`, href: d.itemHref(it.id) }] : []),
      ],
    })
  return {
    chips: [it.category, it.set ? `${it.set} 세트` : '', it.slot ?? '', it.level_band ?? '', region?.name ?? ''].filter(Boolean),
    stats: statLines(it.stats),
    desc: it.description?.map(d.clean),
    sections,
    href: d.itemHref(it.id),
  }
}

/** 제작 트리: 사냥터별 줄. 위에 재료, 아래로 세트, 장신구, 도구 */
export function treeBoard(): BoardData {
  const nodes: BNode[] = [], trunks: string[] = [], labels: BoardData['labels'] = [], frames: BoardData['frames'] = []
  const details: Record<string, BDetail> = {}
  const placed = new Set<string>()
  const put = (id: string, x: number, y: number, tone?: string) => {
    const it = d.itemById(id)
    if (!it || placed.has(id)) return false
    placed.add(id)
    nodes.push({ id, x, y, ic: icOf(it, id), name: it.name, tone })
    details[id] = itemDetail(it)
    return true
  }

  const craftable = d.items().filter((i) => d.recipeFor(i.id))
  const isBrew = (i: d.Item) => i.category === '소비' || d.recipeFor(i.id)?.kind === 'brew'
  const lanes: { title: string; sub: string; items: d.Item[] }[] = [
    { title: '섬', sub: '기본 도구', items: craftable.filter((i) => !isBrew(i) && !d.regionOfItem(i.id)) },
    ...d.regions().map((r) => ({ title: r.name, sub: r.levels, items: craftable.filter((i) => !isBrew(i) && (i.set ? d.regionOfSet(i.set) : d.regionOfItem(i.id))?.id === r.id) })),
    { title: '양조', sub: '물약, 강장제', items: craftable.filter(isBrew).sort((a, b) => (d.recipeFor(a.id)?.farming_level ?? 0) - (d.recipeFor(b.id)?.farming_level ?? 0)) },
  ].filter((l) => l.items.length)

  let x0 = 32, maxH = 0
  for (const lane of lanes) {
    const W = LABEL_W + COLS * STEP
    labels.push({ x: x0, y: 16, text: lane.title, big: true }, { x: x0, y: 46, text: lane.sub })
    let y = 88

    // 재료: 이 줄에서 처음 쓰이는 것만 놓는다
    const mats: string[] = []
    for (const it of lane.items) for (const g of d.recipeFor(it.id)!.ingredients) if (!placed.has(g.id) && !mats.includes(g.id) && !lane.items.some((x) => x.id === g.id) && d.itemById(g.id)) mats.push(g.id)
    if (mats.length) {
      const per = Math.floor((W - 16) / STEP)
      const rows = Math.ceil(mats.length / per)
      frames.push({ x: x0, y: y - 8, w: W, h: rows * STEP + 24 })
      labels.push({ x: x0 + 8, y: y - 4, text: '재료' })
      mats.forEach((id, i) => put(id, x0 + 8 + (i % per) * STEP, y + 20 + Math.floor(i / per) * STEP, 'raw'))
      y += rows * STEP + 40
    }
    const trunkTop = y - 16
    const tx = x0 + 12
    let lastRowY = y

    const row = (label: string, list: d.Item[], tone?: string) => {
      for (let i = 0; i < list.length; i += COLS) {
        const part = list.slice(i, i + COLS)
        if (i === 0) labels.push({ x: x0 + 24, y: y, text: label })
        part.forEach((it, j) => put(it.id, x0 + LABEL_W + j * STEP, y, tone))
        const cy = y + NODE / 2
        trunks.push(`M${tx} ${cy}H${x0 + LABEL_W + (part.length - 1) * STEP + NODE / 2}`)
        lastRowY = cy
        y += STEP
      }
    }
    const rest = [...lane.items]
    const take = (pred: (i: d.Item) => boolean) => {
      const hit = rest.filter(pred)
      hit.forEach((h) => rest.splice(rest.indexOf(h), 1))
      return hit
    }
    const mid = take((i) => i.category === '재료')
    if (mid.length) row('가공', mid)
    for (const st of d.sets()) {
      const members = take((i) => i.set === st.name)
      if (!members.length) continue
      const order = st.members.map((m) => m.id)
      members.sort((a, b) => (order.indexOf(a.id) + 99) % 99 - (order.indexOf(b.id) + 99) % 99)
      row(st.name, members)
    }
    for (const slot of ['목걸이', '반지', '벨트', '룬']) {
      const acc = take((i) => i.slot === slot)
      if (acc.length) row(slot, acc, 'goal')
    }
    const tools = take((i) => i.category === '무기/도구')
    if (tools.length) row('무기, 도구', tools)
    if (rest.length) row(lane.title === '양조' ? '물약' : '기타', rest)

    trunks.push(`M${tx} ${trunkTop}V${lastRowY}`)
    maxH = Math.max(maxH, y)
    x0 += W + LANE_GAP
  }

  const links: [string, string][] = []
  for (const r of d.recipes()) for (const g of r.ingredients) if (placed.has(g.id) && placed.has(r.result.id)) links.push([g.id, r.result.id])
  return { w: x0, h: maxH + 32, nodes, trunks, links, labels, frames, details }
}

/** 마법: 등급별 구역. 계열로는 나누지 않는다. 소환 마법은 구역 아래 칸에 따로 */
export function spellBoard(): BoardData {
  const { spells, scroll_base_price } = d.spells()
  const grades = [...new Set(spells.map((s) => s.grade))]
  const MAT = ['sand', 'green', 'blue', 'gold']
  const SX = 112, SY = 92, PER = 3
  const nodes: BNode[] = [], trunks: string[] = [], labels: BoardData['labels'] = [], frames: BoardData['frames'] = []
  const details: Record<string, BDetail> = {}
  const colW = PER * SX + 24
  let maxH = 0
  const heads: number[] = []
  grades.forEach((g, gi) => {
    const x0 = 32 + gi * (colW + 48)
    const list = spells.filter((s) => s.grade === g)
    labels.push({ x: x0, y: 16, text: g, big: true }, { x: x0, y: 46, text: `${list.length}종, 필요 레벨 ${Math.min(...list.map((s) => s.required_level))} 이상` })
    heads.push(x0)
    let y = 96
    const zone = (title: string, items: d.Spell[], summon: boolean) => {
      if (!items.length) return
      const rows = Math.ceil(items.length / PER)
      frames.push({ x: x0, y: y - 8, w: colW, h: rows * SY + 32 })
      labels.push({ x: x0 + 8, y: y - 4, text: title })
      items.forEach((sp, i) => {
        const name = d.clean(sp.name)
        nodes.push({ id: sp.id, x: x0 + 12 + (i % PER) * SX + (SX - NODE) / 2 - 6, y: y + 22 + Math.floor(i / PER) * SY, ic: summon ? 'scroll-purple' : `scroll-${MAT[gi % MAT.length]}`, name, label: true, tone: gi === grades.length - 1 ? 'goal' : undefined })
        details[sp.id] = {
          chips: [sp.grade, sp.cast, d.clean(sp.status_effect), `Lv.${sp.required_level}`].filter(Boolean),
          desc: [d.clean(sp.description)],
          sections: [
            {
              title: '수치',
              rows: [
                { text: '마나', sub: String(sp.mana) }, { text: '재사용', sub: `${sp.cooldown_seconds}초` },
                ...(sp.damage ? [{ text: '피해', sub: d.num(sp.damage) }] : []),
                ...(sp.range ? [{ text: '사거리', sub: String(sp.range) }] : []),
                ...(sp.area ? [{ text: '범위', sub: String(sp.area) }] : []),
              ],
            },
            ...(sp.summon ? [{ title: '소환수', rows: [{ text: sp.summon.name, sub: d.clean(sp.summon.role) }] }] : []),
            sp.scroll_recipe
              ? { title: '주문서 제작', rows: [{ ic: 'coin-gold', text: '골드', sub: `${d.num(sp.scroll_recipe.gold)}G` }, ...sp.scroll_recipe.materials.map((m) => ({ ic: icOf(d.itemById(m.id), m.id), text: d.itemById(m.id)?.name ?? m.name, sub: `x${m.amount}`, href: d.linkOf(m) }))] }
              : { title: '주문서', rows: [{ ic: 'coin-gold', text: '마법사 아이리스에게서 구매', sub: `기본가 ${d.num(scroll_base_price)}G` }] },
          ],
        }
      })
      y += rows * SY + 48
    }
    zone('마법', list.filter((s) => !s.summon), false)
    zone('소환', list.filter((s) => s.summon), true)
    maxH = Math.max(maxH, y)
  })
  // 등급 사이를 잇는 줄기
  for (let i = 0; i + 1 < heads.length; i++) trunks.push(`M${heads[i] + colW} 76H${heads[i + 1]}`)
  return { w: 32 + grades.length * (colW + 48), h: maxH, nodes, trunks, links: [], labels, frames, details }
}

/** 업적, 칭호: 분류별 한 줄. 같은 줄은 왼쪽에서 오른쪽으로 이어진다 */
export function titleBoard(): BoardData {
  const titles: { id: string; title: string; condition: string; category: string }[] = d.progress().titles
  const cats = [...new Set(titles.map((t) => t.category))]
  const IC: Record<string, string> = { 전투: 'sword-iron', 채굴: 'pickaxe-iron', 농사: 'hoe-iron', 경제: 'coin-gold', 탐험: 'star-gold', 특수: 'gem-diamond' }
  const SX = 128, SY = 96
  const nodes: BNode[] = [], trunks: string[] = [], labels: BoardData['labels'] = [], details: Record<string, BDetail> = {}
  let maxN = 0
  cats.forEach((c, ci) => {
    const list = titles.filter((t) => t.category === c)
    maxN = Math.max(maxN, list.length)
    const y = 32 + ci * SY
    labels.push({ x: 24, y: y + 14, text: c })
    list.forEach((t, i) => {
      const name = t.title.replace(/[\[\]]/g, '').trim()
      nodes.push({ id: t.id, x: 104 + i * SX, y, ic: IC[c] ?? 'trophy-gray', name, label: true, tone: i === list.length - 1 && list.length > 1 ? 'goal' : undefined })
      details[t.id] = { chips: [c, '칭호'], sections: [{ title: '조건', rows: [{ text: d.clean(t.condition) }] }] }
    })
    if (list.length > 1) trunks.push(`M${104 + NODE / 2} ${y + NODE / 2}H${104 + (list.length - 1) * SX + NODE / 2}`)
  })
  return { w: 104 + maxN * SX + 24, h: 32 + cats.length * SY + 16, nodes, trunks, links: [], labels, frames: [], details }
}
