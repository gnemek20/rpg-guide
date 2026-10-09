import { tx } from '@/lib/markdown'
import { notFound } from 'next/navigation'
import Md from '@/components/Md'
import { Page } from '@/components/ui'
import { notices } from '@/lib/content'
import { clean } from '@/lib/data'

export const dynamicParams = false
export const generateStaticParams = () => notices().map((n) => ({ slug: n.slug }))

type P = { params: Promise<{ slug: string }> }
export async function generateMetadata({ params }: P) {
  const { slug } = await params
  return { title: clean(notices().find((n) => n.slug === slug)?.title) }
}

export default async function Notice({ params }: P) {
  const { slug } = await params
  const n = notices().find((x) => x.slug === slug)
  if (!n) notFound()
  return (
    <Page title={clean(n.title)} lead={n.lead ? tx(n.lead) : n.date} icon={['sign', 'gray']} crumb={{ href: '/notices/', label: '공지' }}>
      <Md src={n.body} tex="planks" />
    </Page>
  )
}
