import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const log: string[] = [];

  // List and delete existing user
  const { data: listData, error: listError } = await supabaseAdmin.auth.admin.listUsers();
  if (listError) {
    log.push("listUsers error: " + JSON.stringify(listError));
  } else {
    const found = listData?.users?.find((u: { email?: string }) => u.email === "athlete@aceaix.com");
    if (found) {
      const { error: delErr } = await supabaseAdmin.auth.admin.deleteUser(found.id);
      log.push(delErr ? "delete error: " + JSON.stringify(delErr) : "deleted old user: " + found.id);
    } else {
      log.push("no existing user found");
    }
  }

  // Create fresh via admin API
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email: "athlete@aceaix.com",
    password: "Athlete123!",
    email_confirm: true,
    user_metadata: { role: "athlete", full_name: "Test Athlete" },
  });

  if (error) {
    log.push("createUser error: " + JSON.stringify(error));
    return new Response(JSON.stringify({ ok: false, log }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  log.push("created user: " + data.user.id);

  // Upsert profile row
  const { error: profileErr } = await supabaseAdmin.from("profiles").upsert({
    id: data.user.id,
    role: "athlete",
    full_name: "Test Athlete",
  });

  if (profileErr) {
    log.push("profile upsert error: " + JSON.stringify(profileErr));
  } else {
    log.push("profile upserted");
  }

  return new Response(
    JSON.stringify({ ok: true, email: "athlete@aceaix.com", password: "Athlete123!", log }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
