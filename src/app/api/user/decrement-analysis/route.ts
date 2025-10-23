import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { decrementAnalysisCount } from '@/lib/supabase/users';

/**
 * POST /api/user/decrement-analysis
 * 분석 횟수 1 차감
 */
export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized - 로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    const updatedUser = await decrementAnalysisCount(session.user.email);
    
    return NextResponse.json({
      success: true,
      analysis_count: updatedUser.analysis_count,
      message: '분석 횟수가 차감되었습니다.',
    });
  } catch (error: any) {
    console.error('Failed to decrement analysis count:', error);
    
    // 횟수 부족 에러 처리
    if (error.message === '분석 가능 횟수가 없습니다.') {
      return NextResponse.json(
        { error: error.message },
        { status: 403 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to decrement analysis count', details: error.message },
      { status: 500 }
    );
  }
}
