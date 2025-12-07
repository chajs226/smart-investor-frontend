import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { getUserByEmail } from '@/lib/supabase/users';

/**
 * GET /api/user/profile
 * 로그인한 사용자의 프로필 정보 조회
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized - 로그인이 필요합니다.' },
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

    // 민감한 정보 제외하고 반환
    return NextResponse.json({
      success: true,
      user: {
        email: user.email,
        name: user.name,
        analysis_count: user.analysis_count ?? 0,
        plan: user.plan ?? 'free',
        created_at: user.created_at,
        last_login_at: user.last_login_at,
      },
    });
  } catch (error: any) {
    console.error('Failed to fetch user profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user profile', details: error.message },
      { status: 500 }
    );
  }
}
