'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

interface ReportItem {
  id: string;
  market: string;
  symbol: string;
  name: string;
  sector: string | null;
  report: any;
  created_at: string;
}

export default function ReportsPage() {
  const { status } = useSession();
  const [items, setItems] = useState<ReportItem[]>([]);
  const [q, setQ] = useState('');
  const [market, setMarket] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReports = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (q) params.set('q', q);
      if (market) params.set('market', market);
      const res = await fetch(`/api/reports?${params.toString()}`);
      if (!res.ok) throw new Error(await res.text());
      const json = await res.json();
      setItems(json.items || []);
    } catch (e: any) {
      setError(e.message || '불러오기 실패');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === 'authenticated') {
      fetchReports();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  if (status === 'loading') return <div className="p-6">세션 확인 중...</div>;
  if (status !== 'authenticated') return <div className="p-6">로그인 후 리포트를 볼 수 있습니다.</div>;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-4">
      <div className="flex gap-2">
        <select
          value={market}
          onChange={(e) => setMarket(e.target.value)}
          className="flex h-10 rounded-md border px-3"
        >
          <option value="">전체</option>
          <option value="KOSPI">KOSPI</option>
          <option value="KOSDAQ">KOSDAQ</option>
          <option value="NASDAQ">NASDAQ</option>
        </select>
        <Input placeholder="심볼/기업명 검색" value={q} onChange={(e) => setQ(e.target.value)} />
        <button
          className="px-4 py-2 rounded bg-blue-600 text-white"
          onClick={fetchReports}
          disabled={loading}
        >
          {loading ? '불러오는 중...' : '검색'}
        </button>
      </div>

      {error && <div className="text-red-600">{error}</div>}

      <div className="space-y-3">
        {items.map(item => (
          <Card key={item.id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{item.market} · {item.symbol} · {item.name}</span>
                <span className="text-sm text-gray-500">{new Date(item.created_at).toLocaleString()}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-sm whitespace-pre-wrap">{typeof item.report === 'string' ? item.report : JSON.stringify(item.report, null, 2)}</pre>
            </CardContent>
          </Card>
        ))}
        {items.length === 0 && !loading && (
          <div className="text-gray-500">리포트가 없습니다.</div>
        )}
      </div>
    </div>
  );
}


