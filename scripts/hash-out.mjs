// out/ 전체의 해시를 출력한다. 같은 data/ 로 두 번 빌드해 값이 같은지 볼 때 쓴다.
import { createHash } from 'node:crypto'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

const h = createHash('sha256')
let files = 0
const walk = (p) => {
  for (const n of readdirSync(p).sort()) {
    const f = join(p, n)
    if (statSync(f).isDirectory()) walk(f)
    else { files++; h.update(f.replace(/\\/g, '/')).update(readFileSync(f)) }
  }
}
walk('out')
console.log(`${h.digest('hex')}  (${files} files)`)
