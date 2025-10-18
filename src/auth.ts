import NextAuth from "next-auth";
import KakaoProvider from "next-auth/providers/kakao";
import NaverProvider from "next-auth/providers/naver";

export const authOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: "jwt" as const },
  providers: [
    KakaoProvider({
      clientId: process.env.KAKAO_CLIENT_ID || "",
      clientSecret: process.env.KAKAO_CLIENT_SECRET || "",
    }),
    NaverProvider({
      clientId: process.env.NAVER_CLIENT_ID || "",
      clientSecret: process.env.NAVER_CLIENT_SECRET || "",
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile }: any) {
      if (account) {
        (token as any).provider = account.provider;
        (token as any).providerAccountId = account.providerAccountId;
      }
      if (profile && typeof profile === "object") {
        const anyProfile = profile as Record<string, unknown>;
        if (typeof anyProfile["id"] === "string") {
          (token as any).profileId = anyProfile["id"] as string;
        }
      }
      return token;
    },
    async session({ session, token }: any) {
      (session as any).provider = (token as any).provider;
      (session as any).providerAccountId = (token as any).providerAccountId;
      return session;
    },
  },
} satisfies Parameters<typeof NextAuth>[0];

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };


