import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/auth';
import { NextResponse } from 'next/server';
import { deleteUser, getUserByEmail } from '@/lib/supabase/users';

/**
 * DELETE /api/user/account
 * 회원 탈퇴 - 사용자 계정 완전 삭제
 */
export async function DELETE() {
  try {
    // 세션 확인
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.email) {
      return NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    const userEmail = session.user.email;

    // 사용자 정보 조회
    const user = await getUserByEmail(userEmail);
    
    if (!user || !user.id) {
      return NextResponse.json(
        { error: '사용자 정보를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    console.log('User account deletion requested:', {
      userId: user.id,
      email: userEmail,
    });

    // 사용자 삭제 (CASCADE로 연관 데이터 자동 삭제)
    await deleteUser(user.id);

    console.log('User account deleted successfully:', userEmail);

    return NextResponse.json({
      success: true,
      message: '회원 탈퇴가 완료되었습니다.',
    });
  } catch (error: any) {
    console.error('Failed to delete user account:', error);
    
    return NextResponse.json(
      { 
        error: error.message || '회원 탈퇴 처리 중 오류가 발생했습니다.',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
