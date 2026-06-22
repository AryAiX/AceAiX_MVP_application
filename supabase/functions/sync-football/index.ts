import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

// Leagues with known good player-level coverage in API-Football
const WELL_COVERED_LEAGUES = new Set([
  "Premier League", "La Liga", "Serie A", "Bundesliga", "Ligue 1",
  "Saudi Pro League", "J1 League", "MLS", "Liga MX", "Eredivisie",
  "Primeira Liga", "UEFA Champions League", "UEFA Europa League",
]);

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 200, headers: corsHeaders });

  try {
    const { athlete_id, player_id, season, league } = await req.json();
    if (!athlete_id || !player_id) {
      return new Response(JSON.stringify({ error: "athlete_id and player_id required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("FOOTBALL_API_KEY") ?? Deno.env.get("SPORTS_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ ok: false, fallback: true, reason: "FOOTBALL_API_KEY not configured. Contact Tooraj to enable API sync." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Warn if league likely has no player-level stats
    if (league && !WELL_COVERED_LEAGUES.has(league)) {
      // Still try — but flag it
    }

    const currentSeason = season ?? new Date().getFullYear();
    const url = `https://v3.football.api-sports.io/players?id=${player_id}&season=${currentSeason}`;
    const res = await fetch(url, {
      headers: { "x-apisports-key": apiKey },
    });

    if (!res.ok) {
      return new Response(JSON.stringify({ error: `API-Football returned ${res.status}` }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const json = await res.json();
    const playerEntry = json?.response?.[0];
    if (!playerEntry) {
      return new Response(JSON.stringify({ ok: false, fallback: true, reason: "No player data found. The athlete's league may not have player-level stats in API-Football. Using self-reported data." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const s = playerEntry.statistics?.[0] ?? {};
    const upsert_data = {
      athlete_id,
      season: String(currentSeason),
      team: s.team?.name ?? null,
      league: s.league?.name ?? null,
      apps: s.games?.appearences ?? 0,
      goals: s.goals?.total ?? 0,
      assists: s.goals?.assists ?? 0,
      minutes: s.games?.minutes ?? 0,
      rating: s.games?.rating ? parseFloat(s.games.rating) : null,
      shots_total: s.shots?.total ?? 0,
      shots_on: s.shots?.on ?? 0,
      passes_accuracy: s.passes?.accuracy ? parseFloat(s.passes.accuracy) : null,
      dribbles_success: s.dribbles?.success ?? 0,
      tackles: s.tackles?.total ?? 0,
      yellow_cards: s.cards?.yellow ?? 0,
      red_cards: s.cards?.red ?? 0,
      attributes: {
        position: s.games?.position ?? null,
        key_passes: s.passes?.key ?? 0,
        big_chances_missed: s.goals?.missed ?? 0,
        saves: s.goals?.saves ?? 0,
        intercepted: s.tackles?.interceptions ?? 0,
        clearances: s.tackles?.blocks ?? 0,
      },
      source: "api_football",
      last_synced_at: new Date().toISOString(),
    };

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
    const { error } = await supabase
      .from("football_stats")
      .upsert(upsert_data, { onConflict: "athlete_id,season" });

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true, data: upsert_data, source: "api_football" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
