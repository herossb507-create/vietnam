-- ============================================================
-- KoViet Guide - Supabase 데이터베이스 스키마
-- 사용법: Supabase 대시보드 > SQL Editor 에 붙여넣고 실행
-- ============================================================


-- ============================================================
-- 1. guides (가이드 콘텐츠)
--    비자, 취업 절차 등 관리자가 작성하는 정보성 콘텐츠
-- ============================================================
CREATE TABLE guides (
  id          uuid          DEFAULT gen_random_uuid() PRIMARY KEY,
  -- 고유 ID. uuid는 겹치지 않는 무작위 문자열로 자동 생성됨

  category    text          NOT NULL,
  -- 분류 (예: 'visa' / 'job' / 'contract' / 'insurance')
  -- 화면에서 탭/필터로 구분할 때 사용

  title_ko    text          NOT NULL,
  -- 한국어 제목 (관리자용, 검색용)

  title_vi    text          NOT NULL,
  -- 베트남어 제목 (사용자에게 표시)

  content_ko  text,
  -- 한국어 본문 (관리자 참고용)

  content_vi  text,
  -- 베트남어 본문 (앱에 실제로 표시되는 내용)

  order_num   integer       DEFAULT 0,
  -- 같은 카테고리 안에서 표시 순서 (숫자가 작을수록 위에 표시)

  updated_at  timestamptz   DEFAULT now()
  -- 마지막 수정 시각 (자동 기록). 오래된 정보인지 확인할 때 사용
);

-- updated_at 자동 갱신 트리거 함수
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER guides_updated_at
  BEFORE UPDATE ON guides
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- ============================================================
-- 2. life_info (생활 정보)
--    교통, 주거, 의료 등 한국 생활에 필요한 실용 정보
-- ============================================================
CREATE TABLE life_info (
  id          uuid          DEFAULT gen_random_uuid() PRIMARY KEY,
  -- 고유 ID

  category    text          NOT NULL,
  -- 분류 (예: 'transport' / 'housing' / 'hospital' / 'food')

  title_ko    text          NOT NULL,
  -- 한국어 제목

  title_vi    text          NOT NULL,
  -- 베트남어 제목 (앱에 표시)

  content_ko  text,
  -- 한국어 본문

  content_vi  text,
  -- 베트남어 본문 (앱에 표시)

  updated_at  timestamptz   DEFAULT now()
  -- 마지막 수정 시각
);

CREATE TRIGGER life_info_updated_at
  BEFORE UPDATE ON life_info
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- ============================================================
-- 3. reviews (사용자 후기)
--    베트남 사용자들이 남기는 한국 취업/생활 경험 후기
-- ============================================================
CREATE TABLE reviews (
  id          uuid          DEFAULT gen_random_uuid() PRIMARY KEY,
  -- 고유 ID

  user_name   text          NOT NULL,
  -- 작성자 이름 또는 닉네임 (표시용)

  job_type    text,
  -- 직종 (예: '제조업' / '농업' / '서비스업' / '전문직')
  -- NULL 허용: 취업 전 사용자도 후기 작성 가능

  region      text,
  -- 근무/거주 지역 (예: '서울' / '경기' / '부산')
  -- NULL 허용

  rating      integer       CHECK (rating BETWEEN 1 AND 5),
  -- 별점 1~5. CHECK 제약으로 범위 밖 값은 저장 불가

  content     text          NOT NULL,
  -- 후기 본문 내용

  created_at  timestamptz   DEFAULT now(),
  -- 작성 시각 (자동 기록)

  is_approved boolean       DEFAULT false
  -- 관리자 승인 여부. false = 미승인(숨김), true = 승인(공개)
  -- 스팸/부적절 게시물 필터링용
);


-- ============================================================
-- 4. users (회원)
--    앱에 가입한 사용자 계정 정보
--    Supabase Auth와 연동: auth.users 테이블의 id를 참조
-- ============================================================
CREATE TABLE users (
  id          uuid          PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  -- Supabase 로그인 시스템과 연결된 고유 ID
  -- 회원 탈퇴 시(auth.users에서 삭제) 이 행도 자동 삭제

  email       text          UNIQUE NOT NULL,
  -- 이메일 주소 (로그인 ID). UNIQUE로 중복 가입 방지

  nickname    text,
  -- 앱 내 표시 이름 (베트남어 이름 등 자유 입력)

  status      text          DEFAULT '준비중' CHECK (status IN ('준비중', '거주중')),
  -- 한국 취업/거주 상태
  --   '준비중': 아직 베트남에 있거나 한국행 준비 중
  --   '거주중': 현재 한국에 살고 있음
  -- CHECK 제약으로 이 두 값 외에는 저장 불가

  created_at  timestamptz   DEFAULT now()
  -- 가입 시각 (자동 기록)
);


-- ============================================================
-- 보안 설정 (Row Level Security)
-- Supabase는 기본적으로 모든 테이블이 비공개.
-- 아래 설정으로 "누가 무엇을 볼 수 있는지" 규칙을 정함
-- ============================================================

-- guides: 누구나 읽을 수 있음 (로그인 불필요)
ALTER TABLE guides ENABLE ROW LEVEL SECURITY;
CREATE POLICY "guides_public_read" ON guides
  FOR SELECT USING (true);

-- life_info: 누구나 읽을 수 있음
ALTER TABLE life_info ENABLE ROW LEVEL SECURITY;
CREATE POLICY "life_info_public_read" ON life_info
  FOR SELECT USING (true);

-- reviews: 승인된 후기만 누구나 읽을 수 있음 / 로그인한 사용자는 작성 가능
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reviews_public_read" ON reviews
  FOR SELECT USING (is_approved = true);
CREATE POLICY "reviews_auth_insert" ON reviews
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- users: 본인 정보만 읽고 수정 가능
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_self_read" ON users
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "users_self_update" ON users
  FOR UPDATE USING (auth.uid() = id);
