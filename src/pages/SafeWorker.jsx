import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import { fetchWorkLogs, clockIn, clockOut, deleteWorkLog } from '../lib/api'

// ── 포맷 헬퍼 ────────────────────────────────────────────────────
const W = (n) => Number(n).toLocaleString('ko-KR') + ' ₩'

// ── 근무 유형 분류 ───────────────────────────────────────────────
function classifyLog(log) {
  const inTime = new Date(log.clock_in)
  const outTime = log.clock_out ? new Date(log.clock_out) : null
  if (!outTime) return { hours: 0, type: 'normal' }
  const hours = (outTime - inTime) / 3600000
  const day = inTime.getDay() // 0=Sun, 6=Sat
  const hour = inTime.getHours()

  if (day === 0 || day === 6) return { hours, type: 'weekend' }
  if (hour >= 22 || hour < 6) return { hours, type: 'night' }
  if (hours > 8) return { hours, type: 'overtime' }
  return { hours, type: 'normal' }
}

// ── 월간 통계 계산 ──────────────────────────────────────────────
function calcMonthStats(logs) {
  let total = 0, overtime = 0, night = 0, weekend = 0

  for (const log of logs) {
    const { hours, type } = classifyLog(log)
    total += hours
    if (type === 'overtime') overtime += Math.max(0, hours - 8)
    if (type === 'night') night += hours
    if (type === 'weekend') weekend += hours
  }

  // 시급 기준 9,860원 (2024 최저시급)
  const hourlyRate = 9860
  const overtimePay = Math.round(overtime * hourlyRate * 0.5)
  const nightPay = Math.round(night * hourlyRate * 0.5)
  const weekendPay = Math.round(weekend * hourlyRate * 0.5)

  return {
    total: Math.round(total * 10) / 10,
    overtime: Math.round(overtime * 10) / 10,
    night: Math.round(night * 10) / 10,
    weekend: Math.round(weekend * 10) / 10,
    overtimePay, nightPay, weekendPay,
    totalExtra: overtimePay + nightPay + weekendPay,
  }
}

// ── CSV 생성 ────────────────────────────────────────────────────
function generateCSV(logs, t) {
  const header = `${t('worker.logDate')},${t('worker.logIn')},${t('worker.logOut')},${t('worker.logHours')},${t('worker.logType')}\n`
  const rows = logs.map((log) => {
    const { hours, type } = classifyLog(log)
    const inTime = new Date(log.clock_in)
    const outStr = log.clock_out ? new Date(log.clock_out).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }) : '-'
    return `${inTime.toLocaleDateString('ko-KR')},${inTime.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })},${outStr},${hours.toFixed(1)},${t('worker.log' + type.charAt(0).toUpperCase() + type.slice(1))}`
  })
  return header + rows.join('\n')
}

// ══════════════════════════════════════════════════════════════════
// SafeWorker 페이지
// ══════════════════════════════════════════════════════════════════
function SafeWorker() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user } = useAuth()
  const chatEndRef = useRef(null)

  // ── 기능 1: 임금 체불 진단 ──
  const [wageExpected, setWageExpected] = useState('')
  const [wageActual, setWageActual] = useState('')
  const [wageResult, setWageResult] = useState(null) // null | { diff, isTheft }

  const handleWageCheck = () => {
    const expected = parseInt(String(wageExpected).replace(/,/g, '')) || 0
    const actual = parseInt(String(wageActual).replace(/,/g, '')) || 0
    if (!expected || !actual) return
    const diff = expected - actual
    setWageResult({ diff, isTheft: diff > 10000 }) // 1만원 이상 차이 시 체불 의심
  }

  // ── 기능 2: 출퇴근 기록 ──
  const now = new Date()
  const [selectedMonth, setSelectedMonth] = useState(
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`,
  )
  const [logs, setLogs] = useState([])
  const [activeLog, setActiveLog] = useState(null) // 현재 출근 중인 로그

  const loadLogs = useCallback(() => {
    if (!user) return
    fetchWorkLogs(user.id, selectedMonth)
      .then((data) => {
        setLogs(data)
        const active = data.find((l) => !l.clock_out)
        setActiveLog(active || null)
      })
      .catch(() => {})
  }, [user, selectedMonth])

  useEffect(() => { loadLogs() }, [loadLogs])

  const handleClockIn = async () => {
    if (!user) return
    try {
      const log = await clockIn(user.id)
      setActiveLog(log)
      loadLogs()
    } catch { /* ignore */ }
  }

  const handleClockOut = async () => {
    if (!activeLog) return
    try {
      await clockOut(activeLog.id)
      setActiveLog(null)
      loadLogs()
    } catch { /* ignore */ }
  }

  const handleDeleteLog = async (id) => {
    if (!window.confirm(t('worker.logDeleteConfirm'))) return
    try { await deleteWorkLog(id); loadLogs() }
    catch { /* ignore */ }
  }

  const handleDownloadCSV = () => {
    const csv = generateCSV(logs, t)
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `work-log-${selectedMonth}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const stats = calcMonthStats(logs)

  // ── 기능 3: AI 법률 챗봇 ──
  const [chatMessages, setChatMessages] = useState([])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)

  const scrollToBottom = useCallback(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => { scrollToBottom() }, [chatMessages, scrollToBottom])

  const sendChat = async (message) => {
    const text = message || chatInput.trim()
    if (!text || chatLoading) return
    setChatInput('')

    const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY
    if (!apiKey) {
      setChatMessages((prev) => [
        ...prev,
        { role: 'user', content: text },
        { role: 'assistant', content: t('worker.chatApiMissing') },
      ])
      return
    }

    setChatMessages((prev) => [...prev, { role: 'user', content: text }])
    setChatLoading(true)

    try {
      const msgs = [
        ...chatMessages.map((m) => ({ role: m.role, content: m.content })),
        { role: 'user', content: text },
      ]

      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 1024,
          system: 'Bạn là chuyên gia về luật lao động Hàn Quốc. Trả lời bằng tiếng Việt. Chỉ trả lời các câu hỏi liên quan đến luật lao động, tai nạn lao động, trợ cấp thôi việc, và nợ lương. Nếu câu hỏi không liên quan, hãy lịch sự từ chối và hướng dẫn hỏi về chủ đề phù hợp.',
          messages: msgs,
        }),
      })

      if (!res.ok) throw new Error('API error')
      const data = await res.json()
      const reply = data.content?.[0]?.text || t('worker.chatError')
      setChatMessages((prev) => [...prev, { role: 'assistant', content: reply }])
    } catch {
      setChatMessages((prev) => [...prev, { role: 'assistant', content: t('worker.chatError') }])
    } finally {
      setChatLoading(false)
    }
  }

  return (
    <div className="page-enter">
      <div className="screen-header" style={{ background: 'linear-gradient(135deg, #2e7d32, #43a047)' }}>
        <button className="back-btn" onClick={() => navigate('/')}>{t('common.back')}</button>
        <h2>{t('worker.title')}</h2>
        <p>{t('worker.subtitle')}</p>
      </div>

      {/* ══════════ 기능 1: 임금 체불 자가 진단 ══════════ */}
      <div className="sw-section">
        <div className="sw-card">
          <div className="sw-card-header">
            <span className="sw-card-icon">💰</span>
            <div>
              <div className="sw-card-title">{t('worker.wageTitle')}</div>
              <div className="sw-card-sub">{t('worker.wageDesc')}</div>
            </div>
          </div>

          <div className="sw-form">
            <div className="sw-field">
              <label className="clc-label">{t('worker.wageExpected')}</label>
              <input
                className="form-input"
                type="number"
                placeholder={t('worker.wageExpectedPH')}
                value={wageExpected}
                onChange={(e) => setWageExpected(e.target.value)}
              />
            </div>
            <div className="sw-field">
              <label className="clc-label">{t('worker.wageActual')}</label>
              <input
                className="form-input"
                type="number"
                placeholder={t('worker.wageActualPH')}
                value={wageActual}
                onChange={(e) => setWageActual(e.target.value)}
              />
            </div>
            <button className="calc-btn" onClick={handleWageCheck}>{t('worker.wageCheck')}</button>
          </div>

          {wageResult && (
            <div className={`sw-wage-result ${wageResult.isTheft ? 'theft' : 'ok'}`}>
              {wageResult.isTheft ? (
                <>
                  <div className="sw-wage-alert">
                    <span className="sw-wage-alert-icon">⚠️</span>
                    <div>
                      <div className="sw-wage-alert-title">{t('worker.wageAlert')}</div>
                      <div className="sw-wage-alert-amount">
                        {t('worker.wageAlertAmount', { amount: wageResult.diff.toLocaleString('ko-KR') })}
                      </div>
                    </div>
                  </div>

                  <div className="sw-steps">
                    <div className="sw-step">
                      <div className="sw-step-num">1</div>
                      <div>
                        <div className="sw-step-title">{t('worker.wageStep1')}</div>
                        <div className="sw-step-desc">{t('worker.wageStep1Desc')}</div>
                      </div>
                    </div>
                    <div className="sw-step">
                      <div className="sw-step-num">2</div>
                      <div>
                        <div className="sw-step-title">{t('worker.wageStep2')}</div>
                        <div className="sw-step-desc">{t('worker.wageStep2Desc')}</div>
                      </div>
                    </div>
                    <div className="sw-step">
                      <div className="sw-step-num">3</div>
                      <div>
                        <div className="sw-step-title">{t('worker.wageStep3')}</div>
                        <div className="sw-step-desc">{t('worker.wageStep3Desc')}</div>
                      </div>
                    </div>
                  </div>

                  <a href="tel:1350" className="sw-hotline">
                    <span className="sw-hotline-icon">📞</span>
                    <div>
                      <div className="sw-hotline-number">1350</div>
                      <div className="sw-hotline-label">{t('worker.wageHotline')}</div>
                      <div className="sw-hotline-desc">{t('worker.wageHotlineDesc')}</div>
                    </div>
                  </a>
                </>
              ) : (
                <div className="sw-wage-ok">
                  <span>✅</span>
                  <div>
                    <div className="sw-wage-ok-title">{t('worker.wageOk')}</div>
                    <div className="sw-wage-ok-diff">{t('worker.wageDiff')}: {W(Math.abs(wageResult.diff))}</div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ══════════ 기능 2: 출퇴근 기록 ══════════ */}
      <div className="sw-section">
        <div className="sw-card">
          <div className="sw-card-header">
            <span className="sw-card-icon">⏰</span>
            <div>
              <div className="sw-card-title">{t('worker.logTitle')}</div>
              <div className="sw-card-sub">{t('worker.logDesc')}</div>
            </div>
          </div>

          {!user && <div className="sw-card-sub" style={{ textAlign: 'center', padding: '12px 0' }}>{t('worker.logLoginHint')}</div>}

          {user && (
            <>
              {/* 출/퇴근 버튼 */}
              <div className="sw-clock-btns">
                {!activeLog ? (
                  <button className="sw-clock-btn in" onClick={handleClockIn}>
                    <span className="sw-clock-icon">🟢</span>
                    {t('worker.logClockIn')}
                  </button>
                ) : (
                  <button className="sw-clock-btn out" onClick={handleClockOut}>
                    <span className="sw-clock-icon">🔴</span>
                    {t('worker.logClockOut')}
                  </button>
                )}
              </div>

              {activeLog && (
                <div className="sw-working-badge">{t('worker.logWorking')}</div>
              )}

              {/* 월 선택 */}
              <div className="sw-month-row">
                <label className="clc-label">{t('worker.logMonth')}</label>
                <input
                  className="form-input"
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  style={{ maxWidth: 180 }}
                />
              </div>

              {/* 월간 통계 */}
              {logs.length > 0 && (
                <div className="sw-stats">
                  <div className="sw-stat-row">
                    <span>{t('worker.logTotalHours')}</span>
                    <strong>{stats.total}h</strong>
                  </div>
                  <div className="sw-stat-row">
                    <span>{t('worker.logOvertimeHours')}</span>
                    <span>{stats.overtime}h → {W(stats.overtimePay)}</span>
                  </div>
                  <div className="sw-stat-row">
                    <span>{t('worker.logNightHours')}</span>
                    <span>{stats.night}h → {W(stats.nightPay)}</span>
                  </div>
                  <div className="sw-stat-row">
                    <span>{t('worker.logWeekendHours')}</span>
                    <span>{stats.weekend}h → {W(stats.weekendPay)}</span>
                  </div>
                  <div className="sw-stat-row total">
                    <span>{t('worker.logTotalExtra')}</span>
                    <strong>{W(stats.totalExtra)}</strong>
                  </div>
                </div>
              )}

              {/* 기록 테이블 */}
              {logs.length > 0 ? (
                <>
                  <div className="sw-log-table-wrap">
                    <table className="sw-log-table">
                      <thead>
                        <tr>
                          <th>{t('worker.logDate')}</th>
                          <th>{t('worker.logIn')}</th>
                          <th>{t('worker.logOut')}</th>
                          <th>{t('worker.logHours')}</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {logs.map((log) => {
                          const { hours, type } = classifyLog(log)
                          const inTime = new Date(log.clock_in)
                          const timeFmt = { hour: '2-digit', minute: '2-digit' }
                          return (
                            <tr key={log.id}>
                              <td>{inTime.toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' })}</td>
                              <td>{inTime.toLocaleTimeString('ko-KR', timeFmt)}</td>
                              <td>{log.clock_out ? new Date(log.clock_out).toLocaleTimeString('ko-KR', timeFmt) : '—'}</td>
                              <td>
                                {hours > 0 ? hours.toFixed(1) + 'h' : '—'}
                                {type !== 'normal' && hours > 0 && (
                                  <span className={`sw-log-badge ${type}`}>{t('worker.log' + type.charAt(0).toUpperCase() + type.slice(1))}</span>
                                )}
                              </td>
                              <td>
                                <button className="adm-btn-sm danger" onClick={() => handleDeleteLog(log.id)}>🗑️</button>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                  <button className="sw-csv-btn" onClick={handleDownloadCSV}>
                    📥 {t('worker.logDownloadCSV')}
                  </button>
                </>
              ) : (
                <p className="sw-empty">{t('worker.logEmpty')}</p>
              )}
            </>
          )}
        </div>
      </div>

      {/* ══════════ 기능 3: AI 법률 챗봇 ══════════ */}
      <div className="sw-section">
        <div className="sw-card">
          <div className="sw-card-header">
            <span className="sw-card-icon">🤖</span>
            <div>
              <div className="sw-card-title">{t('worker.chatTitle')}</div>
              <div className="sw-card-sub">{t('worker.chatDesc')}</div>
            </div>
          </div>

          {/* FAQ 버튼 */}
          <div className="sw-faq-row">
            <button className="sw-faq-btn" onClick={() => sendChat(t('worker.chatFaq1'))}>
              {t('worker.chatFaq1')}
            </button>
            <button className="sw-faq-btn" onClick={() => sendChat(t('worker.chatFaq2'))}>
              {t('worker.chatFaq2')}
            </button>
            <button className="sw-faq-btn" onClick={() => sendChat(t('worker.chatFaq3'))}>
              {t('worker.chatFaq3')}
            </button>
          </div>

          {/* 채팅 영역 */}
          <div className="sw-chat-area">
            {chatMessages.length === 0 && (
              <div className="sw-chat-empty">💬</div>
            )}
            {chatMessages.map((msg, i) => (
              <div key={i} className={`sw-chat-bubble ${msg.role}`}>
                <div className="sw-chat-bubble-content">{msg.content}</div>
              </div>
            ))}
            {chatLoading && (
              <div className="sw-chat-bubble assistant">
                <div className="sw-chat-bubble-content sw-thinking">
                  <span className="sw-dot" /><span className="sw-dot" /><span className="sw-dot" />
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* 입력창 */}
          <div className="sw-chat-input-wrap">
            <input
              className="sw-chat-input"
              placeholder={t('worker.chatPlaceholder')}
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendChat()}
            />
            <button
              className="sw-chat-send"
              onClick={() => sendChat()}
              disabled={chatLoading || !chatInput.trim()}
            >
              {t('worker.chatSend')}
            </button>
          </div>
        </div>
      </div>

      <div className="spacer" />
    </div>
  )
}

export default SafeWorker
