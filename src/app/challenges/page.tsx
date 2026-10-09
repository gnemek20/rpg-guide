import { Ref } from '@/components/refs'
import { BlockLink, Chip, Icon, KV, Page, Panel, Table, cx, ui } from '@/components/ui'
import * as d from '@/lib/data'
import s from '../list.module.css'
import { tx } from '@/lib/markdown'

export const metadata = { title: '도전' }

export default function Challenges() {
  const { tower, boss_raid: raid } = d.challenges()
  return (
    <Page title="도전" lead="시련의 탑과 보스 레이드는 서로 다른 콘텐츠입니다." icon={['tower', 'gray']}>
      <Panel title={raid.name} tex="deep-bricks" aside={<BlockLink href="/guide/challenge/" small>공략 가이드</BlockLink>}>
        <KV rows={[['입장', tx(raid.how)], ['보상 횟수', `하루 ${raid.daily_rewards}번, 모든 보스 공용`]]} />
        {/* 보스가 늘어나도 그대로 이어 붙는 목록 */}
        <ul className={ui.gap12}>
          {raid.bosses.map((b: any) => (
            <li key={b.id} className={s.card} id={b.id}>
              <div className={s.cardHead} data-hot>
                <Icon shape="skull" mat="red" size={32} />
                <span className={s.cardName}>{b.name}</span>
                <Chip color="var(--gold)">권장 Lv.{b.recommended_level}</Chip>
              </div>
              <p className="t-dim">{tx(b.flavor)}</p>
              <div className={s.statLine}>
                <span className={s.stat}><span className="t-faint">체력</span><span className="t-num">{d.num(b.health)}</span></span>
                <span className={s.stat}><span className="t-faint">제한</span><span>{tx(b.time_limit)}</span></span>
              </div>
              <Table keep cols={[{ label: '패턴', main: true, w: 0.5 }, { label: '설명', w: 2 }]} rows={b.mechanics.map((m: any) => [m.name, tx(m.text)])} />
              <div className={cx('wrap', ui.gap12, ui.center)}>
                <span className={ui.sub}>보상</span>
                <span className="t-gold t-num">{d.num(b.rewards.gold)}G</span>
                <span>사냥 경험치 {d.num(b.rewards.hunting_exp)}</span>
                {b.rewards.drops.map((x: d.Drop) => <Ref key={x.item.id} r={x.item} suffix={<span className="t-dim">{d.pct(x.chance_percent)}</span>} />)}
              </div>
            </li>
          ))}
        </ul>
      </Panel>

      <Panel title={tower.name} tex="stone-bricks">
        <KV rows={[['입장', tx(tower.how)], ['골드', tx(tower.gold)], ['구성', `구간마다 ${tower.floors_per_section}층`]]} />
        <div className={ui.cols}>
          <div className={ui.gap8}>
            <h3 className={ui.sub}>구간</h3>
            <Table keep cols={[{ label: '구간', main: true, w: 1.4 }, { label: '입장 레벨', right: true }, { label: '권장 레벨', right: true }]} rows={tower.sections.map((x: any) => [x.name, `Lv.${x.min_level}`, `Lv.${x.recommended_level}`])} />
            <p className={cx(ui.note, 't-tiny')}>층별 보스 정보는 준비 중입니다.</p>
          </div>
          <div className={ui.gap8}>
            <h3 className={ui.sub}>보스 층 재료</h3>
            {Object.entries<d.Drop[]>(tower.boss_material_drops).map(([floor, drops]) => (
              <div key={floor} className={cx('row', ui.gap12)} style={{ alignItems: 'flex-start' }}>
                <Chip color="var(--gold)">{floor}</Chip>
                <div className={ui.gap4}>{drops.map((x) => <Ref key={x.item.id} r={x.item} suffix={<span className="t-dim t-num">{d.pct(x.chance_percent)}</span>} />)}</div>
              </div>
            ))}
          </div>
        </div>
      </Panel>

      <Panel title="고난" aside={<span className="t-faint">{tower.hardships.length}종</span>}>
        <p className="t-dim">층을 깰 때마다 셋 중 하나를 고릅니다. 얻는 것과 잃는 것이 함께 쌓입니다.</p>
        <ul className={s.cardGrid}>
          {tower.hardships.map((h: any) => (
            <li key={h.name} className={s.card}>
              <span className={s.cardName}>{h.name}</span>
              <p className="t-tiny t-faint">{tx(h.flavor)}</p>
              <div className={cx('row', ui.gap8)} style={{ alignItems: 'flex-start' }}><Chip color="var(--grass)">얻음</Chip><span className="t-grass">{tx(h.gain)}</span></div>
              <div className={cx('row', ui.gap8)} style={{ alignItems: 'flex-start' }}><Chip color="var(--red)">잃음</Chip><span className="t-red">{tx(h.cost)}</span></div>
            </li>
          ))}
        </ul>
      </Panel>
    </Page>
  )
}
