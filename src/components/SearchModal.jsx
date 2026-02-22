import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { searchGuides, searchReviews } from '../lib/api'
import modals from '../data/modals'

const HINT_CHIPS = ['EPS-TOPIK', 'visa E-9', 'lương', 'bảo hiểm', 'tiếng Hàn', 'nhà ở']
const STAR_STR   = (n) => '★'.repeat(n) + '☆'.repeat(5 - n)

export default function SearchModal({ onClose, openModal }) {
  const { t } = useTranslation()
  const navigate  = useNavigate()
  const inputRef  = useRef(null)

  const [query,   setQuery]   = useState('')
  const [guides,  setGuides]  = useState([])
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(false)
  const [touched, setTouched] = useState(false)

  // 모달 열리면 인풋 자동 포커스
  useEffect(() => { inputRef.current?.focus() }, [])

  // ── 디바운스 검색 (350ms) ──────────────────────────────────────
  const doSearch = useCallback(async (q) => {
    setLoading(true)
    setTouched(true)
    try {
      const [g, r] = await Promise.all([searchGuides(q), searchReviews(q)])
      setGuides(g)
      setReviews(r)
    } catch {
      setGuides([])
      setReviews([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const q = query.trim()
    if (!q) {
      setGuides([])
      setReviews([])
      setTouched(false)
      setLoading(false)
      return
    }
    setLoading(true)
    const timer = setTimeout(() => doSearch(q), 350)
    return () => clearTimeout(timer)
  }, [query, doSearch])

  // ── 결과 클릭 핸들러 ──────────────────────────────────────────
  const handleGuideClick = (guide) => {
    const modalData = modals[guide.modal_id]
    if (modalData) openModal(modalData)
    onClose()
  }

  const handleReviewClick = () => {
    navigate('/community')
    onClose()
  }

  const handleOverlay = (e) => { if (e.target === e.currentTarget) onClose() }

  const noResults  = touched && !loading && guides.length === 0 && reviews.length === 0
  const hasResults = !loading && (guides.length > 0 || reviews.length > 0)

  return (
    <div className="modal-overlay show" onClick={handleOverlay}>
      <div className="modal-sheet search-sheet">
        <div className="modal-handle" />

        {/* ── 검색 입력창 ── */}
        <div className="search-bar">
          <svg className="search-bar-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            ref={inputRef}
            className="search-bar-input"
            type="text"
            placeholder={t('search.placeholder')}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query ? (
            <button className="search-bar-clear" onClick={() => setQuery('')} aria-label="Clear">✕</button>
          ) : (
            <button className="modal-close" style={{ position: 'static', margin: 0 }} onClick={onClose}>✕</button>
          )}
        </div>

        {/* ── 스크롤 영역 ── */}
        <div className="search-body">

          {/* 로딩 */}
          {loading && (
            <div style={{ textAlign: 'center', padding: '32px 0' }}>
              <div className="spinner" />
            </div>
          )}

          {/* 결과 없음 */}
          {noResults && (
            <div className="search-empty">
              <div className="search-empty-icon">🔍</div>
              <p className="search-empty-title">
                {t('search.noResultTitle')}
              </p>
              <p className="search-empty-sub">
                {t('search.noResultSub', { query })}
              </p>
            </div>
          )}

          {/* 검색 결과 */}
          {hasResults && (
            <div className="search-results">

              {/* 가이드 결과 */}
              {guides.length > 0 && (
                <div className="search-section">
                  <div className="search-section-title">
                    {t('search.guideSection')}
                    <span className="search-count">{guides.length}</span>
                  </div>
                  {guides.map((g) => (
                    <button key={g.id} className="search-item" onClick={() => handleGuideClick(g)}>
                      <div className="search-item-num">{g.step_num}</div>
                      <div className="search-item-body">
                        <div className="search-item-title">{g.title}</div>
                        <div className="search-item-sub">
                          {g.description?.slice(0, 55)}{g.description?.length > 55 ? '…' : ''}
                        </div>
                      </div>
                      <span className="step-badge" style={{ flexShrink: 0, fontSize: 10 }}>{g.badge}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* 후기 결과 */}
              {reviews.length > 0 && (
                <div className="search-section">
                  <div className="search-section-title">
                    {t('search.reviewSection')}
                    <span className="search-count">{reviews.length}</span>
                  </div>
                  {reviews.map((r) => (
                    <button key={r.id} className="search-item" onClick={handleReviewClick}>
                      <div className="search-item-avatar">{r.name?.[0]?.toUpperCase() ?? '?'}</div>
                      <div className="search-item-body">
                        <div className="search-item-title">
                          {r.name}
                          <span className="search-stars">{STAR_STR(r.stars)}</span>
                        </div>
                        <div className="search-item-sub">
                          {r.review_text?.slice(0, 55)}{r.review_text?.length > 55 ? '…' : ''}
                        </div>
                      </div>
                      <span className="search-arrow">→</span>
                    </button>
                  ))}
                </div>
              )}

            </div>
          )}

          {/* 초기 상태 – 힌트 칩 */}
          {!query && !touched && (
            <div className="search-hint">
              <p className="search-hint-title">{t('search.hintTitle')}</p>
              <div className="search-chips">
                {HINT_CHIPS.map((chip) => (
                  <button key={chip} className="search-chip" onClick={() => setQuery(chip)}>
                    {chip}
                  </button>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
