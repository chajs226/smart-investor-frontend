'use client';

import { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useReactToPrint } from 'react-to-print';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { TrendingUp, Building2, Calendar, Settings, Play, Download } from 'lucide-react';
import StockSearch from '@/components/StockSearch';

interface AnalysisResponse {
  stock_code: string;
  stock_name: string;
  compare_periods: string[];
  analysis: string;
  financial_table: string;
  citations: string[];
  model: string;
  usage: any;
  created: number;
}

// Markdown 표를 HTML 테이블로 변환하는 헬퍼 함수
const convertMarkdownTableToHTML = (markdown: string): string => {
  const lines = markdown.trim().split('\n').filter(line => line.trim());
  if (lines.length < 2) return markdown;

  let html = '<table class="min-w-full border-collapse border-2 border-blue-300 shadow-lg">';
  
  // 헤더 처리
  const headers = lines[0].split('|').map(h => h.trim()).filter(h => h);
  html += '<thead class="bg-gradient-to-r from-blue-500 to-blue-600 text-white">';
  html += '<tr>';
  headers.forEach(header => {
    html += `<th class="px-4 py-3 text-left font-bold border border-blue-400">${header}</th>`;
  });
  html += '</tr></thead>';
  
  // 구분선 스킵 (두 번째 줄)
  html += '<tbody class="bg-white">';
  
  // 데이터 행 처리
  for (let i = 2; i < lines.length; i++) {
    const cells = lines[i].split('|').map(c => c.trim()).filter(c => c);
    const rowClass = i % 2 === 0 ? 'bg-blue-50' : 'bg-white';
    html += `<tr class="${rowClass} hover:bg-blue-100 transition-colors">`;
    cells.forEach((cell, idx) => {
      // 첫 번째 열은 굵게
      const cellClass = idx === 0 
        ? 'px-4 py-3 font-semibold text-gray-800 border border-gray-300' 
        : 'px-4 py-3 text-gray-700 border border-gray-300';
      html += `<td class="${cellClass}">${cell}</td>`;
    });
    html += '</tr>';
  }
  
  html += '</tbody></table>';
  return html;
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

export default function Home() {
  const [formData, setFormData] = useState({
    stockCode: '',
    stockName: '',
    comparePeriods: ['', ''],
    apiKey: '',
    model: 'sonar-deep-research', // 기본값, 사용자가 수정 가능
    market: '한국'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(id);
  }, [toast]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePeriodChange = (index: number, value: string) => {
    const newPeriods = [...formData.comparePeriods];
    newPeriods[index] = value;
    setFormData(prev => ({
      ...prev,
      comparePeriods: newPeriods
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setAnalysis(null);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 300000); // 300초 타임아웃 (5분)
    try {
      const query = formData.model ? `?model=${encodeURIComponent(formData.model)}` : '';
      // Next.js rewrites 프록시를 우회하고 직접 백엔드로 요청
      const response = await axios.post(
        `${API_BASE_URL}/api/analysis/analyze${query}`,
        {
          stock_code: formData.stockCode,
          stock_name: formData.stockName,
          compare_periods: formData.comparePeriods.filter(p => p.trim() !== ''),
          market: formData.market,
          api_key: formData.apiKey
        },
        { signal: controller.signal }
      );
      setAnalysis(response.data);
    } catch (err: any) {
      if (axios.isCancel(err)) {
        setError('요청이 시간 초과되었습니다. (300초/5분) 모델/기간을 조정하거나 다시 시도하세요.');
      } else if (err.name === 'AbortError') {
        setError('요청이 취소되었습니다.');
      } else {
        setError(err.response?.data?.detail || '분석 중 오류가 발생했습니다.');
      }
    } finally {
      clearTimeout(timeoutId);
      setIsLoading(false);
    }
  };

  // react-to-print를 사용한 PDF 생성 (브라우저 네이티브 인쇄 기능 사용)
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `investment-report-${analysis?.stock_name || 'report'}-${new Date().toISOString().split('T')[0]}`,
    onBeforePrint: async () => {
      setToast('PDF 생성 준비 중...');
    },
    onAfterPrint: async () => {
      setToast('PDF 생성 완료! (인쇄 대화상자에서 "PDF로 저장" 선택)');
    },
  });

  const downloadPDF = () => {
    if (!analysis) return;
    handlePrint();
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <Card className="w-full max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl font-bold">
              <TrendingUp className="h-6 w-6" />
              똑똑한 주식 투자자
            </CardTitle>
            <p className="text-muted-foreground">
              기업 재무정보와 최신 뉴스를 기반으로 투자 분석 보고서를 자동 생성합니다
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* 시장 구분 섹션 */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  <Label htmlFor="market">시장 구분</Label>
                </div>
                <select
                  id="market"
                  name="market"
                  value={formData.market}
                  onChange={handleSelectChange}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="한국">한국</option>
                  <option value="미국">미국</option>
                </select>
                <p className="text-sm text-muted-foreground">
                  국내 선택 시 KOSPI/KOSDAQ 상장 기업을 우선으로 분석합니다.
                </p>
              </div>

              {/* 종목 정보 섹션 */}
              <div className="space-y-4">
                <StockSearch
                  market={formData.market}
                  onSelect={(code, name) => {
                    setFormData(prev => ({
                      ...prev,
                      stockCode: code,
                      stockName: name
                    }));
                  }}
                  selectedCode={formData.stockCode}
                  selectedName={formData.stockName}
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="stockCode">종목코드</Label>
                    <Input
                      id="stockCode"
                      name="stockCode"
                      value={formData.stockCode}
                      onChange={handleInputChange}
                      placeholder="검색에서 선택하거나 직접 입력"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="stockName">기업명</Label>
                    <Input
                      id="stockName"
                      name="stockName"
                      value={formData.stockName}
                      onChange={handleInputChange}
                      placeholder="검색에서 선택하거나 직접 입력"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* 날짜 섹션 */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <Label>재무 데이터 비교</Label>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="comparePeriod1">From: 분기</Label>
                    <select
                      id="comparePeriod1"
                      value={formData.comparePeriods[0]}
                      onChange={(e) => handlePeriodChange(0, e.target.value)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      required
                    >
                      <option value="">분기 선택</option>
                      <option value="2024.06">2024.06</option>
                      <option value="2024.09">2024.09</option>
                      <option value="2024.12">2024.12</option>
                      <option value="2025.03">2025.03</option>
                      <option value="2025.06">2025.06</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="comparePeriod2">To: 분기</Label>
                    <select
                      id="comparePeriod2"
                      value={formData.comparePeriods[1]}
                      onChange={(e) => handlePeriodChange(1, e.target.value)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      required
                    >
                      <option value="">분기 선택</option>
                      <option value="2024.06">2024.06</option>
                      <option value="2024.09">2024.09</option>
                      <option value="2024.12">2024.12</option>
                      <option value="2025.03">2025.03</option>
                      <option value="2025.06">2025.06</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* API 설정 섹션 */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  <Label>API 설정</Label>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="apiKey">Perplexity API 키</Label>
                    <Input
                      id="apiKey"
                      name="apiKey"
                      type="password"
                      value={formData.apiKey}
                      onChange={handleInputChange}
                      placeholder="Perplexity API 키를 입력하세요"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="model">모델 (선택)</Label>
                    <Input
                      id="model"
                      name="model"
                      value={formData.model}
                      onChange={handleInputChange}
                      placeholder="예: llama-3.1-sonar-small-128k-online"
                    />
                    <p className="text-sm text-muted-foreground">
                      빈칸이면 서버 기본 모델을 사용합니다.
                    </p>
                  </div>
                </div>
              </div>

              {/* 실행 버튼 */}
              <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                <Play className="mr-2 h-4 w-4" />
                {isLoading ? '분석 중...' : '분석 시작'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {error && (
          <Card className="mt-6 border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">오류 발생</h3>
                  <div className="mt-2 text-sm text-red-700">{error}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {toast && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-4 py-2 rounded shadow-lg z-50">
            {toast}
          </div>
        )}

        {analysis && (
          <Card className="mt-6">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-2xl font-bold">
                  {analysis.stock_name} 투자 분석 보고서
                </CardTitle>
                <Button onClick={downloadPDF} className="bg-green-600 hover:bg-green-700">
                  <Download className="mr-2 h-4 w-4" />
                  PDF 다운로드
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-8" id="analysis-report" ref={printRef}>
              {/* 재무 데이터 표 섹션 */}
              {analysis.financial_table && (
                <section className="mb-8">
                  <h3 className="text-xl font-semibold mb-4 pb-2 border-b-2 border-blue-500">📊 핵심 재무 지표</h3>
                  <div className="overflow-x-auto">
                    <div 
                      className="financial-table-container"
                      dangerouslySetInnerHTML={{ 
                        __html: convertMarkdownTableToHTML(analysis.financial_table) 
                      }}
                    />
                  </div>
                </section>
              )}

              {/* 분석 내용 섹션 */}
              <section>
                <h3 className="text-xl font-semibold mb-4 pb-2 border-b-2 border-blue-500">📈 투자 분석</h3>
                <div className="prose prose-lg max-w-none">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      h1: ({node, ...props}) => <h1 className="text-2xl font-bold mt-8 mb-4 text-gray-900" {...props} />,
                      h2: ({node, ...props}) => <h2 className="text-xl font-bold mt-6 mb-3 text-gray-800" {...props} />,
                      h3: ({node, ...props}) => <h3 className="text-lg font-semibold mt-5 mb-2 text-gray-700" {...props} />,
                      p: ({node, ...props}) => <p className="mb-4 leading-relaxed text-gray-700" {...props} />,
                      strong: ({node, ...props}) => <strong className="font-bold text-gray-900 bg-yellow-100 px-1" {...props} />,
                      ul: ({node, ...props}) => <ul className="list-disc list-inside mb-4 space-y-2" {...props} />,
                      ol: ({node, ...props}) => <ol className="list-decimal list-inside mb-4 space-y-2" {...props} />,
                      li: ({node, ...props}) => <li className="ml-4 text-gray-700" {...props} />,
                      table: ({node, ...props}) => (
                        <div className="overflow-x-auto my-6 shadow-lg rounded-lg">
                          <table className="min-w-full border-collapse border-2 border-blue-300" {...props} />
                        </div>
                      ),
                      thead: ({node, ...props}) => <thead className="bg-gradient-to-r from-blue-500 to-blue-600 text-white" {...props} />,
                      tbody: ({node, ...props}) => <tbody className="bg-white divide-y divide-gray-200" {...props} />,
                      tr: ({node, ...props}) => <tr className="hover:bg-blue-50 transition-colors" {...props} />,
                      th: ({node, ...props}) => <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-wider border border-blue-400" {...props} />,
                      td: ({node, ...props}) => <td className="px-6 py-4 text-sm text-gray-700 border border-gray-300 whitespace-nowrap" {...props} />,
                    }}
                  >
                    {analysis.analysis}
                  </ReactMarkdown>
                </div>
              </section>

              {analysis.citations.length > 0 && (
                <div className="pt-6 border-t border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">📚 참고 자료</h3>
                  <ul className="space-y-2">
                    {analysis.citations.map((citation, index) => (
                      <li key={index} className="text-sm text-gray-600 hover:text-blue-600">
                        • {citation}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}