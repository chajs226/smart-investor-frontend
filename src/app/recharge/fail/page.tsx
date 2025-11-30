'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { XCircle, Home, RotateCcw } from 'lucide-react';

function FailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const errorCode = searchParams.get('code');
  const errorMessage = searchParams.get('message');

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full border-red-200">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-red-100 p-3">
              <XCircle className="h-12 w-12 text-red-600" />
            </div>
          </div>
          <CardTitle className="text-center text-2xl text-gray-900">
            결제가 실패했습니다
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm font-semibold text-gray-700 mb-2">
              오류 정보
            </p>
            {errorCode && (
              <p className="text-xs text-gray-600 mb-1">
                코드: {errorCode}
              </p>
            )}
            <p className="text-sm text-red-700">
              {errorMessage || '결제 처리 중 오류가 발생했습니다.'}
            </p>
          </div>

          <div className="space-y-3">
            <Button
              onClick={() => router.push('/recharge')}
              className="w-full bg-blue-600 hover:bg-blue-700"
              size="lg"
            >
              <RotateCcw className="h-5 w-5 mr-2" />
              다시 시도하기
            </Button>
            <Button
              onClick={() => router.push('/profile')}
              variant="outline"
              className="w-full"
              size="lg"
            >
              <Home className="h-5 w-5 mr-2" />
              내정보로 이동
            </Button>
          </div>

          <div className="pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              문제가 지속되면 고객센터로 문의해주세요.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function FailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600"></div>
        </div>
      }
    >
      <FailContent />
    </Suspense>
  );
}
