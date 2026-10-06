import Board from '@/components/map/Board'
import { BlockLink, Page, Panel, cx, ui } from '@/components/ui'
import { treeBoard } from '@/lib/boards'

export const metadata = { title: '제작 트리' }

export default function Tree() {
  const data = treeBoard()
  return (
    <Page title="제작 트리" lead="사냥터 순서로 놓았습니다. 항목을 누르면 재료와 이어집니다." icon={['craft', 'gray']}>
      <Board data={data} placeholder="아이템, 재료 찾기" />
      <Panel>
        <div className={cx('wrap', ui.gap12, ui.center)}>
          <span className="t-dim">갈색 칸은 재료, 금색 칸은 장신구입니다. 금색 선은 고른 항목의 재료와 쓰임을 잇습니다.</span>
          <span className={ui.grow} />
          <BlockLink href="/items/" small>목록으로 보기</BlockLink>
        </div>
      </Panel>
    </Page>
  )
}
