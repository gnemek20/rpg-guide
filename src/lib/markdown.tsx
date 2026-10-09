// 마크다운 처리. 빌드 때만 실행된다 (화면으로 가는 코드에는 들어가지 않는다).
// - 공지, 가이드 본문: parse() 로 나눈 뒤 Md 가 칸을 짠다
// - data/*.yml 의 설명문 같은 한 줄 글자: tx() (React), inlineHtml() (화면 쪽 컴포넌트에 넘길 HTML), plain() (검색용 글자)
// 수식은 $...$ / $$...$$ 로 쓰고 KaTeX 가 그린다.
import Link from 'next/link'
import type { Element, Root as HRoot } from 'hast'
import { toHtml } from 'hast-util-to-html'
import { toJsxRuntime } from 'hast-util-to-jsx-runtime'
import type { PhrasingContent, Root, RootContent } from 'mdast'
import type { ReactNode } from 'react'
import { Fragment, jsx, jsxs } from 'react/jsx-runtime'
import rehypeKatex from 'rehype-katex'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import { unified } from 'unified'
import s from '@/components/md.module.css'
import { resolveHref } from './content'
import { clean } from './data'

// 물결표 하나는 범위(Lv.1~10)로 쓰이므로 취소선은 ~~ 두 개일 때만
const parser = unified().use(remarkParse).use(remarkGfm, { singleTilde: false }).use(remarkMath)
const toHast = unified().use(remarkRehype).use(rehypeKatex)

/** 글 안의 HTML 은 <br> 만 줄바꿈으로 받고, 나머지(<이름> 같은 표기)는 글자 그대로 둔다 */
function fixHtml(nodes: PhrasingContent[]): PhrasingContent[] {
  return nodes.map((n) => {
    if (n.type === 'html') return /^<br\s*\/?>$/i.test(n.value.trim()) ? { type: 'break' } : { type: 'text', value: n.value }
    if ('children' in n) return { ...n, children: fixHtml(n.children as PhrasingContent[]) } as PhrasingContent
    return n
  })
}

export function parse(src: string): Root {
  return parser.parse(src)
}

function hastOf(nodes: PhrasingContent[]): HRoot {
  const tree = toHast.runSync({ type: 'root', children: [{ type: 'paragraph', children: fixHtml(nodes) }] }) as HRoot
  const p = tree.children.find((c): c is Element => c.type === 'element' && c.tagName === 'p')
  return { type: 'root', children: p ? p.children : [] }
}

function A({ href = '', children }: { href?: string; children?: ReactNode }) {
  const to = resolveHref(href)
  return to.startsWith('/') ? <Link href={to} className={s.a}>{children}</Link> : <a href={to} className={s.a} rel="noreferrer">{children}</a>
}
const Em = ({ children }: { children?: ReactNode }) => <em className={s.em}>{children}</em>

/** 문장 안의 마크다운 조각(굵게, 링크, 수식 등)을 React 로 */
export function phrasing(nodes: PhrasingContent[]): ReactNode {
  return toJsxRuntime(hastOf(nodes), { Fragment, jsx, jsxs, components: { a: A, em: Em } })
}

/** $$...$$ 로 쓴 따로 선 수식 */
export function mathBlock(node: RootContent): ReactNode {
  const tree = toHast.runSync({ type: 'root', children: [node] }) as HRoot
  return toJsxRuntime(tree, { Fragment, jsx, jsxs })
}

/** 마크다운 표시를 걷어 낸 글자 (목차, 표 머리글, 검색용) */
export function textOf(nodes: readonly unknown[]): string {
  return nodes.map((n) => {
    const x = n as { type: string; value?: string; children?: unknown[] }
    if (x.type === 'html') return /^<br/i.test(x.value ?? '') ? ' ' : x.value ?? ''
    if (x.type === 'break') return ' '
    return x.children ? textOf(x.children) : x.value ?? ''
  }).join('')
}

// 이 글자들이 없으면 마크다운일 수 없으니 그대로 쓴다 (대부분의 글자가 여기서 끝난다)
const MAYBE = /[*_`$[\]~\\<&]|https?:|www\./
// 한 줄 글자가 목록, 인용, 제목으로 읽히지 않게 맨 앞 기호를 글자로 고정한다
const guard = (t: string) => t.replace(/^(\s*)([-+*>#]|\d+[.)])(?=\s)/, (_, sp, mark) => `${sp}${mark.length > 1 ? mark.slice(0, -1) + '\\' + mark.slice(-1) : '\\' + mark}`)

function inlineNodes(text: string): PhrasingContent[] {
  const out: PhrasingContent[] = []
  for (const b of parse(guard(text)).children) {
    if (out.length) out.push({ type: 'break' })
    if (b.type === 'paragraph') out.push(...b.children)
    else out.push({ type: 'text', value: textOf([b]) })
  }
  return out
}

/** data 의 한 줄 글자. 글자 정리(clean) 뒤 마크다운을 적용한다. */
export function tx(text: string | undefined | null): ReactNode {
  const t = clean(text)
  // 굵은 글씨 같은 조각이 flex 칸 안에서 따로 놀지 않게 한 덩어리로 묶는다
  return MAYBE.test(t) ? <span>{phrasing(inlineNodes(t))}</span> : t
}

const esc = (t: string) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
/** tx 와 같지만 HTML 글자로 돌려준다. 화면 쪽 컴포넌트에 값으로 넘길 때 쓴다. */
export function inlineHtml(text: string | undefined | null): string {
  const t = clean(text)
  return MAYBE.test(t) ? toHtml(hastOf(inlineNodes(t))) : esc(t)
}

/** 마크다운 표시 없는 글자 */
export function plain(text: string | undefined | null): string {
  const t = clean(text)
  return MAYBE.test(t) ? textOf(inlineNodes(t)) : t
}
