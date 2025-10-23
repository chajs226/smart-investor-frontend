'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User, CreditCard, BarChart3 } from 'lucide-react';

interface UserProfile {
  email: string;
  name: string | null;
  analysis_count: number;
  plan: string;
}

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [userInfo, setUserInfo] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user?.email) {
      fetchUserInfo();
    }
  }, [session]);

  const fetchUserInfo = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/user/profile');
      
      if (!res.ok) {
        throw new Error('Failed to fetch user profile');
      }
      
      const data = await res.json();
      setUserInfo(data.user);
    } catch (error: any) {
      console.error('Failed to fetch user info:', error);
      setError(error.message || '사용자 정보를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return null;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <p className="text-red-600 text-center">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <User className="h-6 w-6" />
              내정보
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 이메일 */}
            <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
              <User className="h-5 w-5 text-gray-600 mt-1" />
              <div className="flex-1">
                <label className="text-sm font-semibold text-gray-700 block mb-1">
                  이메일
                </label>
                <p className="text-gray-900">{userInfo?.email || '-'}</p>
              </div>
            </div>

            {/* 이름 (선택사항) */}
            {userInfo?.name && (
              <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                <User className="h-5 w-5 text-gray-600 mt-1" />
                <div className="flex-1">
                  <label className="text-sm font-semibold text-gray-700 block mb-1">
                    이름
                  </label>
                  <p className="text-gray-900">{userInfo.name}</p>
                </div>
              </div>
            )}

            {/* 분석가능 횟수 */}
            <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <BarChart3 className="h-5 w-5 text-blue-600 mt-1" />
              <div className="flex-1">
                <label className="text-sm font-semibold text-gray-700 block mb-1">
                  분석가능 횟수
                </label>
                <p className="text-2xl font-bold text-blue-600">
                  {userInfo?.analysis_count ?? 0}회
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  남은 분석 가능 횟수입니다.
                </p>
              </div>
            </div>

            {/* 플랜 */}
            <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
              <CreditCard className="h-5 w-5 text-gray-600 mt-1" />
              <div className="flex-1">
                <label className="text-sm font-semibold text-gray-700 block mb-1">
                  플랜
                </label>
                <p className="text-gray-900">
                  {userInfo?.plan === 'paid' ? (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                      유료
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-200 text-gray-800">
                      무료
                    </span>
                  )}
                </p>
                {userInfo?.plan === 'free' && (
                  <p className="text-sm text-gray-600 mt-2">
                    유료 플랜으로 업그레이드하여 더 많은 분석을 이용하세요.
                  </p>
                )}
              </div>
            </div>

            {/* 안내 메시지 */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-sm text-amber-800">
                💡 분석 횟수가 부족하시면 관리자에게 문의하세요.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
