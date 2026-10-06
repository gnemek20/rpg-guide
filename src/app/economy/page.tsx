import Filter from '@/components/Filter'
import { Ref } from '@/components/refs'
import { KV, Page, Panel, Table, cx, ui } from '@/components/ui'
import * as d from '@/lib/data'
import s from '../list.module.css'

export const metadata = { title: '경제' }

export default function Economy() {
  const ec = d.economy()
  const tabs: { npc: string; tab: string; items: { id: string; name: string; buy_price?: number; sell_price?: number }[] }[] = ec.shop_tabs
  const key = (t: { npc: string; tab: string }) => d.clean(t.tab)
  return (
    <Page title="경제" lead="상점 가격과 거래, 은행, 경매 수수료입니다." icon={['coin', 'gold']}>
      <div className={ui.cols}>
        <Panel title="거래" tex="planks">
          <KV rows={[['방법', <code key="h">{ec.trade.how}</code>], ['수수료', d.clean(ec.trade.fee)]]} />
        </Panel>
        <Panel title="은행" tex="stone-bricks">
          <KV rows={[['이자', d.clean(ec.bank.interest)], ['송금', d.clean(ec.bank.transfer)]]} />
        </Panel>
        <Panel title="경매" tex="dark-planks">
          <KV rows={[
            ['등록 수수료', d.clean(ec.auction.listing_fee)], ['거래세', ec.auction.sales_tax],
            ['기간', `${ec.auction.duration_hours}시간`], ['등록 한도', `${ec.auction.max_listings}개`], ['참고', d.clean(ec.auction.note)],
          ]} />
        </Panel>
      </div>

      <Panel title="상점 할인">
        <p className="t-dim">상점에서 쓴 골드가 쌓이면 구매가가 내려갑니다.</p>
        <Table keep cols={[{ label: '누적 사용 골드', main: true }, { label: '할인', right: true }]} rows={[...ec.shop_discount].sort((a: any, b: any) => a.spent - b.spent).map((x: any) => [<span key="s" className="t-num">{d.num(x.spent)}G 이상</span>, <span key="d" className="t-gold">{x.discount}</span>])} />
      </Panel>

      <Panel title="상점" tex="cobble">
        <Filter scope="#shop" placeholder="품목 이름으로 찾기" groups={[{ param: 't', attr: 't', options: tabs.map((t) => ({ v: key(t), label: key(t) })) }]} />
        <div id="shop" className={cx(ui.gap12, ui.stage)}>
          {tabs.map((t, ti) => (
            <div key={key(t)} className={ui.gap8} data-group>
              <div className={cx('row', ui.gap8, ui.center)}>
                <h3 className={ui.sub}>{key(t)}</h3>
                <span className="t-faint">{d.clean(t.npc)}</span>
              </div>
              <ul className={s.cells}>
                {t.items.map((it) => (
                  <li key={it.id} className={s.cell} data-k={it.name} data-t={key(t)} hidden={ti > 0}>
                    <Ref r={it} />
                    <span className={ui.grow} />
                    {it.buy_price !== undefined && <span className="t-gold t-num">{d.num(it.buy_price)}G</span>}
                    {it.sell_price !== undefined && <span className="t-dim t-num">판매 {d.num(it.sell_price)}G</span>}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Panel>
    </Page>
  )
}
