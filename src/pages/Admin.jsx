import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  fetchGuidesRaw, upsertGuide, deleteGuide,
  fetchAllReviews, updateReviewApproval, deleteReview,
  fetchSettings, upsertSetting,
  sendNotifications, fetchAllUserIds,
} from '../lib/api'

// ── 관리자 설정 ──────────────────────────────────────────────────
const ADMIN_PASSWORD = 'Tnwls4627@0627'         // ← 원하는 비밀번호로 변경
const ADMIN_EMAIL    = 'herossb507@gmail.com'  // ← 관리자 이메일로 변경

// ── 가이드 관리 탭 ──────────────────────────────────────────────
function GuidesPanel() {
  const EMPTY = { step_num: '', modal_id: '', title: '', description: '', badge: '' }
  const [items,      setItems]      = useState([])
  const [loading,    setLoading]    = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)
  const [editId,     setEditId]     = useState(null)
  const [form,       setForm]       = useState(EMPTY)
  const [msg,        setMsg]        = useState('')

  useEffect(() => {
    fetchGuidesRaw()
      .then((data) => { setItems(data); setLoading(false) })
      .catch(() => { setMsg('Lỗi tải dữ liệu'); setLoading(false) })
  }, [refreshKey])

  const flash = (m) => { setMsg(m); setTimeout(() => setMsg(''), 3000) }
  const set   = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))
  const reload = () => { setLoading(true); setRefreshKey((k) => k + 1) }

  const handleSave = async () => {
    if (!form.title.trim()) { flash('Tiêu đề bắt buộc'); return }
    try {
      const payload = { ...form, step_num: parseInt(form.step_num) || 0 }
      if (editId) payload.id = editId
      await upsertGuide(payload)
      setForm(EMPTY); setEditId(null)
      flash(editId ? 'Đã cập nhật!' : 'Đã thêm mới!')
      reload()
    } catch { flash('Lỗi lưu dữ liệu') }
  }

  const handleEdit = (g) => {
    setEditId(g.id)
    setForm({ step_num: g.step_num, modal_id: g.modal_id, title: g.title, description: g.description, badge: g.badge })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Xác nhận xóa hướng dẫn này?')) return
    try { await deleteGuide(id); flash('Đã xóa!'); reload() }
    catch { flash('Lỗi xóa') }
  }

  const handleCancel = () => { setEditId(null); setForm(EMPTY) }

  if (loading) return <div className="loading-wrap"><div className="spinner" /><p>Đang tải...</p></div>

  return (
    <div>
      {msg && <div className="adm-msg">{msg}</div>}

      <div className="adm-card">
        <h3 className="adm-card-title">{editId ? '✏️ Sửa hướng dẫn' : '➕ Thêm hướng dẫn'}</h3>
        <div className="adm-grid2">
          <div className="adm-field">
            <label>Bước #</label>
            <input className="form-input" type="number" value={form.step_num} onChange={set('step_num')} placeholder="1" />
          </div>
          <div className="adm-field">
            <label>Modal ID</label>
            <input className="form-input" value={form.modal_id} onChange={set('modal_id')} placeholder="modal-step1" />
          </div>
        </div>
        <div className="adm-field">
          <label>Tiêu đề</label>
          <input className="form-input" value={form.title} onChange={set('title')} placeholder="Đăng ký thi EPS-TOPIK" />
        </div>
        <div className="adm-field">
          <label>Mô tả</label>
          <textarea className="form-textarea" value={form.description} onChange={set('description')} rows={3} />
        </div>
        <div className="adm-field">
          <label>Badge</label>
          <input className="form-input" value={form.badge} onChange={set('badge')} placeholder="Bắt buộc đầu tiên" />
        </div>
        <div className="adm-actions">
          <button className="adm-btn primary" onClick={handleSave}>{editId ? 'Cập nhật' : 'Thêm'}</button>
          {editId && <button className="adm-btn" onClick={handleCancel}>Hủy</button>}
        </div>
      </div>

      <div className="adm-card">
        <h3 className="adm-card-title">📋 Danh sách ({items.length})</h3>
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead>
              <tr><th>#</th><th>Tiêu đề</th><th>Badge</th><th>Thao tác</th></tr>
            </thead>
            <tbody>
              {items.map((g) => (
                <tr key={g.id}>
                  <td>{g.step_num}</td>
                  <td>{g.title}</td>
                  <td><span className="adm-badge">{g.badge}</span></td>
                  <td className="adm-td-actions">
                    <button className="adm-btn-sm" onClick={() => handleEdit(g)}>✏️</button>
                    <button className="adm-btn-sm danger" onClick={() => handleDelete(g.id)}>🗑️</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {items.length === 0 && <p className="adm-empty">Chưa có dữ liệu. Thêm hướng dẫn đầu tiên!</p>}
        </div>
      </div>
    </div>
  )
}

// ── 후기 관리 탭 ────────────────────────────────────────────────
function ReviewsPanel() {
  const [items,      setItems]      = useState([])
  const [loading,    setLoading]    = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)
  const [msg,        setMsg]        = useState('')

  useEffect(() => {
    fetchAllReviews()
      .then((data) => { setItems(data); setLoading(false) })
      .catch(() => { setMsg('Lỗi tải dữ liệu'); setLoading(false) })
  }, [refreshKey])

  const flash  = (m) => { setMsg(m); setTimeout(() => setMsg(''), 3000) }
  const reload = () => { setLoading(true); setRefreshKey((k) => k + 1) }

  const handleApprove = async (id) => {
    try { await updateReviewApproval(id, true); flash('Đã duyệt!'); reload() }
    catch { flash('Lỗi cập nhật') }
  }

  const handleReject = async (id) => {
    try { await updateReviewApproval(id, false); flash('Đã từ chối!'); reload() }
    catch { flash('Lỗi cập nhật') }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Xác nhận xóa đánh giá này?')) return
    try { await deleteReview(id); flash('Đã xóa!'); reload() }
    catch { flash('Lỗi xóa') }
  }

  if (loading) return <div className="loading-wrap"><div className="spinner" /><p>Đang tải...</p></div>

  return (
    <div>
      {msg && <div className="adm-msg">{msg}</div>}
      <div className="adm-card">
        <h3 className="adm-card-title">💬 Đánh giá ({items.length})</h3>
        {items.length === 0 && <p className="adm-empty">Chưa có đánh giá</p>}
        {items.map((r) => (
          <div key={r.id} className="adm-review-row">
            <div className="adm-review-top">
              <div>
                <strong>{r.name}</strong>
                <span className="adm-review-info">{r.info}</span>
              </div>
              <span className="adm-review-stars">{'★'.repeat(r.stars)}{'☆'.repeat(5 - r.stars)}</span>
            </div>
            <p className="adm-review-text">{r.review_text}</p>
            <div className="adm-review-bottom">
              <span className={`adm-status ${r.is_approved ? 'approved' : 'pending'}`}>
                {r.is_approved ? '✓ Đã duyệt' : '⏳ Chờ duyệt'}
              </span>
              <div className="adm-review-actions">
                {!r.is_approved && (
                  <button className="adm-btn-sm approve" onClick={() => handleApprove(r.id)}>✅ Duyệt</button>
                )}
                {r.is_approved && (
                  <button className="adm-btn-sm" onClick={() => handleReject(r.id)}>↩️ Hủy duyệt</button>
                )}
                <button className="adm-btn-sm danger" onClick={() => handleDelete(r.id)}>🗑️</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── 설정 관리 탭 ────────────────────────────────────────────────
function SettingsPanel() {
  const [items,      setItems]      = useState([])
  const [loading,    setLoading]    = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)
  const [edits,      setEdits]      = useState({})
  const [msg,        setMsg]        = useState('')
  const [addForm,    setAddForm]    = useState({ key: '', value: '', label: '' })

  useEffect(() => {
    fetchSettings()
      .then((data) => { setItems(data); setLoading(false) })
      .catch(() => { setItems([]); setLoading(false) })
  }, [refreshKey])

  const flash  = (m) => { setMsg(m); setTimeout(() => setMsg(''), 3000) }
  const reload = () => { setLoading(true); setRefreshKey((k) => k + 1) }

  const handleSave = async (s) => {
    try {
      await upsertSetting(s.key, edits[s.key] ?? s.value, s.label)
      flash(`"${s.label}" đã được cập nhật!`)
      reload()
    } catch { flash('Lỗi lưu') }
  }

  const handleAdd = async () => {
    if (!addForm.key.trim() || !addForm.label.trim()) { flash('Key và Label bắt buộc'); return }
    try {
      await upsertSetting(addForm.key, addForm.value, addForm.label)
      setAddForm({ key: '', value: '', label: '' })
      flash('Đã thêm mới!')
      reload()
    } catch { flash('Lỗi thêm mới') }
  }

  if (loading) return <div className="loading-wrap"><div className="spinner" /><p>Đang tải...</p></div>

  return (
    <div>
      {msg && <div className="adm-msg">{msg}</div>}

      <div className="adm-card">
        <h3 className="adm-card-title">⚙️ Cài đặt hệ thống</h3>
        {items.length === 0 && <p className="adm-empty">Chưa có cài đặt. Thêm bên dưới!</p>}
        {items.map((s) => (
          <div key={s.key} className="adm-setting-row">
            <div className="adm-setting-info">
              <span className="adm-setting-label">{s.label}</span>
              <code className="adm-setting-key">{s.key}</code>
            </div>
            <div className="adm-setting-edit">
              <input
                className="form-input"
                defaultValue={s.value}
                onChange={(e) => setEdits((prev) => ({ ...prev, [s.key]: e.target.value }))}
              />
              <button className="adm-btn-sm approve" onClick={() => handleSave(s)}>💾</button>
            </div>
          </div>
        ))}
      </div>

      <div className="adm-card">
        <h3 className="adm-card-title">➕ Thêm cài đặt mới</h3>
        <div className="adm-grid3">
          <div className="adm-field">
            <label>Key</label>
            <input className="form-input" value={addForm.key} onChange={(e) => setAddForm((f) => ({ ...f, key: e.target.value }))} placeholder="min_wage" />
          </div>
          <div className="adm-field">
            <label>Label</label>
            <input className="form-input" value={addForm.label} onChange={(e) => setAddForm((f) => ({ ...f, label: e.target.value }))} placeholder="Lương tối thiểu (₩/h)" />
          </div>
          <div className="adm-field">
            <label>Value</label>
            <input className="form-input" value={addForm.value} onChange={(e) => setAddForm((f) => ({ ...f, value: e.target.value }))} placeholder="9860" />
          </div>
        </div>
        <button className="adm-btn primary" style={{ marginTop: 12 }} onClick={handleAdd}>Thêm</button>
      </div>
    </div>
  )
}

// ── 공지 발송 탭 ────────────────────────────────────────────────
function NoticePanel() {
  const [message, setMessage] = useState('')
  const [type, setType]       = useState('notice')
  const [sending, setSending] = useState(false)
  const [msg, setMsg]         = useState('')

  const flash = (m) => { setMsg(m); setTimeout(() => setMsg(''), 4000) }

  const handleSend = async () => {
    const txt = message.trim()
    if (!txt) { flash('Nhập nội dung thông báo'); return }
    setSending(true)
    try {
      const userIds = await fetchAllUserIds()
      if (userIds.length === 0) {
        flash('Không tìm thấy người dùng. Hãy tạo hàm RPC get_all_user_ids trong Supabase.')
        setSending(false)
        return
      }
      await sendNotifications(userIds, txt, type)
      flash(`Đã gửi thông báo đến ${userIds.length} người dùng!`)
      setMessage('')
    } catch {
      flash('Lỗi gửi thông báo')
    }
    setSending(false)
  }

  return (
    <div>
      {msg && <div className="adm-msg">{msg}</div>}

      <div className="adm-card">
        <h3 className="adm-card-title">📢 Gửi thông báo đến tất cả người dùng</h3>

        <div className="adm-field">
          <label>Loại thông báo</label>
          <select className="form-input" value={type} onChange={(e) => setType(e.target.value)}>
            <option value="notice">📢 Thông báo chung</option>
            <option value="visa_info">🛂 Thông tin visa</option>
            <option value="new_review">💬 Đánh giá mới</option>
          </select>
        </div>

        <div className="adm-field">
          <label>Nội dung</label>
          <textarea
            className="form-textarea"
            rows={4}
            placeholder="Nhập nội dung thông báo gửi đến tất cả người dùng..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
        </div>

        <button className="adm-btn primary" onClick={handleSend} disabled={sending}>
          {sending ? 'Đang gửi...' : '📤 Gửi thông báo'}
        </button>
      </div>

      <div className="adm-card" style={{ background: '#fffbe6', borderLeft: '4px solid var(--gold)' }}>
        <h3 className="adm-card-title" style={{ fontSize: 13 }}>💡 Hướng dẫn thiết lập</h3>
        <p style={{ fontSize: 12, color: '#666', lineHeight: 1.7 }}>
          Để gửi thông báo, cần tạo hàm RPC trong Supabase SQL Editor:<br />
          <code style={{ fontSize: 11, background: '#f4f4f6', padding: '2px 6px', borderRadius: 4 }}>
            CREATE OR REPLACE FUNCTION get_all_user_ids()
            RETURNS TABLE(id uuid) AS $$
            SELECT id FROM auth.users;
            $$ LANGUAGE sql SECURITY DEFINER;
          </code>
        </p>
      </div>
    </div>
  )
}

// ── Admin 페이지 (메인) ─────────────────────────────────────────
function Admin() {
  const navigate = useNavigate()
  const [authed, setAuthed] = useState(() => sessionStorage.getItem('adm') === '1')
  const [pw,     setPw]     = useState('')
  const [pwErr,  setPwErr]  = useState('')
  const [tab,    setTab]    = useState('guides')

  const handleLogin = () => {
    if (pw === ADMIN_PASSWORD) {
      sessionStorage.setItem('adm', '1')
      setAuthed(true)
    } else {
      setPwErr('Sai mật khẩu. Thử lại.')
    }
  }

  const handleLogout = () => {
    sessionStorage.removeItem('adm')
    navigate('/')
  }

  // ── 비밀번호 게이트 ──
  if (!authed) {
    return (
      <div className="adm-login-page">
        <div className="adm-login-box">
          <div style={{ fontSize: 40, textAlign: 'center', marginBottom: 8 }}>🔐</div>
          <h2 style={{ textAlign: 'center', fontFamily: "'Baloo 2', cursive", margin: '0 0 4px' }}>
            Admin Panel
          </h2>
          <p style={{ textAlign: 'center', fontSize: 13, color: '#888', marginBottom: 20 }}>
            Nhập mật khẩu quản trị viên
          </p>
          <input
            className="form-input"
            type="password"
            placeholder="Mật khẩu"
            value={pw}
            onChange={(e) => { setPw(e.target.value); setPwErr('') }}
            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
          />
          {pwErr && <p className="auth-error" style={{ marginTop: 8 }}>{pwErr}</p>}
          <button className="submit-btn" style={{ marginTop: 12 }} onClick={handleLogin}>
            Đăng nhập
          </button>
          <button
            style={{ display: 'block', margin: '16px auto 0', background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: 13 }}
            onClick={() => navigate('/')}
          >
            ← Quay lại trang chủ
          </button>
        </div>
      </div>
    )
  }

  // ── 관리 패널 ──
  const TABS = [
    ['guides',   '📋 Hướng dẫn'],
    ['reviews',  '💬 Đánh giá'],
    ['notice',   '📢 Thông báo'],
    ['settings', '⚙️ Cài đặt'],
  ]

  return (
    <div className="adm-page">
      <div className="adm-header">
        <div>
          <div className="adm-header-title">⚙️ KoViet Admin</div>
          <div className="adm-header-email">{ADMIN_EMAIL}</div>
        </div>
        <button className="adm-btn" onClick={handleLogout}>🚪 Đăng xuất</button>
      </div>

      <div className="adm-tabs">
        {TABS.map(([key, label]) => (
          <button
            key={key}
            className={`adm-tab ${tab === key ? 'active' : ''}`}
            onClick={() => setTab(key)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="adm-content">
        {tab === 'guides'   && <GuidesPanel />}
        {tab === 'reviews'  && <ReviewsPanel />}
        {tab === 'notice'   && <NoticePanel />}
        {tab === 'settings' && <SettingsPanel />}
      </div>
    </div>
  )
}

export default Admin
