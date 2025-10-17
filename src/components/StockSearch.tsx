'use client';

import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Search } from 'lucide-react';

// JSON 파일에서 사용하는 주식 데이터 타입
interface StockData {
  market: string;
  symbol: string;
  name: string;
  sector?: string | null;
}

interface StockSearchProps {
  market: string; // '한국' 또는 '미국'
  onSelect: (stockCode: string, stockName: string) => void;
  selectedCode?: string;
  selectedName?: string;
}

export default function StockSearch({ market, onSelect, selectedCode = '', selectedName = '' }: StockSearchProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredStocks, setFilteredStocks] = useState<StockData[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [stocks, setStocks] = useState<StockData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUserEditing, setIsUserEditing] = useState(false); // 사용자가 직접 편집 중인지 추적
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 주식 데이터 로드
  useEffect(() => {
    const loadStocks = async () => {
      setIsLoading(true);
      console.log('시장:', market, '- 데이터 로딩 시작');
      try {
        if (market === '한국') {
          // 한국 주식 데이터 로드 (KOSPI + KOSDAQ)
          const [kospiResponse, kosdaqResponse] = await Promise.all([
            fetch('/data/kospi.json'),
            fetch('/data/kosdaq.json')
          ]);
          
          if (!kospiResponse.ok || !kosdaqResponse.ok) {
            console.error('데이터 로드 실패:', kospiResponse.status, kosdaqResponse.status);
            return;
          }
          
          const kospiData = await kospiResponse.json();
          const kosdaqData = await kosdaqResponse.json();
          
          console.log('KOSPI 데이터 수:', kospiData.length);
          console.log('KOSDAQ 데이터 수:', kosdaqData.length);
          
          // null 또는 undefined 값이 있는 항목 필터링
          const validKospi = kospiData.filter((s: StockData) => s.name && s.symbol);
          const validKosdaq = kosdaqData.filter((s: StockData) => s.name && s.symbol);
          
          const allStocks = [...validKospi, ...validKosdaq];
          console.log('유효한 한국 주식 총:', allStocks.length);
          console.log('샘플 데이터:', allStocks.slice(0, 3));
          
          setStocks(allStocks);
        } else {
          // 미국 주식 데이터 로드
          const response = await fetch('/data/us-stocks.json');
          
          if (!response.ok) {
            console.error('미국 데이터 로드 실패:', response.status);
            return;
          }
          
          const data = await response.json();
          console.log('US 데이터 수:', data.length);
          
          // null 또는 undefined 값이 있는 항목 필터링
          const validData = data.filter((s: StockData) => s.name && s.symbol);
          console.log('유효한 미국 주식 총:', validData.length);
          
          setStocks(validData);
        }
      } catch (error) {
        console.error('주식 데이터 로드 실패:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadStocks();
    // 시장이 변경되면 검색어와 결과 초기화
    setSearchTerm('');
    setFilteredStocks([]);
    setShowDropdown(false);
    setIsUserEditing(false); // 시장 변경 시 편집 모드도 초기화
  }, [market]);

  // 검색어에 따라 필터링
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredStocks([]);
      setShowDropdown(false);
      return;
    }

    const term = searchTerm.toLowerCase().trim();
    
    console.log('검색어:', term);
    console.log('전체 주식 수:', stocks.length);
    
    const filtered = stocks
      .filter(stock => {
        // null 또는 undefined 체크
        const name = stock.name?.toLowerCase() || '';
        const symbol = stock.symbol?.toLowerCase() || '';
        
        // Like 검색: 검색어가 name 또는 symbol에 포함되는지 확인
        const nameMatch = name.includes(term);
        const symbolMatch = symbol.includes(term);
        
        return nameMatch || symbolMatch;
      })
      .slice(0, 50); // 최대 50개까지만 표시

    console.log('필터링된 결과 수:', filtered.length);
    if (filtered.length > 0) {
      console.log('첫 번째 결과:', filtered[0]);
    }

    setFilteredStocks(filtered);
    setShowDropdown(filtered.length > 0);
  }, [searchTerm, stocks]);

  // 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (stock: StockData) => {
    onSelect(stock.symbol, stock.name);
    setSearchTerm(`${stock.name} (${stock.symbol})`);
    setShowDropdown(false); // 드롭다운 닫기
    setFilteredStocks([]); // 필터링된 결과 초기화
    setIsUserEditing(false); // 선택 완료 후 편집 모드 해제
    
    // input focus 해제하여 드롭다운 확실히 닫기
    if (inputRef.current) {
      inputRef.current.blur();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    setIsUserEditing(true); // 사용자가 직접 입력 중임을 표시
    
    // 검색어가 입력되면 드롭다운을 다시 표시, 비어있으면 닫기
    if (value.trim() !== '') {
      setShowDropdown(true);
    } else {
      setShowDropdown(false);
      setFilteredStocks([]);
    }
  };

  // 선택된 값이 외부에서 변경되면 검색어 업데이트
  useEffect(() => {
    // 사용자가 직접 편집 중이 아닐 때만 자동으로 값을 채움
    if (!isUserEditing && selectedCode && selectedName) {
      setSearchTerm(`${selectedName} (${selectedCode})`);
    }
  }, [selectedCode, selectedName, isUserEditing]);

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="space-y-2">
        <Label htmlFor="stockSearch" className="flex items-center gap-2">
          <Search className="h-4 w-4" />
          종목 검색
        </Label>
        <Input
          id="stockSearch"
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={() => {
            // 사용자가 편집 중이고 결과가 있을 때만 드롭다운 표시
            if (isUserEditing && filteredStocks.length > 0) {
              setShowDropdown(true);
            }
          }}
          placeholder={isLoading ? "로딩 중..." : "회사명 또는 티커를 입력하세요 (예: 삼성전자, 005930)"}
          className="w-full"
          disabled={isLoading}
        />
      </div>

      {showDropdown && filteredStocks.length > 0 && (
        <div className="absolute z-50 w-full mt-1 max-h-80 overflow-y-auto bg-white border border-gray-300 rounded-md shadow-lg">
          <ul className="py-1">
            {filteredStocks.map((stock, index) => (
              <li
                key={`${stock.symbol}-${index}`}
                onClick={() => handleSelect(stock)}
                className="px-4 py-2 hover:bg-blue-50 cursor-pointer transition-colors"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <span className="font-medium text-gray-900">{stock.name}</span>
                    <span className="ml-2 text-sm text-gray-500">({stock.symbol})</span>
                  </div>
                  {stock.sector && (
                    <span className="text-xs text-gray-400">{stock.sector}</span>
                  )}
                </div>
                <div className="text-xs text-gray-400 mt-0.5">{stock.market}</div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {showDropdown && searchTerm.trim() !== '' && filteredStocks.length === 0 && !isLoading && (
        <div className="absolute z-50 w-full mt-1 p-4 bg-white border border-gray-300 rounded-md shadow-lg text-center text-gray-500 text-sm">
          검색 결과가 없습니다.
        </div>
      )}
    </div>
  );
}
