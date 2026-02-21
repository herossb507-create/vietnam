import { useState } from 'react'
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

const fmt = (n) => n.toLocaleString('ko-KR') + ' ₩'

function Life({ openModal }) {
  const navigate = useNavigate()
  const [salary, setSalary]   = useState('')
  const [result, setResult]   = useState(null)

  const calcSalary = () => {
    const gross = parseInt(salary) || 0
    if (!gross) return
    const health  = Math.round(gross * 0.03545)
    const pension = Math.round(gross * 0.045)
    const employ  = Math.round(gross * 0.009)
    const net     = gross - health - pension - employ
    setResult({ gross, health, pension, employ, net })
  }

  return (
    <div className="page-enter">
      <div className="screen-header" style={{ background: 'linear-gradient(135deg, #003478, #0052a5)' }}>
        <button className="back-btn" onClick={() => navigate('/')}>← Quay lại</button>
        <h2>🏠 Cuộc sống tại<br />Hàn Quốc</h2>
        <p>Thông tin thiết yếu khi sống và làm việc ở Hàn</p>
      </div>

      {/* 월급 계산기 */}
      <div className="calc-wrap">
        <div className="calc-box">
          <div className="calc-title">💰 Tính lương thực nhận</div>
          <div className="calc-input-wrap">
            <input
              className="calc-input"
              type="number"
              placeholder="2000000"
              value={salary}
              onChange={(e) => setSalary(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && calcSalary()}
            />
            <span className="calc-unit">₩ / tháng</span>
          </div>
          <button className="calc-btn" onClick={calcSalary}>Tính ngay</button>

          {result && (
            <div className="calc-result show">
              <div className="result-row"><span className="rl">Lương gross</span>                  <span className="rv">{fmt(result.gross)}</span></div>
              <div className="result-row"><span className="rl">Bảo hiểm y tế (3.545%)</span>       <span className="rv">- {fmt(result.health)}</span></div>
              <div className="result-row"><span className="rl">Bảo hiểm hưu trí (4.5%)</span>      <span className="rv">- {fmt(result.pension)}</span></div>
              <div className="result-row"><span className="rl">Bảo hiểm việc làm (0.9%)</span>     <span className="rv">- {fmt(result.employ)}</span></div>
              <div className="result-row total"><span className="rl">💵 Lương thực nhận</span>     <span className="rv">{fmt(result.net)}</span></div>
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
