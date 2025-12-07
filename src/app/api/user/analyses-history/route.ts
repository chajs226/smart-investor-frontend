import { NextResponse } from 'next/server';
import { getUserAnalysisHistory } from '@/lib/supabase/analyses';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { getUserByEmail } from '@/lib/supabase/users';

/**
 * GET /api/user/analyses-history
 * 로그인한 사용자의 분석 이력 조회 (stock_analyses 데이터 포함)
 */
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized. Login required.' },
        { status: 401 }
      );
    }

    // 쿼리 파라미터에서 limit, offset 추출
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // 사용자 ID 조회
    const user = await getUserByEmail(session.user.email);
    if (!user?.id) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // 사용자 분석 이력 조회
    const history = await getUserAnalysisHistory(user.id, limit, offset);

    return NextResponse.json({
      success: true,
      data: history,
      count: history.length,
    });
  } catch (error: any) {
    console.error('Failed to get user analysis history:', error);
    return NextResponse.json(
      { error: 'Failed to get analysis history', details: error.message },
      { status: 500 }
    );
  }
}
