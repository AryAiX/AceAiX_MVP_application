import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

// Sports covered by API-Sports multi-sport provider
const COVERED_SPORTS = new Set([
  "football", "basketball", "volleyball", "hockey", "handball",
  "rugby", "baseball", "american-football", "mma",
]);

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 200, headers: corsHeaders });

  try {
    const { athlete_id, sport, player_id, season } = await req.json();
    if (!athlete_id || !sport) {
      return new Response(JSON.stringify({ error: "athlete_id and sport required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("SPORTS_API_KEY");
    const sportSlug = String(sport).toLowerCase();

    if (!COVERED_SPORTS.has(sportSlug)) {
      return new Response(JSON.stringify({
        ok: false,
        fallback: true,
        reason: `${sport} is not covered by the multi-sport provider. Please use self-reported entry.`,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (!apiKey) {
      return new Response(JSON.stringify({
        ok: false,
        fallback: true,
        reason: "SPORTS_API_KEY not configured. Contact admin to enable API sync.",
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (!player_id) {
      return new Response(JSON.stringify({
        ok: false,
        fallback: true,
        reason: "player_id required for API-Sports sync. Ask admin to link your player ID.",
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const currentSeason = season ?? new Date().getFullYear();
    const url = `https://v3.football.api-sports.io/players?id=${player_id}&season=${currentSeason}`;
    const res = await fetch(url, {
      headers: { "x-apisports-key": apiKey },
    });

    if (!res.ok) {
      return new Response(JSON.stringify({ error: `API-Sports returned ${res.status}` }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await res.json();
    const playerData = data?.response?.[0];
    if (!playerData) {
      return new Response(JSON.stringify({ error: "No player data found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Map API-Sports response to generic stats object
    const stats = mapPlayerStats(sportSlug, playerData);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
    const { error } = await supabase.from("performance_records").upsert(
      {
        athlete_id,
        sport: sportSlug,
        season_or_period: String(currentSeason),
        stats,
        source: "api_sports",
        last_synced_at: new Date().toISOString(),
      },
      { onConflict: "athlete_id,sport,season_or_period" }
    );
    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true, stats, source: "api_sports" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function mapPlayerStats(sport: string, data: any): Record<string, number | string> {
  const s = data.statistics?.[0] ?? {};
  if (sport === "football") {
    return {
      goals: s.goals?.total ?? 0,
      assists: s.goals?.assists ?? 0,
      appearances: s.games?.appearences ?? 0,
      pass_acc: s.passes?.accuracy ?? 0,
      shots_per_game: s.shots?.total ? (s.shots.total / Math.max(s.games?.appearences ?? 1, 1)) : 0,
      avg_rating: parseFloat(s.games?.rating ?? "0"),
    };
  }
  if (sport === "basketball") {
    return {
      points: s.points ?? 0,
      rebounds: (s.totReb ?? 0),
      assists: s.assists ?? 0,
      steals: s.steals ?? 0,
      blocks: s.blocks ?? 0,
      fg_pct: s.fgp ?? 0,
      three_pct: s.tpp ?? 0,
      minutes: parseFloat(s.min ?? "0"),
    };
  }
  return s;
}
