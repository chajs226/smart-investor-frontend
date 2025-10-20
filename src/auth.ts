import { NextAuthOptions } from "next-auth";
import KakaoProvider from "next-auth/providers/kakao";
import NaverProvider from "next-auth/providers/naver";
import { upsertUser } from "./lib/supabase/users";

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
    async jwt({ token, account, profile, user }: any) {
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
      // user 객체에서 이메일 추출
      if (user?.email) {
        token.email = user.email;
      }
      return token;
    },
    async session({ session, token }: any) {
      // 세션에 provider 정보 추가
      session.provider = token.provider;
      session.providerAccountId = token.providerAccountId;
      
      // 세션의 user에 이메일 추가 (Supabase 조회 시 사용)
      if (session.user) {
        session.user.email = token.email || session.user.email;
        // provider와 providerAccountId를 조합하여 고유 식별자로 사용
        session.user.providerId = `${token.provider}:${token.providerAccountId}`;
      }
      
      return session;
    },
    async signIn({ user, account, profile }: any) {
      try {
        console.log("Sign in attempt:", { user, account, profile });
        
        // 이메일 추출 (네이버/카카오 프로필 구조 고려)
        let email = user.email;
        
        // 네이버 프로필 구조
        if (!email && profile?.response?.email) {
          email = profile.response.email;
        }
        
        // 카카오 프로필 구조
        if (!email && profile?.kakao_account?.email) {
          email = profile.kakao_account.email;
        }
        
        if (email && account) {
          console.log("Saving user to Supabase:", {
            email,
            provider: account.provider,
            providerAccountId: account.providerAccountId,
          });
          
          // Supabase에 사용자 정보 저장
          await upsertUser({
            email,
            provider: account.provider,
            provider_account_id: account.providerAccountId,
            name: user.name || user.id,
          });
          
          console.log("User saved to Supabase successfully");
        } else {
          console.warn("Email or account missing, skipping Supabase save");
        }
        
        return true;
      } catch (error) {
        console.error("Failed to save user to Supabase:", error);
        // 에러가 발생해도 로그인은 계속 진행 (Supabase 오류로 로그인 차단 방지)
        return true;
      }
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


