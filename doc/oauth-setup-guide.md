# OAuth 설정 가이드

## 환경 변수 설정 위치

### 개발 환경
**파일**: `.env.development`

```bash
# API 설정
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000

# NextAuth 설정
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here

# Kakao OAuth
KAKAO_CLIENT_ID=your-kakao-client-id
KAKAO_CLIENT_SECRET=your-kakao-client-secret

# Naver OAuth
NAVER_CLIENT_ID=your-naver-client-id
NAVER_CLIENT_SECRET=your-naver-client-secret
```

### 프로덕션 환경
**파일**: `.env.production`

## 설정 방법

### 1. NEXTAUTH_SECRET 생성

터미널에서 다음 명령어로 랜덤 키 생성:

```bash
openssl rand -base64 32
```

또는 온라인 생성기 사용: https://generate-secret.vercel.app/32

### 2. Kakao OAuth 설정

1. **Kakao Developers 접속**: https://developers.kakao.com/
2. **애플리케이션 추가하기** 클릭
3. **앱 이름** 입력 후 저장
4. **앱 설정 > 일반**에서:
   - `REST API 키` 복사 → `KAKAO_CLIENT_ID`
5. **앱 설정 > 보안**에서:
   - `Client Secret` 발급 → `KAKAO_CLIENT_SECRET`
6. **제품 설정 > 카카오 로그인** 활성화:
   - **Redirect URI 설정**:
     - 개발: `http://localhost:3000/api/auth/callback/kakao`
     - 프로덕션: `https://your-domain.com/api/auth/callback/kakao`
7. **동의항목** 설정:
   - 필수: 닉네임, 프로필 이미지 (선택 항목)

### 3. Naver OAuth 설정

1. **Naver Developers 접속**: https://developers.naver.com/apps/
2. **애플리케이션 등록** 클릭
3. **애플리케이션 정보** 입력:
   - 애플리케이션 이름
   - 사용 API: 네이버 로그인
4. **서비스 URL 설정**:
   - 개발: `http://localhost:3000`
   - 프로덕션: `https://your-domain.com`
5. **Callback URL 설정**:
   - 개발: `http://localhost:3000/api/auth/callback/naver`
   - 프로덕션: `https://your-domain.com/api/auth/callback/naver`
6. **제공정보 선택**:
   - 필수: 이메일 주소, 닉네임, 프로필 이미지
7. **등록 완료 후**:
   - `Client ID` 복사 → `NAVER_CLIENT_ID`
   - `Client Secret` 복사 → `NAVER_CLIENT_SECRET`

## 환경 변수 적용

### 개발 서버 재시작 필수!

환경 변수를 추가하거나 변경한 후에는 **반드시 개발 서버를 재시작**해야 합니다:

```bash
# 기존 서버 종료 (Ctrl+C)
# 다시 시작
npm run dev
```

## 문제 해결

### "client_id is required" 오류

**원인**: 환경 변수가 설정되지 않았거나 개발 서버가 재시작되지 않음

**해결 방법**:
1. `.env.development` 파일에 올바른 Client ID/Secret 입력 확인
2. 개발 서버 재시작 (Ctrl+C 후 `npm run dev`)
3. 브라우저 캐시 삭제 후 재접속

### Redirect URI 불일치 오류

**원인**: OAuth 앱 설정의 Redirect URI와 실제 콜백 URL이 다름

**해결 방법**:
- Kakao: `http://localhost:3000/api/auth/callback/kakao`
- Naver: `http://localhost:3000/api/auth/callback/naver`

정확히 일치해야 합니다 (끝에 슬래시 없음)

## 보안 주의사항

⚠️ **절대 GitHub에 커밋하지 마세요!**

- `.env.development`
- `.env.production`
- `.env.local`

이미 `.gitignore`에 포함되어 있으므로 안전합니다.

## 환경별 파일 우선순위

Next.js는 다음 순서로 환경 변수를 로드합니다:

1. `.env.local` (모든 환경, Git 제외)
2. `.env.development` (개발 환경)
3. `.env.production` (프로덕션 환경)
4. `.env` (기본값)

**권장**: 개발 환경은 `.env.development`, 로컬 오버라이드는 `.env.local` 사용
