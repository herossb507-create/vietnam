import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import modals from '../data/modals'

const QUICK_MENU = [
  { icon: '📋', label: 'Hướng dẫn Visa', action: 'screen', target: '/guide' },
  { icon: '🏠', label: 'Cuộc sống HQ',   action: 'screen', target: '/life' },
  { icon: '💬', label: 'Cộng đồng',       action: 'screen', target: '/community' },
  { icon: '🇰🇷', label: 'Tiếng Hàn',     action: 'modal',  target: 'modal-korean' },
]

const TIPS = [
  { icon: '💰', id: 'modal-salary',    title: 'Lương tối thiểu 2024 tại Hàn Quốc', desc: '9.860 won/giờ — Tính toán lương thực nhận của bạn' },
  { icon: '🏥', id: 'modal-insurance', title: 'Bảo hiểm 4 loại (4대보험)',          desc: 'Quyền lợi bảo hiểm dành cho lao động nước ngoài' },
  { icon: '🚨', id: 'modal-scam',      title: 'Cách tránh bị lừa đảo',              desc: 'Các dấu hiệu nhận biết "cò" và môi giới bất hợp pháp' },
]

function Home({ openModal }) {
  const navigate = useNavigate()
  const [selectedStatus, setSelectedStatus] = useState(null)

  const handleMenu = (item) => {
    if (item.action === 'screen') navigate(item.target)
    else openModal(modals[item.target])
  }

  return (
    <div className="page-enter">
      {/* 히어로 배너 */}
      <div className="hero">
        <div className="hero-title">
          Xin chào! 안녕하세요 👋<br />
          <span className="accent">KoViet Guide</span>
        </div>
        <div className="hero-sub">
          Thông tin làm việc tại Hàn Quốc<br />
          dành riêng cho người Việt Nam
        </div>
        <div className="status-cards">
          <div
            className={`status-card ${selectedStatus === 'prepare' ? 'selected' : ''}`}
            onClick={() => setSelectedStatus('prepare')}
          >
            <div className="icon">✈️</div>
            <div className="label">Đang chuẩn bị sang Hàn</div>
          </div>
          <div
            className={`status-card ${selectedStatus === 'inkr' ? 'selected' : ''}`}
            onClick={() => setSelectedStatus('inkr')}
          >
            <div className="icon">🏢</div>
            <div className="label">Đang ở Hàn Quốc</div>
          </div>
        </div>
      </div>

      {/* 경고 배너 */}
      <div className="alert-banner">
        <div className="alert-icon">⚠️</div>
        <div className="alert-text">
          <strong>Cảnh báo lừa đảo:</strong> Không trả tiền cho "cò" hay dịch vụ không chính thống.
          EPS là chương trình miễn phí của chính phủ!
        </div>
      </div>

      {/* 빠른 메뉴 */}
      <div className="section">
        <div className="section-title">🧭 Khám phá nhanh</div>
        <div className="menu-grid">
          {QUICK_MENU.map((item) => (
            <div key={item.label} className="menu-item" onClick={() => handleMenu(item)}>
              <div className="icon">{item.icon}</div>
              <div className="label">{item.label}</div>
            </div>
          ))}
        </div>

        {/* EPS 배너 */}
        <div className="banner" onClick={() => navigate('/guide')}>
          <div className="banner-icon">📌</div>
          <div className="banner-text">
            <div className="title">EPS-TOPIK 시험 준비</div>
            <div className="sub">Hướng dẫn thi EPS từng bước — đăng ký, ôn thi, và đỗ!</div>
          </div>
          <div className="banner-arrow">›</div>
        </div>

        {/* 주요 정보 */}
        <div className="section-title">🔥 Thông tin nổi bật</div>
        <div className="tip-list">
          {TIPS.map((tip) => (
            <div key={tip.id} className="tip-item" onClick={() => openModal(modals[tip.id])}>
              <div className="tip-icon">{tip.icon}</div>
              <div className="tip-content">
                <div className="tip-title">{tip.title}</div>
                <div className="tip-desc">{tip.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="spacer" />
    </div>
  )
}

export default Home
