import { tx } from '@/lib/markdown'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import Md, { tocOf } from '@/components/Md'
import { BlockLink, Page, Panel } from '@/components/ui'
import { guides } from '@/lib/content'
import s from '../../list.module.css'

export const dynamicParams = false
export const generateStaticParams = () => guides().map((g) => ({ slug: g.slug }))

type P = { params: Promise<{ slug: string }> }
export async function generateMetadata({ params }: P) {
  const { slug } = await params
  return { title: guides().find((g) => g.slug === slug)?.title }
}

const TEX: Record<string, string> = { island: 'grass-side', fishing: 'water', gear: 'stone', magic: 'obsidian', challenge: 'deep-bricks', economy: 'planks', rules: 'cobble' }

export default async function Guide({ params }: P) {
  const { slug } = await params
  const all = guides()
  const i = all.findIndex((g) => g.slug === slug)
  if (i < 0) notFound()
  const g = all[i]
  const prev = all[i - 1], next = all[i + 1]
  return (
    <Page title={g.title} lead={g.lead ? tx(g.lead) : undefined} icon={['book', 'red']} crumb={{ href: '/guide/', label: '가이드' }}>
      <div className={s.doc}>
        <div className={s.docMain}>
          <Md src={g.body} tex={TEX[slug] ?? 'grass-side'} />
          <div className={s.pager}>
            {prev ? <BlockLink href={`/guide/${prev.slug}/`}>이전: {prev.title}</BlockLink> : <span />}
            {next && <BlockLink href={`/guide/${next.slug}/`} tone="grass">다음: {next.title}</BlockLink>}
          </div>
        </div>
        <aside className={s.toc}>
          <Panel title="이 문서">
            <ul className={s.tocList}>
              {tocOf(g.body).map((t) => (
                <li key={t.id}><a href={`#${t.id}`} className={s.tocLink}>{t.label}</a></li>
              ))}
            </ul>
          </Panel>
          <Panel title="전체 가이드">
            <ul className={s.tocList}>
              {all.map((x) => (
                <li key={x.slug}>
                  <Link href={`/guide/${x.slug}/`} className={s.tocLink} aria-current={x.slug === slug ? 'page' : undefined}>{x.title}</Link>
                </li>
              ))}
            </ul>
          </Panel>
        </aside>
      </div>
    </Page>
  )
}
