import { getServerSupabase } from '../supabaseServer';

export interface StockAnalysis {
  id?: string;
  user_id?: string;
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

/**
 * 분석 결과 저장
 */
export async function saveAnalysis(analysisData: StockAnalysis) {
  try {
    const supabase = getServerSupabase();
    
    const { data, error } = await supabase
      .from('stock_analyses')
      .insert({
        user_id: analysisData.user_id,
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
 * 사용자별 분석 결과 조회
 */
export async function getAnalysesByUserId(
  userId: string,
  limit: number = 50,
  offset: number = 0
) {
  try {
    const supabase = getServerSupabase();
    
    const { data, error } = await supabase
      .from('stock_analyses')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Failed to get analyses by user:', error);
    throw error;
  }
}

/**
 * 종목별 최신 분석 조회
 */
export async function getLatestAnalysisBySymbol(
  userId: string,
  symbol: string
) {
  try {
    const supabase = getServerSupabase();
    
    const { data, error } = await supabase
      .from('stock_analyses')
      .select('*')
      .eq('user_id', userId)
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
export async function deleteAnalysis(analysisId: string, userId: string) {
  try {
    const supabase = getServerSupabase();
    
    const { error } = await supabase
      .from('stock_analyses')
      .delete()
      .eq('id', analysisId)
      .eq('user_id', userId); // 본인 것만 삭제 가능

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
  userId: string,
  market: string,
  limit: number = 20
) {
  try {
    const supabase = getServerSupabase();
    
    const { data, error } = await supabase
      .from('stock_analyses')
      .select('*')
      .eq('user_id', userId)
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
