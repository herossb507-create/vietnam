import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import { fetchSavingsGoals, upsertSavingsGoal, deleteSavingsGoal } from '../lib/api'
import modals from '../data/modals'

// ── 상수 ────────────────────────────────────────────────────────────
const WEEKS_PER_MONTH    = 4.345
const STANDARD_MON_HOURS = 209      // 월 소정근로시간 (40h × 52 / 12 + 공휴일 가산)
const PENSION_RATE       = 0.045    // 국민연금 (근로자 부담)
const HEALTH_RATE        = 0.03545  // 건강보험
const LTCARE_RATE        = 0.1295   // 장기요양 = 건강보험료 × 12.95%
const EMPLOY_RATE        = 0.009    // 고용보험
const PENSION_CEILING    = 5_900_000 // 국민연금 기준소득 상한 (2024)

// ── 소득세 계산 (간이세액표 근사) ─────────────────────────────────
function calcMonthlyIncomeTax(totalGross) {
  const annual = totalGross * 12

  // 1) 근로소득공제
  let ded
  if      (annual <= 5_000_000)   ded = annual * 0.7
  else if (annual <= 15_000_000)  ded = 3_500_000  + (annual -  5_000_000) * 0.4
  else if (annual <= 45_000_000)  ded = 7_500_000  + (annual - 15_000_000) * 0.15
  else if (annual <= 100_000_000) ded = 12_000_000 + (annual - 45_000_000) * 0.05
  else                            ded = 14_750_000 + (annual - 100_000_000) * 0.02
  ded = Math.min(ded, 20_000_000)

  // 2) 과세표준 = 근로소득금액 - 기본공제(본인 1인)
  const taxBase = Math.max(0, annual - ded - 1_500_000)

  // 3) 산출세액 (누진세율)
  let calc
  if      (taxBase <= 14_000_000)  calc = taxBase * 0.06
  else if (taxBase <= 50_000_000)  calc =    840_000 + (taxBase -  14_000_000) * 0.15
  else if (taxBase <= 88_000_000)  calc =  6_240_000 + (taxBase -  50_000_000) * 0.24
  else if (taxBase <= 150_000_000) calc = 15_360_000 + (taxBase -  88_000_000) * 0.35
  else if (taxBase <= 300_000_000) calc = 37_060_000 + (taxBase - 150_000_000) * 0.38
  else if (taxBase <= 500_000_000) calc = 94_060_000 + (taxBase - 300_000_000) * 0.40
  else                             calc = 174_060_000 + (taxBase - 500_000_000) * 0.42

  // 4) 근로소득세액공제 (한도 74만원)
  const credit = Math.min(
    calc <= 1_300_000 ? calc * 0.55 : 715_000 + (calc - 1_300_000) * 0.30,
    740_000,
  )

  return Math.round(Math.max(0, calc - credit) / 12)
}

// ── 급여 계산 ─────────────────────────────────────────────────────
function buildResult(baseSalary, weeklyHours, nightWork, weekendHrsPerWeek) {
  const hourlyRate = baseSalary / STANDARD_MON_HOURS

  const overtimeMonthly = Math.max(0, weeklyHours - 40) * WEEKS_PER_MONTH
  const overtimePay     = Math.round(overtimeMonthly * hourlyRate * 1.5)

  const nightPay = nightWork
    ? Math.round(weeklyHours * WEEKS_PER_MONTH * hourlyRate * 0.5)
    : 0

  const weekendPay = Math.round(weekendHrsPerWeek * WEEKS_PER_MONTH * hourlyRate * 1.5)

  const totalGross = baseSalary + overtimePay + nightPay + weekendPay

  const pension  = Math.round(Math.min(totalGross, PENSION_CEILING) * PENSION_RATE)
  const health   = Math.round(totalGross * HEALTH_RATE)
  const ltcare   = Math.round(health * LTCARE_RATE)
  const employ   = Math.round(totalGross * EMPLOY_RATE)

  const incomeTax = calcMonthlyIncomeTax(totalGross)
  const localTax  = Math.round(incomeTax * 0.1)

  const totalDeduction = pension + health + ltcare + employ + incomeTax + localTax
  const netSalary      = totalGross - totalDeduction

  return {
    baseSalary, overtimePay, nightPay, weekendPay, totalGross,
    pension, health, ltcare, employ, incomeTax, localTax,
    totalDeduction, netSalary,
  }
}

// ── 포맷 헬퍼 ─────────────────────────────────────────────────────
const W   = (n) => n.toLocaleString('ko-KR') + ' ₩'
const VND = (n) => n.toLocaleString('vi-VN') + ' ₫'

// ── 송금 환율 비교 데이터 (수동 업데이트) ──────────────────────
const REMIT_SERVICES = [
  { id: 'sentbe',  name: 'Sentbe',    logo: '🟣', rate: 18.95, fee: 5000  },
  { id: 'gme',     name: 'GME',       logo: '🔵', rate: 18.88, fee: 3000  },
  { id: 'hanpass', name: 'Hanpass',    logo: '🟢', rate: 18.92, fee: 4000  },
  { id: 'hana',    name: 'Hana Bank',  logo: '🏦', rate: 18.75, fee: 8000  },
]

// ── Life 페이지 ────────────────────────────────────────────────────
function Life({ openModal }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user } = useAuth()

  // 입력 상태
  const [baseSalary,       setBaseSalary]       = useState('')
  const [weeklyHours,      setWeeklyHours]      = useState('40')
  const [nightWork,        setNightWork]        = useState(false)
  const [weekendHrs,       setWeekendHrs]       = useState('0')

  // 결과 / 환율
  const [result,       setResult]       = useState(null)
  const [vndRate,      setVndRate]      = useState(null)
  const [rateLoading,  setRateLoading]  = useState(true)
  const [rateDate,     setRateDate]     = useState('')

  // 저축 목표
  const GOAL_EMPTY = { name: '', target_vnd: '', months: '', current_vnd: '0' }
  const [goals,       setGoals]       = useState([])
  const [goalForm,    setGoalForm]    = useState(GOAL_EMPTY)
  const [editGoalId,  setEditGoalId]  = useState(null)
  const [goalMsg,     setGoalMsg]     = useState('')

  const LIFE_CARDS = [
    { icon: '🏘️', title: t('life.cardHouse'),    desc: t('life.cardHouseDesc'),    modalId: 'modal-house',    colorClass: ''      },
    { icon: '🏥', title: t('life.cardHospital'), desc: t('life.cardHospitalDesc'), modalId: 'modal-hospital', colorClass: 'blue'  },
    { icon: '🏦', title: t('life.cardBank'),     desc: t('life.cardBankDesc'),     modalId: 'modal-bank',     colorClass: 'gold'  },
    { icon: '⚖️', title: t('life.cardRights'),   desc: t('life.cardRightsDesc'),   modalId: 'modal-rights',   colorClass: 'green' },
    { icon: '🍜', title: t('life.cardFood'),     desc: t('life.cardFoodDesc'),     modalId: 'modal-food',     colorClass: ''      },
    { icon: '💸', title: t('life.cardRemit'),    desc: t('life.cardRemitDesc'),    modalId: 'modal-remit',    colorClass: 'blue'  },
  ]

  // 환율 자동 로드
  useEffect(() => {
    fetch('https://api.exchangerate-api.com/v4/latest/KRW')
      .then((r) => r.json())
      .then((data) => {
        setVndRate(data.rates.VND)
        setRateDate(data.date)
      })
      .catch(() => {})
      .finally(() => setRateLoading(false))
  }, [])

  const handleCalc = () => {
    const base    = parseInt(baseSalary.replace(/,/g, '')) || 0
    const wkHours = parseFloat(weeklyHours) || 40
    const wkEnd   = parseFloat(weekendHrs)  || 0
    if (!base) return
    setResult(buildResult(base, wkHours, nightWork, wkEnd))
  }

  // ── 저축 목표 로드 ──
  const loadGoals = useCallback(() => {
    if (!user) return
    fetchSavingsGoals(user.id)
      .then(setGoals)
      .catch(() => {})
  }, [user])

  useEffect(() => { loadGoals() }, [loadGoals])

  const goalFlash = (m) => { setGoalMsg(m); setTimeout(() => setGoalMsg(''), 3000) }
  const setG = (k) => (e) => setGoalForm((f) => ({ ...f, [k]: e.target.value }))

  const handleGoalSave = async () => {
    const target = parseInt(String(goalForm.target_vnd).replace(/,/g, '')) || 0
    const months = parseInt(goalForm.months) || 0
    if (!goalForm.name.trim() || !target || !months) return
    try {
      const payload = {
        user_id: user.id,
        name: goalForm.name.trim(),
        target_vnd: target,
        months,
        current_vnd: parseInt(String(goalForm.current_vnd).replace(/,/g, '')) || 0,
      }
      if (editGoalId) payload.id = editGoalId
      await upsertSavingsGoal(payload)
      setGoalForm(GOAL_EMPTY)
      setEditGoalId(null)
      goalFlash(t('life.savingsSaved'))
      loadGoals()
    } catch { goalFlash(t('life.savingsError')) }
  }

  const handleGoalEdit = (g) => {
    setEditGoalId(g.id)
    setGoalForm({ name: g.name, target_vnd: String(g.target_vnd), months: String(g.months), current_vnd: String(g.current_vnd) })
  }

  const handleGoalDelete = async (id) => {
    if (!window.confirm(t('life.savingsConfirmDelete'))) return
    try { await deleteSavingsGoal(id); goalFlash(t('life.savingsDeleted')); loadGoals() }
    catch { goalFlash(t('life.savingsError')) }
  }

  // 송금 서비스 정렬 (환율 높은 순)
  const sortedRemit = [...REMIT_SERVICES].sort((a, b) => b.rate - a.rate)
  const bestId = sortedRemit[0]?.id

  return (
    <div className="page-enter">
      <div className="screen-header" style={{ background: 'linear-gradient(135deg, #003478, #0052a5)' }}>
        <button className="back-btn" onClick={() => navigate('/')}>{t('common.back')}</button>
        <h2>{t('life.title')}</h2>
        <p>{t('life.subtitle')}</p>
      </div>

      {/* ── 월급 계산기 ── */}
      <div className="calc-wrap">
        <div className="calc-box">
          <div className="calc-title">{t('life.calcTitle')}</div>

          {/* 기본급 */}
          <div className="clc-field">
            <label className="clc-label">{t('life.baseSalary')}</label>
            <div className="calc-input-wrap" style={{ marginBottom: 0 }}>
              <input
                className="calc-input"
                type="number"
                placeholder="2,000,000"
                value={baseSalary}
                onChange={(e) => setBaseSalary(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCalc()}
              />
              <span className="calc-unit">₩</span>
            </div>
          </div>

          {/* 주당 근무시간 + 야간근무 */}
          <div className="clc-row2">
            <div className="clc-field">
              <label className="clc-label">{t('life.weeklyHours')}</label>
              <div className="calc-input-wrap" style={{ marginBottom: 0 }}>
                <input
                  className="calc-input"
                  type="number"
                  min="1" max="68"
                  value={weeklyHours}
                  onChange={(e) => setWeeklyHours(e.target.value)}
                />
                <span className="calc-unit">h</span>
              </div>
            </div>

            <div className="clc-field">
              <label className="clc-label">{t('life.nightShift')}</label>
              <label className="clc-toggle">
                <input
                  type="checkbox"
                  checked={nightWork}
                  onChange={(e) => setNightWork(e.target.checked)}
                />
                <span className="clc-toggle-track">
                  <span className="clc-toggle-thumb" />
                </span>
                <span className="clc-toggle-label">{nightWork ? t('common.yes') : t('common.no')}</span>
              </label>
            </div>
          </div>

          {/* 주말근무 */}
          <div className="clc-field">
            <label className="clc-label">{t('life.weekendHours')}</label>
            <div className="calc-input-wrap" style={{ marginBottom: 0 }}>
              <input
                className="calc-input"
                type="number"
                min="0" max="16"
                placeholder="0"
                value={weekendHrs}
                onChange={(e) => setWeekendHrs(e.target.value)}
              />
              <span className="calc-unit">h</span>
            </div>
          </div>

          <button className="calc-btn" style={{ marginTop: 16 }} onClick={handleCalc}>
            {t('life.calculate')}
          </button>

          {/* ── 결과 ── */}
          {result && (
            <div className="calc-result show" style={{ padding: 0, background: 'none', marginTop: 20 }}>

              {/* 총급여 */}
              <div className="clc-section">
                <div className="clc-section-title">{t('life.grossTitle')}</div>
                <div className="result-row">
                  <span className="rl">{t('life.basePay')}</span>
                  <span className="rv">+ {W(result.baseSalary)}</span>
                </div>
                {result.overtimePay > 0 && (
                  <div className="result-row">
                    <span className="rl">{t('life.overtime')}</span>
                    <span className="rv">+ {W(result.overtimePay)}</span>
                  </div>
                )}
                {result.nightPay > 0 && (
                  <div className="result-row">
                    <span className="rl">{t('life.nightPay')}</span>
                    <span className="rv">+ {W(result.nightPay)}</span>
                  </div>
                )}
                {result.weekendPay > 0 && (
                  <div className="result-row">
                    <span className="rl">{t('life.weekendPay')}</span>
                    <span className="rv">+ {W(result.weekendPay)}</span>
                  </div>
                )}
                <div className="result-row clc-subtotal">
                  <span className="rl">{t('life.totalGross')}</span>
                  <span className="rv">{W(result.totalGross)}</span>
                </div>
              </div>

              {/* 공제 내역 */}
              <div className="clc-section">
                <div className="clc-section-title">{t('life.deductionTitle')}</div>
                <div className="result-row">
                  <span className="rl">{t('life.pension')}</span>
                  <span className="rv rv-ded">- {W(result.pension)}</span>
                </div>
                <div className="result-row">
                  <span className="rl">{t('life.healthIns')}</span>
                  <span className="rv rv-ded">- {W(result.health)}</span>
                </div>
                <div className="result-row">
                  <span className="rl">{t('life.ltcare')}</span>
                  <span className="rv rv-ded">- {W(result.ltcare)}</span>
                </div>
                <div className="result-row">
                  <span className="rl">{t('life.employIns')}</span>
                  <span className="rv rv-ded">- {W(result.employ)}</span>
                </div>
                {result.incomeTax > 0 && (
                  <div className="result-row">
                    <span className="rl">{t('life.incomeTax')}</span>
                    <span className="rv rv-ded">- {W(result.incomeTax)}</span>
                  </div>
                )}
                {result.localTax > 0 && (
                  <div className="result-row">
                    <span className="rl">{t('life.localTax')}</span>
                    <span className="rv rv-ded">- {W(result.localTax)}</span>
                  </div>
                )}
                <div className="result-row clc-subtotal">
                  <span className="rl">{t('life.totalDeduction')}</span>
                  <span className="rv rv-ded">- {W(result.totalDeduction)}</span>
                </div>
              </div>

              {/* 실수령액 */}
              <div className="clc-net-box">
                <div className="clc-net-label">{t('life.netSalary')}</div>
                <div className="clc-net-won">{W(result.netSalary)}</div>

                {/* VND 환산 */}
                {rateLoading ? (
                  <div className="clc-vnd-loading">
                    <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
                    <span>{t('life.loadingRate')}</span>
                  </div>
                ) : vndRate ? (
                  <div className="clc-vnd-wrap">
                    <div className="clc-vnd-flag">🇻🇳</div>
                    <div>
                      <div className="clc-vnd-amount">
                        {VND(Math.round(result.netSalary * vndRate))}
                      </div>
                      <div className="clc-vnd-rate">
                        1 ₩ = {vndRate.toFixed(2)} ₫ &nbsp;•&nbsp; {rateDate}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="clc-vnd-rate" style={{ marginTop: 8 }}>
                    {t('life.rateError')}
                  </div>
                )}
              </div>

            </div>
          )}
        </div>
      </div>

      {/* ══════════════ 금융관리 섹션 ══════════════ */}
      <div className="fin-section">
        <div className="fin-section-title">{t('life.financeSection')}</div>

        {/* ── 기능 2: 송금 환율 비교 ── */}
        <div className="fin-card">
          <div className="fin-card-header">
            <span className="fin-card-icon">💸</span>
            <div>
              <div className="fin-card-title">{t('life.remitCompare')}</div>
              <div className="fin-card-sub">{t('life.remitCompareDesc')}</div>
            </div>
          </div>

          <div className="remit-list">
            {sortedRemit.map((s) => {
              const received = Math.round((1_000_000 - s.fee) * s.rate)
              const isBest = s.id === bestId
              return (
                <div key={s.id} className={`remit-row ${isBest ? 'best' : ''}`}>
                  <div className="remit-logo">{s.logo}</div>
                  <div className="remit-info">
                    <div className="remit-name">
                      {s.name}
                      {isBest && <span className="remit-best-badge">{t('life.remitBest')}</span>}
                    </div>
                    <div className="remit-meta">
                      {t('life.remitFee')}: {s.fee.toLocaleString()} ₩ &nbsp;•&nbsp;
                      {t('life.remitRate')}: {s.rate.toFixed(2)}
                    </div>
                  </div>
                  <div className="remit-result">
                    <div className="remit-vnd">{received.toLocaleString('vi-VN')} ₫</div>
                    <div className="remit-label">{t('life.remitReceive')}</div>
                  </div>
                </div>
              )
            })}
          </div>
          <div className="remit-footer">
            <span>{t('life.remitSend')}</span>
            <span className="remit-note">{t('life.remitUpdated')}</span>
          </div>
        </div>

        {/* ── 기능 3: 저축 목표 관리 ── */}
        <div className="fin-card">
          <div className="fin-card-header">
            <span className="fin-card-icon">🎯</span>
            <div>
              <div className="fin-card-title">{t('life.savingsTitle')}</div>
              {!user && <div className="fin-card-sub">{t('life.savingsLoginHint')}</div>}
            </div>
          </div>

          {goalMsg && <div className="fin-msg">{goalMsg}</div>}

          {/* 목표 입력 폼 */}
          {user && (
            <div className="savings-form">
              <div className="savings-form-row">
                <input className="form-input" placeholder={t('life.savingsGoalNamePH')} value={goalForm.name} onChange={setG('name')} />
              </div>
              <div className="savings-form-row three">
                <div>
                  <label className="clc-label">{t('life.savingsTargetVND')}</label>
                  <input className="form-input" type="number" placeholder="500,000,000" value={goalForm.target_vnd} onChange={setG('target_vnd')} />
                </div>
                <div>
                  <label className="clc-label">{t('life.savingsMonths')}</label>
                  <input className="form-input" type="number" placeholder="24" value={goalForm.months} onChange={setG('months')} />
                </div>
                <div>
                  <label className="clc-label">{t('life.savingsCurrentVND')}</label>
                  <input className="form-input" type="number" placeholder="0" value={goalForm.current_vnd} onChange={setG('current_vnd')} />
                </div>
              </div>
              <button className="calc-btn" onClick={handleGoalSave}>
                {editGoalId ? t('life.savingsUpdate') : t('life.savingsAdd')}
              </button>
            </div>
          )}

          {/* 목표 카드 목록 */}
          {user && goals.length === 0 && (
            <p className="savings-empty">{t('life.savingsEmpty')}</p>
          )}

          {user && goals.map((g) => {
            const pct = Math.min(100, Math.round((g.current_vnd / g.target_vnd) * 100))
            const remaining = g.target_vnd - g.current_vnd
            const monthlyNeed = remaining > 0 ? Math.ceil(remaining / Math.max(1, g.months)) : 0
            return (
              <div key={g.id} className="savings-goal-card">
                <div className="savings-goal-top">
                  <div className="savings-goal-name">{g.name}</div>
                  <div className="savings-goal-actions">
                    <button className="adm-btn-sm" onClick={() => handleGoalEdit(g)}>✏️</button>
                    <button className="adm-btn-sm danger" onClick={() => handleGoalDelete(g.id)}>🗑️</button>
                  </div>
                </div>
                <div className="savings-bar-wrap">
                  <div className="savings-bar">
                    <div className="savings-bar-fill" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="savings-pct">{pct}%</span>
                </div>
                <div className="savings-goal-nums">
                  <span>{VND(g.current_vnd)} / {VND(g.target_vnd)}</span>
                </div>
                <div className="savings-goal-detail">
                  {pct >= 100 ? (
                    <span className="savings-achieved">{t('life.savingsAchieved')}</span>
                  ) : (
                    <>
                      <span>{t('life.savingsMonthlyNeed')}: <strong>{VND(monthlyNeed)}</strong></span>
                      <span>{t('life.savingsMonthsLeft', { n: g.months })}</span>
                    </>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* 생활 카드 그리드 */}
      <div className="life-grid">
        {LIFE_CARDS.map((card) => (
          <div
            key={card.modalId}
            className={`life-card ${card.colorClass}`}
            onClick={() => openModal(modals[card.modalId])}
          >
            <div className="icon">{card.icon}</div>
            <div className="title">{card.title}</div>
            <div className="desc">{card.desc}</div>
          </div>
        ))}
      </div>

      <div className="spacer" />
    </div>
  )
}

export default Life
