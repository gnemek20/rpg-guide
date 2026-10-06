import Filter from '@/components/Filter'
import { Ref } from '@/components/refs'
import { Chip, Icon, Page, Panel, cx, ui } from '@/components/ui'
import * as d from '@/lib/data'
import s from '../list.module.css'

export const metadata = { title: '몬스터' }

const SKULL = ['sand', 'green', 'red', 'purple', 'nether']

export default function Monsters() {
  const regions = d.regions()
  return (
    <Page title="몬스터" lead="마을의 차원문지기 엘론에게 말을 걸면 사냥터로 갑니다." icon={['skull', 'white']}>
      <Panel tex="deep-bricks" title="사냥터">
        <Filter scope="#mobs" placeholder="몬스터, 드롭 아이템으로 찾기" unit="마리" groups={[{ param: 'r', attr: 'r', options: regions.map((r) => ({ v: r.id, label: `${r.name} ${r.levels}` })) }]} />
      </Panel>
      <ul className={cx(s.cardGrid, ui.stage)} id="mobs">
        {regions.flatMap((r, ri) =>
          [...r.monsters].sort((a, b) => a.level - b.level).map((m) => (
            <li key={m.id} id={m.id} className={cx(s.card, ui.panel)} data-k={`${m.name} ${m.drops.map((x) => x.item.name).join(' ')}`} data-r={r.id} hidden={ri > 0}>
              <div className={s.cardHead} data-hot>
                <Icon shape="skull" mat={SKULL[ri % SKULL.length]} size={32} />
                <span className={s.cardName}>{m.name}</span>
                {m.boss && <Chip color="var(--red)">보스</Chip>}
                <Chip color="var(--gold)">Lv.{m.level}</Chip>
              </div>
              <div className={s.statLine}>
                <span className={s.stat}><span className="t-faint">체력</span><span className="t-num">{d.num(m.health)}</span></span>
                <span className={s.stat}><span className="t-faint">공격</span><span className="t-num">{d.num(m.attack)}</span></span>
                <span className={s.stat}><span className="t-faint">골드</span><span className="t-gold t-num">{d.range(m.gold)}</span></span>
                <span className={s.stat}><span className="t-faint">경험치</span><span className="t-num">{d.range(m.exp)}</span></span>
              </div>
              <div className={ui.gap4}>
                {m.drops.map((dr) => (
                  <Ref key={dr.item.id} r={dr.item} suffix={<span className="t-dim t-num">{d.pct(dr.chance_percent)}{dr.amount && dr.amount[1] > 1 ? `, ${d.range(dr.amount)}개` : ''}</span>} />
                ))}
              </div>
            </li>
          )),
        )}
      </ul>
    </Page>
  )
}
