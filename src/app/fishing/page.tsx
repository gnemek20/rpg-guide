import Filter from '@/components/Filter'
import { Chip, Icon, ItemIcon, KV, Page, Panel, cx, ui } from '@/components/ui'
import * as d from '@/lib/data'
import Link from 'next/link'
import s from '../list.module.css'
import Pond from './Pond'
import { tx } from '@/lib/markdown'

export const metadata = { title: '낚시 도감' }

const FISH_MAT: Record<string, string> = { 일반: 'sand', 고급: 'green', 희귀: 'cyan', 영웅: 'purple', 전설: 'gold' }

export default function Fishing() {
  const { rules, catches } = d.fishing()
  const rarity = d.meta().rarity
  const grades = [...new Set(catches.map((c) => c.rarity))]
  const kinds = [...new Set(catches.map((c) => c.kind))]
  return (
    <Page title="낚시 도감" lead="넓은 강에 찌를 던지면 자동으로 낚입니다." icon={['fishingrod', 'gray']}>
      <Pond />

      <div className={ui.cols}>
        <Panel title="규칙" tex="dark-planks">
          <KV rows={[
            ['판매', tx(rules.sell)],
            ['판매가', tx(rules.price_per_level)],
            ['트로피', tx(rules.trophy)],
            ['멈춤', tx(rules.pause)],
          ]} />
        </Panel>
        <Panel title="조건 읽는 법" tex="sand">
          <KV rows={[
            ['장소', '적힌 곳의 강에서만 낚입니다.'],
            ['시간, 날씨', '밤이나 비가 올 때만 낚입니다.'],
            ['낚시 레벨', '그 레벨부터 낚입니다.'],
            ['조건 없음', '어디서나 낚입니다.'],
          ]} />
        </Panel>
      </div>

      <Panel title="어종" aside={<span className="t-faint">{catches.length}종</span>}>
        <Filter
          scope="#fish"
          placeholder="이름으로 찾기"
          unit="종"
          groups={[
            { param: 'g', attr: 'g', all: '전체 등급', options: grades.map((g) => ({ v: g, label: g })) },
            { param: 'k', attr: 'kind', all: '전체 종류', options: kinds.map((k) => ({ v: k, label: k })) },
          ]}
        />
        <ul className={cx(s.cardGrid, ui.stage)} id="fish">
          {catches.map((c) => {
            const it = c.item ? d.itemById(c.item) : undefined
            const cond = c.conditions ?? {}
            const tags = [...(cond.places ?? []), cond.time, cond.weather, cond.fishing_level ? `낚시 Lv.${cond.fishing_level}` : undefined].filter(Boolean) as string[]
            return (
              <li key={c.id} className={s.card} data-k={c.name} data-g={c.rarity} data-kind={c.kind}>
                <div className={s.cardHead} data-hot>
                  <span className={ui.slot}>
                    {c.kind === '골드' ? <Icon shape="coin" mat="gold" size={32} /> : it ? <ItemIcon material={it.icon_material} name={it.name} /> : <Icon shape="fish" mat={FISH_MAT[c.rarity] ?? 'sand'} size={32} />}
                  </span>
                  {it ? <Link href={d.itemHref(it.id)} className={cx(s.cardName, ui.ref)}><span className={ui.refName}>{c.name}</span></Link> : <span className={s.cardName}>{c.name}</span>}
                  <Chip color={rarity[c.rarity]}>{c.rarity}</Chip>
                </div>
                <div className={s.statLine}>
                  {c.size_cm && <span className={s.stat}><span className="t-faint">크기</span><span className="t-num">{d.range(c.size_cm, 'cm')}</span></span>}
                  {c.price !== undefined && <span className={s.stat}><span className="t-faint">판매</span><span className="t-gold t-num">{d.num(c.price)}G</span></span>}
                  {c.gold && <span className={s.stat}><span className="t-faint">골드</span><span className="t-gold t-num">{d.range(c.gold, 'G')}</span></span>}
                  <span className={s.stat}><span className="t-faint">경험치</span><span className="t-num">{c.exp}</span></span>
                </div>
                <div className={cx('wrap', ui.gap4)}>
                  {tags.length ? tags.map((t) => <Chip key={t} color="var(--water)">{t}</Chip>) : <Chip>조건 없음</Chip>}
                </div>
              </li>
            )
          })}
        </ul>
      </Panel>
    </Page>
  )
}
