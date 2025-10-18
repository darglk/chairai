import type { APIRoute } from "astro";

export const prerender = false;

export const GET: APIRoute = async () => {
  return new Response(
    JSON.stringify({
      OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY ? "✓ Set" : "✗ Not set",
      SUPABASE_URL: process.env.SUPABASE_URL ? "✓ Set" : "✗ Not set",
      SUPABASE_KEY: process.env.SUPABASE_KEY ? "✓ Set" : "✗ Not set",
      NODE_ENV: process.env.NODE_ENV,
    }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
};
