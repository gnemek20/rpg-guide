import Filter from '@/components/Filter'
import { Chip, KV, Page, Panel, cx, ui } from '@/components/ui'
import * as d from '@/lib/data'
import s from '../list.module.css'

export const metadata = { title: '잠재능력' }

export default function Enchants() {
  const { rules, enchants } = d.enchants()
  const rarity = d.meta().rarity
  const kinds = [...new Set(enchants.map((e) => e.for))]
  const grades: string[] = rules.grades
  return (
    <Page title="잠재능력" lead="장비에 붙는 무작위 효과입니다. 등급이 높을수록 줄이 늘어납니다." icon={['book', 'purple']}>
      <div className={ui.cols}>
        <Panel title="등급" tex="obsidian">
          <KV rows={grades.map((g) => [
            <Chip key="c" color={rarity[g]}>{g}</Chip>,
            <span key="v">{rules.lines_per_grade[g]}줄 / 다음 등급 확률 <span className="t-gold">{Object.entries<string>(rules.grade_up_chance).find(([k]) => k.startsWith(g))?.[1] ?? '없음'}</span></span>,
          ])} />
        </Panel>
        <Panel title="재설정" tex="deepslate">
          <KV rows={[
            ['비용', d.clean(rules.cost)],
            ['줄 잠금', d.clean(rules.line_lock)],
            ['등급 보너스', d.clean(rules.grade_bonus)],
          ]} />
        </Panel>
      </div>

      <Panel title="효과 목록" aside={<span className="t-faint">{enchants.length}종</span>}>
        <Filter
          scope="#ench"
          placeholder="이름, 효과로 찾기"
          groups={[
            { param: 'for', attr: 'for', options: kinds.map((k) => ({ v: k, label: k })) },
            { param: 'g', attr: 'g', all: '전체 등급', options: grades.map((g) => ({ v: g, label: g })) },
          ]}
        />
        <p className="t-tiny t-faint">{d.clean(rules.note).replace(/effect_at_max/g, '효과').replace(/any_grade=true면/g, '"모든 등급" 표시가 있으면')}</p>
        <ul className={cx(s.cardGrid, ui.stage)} id="ench">
          {enchants.map((e) => (
            <li key={e.id} id={e.id} className={s.card} data-k={`${e.name} ${e.effect_at_max}`} data-for={e.for} data-g={e.grade} hidden={e.for !== kinds[0]}>
              <div className={s.cardHead}>
                <span className={s.cardName}>{e.name}</span>
                {e.any_grade && <Chip>모든 등급</Chip>}
                <Chip color={rarity[e.grade]}>{e.grade}</Chip>
              </div>
              <p className="t-grass">{d.clean(e.effect_at_max)}</p>
              <p className="t-tiny t-faint">최고 Lv.{e.max_level} 기준</p>
            </li>
          ))}
        </ul>
      </Panel>
    </Page>
  )
}
