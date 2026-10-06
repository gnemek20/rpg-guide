// 정적 export 후처리.
// Next는 세그먼트 prefetch 파일을 `__next.tree/__PAGE__.txt` 처럼 폴더로 내보내지만
// 브라우저는 `__next.tree.__PAGE__.txt` 를 요청한다. 정적 호스팅에서는 404가 나서
// 미리 받기가 무효가 되므로, 요청하는 이름으로 옮겨 둔다.
import { readdirSync, renameSync, rmSync, statSync } from 'node:fs'
import { join } from 'node:path'

let moved = 0
function flatten(dir, base, prefix) {
  for (const n of readdirSync(dir)) {
    const p = join(dir, n)
    if (statSync(p).isDirectory()) flatten(p, base, `${prefix}.${n}`)
    else { renameSync(p, join(base, `${prefix}.${n}`)); moved++ }
  }
}
function walk(dir) {
  for (const n of readdirSync(dir)) {
    const p = join(dir, n)
    if (!statSync(p).isDirectory()) continue
    if (n.startsWith('__next.')) { flatten(p, dir, n); rmSync(p, { recursive: true }) }
    else if (n !== '_next') walk(p)
  }
}
walk('out')
console.log(`후처리: 세그먼트 파일 ${moved}개 이름 정리`)
