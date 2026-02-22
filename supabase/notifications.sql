-- ─────────────────────────────────────────────────────────
-- notifications 테이블
-- Supabase SQL Editor에서 실행하세요.
-- ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS notifications (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message    text NOT NULL,
  type       text NOT NULL CHECK (type IN ('new_review', 'notice', 'visa_info')),
  is_read    boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- 읽지 않은 알림 빠르게 조회하기 위한 인덱스
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
  ON notifications (user_id, is_read)
  WHERE is_read = false;

-- 시간순 조회 인덱스
CREATE INDEX IF NOT EXISTS idx_notifications_user_created
  ON notifications (user_id, created_at DESC);

-- ─────────────────────────────────────────────────────────
-- Realtime 활성화 (Supabase Dashboard > Database > Replication 에서도 가능)
-- ─────────────────────────────────────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- ─────────────────────────────────────────────────────────
-- RLS (Row Level Security) 정책
-- 사용자는 자신의 알림만 조회/수정 가능
-- ─────────────────────────────────────────────────────────
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- 서비스 역할(admin 등)에서 INSERT 허용
CREATE POLICY "Service can insert notifications"
  ON notifications FOR INSERT
  WITH CHECK (true);

-- ─────────────────────────────────────────────────────────
-- 관리자 공지 발송용 RPC: 모든 유저 ID 목록 반환
-- SECURITY DEFINER로 auth.users 접근 허용
-- ─────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION get_all_user_ids()
RETURNS TABLE(id uuid) AS $$
  SELECT id FROM auth.users;
$$ LANGUAGE sql SECURITY DEFINER;
