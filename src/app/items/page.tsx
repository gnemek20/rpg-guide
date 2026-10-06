import Link from 'next/link'
import Filter from '@/components/Filter'
import { BlockLink, Chip, ItemIcon, Page, Panel, cx, ui } from '@/components/ui'
import * as d from '@/lib/data'
import s from '../list.module.css'

export const metadata = { title: '아이템 도감' }

const statText = (st?: Record<string, number>) => (st ? Object.entries(st).map(([k, v]) => `${k} +${v}`).join(', ') : '')
const bandStart = (b?: string) => Number(b?.match(/\d+/)?.[0] ?? 999)

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
  const regions = d.regions()
  const sets = d.sets()
  const accSlots = ['목걸이', '반지', '벨트', '룬']

  return (
    <Page title="아이템 도감" lead="이름을 누르면 얻는 곳과 쓰이는 곳이 나옵니다." icon={['chest', 'gray']}>
      <Panel tex="cobble" aside={<BlockLink href="/tree/" small tone="dirt">제작 트리로 보기</BlockLink>} title={`전체 ${all.length}종`}>
        <Filter scope="#items" placeholder="아이템, 세트 이름으로 찾기" groups={[{ param: 'c', attr: 'c', all: '전체', options: d.CATEGORIES.map((c) => ({ v: c, label: c })) }]} />
      </Panel>

      <div id="items" className={ui.gap16}>
        {regions.map((r) => {
          const mine = sets.filter((st) => d.regionOfSet(st.name)?.id === r.id)
          if (!mine.length) return null
          return (
            <Panel group key={r.id} title={`장비 세트 / ${r.name}`} aside={<Chip>{r.levels}</Chip>}>
              <div className={s.setGrid} data-group>
                {mine.map((st) => (
                  <div key={st.id} className={s.card} data-group>
                    <div className={s.cardHead}>
                      <span className={s.cardName}>{st.name}</span>
                    </div>
                    <div className={ui.gap4}>
                      {Object.entries(st.bonus).map(([n, b]) => (
                        <div key={n} className={s.bonus}>
                          <Chip color="var(--grass)">{n}</Chip>
                          <span className="t-dim">{statText(b)}</span>
                        </div>
                      ))}
                    </div>
                    <div className={ui.gap4}>
                      {all.filter((i) => i.set === st.name).map((it) => <Cell key={it.id} it={it} sub={statText(it.stats)} />)}
                    </div>
                  </div>
                ))}
              </div>
            </Panel>
          )
        })}

        {accSlots.map((slot) => {
          const list = by('장신구').filter((i) => i.slot === slot).sort((a, b) => bandStart(a.level_band) - bandStart(b.level_band))
          return (
            <Panel group key={slot} title={`장신구 / ${slot}`}>
              <div className={s.cells} data-group>{list.map((it) => <Cell key={it.id} it={it} sub={[it.level_band, statText(it.stats)].filter(Boolean).join(' / ')} />)}</div>
            </Panel>
          )
        })}

        {(['무기/도구', '소비', '생선', '재료', '기본 재료'] as const).map((c) => (
          <Panel group key={c} title={c}>
            <div className={s.cells} data-group>
              {by(c).sort((a, b) => bandStart(a.level_band) - bandStart(b.level_band)).map((it) => (
                <Cell key={it.id} it={it} sub={[it.level_band, statText(it.stats) || (it.sell_price ? `판매 ${d.num(it.sell_price)}G` : '')].filter(Boolean).join(' / ')} />
              ))}
            </div>
          </Panel>
        ))}
      </div>
    </Page>
  )
}
