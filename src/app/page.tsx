import Link from 'next/link'
import { BlockLink, Icon, Panel, Table, cx, ui } from '@/components/ui'
import { notices } from '@/lib/content'
import * as d from '@/lib/data'
import { NAV } from '@/lib/nav'
import s from './home.module.css'

const TILE_TEX = ['grass-side', 'planks', 'stone', 'deepslate', 'dirt', 'cobble', 'dark-planks', 'stone-bricks', 'sand', 'deep-bricks', 'log']

export default function Home() {
  const m = d.meta()
  const news = notices().slice(0, 4)
  const counts: [string, number, string][] = [
    ['아이템', d.items().length, '/items/'],
    ['제작법', d.recipes().length, '/tree/'],
    ['몬스터', d.regions().reduce((n, r) => n + r.monsters.length, 0), '/monsters/'],
    ['마법', d.spells().spells.length, '/spells/'],
    ['잠재능력', d.enchants().enchants.length, '/enchants/'],
    ['어종', d.fishing().catches.length, '/fishing/'],
  ]
  const quick: [string, string, string?][] = [
    ['모든 메뉴', '/메뉴'],
    ['내 섬으로', '/섬'],
    ['사냥터로', '차원문지기 엘론', '/monsters/'],
    ['장비 입기', '/장비'],
    ['마법 배우기', '마법사 아이리스', '/spells/'],
    ['혼자 도전하는 보스', '메뉴 > 보스', '/challenges/'],
    ['매일 할 일', '/의뢰, /출석', '/progress/'],
    ['재료 얻는 곳', '/재료', '/items/'],
  ]
  const tiles = NAV.flatMap((g) => g.items).filter((n) => n.href !== '/')

  return (
    <main className={ui.page}>
      <header className={s.hero}>
        <span className={cx(ui.chip, s.tag)}>알파 테스트 {m.alpha_level_range}</span>
        <h1 className={s.title}>{m.site_name}</h1>
        <p className={s.lead}>
          게임 안에서 다 못 한 설명을 모았습니다.<br />
          게임에서는 <code>/가이드</code>로 엽니다.
        </p>
        <div className={cx('wrap', s.cta)}>
          <BlockLink href="/guide/start/" tone="grass" icon={['book', 'red']}>시작하기</BlockLink>
          <BlockLink href="/tree/" tone="dirt" icon={['craft', 'gray']}>제작 트리</BlockLink>
          <BlockLink href="/items/" icon={['chest', 'gray']}>아이템 도감</BlockLink>
        </div>
      </header>

      <ul className={s.counts}>
        {counts.map(([label, n, href]) => (
          <li key={label}>
            <Link href={href} className={s.count}>
              <span className={s.countN}>{d.num(n)}</span>
              <span className="t-tiny t-dim">{label}</span>
            </Link>
          </li>
        ))}
      </ul>

      <div className={ui.cols}>
        <Panel title="최근 공지" tex="planks" aside={<BlockLink href="/notices/" small>전체</BlockLink>}>
          <ul className={ui.gap4}>
            {news.map((n) => (
              <li key={n.slug}>
                <Link href={`/notices/${n.slug}/`} className={s.news} data-hot>
                  <Icon shape="sign" />
                  <span className={s.newsTitle}>{d.clean(n.title)}</span>
                  <span className="t-tiny t-faint">{n.date}</span>
                </Link>
              </li>
            ))}
          </ul>
        </Panel>
        <Panel title="처음이라면" tex="grass-side">
          <ol className={ui.gap8}>
            {[
              ['/guide/start/', '시작하기', '튜토리얼 다음에 할 일'],
              ['/guide/growth/', '성장', '레벨이 오르는 원리'],
              ['/tree/', '제작 트리', '레벨대별 장비와 재료'],
            ].map(([href, t, sub], i) => (
              <li key={href}>
                <Link href={href} className={s.step} data-hot>
                  <span className={s.stepN}>{i + 1}</span>
                  <span className={s.stepT}>{t}</span>
                  <span className="t-dim">{sub}</span>
                  <Icon shape="arrow" />
                </Link>
              </li>
            ))}
          </ol>
          <p className={ui.note}>{d.clean(m.level_rule)}</p>
        </Panel>
      </div>

      <Panel title="한눈에 보기" tex="stone">
        <Table
          keep
          cols={[{ label: '하고 싶은 것', main: true }, { label: '방법', w: 1 }, { label: '안내', w: 0.5, right: true }]}
          hrefs={quick.map(([, , href]) => href)}
          rows={quick.map(([want, how, href]) => [
            want,
            <span key="h" className="t-gold">{how}</span>,
            href ? <span key="l" className={ui.go}><span>보기</span><Icon shape="arrow" /></span> : null,
          ])}
        />
      </Panel>

      <ul className={s.tiles}>
        {tiles.map((n, i) => (
          <li key={n.href} className={s.tileWrap}>
            <Link href={n.href} className={s.tile} data-hot>
              <span className={s.tileTop} style={{ backgroundImage: `var(--tex-${TILE_TEX[i % TILE_TEX.length]})` }}>
                <Icon shape={n.icon[0]} mat={n.icon[1]} size={32} />
              </span>
              <span className={s.tileLabel}>{n.label}</span>
              <span className={cx('t-tiny t-dim', s.tileHint)}>{n.hint}</span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  )
}
