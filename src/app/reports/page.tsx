import type { Metadata } from 'next'
import { Page } from '@/components/ui'
import ReportForm from './report-form'

export const metadata: Metadata = { title: '버그 신고' }

export default function ReportsPage() {
  return <Page title="버그 신고" lead="모험 중 발견한 문제를 알려 주세요. 보내 주신 내용은 운영자가 확인합니다." icon={['chat', 'gray']}>
    <ReportForm />
  </Page>
}
