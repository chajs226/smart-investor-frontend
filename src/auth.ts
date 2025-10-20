import { NextAuthOptions } from "next-auth";
import KakaoProvider from "next-auth/providers/kakao";
import NaverProvider from "next-auth/providers/naver";

// OAuth 프로바이더를 조건부로 추가 (환경변수가 설정된 경우만)
const providers = [];

if (process.env.KAKAO_CLIENT_ID && process.env.KAKAO_CLIENT_SECRET) {
  providers.push(
    KakaoProvider({
      clientId: process.env.KAKAO_CLIENT_ID,
      clientSecret: process.env.KAKAO_CLIENT_SECRET,
    })
  );
}

if (process.env.NAVER_CLIENT_ID && process.env.NAVER_CLIENT_SECRET) {
  providers.push(
    NaverProvider({
      clientId: process.env.NAVER_CLIENT_ID,
      clientSecret: process.env.NAVER_CLIENT_SECRET,
    })
  );
}

// NextAuth 설정 (v4)
export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: "jwt" },
  providers,
  pages: {
    signIn: "/",
    error: "/", // 에러 발생 시 메인 페이지로 리다이렉트
  },
  debug: process.env.NODE_ENV === "development", // 개발 환경에서 디버그 모드 활성화
  callbacks: {
    async jwt({ token, account, profile }: any) {
      if (account) {
        token.provider = account.provider;
        token.providerAccountId = account.providerAccountId;
      }
      if (profile && typeof profile === "object") {
        const anyProfile = profile as Record<string, unknown>;
        if (typeof anyProfile["id"] === "string") {
          token.profileId = anyProfile["id"] as string;
        }
      }
      return token;
    },
    async session({ session, token }: any) {
      session.provider = token.provider;
      session.providerAccountId = token.providerAccountId;
      return session;
    },
    async signIn({ user, account, profile }: any) {
      // 로그인 성공 여부 확인
      console.log("Sign in attempt:", { user, account, profile });
      return true;
    },
    async redirect({ url, baseUrl }: any) {
      // 리다이렉트 URL 로깅
      console.log("Redirect:", { url, baseUrl });
      
      // callbackUrl이 /analyze인 경우 우선 처리
      if (url === "/analyze" || url === `${baseUrl}/analyze`) {
        return `${baseUrl}/analyze`;
      }
      
      // 상대 경로인 경우 baseUrl 사용
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      
      // 동일 origin인 경우 허용
      try {
        if (new URL(url).origin === baseUrl) return url;
      } catch {
        // URL 파싱 실패 시 기본 페이지로
      }
      
      // 기본값: /analyze로 리다이렉트
      return `${baseUrl}/analyze`;
    },
  },
};


