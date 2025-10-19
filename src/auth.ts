import NextAuth from "next-auth";
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

// NextAuth 설정
export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: "jwt" },
  providers,
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
  },
});

// 라우트 핸들러 export
export { handlers as GET, handlers as POST };


