import { getServerSupabase } from '../supabaseServer';

export interface StockAnalysis {
  id?: string;
  market: 'KOSPI' | 'KOSDAQ' | 'NASDAQ' | string;
  symbol: string;
  name: string;
  sector?: string;
  report: string;
  financial_table?: string;
  compare_periods?: string[];
  model?: string;
  citations?: string[];
  created_at?: string;
  updated_at?: string;
}

export interface AnalysisHistory {
  id?: string;
  user_id: string;
  analysis_id: string;
  created_at?: string;
  updated_at?: string;
}

export interface AnalysisHistoryWithDetails extends AnalysisHistory {
  stock_analyses?: StockAnalysis;
}

/**
 * 캐시된 분석 결과 조회 (7일 이내, 동일 조건)
 * @param market 시장
 * @param symbol 심볼
 * @param name 종목명
 * @param compare_periods 비교 기간 배열
 * @param model AI 모델명
 * @returns 캐시된 분석 결과 또는 null
 */
export async function getCachedAnalysis(
  market: string,
  symbol: string,
  name: string,
  compare_periods: string[],
  model?: string
): Promise<StockAnalysis | null> {
  try {
    const supabase = getServerSupabase();
    
    // 7일 전 날짜 계산
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    // 쿼리 빌더
    let query = supabase
      .from('stock_analyses')
      .select('*')
      .eq('market', market)
      .eq('symbol', symbol)
      .eq('name', name)
      .gte('created_at', sevenDaysAgo.toISOString())
      .order('created_at', { ascending: false });
    
    // compare_periods 배열 비교 (PostgreSQL의 배열 비교)
    if (compare_periods && compare_periods.length > 0) {
      query = query.contains('compare_periods', compare_periods);
    }
    
    // model이 있는 경우 추가 필터
    if (model) {
      query = query.eq('model', model);
    }
    
    const { data, error } = await query.limit(1).maybeSingle();

    if (error) {
      console.error('Failed to get cached analysis:', error);
      return null;
    }

    if (data) {
      console.log('Found cached analysis:', {
        id: data.id,
        symbol: data.symbol,
        created_at: data.created_at,
      });
    }

    return data;
  } catch (error) {
    console.error('Error in getCachedAnalysis:', error);
    return null;
  }
}

/**
 * 분석 결과 저장 (로그인 불필요)
 */
export async function saveAnalysis(analysisData: StockAnalysis) {
  try {
    const supabase = getServerSupabase();
    
    const { data, error } = await supabase
      .from('stock_analyses')
      .insert({
        market: analysisData.market,
        symbol: analysisData.symbol,
        name: analysisData.name,
        sector: analysisData.sector,
        report: analysisData.report,
        financial_table: analysisData.financial_table,
        compare_periods: analysisData.compare_periods,
        model: analysisData.model,
        citations: analysisData.citations,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      throw error;
    }

    console.log('Analysis saved successfully:', data);
    return data;
  } catch (error) {
    console.error('Failed to save analysis:', error);
    throw error;
  }
}

/**
 * 모든 분석 결과 조회 (페이징)
 */
export async function getAllAnalyses(
  limit: number = 50,
  offset: number = 0
) {
  try {
    const supabase = getServerSupabase();
    
    const { data, error } = await supabase
      .from('stock_analyses')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Failed to get all analyses:', error);
    throw error;
  }
}

/**
 * 종목별 최신 분석 조회
 */
export async function getLatestAnalysisBySymbol(
  symbol: string
) {
  try {
    const supabase = getServerSupabase();
    
    const { data, error } = await supabase
      .from('stock_analyses')
      .select('*')
      .eq('symbol', symbol)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Failed to get latest analysis by symbol:', error);
    throw error;
  }
}

/**
 * 분석 결과 삭제
 */
export async function deleteAnalysis(analysisId: string) {
  try {
    const supabase = getServerSupabase();
    
    const { error } = await supabase
      .from('stock_analyses')
      .delete()
      .eq('id', analysisId);

    if (error) {
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Failed to delete analysis:', error);
    throw error;
  }
}

/**
 * 시장별 분석 결과 조회
 */
export async function getAnalysesByMarket(
  market: string,
  limit: number = 20
) {
  try {
    const supabase = getServerSupabase();
    
    const { data, error } = await supabase
      .from('stock_analyses')
      .select('*')
      .eq('market', market)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Failed to get analyses by market:', error);
    throw error;
  }
}

/**
 * 분석 이력 저장 (사용자의 분석 요청 기록)
 * @param userId 사용자 ID
 * @param analysisId 분석 결과 ID
 */
export async function saveAnalysisHistory(
  userId: string,
  analysisId: string
): Promise<AnalysisHistory> {
  try {
    const supabase = getServerSupabase();
    
    const { data, error } = await supabase
      .from('analyses_history')
      .insert({
        user_id: userId,
        analysis_id: analysisId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to save analysis history:', error);
      throw error;
    }

    console.log('Analysis history saved successfully:', data);
    return data;
  } catch (error) {
    console.error('Error in saveAnalysisHistory:', error);
    throw error;
  }
}

/**
 * 사용자별 분석 이력 조회 (stock_analyses 데이터 조인)
 * @param userId 사용자 ID
 * @param limit 조회 개수
 * @param offset 오프셋
 */
export async function getUserAnalysisHistory(
  userId: string,
  limit: number = 50,
  offset: number = 0
): Promise<AnalysisHistoryWithDetails[]> {
  try {
    const supabase = getServerSupabase();
    
    const { data, error } = await supabase
      .from('analyses_history')
      .select(`
        id,
        user_id,
        analysis_id,
        created_at,
        updated_at,
        stock_analyses!inner (
          id,
          market,
          symbol,
          name,
          sector,
          report,
          financial_table,
          compare_periods,
          model,
          citations,
          created_at,
          updated_at
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Failed to get user analysis history:', error);
      throw error;
    }

    return data as unknown as AnalysisHistoryWithDetails[];
  } catch (error) {
    console.error('Error in getUserAnalysisHistory:', error);
    throw error;
  }
}

/**
 * 특정 분석 이력 조회 (분석 상세 정보 포함)
 * @param historyId 이력 ID
 */
export async function getAnalysisHistoryById(
  historyId: string
): Promise<AnalysisHistoryWithDetails | null> {
  try {
    const supabase = getServerSupabase();
    
    const { data, error } = await supabase
      .from('analyses_history')
      .select(`
        id,
        user_id,
        analysis_id,
        created_at,
        updated_at,
        stock_analyses!inner (
          id,
          market,
          symbol,
          name,
          sector,
          report,
          financial_table,
          compare_periods,
          model,
          citations,
          created_at,
          updated_at
        )
      `)
      .eq('id', historyId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      console.error('Failed to get analysis history by id:', error);
      throw error;
    }

    return data as unknown as AnalysisHistoryWithDetails;
  } catch (error) {
    console.error('Error in getAnalysisHistoryById:', error);
    throw error;
  }
}
