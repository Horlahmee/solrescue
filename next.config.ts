import type { NextConfig } from "next";

// Security headers for a wallet-connected app. frame-ancestors + X-Frame-Options
// block clickjacking of the sign button; CSP limits any future XSS blast radius
// while allowing the RPC, Supabase, wallet adapters, and Vercel analytics.
const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      // Next.js requires inline/eval for its runtime; wallet adapters inject scripts.
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      // RPC (Helius), Supabase REST/Realtime, Vercel analytics, and wallets.
      "connect-src 'self' https://*.helius-rpc.com https://*.supabase.co wss://*.supabase.co https://*.vercel-insights.com https://*.solana.com wss://*.solana.com",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
