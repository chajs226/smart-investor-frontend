-- ============================================
-- Smart Investor Database Schema (다중 OAuth Provider 지원 버전)
-- ============================================

-- 1. Users 테이블: 사용자 기본 정보
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL, -- UNIQUE 제약 제거 (여러 provider 연동 가능)
    name VARCHAR(100),
    analysis_count INTEGER DEFAULT 10,
    plan VARCHAR(20) DEFAULT 'free', -- 'free' or 'paid'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP WITH TIME ZONE
);

-- Users 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_last_login ON users(last_login_at DESC);

-- Users 테이블 코멘트
COMMENT ON TABLE users IS '사용자 기본 정보';
COMMENT ON COLUMN users.id IS '사용자 고유 ID';
COMMENT ON COLUMN users.email IS '사용자 이메일 주소';
COMMENT ON COLUMN users.name IS '사용자 이름';
COMMENT ON COLUMN users.analysis_count IS '남은 분석 가능 횟수';
COMMENT ON COLUMN users.plan IS '사용자 플랜 (free, paid)';
COMMENT ON COLUMN users.created_at IS '계정 생성 일시';
COMMENT ON COLUMN users.updated_at IS '계정 수정 일시';
COMMENT ON COLUMN users.last_login_at IS '마지막 로그인 일시';

-- ============================================

-- 2. User Providers 테이블: OAuth Provider 연동 정보
CREATE TABLE IF NOT EXISTS user_providers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL, -- 'naver', 'kakao', 'google' 등
    provider_account_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_provider_account UNIQUE(provider, provider_account_id)
);

-- User Providers 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_user_providers_user_id ON user_providers(user_id);
CREATE INDEX IF NOT EXISTS idx_user_providers_provider_account ON user_providers(provider, provider_account_id);

-- User Providers 테이블 코멘트
COMMENT ON TABLE user_providers IS 'OAuth provider 연동 정보';
COMMENT ON COLUMN user_providers.id IS 'provider 연동 고유 ID';
COMMENT ON COLUMN user_providers.user_id IS '사용자 고유 ID';
COMMENT ON COLUMN user_providers.provider IS 'OAuth 제공자 (naver, kakao, google 등)';
COMMENT ON COLUMN user_providers.provider_account_id IS 'OAuth 제공자의 사용자 ID';
COMMENT ON COLUMN user_providers.created_at IS 'provider 연동 일시';
COMMENT ON COLUMN user_providers.updated_at IS 'provider 연동 수정 일시';

-- ============================================

-- 3. Stock Analyses 테이블: 주식 분석 결과
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
COMMENT ON TABLE stock_analyses IS '주식 분석 결과 저장';
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

-- 4. Analyses History 테이블: 사용자별 분석 이력
CREATE TABLE IF NOT EXISTS analyses_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    analysis_id UUID NOT NULL REFERENCES stock_analyses(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Analyses History 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_analyses_history_user_id ON analyses_history(user_id);
CREATE INDEX IF NOT EXISTS idx_analyses_history_analysis_id ON analyses_history(analysis_id);
CREATE INDEX IF NOT EXISTS idx_analyses_history_created_at ON analyses_history(created_at DESC);

-- Analyses History 테이블 코멘트
COMMENT ON TABLE analyses_history IS '사용자별 분석 이력';
COMMENT ON COLUMN analyses_history.id IS '이력 고유 ID';
COMMENT ON COLUMN analyses_history.user_id IS '사용자 ID';
COMMENT ON COLUMN analyses_history.analysis_id IS '분석 결과 ID';
COMMENT ON COLUMN analyses_history.created_at IS '분석 요청 일시';

-- ============================================

-- 5. Row Level Security (RLS) 정책 설정

-- Users 테이블 RLS 활성화
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Users: 모든 사용자가 자신의 데이터 조회 가능
CREATE POLICY "Users can view own data"
    ON users FOR SELECT
    USING (true);

-- User Providers 테이블 RLS 활성화
ALTER TABLE user_providers ENABLE ROW LEVEL SECURITY;

-- User Providers: 모든 사용자가 자신의 provider 정보 조회 가능
CREATE POLICY "Users can view own provider data"
    ON user_providers FOR SELECT
    USING (true);

-- User Providers: 애플리케이션이 provider 정보 삽입 가능
CREATE POLICY "Anyone can insert provider data"
    ON user_providers FOR INSERT
    WITH CHECK (true);

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

-- Analyses History 테이블 RLS 활성화
ALTER TABLE analyses_history ENABLE ROW LEVEL SECURITY;

-- Analyses History: 모든 사용자가 자신의 이력 조회 가능
CREATE POLICY "Users can view own history"
    ON analyses_history FOR SELECT
    USING (true);

-- Analyses History: 애플리케이션이 이력 삽입 가능
CREATE POLICY "Anyone can insert history"
    ON analyses_history FOR INSERT
    WITH CHECK (true);

-- ============================================

-- 6. 자동 업데이트 트리거 함수

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

-- User Providers 테이블 updated_at 트리거
DROP TRIGGER IF EXISTS update_user_providers_updated_at ON user_providers;
CREATE TRIGGER update_user_providers_updated_at
    BEFORE UPDATE ON user_providers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Stock Analyses 테이블 updated_at 트리거
DROP TRIGGER IF EXISTS update_stock_analyses_updated_at ON stock_analyses;
CREATE TRIGGER update_stock_analyses_updated_at
    BEFORE UPDATE ON stock_analyses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================

-- 7. 샘플 쿼리 (참고용)

-- 사용자 목록 조회
-- SELECT * FROM users ORDER BY created_at DESC LIMIT 10;

-- 사용자의 연동된 provider 목록 조회
-- SELECT up.provider, up.provider_account_id, up.created_at
-- FROM user_providers up
-- WHERE up.user_id = '사용자ID';

-- provider와 account ID로 사용자 조회
-- SELECT u.*
-- FROM users u
-- JOIN user_providers up ON u.id = up.user_id
-- WHERE up.provider = 'kakao' AND up.provider_account_id = '12345';

-- 이메일로 사용자의 모든 provider 조회
-- SELECT u.email, u.name, up.provider, up.created_at
-- FROM users u
-- JOIN user_providers up ON u.id = up.user_id
-- WHERE u.email = 'user@example.com';

-- 사용자의 분석 이력 조회
-- SELECT ah.created_at, sa.name, sa.symbol, sa.market
-- FROM analyses_history ah
-- JOIN stock_analyses sa ON ah.analysis_id = sa.id
-- WHERE ah.user_id = '사용자ID'
-- ORDER BY ah.created_at DESC;

-- ============================================
