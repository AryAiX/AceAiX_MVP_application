import { supabase } from '@/lib/supabase';

// ── Types ─────────────────────────────────────────────────────────────────────

export type TestType = 'physical' | 'talent';
export type TestMethod = 'camera' | 'in_person';
export type AppointmentStatus = 'requested' | 'confirmed' | 'completed' | 'cancelled';
export type ConsentingParty = 'athlete' | 'guardian';

export interface PhysicalMetrics {
  sprint_10m?: number;       // seconds
  sprint_40m?: number;       // seconds
  vertical_jump?: number;    // cm
  broad_jump?: number;       // cm
  agility_5_10_5?: number;   // seconds
  reaction_time?: number;    // ms
  beep_test_level?: number;  // level
  push_ups?: number;
  flexibility_sit_reach?: number; // cm
  strength_grip?: number;    // kg
  movement_quality?: number; // 0-100 score
  [key: string]: number | undefined;
}

export interface RecommendedSport {
  sport: string;
  potential_score: number; // 0-100
  strengths: string[];
  rank: number;
}

export interface SportifyResult {
  id: string;
  athlete_id: string;
  test_type: TestType;
  method: TestMethod;
  metrics: PhysicalMetrics | Record<string, unknown>;
  recommended_sports: RecommendedSport[];
  tested_at: string;
  academy_location: string | null;
  verification_ref: string | null;
  source: string;
  last_synced_at: string;
  created_at: string;
}

export interface SportifyConsent {
  id: string;
  athlete_id: string;
  consenting_party: ConsentingParty;
  scope: string;
  granted_at: string | null;
  revoked_at: string | null;
  guardian_name: string | null;
  guardian_email: string | null;
  created_at: string;
}

export interface Appointment {
  id: string;
  athlete_id: string;
  academy_location: string;
  test_type: string;
  preferred_times: string[];
  scheduled_at: string | null;
  status: AppointmentStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── Consent ───────────────────────────────────────────────────────────────────

export async function fetchConsent(athleteId: string): Promise<SportifyConsent | null> {
  const { data } = await supabase
    .from('sportify_consents')
    .select('*')
    .eq('athlete_id', athleteId)
    .maybeSingle();
  return data ?? null;
}

export async function grantConsent(params: {
  athleteId: string;
  consentingParty: ConsentingParty;
  guardianName?: string;
  guardianEmail?: string;
}): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('sportify_consents')
    .upsert({
      athlete_id: params.athleteId,
      consenting_party: params.consentingParty,
      scope: 'test_results,talent_assessment',
      granted_at: new Date().toISOString(),
      revoked_at: null,
      guardian_name: params.guardianName ?? null,
      guardian_email: params.guardianEmail ?? null,
    }, { onConflict: 'athlete_id' });
  return { error: error?.message ?? null };
}

export async function revokeConsent(athleteId: string): Promise<void> {
  await supabase
    .from('sportify_consents')
    .update({ revoked_at: new Date().toISOString() })
    .eq('athlete_id', athleteId);
  // Also unlink
  await supabase
    .from('profiles')
    .update({ sportify_linked: false, sportify_athlete_id: null })
    .eq('id', athleteId);
}

export async function deleteImportedData(athleteId: string): Promise<void> {
  await supabase.from('sportify_results').delete().eq('athlete_id', athleteId);
  await revokeConsent(athleteId);
}

// ── Results ───────────────────────────────────────────────────────────────────

export async function fetchSportifyResults(athleteId: string): Promise<SportifyResult[]> {
  const { data } = await supabase
    .from('sportify_results')
    .select('*')
    .eq('athlete_id', athleteId)
    .order('tested_at', { ascending: false });
  return data ?? [];
}

export async function upsertDemoResults(athleteId: string): Promise<void> {
  const now = new Date();
  const twoMonthsAgo = new Date(now.getTime() - 60 * 86400000).toISOString();
  const fourMonthsAgo = new Date(now.getTime() - 120 * 86400000).toISOString();

  await supabase.from('sportify_results').upsert([
    {
      athlete_id: athleteId,
      test_type: 'physical',
      method: 'in_person',
      metrics: {
        sprint_10m: 1.72,
        sprint_40m: 4.68,
        vertical_jump: 68,
        broad_jump: 245,
        agility_5_10_5: 4.31,
        reaction_time: 198,
        beep_test_level: 12.4,
        flexibility_sit_reach: 32,
        movement_quality: 84,
      },
      recommended_sports: [],
      tested_at: twoMonthsAgo,
      academy_location: 'Sportify Academy — Dubai Sports City',
      verification_ref: 'SPF-2026-04-8821',
      source: 'Sportify Academy',
      last_synced_at: new Date().toISOString(),
    },
    {
      athlete_id: athleteId,
      test_type: 'physical',
      method: 'camera',
      metrics: {
        sprint_10m: 1.78,
        vertical_jump: 64,
        agility_5_10_5: 4.47,
        reaction_time: 214,
        movement_quality: 79,
      },
      recommended_sports: [],
      tested_at: fourMonthsAgo,
      academy_location: 'Camera Test (Mobile)',
      verification_ref: 'SPF-CAM-2026-02-3310',
      source: 'Sportify Academy',
      last_synced_at: new Date().toISOString(),
    },
    {
      athlete_id: athleteId,
      test_type: 'talent',
      method: 'in_person',
      metrics: {
        overall_athleticism: 87,
        coordination: 82,
        explosiveness: 91,
        endurance_base: 76,
      },
      recommended_sports: [
        { sport: 'Football', potential_score: 91, rank: 1, strengths: ['Explosiveness', 'Speed', 'Agility'] },
        { sport: 'Athletics (Sprint)', potential_score: 88, rank: 2, strengths: ['Reaction Time', 'Fast-twitch', 'Stride Length'] },
        { sport: 'Basketball', potential_score: 79, rank: 3, strengths: ['Vertical Jump', 'Coordination', 'Agility'] },
      ],
      tested_at: twoMonthsAgo,
      academy_location: 'Sportify Academy — Dubai Sports City',
      verification_ref: 'SPF-2026-04-8822',
      source: 'Sportify Academy',
      last_synced_at: new Date().toISOString(),
    },
  ], { onConflict: 'athlete_id,tested_at,test_type' });
}

// ── Link account ──────────────────────────────────────────────────────────────

export async function linkSportifyAccount(
  athleteId: string,
  sportifyAthleteId: string
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('profiles')
    .update({ sportify_linked: true, sportify_athlete_id: sportifyAthleteId })
    .eq('id', athleteId);
  return { error: error?.message ?? null };
}

// ── Appointments ──────────────────────────────────────────────────────────────

export async function fetchAppointments(athleteId: string): Promise<Appointment[]> {
  const { data } = await supabase
    .from('appointments')
    .select('*')
    .eq('athlete_id', athleteId)
    .order('created_at', { ascending: false });
  return data ?? [];
}

export async function bookAppointment(params: {
  athleteId: string;
  academyLocation: string;
  testType: string;
  preferredTimes: string[];
  notes?: string;
}): Promise<{ id: string | null; error: string | null }> {
  const { data, error } = await supabase
    .from('appointments')
    .insert({
      athlete_id: params.athleteId,
      academy_location: params.academyLocation,
      test_type: params.testType,
      preferred_times: params.preferredTimes,
      notes: params.notes ?? null,
      status: 'requested',
    })
    .select('id')
    .single();
  if (error || !data) return { id: null, error: error?.message ?? 'Unknown error' };
  return { id: data.id, error: null };
}

export async function cancelAppointment(appointmentId: string): Promise<void> {
  await supabase.from('appointments').update({ status: 'cancelled' }).eq('id', appointmentId);
}

// ── Formatting ────────────────────────────────────────────────────────────────

export const METRIC_LABELS: Record<string, { label: string; unit: string; higherBetter: boolean }> = {
  sprint_10m:            { label: '10m Sprint',         unit: 's',   higherBetter: false },
  sprint_40m:            { label: '40m Sprint',         unit: 's',   higherBetter: false },
  vertical_jump:         { label: 'Vertical Jump',      unit: 'cm',  higherBetter: true  },
  broad_jump:            { label: 'Broad Jump',         unit: 'cm',  higherBetter: true  },
  agility_5_10_5:        { label: 'Agility (5-10-5)',   unit: 's',   higherBetter: false },
  reaction_time:         { label: 'Reaction Time',      unit: 'ms',  higherBetter: false },
  beep_test_level:       { label: 'Beep Test',          unit: 'lvl', higherBetter: true  },
  flexibility_sit_reach: { label: 'Flexibility',        unit: 'cm',  higherBetter: true  },
  movement_quality:      { label: 'Movement Quality',   unit: '/100',higherBetter: true  },
  strength_grip:         { label: 'Grip Strength',      unit: 'kg',  higherBetter: true  },
  push_ups:              { label: 'Push-ups',           unit: 'reps',higherBetter: true  },
  overall_athleticism:   { label: 'Overall Athleticism',unit: '/100',higherBetter: true  },
  coordination:          { label: 'Coordination',       unit: '/100',higherBetter: true  },
  explosiveness:         { label: 'Explosiveness',      unit: '/100',higherBetter: true  },
  endurance_base:        { label: 'Endurance Base',     unit: '/100',higherBetter: true  },
};

export const ACADEMY_LOCATIONS = [
  'Sportify Academy — Dubai Sports City',
  'Sportify Academy — Abu Dhabi',
  'Sportify Academy — Sharjah',
  'Sportify Academy — Riyadh',
  'Sportify Academy — London',
];

export const TEST_TYPES = [
  'Full Physical Assessment',
  'Speed & Agility Test',
  'Strength & Power Test',
  'Endurance Test',
  'Talent Potential Assessment',
  'Camera-Based Movement Analysis',
];

export const APPOINTMENT_STATUS_LABELS: Record<AppointmentStatus, string> = {
  requested: 'Requested',
  confirmed: 'Confirmed',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

export const APPOINTMENT_STATUS_COLORS: Record<AppointmentStatus, string> = {
  requested: '#FFB020',
  confirmed: '#2E8BFF',
  completed: '#34D399',
  cancelled: '#FF5D5D',
};

export function formatAppointmentDate(iso: string | null): string {
  if (!iso) return 'TBD';
  return new Date(iso).toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
  });
}

export function metricDelta(
  current: number,
  previous: number,
  higherBetter: boolean
): { label: string; positive: boolean } {
  const diff = current - previous;
  const positive = higherBetter ? diff > 0 : diff < 0;
  const sign = diff > 0 ? '+' : '';
  return { label: `${sign}${diff.toFixed(diff % 1 === 0 ? 0 : 2)}`, positive };
}
