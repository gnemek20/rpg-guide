import { Ref } from '@/components/refs'
import { ItemIcon, KV, Page, Panel, Table, cx, ui } from '@/components/ui'
import * as d from '@/lib/data'
import { tx } from '@/lib/markdown'

export const metadata = { title: '섬 자원' }

const UP: Record<string, string> = { generator: '생성기', rift: '균열', size: '섬 크기', miner: '자동 채굴기' }
const PAY: Record<string, string> = { gold: '골드', diamond: '다이아몬드', item: '재료', 'twisted-diamond': '뒤틀린 다이아몬드' }
const TIER: Record<string, string> = { 'tier1-2': '1~2단계', 'tier3-4': '3~4단계', tier5: '5단계' }

export default function Island() {
  const is = d.island()
  const tiers = Object.keys(is.generator_ore_weights)
  const ores: string[] = is.ores.map((o: any) => o.ore)
  const share = (t: string, ore: string) => {
    const w = is.generator_ore_weights[t]
    const total = Object.values<number>(w).reduce((a, b) => a + b, 0)
    return w[ore] === undefined ? '' : `${((w[ore] / total) * 100).toFixed(1)}%`
  }
  // 비용 = base x growth^(승급 횟수). 앞의 다섯 번만 계산해 보여 준다
  const costs = Object.entries<{ base: number; growth: number }>(is.upgrade_costs)
  return (
    <Page title="섬 자원" lead="섬에서 캐고, 키우고, 베는 것의 단계와 수치입니다." icon={['island', 'gray']}>
      <Panel title="광석" tex="stone">
        <Table
          cols={[{ label: '광석', main: true, w: 1.4 }, { label: '채굴 레벨', right: true }, { label: '경험치', right: true }, ...tiers.map((t) => ({ label: `생성기 ${TIER[t] ?? t}`, right: true }))]}
          rows={is.ores.map((o: any) => [o.ore, `Lv.${o.mining_level}`, o.exp, ...tiers.map((t) => share(t, o.ore))])}
          keys={ores}
        />
        <p className={cx(ui.note, 't-tiny')}>생성기 칸은 그 단계에서 해당 광석이 나올 비율입니다.</p>
      </Panel>

      <div className={ui.cols}>
        <Panel title="보석" tex="deepslate">
          <p className="t-dim">{tx(is.gems.chance)}</p>
          <Table keep cols={[{ label: '보석', main: true, w: 1.6 }, { label: '채굴', right: true }, { label: '경험치', right: true }]} rows={is.gems.list.map((g: any) => [<Ref key="r" r={g.gem} />, `Lv.${g.mining_level}`, g.exp])} />
        </Panel>
        <Panel title="작물" tex="dirt">
          <Table keep cols={[{ label: '작물', main: true, w: 1.6 }, { label: '농사', right: true }, { label: '경험치', right: true }]} rows={is.crops.map((c: any) => [
            <div key="c" className={cx('row', ui.gap8, ui.center)}><ItemIcon material={c.id} name={c.name} size={16} /><span>{c.name}</span></div>, `Lv.${c.level}`, c.exp,
          ])} />
        </Panel>
      </div>

      <Panel title="약초" tex="grass-side">
        <Table
          cols={[{ label: '약초', main: true, w: 1.4 }, { label: '씨앗', w: 1.4 }, { label: '농사 레벨', right: true }, { label: '수확', right: true }, { label: '씨앗 확률', right: true }, { label: '경험치', right: true }]}
          rows={is.herbs.map((h: any) => [<Ref key="p" r={h.product} />, <Ref key="s" r={h.seed} />, `Lv.${h.farming_level}`, `${d.range(h.harvest)}개`, d.pct(h.seed_chance), h.exp])}
        />
      </Panel>

      <Panel title="나무" tex="log">
        <Table
          cols={[{ label: '원목', main: true, w: 1.3 }, { label: '묘목', w: 1.2 }, { label: '벌목 레벨', right: true }, { label: '원목당 경험치', right: true }, { label: '부산물', w: 1.4 }, { label: '확률', right: true, w: 0.6 }]}
          rows={is.trees.map((t: any) => [t.tree, t.sapling, `Lv.${t.woodcutting_level}`, t.exp_per_log, t.byproduct ? <Ref key="b" r={t.byproduct} /> : '', t.byproduct ? d.pct(t.byproduct_chance) : ''])}
        />
      </Panel>

      <Panel title="업그레이드 비용" tex="cobble">
        <p className="t-dim">{tx(is.upgrade_cost_formula)}</p>
        <Table
          cols={[{ label: '업그레이드', main: true, w: 1.6 }, { label: '지불', w: 1.2 }, ...[1, 2, 3, 4, 5].map((n) => ({ label: `${n}번째`, right: true }))]}
          rows={costs.map(([key, c]) => {
            const [kind, ...pay] = key.split('-')
            return [UP[kind] ?? kind, PAY[pay.join('-')] ?? pay.join('-'), ...[0, 1, 2, 3, 4].map((n) => <span key={n} className="t-num">{d.num(Math.round(c.base * Math.pow(c.growth, n)))}</span>)]
          })}
        />
        <KV rows={[
          ['균열 확률', Object.entries<number>(is.rift_chance_percent).map(([k, v]) => `${k.replace('tier', '')}단계 ${v}%`).join(', ')],
          ['섬 인원', `최대 ${is.max_members}명`],
        ]} />
      </Panel>
    </Page>
  )
}
