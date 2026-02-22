import { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import {
  fetchNotifications,
  fetchUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
} from '../lib/api'

const TYPE_LABELS = {
  new_review: { icon: '💬', label: 'Đánh giá mới' },
  notice:     { icon: '📢', label: 'Thông báo' },
  visa_info:  { icon: '🛂', label: 'Thông tin visa' },
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Vừa xong'
  if (mins < 60) return `${mins} phút trước`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs} giờ trước`
  const days = Math.floor(hrs / 24)
  return `${days} ngày trước`
}

function NotificationBell() {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState([])
  const [unread, setUnread] = useState(0)
  const [loading, setLoading] = useState(false)
  const panelRef = useRef(null)

  // ── 읽지 않은 개수 가져오기 ──
  const loadUnread = useCallback(() => {
    if (!user) return
    fetchUnreadCount(user.id).then((c) => setUnread(c))
  }, [user])

  // ── 알림 목록 가져오기 ──
  const loadItems = useCallback(() => {
    if (!user) return
    setLoading(true)
    fetchNotifications(user.id)
      .then((data) => { setItems(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [user])

  // ── 마운트 시 unread 카운트 로드 ──
  useEffect(() => {
    loadUnread()
  }, [loadUnread])

  // ── Supabase Realtime 구독 ──
  useEffect(() => {
    if (!user) return

    const channel = supabase
      .channel('notifications-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          // 새 알림이 들어오면 unread 증가 + 목록 앞에 추가
          setUnread((prev) => prev + 1)
          setItems((prev) => [payload.new, ...prev].slice(0, 30))
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user])

  // ── 외부 클릭 닫기 ──
  useEffect(() => {
    if (!open) return
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  // ── 개별 알림 읽음 처리 ──
  const handleRead = async (item) => {
    if (!item.is_read) {
      await markNotificationRead(item.id)
      setItems((prev) => prev.map((n) => (n.id === item.id ? { ...n, is_read: true } : n)))
      setUnread((prev) => Math.max(0, prev - 1))
    }
  }

  // ── 전체 읽음 ──
  const handleReadAll = async () => {
    if (!user || unread === 0) return
    await markAllNotificationsRead(user.id)
    setItems((prev) => prev.map((n) => ({ ...n, is_read: true })))
    setUnread(0)
  }

  // 비로그인 시 렌더링 안 함
  if (!user) return null

  return (
    <div className="noti-wrap" ref={panelRef}>
      <button className="noti-bell-btn" onClick={() => { setOpen((v) => { if (!v) loadItems(); return !v }) }} aria-label="Notifications">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" width="18" height="18">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unread > 0 && (
          <span className="noti-badge">{unread > 99 ? '99+' : unread}</span>
        )}
      </button>

      {open && (
        <div className="noti-dropdown">
          <div className="noti-dropdown-header">
            <span className="noti-dropdown-title">Thông báo</span>
            {unread > 0 && (
              <button className="noti-read-all-btn" onClick={handleReadAll}>
                Đánh dấu tất cả đã đọc
              </button>
            )}
          </div>

          <div className="noti-dropdown-body">
            {loading && (
              <div className="noti-loading">
                <div className="spinner" style={{ width: 24, height: 24, borderWidth: 2 }} />
              </div>
            )}

            {!loading && items.length === 0 && (
              <div className="noti-empty">
                <div style={{ fontSize: 32, marginBottom: 8 }}>🔔</div>
                <p>Chưa có thông báo</p>
              </div>
            )}

            {!loading && items.map((n) => {
              const meta = TYPE_LABELS[n.type] || TYPE_LABELS.notice
              return (
                <button
                  key={n.id}
                  className={`noti-item ${n.is_read ? '' : 'unread'}`}
                  onClick={() => handleRead(n)}
                >
                  <span className="noti-item-icon">{meta.icon}</span>
                  <div className="noti-item-body">
                    <span className="noti-item-type">{meta.label}</span>
                    <span className="noti-item-msg">{n.message}</span>
                    <span className="noti-item-time">{timeAgo(n.created_at)}</span>
                  </div>
                  {!n.is_read && <span className="noti-dot" />}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export default NotificationBell
