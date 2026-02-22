-- ============================================================
-- KoViet Guide – Full Text Search 인덱스 설정
-- Supabase Dashboard > SQL Editor 에서 실행하세요.
-- ============================================================

-- ──────────────────────────────────────────────────────────
-- 1. guides 테이블 FTS
--    'simple' config: 한국어 · 베트남어 모두 지원
--    (PostgreSQL 내장 언어팩이 없어 simple이 최적)
-- ──────────────────────────────────────────────────────────
ALTER TABLE guides
  ADD COLUMN IF NOT EXISTS fts tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('simple', coalesce(title,       '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(description, '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(badge,       '')), 'C') ||
    setweight(to_tsvector('simple', coalesce(modal_id,    '')), 'D')
  ) STORED;

CREATE INDEX IF NOT EXISTS guides_fts_idx ON guides USING gin(fts);

-- ──────────────────────────────────────────────────────────
-- 2. reviews 테이블 FTS
-- ──────────────────────────────────────────────────────────
ALTER TABLE reviews
  ADD COLUMN IF NOT EXISTS fts tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('simple', coalesce(name,        '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(review_text, '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(info,        '')), 'C')
  ) STORED;

CREATE INDEX IF NOT EXISTS reviews_fts_idx ON reviews USING gin(fts);

-- ──────────────────────────────────────────────────────────
-- 3. (선택) Supabase RPC – 두 테이블 동시 검색 함수
--    앱에서 직접 ilike / textSearch 를 사용하므로 필수 아님
-- ──────────────────────────────────────────────────────────
-- CREATE OR REPLACE FUNCTION search_all(query text)
-- RETURNS TABLE (type text, id int, title text, snippet text) AS $$
-- BEGIN
--   RETURN QUERY
--     SELECT 'guide'::text, g.id, g.title, left(g.description, 80)
--       FROM guides g WHERE g.fts @@ websearch_to_tsquery('simple', query)
--   UNION ALL
--     SELECT 'review'::text, NULL, r.name, left(r.review_text, 80)
--       FROM reviews r WHERE r.fts @@ websearch_to_tsquery('simple', query);
-- END;
-- $$ LANGUAGE plpgsql;
