import { getServerSupabase } from '../supabaseServer';

export interface User {
  id?: string;
  email: string;
  provider: string;
  provider_account_id: string;
  name?: string;
  analysis_count?: number; // 남은 분석 가능 횟수
  plan?: 'free' | 'paid';  // 사용자 플랜
  created_at?: string;
  updated_at?: string;
  last_login_at?: string;
}

/**
 * 사용자 정보 생성 또는 업데이트
 */
export async function upsertUser(userData: Omit<User, 'id' | 'created_at' | 'updated_at' | 'analysis_count' | 'plan'>) {
  try {
    const supabase = getServerSupabase();
    
    // 먼저 기존 사용자 확인
    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('provider', userData.provider)
      .eq('provider_account_id', userData.provider_account_id)
      .single();
    
    const { data, error } = await supabase
      .from('users')
      .upsert(
        {
          email: userData.email,
          provider: userData.provider,
          provider_account_id: userData.provider_account_id,
          name: userData.name,
          // 신규 사용자에게만 기본값 설정, 기존 사용자는 유지
          ...(existingUser ? {} : { 
            analysis_count: 10, 
            plan: 'free' 
          }),
          last_login_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'provider,provider_account_id',
        }
      )
      .select()
      .single();

    if (error) {
      console.error('Supabase upsert error:', error);
      throw error;
    }

    console.log('User upserted successfully:', data);
    return data;
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
      .from('users')
      .select('*')
      .eq('provider', provider)
      .eq('provider_account_id', providerAccountId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Failed to get user by provider account:', error);
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
