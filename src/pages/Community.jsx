import { useNavigate } from 'react-router-dom'
import modals from '../data/modals'

// 나중에 Supabase reviews 테이블에서 불러올 데이터
const REVIEWS = [
  {
    id: 'modal-review1',
    initial: 'T',
    name: 'Nguyễn Văn Tuấn',
    info: 'Nhà máy điện tử • Gyeonggi-do • 2 năm',
    stars: '★★★★★',
    text: '"Lương tháng đầu khoảng 2.3 triệu won. Ký túc xá do công ty lo, trừ 200 nghìn/tháng. Đồng nghiệp Hàn khá thân thiện, có người biết tiếng Anh giúp đỡ..."',
    tags: ['Chế tạo', 'E-9', 'Gyeonggi'],
  },
  {
    id: 'modal-review2',
    initial: 'L',
    name: 'Trần Thị Lan',
    info: 'Nông nghiệp • Chungnam • 1.5 năm',
    stars: '★★★★☆',
    text: '"Làm nông nghiệp vất vả hơn tôi nghĩ, nhưng lương ổn hơn Việt Nam nhiều. Mùa hè nóng lắm, cần chuẩn bị tinh thần. Chủ trại tốt, lo ăn ở đầy đủ..."',
    tags: ['Nông nghiệp', 'E-9', 'Chungnam'],
  },
  {
    id: 'modal-review3',
    initial: 'H',
    name: 'Lê Minh Hoàng',
    info: 'Xây dựng • Seoul • 3 năm',
    stars: '★★★★★',
    text: '"Làm xây dựng lương cao hơn nhưng công việc nặng. Tiếng Hàn quan trọng lắm, biết càng nhiều càng được chủ quý. Tôi đã thi nâng bậc lương 2 lần rồi..."',
    tags: ['Xây dựng', 'Seoul', 'Tăng lương'],
  },
]

function Community({ openModal }) {
  const navigate = useNavigate()

  return (
    <div className="page-enter">
      <div className="screen-header" style={{ background: 'linear-gradient(135deg, #2d5a27, #4a8f3f)' }}>
        <button className="back-btn" onClick={() => navigate('/')}>← Quay lại</button>
        <h2>💬 Cộng đồng<br />người Việt tại HQ</h2>
        <p>Kinh nghiệm thực tế từ anh chị đi trước</p>
      </div>

      <div className="review-list">
        {REVIEWS.map((review) => (
          <div key={review.id} className="review-card" onClick={() => openModal(modals[review.id])}>
            <div className="review-header">
              <div className="review-avatar">{review.initial}</div>
              <div className="review-meta">
                <div className="name">{review.name}</div>
                <div className="info">{review.info}</div>
              </div>
              <div className="review-stars">{review.stars}</div>
            </div>
            <div className="review-text">{review.text}</div>
            <div className="review-tags">
              {review.tags.map((tag) => (
                <span key={tag} className="review-tag">{tag}</span>
              ))}
            </div>
          </div>
        ))}

        <div style={{ textAlign: 'center', padding: '8px 0 4px' }}>
          <button className="write-btn" onClick={() => openModal(modals['modal-write'])}>
            ✏️ Chia sẻ kinh nghiệm của bạn
          </button>
        </div>
      </div>

      <div className="spacer" />
    </div>
  )
}

export default Community
