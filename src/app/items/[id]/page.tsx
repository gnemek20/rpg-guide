import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Ref, RefSlot } from '@/components/refs'
import { BlockLink, Chip, Icon, ItemIcon, KV, Page, Panel, Table, cx, ui } from '@/components/ui'
import * as d from '@/lib/data'
import s from '../../list.module.css'
import { tx } from '@/lib/markdown'

export const dynamicParams = false
export const generateStaticParams = () => d.items().map((i) => ({ id: d.itemSlug(i.id) }))

type P = { params: Promise<{ id: string }> }
const find = (slug: string) => d.items().find((i) => d.itemSlug(i.id) === slug)
export async function generateMetadata({ params }: P) {
  return { title: find((await params).id)?.name }
}

/** 제작대 3x3. shape의 글자 A, B, C가 재료 순서와 같다. */
function Bench({ r }: { r: d.Recipe }) {
  const cells = (r.shape ?? []).join('').padEnd(9, ' ').slice(0, 9).split('')
  const per = new Map<string, number>()
  for (const ch of cells) if (ch !== ' ') per.set(ch, (per.get(ch) ?? 0) + 1)
  return (
    <div className={s.bench}>
      <div className={s.benchGrid}>
        {cells.map((ch, i) => {
          const ing = ch === ' ' ? undefined : r.ingredients[ch.charCodeAt(0) - 65]
          return ing ? <RefSlot key={i} r={ing} amount={Math.round(ing.amount / (per.get(ch) ?? 1))} /> : <div key={i} className={ui.slot} />
        })}
      </div>
      <Icon shape="arrow" size={32} className={s.benchArrow} />
      <RefSlot r={r.result} />
    </div>
  )
}

export default async function ItemPage({ params }: P) {
  const it = find((await params).id)
  if (!it) notFound()
  const recipe = d.recipeFor(it.id)
  const uses = d.usedIn(it.id)
  const drops = d.dropsOf(it.id).sort((a, b) => b.drop.chance_percent - a.drop.chance_percent)
  const set = it.set ? d.setByName(it.set) : undefined
  const region = it.set ? d.regionOfSet(it.set) : d.regionOfItem(it.id)
  const totals = recipe ? [...d.rawTotals(it.id)].sort((a, b) => b[1] - a[1]) : []
  const showTotals = recipe && totals.some(([id]) => !recipe.ingredients.some((g) => g.id === id))
  // 제작, 양조, 드롭은 아래에 따로 그리므로 문장 목록에서는 뺀다
  const others = it.sources.filter((x) => !/^(제작|양조)/.test(x) && !/처치 [\d.]+%/.test(x)).map(d.clean)
  const fish = d.fishing().catches.find((c) => c.item === it.id)

  return (
    <Page title={it.name} icon={undefined} crumb={{ href: '/items/', label: '아이템 도감' }} lead={
      <span className={cx('wrap', ui.gap4)}>
        <Chip color="var(--grass)">{it.category}</Chip>
        {it.set && <Chip>{it.set} 세트</Chip>}
        {it.slot && <Chip>{it.slot}</Chip>}
        {it.level_band && <Chip>{it.level_band}</Chip>}
        {region && <Chip>{region.name}</Chip>}
      </span>
    }>
      <div className={ui.cols}>
        <Panel tex="cobble" title="정보">
          <div className={cx('row', ui.gap12)} style={{ alignItems: 'flex-start' }}>
            <div className={ui.slot} style={{ width: 72, height: 72 }} data-hot><ItemIcon material={it.icon_material} name={it.name} size={64} /></div>
            <div className={s.tip}>
              <span className={s.tipName}>{it.name}</span>
              {it.stats && Object.entries(it.stats).map(([k, v]) => <span key={k} className="t-grass">{k} +{v}</span>)}
              {it.description?.map((l, i) => <span key={i} className={s.tipLore}>{tx(l)}</span>)}
            </div>
          </div>
          <KV rows={[
            ...(it.sell_price ? [['판매가', <span key="p" className="t-gold">{d.num(it.sell_price)}G</span>] as [string, React.ReactNode]] : []),
            ...(fish ? [['낚시', <Link key="f" href="/fishing/" className={ui.ref}><span className={ui.refName}>{fish.rarity} 등급, 낚시 도감에서 조건 보기</span></Link>] as [string, React.ReactNode]] : []),
            ...(others.length ? [['얻는 곳', <>{others.map((o) => <span key={o}>{o}</span>)}</>] as [string, React.ReactNode]] : []),
          ]} />
        </Panel>

        {set && (
          <Panel tex="stone" title={`${set.name} 세트`}>
            <div className={ui.gap4}>
              {Object.entries(set.bonus).map(([n, b]) => (
                <div key={n} className={s.bonus}>
                  <Chip color="var(--grass)">{n}</Chip>
                  <span>{Object.entries(b).map(([k, v]) => `${k} +${v}`).join(', ')}</span>
                </div>
              ))}
            </div>
            <div className={ui.gap4}>
              {set.members.map((m) => <Ref key={m.id} r={m} suffix={m.id === it.id ? <span className="t-faint">(지금 보는 아이템)</span> : undefined} />)}
            </div>
            {set.note && <p className={cx(ui.note, 't-tiny')}>{tx(set.note)}</p>}
          </Panel>
        )}
      </div>

      {recipe && (
        <Panel title={recipe.kind === 'brew' ? '양조' : '제작'} tex="planks" aside={<BlockLink href={`/tree/?item=${it.id}`} small tone="dirt">트리에서 보기</BlockLink>}>
          <div className={ui.cols}>
            <div className={ui.gap12}>
              {recipe.kind === 'craft' && recipe.shape && <Bench r={recipe} />}
              <KV rows={[
                ['재료', <>{recipe.ingredients.map((g) => <Ref key={g.id} r={g} />)}</>],
                ['결과', `${recipe.result.amount}개`],
                ...(recipe.kind === 'brew' ? [['조건', `농사 Lv.${recipe.farming_level}, ${recipe.seconds}초, 경험치 ${recipe.exp}`] as [string, string]] : []),
              ]} />
            </div>
            {showTotals && (
              <div className={ui.gap8}>
                <h3 className={ui.sub}>바닥 재료 합계</h3>
                <div className={ui.gap4}>{totals.map(([id, n]) => <Ref key={id} r={{ id, name: d.itemById(id)?.name ?? id }} amount={n} />)}</div>
              </div>
            )}
          </div>
        </Panel>
      )}

      {drops.length > 0 && (
        <Panel title="드롭" aside={<span className="t-faint">{drops.length}곳</span>}>
          <Table
            cols={[{ label: '몬스터', main: true, w: 1.4 }, { label: '사냥터' }, { label: '레벨', right: true, w: 0.5 }, { label: '확률', right: true, w: 0.6 }, { label: '수량', right: true, w: 0.5 }]}
            hrefs={drops.map(({ monster, region: r }) => `/monsters/?r=${r.id}#${monster.id}`)}
            rows={drops.map(({ monster, region: r, drop }) => [
              monster.name,
              r.name,
              `Lv.${monster.level}`,
              <span key="c" className="t-gold">{d.pct(drop.chance_percent)}</span>,
              d.range(drop.amount),
            ])}
          />
        </Panel>
      )}

      {uses.length > 0 && (
        <Panel title="쓰이는 곳" aside={<span className="t-faint">{uses.length}곳</span>}>
          <div className={s.cells}>
            {uses.map((u) => {
              const need = u.ingredients.find((g) => g.id === it.id)?.amount
              return <div key={u.result.id} className={s.cell}><Ref r={u.result} amount={undefined} suffix={<span className="t-dim t-num">{u.kind === 'brew' ? '양조' : '제작'}, {need}개 필요</span>} /></div>
            })}
          </div>
        </Panel>
      )}

      {!recipe && !drops.length && !uses.length && !others.length && <Panel><p className={ui.empty}>등록된 출처가 없습니다.</p></Panel>}
    </Page>
  )
}
