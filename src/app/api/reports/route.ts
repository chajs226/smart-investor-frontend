import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getServerSupabase } from '@/lib/supabaseServer';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const url = new URL(req.url);
  const market = url.searchParams.get('market') || undefined;
  const q = url.searchParams.get('q') || undefined;

  const supabase = getServerSupabase();
  let query = supabase.from('reports').select('*').order('created_at', { ascending: false });
  if (market) query = query.eq('market', market);
  if (q) {
    // Simple OR filter for symbol/name
    query = query.or(`symbol.ilike.%${q}%,name.ilike.%${q}%`);
  }
  const { data, error } = await query.limit(50);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ items: data });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const body = await req.json();
  const supabase = getServerSupabase();
  const { data, error } = await supabase.from('reports').insert({
    market: body.market,
    symbol: body.symbol,
    name: body.name,
    sector: body.sector,
    report: body.report,
  }).select('*').single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}


