import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { getUserByEmail, getUserProviders, unlinkProvider } from '@/lib/supabase/users';

/**
 * GET /api/user/providers
 * 현재 사용자의 연동된 provider 목록 조회
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 이메일로 사용자 조회
    const user = await getUserByEmail(session.user.email);
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // 사용자의 모든 provider 조회
    const providers = await getUserProviders(user.id!);

    return NextResponse.json({
      providers,
    });
  } catch (error: any) {
    console.error('Failed to fetch providers:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch providers' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/user/providers
 * 특정 provider 연동 해제
 */
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { provider } = body;

    if (!provider) {
      return NextResponse.json(
        { error: 'Provider is required' },
        { status: 400 }
      );
    }

    // 이메일로 사용자 조회
    const user = await getUserByEmail(session.user.email);
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // provider 연동 해제
    await unlinkProvider(user.id!, provider);

    return NextResponse.json({
      success: true,
      message: 'Provider unlinked successfully',
    });
  } catch (error: any) {
    console.error('Failed to unlink provider:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to unlink provider' },
      { status: 500 }
    );
  }
}
