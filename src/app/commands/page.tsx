import Filter from '@/components/Filter'
import { Page, Panel, Table, cx, ui } from '@/components/ui'
import * as d from '@/lib/data'
import s from '../list.module.css'

export const metadata = { title: '명령어' }

export default function Commands() {
  const { commands, keys } = d.commands()
  return (
    <Page title="명령어" lead="채팅창에 입력합니다. 줄임말도 같은 동작입니다." icon={['chat', 'gray']}>
      <Panel title="단축키" tex="stone">
        <Table keep cols={[{ label: '키', main: true }, { label: '동작', w: 2 }]} rows={keys.map((k) => [<code key="k">{d.clean(k.key)}</code>, d.clean(k.description)])} />
      </Panel>
      <Panel title="명령어" aside={<span className="t-faint">{commands.length}개</span>}>
        <Filter scope="#cmds" placeholder="명령어나 설명으로 찾기" />
        <ul className={cx(s.cardGrid, ui.stage)} id="cmds">
          {commands.map((c) => (
            <li key={c.command} className={s.card} data-k={[c.command, ...c.aliases, c.description].join(' ')}>
              <div className={s.cardHead}>
                <code className={s.cardName}>{c.command}</code>
              </div>
              <p>{d.clean(c.description)}</p>
              <p className={cx('t-tiny t-faint')}>{c.aliases.join(', ')}</p>
            </li>
          ))}
        </ul>
      </Panel>
    </Page>
  )
}
