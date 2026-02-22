import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isLoginPage = pathname === '/login';
  const isSignupPage = pathname === '/signup';
  const isAcceptInvitationPage = pathname === '/accept-invitation';
  const isForgotPasswordPage = pathname === '/forgot-password';
  const isResetPasswordPage = pathname === '/reset-password';
  const isRootPage = pathname === '/';
  const isApiRoute = pathname.startsWith('/api/');
  const isAuthPage = isLoginPage || isSignupPage || isAcceptInvitationPage || isForgotPasswordPage || isResetPasswordPage;

  // Check if email is confirmed
  const isEmailConfirmed = user?.email_confirmed_at != null;

  // Root always redirects
  if (isRootPage) {
    const url = request.nextUrl.clone();
    if (!user) {
      url.pathname = '/login';
    } else if (!isEmailConfirmed) {
      url.pathname = '/signup'; // Stay on signup to show email verification
    } else {
      url.pathname = '/dashboard';
    }
    return NextResponse.redirect(url);
  }

  // Not authenticated → redirect to login (except on auth/api pages)
  if (!user && !isAuthPage && !isApiRoute) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // Authenticated but email not confirmed → keep on signup page
  if (user && !isEmailConfirmed && !isSignupPage) {
    const url = request.nextUrl.clone();
    url.pathname = '/signup';
    return NextResponse.redirect(url);
  }

  // Already authenticated with confirmed email on login or signup → redirect to dashboard
  // Exception: reset-password page (user arrives via recovery link)
  if (user && isEmailConfirmed && isAuthPage && !isResetPasswordPage) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
