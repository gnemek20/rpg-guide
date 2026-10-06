import Board from '@/components/map/Board'
import { BlockLink, Page, Panel, cx, ui } from '@/components/ui'
import { spellBoard } from '@/lib/boards'

export const metadata = { title: '마법' }

export default function Spells() {
  return (
    <Page title="마법" lead="등급 순서로 놓았습니다. 주문서를 누르면 수치와 제작 재료가 나옵니다." icon={['wand', 'gray']}>
      <Board data={spellBoard()} param="s" placeholder="마법 이름 찾기" />
      <Panel>
        <div className={cx('wrap', ui.gap12, ui.center)}>
          <span className="t-dim">보라색 주문서는 소환 마법입니다. 주문서는 무기에 각인해서 씁니다.</span>
          <span className={ui.grow} />
          <BlockLink href="/guide/magic/" small>마법 가이드</BlockLink>
        </div>
      </Panel>
    </Page>
  )
}
