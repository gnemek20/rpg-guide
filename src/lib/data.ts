// data/*.yml 로더. 빌드 때(Server Component, 스크립트)만 실행된다.
// 수치는 여기서 읽은 값만 화면에 쓴다. 화면 코드에 수치를 직접 적지 않는다.
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { parse } from 'yaml'

const cache = new Map<string, unknown>()
function load<T>(name: string): T {
  if (!cache.has(name)) cache.set(name, parse(readFileSync(join(process.cwd(), 'data', `${name}.yml`), 'utf8')))
  return cache.get(name) as T
}

// ---------------------------------------------------------------- 타입
export type Ref = { id: string; name: string; amount?: number }
export type Item = {
  id: string; name: string; category: string; set?: string; slot?: string; level_band?: string
  stats?: Record<string, number>; description?: string[]; icon_material?: string
  sources: string[]; uses: string[]; sell_price?: number; vanilla?: boolean
}
export type Recipe = {
  kind: 'craft' | 'brew'; result: Required<Ref>; ingredients: Required<Ref>[]
  shape?: string[]; farming_level?: number; seconds?: number; exp?: number
}
export type Drop = { item: Ref; chance_percent: number; amount?: [number, number] }
export type Monster = {
  id: string; name: string; level: number; health: number; attack: number; boss: boolean
  gold: [number, number]; exp: [number, number]; looks_like: string; drops: Drop[]
}
export type Region = { id: string; name: string; levels: string; monsters: Monster[] }
export type GearSet = { id: string; name: string; members: Ref[]; bonus: Record<string, Record<string, number>>; note?: string }
export type Spell = {
  id: string; name: string; grade: string; tier: number; description: string; mana: number; cooldown_seconds: number
  damage: number; range: number; cast: string; status_effect?: string; required_level: number; area?: number
  scroll_recipe?: { gold: number; materials: Required<Ref>[] }; summon?: { name: string; role: string }
}
export type Enchant = { id: string; name: string; for: string; grade: string; max_level: number; effect_at_max: string; any_grade: boolean }
export type Catch = {
  id: string; name: string; kind: string; rarity: string; item?: string; size_cm?: [number, number]; price?: number
  exp: number; gold?: [number, number]; conditions?: { places?: string[]; time?: string; weather?: string; fishing_level?: number }
}
export type Meta = {
  site_name: string; current_url: string; game: string; level_rule: string; alpha_level_range: string
  stat_names: Record<string, string>; rarity: Record<string, string>; equip_slots: string
}

// ---------------------------------------------------------------- 표시용 문자열
/** 데이터 문장을 화면 규칙(가운뎃점, 이모지, 긴 줄표 없음)에 맞춘다. 수치는 건드리지 않는다. */
export function clean(s: string | undefined | null): string {
  if (!s) return ''
  return s
    .replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}]/gu, '')
    .replace(/^[※\s]+/, '')
    .replace(/\bdescription\b/g, '설명')
    .replace(/\s*·\s*/g, ', ')
    .replace(/\s*[—–]\s*/g, ' - ')
    .replace(/\s*→\s*/g, ' > ')
    .replace(/\s{2,}/g, ' ')
    .trim()
}
export const num = (n: number) => n.toLocaleString('ko-KR')
export const range = (r?: [number, number] | number[], unit = '') =>
  !r ? '' : r[0] === r[1] ? `${num(r[0])}${unit}` : `${num(r[0])}~${num(r[1])}${unit}`
export const pct = (n: number | string) => (typeof n === 'number' ? `${n}%` : n)

const CATEGORY: Record<string, string> = { '재료·기타': '재료', '무기·도구·장비': '무기/도구', '소비 아이템': '소비' }
export const CATEGORIES = ['장비 세트', '장신구', '무기/도구', '소비', '생선', '재료', '기본 재료']

// ---------------------------------------------------------------- 기본 로더
export const meta = () => load<Meta>('meta')

let _items: Item[] | undefined
export function items(): Item[] {
  if (_items) return _items
  const raw = load<{ items: Item[]; vanilla_materials: Item[] }>('items')
  _items = [
    ...raw.items.map((i) => ({ ...i, name: clean(i.name), category: CATEGORY[i.category] ?? i.category })),
    ...raw.vanilla_materials.map((v) => ({ ...v, category: '기본 재료', icon_material: v.id, vanilla: true })),
  ]
  return _items
}
let _byId: Map<string, Item> | undefined
export function itemById(id: string): Item | undefined {
  _byId ??= new Map(items().map((i) => [i.id, i]))
  return _byId.get(id)
}
/** 주소에 쓰는 아이템 slug. 대소문자가 섞이지 않게 소문자로 통일 */
export const itemSlug = (id: string) => id.toLowerCase()
export const itemHref = (id: string) => `/items/${itemSlug(id)}/`

let _recipes: Recipe[] | undefined
export function recipes(): Recipe[] {
  if (_recipes) return _recipes
  const raw = load<{ crafting: Omit<Recipe, 'kind'>[]; brewing: Omit<Recipe, 'kind'>[] }>('recipes')
  _recipes = [
    ...raw.crafting.map((r) => ({ ...r, kind: 'craft' as const })),
    ...raw.brewing.map((r) => ({ ...r, kind: 'brew' as const })),
  ]
  return _recipes
}
let _recipeBy: Map<string, Recipe> | undefined
export function recipeFor(id: string): Recipe | undefined {
  _recipeBy ??= new Map(recipes().map((r) => [r.result.id, r]))
  return _recipeBy.get(id)
}
let _usedIn: Map<string, Recipe[]> | undefined
export function usedIn(id: string): Recipe[] {
  if (!_usedIn) {
    _usedIn = new Map()
    for (const r of recipes()) for (const ing of r.ingredients) _usedIn.set(ing.id, [...(_usedIn.get(ing.id) ?? []), r])
  }
  return _usedIn.get(id) ?? []
}

/** 완성품 1개에 드는 바닥 재료 합계. 중간 제작품은 끝까지 펼친다. */
export function rawTotals(id: string, amount = 1, acc = new Map<string, number>(), seen = new Set<string>()): Map<string, number> {
  const r = recipeFor(id)
  if (!r || seen.has(id)) {
    acc.set(id, (acc.get(id) ?? 0) + amount)
    return acc
  }
  const crafts = Math.ceil(amount / r.result.amount)
  const next = new Set(seen).add(id)
  for (const ing of r.ingredients) rawTotals(ing.id, ing.amount * crafts, acc, next)
  return acc
}
/** 제작 깊이. 재료만으로 만들면 1 */
export function depthOf(id: string, seen = new Set<string>()): number {
  const r = recipeFor(id)
  if (!r || seen.has(id)) return 0
  const next = new Set(seen).add(id)
  return 1 + Math.max(0, ...r.ingredients.map((i) => depthOf(i.id, next)))
}

export const regions = () => load<{ regions: Region[] }>('monsters').regions
export type DropSource = { monster: Monster; region: Region; drop: Drop }
let _drops: Map<string, DropSource[]> | undefined
export function dropsOf(id: string): DropSource[] {
  if (!_drops) {
    _drops = new Map()
    for (const region of regions())
      for (const monster of region.monsters)
        for (const drop of monster.drops) _drops.set(drop.item.id, [...(_drops.get(drop.item.id) ?? []), { monster, region, drop }])
  }
  return _drops.get(id) ?? []
}

export const sets = () => load<{ sets: GearSet[] }>('sets').sets
export const setByName = (name: string) => sets().find((s) => s.name === name)

/** 세트에는 레벨대가 없다. 재료를 떨구는 사냥터 중 가장 높은 곳을 그 세트의 지역으로 본다. */
let _setRegion: Map<string, Region | undefined> | undefined
export function regionOfItem(id: string): Region | undefined {
  const rs = regions()
  let best = -1
  for (const raw of rawTotals(id).keys()) {
    // 재료마다 처음 나오는 사냥터를 잡고, 그중 가장 높은 곳을 고른다.
    const first = Math.min(...dropsOf(raw).map((d) => rs.indexOf(d.region)))
    if (Number.isFinite(first)) best = Math.max(best, first)
  }
  return best >= 0 ? rs[best] : undefined
}
export function regionOfSet(name: string): Region | undefined {
  _setRegion ??= new Map()
  if (!_setRegion.has(name)) {
    const s = setByName(name)
    const rs = regions()
    let best = -1
    for (const m of s?.members ?? []) {
      const r = regionOfItem(m.id)
      if (r) best = Math.max(best, rs.indexOf(r))
    }
    _setRegion.set(name, best >= 0 ? rs[best] : undefined)
  }
  return _setRegion.get(name)
}

export const spells = () => load<{ scroll_base_price: number; spells: Spell[] }>('spells')
export const enchants = () => load<{ rules: Record<string, any>; enchants: Enchant[] }>('enchants')
export const enhance = () => load<any>('enhance')
export const fishing = () => load<{ rules: Record<string, string>; catches: Catch[] }>('fishing')
export const island = () => load<any>('island')
export const challenges = () => load<any>('challenges')
export const progress = () => load<any>('progress')
export const economy = () => load<any>('economy')
export const commands = () => load<{ commands: { command: string; aliases: string[]; description: string }[]; keys: { key: string; description: string }[] }>('commands')

/** 이름이나 id로 연결할 주소를 찾는다. items.yml에 없으면 링크하지 않는다. */
export const linkOf = (ref: { id: string }) => (itemById(ref.id) ? itemHref(ref.id) : undefined)
