import Link from 'next/link'
import Filter from '@/components/Filter'
import Fold, { FoldAll } from '@/components/Fold'
import { BlockLink, Chip, ItemIcon, Page, Panel, cx, iconOf, ui } from '@/components/ui'
import * as d from '@/lib/data'
import { iconId } from '@/lib/pixel/shapes'
import s from '../list.module.css'
import Browser, { type Group } from './Browser'

export const metadata = { title: '아이템 도감' }

const statText = (st?: Record<string, number>) => (st ? Object.entries(st).map(([k, v]) => `${k} +${v}`).join(', ') : '')
const bandStart = (b?: string) => Number(b?.match(/\d+/)?.[0] ?? 999)
const icOf = (it?: d.Item) => iconId(...iconOf(it?.icon_material, it?.name ?? ''))

function Cell({ it, sub }: { it: d.Item; sub?: string }) {
  return (
    <Link href={d.itemHref(it.id)} className={s.cell} data-hot data-k={`${it.name} ${it.set ?? ''} ${it.slot ?? ''}`} data-c={it.category}>
      <span className={ui.slot}><ItemIcon material={it.icon_material} name={it.name} /></span>
      <span className={s.cellText}>
        <span className={s.cellName}>{it.name}</span>
        {sub && <span className={cx('t-tiny t-dim', s.cellSub)}>{sub}</span>}
      </span>
    </Link>
  )
}

export default function Items() {
  const all = d.items()
  const by = (c: string) => all.filter((i) => i.category === c)
  const sets = d.sets()

  // 종류 묶음: 좁은 화면의 3열 칸과 넓은 화면의 패널이 같은 목록을 쓴다
  const blocks: { group: Group; title: string; aside?: string; body: React.ReactNode }[] = []
  // 사냥터 칸은 갑옷 색으로 구분한다
  const REGION_MAT = ['leather', 'iron', 'gold', 'netherite', 'diamond']
  for (const [ri, r] of d.regions().entries()) {
    const mine = sets.filter((st) => d.regionOfSet(st.name)?.id === r.id)
    if (!mine.length) continue
    const items = all.filter((i) => i.set && mine.some((st) => st.name === i.set))
    blocks.push({
      group: { id: `set-${r.id}`, label: r.name, sub: `세트 ${r.levels}`, ic: iconId('chestplate', REGION_MAT[ri % REGION_MAT.length]), count: items.length },
      title: `장비 세트 / ${r.name}`,
      aside: r.levels,
      body: (
        <div className={s.setGrid}>
          {mine.map((st) => (
            <Fold
              key={st.id}
              head={
                <>
                  <span className={s.cardName}>{st.name}</span>
                  <div className={ui.gap4}>
                    {Object.entries(st.bonus).map(([n, b]) => (
                      <div key={n} className={s.bonus}>
                        <Chip color="var(--grass)">{n}</Chip>
                        <span className="t-dim">{statText(b)}</span>
                      </div>
                    ))}
                  </div>
                </>
              }
            >
              {all.filter((i) => i.set === st.name).map((it) => <Cell key={it.id} it={it} sub={statText(it.stats)} />)}
            </Fold>
          ))}
        </div>
      ),
    })
  }
  for (const slot of ['목걸이', '반지', '벨트', '룬']) {
    const list = by('장신구').filter((i) => i.slot === slot).sort((a, b) => bandStart(a.level_band) - bandStart(b.level_band))
    blocks.push({
      group: { id: `acc-${slot}`, label: slot, sub: '장신구', ic: icOf(list[0]), count: list.length },
      title: `장신구 / ${slot}`,
      body: <div className={s.cells}>{list.map((it) => <Cell key={it.id} it={it} sub={[it.level_band, statText(it.stats)].filter(Boolean).join(' / ')} />)}</div>,
    })
  }
  for (const c of ['무기/도구', '소비', '생선', '재료', '기본 재료']) {
    const list = by(c).sort((a, b) => bandStart(a.level_band) - bandStart(b.level_band))
    blocks.push({
      group: { id: `cat-${c}`, label: c, ic: icOf(list[0]), count: list.length },
      title: c,
      body: (
        <div className={s.cells}>
          {list.map((it) => (
            <Cell key={it.id} it={it} sub={[it.level_band, statText(it.stats) || (it.sell_price ? `판매 ${d.num(it.sell_price)}G` : '')].filter(Boolean).join(' / ')} />
          ))}
        </div>
      ),
    })
  }

  return (
    <Page title="아이템 도감" lead="이름을 누르면 얻는 곳과 쓰이는 곳이 나옵니다." icon={['chest', 'gray']}>
      <Panel tex="cobble" aside={<><FoldAll group="items" /><BlockLink href="/tree/" small tone="dirt">제작 트리로 보기</BlockLink></>} title={`전체 ${all.length}종`}>
        <Filter scope="#items" placeholder="아이템, 세트 이름으로 찾기" tabsWideOnly groups={[{ param: 'c', attr: 'c', all: '전체', options: d.CATEGORIES.map((c) => ({ v: c, label: c })) }]} />
      </Panel>

      <Browser groups={blocks.map((b) => b.group)}>
        {blocks.map((b) => (
          <div key={b.group.id} data-gid={b.group.id} data-group>
            <Fold
              mode="all"
              defaultOpen
              group="items"
              head={
                <>
                  <h2 className={ui.panelTitle}>{b.title}</h2>
                  {b.aside && <Chip>{b.aside}</Chip>}
                  <span className="t-faint">{b.group.count}종</span>
                </>
              }
            >
              {b.body}
            </Fold>
          </div>
        ))}
      </Browser>
    </Page>
  )
}
