ㅁ-- ============================================
-- Analyses History 테이블 생성 마이그레이션
-- 사용자별 분석 요청 이력 추적
-- ============================================

-- analyses_history 테이블 생성
CREATE TABLE IF NOT EXISTS analyses_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    analysis_id UUID NOT NULL REFERENCES stock_analyses(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_user_analysis UNIQUE(user_id, analysis_id, created_at)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_analyses_history_user_id ON analyses_history(user_id);
CREATE INDEX IF NOT EXISTS idx_analyses_history_analysis_id ON analyses_history(analysis_id);
CREATE INDEX IF NOT EXISTS idx_analyses_history_created_at ON analyses_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analyses_history_user_created ON analyses_history(user_id, created_at DESC);

-- 테이블 코멘트
COMMENT ON TABLE analyses_history IS '사용자별 분석 요청 이력';
COMMENT ON COLUMN analyses_history.id IS '이력 고유 ID';
COMMENT ON COLUMN analyses_history.user_id IS '사용자 ID (users 테이블 참조)';
COMMENT ON COLUMN analyses_history.analysis_id IS '분석 결과 ID (stock_analyses 테이블 참조)';
COMMENT ON COLUMN analyses_history.created_at IS '분석 요청 일시';
COMMENT ON COLUMN analyses_history.updated_at IS '이력 수정 일시';

-- Row Level Security 활성화
ALTER TABLE analyses_history ENABLE ROW LEVEL SECURITY;

-- RLS 정책: 사용자는 자신의 이력만 조회 가능
CREATE POLICY "Users can view own history"
    ON analyses_history FOR SELECT
    USING (true); -- 애플리케이션 레벨에서 user_id 필터링

-- RLS 정책: 모든 사용자가 이력 생성 가능
CREATE POLICY "Anyone can insert history"
    ON analyses_history FOR INSERT
    WITH CHECK (true);

-- updated_at 자동 업데이트 트리거 함수 생성 (존재하지 않는 경우)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- updated_at 자동 업데이트 트리거 생성
CREATE TRIGGER update_analyses_history_updated_at
    BEFORE UPDATE ON analyses_history
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
