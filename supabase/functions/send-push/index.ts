import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

interface PushPayload {
  user_id: string;
  type: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

function isInQuietHours(quietStart: string, quietEnd: string): boolean {
  const now = new Date();
  const hour = now.getUTCHours();
  const minute = now.getUTCMinutes();
  const nowMinutes = hour * 60 + minute;

  const [sh, sm] = quietStart.split(":").map(Number);
  const [eh, em] = quietEnd.split(":").map(Number);
  const startMinutes = sh * 60 + sm;
  const endMinutes = eh * 60 + em;

  if (startMinutes < endMinutes) {
    return nowMinutes >= startMinutes && nowMinutes < endMinutes;
  }
  // wraps midnight
  return nowMinutes >= startMinutes || nowMinutes < endMinutes;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 200, headers: corsHeaders });

  try {
    const payload: PushPayload = await req.json();
    const { user_id, type, title, body, data = {} } = payload;

    if (!user_id || !title || !body) {
      return new Response(JSON.stringify({ error: "user_id, title, body required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Insert in-app notification
    await supabase.from("notifications").insert({
      user_id,
      type: type ?? "system",
      title,
      body,
      data,
    });

    // Look up push tokens and user prefs
    const [{ data: tokens }, { data: profile }] = await Promise.all([
      supabase.from("push_tokens").select("token, platform").eq("user_id", user_id),
      supabase.from("profiles").select("notification_prefs").eq("id", user_id).maybeSingle(),
    ]);

    const prefs = (profile?.notification_prefs ?? {}) as Record<string, unknown>;
    const pushEnabled = prefs.push_enabled !== false;
    const categoryEnabled = prefs[type] !== false;

    if (!pushEnabled || !categoryEnabled || !tokens?.length) {
      return new Response(JSON.stringify({ ok: true, push_sent: false, reason: "push disabled or no tokens" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check quiet hours
    const quietStart = (prefs.quiet_start as string) ?? "22:00";
    const quietEnd = (prefs.quiet_end as string) ?? "07:00";
    if (isInQuietHours(quietStart, quietEnd)) {
      return new Response(JSON.stringify({ ok: true, push_sent: false, reason: "quiet hours" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Send via Expo Push API
    const messages = tokens.map((row: { token: string }) => ({
      to: row.token,
      title,
      body,
      data: { ...data, type },
      sound: "default",
      priority: "high",
    }));

    const pushRes = await fetch(EXPO_PUSH_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify(messages),
    });

    const pushJson = await pushRes.json();

    return new Response(JSON.stringify({ ok: true, push_sent: true, result: pushJson }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
