// Deploy with: supabase functions deploy create-preview
// Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY as Edge Function secrets.
// The service role key must NEVER be placed in the frontend.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  try {
    const { path } = await req.json();
    if (typeof path !== "string" || path.length > 500) {
      return Response.json({ error: "Invalid path" }, { status: 400 });
    }
    const url = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const db = createClient(url, serviceKey);

    // Only issue a preview URL for a file attached to a currently published item.
    const { data: item, error: itemError } = await db
      .from("portfolio_items").select("id").eq("file_path", path)
      .eq("published", true).maybeSingle();
    if (itemError || !item) return Response.json({ error: "Not found" }, { status: 404 });

    const { data, error } = await db.storage.from("portfolio-private")
      .createSignedUrl(path, 90, { download: false });
    if (error || !data?.signedUrl) return Response.json({ error: "Preview unavailable" }, { status: 404 });
    return Response.json({ url: data.signedUrl }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ error: "Bad request" }, { status: 400 });
  }
});