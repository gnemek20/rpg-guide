// out/ 을 GitHub Pages와 같은 방식으로 띄운다. node scripts/preview.mjs [포트]
// NEXT_PUBLIC_BASE_PATH 를 주고 빌드했다면 같은 값을 주고 실행한다.
import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'

const base = process.env.NEXT_PUBLIC_BASE_PATH ?? ''
const port = Number(process.argv[2] ?? 4173)
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2', '.txt': 'text/plain; charset=utf-8', '.ico': 'image/x-icon',
}

createServer(async (req, res) => {
  let path = decodeURIComponent(new URL(req.url, 'http://x').pathname)
  if (base && !path.startsWith(base)) { res.writeHead(302, { location: base + '/' }).end(); return }
  path = normalize(path.slice(base.length)).replace(/^(\.\.[/\\])+/, '')
  let file = join('out', path)
  try {
    if ((await stat(file)).isDirectory()) file = join(file, 'index.html')
  } catch {
    file = join('out', path + '.html')
  }
  try {
    const body = await readFile(file)
    res.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream' }).end(body)
  } catch {
    res.writeHead(404, { 'content-type': 'text/html; charset=utf-8' }).end(await readFile('out/404.html').catch(() => 'not found'))
  }
}).listen(port, () => console.log(`미리보기: http://localhost:${port}${base}/`))
