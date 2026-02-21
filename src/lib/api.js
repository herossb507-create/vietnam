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
 *   info        text NOT NULL,     -- 예: '공장 • Gyeonggi-do • 2년'
 *   stars       int NOT NULL CHECK (stars BETWEEN 1 AND 5),
 *   review_text text NOT NULL,
 *   tags        text[] DEFAULT '{}',
 *   created_at  timestamptz DEFAULT now()
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
