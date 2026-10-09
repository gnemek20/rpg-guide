import { createHash } from 'node:crypto'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import type { NextConfig } from 'next'

// GitHub Pages는 /<저장소 이름>/ 아래에서 서빙되므로 basePath를 환경변수로 받는다.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? ''

/** 입력(data, content, src, 잠금 파일)이 같으면 빌드 id도 같게 해서, 같은 자료로는 같은 결과물이 나오게 한다. */
function inputHash(): string {
  const h = createHash('sha1')
  const walk = (p: string) => {
    if (statSync(p).isDirectory()) {
      for (const n of readdirSync(p).sort()) if (n !== 'generated') walk(join(p, n))
    } else h.update(p.replace(/\\/g, '/')).update(readFileSync(p))
  }
  ;['data', 'content', 'src', 'scripts', 'package-lock.json'].forEach(walk)
  return h.update(basePath).update(process.env.NEXT_PUBLIC_REPORT_API_URL ?? '').digest('hex').slice(0, 16)
}

const nextConfig: NextConfig = {
  output: 'export',
  basePath,
  trailingSlash: true,
  reactStrictMode: true,
  images: { unoptimized: true },
  generateBuildId: async () => inputHash(),
}

export default nextConfig
