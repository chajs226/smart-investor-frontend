'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { User, CreditCard, BarChart3, FileText, Calendar, Building2 } from 'lucide-react';

interface UserProfile {
  email: string;
  name: string | null;
  analysis_count: number;
  plan: string;
}

interface AnalysisHistoryItem {
  id: string;
  created_at: string;
  stock_analyses: {
    id: string;
    market: string;
    symbol: string;
    name: string;
    sector?: string;
    report: string;
    financial_table?: string;
    compare_periods?: string[];
    model?: string;
    citations?: string[];
  };
}

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [userInfo, setUserInfo] = useState<UserProfile | null>(null);
  const [analysisHistory, setAnalysisHistory] = useState<AnalysisHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedReport, setSelectedReport] = useState<AnalysisHistoryItem | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user?.email) {
      fetchUserInfo();
      fetchAnalysisHistory();
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

  const fetchAnalysisHistory = async () => {
    try {
      setHistoryLoading(true);
      const res = await fetch('/api/user/analyses-history');
      
      if (!res.ok) {
        throw new Error('Failed to fetch analysis history');
      }
      
      const data = await res.json();
      setAnalysisHistory(data.data || []);
    } catch (error: any) {
      console.error('Failed to fetch analysis history:', error);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleViewReport = (item: AnalysisHistoryItem) => {
    setSelectedReport(item);
  };

  const closeReportModal = () => {
    setSelectedReport(null);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
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

        {/* 분석 이력 섹션 */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <FileText className="h-6 w-6" />
              분석 이력
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              내가 요청한 투자 분석 리포트 목록입니다.
            </p>
          </CardHeader>
          <CardContent>
            {historyLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-4 border-blue-600 mx-auto mb-2"></div>
                <p className="text-gray-600 text-sm">이력을 불러오는 중...</p>
              </div>
            ) : analysisHistory.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                <p>아직 분석 이력이 없습니다.</p>
                <p className="text-sm mt-1">분석 페이지에서 종목을 분석해보세요!</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b">
                        시장
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b">
                        종목코드
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b">
                        종목명
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b">
                        분석일시
                      </th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 border-b">
                        리포트
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {analysisHistory.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 text-sm border-b">
                          <div className="flex items-center gap-1">
                            <Building2 className="h-4 w-4 text-gray-400" />
                            <span className="font-medium text-gray-700">
                              {item.stock_analyses.market}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm font-mono text-gray-600 border-b">
                          {item.stock_analyses.symbol}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900 border-b">
                          {item.stock_analyses.name}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 border-b">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            {formatDate(item.created_at)}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center border-b">
                          <Button
                            size="sm"
                            onClick={() => handleViewReport(item)}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            <FileText className="h-4 w-4 mr-1" />
                            보기
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 리포트 상세 모달 */}
        {selectedReport && (
          <div 
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={closeReportModal}
          >
            <div 
              className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b flex justify-between items-center">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">
                    {selectedReport.stock_analyses.name}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {selectedReport.stock_analyses.market} • {selectedReport.stock_analyses.symbol}
                  </p>
                </div>
                <button
                  onClick={closeReportModal}
                  className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
                >
                  ×
                </button>
              </div>
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-100px)]">
                <div className="prose max-w-none">
                  <div 
                    dangerouslySetInnerHTML={{ 
                      __html: selectedReport.stock_analyses.report 
                        .replace(/\n/g, '<br />') 
                    }} 
                  />
                  {selectedReport.stock_analyses.financial_table && (
                    <div className="mt-6">
                      <h4 className="text-lg font-bold mb-3">재무 데이터</h4>
                      <div 
                        dangerouslySetInnerHTML={{ 
                          __html: selectedReport.stock_analyses.financial_table
                            .replace(/\n/g, '<br />') 
                        }} 
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
