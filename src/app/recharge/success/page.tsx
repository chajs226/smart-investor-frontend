'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Home, FileText } from 'lucide-react';

function SuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analysisCount, setAnalysisCount] = useState<number | null>(null);

  useEffect(() => {
    const confirmPayment = async () => {
      const paymentKey = searchParams.get('paymentKey');
      const orderId = searchParams.get('orderId');
      const amount = searchParams.get('amount');

      if (!paymentKey || !orderId || !amount) {
        setError('결제 정보가 올바르지 않습니다.');
        setIsProcessing(false);
        return;
      }

      try {
        const response = await fetch('/api/payment/confirm', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            paymentKey,
            orderId,
            amount: parseInt(amount),
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || '결제 승인에 실패했습니다.');
        }

        const data = await response.json();
        setAnalysisCount(data.analysis_count);
        setIsProcessing(false);
      } catch (err: any) {
        console.error('Payment confirmation failed:', err);
        setError(err.message || '결제 승인 처리 중 오류가 발생했습니다.');
        setIsProcessing(false);
      }
    };

    confirmPayment();
  }, [searchParams]);

  if (isProcessing) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold mb-2">결제 승인 처리 중</h2>
          <p className="text-gray-600">잠시만 기다려주세요...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-red-200">
          <CardHeader>
            <CardTitle className="text-center text-red-600">
              결제 승인 실패
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-center text-gray-700">{error}</p>
            <div className="flex gap-3">
              <Button
                onClick={() => router.push('/recharge')}
                variant="outline"
                className="flex-1"
              >
                다시 시도
              </Button>
              <Button
                onClick={() => router.push('/profile')}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                내정보로 이동
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-green-100 p-3">
              <CheckCircle2 className="h-12 w-12 text-green-600" />
            </div>
          </div>
          <CardTitle className="text-center text-2xl text-gray-900">
            결제가 완료되었습니다!
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <p className="text-gray-600 mb-4">
              분석가능 횟수가 충전되었습니다.
            </p>
            {analysisCount !== null && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-gray-700 mb-1">현재 분석가능 횟수</p>
                <p className="text-3xl font-bold text-blue-600">
                  {analysisCount}회
                </p>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <Button
              onClick={() => router.push('/analyze')}
              className="w-full bg-blue-600 hover:bg-blue-700"
              size="lg"
            >
              <FileText className="h-5 w-5 mr-2" />
              분석 시작하기
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
              영수증은 이메일로 발송되었습니다.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600"></div>
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
