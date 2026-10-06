// data/*.yml 의 id가 서로 맞물리는지 검사한다. 끊긴 참조는 목록으로 출력한다.
// 구조가 깨진 경우(필수 키 없음)만 빌드를 멈추고, 끊긴 참조는 경고로 남긴다.
import { writeFileSync, mkdirSync } from 'node:fs'
import * as d from '../src/lib/data'

const broken: string[] = []
const check = (where: string, ref: { id: string; name?: string } | undefined) => {
  if (!ref?.id) return
  if (!d.itemById(ref.id)) broken.push(`${where}: ${ref.id} (${ref.name ?? ''})`)
}
const fatal: string[] = []
const need = (cond: unknown, msg: string) => { if (!cond) fatal.push(msg) }

const all = d.items()
need(all.length > 0, 'items.yml: items 없음')
const slugs = new Map<string, string>()
for (const i of all) {
  need(i.id && i.name, `items.yml: id 또는 name 없음 (${JSON.stringify(i).slice(0, 60)})`)
  const s = d.itemSlug(i.id)
  if (slugs.has(s)) fatal.push(`items.yml: 주소가 겹침 ${slugs.get(s)} / ${i.id}`)
  slugs.set(s, i.id)
  if (i.set && !d.setByName(i.set)) broken.push(`items.yml ${i.id}: 세트 "${i.set}" 가 sets.yml에 없음`)
}
for (const r of d.recipes()) {
  check(`recipes.yml ${r.kind} 결과`, r.result)
  r.ingredients.forEach((g) => check(`recipes.yml ${r.result.id} 재료`, g))
}
for (const s of d.sets()) s.members.forEach((m) => check(`sets.yml ${s.id}`, m))
for (const region of d.regions())
  for (const m of region.monsters) m.drops.forEach((dr) => check(`monsters.yml ${m.id} 드롭`, dr.item))
for (const s of d.spells().spells) s.scroll_recipe?.materials.forEach((m) => check(`spells.yml ${s.id} 주문서`, m))
for (const c of d.fishing().catches) if (c.item) check(`fishing.yml ${c.id}`, { id: c.item, name: c.name })
const en = d.enhance()
en.enhance.material_any_of.forEach((m: d.Ref) => check('enhance.yml 강화 재료', m))
check('enhance.yml 각성', en.awaken.cost)
const ch = d.challenges()
for (const [floor, drops] of Object.entries<d.Drop[]>(ch.tower.boss_material_drops)) drops.forEach((x) => check(`challenges.yml 탑 ${floor}`, x.item))
for (const b of ch.boss_raid.bosses) b.rewards.drops.forEach((x: d.Drop) => check(`challenges.yml ${b.id}`, x.item))
const isl = d.island()
isl.herbs.forEach((h: any) => { check('island.yml 약초', h.product); check('island.yml 씨앗', h.seed) })
isl.trees.forEach((t: any) => check('island.yml 나무 부산물', t.byproduct))
isl.gems.list.forEach((g: any) => check('island.yml 보석', g.gem))
d.progress().attendance.days.forEach((day: any) => day.items.forEach((x: d.Ref) => check(`progress.yml 출석 ${day.day}일`, x)))

mkdirSync('src/generated', { recursive: true })
writeFileSync('src/generated/broken-ids.json', JSON.stringify(broken, null, 1) + '\n')

console.log(`검증: 아이템 ${all.length}, 레시피 ${d.recipes().length}, 세트 ${d.sets().length}, 몬스터 ${d.regions().reduce((n, r) => n + r.monsters.length, 0)}`)
if (broken.length) {
  console.warn(`끊긴 참조 ${broken.length}건 (src/generated/broken-ids.json)`)
  broken.slice(0, 40).forEach((b) => console.warn('  - ' + b))
} else console.log('끊긴 참조 없음')
if (fatal.length) {
  fatal.forEach((f) => console.error('오류: ' + f))
  process.exit(1)
}
