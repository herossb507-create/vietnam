// 모달 내용에 HTML 태그가 포함되어 있어 dangerouslySetInnerHTML 사용
// (내용은 모두 data/modals.js에 하드코딩된 신뢰 데이터임)
function Modal({ data, onClose }) {
  if (!data) return null

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose()
  }

  return (
    <div className="modal-overlay show" onClick={handleOverlayClick}>
      <div className="modal-sheet">
        <div className="modal-handle" />
        <button className="modal-close" onClick={onClose}>✕</button>
        <div
          className="modal-title"
          dangerouslySetInnerHTML={{ __html: data.title }}
        />
        <div
          className="modal-body"
          dangerouslySetInnerHTML={{ __html: data.body }}
        />
      </div>
    </div>
  )
}

export default Modal
