import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import modals from '../data/modals'
import { fetchGuides } from '../lib/api'

// Supabase guides 테이블이 없거나 오류 시 사용하는 fallback 데이터
const STEPS_FALLBACK = [
  {
    num: 1, modalId: 'modal-step1',
    title: 'Đăng ký thi EPS-TOPIK',
    desc: 'Đăng ký qua website chính thức của Trung tâm Lao động ngoài nước (COLAB). Thi tiếng Hàn và kiến thức pháp luật lao động.',
    badge: 'Bắt buộc đầu tiên',
  },
  {
    num: 2, modalId: 'modal-step2',
    title: 'Đăng ký Danh sách cầu việc làm',
    desc: 'Sau khi đỗ EPS-TOPIK, đăng ký hồ sơ xin việc tại cơ quan HRD Korea được ủy quyền.',
    badge: 'Sau khi đỗ thi',
  },
  {
    num: 3, modalId: 'modal-step3',
    title: 'Được chủ lao động Hàn chọn',
    desc: 'Chủ lao động Hàn Quốc xem hồ sơ và liên hệ bạn. Ký hợp đồng lao động tiêu chuẩn.',
    badge: 'Chờ chủ lao động',
  },
  {
    num: 4, modalId: 'modal-step4',
    title: 'Khám sức khỏe & Làm visa E-9',
    desc: 'Khám sức khỏe tại cơ sở y tế được chỉ định. Nộp hồ sơ xin cấp visa E-9 tại Đại sứ quán Hàn Quốc.',
    badge: 'Sau khi ký hợp đồng',
  },
  {
    num: 5, modalId: 'modal-step5',
    title: 'Học giáo dục trước khi nhập cảnh',
    desc: 'Tham gia khóa đào tạo bắt buộc (16 giờ) về văn hóa, pháp luật lao động Hàn Quốc.',
    badge: 'Trước khi bay',
  },
  {
    num: 6, modalId: 'modal-step6',
    title: 'Nhập cảnh Hàn Quốc & Bắt đầu làm việc',
    desc: 'Đến Hàn Quốc, hoàn thành đào tạo 3 ngày tại chỗ, đăng ký ngoại kiều và bắt đầu công việc!',
    badge: '🎉 Hoàn thành!',
  },
]

function Guide({ openModal }) {
  const navigate = useNavigate()
  const [steps,   setSteps]   = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(false)

  useEffect(() => {
    fetchGuides()
      .then(setSteps)
      .catch(() => {
        // 테이블 미생성 / 네트워크 오류 → fallback 데이터 표시
        setSteps(STEPS_FALLBACK)
        setError(true)
      })
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="page-enter">
      <div className="screen-header">
        <button className="back-btn" onClick={() => navigate('/')}>← Quay lại</button>
        <h2>📋 Hướng dẫn EPS<br />từng bước</h2>
        <p>Quy trình xin việc tại Hàn Quốc theo chương trình EPS (E-9)</p>
      </div>

      {/* 로딩 */}
      {loading && (
        <div className="loading-wrap">
          <div className="spinner" />
          <p>Đang tải hướng dẫn...</p>
        </div>
      )}

      {/* 오류 표시 (fallback 데이터로 계속 보여줌) */}
      {!loading && error && (
        <div style={{ padding: '10px 20px 0', maxWidth: 480, margin: '0 auto' }}>
          <div className="alert-banner">
            <div className="alert-icon">⚠️</div>
            <div className="alert-text">오프라인 데이터를 표시 중입니다. 나중에 다시 시도해 주세요.</div>
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
