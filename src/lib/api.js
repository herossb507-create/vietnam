import { supabase } from './supabase'

/**
 * guides 테이블 스키마 (Supabase에서 생성 필요):
 *
 * CREATE TABLE guides (
 *   id        serial PRIMARY KEY,
 *   step_num  int NOT NULL,
 *   modal_id  text NOT NULL,       -- 'modal-step1' ... 'modal-step6'
 *   title     text NOT NULL,
 *   description text NOT NULL,
 *   badge     text NOT NULL
 * );
 */
export async function fetchGuides() {
  const { data, error } = await supabase
    .from('guides')
    .select('*')
    .order('step_num', { ascending: true })

  if (error) throw error

  // Supabase 컬럼명(snake_case) → 컴포넌트에서 쓰는 필드명으로 정규화
  return data.map((row) => ({
    num:     row.step_num,
    modalId: row.modal_id,
    title:   row.title,
    desc:    row.description,
    badge:   row.badge,
  }))
}

/**
 * reviews 테이블 스키마 (Supabase에서 생성 필요):
 *
 * CREATE TABLE reviews (
 *   id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 *   name        text NOT NULL,
 *   info        text NOT NULL,
 *   stars       int NOT NULL CHECK (stars BETWEEN 1 AND 5),
 *   review_text text NOT NULL,
 *   tags        text[] DEFAULT '{}',
 *   is_approved boolean DEFAULT false,
 *   created_at  timestamptz DEFAULT now()
 * );
 *
 * settings 테이블 스키마:
 *
 * CREATE TABLE settings (
 *   key   text PRIMARY KEY,
 *   value text NOT NULL,
 *   label text NOT NULL
 * );
 */
export async function fetchReviews() {
  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

/**
 * @param {{ name: string, info: string, stars: number, review_text: string, tags: string[] }} review
 */
export async function saveReview(review) {
  const { data, error } = await supabase
    .from('reviews')
    .insert([review])
    .select()
    .single()

  if (error) throw error
  return data
}

// ── Admin: Guides CRUD ──────────────────────────────────────────
export async function fetchGuidesRaw() {
  const { data, error } = await supabase
    .from('guides').select('*').order('step_num')
  if (error) throw error
  return data
}

export async function upsertGuide(guide) {
  const { data, error } = await supabase
    .from('guides').upsert([guide]).select().single()
  if (error) throw error
  return data
}

export async function deleteGuide(id) {
  const { error } = await supabase.from('guides').delete().eq('id', id)
  if (error) throw error
}

// ── Admin: Reviews ──────────────────────────────────────────────
export async function fetchAllReviews() {
  const { data, error } = await supabase
    .from('reviews').select('*').order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function updateReviewApproval(id, isApproved) {
  const { error } = await supabase
    .from('reviews').update({ is_approved: isApproved }).eq('id', id)
  if (error) throw error
}

export async function deleteReview(id) {
  const { error } = await supabase.from('reviews').delete().eq('id', id)
  if (error) throw error
}

// ── Admin: Settings ─────────────────────────────────────────────
export async function fetchSettings() {
  const { data, error } = await supabase
    .from('settings').select('*').order('key')
  if (error) throw error
  return data
}

export async function upsertSetting(key, value, label) {
  const { error } = await supabase
    .from('settings').upsert([{ key, value, label }])
  if (error) throw error
}

// ── Search ───────────────────────────────────────────────────────
// FTS(supabase/search-indexes.sql) 인덱스가 없으면 자동으로 ilike 방식으로 fallback

export async function searchGuides(query) {
  const q = query.trim()
  if (!q) return []

  // 1) FTS: search-indexes.sql 실행 후 사용 가능
  const { data: ftsData, error: ftsError } = await supabase
    .from('guides')
    .select('id, step_num, modal_id, title, description, badge')
    .textSearch('fts', q, { type: 'websearch', config: 'simple' })
    .order('step_num')
    .limit(8)

  if (!ftsError && ftsData?.length > 0) return ftsData

  // 2) fallback: ilike (FTS 인덱스 없어도 동작)
  const { data, error } = await supabase
    .from('guides')
    .select('id, step_num, modal_id, title, description, badge')
    .or(`title.ilike.%${q}%,description.ilike.%${q}%,badge.ilike.%${q}%`)
    .order('step_num')
    .limit(8)

  if (error) return []
  return data ?? []
}

export async function searchReviews(query) {
  const q = query.trim()
  if (!q) return []

  // 1) FTS
  const { data: ftsData, error: ftsError } = await supabase
    .from('reviews')
    .select('id, name, info, stars, review_text, tags')
    .textSearch('fts', q, { type: 'websearch', config: 'simple' })
    .order('created_at', { ascending: false })
    .limit(8)

  if (!ftsError && ftsData?.length > 0) return ftsData

  // 2) fallback: ilike
  const { data, error } = await supabase
    .from('reviews')
    .select('id, name, info, stars, review_text, tags')
    .or(`name.ilike.%${q}%,review_text.ilike.%${q}%,info.ilike.%${q}%`)
    .order('created_at', { ascending: false })
    .limit(8)

  if (error) return []
  return data ?? []
}
