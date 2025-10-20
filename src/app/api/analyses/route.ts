import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { getAnalysesByUserId, saveAnalysis } from '@/lib/supabase/analyses';
import { getUserByEmail } from '@/lib/supabase/users';

/**
 * GET /api/analyses
 * 로그인한 사용자의 분석 이력 조회
 */
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Supabase에서 사용자 정보 조회
    const user = await getUserByEmail(session.user.email);
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found in database' },
        { status: 404 }
      );
    }

    // 쿼리 파라미터에서 limit, offset 추출
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // 분석 이력 조회
    const analyses = await getAnalysesByUserId(user.id!, limit, offset);

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
 * 새로운 분석 결과 저장
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Supabase에서 사용자 정보 조회
    const user = await getUserByEmail(session.user.email);
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found in database' },
        { status: 404 }
      );
    }

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
      user_id: user.id,
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
