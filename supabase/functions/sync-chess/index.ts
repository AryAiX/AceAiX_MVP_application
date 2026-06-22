import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const UA = "AceAiX/1.0 (info@aryaix.com) athlete-performance-platform";

// ── Chess.com helpers ─────────────────────────────────────────────────────────
async function fetchChessCom(path: string) {
  const res = await fetch(`https://api.chess.com/pub${path}`, {
    headers: { "User-Agent": UA },
  });
  if (!res.ok) return null;
  return res.json();
}

async function getChessComData(username: string) {
  const [profile, stats, archives] = await Promise.all([
    fetchChessCom(`/player/${username}`),
    fetchChessCom(`/player/${username}/stats`),
    fetchChessCom(`/player/${username}/games/archives`),
  ]);

  let recent_games: any[] = [];
  if (archives?.archives?.length) {
    const lastArchiveUrl = archives.archives[archives.archives.length - 1];
    try {
      const res = await fetch(lastArchiveUrl, { headers: { "User-Agent": UA } });
      if (res.ok) {
        const { games } = await res.json();
        recent_games = (games ?? [])
          .slice(-15)
          .reverse()
          .map((g: any) => {
            const isWhite = g.white?.username?.toLowerCase() === username.toLowerCase();
            const raw = isWhite ? g.white?.result : g.black?.result;
            const result = raw === "win" ? "win" : raw === "agreed" || raw === "repetition" || raw === "stalemate" || raw === "insufficient" || raw === "50move" || raw === "timevsinsufficient" ? "draw" : "loss";
            const opponent = isWhite ? g.black?.username : g.white?.username;
            const opponentRating = isWhite ? g.black?.rating : g.white?.rating;
            const accuracy = isWhite ? g.accuracies?.white : g.accuracies?.black;
            // Parse opening from PGN
            const openingMatch = g.pgn?.match(/\[Opening "([^"]+)"\]/);
            const opening = openingMatch?.[1] ?? null;
            const dateMatch = g.pgn?.match(/\[Date "([^"]+)"\]/);
            const date = dateMatch?.[1]?.replace(/\./g, "-") ?? null;
            return { opponent, opponentRating, result, time_class: g.time_class, opening, date, accuracy: accuracy ? Math.round(accuracy) : null, url: g.url };
          });
      }
    } catch (_) { /* ignore */ }
  }

  return { profile, stats, recent_games };
}

function parseChessComVariant(variantData: any) {
  if (!variantData) return null;
  return {
    current: variantData.last?.rating ?? null,
    peak: variantData.best?.rating ?? null,
    wins: variantData.record?.win ?? 0,
    losses: variantData.record?.loss ?? 0,
    draws: variantData.record?.draw ?? 0,
  };
}

// ── Lichess helpers ───────────────────────────────────────────────────────────
async function fetchLichess(path: string, token?: string | null) {
  const headers: Record<string, string> = { "Accept": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`https://lichess.org/api${path}`, { headers });
  if (!res.ok) return null;
  return res.json();
}

async function getLichessData(username: string, token?: string | null) {
  const [user, ratingHistory] = await Promise.all([
    fetchLichess(`/user/${username}`, token),
    fetchLichess(`/user/${username}/rating-history`, token),
  ]);
  return { user, ratingHistory };
}

function normalizeLichessHistory(rawHistory: any[] | null): Record<string, Array<{ ts: string; r: number }>> {
  if (!rawHistory) return {};
  const result: Record<string, Array<{ ts: string; r: number }>> = {};
  const variantMap: Record<string, string> = {
    Bullet: "bullet", Blitz: "blitz", Rapid: "rapid", Classical: "classical", Correspondence: "correspondence",
  };
  for (const item of rawHistory) {
    const key = variantMap[item.name];
    if (!key) continue;
    result[key] = (item.points ?? []).map(([year, month, day, rating]: number[]) => ({
      ts: `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
      r: rating,
    }));
  }
  return result;
}

// ── Main handler ──────────────────────────────────────────────────────────────
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 200, headers: corsHeaders });

  try {
    const { athlete_id, chesscom_username, lichess_username } = await req.json();
    if (!athlete_id) {
      return new Response(JSON.stringify({ error: "athlete_id required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!chesscom_username && !lichess_username) {
      return new Response(JSON.stringify({ error: "At least one username required" }), {
        status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const lichessToken = Deno.env.get("LICHESS_TOKEN") ?? null;

    // Fetch both sources in parallel
    const [chessComResult, lichessResult] = await Promise.all([
      chesscom_username ? getChessComData(chesscom_username) : Promise.resolve(null),
      lichess_username ? getLichessData(lichess_username, lichessToken) : Promise.resolve(null),
    ]);

    const cc = chessComResult;
    const lc = lichessResult;

    // Merge ratings — Chess.com is primary; Lichess fills gaps
    const rapid = parseChessComVariant(cc?.stats?.chess_rapid)
      ?? (lc?.user?.perfs?.rapid ? { current: lc.user.perfs.rapid.rating, peak: null, wins: lc.user.perfs.rapid.games ?? 0, losses: 0, draws: 0 } : null);
    const blitz = parseChessComVariant(cc?.stats?.chess_blitz)
      ?? (lc?.user?.perfs?.blitz ? { current: lc.user.perfs.blitz.rating, peak: null, wins: lc.user.perfs.blitz.games ?? 0, losses: 0, draws: 0 } : null);
    const bullet = parseChessComVariant(cc?.stats?.chess_bullet)
      ?? (lc?.user?.perfs?.bullet ? { current: lc.user.perfs.bullet.rating, peak: null, wins: lc.user.perfs.bullet.games ?? 0, losses: 0, draws: 0 } : null);
    const classical = parseChessComVariant(cc?.stats?.chess_daily)
      ?? (lc?.user?.perfs?.classical ? { current: lc.user.perfs.classical.rating, peak: null, wins: lc.user.perfs.classical.games ?? 0, losses: 0, draws: 0 } : null);

    const title = cc?.profile?.title ?? lc?.user?.title ?? null;
    const fide_rating = lc?.user?.profile?.fideRating ?? null;
    const rating_history = normalizeLichessHistory(lc?.ratingHistory ?? null);
    const recent_games = cc?.recent_games ?? [];

    const sources: string[] = [];
    if (cc) sources.push("chesscom");
    if (lc?.user) sources.push("lichess");

    const upsert_data: Record<string, any> = {
      athlete_id,
      source: sources.join(",") || "self_reported",
      last_synced_at: new Date().toISOString(),
      rating_history,
      recent_games,
      title,
      fide_rating,
    };

    if (rapid) { upsert_data.rapid_current = rapid.current; upsert_data.rapid_peak = rapid.peak; upsert_data.rapid_wins = rapid.wins; upsert_data.rapid_losses = rapid.losses; upsert_data.rapid_draws = rapid.draws; }
    if (blitz) { upsert_data.blitz_current = blitz.current; upsert_data.blitz_peak = blitz.peak; upsert_data.blitz_wins = blitz.wins; upsert_data.blitz_losses = blitz.losses; upsert_data.blitz_draws = blitz.draws; }
    if (bullet) { upsert_data.bullet_current = bullet.current; upsert_data.bullet_peak = bullet.peak; upsert_data.bullet_wins = bullet.wins; upsert_data.bullet_losses = bullet.losses; upsert_data.bullet_draws = bullet.draws; }
    if (classical) { upsert_data.classical_current = classical.current; upsert_data.classical_peak = classical.peak; upsert_data.classical_wins = classical.wins; upsert_data.classical_losses = classical.losses; upsert_data.classical_draws = classical.draws; }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
    const { error } = await supabase
      .from("chess_stats")
      .upsert(upsert_data, { onConflict: "athlete_id" });

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true, sources, rapid, blitz, bullet, classical, title, fide_rating }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
