-- ══════════════════════════════════════════════════════════════════
-- savings_goals 테이블 (저축 목표 관리)
-- Supabase SQL Editor에서 실행하세요
-- ══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS savings_goals (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        text NOT NULL,
  target_vnd  bigint NOT NULL CHECK (target_vnd > 0),
  months      int NOT NULL CHECK (months > 0),
  current_vnd bigint DEFAULT 0,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_savings_goals_user
  ON savings_goals(user_id);

-- RLS 활성화
ALTER TABLE savings_goals ENABLE ROW LEVEL SECURITY;

-- RLS 정책: 본인 데이터만 CRUD
CREATE POLICY "savings_goals_select" ON savings_goals
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "savings_goals_insert" ON savings_goals
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "savings_goals_update" ON savings_goals
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "savings_goals_delete" ON savings_goals
  FOR DELETE USING (auth.uid() = user_id);
