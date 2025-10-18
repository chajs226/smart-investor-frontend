"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function MainPage() {
  const router = useRouter();

  const handleLogin = async (provider: "kakao" | "naver") => {
    await signIn(provider, { callbackUrl: "/analyze" });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center text-2xl">메인 페이지</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button className="w-full" variant="outline" onClick={() => handleLogin("naver")}>네이버로 로그인</Button>
          <Button className="w-full" variant="outline" onClick={() => handleLogin("kakao")}>카카오로 로그인</Button>
          <Button className="w-full" onClick={() => router.push("/analyze")}>로그인 없이 이동</Button>
        </CardContent>
      </Card>
    </div>
  );
}