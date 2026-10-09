import type { Metadata, Viewport } from 'next'
import type { ReactNode } from 'react'
import SceneCanvas from '@/components/scene/Scene'
import Shell from '@/components/shell/Shell'
import { FONTS } from '@/generated/fonts'
import { meta } from '@/lib/data'
import 'katex/dist/katex.min.css'
import './globals.css'

export function generateMetadata(): Metadata {
  const m = meta()
  return {
    title: { default: m.site_name, template: `%s / ${m.site_name}` },
    description: '마인크래프트 RPG 서버 공식 안내서입니다. 아이템, 제작 트리, 강화 확률, 몬스터, 점검 공지를 담았습니다.',
  }
}
export const viewport: Viewport = { themeColor: '#121110', width: 'device-width', initialScale: 1 }

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? ''
const fontUrl = (f: { file: string; v: string }) => `${BASE}/gen/fonts/${f.file}?v=${f.v}`

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko">
      <head>
        {/* 글꼴을 먼저 받아 두고, 받는 동안 대체 글꼴로 그리지 않는다. 글자 폭이 바뀌며 화면이 밀리는 일을 막는다 */}
        {FONTS.map((f) => (
          <link key={f.file} rel="preload" as="font" type="font/woff2" crossOrigin="anonymous" href={fontUrl(f)} />
        ))}
        <style>{FONTS.map((f) => `@font-face{font-family:'${f.family}';src:url('${fontUrl(f)}') format('woff2');font-weight:${f.weight};font-style:normal;font-display:block}`).join('')}</style>
      </head>
      <body>
        <SceneCanvas />
        <Shell siteName={meta().site_name}>{children}</Shell>
      </body>
    </html>
  )
}
