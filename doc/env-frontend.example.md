### Frontend .env example

```
NEXTAUTH_SECRET=replace_with_strong_secret
NEXTAUTH_URL=http://localhost:3000

# OAuth Providers
KAKAO_CLIENT_ID=
KAKAO_CLIENT_SECRET=
NAVER_CLIENT_ID=
NAVER_CLIENT_SECRET=

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
# Optional in chosen arch (server-only access preferred)
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# Server-side only
SUPABASE_SERVICE_ROLE_KEY=
```

Note:
- `SUPABASE_SERVICE_ROLE_KEY`는 서버 라우트에서만 사용하고 브라우저에 노출되지 않도록 합니다.

