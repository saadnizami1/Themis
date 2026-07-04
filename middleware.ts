export { default } from 'next-auth/middleware';

// Protect only officer-facing routes
// Victim routes (/interview/*, /api/interviews/token/*, question/submit/complete/video POST)
// are intentionally public
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/api/cases/:path*',
    '/api/upload',
  ],
};
