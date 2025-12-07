# 카카오 로그인 임시 비활성화 안내

## 📋 개요

카카오 로그인 기능을 임시로 비활성화했습니다. 사업자 등록 후 향후 다시 활성화할 예정입니다.

## 🚫 비활성화 내용

### 1. 메인 페이지 (`src/app/page.tsx`)
- 카카오 로그인 버튼 클릭 시 안내 메시지 표시
- 버튼 스타일을 `opacity-50`으로 설정하여 비활성화 상태 표시
- 버튼 텍스트에 "(준비중)" 추가

```typescript
const handleLogin = async (provider: "kakao" | "naver") => {
  // 카카오는 사업자 등록 필요로 임시 비활성화
  if (provider === "kakao") {
    alert("카카오 로그인은 향후 지원 예정입니다.\n현재는 네이버 로그인을 이용해주세요.");
    return;
  }
  await signIn(provider, { callbackUrl: "/analyze" });
};
```

### 2. LinkedProviders 컴포넌트 (`src/components/LinkedProviders.tsx`)
- 카카오 연동 버튼 비활성화
- "(준비중)" 표시 추가
- 클릭 시 안내 메시지 표시

```typescript
const handleLinkProvider = async (provider: 'kakao' | 'naver') => {
  // 카카오는 사업자 등록 필요로 임시 비활성화
  if (provider === 'kakao') {
    alert('카카오 로그인은 향후 지원 예정입니다.\n현재는 네이버 로그인을 이용해주세요.');
    return;
  }
  // ... 연동 로직
};
```

### 3. 환경 변수 설정 (선택사항)
`.env.local` 파일에서 카카오 관련 환경변수를 주석처리할 수 있습니다:

```bash
# 카카오 OAuth (임시 비활성화)
# KAKAO_CLIENT_ID=your_client_id
# KAKAO_CLIENT_SECRET=your_client_secret

# 네이버 OAuth
NAVER_CLIENT_ID=your_naver_client_id
NAVER_CLIENT_SECRET=your_naver_client_secret
```

환경변수를 주석처리하면 카카오 provider 자체가 NextAuth에 등록되지 않습니다.

## 🔄 향후 재활성화 방법

사업자 등록 완료 후 카카오 로그인을 다시 활성화하려면:

### 1. 코드 수정

**`src/app/page.tsx`**
```typescript
const handleLogin = async (provider: "kakao" | "naver") => {
  // 이 부분 제거
  // if (provider === "kakao") {
  //   alert("카카오 로그인은 향후 지원 예정입니다.\n현재는 네이버 로그인을 이용해주세요.");
  //   return;
  // }
  await signIn(provider, { callbackUrl: "/analyze" });
};
```

버튼 스타일도 원복:
```tsx
<Button className="w-full" variant="outline" onClick={() => handleLogin("kakao")}>
  카카오로 로그인
</Button>
```

**`src/components/LinkedProviders.tsx`**
```typescript
const handleLinkProvider = async (provider: 'kakao' | 'naver') => {
  // 이 부분 제거
  // if (provider === 'kakao') {
  //   alert('카카오 로그인은 향후 지원 예정입니다.\n현재는 네이버 로그인을 이용해주세요.');
  //   return;
  // }
  
  try {
    await signIn(provider, { callbackUrl: '/profile', redirect: true });
  } catch (error) {
    console.error('Failed to link provider:', error);
    alert('연동에 실패했습니다. 다시 시도해주세요.');
  }
};
```

버튼 부분도 원복:
```tsx
<Button
  variant="outline"
  size="sm"
  onClick={() => handleLinkProvider(provider as 'kakao' | 'naver')}
  className="text-blue-600 hover:text-blue-700"
  // disabled 제거
>
  <LinkIcon className="w-4 h-4 mr-1" />
  연동하기
</Button>
```

### 2. 환경 변수 활성화

`.env.local`에서 주석 해제:
```bash
# 카카오 OAuth
KAKAO_CLIENT_ID=your_client_id
KAKAO_CLIENT_SECRET=your_client_secret
```

### 3. 카카오 개발자 콘솔 설정

1. [카카오 개발자 콘솔](https://developers.kakao.com/) 접속
2. 애플리케이션 선택
3. **비즈 앱 전환** 필요 (사업자 등록증 필요)
4. Redirect URI 설정:
   - 개발: `http://localhost:3000/api/auth/callback/kakao`
   - 운영: `https://your-domain.com/api/auth/callback/kakao`
5. 동의 항목 설정 (이메일 필수 동의)

## 📝 사용자 안내 메시지

현재 사용자에게 표시되는 메시지:
```
카카오 로그인은 향후 지원 예정입니다.
현재는 네이버 로그인을 이용해주세요.
```

## ⚠️ 주의사항

1. **기존 카카오 사용자**: 이미 카카오로 가입한 사용자는 데이터베이스에 그대로 남아있습니다. 재활성화 시 정상적으로 로그인 가능합니다.

2. **다중 Provider 지원**: 한 사용자가 네이버와 카카오 둘 다 연동 가능하도록 이미 구현되어 있으므로, 재활성화 시 추가 작업 없이 바로 사용 가능합니다.

3. **데이터베이스**: `user_providers` 테이블에 카카오 연동 정보가 저장되어 있으므로 삭제하지 마세요.

## 🎯 현재 이용 가능한 기능

- ✅ 네이버 로그인
- ✅ 로그인 없이 서비스 이용 (분석 횟수 제한 없음)
- ✅ 프로필 관리 (네이버 로그인 시)
- ✅ 분석 이력 조회 (네이버 로그인 시)
- ❌ 카카오 로그인 (임시 비활성화)
