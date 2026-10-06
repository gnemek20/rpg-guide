export type NavItem = { href: string; label: string; icon: [string, string]; scene: SceneKey; hint: string }
export type SceneKey = 'plains' | 'mine' | 'dock' | 'island' | 'dungeon'

export const NAV: { group: string; items: NavItem[] }[] = [
  {
    group: '안내',
    items: [
      { href: '/', label: '홈', icon: ['house', 'gray'], scene: 'plains', hint: '처음 화면' },
      { href: '/notices/', label: '공지', icon: ['sign', 'gray'], scene: 'plains', hint: '점검, 패치' },
      { href: '/guide/', label: '가이드', icon: ['book', 'red'], scene: 'plains', hint: '시스템 설명 9종' },
      { href: '/commands/', label: '명령어', icon: ['chat', 'gray'], scene: 'plains', hint: '명령어, 단축키' },
    ],
  },
  {
    group: '도감',
    items: [
      { href: '/items/', label: '아이템', icon: ['chest', 'gray'], scene: 'mine', hint: '장비, 재료, 소비' },
      { href: '/tree/', label: '제작 트리', icon: ['craft', 'gray'], scene: 'mine', hint: '재료에서 완성품까지' },
      { href: '/monsters/', label: '몬스터', icon: ['skull', 'white'], scene: 'dungeon', hint: '사냥터, 드롭' },
      { href: '/spells/', label: '마법', icon: ['wand', 'gray'], scene: 'dungeon', hint: '주문서, 소환' },
      { href: '/enchants/', label: '잠재능력', icon: ['book', 'purple'], scene: 'mine', hint: '등급별 효과' },
      { href: '/fishing/', label: '낚시', icon: ['fishingrod', 'gray'], scene: 'dock', hint: '어종, 조건' },
    ],
  },
  {
    group: '시스템',
    items: [
      { href: '/enhance/', label: '강화', icon: ['anvil', 'gray'], scene: 'mine', hint: '확률, 비용, 각성' },
      { href: '/island/', label: '섬', icon: ['island', 'gray'], scene: 'island', hint: '자원, 업그레이드' },
      { href: '/challenges/', label: '도전', icon: ['tower', 'gray'], scene: 'dungeon', hint: '시련의 탑, 보스' },
      { href: '/progress/', label: '진행', icon: ['trophy', 'gray'], scene: 'island', hint: '도감, 업적, 출석' },
      { href: '/economy/', label: '경제', icon: ['coin', 'gold'], scene: 'plains', hint: '상점, 은행, 경매' },
    ],
  },
]

export const ALL_NAV = NAV.flatMap((g) => g.items)

/** 현재 경로가 속한 메뉴. 가장 길게 맞는 항목을 고른다. */
export function navOf(pathname: string): NavItem {
  const p = pathname.endsWith('/') ? pathname : pathname + '/'
  let best = ALL_NAV[0]
  for (const n of ALL_NAV) if (n.href !== '/' && p.startsWith(n.href) && n.href.length > best.href.length) best = n
  return best
}

/** 가이드 문서별 배경 */
const GUIDE_SCENE: Record<string, SceneKey> = { island: 'island', fishing: 'dock', gear: 'mine', magic: 'dungeon', challenge: 'dungeon' }
export function sceneOf(pathname: string): SceneKey {
  const m = pathname.match(/\/guide\/([^/]+)/)
  if (m && GUIDE_SCENE[m[1]]) return GUIDE_SCENE[m[1]]
  return navOf(pathname).scene
}
