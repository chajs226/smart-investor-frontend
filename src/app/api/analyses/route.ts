import { NextResponse } from 'next/server';
import { getAllAnalyses, saveAnalysis } from '@/lib/supabase/analyses';

/**
 * GET /api/analyses
 * 모든 분석 이력 조회 (로그인 불필요)
 */
export async function GET(request: Request) {
  try {
    // 쿼리 파라미터에서 limit, offset 추출
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // 분석 이력 조회
    const analyses = await getAllAnalyses(limit, offset);

    return NextResponse.json({
      success: true,
      data: analyses,
      count: analyses.length,
    });
  } catch (error: any) {
    console.error('Failed to get analyses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analyses', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/analyses
 * 새로운 분석 결과 저장 (로그인 불필요)
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // 필수 필드 검증
    if (!body.market || !body.symbol || !body.name || !body.report) {
      return NextResponse.json(
        { error: 'Missing required fields: market, symbol, name, report' },
        { status: 400 }
      );
    }

    // 분석 결과 저장
    const savedAnalysis = await saveAnalysis({
      market: body.market,
      symbol: body.symbol,
      name: body.name,
      sector: body.sector,
      report: body.report,
      financial_table: body.financial_table,
      compare_periods: body.compare_periods,
      model: body.model,
      citations: body.citations,
    });

    return NextResponse.json({
      success: true,
      data: savedAnalysis,
    });
  } catch (error: any) {
    console.error('Failed to save analysis:', error);
    return NextResponse.json(
      { error: 'Failed to save analysis', details: error.message },
      { status: 500 }
    );
  }
}
