import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Protect all dashboard routes and API routes
const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/api/workspace(.*)",
  "/api/forms(.*)",
  "/api/user(.*)",
  "/api/favorites(.*)"
]);

// Public form routes that don't require authentication
const isPublicFormRoute = createRouteMatcher([
  "/forms/(.*)$" // Only allow public access to the form view
]);

export default clerkMiddleware(async (auth, req) => {
  // Get the path from the URL
  const path = new URL(req.url).pathname;

  // Always protect dashboard and protected API routes
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
  
  // Public form routes don't need auth
  if (isPublicFormRoute(req)) {
    return NextResponse.next();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};