import { getServerSupabase } from '../supabaseServer';

export interface User {
  id?: string;
  email: string;
  provider: string;
  provider_account_id: string;
  name?: string;
  created_at?: string;
  updated_at?: string;
  last_login_at?: string;
}

/**
 * 사용자 정보 생성 또는 업데이트
 */
export async function upsertUser(userData: Omit<User, 'id' | 'created_at' | 'updated_at'>) {
  try {
    const supabase = getServerSupabase();
    
    const { data, error } = await supabase
      .from('users')
      .upsert(
        {
          email: userData.email,
          provider: userData.provider,
          provider_account_id: userData.provider_account_id,
          name: userData.name,
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
