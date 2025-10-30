import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Only process category paths
  if (pathname.split('/').length === 2) {
    const parts = pathname.split('/');
    const category = parts[1];
    
    // If the category is not in lowercase, redirect to lowercase version
    if (category !== category.toLowerCase()) {
      const newUrl = new URL(request.url);
      newUrl.pathname = `/${category.toLowerCase()}`;
      return NextResponse.redirect(newUrl);
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
