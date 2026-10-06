const CHO = 'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ'

/** 한글 음절을 초성으로 바꾼다. "뒤틀린 철" -> "ㄷㅌㄹ ㅊ" */
export function chosung(s: string): string {
  let out = ''
  for (const ch of s) {
    const c = ch.charCodeAt(0) - 0xac00
    out += c >= 0 && c < 11172 ? CHO[Math.floor(c / 588)] : ch
  }
  return out
}
const isChosungOnly = (q: string) => /^[ㄱ-ㅎ\s]+$/.test(q)
export const norm = (s: string) => s.toLowerCase().replace(/\s+/g, '')

/** 일치 점수. 0이면 불일치. 앞에서 맞을수록 높다. */
export function score(name: string, q: string): number {
  const n = norm(name), k = norm(q)
  if (!k) return 0
  if (n === k) return 100
  if (n.startsWith(k)) return 80
  const i = n.indexOf(k)
  if (i >= 0) return 60 - Math.min(i, 20)
  if (isChosungOnly(q)) {
    const c = norm(chosung(name))
    if (c.startsWith(k)) return 40
    if (c.includes(k)) return 25
  }
  return 0
}
