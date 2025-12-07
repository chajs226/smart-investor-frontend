'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { signIn } from 'next-auth/react';
import { Link as LinkIcon, Unlink } from 'lucide-react';

interface Provider {
  id: string;
  provider: string;
  provider_account_id: string;
  created_at: string;
}

export default function LinkedProviders() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [unlinking, setUnlinking] = useState<string | null>(null);

  useEffect(() => {
    fetchProviders();
  }, []);

  const fetchProviders = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/user/providers');
      
      if (!res.ok) {
        throw new Error('Failed to fetch providers');
      }
      
      const data = await res.json();
      setProviders(data.providers || []);
    } catch (error) {
      console.error('Failed to fetch providers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLinkProvider = async (provider: 'kakao' | 'naver') => {
    // 카카오는 사업자 등록 필요로 임시 비활성화
    if (provider === 'kakao') {
      alert('카카오 로그인은 향후 지원 예정입니다.\n현재는 네이버 로그인을 이용해주세요.');
      return;
    }
    
    try {
      await signIn(provider, { 
        callbackUrl: '/profile',
        redirect: true 
      });
    } catch (error) {
      console.error('Failed to link provider:', error);
      alert('연동에 실패했습니다. 다시 시도해주세요.');
    }
  };

  const handleUnlinkProvider = async (provider: string) => {
    if (providers.length <= 1) {
      alert('최소 1개의 로그인 방법은 유지해야 합니다.');
      return;
    }

    if (!confirm(`${getProviderName(provider)} 연동을 해제하시겠습니까?`)) {
      return;
    }

    try {
      setUnlinking(provider);
      const res = await fetch('/api/user/providers', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to unlink provider');
      }

      // 성공 시 목록 새로고침
      await fetchProviders();
      alert('연동이 해제되었습니다.');
    } catch (error: any) {
      console.error('Failed to unlink provider:', error);
      alert(error.message || '연동 해제에 실패했습니다.');
    } finally {
      setUnlinking(null);
    }
  };

  const getProviderName = (provider: string) => {
    const names: Record<string, string> = {
      kakao: '카카오',
      naver: '네이버',
      google: '구글',
    };
    return names[provider] || provider;
  };

  const getProviderColor = (provider: string) => {
    const colors: Record<string, string> = {
      kakao: 'bg-yellow-400 text-gray-900',
      naver: 'bg-green-500 text-white',
      google: 'bg-red-500 text-white',
    };
    return colors[provider] || 'bg-gray-500 text-white';
  };

  const availableProviders = ['kakao', 'naver'];
  const linkedProviderNames = providers.map(p => p.provider);
  const unlinkableProviders = availableProviders.filter(p => !linkedProviderNames.includes(p));

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LinkIcon className="w-5 h-5" />
            연동된 로그인 방법
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <LinkIcon className="w-5 h-5" />
          연동된 로그인 방법
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 연동된 provider 목록 */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-gray-700">현재 연동됨</h3>
          {providers.length === 0 ? (
            <p className="text-sm text-gray-500">연동된 로그인 방법이 없습니다.</p>
          ) : (
            <div className="space-y-2">
              {providers.map((provider) => (
                <div
                  key={provider.id}
                  className="flex items-center justify-between p-3 border rounded-lg bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`px-3 py-1 rounded-md text-sm font-medium ${getProviderColor(
                        provider.provider
                      )}`}
                    >
                      {getProviderName(provider.provider)}
                    </div>
                    <div className="text-sm text-gray-600">
                      연동일: {new Date(provider.created_at).toLocaleDateString('ko-KR')}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleUnlinkProvider(provider.provider)}
                    disabled={providers.length <= 1 || unlinking === provider.provider}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    {unlinking === provider.provider ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                    ) : (
                      <>
                        <Unlink className="w-4 h-4 mr-1" />
                        해제
                      </>
                    )}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 추가 가능한 provider 목록 */}
        {unlinkableProviders.length > 0 && (
          <div className="space-y-2 pt-4 border-t">
            <h3 className="text-sm font-semibold text-gray-700">추가 가능한 로그인 방법</h3>
            <div className="space-y-2">
              {unlinkableProviders.map((provider) => (
                <div
                  key={provider}
                  className={`flex items-center justify-between p-3 border rounded-lg ${
                    provider === 'kakao' ? 'opacity-50 bg-gray-50' : ''
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={`px-3 py-1 rounded-md text-sm font-medium ${getProviderColor(
                        provider
                      )}`}
                    >
                      {getProviderName(provider)}
                    </div>
                    {provider === 'kakao' && (
                      <span className="text-xs text-gray-500">(준비중)</span>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleLinkProvider(provider as 'kakao' | 'naver')}
                    className="text-blue-600 hover:text-blue-700"
                    disabled={provider === 'kakao'}
                  >
                    <LinkIcon className="w-4 h-4 mr-1" />
                    연동하기
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="text-xs text-gray-500 pt-2">
          💡 여러 로그인 방법을 연동하면 더욱 편리하게 서비스를 이용할 수 있습니다.
        </div>
      </CardContent>
    </Card>
  );
}
