# 🚀 Smart Investor - 설정 가이드

## 📋 완료된 작업

### ✅ Phase 1: 사용자 정보 Supabase 연동
1. **Supabase 유틸 함수 생성** (`src/lib/supabase/users.ts`)
   - `upsertUser()` - 사용자 생성/업데이트
   - `getUserByEmail()` - 이메일로 사용자 조회
   - `getUserByProviderAccount()` - Provider 계정으로 조회
   - `updateLastLogin()` - 마지막 로그인 시간 업데이트

2. **NextAuth 콜백 수정** (`src/auth.ts`)
   - `signIn` 콜백에서 Supabase에 사용자 정보 자동 저장
   - 네이버/카카오 프로필 구조 모두 지원
   - 에러 발생 시에도 로그인 차단하지 않도록 처리

3. **JWT/Session 확장**
   - 세션에 이메일 및 provider 정보 추가
   - Supabase 조회를 위한 providerId 추가

### ✅ Phase 2: 분석 결과 Supabase 연동
1. **Supabase 분석 유틸 함수 생성** (`src/lib/supabase/analyses.ts`)
   - `saveAnalysis()` - 분석 결과 저장
   - `getAnalysesByUserId()` - 사용자별 분석 이력 조회
   - `getLatestAnalysisBySymbol()` - 종목별 최신 분석 조회
   - `deleteAnalysis()` - 분석 결과 삭제
   - `getAnalysesByMarket()` - 시장별 분석 조회

2. **분석 이력 API 생성** (`src/app/api/analyses/route.ts`)
   - GET: 사용자의 분석 이력 조회
   - POST: 새로운 분석 결과 저장

3. **데이터베이스 스키마 SQL** (`doc/supabase-schema.sql`)
   - users 테이블
   - stock_analyses 테이블
   - RLS (Row Level Security) 정책
   - 자동 업데이트 트리거

---

## 🔧 필수 설정 단계

### 1. Supabase 프로젝트 설정

#### 1.1 Supabase 대시보드에서 데이터베이스 스키마 실행

1. [Supabase Dashboard](https://app.supabase.com) 접속
2. 프로젝트 선택
3. 좌측 메뉴에서 **SQL Editor** 클릭
4. **New Query** 클릭
5. `doc/supabase-schema.sql` 파일의 내용을 복사하여 붙여넣기
6. **Run** 버튼 클릭하여 스키마 생성

#### 1.2 환경 변수 설정 확인

`.env.development` 파일에 다음 환경 변수가 설정되어 있는지 확인:

```bash
# Supabase 설정
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
```

**환경 변수 값 찾기:**
- Supabase Dashboard → Settings → API
- `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
- `anon public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `service_role` (비밀 유지!) → `SUPABASE_SERVICE_ROLE_KEY`

### 2. 네이버 개발자 센터 설정

1. [네이버 개발자 센터](https://developers.naver.com/apps/) 접속
2. 애플리케이션 선택
3. **API 설정** 탭
4. **Callback URL 등록:**
   ```
   http://localhost:3000/api/auth/callback/naver
   ```
5. **사용 API** 확인:
   - [x] 네이버 로그인
   - [x] 회원프로필 조회

### 3. 테스트

#### 3.1 사용자 저장 테스트
1. `http://localhost:3000` 접속
2. "네이버로 로그인" 클릭
3. 로그인 완료 후 Supabase Dashboard → Table Editor → `users` 테이블 확인
4. 사용자 정보가 저장되었는지 확인

#### 3.2 터미널 로그 확인
로그인 시 다음과 같은 로그가 출력되어야 합니다:
```
Sign in attempt: { user: {...}, account: {...}, profile: {...} }
Saving user to Supabase: { email: 'user@example.com', provider: 'naver', ... }
User saved to Supabase successfully
```

---

## 🎯 다음 단계 (아직 구현되지 않음)

### Phase 2.3: 분석 페이지에 저장 기능 추가
`src/app/analyze/page.tsx`를 수정하여 분석 완료 후 자동으로 Supabase에 저장하는 기능 추가 필요.

예시 코드:
```typescript
import { useSession } from 'next-auth/react';

// 컴포넌트 내부
const { data: session } = useSession();

// 분석 완료 후
const response = await axios.post(`${apiUrl}/api/financial/analyze`, ...);
if (response.data) {
  // 분석 결과 저장
  if (session?.user?.email) {
    await fetch('/api/analyses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        market: marketType, // 'KOSPI', 'KOSDAQ', 'NASDAQ'
        symbol: stockCode,
        name: stockName,
        sector: sector || 'Unknown',
        report: response.data.analysis,
        financial_table: response.data.financial_table,
        compare_periods: response.data.compare_periods,
        model: response.data.model,
        citations: response.data.citations,
      }),
    });
  }
}
```

### Phase 3: 분석 이력 페이지 생성
`src/app/history/page.tsx` 생성하여 사용자의 과거 분석 결과 표시.

---

## 🐛 트러블슈팅

### 문제: "Missing Supabase configuration" 오류
**해결:** `.env.development` 파일에 Supabase 환경 변수가 올바르게 설정되어 있는지 확인

### 문제: 사용자 정보가 Supabase에 저장되지 않음
**해결:** 
1. Supabase 스키마가 올바르게 생성되었는지 확인
2. 터미널 로그에서 에러 메시지 확인
3. Supabase Dashboard → Logs에서 에러 확인

### 문제: RLS 정책 오류
**해결:** 현재는 애플리케이션 레벨에서 인증을 처리하므로 RLS 정책은 `true`로 설정되어 있습니다. 추후 Supabase Auth와 통합 시 수정 필요.

---

## 📚 참고 문서
- [TODO 리스트](./todo-251020.md)
- [요구사항 문서](./requirement-251020-doc.md)
- [Supabase 스키마](./supabase-schema.sql)
- [NextAuth.js 문서](https://next-auth.js.org)
- [Supabase 문서](https://supabase.com/docs)
