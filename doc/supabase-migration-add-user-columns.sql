-- ============================================
-- Migration: Add analysis_count and plan columns to users table
-- Date: 2025-10-23
-- Description: 사용자별 분석 가능 횟수 및 플랜 관리 기능 추가
-- ============================================

-- 1. 컬럼 추가
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS analysis_count INTEGER DEFAULT 10,
ADD COLUMN IF NOT EXISTS plan VARCHAR(20) DEFAULT 'free';

-- 2. CHECK 제약조건 추가 (plan 값 제한)
ALTER TABLE users
ADD CONSTRAINT users_plan_check 
CHECK (plan IN ('free', 'paid'));

-- 3. 기존 사용자 데이터 업데이트 (모두 무료 플랜, 10회 제공)
UPDATE users 
SET analysis_count = COALESCE(analysis_count, 10),
    plan = COALESCE(plan, 'free'),
    updated_at = CURRENT_TIMESTAMP
WHERE analysis_count IS NULL OR plan IS NULL;

-- 4. NOT NULL 제약조건 추가
ALTER TABLE users 
ALTER COLUMN analysis_count SET NOT NULL,
ALTER COLUMN plan SET NOT NULL;

-- 5. 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_users_plan ON users(plan);
CREATE INDEX IF NOT EXISTS idx_users_analysis_count ON users(analysis_count);

-- 6. 코멘트 추가
COMMENT ON COLUMN users.analysis_count IS '남은 분석 가능 횟수 (기본값: 10)';
COMMENT ON COLUMN users.plan IS '사용자 플랜 (free: 무료, paid: 유료)';

-- 7. 확인 쿼리
SELECT 
    email, 
    analysis_count, 
    plan,
    created_at,
    last_login_at
FROM users 
ORDER BY created_at DESC 
LIMIT 10;

-- ============================================
-- 완료 후 확인사항:
-- 1. users 테이블에 analysis_count, plan 컬럼 추가 확인
-- 2. 기존 사용자 모두 기본값(10회, free) 설정 확인
-- 3. 인덱스 생성 확인
-- ============================================
