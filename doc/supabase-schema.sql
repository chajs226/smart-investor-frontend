-- ============================================
-- Smart Investor Database Schema
-- ============================================

-- 1. Users 테이블: 소셜 로그인 사용자 정보
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    provider VARCHAR(50) NOT NULL, -- 'naver' or 'kakao'
    provider_account_id VARCHAR(255) NOT NULL,
    name VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT unique_provider_account UNIQUE(provider, provider_account_id)
);

-- Users 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_provider_account ON users(provider, provider_account_id);
CREATE INDEX IF NOT EXISTS idx_users_last_login ON users(last_login_at DESC);

-- Users 테이블 코멘트
COMMENT ON TABLE users IS '소셜 로그인 사용자 정보';
COMMENT ON COLUMN users.id IS '사용자 고유 ID';
COMMENT ON COLUMN users.email IS '사용자 이메일 주소';
COMMENT ON COLUMN users.provider IS 'OAuth 제공자 (naver, kakao)';
COMMENT ON COLUMN users.provider_account_id IS 'OAuth 제공자의 사용자 ID';
COMMENT ON COLUMN users.name IS '사용자 이름';
COMMENT ON COLUMN users.created_at IS '계정 생성 일시';
COMMENT ON COLUMN users.updated_at IS '계정 수정 일시';
COMMENT ON COLUMN users.last_login_at IS '마지막 로그인 일시';

-- ============================================

-- 2. Stock Analyses 테이블: 주식 분석 결과 (user_id 제거 버전)
CREATE TABLE IF NOT EXISTS stock_analyses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    market VARCHAR(20) NOT NULL, -- 'KOSPI', 'KOSDAQ', 'NASDAQ'
    symbol VARCHAR(20) NOT NULL, -- 주식 티커/코드
    name VARCHAR(100) NOT NULL, -- 기업명
    sector VARCHAR(100), -- 기업 섹터
    report TEXT NOT NULL, -- 분석 결과 리포트 (Markdown)
    financial_table TEXT, -- 재무제표 데이터
    compare_periods TEXT[], -- 비교 기간 배열
    model VARCHAR(50), -- AI 모델명
    citations TEXT[], -- 참고 자료 URL 배열
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Stock Analyses 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_stock_analyses_symbol ON stock_analyses(symbol);
CREATE INDEX IF NOT EXISTS idx_stock_analyses_market ON stock_analyses(market);
CREATE INDEX IF NOT EXISTS idx_stock_analyses_created_at ON stock_analyses(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_stock_analyses_symbol_created ON stock_analyses(symbol, created_at DESC);

-- Stock Analyses 테이블 코멘트
COMMENT ON TABLE stock_analyses IS '주식 분석 결과 저장 (로그인 불필요)';
COMMENT ON COLUMN stock_analyses.id IS '분석 결과 고유 ID';
COMMENT ON COLUMN stock_analyses.market IS '시장 구분 (KOSPI, KOSDAQ, NASDAQ 등)';
COMMENT ON COLUMN stock_analyses.symbol IS '주식 심볼/티커 (예: 005930, AAPL)';
COMMENT ON COLUMN stock_analyses.name IS '기업명';
COMMENT ON COLUMN stock_analyses.sector IS '기업 섹터/업종';
COMMENT ON COLUMN stock_analyses.report IS '분석 결과 리포트 (Markdown 형식)';
COMMENT ON COLUMN stock_analyses.financial_table IS '재무제표 데이터 (Markdown Table)';
COMMENT ON COLUMN stock_analyses.compare_periods IS '비교 기간 배열 (예: [2022, 2023, 2024])';
COMMENT ON COLUMN stock_analyses.model IS '사용된 AI 모델명';
COMMENT ON COLUMN stock_analyses.citations IS '참고 자료 URL 배열';
COMMENT ON COLUMN stock_analyses.created_at IS '분석 결과 생성 일시';
COMMENT ON COLUMN stock_analyses.updated_at IS '분석 결과 수정 일시';

-- ============================================

-- 3. Row Level Security (RLS) 정책 설정

-- Users 테이블 RLS 활성화
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Users: 모든 사용자가 자신의 데이터 조회 가능
CREATE POLICY "Users can view own data"
    ON users FOR SELECT
    USING (true); -- 인증은 애플리케이션 레벨에서 처리

-- Stock Analyses 테이블 RLS 활성화
ALTER TABLE stock_analyses ENABLE ROW LEVEL SECURITY;

-- Stock Analyses: 모든 사용자가 분석 결과 조회 가능
CREATE POLICY "Anyone can view analyses"
    ON stock_analyses FOR SELECT
    USING (true);

-- Stock Analyses: 모든 사용자가 분석 결과 삽입 가능
CREATE POLICY "Anyone can insert analyses"
    ON stock_analyses FOR INSERT
    WITH CHECK (true);

-- Stock Analyses: 모든 사용자가 분석 결과 삭제 가능
CREATE POLICY "Anyone can delete analyses"
    ON stock_analyses FOR DELETE
    USING (true);

-- ============================================

-- 4. 자동 업데이트 트리거 함수

-- updated_at 자동 업데이트 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Users 테이블 updated_at 트리거
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Stock Analyses 테이블 updated_at 트리거
DROP TRIGGER IF EXISTS update_stock_analyses_updated_at ON stock_analyses;
CREATE TRIGGER update_stock_analyses_updated_at
    BEFORE UPDATE ON stock_analyses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================

-- 5. 샘플 쿼리 (참고용)

-- 사용자 목록 조회
-- SELECT * FROM users ORDER BY created_at DESC LIMIT 10;

-- 모든 분석 결과 조회
-- SELECT * FROM stock_analyses ORDER BY created_at DESC LIMIT 20;

-- 특정 종목의 분석 이력 조회
-- SELECT * FROM stock_analyses WHERE symbol = '005930' ORDER BY created_at DESC;

-- 시장별 분석 건수 조회
-- SELECT market, COUNT(*) as count FROM stock_analyses GROUP BY market;

-- ============================================
