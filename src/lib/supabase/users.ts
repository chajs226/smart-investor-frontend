import { getServerSupabase } from '../supabaseServer';

export interface User {
  id?: string;
  email: string;
  name?: string;
  analysis_count?: number; // 남은 분석 가능 횟수
  plan?: 'free' | 'paid';  // 사용자 플랜
  created_at?: string;
  updated_at?: string;
  last_login_at?: string;
}

export interface UserProvider {
  id?: string;
  user_id: string;
  provider: string;
  provider_account_id: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * 사용자 정보 생성 또는 업데이트 (여러 OAuth provider 지원)
 */
export async function upsertUser(userData: {
  email: string;
  provider: string;
  provider_account_id: string;
  name?: string;
}) {
  try {
    const supabase = getServerSupabase();
    
    // 1. provider와 provider_account_id로 기존 연동 확인
    const { data: existingProvider } = await supabase
      .from('user_providers')
      .select('user_id, users(*)')
      .eq('provider', userData.provider)
      .eq('provider_account_id', userData.provider_account_id)
      .single();

    let userId: string;
    let isNewUser = false;

    if (existingProvider) {
      // 기존 provider 연동이 있으면 해당 사용자 사용
      userId = existingProvider.user_id;
      console.log('Existing provider found, user_id:', userId);
    } else {
      // 2. 이메일로 기존 사용자 확인
      const { data: existingUserByEmail } = await supabase
        .from('users')
        .select('*')
        .eq('email', userData.email)
        .single();

      if (existingUserByEmail) {
        // 같은 이메일의 사용자가 있으면 해당 사용자에 새 provider 연동
        userId = existingUserByEmail.id!;
        console.log('Existing user found by email, linking new provider. user_id:', userId);
      } else {
        // 3. 완전히 새로운 사용자 생성
        const { data: newUser, error: createUserError } = await supabase
          .from('users')
          .insert({
            email: userData.email,
            name: userData.name,
            analysis_count: 10,
            plan: 'free',
            last_login_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (createUserError) {
          console.error('Failed to create user:', createUserError);
          throw createUserError;
        }

        userId = newUser.id!;
        isNewUser = true;
        console.log('New user created, user_id:', userId);
      }

      // 4. provider 연동 추가
      const { error: providerError } = await supabase
        .from('user_providers')
        .insert({
          user_id: userId,
          provider: userData.provider,
          provider_account_id: userData.provider_account_id,
        });

      if (providerError) {
        console.error('Failed to link provider:', providerError);
        throw providerError;
      }

      console.log('Provider linked successfully:', {
        user_id: userId,
        provider: userData.provider,
      });
    }

    // 5. 사용자의 last_login_at 업데이트
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({
        last_login_at: new Date().toISOString(),
        // 이름이 없던 사용자에게 이름 추가
        ...(userData.name ? { name: userData.name } : {}),
      })
      .eq('id', userId)
      .select()
      .single();

    if (updateError) {
      console.error('Failed to update user:', updateError);
      throw updateError;
    }

    console.log('User login updated successfully:', {
      user_id: userId,
      email: updatedUser.email,
      isNewUser,
    });

    return updatedUser;
  } catch (error) {
    console.error('Failed to upsert user:', error);
    throw error;
  }
}

/**
 * 이메일로 사용자 조회
 */
export async function getUserByEmail(email: string) {
  try {
    const supabase = getServerSupabase();
    
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // 데이터 없음 (정상)
        return null;
      }
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Failed to get user by email:', error);
    throw error;
  }
}

/**
 * Provider와 Account ID로 사용자 조회
 */
export async function getUserByProviderAccount(provider: string, providerAccountId: string) {
  try {
    const supabase = getServerSupabase();
    
    const { data, error } = await supabase
      .from('user_providers')
      .select(`
        user_id,
        users (
          id,
          email,
          name,
          analysis_count,
          plan,
          created_at,
          updated_at,
          last_login_at
        )
      `)
      .eq('provider', provider)
      .eq('provider_account_id', providerAccountId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw error;
    }

    return (data?.users as any) as User | null;
  } catch (error) {
    console.error('Failed to get user by provider account:', error);
    throw error;
  }
}

/**
 * 사용자 ID로 연동된 모든 provider 조회
 */
export async function getUserProviders(userId: string): Promise<UserProvider[]> {
  try {
    const supabase = getServerSupabase();
    
    const { data, error } = await supabase
      .from('user_providers')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Failed to get user providers:', error);
    throw error;
  }
}

/**
 * 사용자 ID로 특정 provider 연동 해제
 */
export async function unlinkProvider(userId: string, provider: string): Promise<boolean> {
  try {
    const supabase = getServerSupabase();
    
    // 남은 provider 개수 확인 (최소 1개는 유지해야 함)
    const { data: providers } = await supabase
      .from('user_providers')
      .select('id')
      .eq('user_id', userId);

    if (!providers || providers.length <= 1) {
      throw new Error('최소 1개의 로그인 방법은 유지해야 합니다.');
    }

    // provider 연동 해제
    const { error } = await supabase
      .from('user_providers')
      .delete()
      .eq('user_id', userId)
      .eq('provider', provider);

    if (error) {
      throw error;
    }

    console.log('Provider unlinked successfully:', { userId, provider });
    return true;
  } catch (error) {
    console.error('Failed to unlink provider:', error);
    throw error;
  }
}

/**
 * 마지막 로그인 시간 업데이트
 */
export async function updateLastLogin(userId: string) {
  try {
    const supabase = getServerSupabase();
    
    const { error } = await supabase
      .from('users')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', userId);

    if (error) {
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Failed to update last login:', error);
    throw error;
  }
}

/**
 * 분석 횟수 차감
 */
export async function decrementAnalysisCount(email: string) {
  try {
    const supabase = getServerSupabase();
    
    // 현재 횟수 조회
    const { data: currentUser, error: fetchError } = await supabase
      .from('users')
      .select('analysis_count')
      .eq('email', email)
      .single();
    
    if (fetchError) throw fetchError;
    
    if (!currentUser || currentUser.analysis_count <= 0) {
      throw new Error('분석 가능 횟수가 없습니다.');
    }
    
    // 횟수 차감
    const { data, error } = await supabase
      .from('users')
      .update({ 
        analysis_count: currentUser.analysis_count - 1,
        updated_at: new Date().toISOString()
      })
      .eq('email', email)
      .select()
      .single();

    if (error) throw error;
    
    console.log('Analysis count decremented:', data);
    return data;
  } catch (error) {
    console.error('Failed to decrement analysis count:', error);
    throw error;
  }
}

/**
 * 남은 분석 횟수 조회
 */
export async function getAnalysisCount(email: string): Promise<number> {
  try {
    const supabase = getServerSupabase();
    
    const { data, error } = await supabase
      .from('users')
      .select('analysis_count')
      .eq('email', email)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return 0;
      }
      throw error;
    }

    return data?.analysis_count ?? 0;
  } catch (error) {
    console.error('Failed to get analysis count:', error);
    throw error;
  }
}

/**
 * 회원 탈퇴 - 사용자 완전 삭제
 * user_providers와 analyses_history는 ON DELETE CASCADE로 자동 삭제됨
 */
export async function deleteUser(userId: string): Promise<boolean> {
  try {
    const supabase = getServerSupabase();
    
    // 사용자 존재 여부 확인
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('id, email')
      .eq('id', userId)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        throw new Error('사용자를 찾을 수 없습니다.');
      }
      throw fetchError;
    }

    console.log('Deleting user:', {
      userId: existingUser.id,
      email: existingUser.email,
    });

    // 사용자 삭제 (CASCADE로 연관 데이터 자동 삭제)
    const { error: deleteError } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);

    if (deleteError) {
      console.error('Failed to delete user:', deleteError);
      throw deleteError;
    }

    console.log('User deleted successfully:', userId);
    return true;
  } catch (error) {
    console.error('Failed to delete user:', error);
    throw error;
  }
}
