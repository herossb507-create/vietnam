import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import modals from '../data/modals'

const LIFE_CARDS = [
  { icon: '🏘️', title: 'Tìm nhà ở',        desc: 'Ký túc xá, 고시원, nhà thuê — ưu nhược điểm từng loại', modalId: 'modal-house',    colorClass: ''      },
  { icon: '🏥', title: 'Y tế & Bệnh viện',  desc: 'Bệnh viện có phiên dịch tiếng Việt, số khẩn cấp',       modalId: 'modal-hospital', colorClass: 'blue'  },
  { icon: '🏦', title: 'Mở tài khoản',      desc: 'Ngân hàng nào dễ mở? Cần giấy tờ gì?',                 modalId: 'modal-bank',     colorClass: 'gold'  },
  { icon: '⚖️', title: 'Quyền lao động',    desc: 'Tăng ca, nghỉ phép, bị sa thải — quyền của bạn',        modalId: 'modal-rights',   colorClass: 'green' },
  { icon: '🍜', title: 'Ẩm thực Việt',      desc: 'Nhà hàng Việt, siêu thị bán đồ Việt gần bạn',           modalId: 'modal-food',     colorClass: ''      },
  { icon: '💸', title: 'Gửi tiền về nhà',   desc: 'So sánh phí chuyển tiền Western Union, KEB, Shinhan',   modalId: 'modal-remit',    colorClass: 'blue'  },
]

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

  // 연장근로수당: 주 40h 초과분 × 1.5배
  const overtimeMonthly = Math.max(0, weeklyHours - 40) * WEEKS_PER_MONTH
  const overtimePay     = Math.round(overtimeMonthly * hourlyRate * 1.5)

  // 야간근로수당: 전체 근무시간에 0.5배 추가 (야간 프리미엄)
  const nightPay = nightWork
    ? Math.round(weeklyHours * WEEKS_PER_MONTH * hourlyRate * 0.5)
    : 0

  // 주말근로수당: 1.5배
  const weekendPay = Math.round(weekendHrsPerWeek * WEEKS_PER_MONTH * hourlyRate * 1.5)

  const totalGross = baseSalary + overtimePay + nightPay + weekendPay

  // 4대보험
  const pension  = Math.round(Math.min(totalGross, PENSION_CEILING) * PENSION_RATE)
  const health   = Math.round(totalGross * HEALTH_RATE)
  const ltcare   = Math.round(health * LTCARE_RATE)
  const employ   = Math.round(totalGross * EMPLOY_RATE)

  // 소득세 + 지방소득세
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

// ── Life 페이지 ────────────────────────────────────────────────────
function Life({ openModal }) {
  const navigate = useNavigate()

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

  return (
    <div className="page-enter">
      <div className="screen-header" style={{ background: 'linear-gradient(135deg, #003478, #0052a5)' }}>
        <button className="back-btn" onClick={() => navigate('/')}>← Quay lại</button>
        <h2>🏠 Cuộc sống tại<br />Hàn Quốc</h2>
        <p>Thông tin thiết yếu khi sống và làm việc ở Hàn</p>
      </div>

      {/* ── 월급 계산기 ── */}
      <div className="calc-wrap">
        <div className="calc-box">
          <div className="calc-title">💰 Tính lương chi tiết</div>

          {/* 기본급 */}
          <div className="clc-field">
            <label className="clc-label">Lương cơ bản (₩/tháng)</label>
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
              <label className="clc-label">Giờ làm / tuần</label>
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
              <label className="clc-label">Ca đêm (22~06h)</label>
              <label className="clc-toggle">
                <input
                  type="checkbox"
                  checked={nightWork}
                  onChange={(e) => setNightWork(e.target.checked)}
                />
                <span className="clc-toggle-track">
                  <span className="clc-toggle-thumb" />
                </span>
                <span className="clc-toggle-label">{nightWork ? 'Có' : 'Không'}</span>
              </label>
            </div>
          </div>

          {/* 주말근무 */}
          <div className="clc-field">
            <label className="clc-label">Giờ làm cuối tuần / tuần</label>
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
            🧮 Tính lương
          </button>

          {/* ── 결과 ── */}
          {result && (
            <div className="calc-result show" style={{ padding: 0, background: 'none', marginTop: 20 }}>

              {/* 총급여 */}
              <div className="clc-section">
                <div className="clc-section-title">📋 Tổng thu nhập</div>
                <div className="result-row">
                  <span className="rl">Lương cơ bản</span>
                  <span className="rv">+ {W(result.baseSalary)}</span>
                </div>
                {result.overtimePay > 0 && (
                  <div className="result-row">
                    <span className="rl">Tăng ca (×1.5)</span>
                    <span className="rv">+ {W(result.overtimePay)}</span>
                  </div>
                )}
                {result.nightPay > 0 && (
                  <div className="result-row">
                    <span className="rl">Phụ cấp ca đêm (×0.5)</span>
                    <span className="rv">+ {W(result.nightPay)}</span>
                  </div>
                )}
                {result.weekendPay > 0 && (
                  <div className="result-row">
                    <span className="rl">Làm cuối tuần (×1.5)</span>
                    <span className="rv">+ {W(result.weekendPay)}</span>
                  </div>
                )}
                <div className="result-row clc-subtotal">
                  <span className="rl">Tổng gross</span>
                  <span className="rv">{W(result.totalGross)}</span>
                </div>
              </div>

              {/* 공제 내역 */}
              <div className="clc-section">
                <div className="clc-section-title">📉 Khấu trừ bảo hiểm &amp; thuế</div>
                <div className="result-row">
                  <span className="rl">Lương hưu (4.5%)</span>
                  <span className="rv rv-ded">- {W(result.pension)}</span>
                </div>
                <div className="result-row">
                  <span className="rl">Bảo hiểm y tế (3.545%)</span>
                  <span className="rv rv-ded">- {W(result.health)}</span>
                </div>
                <div className="result-row">
                  <span className="rl">Bảo dưỡng dài hạn (0.459%)</span>
                  <span className="rv rv-ded">- {W(result.ltcare)}</span>
                </div>
                <div className="result-row">
                  <span className="rl">Bảo hiểm việc làm (0.9%)</span>
                  <span className="rv rv-ded">- {W(result.employ)}</span>
                </div>
                {result.incomeTax > 0 && (
                  <div className="result-row">
                    <span className="rl">Thuế thu nhập</span>
                    <span className="rv rv-ded">- {W(result.incomeTax)}</span>
                  </div>
                )}
                {result.localTax > 0 && (
                  <div className="result-row">
                    <span className="rl">Thuế địa phương (10%)</span>
                    <span className="rv rv-ded">- {W(result.localTax)}</span>
                  </div>
                )}
                <div className="result-row clc-subtotal">
                  <span className="rl">Tổng khấu trừ</span>
                  <span className="rv rv-ded">- {W(result.totalDeduction)}</span>
                </div>
              </div>

              {/* 실수령액 */}
              <div className="clc-net-box">
                <div className="clc-net-label">💵 Lương thực nhận</div>
                <div className="clc-net-won">{W(result.netSalary)}</div>

                {/* VND 환산 */}
                {rateLoading ? (
                  <div className="clc-vnd-loading">
                    <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
                    <span>Đang tải tỷ giá...</span>
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
                    Không thể tải tỷ giá hối đoái
                  </div>
                )}
              </div>

            </div>
          )}
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
