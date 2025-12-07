import { NextResponse } from 'next/server';
import { saveAnalysisHistory } from '@/lib/supabase/analyses';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { getUserByEmail } from '@/lib/supabase/users';

/**
 * POST /api/analyses/save-history
 * 분석 완료 후 사용자 이력 저장 (로그인 필수)
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized. Login required.' },
        { status: 401 }
      );
    }

    const body = await request.json();

    if (!body.analysisId) {
      return NextResponse.json(
        { error: 'Missing required field: analysisId' },
        { status: 400 }
      );
    }

    // 사용자 ID 조회
    const user = await getUserByEmail(session.user.email);
    if (!user?.id) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // 분석 이력 저장
    const history = await saveAnalysisHistory(user.id, body.analysisId);

    return NextResponse.json({
      success: true,
      data: history,
    });
  } catch (error: any) {
    console.error('Failed to save analysis history:', error);
    return NextResponse.json(
      { error: 'Failed to save analysis history', details: error.message },
      { status: 500 }
    );
  }
}
