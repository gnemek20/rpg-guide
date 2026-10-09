import Filter from '@/components/Filter'
import Board from '@/components/map/Board'
import { Ref } from '@/components/refs'
import { Chip, ItemIcon, KV, Page, Panel, Table, cx, ui } from '@/components/ui'
import { titleBoard } from '@/lib/boards'
import * as d from '@/lib/data'
import s from '../list.module.css'
import p from './progress.module.css'
import { tx } from '@/lib/markdown'

export const metadata = { title: '진행' }

export default function Progress() {
  const pr = d.progress()
  const cats: string[] = [...new Set<string>(pr.collections.map((c: any) => c.category))]
  return (
    <Page title="진행" lead="도감, 업적, 파견, 출석, 랭킹입니다." icon={['trophy', 'gray']}>
      <Panel title="출석" tex="planks" aside={<code>/출석</code>}>
        <p className="t-dim">{tx(d.clean(pr.attendance.how).replace(/^\/출석 - /, ''))}</p>
        <ol className={p.days}>
          {pr.attendance.days.map((day: any) => (
            <li key={day.day} className={p.day}>
              <span className={p.dayN}>{day.day}일</span>
              <span className="t-gold t-num">{d.num(day.gold)}G</span>
              {day.items.map((it: d.Ref) => <Ref key={it.id} r={it} />)}
            </li>
          ))}
        </ol>
      </Panel>

      <Panel title="업적, 칭호" aside={<code>/업적</code>}>
        <Board data={titleBoard()} param="t" placeholder="칭호 찾기" compact />
      </Panel>

      <Panel title="도감" tex="stone" aside={<code>/도감</code>}>
        <p className="t-dim">모은 수량이 단계에 닿으면 보상을 받습니다. 상시 보상은 계속 적용됩니다.</p>
        <Filter scope="#coll" placeholder="도감 이름으로 찾기" groups={[{ param: 'c', attr: 'c', all: '전체', options: cats.map((c) => ({ v: c, label: c })) }]} />
        <ul className={cx(s.cardGrid, ui.stage)} id="coll">
          {pr.collections.map((c: any) => (
            <li key={c.id} className={s.card} data-k={c.name} data-c={c.category}>
              <div className={s.cardHead} data-hot>
                <span className={ui.slot}><ItemIcon material={c.icon_material} name={c.name} /></span>
                <span className={s.cardName}>{tx(c.name)}</span>
                <Chip>{c.category}</Chip>
              </div>
              <div className={ui.gap4}>
                {c.tiers.map((t: any, i: number) => (
                  <div key={i} className={cx('row', ui.gap8)}>
                    <span className={cx(p.need, 't-num')}>{d.num(t.required)}</span>
                    <span className={/상시/.test(t.reward) ? 't-grass' : 't-gold'}>{tx(t.reward)}</span>
                  </div>
                ))}
              </div>
            </li>
          ))}
        </ul>
      </Panel>

      <div className={ui.cols}>
        <Panel title="파견" tex="dirt" aside={<code>/파견</code>}>
          <KV rows={[['방법', tx(d.clean(pr.expedition.how).replace(/^\/파견 - /, ''))], ['칸', tx(pr.expedition.slots)]]} />
          <Table
            cols={[{ label: '목적지', main: true, w: 1.4 }, { label: '시간', right: true, w: 0.6 }, { label: '골드', right: true }, { label: '추가 보상', right: true, w: 0.8 }, { label: '필요 레벨', right: true, w: 0.8 }]}
            rows={pr.expedition.destinations.map((x: any) => [
              <div key="n" className={ui.gap4}><span>{x.name}</span><span className="t-tiny t-faint">{tx(x.description)}</span></div>,
              `${x.minutes}분`, <span key="g" className="t-gold t-num">{d.range(x.gold, 'G')}</span>, x.bonus_chance, `Lv.${x.required_level}`,
            ])}
          />
        </Panel>
        <Panel title="랭킹" tex="deepslate" aside={<code>{pr.ranking.how}</code>}>
          <div className={cx('wrap', ui.gap8)}>{pr.ranking.boards.map((b: string) => <Chip key={b} color="var(--gold)">{b}</Chip>)}</div>
          <p className={cx(ui.note, 't-tiny')}>집계 기준 세부는 준비 중입니다.</p>
        </Panel>
      </div>
    </Page>
  )
}
