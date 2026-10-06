import Link from 'next/link'
import { Page, Panel } from '@/components/ui'
import { guides } from '@/lib/content'
import s from '../list.module.css'

export const metadata = { title: '가이드' }

export default function GuideIndex() {
  return (
    <Page title="가이드" lead="시스템별 설명입니다. 위에서부터 읽으면 됩니다." icon={['book', 'red']}>
      <Panel tex="grass-side">
        <ol className={s.guideGrid}>
          {guides().map((g, i) => (
            <li key={g.slug}>
              <Link href={`/guide/${g.slug}/`} className={s.guideCard}>
                <span className={s.guideNo}>{i + 1}</span>
                <span className={s.guideText}>
                  <span className={s.guideTitle}>{g.title}</span>
                  <span className="t-dim">{g.lead}</span>
                </span>
              </Link>
            </li>
          ))}
        </ol>
      </Panel>
    </Page>
  )
}
