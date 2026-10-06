import { BlockLink, Page, Panel, cx, ui } from '@/components/ui'

export const metadata = { title: '없는 페이지' }

export default function NotFound() {
  return (
    <Page title="없는 페이지" lead="주소가 바뀌었거나 지워진 페이지입니다." icon={['sign', 'gray']}>
      <Panel tex="cobble">
        <p>위쪽 검색창에서 이름으로 찾거나, 아래에서 이동하시면 됩니다.</p>
        <div className={cx('wrap', ui.gap8)}>
          <BlockLink href="/" tone="grass" icon={['house', 'gray']}>홈</BlockLink>
          <BlockLink href="/items/" icon={['chest', 'gray']}>아이템 도감</BlockLink>
          <BlockLink href="/guide/" icon={['book', 'red']}>가이드</BlockLink>
        </div>
      </Panel>
    </Page>
  )
}
