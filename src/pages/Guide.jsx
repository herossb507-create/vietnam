import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import modals from '../data/modals'
import { fetchGuides } from '../lib/api'

function Guide({ openModal }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [steps,   setSteps]   = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(false)

  // fallback 데이터 (t()로 번역)
  const STEPS_FALLBACK = [
    { num: 1, modalId: 'modal-step1', title: t('guide.step1Title'), desc: t('guide.step1Desc'), badge: t('guide.step1Badge') },
    { num: 2, modalId: 'modal-step2', title: t('guide.step2Title'), desc: t('guide.step2Desc'), badge: t('guide.step2Badge') },
    { num: 3, modalId: 'modal-step3', title: t('guide.step3Title'), desc: t('guide.step3Desc'), badge: t('guide.step3Badge') },
    { num: 4, modalId: 'modal-step4', title: t('guide.step4Title'), desc: t('guide.step4Desc'), badge: t('guide.step4Badge') },
    { num: 5, modalId: 'modal-step5', title: t('guide.step5Title'), desc: t('guide.step5Desc'), badge: t('guide.step5Badge') },
    { num: 6, modalId: 'modal-step6', title: t('guide.step6Title'), desc: t('guide.step6Desc'), badge: t('guide.step6Badge') },
  ]

  useEffect(() => {
    fetchGuides()
      .then(setSteps)
      .catch(() => {
        setSteps(STEPS_FALLBACK)
        setError(true)
      })
      .finally(() => setLoading(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="page-enter">
      <div className="screen-header">
        <button className="back-btn" onClick={() => navigate('/')}>{t('common.back')}</button>
        <h2>{t('guide.title')}</h2>
        <p>{t('guide.subtitle')}</p>
      </div>

      {/* 로딩 */}
      {loading && (
        <div className="loading-wrap">
          <div className="spinner" />
          <p>{t('guide.loadingText')}</p>
        </div>
      )}

      {/* 오류 표시 (fallback 데이터로 계속 보여줌) */}
      {!loading && error && (
        <div style={{ padding: '10px 20px 0', maxWidth: 480, margin: '0 auto' }}>
          <div className="alert-banner">
            <div className="alert-icon">⚠️</div>
            <div className="alert-text">{t('guide.offlineWarning')}</div>
          </div>
        </div>
      )}

      {/* 스텝 목록 */}
      {!loading && (
        <div className="steps">
          {steps.map((step) => (
            <div key={step.num} className="step-item">
              <div className="step-num">{step.num}</div>
              <div className="step-content" onClick={() => openModal(modals[step.modalId])}>
                <div className="step-title">{step.title}</div>
                <div className="step-desc">{step.desc}</div>
                <span className="step-badge">{step.badge}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="spacer" />
    </div>
  )
}

export default Guide
