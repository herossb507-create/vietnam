-- ══════════════════════════════════════════════════════════════════
-- work_logs 테이블 (출퇴근 기록)
-- Supabase SQL Editor에서 실행하세요
-- ══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS work_logs (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  clock_in   timestamptz NOT NULL,
  clock_out  timestamptz,
  created_at timestamptz DEFAULT now()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_work_logs_user_clockin
  ON work_logs(user_id, clock_in DESC);

-- RLS 활성화
ALTER TABLE work_logs ENABLE ROW LEVEL SECURITY;

-- RLS 정책: 본인 데이터만 CRUD
CREATE POLICY "work_logs_select" ON work_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "work_logs_insert" ON work_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "work_logs_update" ON work_logs
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "work_logs_delete" ON work_logs
  FOR DELETE USING (auth.uid() = user_id);
