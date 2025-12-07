-- ============================================
-- Migration: Remove user_id from stock_analyses
-- Date: 2025-10-21
-- Description: 로그인 없이도 분석 결과를 저장할 수 있도록 user_id 컬럼 제거
-- ============================================

-- 1. 기존 RLS 정책 삭제
DROP POLICY IF EXISTS "Users can view own analyses" ON stock_analyses;
DROP POLICY IF EXISTS "Users can insert own analyses" ON stock_analyses;
DROP POLICY IF EXISTS "Users can delete own analyses" ON stock_analyses;

-- 2. user_id 컬럼의 외래키 제약조건 확인 및 삭제
-- (제약조건 이름이 자동 생성되었을 수 있으므로 확인 후 삭제)
ALTER TABLE stock_analyses 
DROP CONSTRAINT IF EXISTS stock_analyses_user_id_fkey;

-- 3. user_id 인덱스 삭제
DROP INDEX IF EXISTS idx_stock_analyses_user_id;
DROP INDEX IF EXISTS idx_stock_analyses_user_symbol;

-- 4. user_id 컬럼 삭제
ALTER TABLE stock_analyses 
DROP COLUMN IF EXISTS user_id;

-- 5. 새로운 인덱스 추가 (symbol과 created_at 조합)
CREATE INDEX IF NOT EXISTS idx_stock_analyses_symbol_created 
ON stock_analyses(symbol, created_at DESC);

-- 6. 새로운 RLS 정책 설정 (모든 사용자가 읽기/쓰기 가능)
-- RLS는 활성화하되, 모든 접근 허용

-- 모든 사용자가 분석 결과 조회 가능
CREATE POLICY "Anyone can view analyses"
    ON stock_analyses FOR SELECT
    USING (true);

-- 모든 사용자가 분석 결과 삽입 가능
CREATE POLICY "Anyone can insert analyses"
    ON stock_analyses FOR INSERT
    WITH CHECK (true);

-- 모든 사용자가 분석 결과 삭제 가능 (선택사항, 필요시 제거)
CREATE POLICY "Anyone can delete analyses"
    ON stock_analyses FOR DELETE
    USING (true);

-- 7. 테이블 구조 확인
-- \d stock_analyses

-- ============================================
-- 완료 후 확인사항:
-- 1. stock_analyses 테이블에 user_id 컬럼이 없는지 확인
-- 2. RLS 정책이 올바르게 설정되었는지 확인
-- 3. 기존 데이터가 유지되었는지 확인
-- ============================================
