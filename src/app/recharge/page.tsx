'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CreditCard, CheckCircle2, Zap } from 'lucide-react';
import { loadPaymentWidget, PaymentWidgetInstance } from '@tosspayments/payment-widget-sdk';

interface Plan {
  id: string;
  name: string;
  count: number;
  price: number;
  popular?: boolean;
}

const plans: Plan[] = [
  {
    id: 'plan-20',
    name: '스타터 플랜',
    count: 20,
    price: 500,
  },
  {
    id: 'plan-50',
    name: '프리미엄 플랜',
    count: 50,
    price: 1000,
    popular: true,
  },
];

export default function RechargePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const paymentWidgetRef = useRef<PaymentWidgetInstance | null>(null);
  const paymentMethodsWidgetRef = useRef<ReturnType<PaymentWidgetInstance['renderPaymentMethods']> | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
    }
  }, [status, router]);

  useEffect(() => {
    const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY;
    
    if (!clientKey) {
      setError('현재 베타 버전으로 충전 기능이 추가될 예정입니다.\n서비스를 더 이용하고 싶으시면 chajs226@gmail.com으로 문의해주세요.');
      return;
    }

    const initializePaymentWidget = async () => {
      try {
        const paymentWidget = await loadPaymentWidget(
          clientKey,
          session?.user?.email || 'ANONYMOUS'
        );
        paymentWidgetRef.current = paymentWidget;
      } catch (err) {
        console.error('Failed to load payment widget:', err);
        setError('결제 위젯을 불러오는데 실패했습니다.');
      }
    };

    if (session?.user?.email) {
      initializePaymentWidget();
    }
  }, [session?.user?.email]);

  useEffect(() => {
    const renderPaymentWidget = async () => {
      if (paymentWidgetRef.current && selectedPlan) {
        try {
          // 기존 위젯이 있다면 제거
          if (paymentMethodsWidgetRef.current) {
            paymentMethodsWidgetRef.current = null;
          }

          const paymentMethodsWidget = paymentWidgetRef.current.renderPaymentMethods(
            '#payment-widget',
            { value: selectedPlan.price },
            { variantKey: 'DEFAULT' }
          );

          paymentMethodsWidgetRef.current = paymentMethodsWidget;
        } catch (err) {
          console.error('Failed to render payment methods:', err);
        }
      }
    };

    renderPaymentWidget();
  }, [selectedPlan]);

  const handlePlanSelect = (plan: Plan) => {
    setSelectedPlan(plan);
    setError(null);
  };

  const handlePayment = async () => {
    if (!selectedPlan || !paymentWidgetRef.current || !session?.user?.email) {
      setError('결제 정보가 올바르지 않습니다.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // 고유한 주문 ID 생성
      const orderId = `ORDER_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const orderName = `${selectedPlan.name} (${selectedPlan.count}회)`;

      await paymentWidgetRef.current.requestPayment({
        orderId,
        orderName,
        successUrl: `${window.location.origin}/recharge/success`,
        failUrl: `${window.location.origin}/recharge/fail`,
        customerEmail: session.user.email,
        customerName: session.user.name || session.user.email,
      });
    } catch (err: any) {
      console.error('Payment request failed:', err);
      setError(err.message || '결제 요청에 실패했습니다.');
      setIsLoading(false);
    }
  };

  if (status === 'loading') {
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

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            분석가능횟수 충전
          </h1>
          <p className="text-gray-600">
            플랜을 선택하고 결제를 진행하세요
          </p>
        </div>

        {/* 에러 메시지 */}
        {error && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <p className="text-red-800 text-center whitespace-pre-line">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* 플랜 선택 */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {plans.map((plan) => (
            <Card
              key={plan.id}
              className={`cursor-pointer transition-all hover:shadow-lg ${
                selectedPlan?.id === plan.id
                  ? 'ring-2 ring-blue-600 border-blue-600'
                  : 'border-gray-200'
              } ${plan.popular ? 'relative' : ''}`}
              onClick={() => handlePlanSelect(plan)}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg">
                    <Zap className="h-3 w-3 mr-1" />
                    인기
                  </span>
                </div>
              )}
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="text-xl">{plan.name}</span>
                  {selectedPlan?.id === plan.id && (
                    <CheckCircle2 className="h-6 w-6 text-blue-600" />
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center py-4">
                  <div className="text-4xl font-bold text-gray-900 mb-2">
                    {plan.count}회
                  </div>
                  <div className="text-sm text-gray-600">분석 가능</div>
                </div>
                <div className="pt-4 border-t border-gray-200">
                  <div className="flex items-end justify-center gap-1">
                    <span className="text-3xl font-bold text-blue-600">
                      {plan.price.toLocaleString()}
                    </span>
                    <span className="text-lg text-gray-600 mb-1">원</span>
                  </div>
                  <div className="text-center text-sm text-gray-500 mt-2">
                    회당 {Math.round(plan.price / plan.count)}원
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* 결제 위젯 */}
        {selectedPlan && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                결제 수단 선택
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div id="payment-widget" className="w-full"></div>
              <Button
                onClick={handlePayment}
                disabled={isLoading}
                className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-lg py-6"
                size="lg"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    결제 처리 중...
                  </>
                ) : (
                  <>
                    <CreditCard className="h-5 w-5 mr-2" />
                    {selectedPlan.price.toLocaleString()}원 결제하기
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* 안내 사항 */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <h3 className="font-semibold text-gray-900 mb-3">💡 안내 사항</h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li>• 결제 후 즉시 분석 횟수가 충전됩니다.</li>
              <li>• 충전된 횟수는 사용 기한이 없습니다.</li>
              <li>• 결제 관련 문의는 고객센터로 연락주세요.</li>
              <li>• 환불 정책은 이용약관을 참고해주세요.</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
