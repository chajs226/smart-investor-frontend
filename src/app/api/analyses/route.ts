import { NextResponse } from 'next/server';
import { 
  getAllAnalyses, 
  saveAnalysis, 
  getCachedAnalysis,
  saveAnalysisHistory 
} from '@/lib/supabase/analyses';
import { getUserByEmail } from '@/lib/supabase/users';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';

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
 * 캐시 확인 후 새로운 분석 결과 저장 (로그인 불필요, 이력은 로그인 시만 저장)
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const session = await getServerSession(authOptions);

    // 필수 필드 검증
    if (!body.market || !body.symbol || !body.name || !body.report) {
      return NextResponse.json(
        { error: 'Missing required fields: market, symbol, name, report' },
        { status: 400 }
      );
    }

    // 캐시 확인: 7일 이내 동일 조건 분석 결과가 있는지 체크
    const cachedAnalysis = await getCachedAnalysis(
      body.market,
      body.symbol,
      body.name,
      body.compare_periods || [],
      body.model
    );

    let analysisToSave;
    let isFromCache = false;

    if (cachedAnalysis) {
      console.log('✅ Using cached analysis:', cachedAnalysis.id);
      analysisToSave = cachedAnalysis;
      isFromCache = true;
    } else {
      console.log('🔄 Saving new analysis to database');
      // 새로운 분석 결과 저장
      analysisToSave = await saveAnalysis({
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
    }

    // 로그인한 사용자인 경우 분석 이력 저장
    if (session?.user?.email && analysisToSave?.id) {
      try {
        console.log('👤 로그인 사용자 감지:', session.user.email);
        
        // 사용자 ID 조회
        const user = await getUserByEmail(session.user.email);
        
        if (user?.id) {
          console.log('📊 분석 이력 저장 시도:', {
            userId: user.id,
            analysisId: analysisToSave.id,
          });
          
          await saveAnalysisHistory(user.id, analysisToSave.id);
          console.log('✅ Analysis history saved successfully');
        } else {
          console.warn('⚠️ User not found in database:', session.user.email);
        }
      } catch (historyError) {
        console.error('❌ Failed to save analysis history:', historyError);
        // 이력 저장 실패해도 분석 결과는 반환
      }
    } else {
      if (!session?.user?.email) {
        console.log('ℹ️ 비로그인 사용자 - 이력 저장 생략');
      }
      if (!analysisToSave?.id) {
        console.error('❌ Analysis ID가 없음 - 이력 저장 실패');
      }
    }

    return NextResponse.json({
      success: true,
      data: analysisToSave,
      fromCache: isFromCache,
    });
  } catch (error: any) {
    console.error('Failed to process analysis:', error);
    return NextResponse.json(
      { error: 'Failed to process analysis', details: error.message },
      { status: 500 }
    );
  }
}
