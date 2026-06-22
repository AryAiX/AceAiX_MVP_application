import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

// ── Adaptable mapping layer ────────────────────────────────────────────────────
// PLACEHOLDER: Replace with actual Sportify Academy API endpoints and field names
// once the API contract is confirmed with Tooraj and Sportify Academy.
// All field names below map from Sportify's documented schema.

const SPORTIFY_BASE_URL = Deno.env.get("SPORTIFY_API_BASE_URL") ?? "https://api.sportifyacademy.com/v1";
const SPORTIFY_API_KEY = Deno.env.get("SPORTIFY_API_KEY") ?? "";

interface SportifyPhysicalResult {
  // [PLACEHOLDER — confirm field names from Sportify API docs]
  test_id: string;
  athlete_id: string;
  test_date: string;
  method: "camera" | "in_person";
  location: string;
  verification_ref: string;
  metrics: {
    sprint_10m?: number;
    sprint_40m?: number;
    vertical_jump?: number;
    broad_jump?: number;
    agility_5_10_5?: number;
    reaction_time_ms?: number;
    beep_test_level?: number;
    flexibility_sit_reach?: number;
    movement_quality_score?: number;
    strength_grip_kg?: number;
    push_ups?: number;
    [key: string]: number | undefined;
  };
}

interface SportifyTalentResult {
  // [PLACEHOLDER — confirm field names from Sportify API docs]
  assessment_id: string;
  athlete_id: string;
  assessment_date: string;
  location: string;
  verification_ref: string;
  general_metrics: {
    overall_athleticism?: number;
    coordination?: number;
    explosiveness?: number;
    endurance_base?: number;
    [key: string]: number | undefined;
  };
  sport_recommendations: Array<{
    sport: string;
    potential_score: number;
    rank: number;
    key_strengths: string[];
  }>;
}

// Map Sportify field names to AceAiX internal schema
function mapPhysicalMetrics(raw: SportifyPhysicalResult["metrics"]): Record<string, number> {
  const mapped: Record<string, number> = {};
  // [PLACEHOLDER — adjust key names per actual Sportify API response]
  if (raw.sprint_10m != null)                mapped.sprint_10m            = raw.sprint_10m;
  if (raw.sprint_40m != null)                mapped.sprint_40m            = raw.sprint_40m;
  if (raw.vertical_jump != null)             mapped.vertical_jump         = raw.vertical_jump;
  if (raw.broad_jump != null)                mapped.broad_jump            = raw.broad_jump;
  if (raw.agility_5_10_5 != null)            mapped.agility_5_10_5        = raw.agility_5_10_5;
  if (raw.reaction_time_ms != null)          mapped.reaction_time         = raw.reaction_time_ms;
  if (raw.beep_test_level != null)           mapped.beep_test_level       = raw.beep_test_level;
  if (raw.flexibility_sit_reach != null)     mapped.flexibility_sit_reach = raw.flexibility_sit_reach;
  if (raw.movement_quality_score != null)    mapped.movement_quality      = raw.movement_quality_score;
  if (raw.strength_grip_kg != null)          mapped.strength_grip         = raw.strength_grip_kg;
  if (raw.push_ups != null)                  mapped.push_ups              = raw.push_ups;
  return mapped;
}

async function fetchAthleteResults(sportifyAthleteId: string): Promise<{
  physical: SportifyPhysicalResult[];
  talent: SportifyTalentResult | null;
}> {
  if (!SPORTIFY_API_KEY) {
    // No API key configured — return empty (connector not yet live)
    console.warn("SPORTIFY_API_KEY not set — connector not live yet");
    return { physical: [], talent: null };
  }

  const headers = {
    "Authorization": `Bearer ${SPORTIFY_API_KEY}`,
    "Content-Type": "application/json",
  };

  // [PLACEHOLDER — confirm endpoint paths from Sportify API docs]
  const [physRes, talentRes] = await Promise.all([
    fetch(`${SPORTIFY_BASE_URL}/athletes/${sportifyAthleteId}/physical-tests`, { headers }),
    fetch(`${SPORTIFY_BASE_URL}/athletes/${sportifyAthleteId}/talent-assessment`, { headers }),
  ]);

  const physical: SportifyPhysicalResult[] = physRes.ok ? await physRes.json() : [];
  const talent: SportifyTalentResult | null = talentRes.ok ? await talentRes.json() : null;

  return { physical, talent };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { athlete_id } = await req.json();
    if (!athlete_id) {
      return new Response(JSON.stringify({ error: "athlete_id required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Verify consent before importing
    const { data: consent } = await supabase
      .from("sportify_consents")
      .select("granted_at, revoked_at")
      .eq("athlete_id", athlete_id)
      .maybeSingle();

    if (!consent?.granted_at || consent.revoked_at) {
      return new Response(JSON.stringify({ error: "No active consent for this athlete" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get Sportify athlete ID from profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("sportify_athlete_id, sportify_linked")
      .eq("id", athlete_id)
      .single();

    if (!profile?.sportify_linked || !profile.sportify_athlete_id) {
      return new Response(JSON.stringify({ error: "Sportify account not linked" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch from Sportify API
    const { physical, talent } = await fetchAthleteResults(profile.sportify_athlete_id);

    const now = new Date().toISOString();
    const upsertRows: any[] = [];

    // Map and upsert physical results
    for (const result of physical) {
      upsertRows.push({
        athlete_id,
        test_type: "physical",
        method: result.method,
        metrics: mapPhysicalMetrics(result.metrics),
        recommended_sports: [],
        tested_at: result.test_date,
        academy_location: result.location,
        verification_ref: result.verification_ref,
        source: "Sportify Academy",
        last_synced_at: now,
      });
    }

    // Map and upsert talent assessment
    if (talent) {
      upsertRows.push({
        athlete_id,
        test_type: "talent",
        method: "in_person",
        metrics: talent.general_metrics,
        recommended_sports: talent.sport_recommendations.map((sr) => ({
          sport: sr.sport,
          potential_score: sr.potential_score,
          rank: sr.rank,
          strengths: sr.key_strengths,
        })),
        tested_at: talent.assessment_date,
        academy_location: talent.location,
        verification_ref: talent.verification_ref,
        source: "Sportify Academy",
        last_synced_at: now,
      });
    }

    if (upsertRows.length > 0) {
      const { error: upsertError } = await supabase
        .from("sportify_results")
        .upsert(upsertRows, { onConflict: "athlete_id,tested_at,test_type" });

      if (upsertError) {
        return new Response(JSON.stringify({ error: upsertError.message }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    return new Response(
      JSON.stringify({
        ok: true,
        synced: upsertRows.length,
        note: SPORTIFY_API_KEY
          ? "Live sync complete"
          : "Connector not yet live — SPORTIFY_API_KEY not configured. Confirm endpoints and credentials with Tooraj.",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
