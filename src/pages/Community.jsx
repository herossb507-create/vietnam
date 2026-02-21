import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchReviews, saveReview } from '../lib/api'
import { useAuth } from '../context/AuthContext'

// Supabase reviews 테이블이 없거나 오류 시 사용하는 fallback 데이터
const REVIEWS_FALLBACK = [
  {
    id: 'fb-1',
    name: 'Nguyễn Văn Tuấn',
    info: 'Nhà máy điện tử • Gyeonggi-do • 2 năm',
    stars: 5,
    review_text: 'Lương tháng đầu khoảng 2.3 triệu won. Ký túc xá do công ty lo, trừ 200 nghìn/tháng. Đồng nghiệp Hàn khá thân thiện, có người biết tiếng Anh giúp đỡ...',
    tags: ['Chế tạo', 'E-9', 'Gyeonggi'],
  },
  {
    id: 'fb-2',
    name: 'Trần Thị Lan',
    info: 'Nông nghiệp • Chungnam • 1.5 năm',
    stars: 4,
    review_text: 'Làm nông nghiệp vất vả hơn tôi nghĩ, nhưng lương ổn hơn Việt Nam nhiều. Mùa hè nóng lắm, cần chuẩn bị tinh thần. Chủ trại tốt, lo ăn ở đầy đủ...',
    tags: ['Nông nghiệp', 'E-9', 'Chungnam'],
  },
  {
    id: 'fb-3',
    name: 'Lê Minh Hoàng',
    info: 'Xây dựng • Seoul • 3 năm',
    stars: 5,
    review_text: 'Làm xây dựng lương cao hơn nhưng công việc nặng. Tiếng Hàn quan trọng lắm, biết càng nhiều càng được chủ quý. Tôi đã thi nâng bậc lương 2 lần rồi...',
    tags: ['Xây dựng', 'Seoul', 'Tăng lương'],
  },
]

const STAR_FULL  = '★'
const STAR_EMPTY = '☆'
const starsStr = (n) => STAR_FULL.repeat(n) + STAR_EMPTY.repeat(5 - n)

// ── 후기 작성 폼 모달 ────────────────────────────────────────
function WriteReviewModal({ onClose, onSaved }) {
  const EMPTY = { name: '', info: '', stars: 5, review_text: '', tags: '' }
  const [form,    setForm]    = useState(EMPTY)
  const [saving,  setSaving]  = useState(false)
  const [success, setSuccess] = useState(false)
  const [err,     setErr]     = useState('')

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.review_text.trim()) {
      setErr('Vui lòng điền Tên và Nội dung đánh giá.')
      return
    }
    setSaving(true)
    setErr('')
    try {
      const tags = form.tags.split(',').map((t) => t.trim()).filter(Boolean)
      await saveReview({ ...form, tags })
      setSuccess(true)
      onSaved() // 목록 새로고침
    } catch {
      setErr('Lỗi kết nối. Vui lòng thử lại sau.')
    } finally {
      setSaving(false)
    }
  }

  const handleOverlay = (e) => { if (e.target === e.currentTarget) onClose() }

  return (
    <div className="modal-overlay show" onClick={handleOverlay}>
      <div className="modal-sheet">
        <div className="modal-handle" />
        <button className="modal-close" onClick={onClose}>✕</button>

        {success ? (
          <div className="success-box">
            <div className="s-icon">🎉</div>
            <div className="s-title">Cảm ơn bạn!</div>
            <div className="s-desc">
              Kinh nghiệm của bạn đã được chia sẻ.<br />
              Sẽ giúp ích rất nhiều cho mọi người!
            </div>
          </div>
        ) : (
          <>
            <div className="modal-title">✏️ Chia sẻ kinh nghiệm</div>

            <div className="form-group">
              <label className="form-label">Họ và tên *</label>
              <input className="form-input" placeholder="Nguyễn Văn A" value={form.name} onChange={set('name')} />
            </div>

            <div className="form-group">
              <label className="form-label">Công việc • Vùng • Thời gian</label>
              <input className="form-input" placeholder="Nhà máy • Gyeonggi-do • 2 năm" value={form.info} onChange={set('info')} />
            </div>

            <div className="form-group">
              <label className="form-label">Đánh giá sao</label>
              <div className="star-row">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    className={`star-btn ${n <= form.stars ? 'active' : ''}`}
                    onClick={() => setForm((f) => ({ ...f, stars: n }))}
                  >★</button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Nội dung đánh giá *</label>
              <textarea
                className="form-textarea"
                placeholder="Chia sẻ kinh nghiệm, lương, môi trường làm việc..."
                value={form.review_text}
                onChange={set('review_text')}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Tags (cách nhau bằng dấu phẩy)</label>
              <input className="form-input" placeholder="Chế tạo, E-9, Gyeonggi" value={form.tags} onChange={set('tags')} />
              <p className="form-hint">Ví dụ: Nông nghiệp, E-9, Chungnam</p>
            </div>

            {err && <p style={{ color: 'var(--red)', fontSize: 13, marginBottom: 12 }}>{err}</p>}

            <button className="submit-btn" onClick={handleSubmit} disabled={saving}>
              {saving ? 'Đang gửi...' : '🚀 Gửi đánh giá'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}

// ── 메인 Community 페이지 ─────────────────────────────────────
function Community({ openModal, openAuthModal }) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [reviews,    setReviews]    = useState([])
  const [loading,    setLoading]    = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)
  const [showForm,   setShowForm]   = useState(false)

  // refreshKey가 바뀔 때마다 재페치 (setState는 모두 async 콜백 안에서만 호출)
  useEffect(() => {
    fetchReviews()
      .then((data) => { setReviews(data); setLoading(false) })
      .catch(() => { setReviews(REVIEWS_FALLBACK); setLoading(false) })
  }, [refreshKey])

  // 후기 저장 성공 후 목록 새로고침 (setLoading은 이벤트 핸들러에서 호출 → OK)
  const handleSaved = () => {
    setShowForm(false)
    setLoading(true)
    setRefreshKey((k) => k + 1)
  }

  // 클릭된 후기를 모달로 표시
  const handleReviewClick = (review) => {
    openModal({
      title: `⭐ Kinh nghiệm của ${review.name}`,
      body: `<strong>${review.name}</strong><br/>${review.info}<br/><br/>"${review.review_text}"`,
    })
  }

  return (
    <div className="page-enter">
      <div className="screen-header" style={{ background: 'linear-gradient(135deg, #2d5a27, #4a8f3f)' }}>
        <button className="back-btn" onClick={() => navigate('/')}>← Quay lại</button>
        <h2>💬 Cộng đồng<br />người Việt tại HQ</h2>
        <p>Kinh nghiệm thực tế từ anh chị đi trước</p>
      </div>

      <div className="review-list">
        {/* 로딩 */}
        {loading && (
          <div className="loading-wrap">
            <div className="spinner" />
            <p>Đang tải đánh giá...</p>
          </div>
        )}

        {/* 후기 목록 */}
        {!loading && reviews.map((review) => (
          <div key={review.id} className="review-card" onClick={() => handleReviewClick(review)}>
            <div className="review-header">
              <div className="review-avatar">{review.name?.[0] ?? '?'}</div>
              <div className="review-meta">
                <div className="name">{review.name}</div>
                <div className="info">{review.info}</div>
              </div>
              <div className="review-stars">{starsStr(review.stars)}</div>
            </div>
            <div className="review-text">"{review.review_text}"</div>
            {review.tags?.length > 0 && (
              <div className="review-tags">
                {review.tags.map((tag) => (
                  <span key={tag} className="review-tag">{tag}</span>
                ))}
              </div>
            )}
          </div>
        ))}

        {/* 빈 상태 */}
        {!loading && reviews.length === 0 && (
          <div className="error-wrap">
            Chưa có đánh giá nào.<br />Hãy là người đầu tiên chia sẻ! 🙏
          </div>
        )}

        <div style={{ textAlign: 'center', padding: '8px 0 4px' }}>
          {user ? (
            <button className="write-btn" onClick={() => setShowForm(true)}>
              ✏️ Chia sẻ kinh nghiệm của bạn
            </button>
          ) : (
            <div>
              <button className="write-btn" onClick={openAuthModal}>
                ✏️ Chia sẻ kinh nghiệm của bạn
              </button>
              <p style={{ fontSize: 12, color: '#aaa', marginTop: 6 }}>
                Đăng nhập để viết đánh giá
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="spacer" />

      {/* 후기 작성 폼 */}
      {showForm && (
        <WriteReviewModal
          onClose={() => setShowForm(false)}
          onSaved={handleSaved}
        />
      )}
    </div>
  )
}

export default Community
