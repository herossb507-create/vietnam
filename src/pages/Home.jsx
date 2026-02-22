import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import modals from '../data/modals'

function Home({ openModal }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [selectedStatus, setSelectedStatus] = useState(null)

  const QUICK_MENU = [
    { icon: '📋', label: t('home.menuVisa'),      action: 'screen', target: '/guide' },
    { icon: '🏠', label: t('home.menuLife'),       action: 'screen', target: '/life' },
    { icon: '💬', label: t('home.menuCommunity'),  action: 'screen', target: '/community' },
    { icon: '🇰🇷', label: t('home.menuKorean'),   action: 'modal',  target: 'modal-korean' },
  ]

  const TIPS = [
    { icon: '💰', id: 'modal-salary',    title: t('home.tipSalaryTitle'),    desc: t('home.tipSalaryDesc') },
    { icon: '🏥', id: 'modal-insurance', title: t('home.tipInsuranceTitle'), desc: t('home.tipInsuranceDesc') },
    { icon: '🚨', id: 'modal-scam',      title: t('home.tipScamTitle'),      desc: t('home.tipScamDesc') },
  ]

  const handleMenu = (item) => {
    if (item.action === 'screen') navigate(item.target)
    else openModal(modals[item.target])
  }

  return (
    <div className="page-enter">
      {/* 히어로 배너 */}
      <div className="hero">
        <div className="hero-title">
          {t('home.heroGreeting')}<br />
          <span className="accent">KoViet Guide</span>
        </div>
        <div className="hero-sub">
          {t('home.heroSub1')}<br />
          {t('home.heroSub2')}
        </div>
        <div className="status-cards">
          <div
            className={`status-card ${selectedStatus === 'prepare' ? 'selected' : ''}`}
            onClick={() => setSelectedStatus('prepare')}
          >
            <div className="icon">✈️</div>
            <div className="label">{t('home.statusPrepare')}</div>
          </div>
          <div
            className={`status-card ${selectedStatus === 'inkr' ? 'selected' : ''}`}
            onClick={() => setSelectedStatus('inkr')}
          >
            <div className="icon">🏢</div>
            <div className="label">{t('home.statusInKR')}</div>
          </div>
        </div>
      </div>

      {/* 경고 배너 */}
      <div className="alert-banner">
        <div className="alert-icon">⚠️</div>
        <div className="alert-text">
          <strong>{t('home.alertTitle')}</strong> {t('home.alertText')}
        </div>
      </div>

      {/* 빠른 메뉴 */}
      <div className="section">
        <div className="section-title">{t('home.sectionExplore')}</div>
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
            <div className="title">{t('home.epsBannerTitle')}</div>
            <div className="sub">{t('home.epsBannerSub')}</div>
          </div>
          <div className="banner-arrow">›</div>
        </div>

        {/* 주요 정보 */}
        <div className="section-title">{t('home.sectionTips')}</div>
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
