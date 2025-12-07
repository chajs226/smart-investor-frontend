-- ============================================
-- Migration: 여러 OAuth Provider 지원
-- ============================================

-- 1. users 테이블에서 email UNIQUE 제약 제거
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_email_key;

-- 2. user_providers 테이블 생성 (OAuth provider 연동 정보)
CREATE TABLE IF NOT EXISTS user_providers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL, -- 'naver', 'kakao', 'google' 등
    provider_account_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- unique_provider_account 제약조건 추가 (이미 존재하면 무시)
DO $$ 
BEGIN
    -- 테이블이 존재하는 경우에만 제약조건 확인 및 추가
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_name = 'user_providers'
    ) THEN
        IF NOT EXISTS (
            SELECT 1 
            FROM information_schema.table_constraints 
            WHERE constraint_schema = 'public'
            AND constraint_name = 'unique_provider_account' 
            AND table_name = 'user_providers'
        ) THEN
            ALTER TABLE user_providers 
            ADD CONSTRAINT unique_provider_account UNIQUE(provider, provider_account_id);
            RAISE NOTICE 'unique_provider_account 제약조건 추가 완료';
        ELSE
            RAISE NOTICE 'unique_provider_account 제약조건이 이미 존재합니다.';
        END IF;
    END IF;
EXCEPTION
    WHEN duplicate_table THEN
        RAISE NOTICE 'unique_provider_account 제약조건이 이미 존재합니다 (예외 처리).';
    WHEN duplicate_object THEN
        RAISE NOTICE 'unique_provider_account 제약조건이 이미 존재합니다 (예외 처리).';
END $$;

-- user_providers 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_user_providers_user_id ON user_providers(user_id);
CREATE INDEX IF NOT EXISTS idx_user_providers_provider_account ON user_providers(provider, provider_account_id);

-- user_providers 테이블 코멘트
COMMENT ON TABLE user_providers IS 'OAuth provider 연동 정보';
COMMENT ON COLUMN user_providers.id IS 'provider 연동 고유 ID';
COMMENT ON COLUMN user_providers.user_id IS '사용자 고유 ID';
COMMENT ON COLUMN user_providers.provider IS 'OAuth 제공자 (naver, kakao, google 등)';
COMMENT ON COLUMN user_providers.provider_account_id IS 'OAuth 제공자의 사용자 ID';
COMMENT ON COLUMN user_providers.created_at IS 'provider 연동 일시';
COMMENT ON COLUMN user_providers.updated_at IS 'provider 연동 수정 일시';

-- 3. 기존 데이터 마이그레이션
-- users 테이블의 provider, provider_account_id 데이터를 user_providers로 이동 (컬럼이 존재하는 경우만)
DO $$ 
DECLARE
    inserted_count INTEGER := 0;
BEGIN
    -- provider 컬럼이 존재하는지 확인
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public'
        AND table_name = 'users' 
        AND column_name = 'provider'
    ) THEN
        -- UNIQUE 제약조건이 존재하는지 확인
        IF EXISTS (
            SELECT 1 
            FROM information_schema.table_constraints 
            WHERE constraint_schema = 'public'
            AND constraint_name = 'unique_provider_account' 
            AND table_name = 'user_providers'
        ) THEN
            -- UNIQUE 제약조건이 있으면 ON CONFLICT 사용
            INSERT INTO user_providers (user_id, provider, provider_account_id, created_at, updated_at)
            SELECT id, provider, provider_account_id, created_at, updated_at
            FROM users
            WHERE provider IS NOT NULL AND provider_account_id IS NOT NULL
            ON CONFLICT (provider, provider_account_id) DO NOTHING;
        ELSE
            -- UNIQUE 제약조건이 없으면 중복 체크 후 삽입
            INSERT INTO user_providers (user_id, provider, provider_account_id, created_at, updated_at)
            SELECT id, provider, provider_account_id, created_at, updated_at
            FROM users u
            WHERE provider IS NOT NULL 
            AND provider_account_id IS NOT NULL
            AND NOT EXISTS (
                SELECT 1 FROM user_providers up 
                WHERE up.provider = u.provider 
                AND up.provider_account_id = u.provider_account_id
            );
        END IF;
        
        GET DIAGNOSTICS inserted_count = ROW_COUNT;
        RAISE NOTICE '기존 데이터 마이그레이션 완료: % 건', inserted_count;
    ELSE
        RAISE NOTICE 'provider 컬럼이 이미 제거되었거나 존재하지 않습니다. 데이터 마이그레이션 스킵.';
    END IF;
END $$;

-- 4. users 테이블에서 provider, provider_account_id 컬럼 제거
ALTER TABLE users DROP COLUMN IF EXISTS provider;
ALTER TABLE users DROP COLUMN IF EXISTS provider_account_id;
ALTER TABLE users DROP CONSTRAINT IF EXISTS unique_provider_account;

-- 5. email에 인덱스 추가 (UNIQUE 제약은 없음)
CREATE INDEX IF NOT EXISTS idx_users_email_non_unique ON users(email);

-- 6. user_providers 테이블 RLS 활성화
ALTER TABLE user_providers ENABLE ROW LEVEL SECURITY;

-- user_providers: 모든 사용자가 자신의 provider 정보 조회 가능 (이미 존재하면 무시)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'user_providers' 
        AND policyname = 'Users can view own provider data'
    ) THEN
        CREATE POLICY "Users can view own provider data"
            ON user_providers FOR SELECT
            USING (true);
    END IF;
END $$;

-- user_providers: 애플리케이션이 provider 정보 삽입 가능 (이미 존재하면 무시)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'user_providers' 
        AND policyname = 'Anyone can insert provider data'
    ) THEN
        CREATE POLICY "Anyone can insert provider data"
            ON user_providers FOR INSERT
            WITH CHECK (true);
    END IF;
END $$;

-- 7. user_providers 테이블 updated_at 트리거
DROP TRIGGER IF EXISTS update_user_providers_updated_at ON user_providers;
CREATE TRIGGER update_user_providers_updated_at
    BEFORE UPDATE ON user_providers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 사용 예시:
-- 
-- 1. 이메일로 사용자 조회:
-- SELECT * FROM users WHERE email = 'user@example.com';
--
-- 2. 사용자의 연동된 provider 목록 조회:
-- SELECT up.provider, up.provider_account_id, up.created_at
-- FROM user_providers up
-- WHERE up.user_id = '사용자ID';
--
-- 3. provider와 account ID로 사용자 조회:
-- SELECT u.*
-- FROM users u
-- JOIN user_providers up ON u.id = up.user_id
-- WHERE up.provider = 'kakao' AND up.provider_account_id = '12345';
-- ============================================
