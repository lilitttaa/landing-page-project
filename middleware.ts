import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || '';
  const url = request.nextUrl.clone();

  // Handle subdomain routing
  if (hostname) {
    // In development, we'll handle subdomains differently
    if (process.env.NODE_ENV === 'development') {
      // Check if the request is for a project subdomain pattern
      const match = hostname.match(/^project-(\d+)\.localhost:(\d+)$/);
      if (match) {
        const projectId = match[1];
        url.pathname = `/deployed/project-${projectId}${url.pathname}`;
        return NextResponse.rewrite(url);
      }
    } else {
      // Production subdomain handling
      const mainDomain = 'yourdomain.com';
      const subdomain = hostname.replace(`.${mainDomain}`, '').replace(mainDomain, '');
      
      if (subdomain && subdomain.startsWith('project-') && subdomain !== hostname) {
        url.pathname = `/deployed/${subdomain}${url.pathname}`;
        return NextResponse.rewrite(url);
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};