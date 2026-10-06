import Link from 'next/link'
import { Icon, Page, Panel, ui } from '@/components/ui'
import { notices } from '@/lib/content'
import { clean } from '@/lib/data'
import s from '../list.module.css'

export const metadata = { title: '공지' }

export default function Notices() {
  const list = notices()
  return (
    <Page title="공지" lead="점검과 패치 내용입니다." icon={['sign', 'gray']}>
      <Panel tex="planks">
        {list.length === 0 ? (
          <p className={ui.empty}>아직 공지가 없습니다.</p>
        ) : (
          <ul className={ui.gap4}>
            {list.map((n) => (
              <li key={n.slug}>
                <Link href={`/notices/${n.slug}/`} className={s.rowLink} data-hot>
                  <Icon shape="sign" />
                  <span className={s.rowTitle}>{clean(n.title)}</span>
                  <span className="t-tiny t-faint">{n.date}</span>
                  <Icon shape="arrow" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </Page>
  )
}
