import { Ref } from '@/components/refs'
import { KV, Page, Panel, Table, cx, ui } from '@/components/ui'
import * as d from '@/lib/data'
import s from '../list.module.css'
import { tx } from '@/lib/markdown'

export const metadata = { title: '강화' }

type Step = { from: string; to: string; gold: number; materials: number; success: string; decrease_on_fail: string; destroy_on_fail: string }

function Bar({ value, tone }: { value: string; tone?: string }) {
  const n = parseFloat(value)
  return (
    <div className={s.bar}>
      <span className={cx(s.barNum, 't-num')}>{value}</span>
      <div className={s.barTrack}><div className={s.barFill} style={{ width: `${n}%`, background: tone }} /></div>
    </div>
  )
}

export default function Enhance() {
  const { enhance: e, awaken } = d.enhance()
  const steps: Step[] = e.steps
  const zero = (v: string) => parseFloat(v) === 0
  return (
    <Page title="강화" lead="단계마다 능력치가 오르고, 높은 단계에서는 하락과 파괴가 생깁니다." icon={['anvil', 'gray']}>
      <div className={ui.cols}>
        <Panel title="규칙" tex="stone">
          <KV rows={[
            ['하는 곳', `${e.npc}, /강화`],
            ['성공 효과', tx(e.stat_per_success)],
            ['재료', <div key="m" className={cx('wrap', ui.gap8)}>{e.material_any_of.map((m: d.Ref) => <Ref key={m.id} r={m} />)}</div>],
          ]} />
          <p className={cx(ui.note, 't-tiny')}>재료는 위 다섯 가지 중 아무거나 쓸 수 있습니다.</p>
        </Panel>
        <Panel title="보호" tex="deepslate">
          <KV rows={Object.entries<string>(e.protect).map(([k, v]) => [k, tx(v)])} />
        </Panel>
        <Panel title="각성" tex="obsidian">
          <KV rows={[['비용', <Ref key="c" r={awaken.cost} />], ['효과', tx(awaken.effect)]]} />
        </Panel>
      </div>

      <Panel title="단계표" aside={<span className="t-faint">{steps.length}단계</span>}>
        <Table
          cols={[{ label: '단계', main: true, w: 0.8 }, { label: '골드', right: true, w: 0.7 }, { label: '재료', right: true, w: 0.5 }, { label: '성공', w: 1.6 }, { label: '하락', w: 1.2 }, { label: '파괴', w: 1.2 }]}
          rows={steps.map((st) => [
            `${st.from} > ${st.to}`,
            <span key="g" className="t-gold t-num">{d.num(st.gold)}G</span>,
            <span key="m" className="t-num">{st.materials}개</span>,
            <Bar key="s" value={st.success} />,
            zero(st.decrease_on_fail) ? <span key="d" className="t-faint">없음</span> : <Bar key="d" value={st.decrease_on_fail} tone="var(--gold)" />,
            zero(st.destroy_on_fail) ? <span key="x" className="t-faint">없음</span> : <Bar key="x" value={st.destroy_on_fail} tone="var(--red)" />,
          ])}
        />
      </Panel>
    </Page>
  )
}
