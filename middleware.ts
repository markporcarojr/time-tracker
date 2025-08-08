// middleware.ts
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Explicitly define which routes require auth
const isProtectedRoute = createRouteMatcher([
  "/(.*)",
  "/finance(.*)",
  "/settings(.*)",
  "/hives(.*)",
  "/inventory(.*)",
  "/inspection(.*)",
  "/swarm(.*)",
  "/harvest(.*)",
  "/users(.*)",
  "/api/(.*)",
  // Protect all API routes
  // Add more as needed — don't include / or /sign-in etc.
]);

export default clerkMiddleware(async (auth, req) => {
  if (req.nextUrl.pathname.startsWith("/api/webhooks/clerk")) return;
  if (isProtectedRoute(req)) {
    await auth.protect(); // Redirects to sign-in if unauthenticated
  }
});

export const config = {
  matcher: [
    // Match everything dynamic excluding static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
