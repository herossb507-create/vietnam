import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
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
  const { t } = useTranslation()
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
      .catch(() => { setMsg(t('admin.loadError')); setLoading(false) })
  }, [refreshKey, t])

  const flash = (m) => { setMsg(m); setTimeout(() => setMsg(''), 3000) }
  const set   = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))
  const reload = () => { setLoading(true); setRefreshKey((k) => k + 1) }

  const handleSave = async () => {
    if (!form.title.trim()) { flash(t('admin.titleRequired')); return }
    try {
      const payload = { ...form, step_num: parseInt(form.step_num) || 0 }
      if (editId) payload.id = editId
      await upsertGuide(payload)
      setForm(EMPTY); setEditId(null)
      flash(editId ? t('admin.updated') : t('admin.added'))
      reload()
    } catch { flash(t('admin.saveError')) }
  }

  const handleEdit = (g) => {
    setEditId(g.id)
    setForm({ step_num: g.step_num, modal_id: g.modal_id, title: g.title, description: g.description, badge: g.badge })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDelete = async (id) => {
    if (!window.confirm(t('admin.confirmDeleteGuide'))) return
    try { await deleteGuide(id); flash(t('admin.deleted')); reload() }
    catch { flash(t('admin.deleteError')) }
  }

  const handleCancel = () => { setEditId(null); setForm(EMPTY) }

  if (loading) return <div className="loading-wrap"><div className="spinner" /><p>{t('common.loading')}</p></div>

  return (
    <div>
      {msg && <div className="adm-msg">{msg}</div>}

      <div className="adm-card">
        <h3 className="adm-card-title">{editId ? t('admin.editGuide') : t('admin.addGuide')}</h3>
        <div className="adm-grid2">
          <div className="adm-field">
            <label>{t('admin.stepNum')}</label>
            <input className="form-input" type="number" value={form.step_num} onChange={set('step_num')} placeholder="1" />
          </div>
          <div className="adm-field">
            <label>Modal ID</label>
            <input className="form-input" value={form.modal_id} onChange={set('modal_id')} placeholder="modal-step1" />
          </div>
        </div>
        <div className="adm-field">
          <label>{t('admin.titleLabel')}</label>
          <input className="form-input" value={form.title} onChange={set('title')} />
        </div>
        <div className="adm-field">
          <label>{t('admin.descLabel')}</label>
          <textarea className="form-textarea" value={form.description} onChange={set('description')} rows={3} />
        </div>
        <div className="adm-field">
          <label>{t('admin.badgeLabel')}</label>
          <input className="form-input" value={form.badge} onChange={set('badge')} />
        </div>
        <div className="adm-actions">
          <button className="adm-btn primary" onClick={handleSave}>{editId ? t('admin.update') : t('admin.add')}</button>
          {editId && <button className="adm-btn" onClick={handleCancel}>{t('admin.cancel')}</button>}
        </div>
      </div>

      <div className="adm-card">
        <h3 className="adm-card-title">{t('admin.listTitle')} ({items.length})</h3>
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead>
              <tr><th>#</th><th>{t('admin.titleLabel')}</th><th>{t('admin.badgeLabel')}</th><th>{t('admin.action')}</th></tr>
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
          {items.length === 0 && <p className="adm-empty">{t('admin.emptyGuides')}</p>}
        </div>
      </div>
    </div>
  )
}

// ── 후기 관리 탭 ────────────────────────────────────────────────
function ReviewsPanel() {
  const { t } = useTranslation()
  const [items,      setItems]      = useState([])
  const [loading,    setLoading]    = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)
  const [msg,        setMsg]        = useState('')

  useEffect(() => {
    fetchAllReviews()
      .then((data) => { setItems(data); setLoading(false) })
      .catch(() => { setMsg(t('admin.loadError')); setLoading(false) })
  }, [refreshKey, t])

  const flash  = (m) => { setMsg(m); setTimeout(() => setMsg(''), 3000) }
  const reload = () => { setLoading(true); setRefreshKey((k) => k + 1) }

  const handleApprove = async (id) => {
    try { await updateReviewApproval(id, true); flash(t('admin.approvedMsg')); reload() }
    catch { flash(t('admin.updateError')) }
  }

  const handleReject = async (id) => {
    try { await updateReviewApproval(id, false); flash(t('admin.rejectedMsg')); reload() }
    catch { flash(t('admin.updateError')) }
  }

  const handleDelete = async (id) => {
    if (!window.confirm(t('admin.confirmDeleteReview'))) return
    try { await deleteReview(id); flash(t('admin.deleted')); reload() }
    catch { flash(t('admin.deleteError')) }
  }

  if (loading) return <div className="loading-wrap"><div className="spinner" /><p>{t('common.loading')}</p></div>

  return (
    <div>
      {msg && <div className="adm-msg">{msg}</div>}
      <div className="adm-card">
        <h3 className="adm-card-title">{t('admin.reviewsTitle')} ({items.length})</h3>
        {items.length === 0 && <p className="adm-empty">{t('admin.emptyReviews')}</p>}
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
                {r.is_approved ? `✓ ${t('admin.approved')}` : `⏳ ${t('admin.pending')}`}
              </span>
              <div className="adm-review-actions">
                {!r.is_approved && (
                  <button className="adm-btn-sm approve" onClick={() => handleApprove(r.id)}>✅ {t('admin.approve')}</button>
                )}
                {r.is_approved && (
                  <button className="adm-btn-sm" onClick={() => handleReject(r.id)}>↩️ {t('admin.unapprove')}</button>
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
  const { t } = useTranslation()
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
      flash(t('admin.settingUpdated', { label: s.label }))
      reload()
    } catch { flash(t('admin.settingSaveError')) }
  }

  const handleAdd = async () => {
    if (!addForm.key.trim() || !addForm.label.trim()) { flash(t('admin.keyLabelRequired')); return }
    try {
      await upsertSetting(addForm.key, addForm.value, addForm.label)
      setAddForm({ key: '', value: '', label: '' })
      flash(t('admin.settingAdded'))
      reload()
    } catch { flash(t('admin.settingAddError')) }
  }

  if (loading) return <div className="loading-wrap"><div className="spinner" /><p>{t('common.loading')}</p></div>

  return (
    <div>
      {msg && <div className="adm-msg">{msg}</div>}

      <div className="adm-card">
        <h3 className="adm-card-title">{t('admin.settingsTitle')}</h3>
        {items.length === 0 && <p className="adm-empty">{t('admin.emptySettings')}</p>}
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
        <h3 className="adm-card-title">{t('admin.addSetting')}</h3>
        <div className="adm-grid3">
          <div className="adm-field">
            <label>{t('admin.keyLabel')}</label>
            <input className="form-input" value={addForm.key} onChange={(e) => setAddForm((f) => ({ ...f, key: e.target.value }))} placeholder="min_wage" />
          </div>
          <div className="adm-field">
            <label>{t('admin.labelLabel')}</label>
            <input className="form-input" value={addForm.label} onChange={(e) => setAddForm((f) => ({ ...f, label: e.target.value }))} />
          </div>
          <div className="adm-field">
            <label>{t('admin.valueLabel')}</label>
            <input className="form-input" value={addForm.value} onChange={(e) => setAddForm((f) => ({ ...f, value: e.target.value }))} placeholder="9860" />
          </div>
        </div>
        <button className="adm-btn primary" style={{ marginTop: 12 }} onClick={handleAdd}>{t('admin.add')}</button>
      </div>
    </div>
  )
}

// ── 공지 발송 탭 ────────────────────────────────────────────────
function NoticePanel() {
  const { t } = useTranslation()
  const [message, setMessage] = useState('')
  const [type, setType]       = useState('notice')
  const [sending, setSending] = useState(false)
  const [msg, setMsg]         = useState('')

  const flash = (m) => { setMsg(m); setTimeout(() => setMsg(''), 4000) }

  const handleSend = async () => {
    const txt = message.trim()
    if (!txt) { flash(t('admin.noticeEmpty')); return }
    setSending(true)
    try {
      const userIds = await fetchAllUserIds()
      if (userIds.length === 0) {
        flash(t('admin.noticeNoUsers'))
        setSending(false)
        return
      }
      await sendNotifications(userIds, txt, type)
      flash(t('admin.noticeSent', { count: userIds.length }))
      setMessage('')
    } catch {
      flash(t('admin.noticeSendError'))
    }
    setSending(false)
  }

  return (
    <div>
      {msg && <div className="adm-msg">{msg}</div>}

      <div className="adm-card">
        <h3 className="adm-card-title">{t('admin.noticeTitle')}</h3>

        <div className="adm-field">
          <label>{t('admin.noticeType')}</label>
          <select className="form-input" value={type} onChange={(e) => setType(e.target.value)}>
            <option value="notice">{t('admin.noticeTypeGeneral')}</option>
            <option value="visa_info">{t('admin.noticeTypeVisa')}</option>
            <option value="new_review">{t('admin.noticeTypeReview')}</option>
          </select>
        </div>

        <div className="adm-field">
          <label>{t('admin.noticeContent')}</label>
          <textarea
            className="form-textarea"
            rows={4}
            placeholder={t('admin.noticePlaceholder')}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
        </div>

        <button className="adm-btn primary" onClick={handleSend} disabled={sending}>
          {sending ? t('admin.noticeSending') : t('admin.noticeSend')}
        </button>
      </div>

      <div className="adm-card" style={{ background: '#fffbe6', borderLeft: '4px solid var(--gold)' }}>
        <h3 className="adm-card-title" style={{ fontSize: 13 }}>{t('admin.noticeSetupTitle')}</h3>
        <p style={{ fontSize: 12, color: '#666', lineHeight: 1.7 }}>
          {t('admin.noticeSetupDesc')}<br />
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
  const { t } = useTranslation()
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
      setPwErr(t('admin.wrongPassword'))
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
            {t('admin.loginTitle')}
          </h2>
          <p style={{ textAlign: 'center', fontSize: 13, color: '#888', marginBottom: 20 }}>
            {t('admin.loginSub')}
          </p>
          <input
            className="form-input"
            type="password"
            placeholder={t('admin.password')}
            value={pw}
            onChange={(e) => { setPw(e.target.value); setPwErr('') }}
            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
          />
          {pwErr && <p className="auth-error" style={{ marginTop: 8 }}>{pwErr}</p>}
          <button className="submit-btn" style={{ marginTop: 12 }} onClick={handleLogin}>
            {t('admin.loginBtn')}
          </button>
          <button
            style={{ display: 'block', margin: '16px auto 0', background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: 13 }}
            onClick={() => navigate('/')}
          >
            {t('admin.backHome')}
          </button>
        </div>
      </div>
    )
  }

  // ── 관리 패널 ──
  const TABS = [
    ['guides',   t('admin.tabGuides')],
    ['reviews',  t('admin.tabReviews')],
    ['notice',   t('admin.tabNotice')],
    ['settings', t('admin.tabSettings')],
  ]

  return (
    <div className="adm-page">
      <div className="adm-header">
        <div>
          <div className="adm-header-title">{t('admin.panelTitle')}</div>
          <div className="adm-header-email">{ADMIN_EMAIL}</div>
        </div>
        <button className="adm-btn" onClick={handleLogout}>{t('admin.logout')}</button>
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
