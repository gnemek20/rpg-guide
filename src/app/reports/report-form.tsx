'use client'

import { useRef, useState, type FormEvent } from 'react'
import { Panel, ui } from '@/components/ui'
import s from './reports.module.css'

const API = (process.env.NEXT_PUBLIC_REPORT_API_URL ?? '').trim().replace(/\/$/, '')

export default function ReportForm() {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [receipt, setReceipt] = useState('')
  const lock = useRef(false)
  const request = useRef({ signature: '', id: '' })

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!API || lock.current) return
    const data = Object.fromEntries(new FormData(event.currentTarget).entries())
    const signature = JSON.stringify(data)
    if (request.current.signature !== signature) request.current = { signature, id: crypto.randomUUID() }
    lock.current = true
    setBusy(true)
    setError('')
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 15000)
    try {
      const response = await fetch(`${API}/api/reports`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, requestId: request.current.id }), signal: controller.signal,
        credentials: 'omit', referrerPolicy: 'no-referrer',
      })
      const body = await response.json()
      if (!response.ok) throw new Error(body.error || '접수하지 못했습니다. 잠시 후 다시 시도해 주세요.')
      if (response.status !== 201 || typeof body.id !== 'string' || !/^BUG-[A-F0-9]{12}$/.test(body.id)) throw new Error('접수 결과를 확인하지 못했습니다. 같은 내용으로 다시 시도해 주세요.')
      setReceipt(body.id)
    } catch (e) {
      setError(e instanceof Error && e.name !== 'AbortError' && !(e instanceof TypeError)
        ? e.message : '접수 서버에 연결하지 못했습니다. 작성 내용은 유지됩니다. 잠시 후 다시 시도해 주세요.')
    } finally {
      clearTimeout(timeout)
      lock.current = false
      setBusy(false)
    }
  }

  if (receipt) return <Panel title="신고가 접수되었습니다" tex="planks">
    <div className={s.success} role="status">
      <p>접수 번호를 보관해 주세요.</p><strong className={s.receipt}>{receipt}</strong>
      <p>신고 내용은 운영자만 확인할 수 있습니다. 작성하신 닉네임은 본인 인증 정보로 사용되지 않습니다.</p>
      <button className={`${ui.btn} ${ui.btnGrass}`} onClick={() => { setReceipt(''); request.current = { signature: '', id: '' } }}>새 신고 작성</button>
    </div>
  </Panel>

  return <div className={s.layout}>
    <Panel title="문제 알려주기" aside={<span className="t-dim">* 필수 입력</span>} tex="planks" className={s.main}>
      {!API && <p className={s.notice} role="status">신고 접수를 준비하고 있습니다. 접수 창이 열리면 이곳에서 문제를 알려 주세요.</p>}
      <form onSubmit={submit} className={s.form}>
        <fieldset disabled={!API || busy} className={s.fields}>
          <div className={s.row}>
            <label className={s.field}>게임 닉네임 *<input name="nickname" required minLength={2} maxLength={32} autoComplete="nickname" placeholder="게임에서 사용하는 이름" /></label>
            <label className={s.field}>문제 분류 *<select name="category" required defaultValue=""><option value="" disabled>분류 선택</option>{['전투', '아이템', '섬과 채집', '퀘스트', '웹페이지', '기타'].map(v => <option key={v}>{v}</option>)}</select></label>
          </div>
          <label className={s.field}>제목 *<input name="title" required minLength={4} maxLength={100} placeholder="어떤 문제가 발생했나요?" /></label>
          <label className={s.field}>발생한 문제 *<textarea name="description" required minLength={20} maxLength={4000} rows={6} placeholder="문제가 발생한 상황과 실제로 일어난 일을 20자 이상 적어 주세요." /></label>
          <label className={s.field}>재현 순서 <span className="t-dim">선택</span><textarea name="steps" maxLength={2000} rows={3} placeholder={'1. 어떤 행동을 했는지\n2. 어느 순간 문제가 생겼는지'} /></label>
          <label className={s.field}>예상한 동작 <span className="t-dim">선택</span><textarea name="expected" maxLength={1000} rows={2} placeholder="정상적으로는 어떻게 동작해야 하나요?" /></label>
          <label className={s.field}>발생 시각 또는 장소 <span className="t-dim">선택</span><input name="occurred" maxLength={120} placeholder="예: 10월 9일 오후 8시, 시작의 마을" /></label>
          <label className={s.trap} aria-hidden="true">Website<input name="website" tabIndex={-1} autoComplete="off" /></label>
          <p className={s.hint}>비밀번호나 연락처 등 개인 정보는 적지 마세요. 신고 내용과 닉네임은 문제 확인을 위해 운영자에게 전달됩니다.</p>
          <button type="submit" className={`${ui.btn} ${ui.btnGrass} ${s.submit}`}>{busy ? '접수 중...' : '신고 보내기'}</button>
        </fieldset>
        {error && <p className={s.error} role="alert">{error}</p>}
      </form>
    </Panel>
    <aside className={s.aside}>
      <Panel title="이렇게 적어 주세요">
        <ol className={s.tips}><li><b>01. 상황</b><span>사용한 장비나 머물던 장소를 함께 알려 주세요.</span></li><li><b>02. 순서</b><span>문제가 생기기 직전 행동을 차례로 적어 주세요.</span></li><li><b>03. 결과</b><span>기대한 동작과 실제 결과를 비교해 주세요.</span></li></ol>
      </Panel>
      <p className={s.hint}>신고 내용은 공개되지 않습니다. 보낸 뒤에는 표시되는 접수 번호를 보관해 주세요.</p>
      <Panel title="게임에서 바로 신고하기">
        <p>게임 안에서도 <code>/신고 내용</code>으로 버그를 접수할 수 있습니다.</p>
        <p className={s.hint}>예: /신고 장비를 바꿨는데 상태창 수치가 그대로입니다</p>
      </Panel>
    </aside>
  </div>
}
