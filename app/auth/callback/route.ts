import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next');
  const safeNext = next?.startsWith('/') ? next : '/';

  if (!code) {
    const authError =
      requestUrl.searchParams.get('error_description') ||
      requestUrl.searchParams.get('error');

    if (authError) {
      const url = new URL('/auth', requestUrl.origin);
      url.searchParams.set('error', 'auth_callback_failed');
      url.searchParams.set('message', authError);
      if (safeNext !== '/') url.searchParams.set('next', safeNext);
      return NextResponse.redirect(url);
    }

    return NextResponse.redirect(new URL('/auth', requestUrl.origin));
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    }
  );

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    const url = new URL('/auth', requestUrl.origin);
    url.searchParams.set('error', 'auth_callback_failed');
    url.searchParams.set('message', error.message);
    if (safeNext !== '/') url.searchParams.set('next', safeNext);
    return NextResponse.redirect(url);
  }

  return NextResponse.redirect(new URL(safeNext, requestUrl.origin));
}
