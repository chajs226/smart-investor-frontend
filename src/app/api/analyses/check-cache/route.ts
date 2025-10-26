import { NextResponse } from 'next/server';
import { getCachedAnalysis, saveAnalysisHistory } from '@/lib/supabase/analyses';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { getUserByEmail } from '@/lib/supabase/users';

/**
 * POST /api/analyses/check-cache
 * 분석 요청 전 캐시 확인 (7일 이내 동일 조건 분석이 있는지 체크)
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const session = await getServerSession(authOptions);

    // 필수 필드 검증
    if (!body.market || !body.symbol || !body.name) {
      return NextResponse.json(
        { error: 'Missing required fields: market, symbol, name' },
        { status: 400 }
      );
    }

    // 캐시 확인
    const cachedAnalysis = await getCachedAnalysis(
      body.market,
      body.symbol,
      body.name,
      body.compare_periods || [],
      body.model
    );

    if (!cachedAnalysis) {
      return NextResponse.json({
        success: true,
        cached: false,
        data: null,
      });
    }

    // 캐시된 분석이 있는 경우
    console.log('✅ Found cached analysis:', cachedAnalysis.id);

    // 로그인한 사용자인 경우 분석 이력 저장
    if (session?.user?.email && cachedAnalysis.id) {
      try {
        console.log('👤 캐시 히트 - 로그인 사용자:', session.user.email);
        
        const user = await getUserByEmail(session.user.email);
        
        if (user?.id) {
          console.log('📊 캐시된 분석 이력 저장 시도:', {
            userId: user.id,
            analysisId: cachedAnalysis.id,
          });
          
          await saveAnalysisHistory(user.id, cachedAnalysis.id);
          console.log('✅ Cached analysis history saved successfully');
        } else {
          console.warn('⚠️ User not found in database:', session.user.email);
        }
      } catch (historyError) {
        console.error('❌ Failed to save cached analysis history:', historyError);
        // 이력 저장 실패해도 캐시된 분석 결과는 반환
      }
    } else {
      if (!session?.user?.email) {
        console.log('ℹ️ 비로그인 사용자 - 캐시 이력 저장 생략');
      }
    }

    return NextResponse.json({
      success: true,
      cached: true,
      data: cachedAnalysis,
    });
  } catch (error: any) {
    console.error('Failed to check cache:', error);
    return NextResponse.json(
      { error: 'Failed to check cache', details: error.message },
      { status: 500 }
    );
  }
}
