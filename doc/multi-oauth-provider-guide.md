# 다중 OAuth Provider 지원 개선 가이드

## 📋 개요

한 사용자가 여러 OAuth provider(카카오, 네이버 등)로 로그인할 수 있도록 시스템을 개선했습니다.

## 🎯 주요 변경사항

### 1. 데이터베이스 스키마 변경

#### Before (기존)
```sql
-- users 테이블에 provider 정보 포함
CREATE TABLE users (
    id UUID PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,  -- UNIQUE 제약
    provider VARCHAR(50) NOT NULL,
    provider_account_id VARCHAR(255) NOT NULL,
    ...
    CONSTRAINT unique_provider_account UNIQUE(provider, provider_account_id)
);
```

**문제점:**
- `email`에 UNIQUE 제약이 있어 한 이메일로 하나의 provider만 사용 가능
- 같은 이메일로 다른 provider 로그인 시 별도 계정 생성됨

#### After (개선)
```sql
-- users 테이블: 사용자 기본 정보만
CREATE TABLE users (
    id UUID PRIMARY KEY,
    email VARCHAR(255) NOT NULL,  -- UNIQUE 제약 제거
    name VARCHAR(100),
    analysis_count INTEGER DEFAULT 10,
    plan VARCHAR(20) DEFAULT 'free',
    ...
);

-- user_providers 테이블: OAuth 연동 정보 분리
CREATE TABLE user_providers (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL,
    provider_account_id VARCHAR(255) NOT NULL,
    ...
    CONSTRAINT unique_provider_account UNIQUE(provider, provider_account_id)
);
```

**개선점:**
- 한 사용자가 여러 provider 연동 가능
- 같은 이메일로 카카오, 네이버 등 여러 방법으로 로그인 가능
- provider 연동 관리 용이

### 2. 코드 변경

#### `src/lib/supabase/users.ts`

**인터페이스 추가:**
```typescript
export interface User {
  id?: string;
  email: string;
  name?: string;
  analysis_count?: number;
  plan?: 'free' | 'paid';
  created_at?: string;
  updated_at?: string;
  last_login_at?: string;
}

export interface UserProvider {
  id?: string;
  user_id: string;
  provider: string;
  provider_account_id: string;
  created_at?: string;
  updated_at?: string;
}
```

**`upsertUser` 함수 개선:**
```typescript
export async function upsertUser(userData: {
  email: string;
  provider: string;
  provider_account_id: string;
  name?: string;
})
```

**동작 방식:**
1. provider + provider_account_id로 기존 연동 확인
2. 연동이 없으면 이메일로 기존 사용자 확인
3. 사용자가 있으면 새 provider 연동, 없으면 새 사용자 생성
4. last_login_at 업데이트

**새로운 함수 추가:**
```typescript
// 사용자의 모든 provider 조회
export async function getUserProviders(userId: string): Promise<UserProvider[]>

// 특정 provider 연동 해제
export async function unlinkProvider(userId: string, provider: string): Promise<boolean>
```

#### `src/components/LinkedProviders.tsx`

새로운 컴포넌트로 연동된 provider 관리 UI 제공:

**기능:**
- 현재 연동된 provider 목록 표시
- 새로운 provider 연동
- 기존 provider 연동 해제 (최소 1개는 유지)

#### `src/app/api/user/providers/route.ts`

새로운 API 엔드포인트:

**GET `/api/user/providers`**
- 현재 사용자의 연동된 provider 목록 조회

**DELETE `/api/user/providers`**
- 특정 provider 연동 해제

## 🚀 마이그레이션 가이드

### 1. 데이터베이스 마이그레이션

기존 데이터가 있는 경우 다음 마이그레이션 스크립트를 실행하세요:

```bash
# Supabase SQL Editor에서 실행
psql -U postgres -d your_database -f doc/supabase-migration-multi-provider.sql
```

또는 Supabase Dashboard에서 `doc/supabase-migration-multi-provider.sql` 파일의 내용을 복사하여 SQL Editor에서 실행

**마이그레이션 내용:**
1. `users` 테이블의 `email` UNIQUE 제약 제거
2. `user_providers` 테이블 생성
3. 기존 데이터를 `user_providers`로 이동
4. `users` 테이블에서 `provider`, `provider_account_id` 컬럼 제거

### 2. 새 프로젝트 설정

새 프로젝트인 경우 다음 스키마 파일을 사용하세요:

```bash
# Supabase SQL Editor에서 실행
psql -U postgres -d your_database -f doc/supabase-schema-v2.sql
```

## 📱 사용자 경험

### 사용 시나리오

#### 시나리오 1: 신규 사용자
1. 사용자가 카카오로 첫 로그인
2. 새 `users` 레코드 생성
3. `user_providers`에 카카오 연동 정보 저장

#### 시나리오 2: 기존 사용자가 다른 provider 추가
1. 사용자가 카카오로 이미 가입됨
2. 프로필 페이지에서 "네이버 연동하기" 클릭
3. 네이버 OAuth 인증 후 동일 사용자 계정에 네이버 provider 추가
4. 이제 카카오 또는 네이버 둘 다로 로그인 가능

#### 시나리오 3: 같은 이메일로 다른 provider 로그인
1. 사용자가 카카오로 가입 (email: user@example.com)
2. 나중에 네이버로 로그인 시도 (같은 email: user@example.com)
3. 시스템이 자동으로 같은 사용자로 인식
4. 네이버 provider가 기존 계정에 연동됨

#### 시나리오 4: Provider 연동 해제
1. 사용자가 프로필 페이지에서 "카카오 연동 해제" 클릭
2. 최소 1개의 로그인 방법은 유지해야 하므로, 2개 이상인 경우만 해제 가능
3. 해제 후에도 다른 provider로 로그인 가능

## 🔒 보안 고려사항

1. **최소 1개 Provider 유지**: 사용자가 로그인 방법을 완전히 잃지 않도록 최소 1개의 provider는 유지해야 함
2. **이메일 검증**: OAuth provider에서 검증된 이메일만 사용
3. **Provider 간 계정 연동**: 같은 이메일을 사용하는 provider 간 자동 연동

## 🧪 테스트 시나리오

### 1. 다중 Provider 로그인 테스트
```typescript
// 1. 카카오로 로그인
await signIn('kakao');
// user_id: abc-123, email: user@example.com

// 2. 프로필에서 네이버 연동
await signIn('naver');
// 같은 user_id: abc-123에 네이버 provider 추가됨

// 3. 로그아웃 후 네이버로 다시 로그인
await signOut();
await signIn('naver');
// 같은 계정으로 로그인됨 (user_id: abc-123)
```

### 2. Provider 연동 해제 테스트
```typescript
// 1. 연동된 provider 목록 확인
const providers = await fetch('/api/user/providers');
// [{ provider: 'kakao' }, { provider: 'naver' }]

// 2. 카카오 연동 해제
await fetch('/api/user/providers', {
  method: 'DELETE',
  body: JSON.stringify({ provider: 'kakao' })
});

// 3. 다시 목록 확인
const updatedProviders = await fetch('/api/user/providers');
// [{ provider: 'naver' }]
```

## 📚 참고 문서

- `doc/supabase-migration-multi-provider.sql`: 기존 DB 마이그레이션 스크립트
- `doc/supabase-schema-v2.sql`: 새 프로젝트용 완전한 스키마
- `src/lib/supabase/users.ts`: 사용자 관리 함수
- `src/components/LinkedProviders.tsx`: Provider 관리 UI 컴포넌트
- `src/app/api/user/providers/route.ts`: Provider 관리 API

## 🐛 트러블슈팅

### Q: 기존 사용자가 로그인되지 않습니다
**A:** 마이그레이션 스크립트를 실행했는지 확인하세요. `user_providers` 테이블에 기존 사용자의 provider 정보가 있어야 합니다.

### Q: 같은 이메일로 로그인 시 별도 계정이 생성됩니다
**A:** `upsertUser` 함수가 이메일로 기존 사용자를 찾도록 업데이트되었는지 확인하세요.

### Q: Provider 연동 해제가 안 됩니다
**A:** 최소 1개의 provider는 유지해야 합니다. 2개 이상의 provider가 연동되어 있는지 확인하세요.

## 🎉 결론

이제 사용자는 여러 OAuth provider로 로그인할 수 있으며, 더 나은 사용자 경험을 제공합니다. 사용자는 선호하는 로그인 방법을 선택할 수 있으며, 한 계정으로 여러 로그인 방법을 관리할 수 있습니다.
