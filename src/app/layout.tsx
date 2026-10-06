import type { Metadata, Viewport } from 'next'
import type { ReactNode } from 'react'
import IconHover from '@/components/IconHover'
import SceneCanvas from '@/components/scene/Scene'
import Shell from '@/components/shell/Shell'
import { meta } from '@/lib/data'
import './globals.css'

export function generateMetadata(): Metadata {
  const m = meta()
  return {
    title: { default: m.site_name, template: `%s / ${m.site_name}` },
    description: '마인크래프트 RPG 서버 공식 안내서입니다. 아이템, 제작 트리, 강화 확률, 몬스터, 점검 공지를 담았습니다.',
  }
}
export const viewport: Viewport = { themeColor: '#121110', width: 'device-width', initialScale: 1 }

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <SceneCanvas />
        <Shell siteName={meta().site_name}>{children}</Shell>
        <IconHover />
      </body>
    </html>
  )
}
