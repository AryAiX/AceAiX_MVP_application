import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, Dimensions,
  Animated, AccessibilityInfo, Image, Share,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Polygon, Line } from 'react-native-svg';
import {
  BadgeCheck, Edit3, MapPin, Globe, Share2, Camera,
  Zap, Shield, Activity, ChevronRight, Plus, UserCheck,
  Play, Eye, ThumbsUp, TrendingUp, Award, Star,
} from 'lucide-react-native';
import { AppHeader } from '@/components/AppHeader';
import { useAuth } from '@/context/AuthContext';
import { Colors, Typography, Spacing, Radii } from '@/constants/theme';
import { useChessStats } from '@/hooks/useChessStats';
import { useFootballStats } from '@/hooks/useFootballStats';
import { triggerChessSyncFull } from '@/lib/chessService';
import { triggerFootballSync } from '@/lib/footballService';
import { ChessPerformanceCard } from '@/components/performance/ChessPerformanceCard';
import { FootballStatsCard } from '@/components/performance/FootballStatsCard';
import { useRouter } from 'expo-router';

const { width: SW } = Dimensions.get('window');

// ── Static demo data ──────────────────────────────────────────────────────────
const VERIFICATION_TILES = [
  { icon: Shield, label: 'Identity Verified', source: 'Emirates ID · Passport', status: 'verified', color: Colors.success },
  { icon: Activity, label: 'Performance Data', source: 'Wyscout · InStat Feed', status: 'verified', color: Colors.primary },
  { icon: Plus, label: 'Medical Clearance', source: 'Dubai Sports Clinic · Jun 2025', status: 'verified', color: Colors.success },
];

const ATTRIBUTES = [
  { label: 'Pace', value: 88, endorsements: 14 },
  { label: 'Shooting', value: 82, endorsements: 11 },
  { label: 'Passing', value: 79, endorsements: 9 },
  { label: 'Dribbling', value: 85, endorsements: 12 },
  { label: 'Defending', value: 44, endorsements: 2 },
  { label: 'Physical', value: 76, endorsements: 7 },
];

const STAT_TILES = [
  { label: 'HEIGHT', value: '183', unit: 'cm' },
  { label: 'WEIGHT', value: '78', unit: 'kg' },
  { label: 'FOOT', value: 'Right', unit: '' },
  { label: 'AGE', value: '24', unit: 'yrs' },
  { label: 'APPS', value: '84', unit: '' },
  { label: 'GOALS', value: '31', unit: '' },
];

const LANGUAGES = [
  { lang: 'Arabic', proficiency: 'Native', pct: 1.0 },
  { lang: 'English', proficiency: 'Professional', pct: 0.85 },
  { lang: 'French', proficiency: 'Elementary', pct: 0.35 },
];

const HIGHLIGHTS = [
  { id: '1', title: 'Hat-trick vs Al Jazira', duration: '2:34', tags: ['Hat-trick', 'Free Kick'], views: '12.4K', featured: true },
  { id: '2', title: 'Goal of the Month', duration: '0:48', tags: ['Header', 'Long Range'], views: '8.1K', featured: false },
  { id: '3', title: 'Season Best Moments', duration: '5:12', tags: ['Compilation'], views: '22K', featured: false },
];

const SIMILAR_ATHLETES = [
  { name: 'Salim Al Maqbali', pos: 'Striker', club: 'Al Ain FC', score: 89 },
  { name: 'Marcus Ferreira', pos: 'Second Striker', club: 'Shabab Al Ahli', score: 85 },
  { name: 'Tariq Al Mansouri', pos: 'Striker', club: 'Al Wahda', score: 81 },
];

const CAREER_TIMELINE = [
  { club: 'Al Nassr FC', role: 'First Team', period: '2023 – Present', caps: 28, goals: 14, current: true },
  { club: 'Al Jazira Club', role: 'First Team', period: '2021 – 2023', caps: 48, goals: 21, current: false },
  { club: 'Al Wahda FC', role: 'Youth → Senior', period: '2018 – 2021', caps: 32, goals: 12, current: false },
];

const NETWORK_LIST = [
  { name: 'James Thornton', role: 'Head Scout', org: 'Manchester United FC', type: 'scout', connected: true },
  { name: 'Sofia Reyes', role: 'Sports Agent', org: 'Elite Sports Group', type: 'agent', connected: true },
  { name: 'Carlos Mendes', role: 'Talent Scout', org: 'Al Nassr FC', type: 'scout', connected: false },
  { name: 'Rania Khalil', role: 'Physiotherapist', org: 'UAE FA', type: 'medical', connected: true },
];

const SEASON_STATS = [
  { label: 'Appearances', value: '28', sub: '2024/25' },
  { label: 'Goals', value: '14', sub: 'League' },
  { label: 'Assists', value: '9', sub: 'League' },
  { label: 'Avg Rating', value: '7.8', sub: 'Wyscout' },
  { label: 'Pass Acc.', value: '87%', sub: 'Season' },
  { label: 'Shots/Game', value: '3.2', sub: 'Avg' },
  { label: 'Dribbles', value: '4.1', sub: 'Per 90' },
  { label: 'Key Passes', value: '2.8', sub: 'Per 90' },
];

// ── Attribute tier color ──────────────────────────────────────────────────────
function attrColor(v: number) {
  if (v >= 88) return Colors.accent;
  if (v >= 78) return Colors.primary;
  if (v >= 60) return Colors.textMuted;
  return Colors.error;
}

// ── HUD corner markers ────────────────────────────────────────────────────────
function HudFrame({ children, style }: { children: React.ReactNode; style?: object }) {
  const len = 10, thick = 2;
  const corner = (top: boolean, left: boolean) => ({
    position: 'absolute' as const,
    width: len + thick, height: len + thick,
    top: top ? 0 : undefined, bottom: top ? undefined : 0,
    left: left ? 0 : undefined, right: left ? undefined : 0,
    borderTopWidth: top ? thick : 0, borderBottomWidth: top ? 0 : thick,
    borderLeftWidth: left ? thick : 0, borderRightWidth: left ? 0 : thick,
    borderColor: Colors.primary,
  });
  return (
    <View style={[{ padding: 8 }, style]}>
      <View style={corner(true, true)} />
      <View style={corner(true, false)} />
      <View style={corner(false, true)} />
      <View style={corner(false, false)} />
      {children}
    </View>
  );
}

// ── Animated gauge (pure RN Animated + SVG path swap trick) ──────────────────
function AnimGauge({ value, max = 100, size = 96, sw = 9, color, reduced }: {
  value: number; max?: number; size?: number; sw?: number; color: string; reduced: boolean;
}) {
  const [displayValue, setDisplayValue] = useState(reduced ? value : 0);
  const r = (size - sw) / 2;
  const circ = 2 * Math.PI * r;
  const c = size / 2;

  useEffect(() => {
    if (reduced) { setDisplayValue(value); return; }
    const anim = new Animated.Value(0);
    anim.addListener(({ value: v }) => setDisplayValue(Math.round(v)));
    Animated.timing(anim, { toValue: value, duration: 900, delay: 200, useNativeDriver: false }).start();
    return () => anim.removeAllListeners();
  }, []);

  const pct = Math.min(displayValue / max, 1);
  const filled = pct * circ;

  return (
    <Svg width={size} height={size}>
      <Circle cx={c} cy={c} r={r} stroke={`${color}22`} strokeWidth={sw} fill="none" />
      <Circle cx={c} cy={c} r={r} stroke={color} strokeWidth={sw} fill="none"
        strokeDasharray={`${filled} ${circ - filled}`}
        strokeLinecap="round"
        transform={`rotate(-90, ${c}, ${c})`}
      />
    </Svg>
  );
}

// ── Radar chart ───────────────────────────────────────────────────────────────
function RadarChart({ data, labels, size = 160 }: { data: number[]; labels: string[]; size?: number }) {
  const cx = size / 2, cy = size / 2, maxR = size / 2 - 28;
  const n = data.length;
  const angles = data.map((_, i) => (i * 2 * Math.PI) / n - Math.PI / 2);
  const pts = (sc: number) =>
    angles.map(a => `${cx + maxR * sc * Math.cos(a)},${cy + maxR * sc * Math.sin(a)}`).join(' ');
  const dataPts = data.map((v, i) =>
    `${cx + (v / 100) * maxR * Math.cos(angles[i])},${cy + (v / 100) * maxR * Math.sin(angles[i])}`
  ).join(' ');
  return (
    <View>
      <Svg width={size} height={size}>
        {[0.25, 0.5, 0.75, 1].map(sc => (
          <Polygon key={sc} points={pts(sc)} stroke={Colors.border} strokeWidth="1" fill="none" />
        ))}
        {angles.map((a, i) => (
          <Line key={i} x1={cx} y1={cy}
            x2={cx + maxR * Math.cos(a)} y2={cy + maxR * Math.sin(a)}
            stroke={Colors.border} strokeWidth="1" />
        ))}
        <Polygon points={dataPts} fill={`${Colors.primary}25`} stroke={Colors.primary} strokeWidth="2" />
        {data.map((v, i) => {
          const x = cx + (v / 100) * maxR * Math.cos(angles[i]);
          const y = cy + (v / 100) * maxR * Math.sin(angles[i]);
          return <Circle key={i} cx={x} cy={y} r="3" fill={Colors.primary} />;
        })}
      </Svg>
      {/* Labels positioned around */}
      {labels.map((lbl, i) => {
        const lx = cx + (maxR + 14) * Math.cos(angles[i]);
        const ly = cy + (maxR + 14) * Math.sin(angles[i]);
        return (
          <View key={lbl} style={{ position: 'absolute', left: lx - 22, top: ly - 8, width: 44, alignItems: 'center' }}>
            <Text style={{ fontFamily: Typography.family.mono, fontSize: 9, color: Colors.textDisabled }}>{lbl}</Text>
          </View>
        );
      })}
    </View>
  );
}

// ── Video clip card ───────────────────────────────────────────────────────────
function ClipCard({ clip, wide }: { clip: typeof HIGHLIGHTS[0]; wide?: boolean }) {
  return (
    <View style={[p.clipCard, wide && { width: SW - 32 }]}>
      <View style={p.clipThumb}>
        <Image
          source={{ uri: 'https://images.pexels.com/photos/46798/the-ball-stadion-football-the-pitch-46798.jpeg?auto=compress&cs=tinysrgb&w=400' }}
          style={StyleSheet.absoluteFillObject}
          resizeMode="cover"
        />
        <LinearGradient colors={['transparent', 'rgba(0,0,0,0.7)']} style={StyleSheet.absoluteFillObject} />
        {clip.featured && (
          <View style={p.featuredBadge}>
            <Zap color={Colors.bg} size={9} fill={Colors.bg} />
            <Text style={p.featuredTxt}>FEATURED</Text>
          </View>
        )}
        <View style={p.playBtn}>
          <Play color={Colors.white} size={14} fill={Colors.white} />
        </View>
        <View style={p.durationChip}>
          <Text style={p.durationTxt}>{clip.duration}</Text>
        </View>
      </View>
      <View style={p.clipInfo}>
        <Text style={p.clipTitle} numberOfLines={2}>{clip.title}</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
          {clip.tags.map(tag => (
            <View key={tag} style={p.clipTag}>
              <Text style={p.clipTagTxt}>{tag}</Text>
            </View>
          ))}
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 }}>
          <Eye color={Colors.textDisabled} size={11} />
          <Text style={p.clipViews}>{clip.views}</Text>
        </View>
      </View>
    </View>
  );
}

// ── Section header ────────────────────────────────────────────────────────────
function SH({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <View style={p.sh}>
      <View style={p.shAccent} />
      <Text style={p.shTitle}>{title}</Text>
      {action && (
        <TouchableOpacity onPress={onAction} style={p.shBtn}>
          <Text style={p.shBtnTxt}>{action}</Text>
          <ChevronRight color={Colors.primary} size={12} />
        </TouchableOpacity>
      )}
    </View>
  );
}

// ── TABS ──────────────────────────────────────────────────────────────────────
const TABS = ['Overview', 'Performance', 'Career', 'Network'];

// ── Overview Tab ──────────────────────────────────────────────────────────────
function OverviewTab({ profile, reduced, isOwn, router }: any) {
  const [aboutExpanded, setAboutExpanded] = useState(false);
  const [highlightTab, setHighlightTab] = useState<'Highlights' | 'Activity'>('Highlights');
  const bio = profile?.bio || 'Professional footballer with 7+ years of competitive experience across UAE Pro League and international youth competitions. Known for clinical finishing, technical dribbling, and ability to perform under pressure. Dedicated to continuous improvement and performance excellence at the highest level.';

  return (
    <>
      {/* AI Scout Match */}
      <View style={[p.card, p.scoutMatchCard]}>
        <LinearGradient
          colors={[`${Colors.accent}12`, `${Colors.accent}04`]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md }}>
          <View style={p.scoutMatchIcon}>
            <Zap color={Colors.bg} size={18} fill={Colors.bg} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={p.scoutMatchTitle}>AI Scout Match</Text>
            <Text style={p.scoutMatchBody}>
              <Text style={{ color: Colors.accent, fontFamily: Typography.family.bold }}>14 scouts</Text>
              {' '}are actively looking for a player matching this profile right now.
            </Text>
          </View>
        </View>
        <TouchableOpacity style={p.scoutMatchBtn} onPress={() => router.push('/(tabs)/opportunities' as any)}>
          <Zap color={Colors.bg} size={13} fill={Colors.bg} />
          <Text style={p.scoutMatchBtnTxt}>View Matches</Text>
        </TouchableOpacity>
      </View>

      {/* Verification */}
      <View style={p.card}>
        <SH title="AceAiX Verified Athlete" />
        <View style={{ gap: Spacing.sm }}>
          {VERIFICATION_TILES.map(({ icon: Icon, label, source, color }) => (
            <View key={label} style={p.verifyRow}>
              <View style={[p.verifyIconWrap, { backgroundColor: `${color}15`, borderColor: `${color}28` }]}>
                <Icon color={color} size={16} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                  <Text style={p.verifyLabel}>{label}</Text>
                  <BadgeCheck color={color} size={13} />
                </View>
                <Text style={p.verifySource}>{source}</Text>
              </View>
              <View style={[p.verifyPill, { backgroundColor: `${color}15`, borderColor: `${color}28` }]}>
                <Text style={[p.verifyPillTxt, { color }]}>Verified</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Key Metrics */}
      <View style={p.card}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.md }}>
          <SH title="Key Metrics" />
          {isOwn && (
            <TouchableOpacity>
              <Edit3 color={Colors.textMuted} size={16} />
            </TouchableOpacity>
          )}
        </View>
        <HudFrame>
          <View style={p.gaugesRow}>
            {[
              { label: 'Performance', v: 92, color: Colors.accent },
              { label: 'Visibility', v: 87, color: Colors.primary },
              { label: 'Fitness', v: 94, color: Colors.primary },
            ].map(({ label, v, color }) => (
              <View key={label} style={p.gaugeWrap}>
                <View style={{ position: 'relative', alignItems: 'center', justifyContent: 'center' }}>
                  <AnimGauge value={v} color={color} size={88} sw={8} reduced={reduced} />
                  <View style={p.gaugeCenter}>
                    <Text style={[p.gaugeV, { color }]}>{v}</Text>
                  </View>
                </View>
                <Text style={p.gaugeLabel}>{label}</Text>
              </View>
            ))}
          </View>
        </HudFrame>
        <View style={p.statTilesGrid}>
          {STAT_TILES.map(({ label, value, unit }) => (
            <View key={label} style={p.statTile}>
              <Text style={p.statTileVal}>{value}<Text style={p.statTileUnit}>{unit}</Text></Text>
              <Text style={p.statTileLabel}>{label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* About */}
      <View style={p.card}>
        <SH title="About" />
        <Text style={p.bioTxt} numberOfLines={aboutExpanded ? undefined : 3}>{bio}</Text>
        <TouchableOpacity onPress={() => setAboutExpanded(!aboutExpanded)} style={{ marginTop: 6 }}>
          <Text style={p.moreBtn}>{aboutExpanded ? 'Show less' : '… show more'}</Text>
        </TouchableOpacity>
      </View>

      {/* Activity & Highlights */}
      <View style={p.card}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.md }}>
          <View style={p.toggleRow}>
            {(['Highlights', 'Activity'] as const).map(t => (
              <TouchableOpacity key={t} style={[p.toggleBtn, highlightTab === t && p.toggleBtnActive]} onPress={() => setHighlightTab(t)}>
                <Text style={[p.toggleTxt, highlightTab === t && p.toggleTxtActive]}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {isOwn && (
            <TouchableOpacity style={p.uploadClipBtn} onPress={() => router.push('/(tabs)/media' as any)}>
              <Plus color={Colors.primary} size={13} />
              <Text style={p.uploadClipTxt}>Add Clip</Text>
            </TouchableOpacity>
          )}
        </View>
        {highlightTab === 'Highlights' ? (
          <>
            <ClipCard clip={HIGHLIGHTS[0]} wide />
            <Text style={p.allClipsTxt}>ALL CLIPS</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -Spacing.lg, paddingHorizontal: Spacing.lg }}>
              {HIGHLIGHTS.slice(1).map(clip => <ClipCard key={clip.id} clip={clip} />)}
            </ScrollView>
          </>
        ) : (
          <View style={p.activityEmpty}>
            <Activity color={Colors.textDisabled} size={24} />
            <Text style={p.activityEmptyTxt}>No recent activity to show.</Text>
          </View>
        )}
      </View>

      {/* Attributes & Skills */}
      <View style={p.card}>
        <SH title="Attributes & Skills" />
        <Text style={p.aiTagTxt}>AI-calculated · Football · 2024/25 Season</Text>
        <View style={{ alignItems: 'center', marginBottom: Spacing.md }}>
          <HudFrame>
            <RadarChart
              data={ATTRIBUTES.map(a => a.value)}
              labels={ATTRIBUTES.map(a => a.label)}
              size={180}
            />
          </HudFrame>
        </View>
        <View style={{ gap: 10 }}>
          {ATTRIBUTES.map(attr => {
            const col = attrColor(attr.value);
            return (
              <View key={attr.label} style={p.attrRow}>
                <Text style={p.attrName}>{attr.label}</Text>
                <View style={p.attrBarWrap}>
                  <View style={[p.attrBar, { width: `${attr.value}%` as any, backgroundColor: col }]} />
                </View>
                <Text style={[p.attrVal, { color: col }]}>{attr.value}</Text>
                <View style={p.endorseCount}>
                  <ThumbsUp color={Colors.textDisabled} size={10} />
                  <Text style={p.endorseCountTxt}>{attr.endorsements}</Text>
                </View>
                {!isOwn && (
                  <TouchableOpacity style={p.endorseBtn}>
                    <Text style={p.endorseBtnTxt}>+1</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })}
        </View>
      </View>

      {/* Languages */}
      <View style={p.card}>
        <SH title="Languages" />
        <View style={{ gap: 12 }}>
          {LANGUAGES.map(({ lang, proficiency, pct }) => {
            const col = pct === 1 ? Colors.accent : pct >= 0.8 ? Colors.primary : Colors.textMuted;
            return (
              <View key={lang}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }}>
                  <Text style={p.langName}>{lang}</Text>
                  <Text style={[p.langProf, { color: col }]}>{proficiency}</Text>
                </View>
                <View style={p.langBarBg}>
                  <View style={[p.langBarFill, { width: `${pct * 100}%` as any, backgroundColor: col }]} />
                </View>
              </View>
            );
          })}
        </View>
      </View>

      {/* People Also Viewed */}
      <View style={p.card}>
        <SH title="People Also Viewed" />
        <View style={{ gap: Spacing.sm }}>
          {SIMILAR_ATHLETES.map((a, i) => (
            <View key={a.name} style={[p.similarRow, i < SIMILAR_ATHLETES.length - 1 && { borderBottomWidth: 1, borderBottomColor: Colors.border }]}>
              <View style={p.similarAv}>
                <Text style={p.similarAvTxt}>{a.name[0]}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={p.similarName}>{a.name}</Text>
                <Text style={p.similarPos}>{a.pos} · {a.club}</Text>
              </View>
              <View style={p.aiScoreChip}>
                <Zap color={Colors.bg} size={9} fill={Colors.bg} />
                <Text style={p.aiScoreChipTxt}>{a.score}</Text>
              </View>
              <TouchableOpacity style={p.followBtn}>
                <Plus color={Colors.primary} size={14} />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </View>
    </>
  );
}

// ── Performance Tab ───────────────────────────────────────────────────────────
function PerformanceTab({ router, sport, userId, profile }: { router: any; sport: string | null; userId?: string; profile?: any }) {
  const { stats: chessStats, loading: chessLoading, refresh: chessRefresh } = useChessStats(sport === 'chess' ? userId : null);
  const { stats: footballStats, loading: footballLoading, refresh: footballRefresh } = useFootballStats(
    (sport && sport !== 'chess') ? userId : null
  );
  const [refreshing, setRefreshing] = React.useState(false);

  async function handleChessRefresh() {
    setRefreshing(true);
    await triggerChessSyncFull(userId!, profile?.chesscom_username, profile?.lichess_username);
    await chessRefresh();
    setRefreshing(false);
  }

  async function handleFootballRefresh() {
    if (!userId || !profile?.football_api_player_id) return;
    setRefreshing(true);
    await triggerFootballSync(userId, profile.football_api_player_id, undefined, profile?.league);
    await footballRefresh();
    setRefreshing(false);
  }

  // ── Chess athlete ──────────────────────────────────────────────────────────
  if (sport === 'chess') {
    return (
      <>
        <View style={p.card}>
          <SH title="Chess Performance" action="Engine" onAction={() => router.push('/(tabs)/performance' as any)} />
          {chessLoading ? (
            <Text style={{ fontFamily: Typography.family.regular, fontSize: Typography.size.sm, color: Colors.textMuted, textAlign: 'center', paddingVertical: Spacing.xl }}>Loading…</Text>
          ) : chessStats ? (
            <ChessPerformanceCard stats={chessStats} onRefresh={handleChessRefresh} refreshing={refreshing} />
          ) : (
            <View style={{ alignItems: 'center', paddingVertical: Spacing.xl, gap: Spacing.sm }}>
              <Text style={{ fontFamily: Typography.family.bold, fontSize: Typography.size.md, color: Colors.textPrimary }}>No chess data yet</Text>
              <Text style={{ fontFamily: Typography.family.regular, fontSize: Typography.size.sm, color: Colors.textMuted, textAlign: 'center' }}>
                Add your Chess.com or Lichess username in Settings → Connected Data to auto-sync.
              </Text>
              <TouchableOpacity style={p.goToSettingsBtn} onPress={() => router.push('/(tabs)/settings' as any)}>
                <Text style={p.goToSettingsTxt}>Go to Settings</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
        <View style={p.card}>
          <SH title="Analytics" action="View All" onAction={() => router.push('/(tabs)/analytics' as any)} />
          <View style={p.anaRow}>
            {[{ label: 'Heat Map', icon: Activity }, { label: 'Pass Map', icon: TrendingUp }, { label: 'Shot Chart', icon: Star }].map(({ label, icon: Icon }) => (
              <TouchableOpacity key={label} style={p.anaCell} onPress={() => router.push('/(tabs)/analytics' as any)}>
                <Icon color={Colors.primary} size={20} />
                <Text style={p.anaCellTxt}>{label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </>
    );
  }

  // ── Football / other team sport (with API data if available) ──────────────
  return (
    <>
      {footballStats ? (
        <View style={p.card}>
          <SH title={`${footballStats.season} Season Stats`} action="Full History" onAction={() => router.push('/(tabs)/performance' as any)} />
          <FootballStatsCard stats={footballStats} onRefresh={handleFootballRefresh} refreshing={refreshing} />
        </View>
      ) : (
        <View style={p.card}>
          <SH title="2024/25 Season Stats" />
          <View style={p.statsGrid}>
            {SEASON_STATS.map(({ label, value, sub }) => (
              <View key={label} style={p.statsCell}>
                <Text style={p.statsCellVal}>{value}</Text>
                <Text style={p.statsCellLabel}>{label}</Text>
                <Text style={p.statsCellSub}>{sub}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
      <View style={p.card}>
        <SH title="Match Ratings" action="Full History" onAction={() => router.push('/(tabs)/performance' as any)} />
        {[
          { opp: 'Al Jazira', date: 'Jun 14', rating: 8.2, result: 'W' },
          { opp: 'Shabab Al Ahli', date: 'Jun 7', rating: 7.8, result: 'W' },
          { opp: 'Al Wahda', date: 'Jun 1', rating: 6.5, result: 'D' },
          { opp: 'Al Ain', date: 'May 25', rating: 6.1, result: 'L' },
          { opp: 'Baniyas SC', date: 'May 19', rating: 7.5, result: 'W' },
        ].map((m, i, arr) => (
          <View key={i} style={[p.matchStatRow, i < arr.length - 1 && { borderBottomWidth: 1, borderBottomColor: Colors.border }]}>
            <View style={[p.resultBadge,
              m.result === 'W' && { backgroundColor: `${Colors.success}22`, borderColor: Colors.success },
              m.result === 'D' && { backgroundColor: `${Colors.warning}22`, borderColor: Colors.warning },
              m.result === 'L' && { backgroundColor: `${Colors.error}22`, borderColor: Colors.error },
            ]}>
              <Text style={p.resultTxt}>{m.result}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={p.matchOpp}>{m.opp}</Text>
              <Text style={p.matchDate}>{m.date}</Text>
            </View>
            <Text style={p.matchRating}>{m.rating.toFixed(1)}</Text>
          </View>
        ))}
      </View>
      <View style={p.card}>
        <SH title="Analytics" action="View All" onAction={() => router.push('/(tabs)/analytics' as any)} />
        <View style={p.anaRow}>
          {[{ label: 'Heat Map', icon: Activity }, { label: 'Pass Map', icon: TrendingUp }, { label: 'Shot Chart', icon: Star }].map(({ label, icon: Icon }) => (
            <TouchableOpacity key={label} style={p.anaCell} onPress={() => router.push('/(tabs)/analytics' as any)}>
              <Icon color={Colors.primary} size={20} />
              <Text style={p.anaCellTxt}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </>
  );
}

// ── Career Tab ────────────────────────────────────────────────────────────────
function CareerTab({ router }: { router: any }) {
  return (
    <>
      <View style={p.card}>
        <SH title="Club History" action="Full Career" onAction={() => router.push('/(tabs)/career' as any)} />
        <View style={{ gap: 0 }}>
          {CAREER_TIMELINE.map((club, i) => (
            <View key={club.club} style={p.timelineItem}>
              <View style={{ alignItems: 'center', width: 32 }}>
                <View style={[p.timelineDot, club.current && p.timelineDotActive]} />
                {i < CAREER_TIMELINE.length - 1 && <View style={p.timelineLine} />}
              </View>
              <View style={[p.timelineCard, club.current && { borderColor: `${Colors.primary}50` }]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <View>
                    <Text style={p.clubName}>{club.club}</Text>
                    <Text style={p.clubRole}>{club.role}</Text>
                    <Text style={p.clubPeriod}>{club.period}</Text>
                  </View>
                  {club.current && (
                    <View style={p.currentBadge}>
                      <Text style={p.currentBadgeTxt}>Current</Text>
                    </View>
                  )}
                </View>
                <View style={p.clubStats}>
                  <View style={p.clubStatItem}>
                    <Text style={p.clubStatVal}>{club.caps}</Text>
                    <Text style={p.clubStatLbl}>Caps</Text>
                  </View>
                  <View style={p.clubStatItem}>
                    <Text style={p.clubStatVal}>{club.goals}</Text>
                    <Text style={p.clubStatLbl}>Goals</Text>
                  </View>
                </View>
              </View>
            </View>
          ))}
        </View>
      </View>
      <View style={p.card}>
        <SH title="Milestones" />
        {[
          { label: '100 Senior Appearances', date: 'Mar 2025', icon: Award },
          { label: 'Top Scorer — UAE Pro League', date: 'Jun 2024', icon: Star },
          { label: 'National Team Debut', date: 'Nov 2023', icon: BadgeCheck },
        ].map(({ label, date, icon: Icon }) => (
          <View key={label} style={p.milestoneRow}>
            <View style={p.milestoneIcon}>
              <Icon color={Colors.accent} size={15} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={p.milestoneTxt}>{label}</Text>
              <Text style={p.milestoneDate}>{date}</Text>
            </View>
          </View>
        ))}
      </View>
    </>
  );
}

// ── Network Tab ───────────────────────────────────────────────────────────────
function NetworkTab({ router }: { router: any }) {
  const typeColor: Record<string, string> = { scout: Colors.primary, agent: Colors.accent, medical: Colors.success };
  return (
    <>
      <View style={p.card}>
        <SH title="My Network" action="Explore" onAction={() => router.push('/(tabs)/network' as any)} />
        <View style={p.networkStats}>
          {[{ label: 'Connections', value: '248' }, { label: 'Scout Views', value: '2.8K' }, { label: 'Followers', value: '1.4K' }].map((s, i, arr) => (
            <View key={s.label} style={[p.networkStat, i < arr.length - 1 && { borderRightWidth: 1, borderRightColor: Colors.border }]}>
              <Text style={p.networkStatVal}>{s.value}</Text>
              <Text style={p.networkStatLbl}>{s.label}</Text>
            </View>
          ))}
        </View>
      </View>
      <View style={p.card}>
        <SH title="Connections" />
        {NETWORK_LIST.map((person, i) => (
          <View key={person.name} style={[p.networkRow, i < NETWORK_LIST.length - 1 && { borderBottomWidth: 1, borderBottomColor: Colors.border }]}>
            <View style={[p.networkAv, { borderColor: `${typeColor[person.type]}40` }]}>
              <Text style={p.networkAvTxt}>{person.name[0]}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Text style={p.networkName}>{person.name}</Text>
                {person.connected && <BadgeCheck color={Colors.primary} size={12} />}
              </View>
              <Text style={p.networkRole}>{person.role} · {person.org}</Text>
            </View>
            <View style={[p.networkTypePill, { backgroundColor: `${typeColor[person.type]}15`, borderColor: `${typeColor[person.type]}28` }]}>
              <Text style={[p.networkTypeTxt, { color: typeColor[person.type] }]}>{person.type}</Text>
            </View>
          </View>
        ))}
      </View>
    </>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────
export default function Profile() {
  const { profile } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('Overview');
  const [reduced, setReduced] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const tabOffsetY = useRef(0);
  const [sticky, setSticky] = useState(false);
  const isOwn = true;

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduced);
  }, []);

  const handleShare = async () => {
    await Share.share({ message: `Check out ${profile?.full_name ?? 'this athlete'}'s profile on AceAiX!` });
  };

  return (
    <View style={p.root}>
      {/* Sticky compact header */}
      {sticky && (
        <View style={p.stickyHeader}>
          <View style={p.stickyAv}>
            <Text style={p.stickyAvTxt}>{profile?.full_name?.[0]?.toUpperCase() ?? 'A'}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={p.stickyName} numberOfLines={1}>{profile?.full_name ?? 'Athlete'}</Text>
            <Text style={p.stickyPos} numberOfLines={1}>
              {[profile?.position, profile?.sport].filter(Boolean).join(' · ') || 'Professional Athlete'}
            </Text>
          </View>
          {TABS.map(tab => (
            <TouchableOpacity key={tab} style={[p.stickyTab, tab === activeTab && p.stickyTabActive]} onPress={() => setActiveTab(tab)}>
              <Text style={[p.stickyTabTxt, tab === activeTab && p.stickyTabTxtActive]}>{tab.substring(0, 3)}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <ScrollView
        ref={scrollRef}
        style={p.scroll}
        showsVerticalScrollIndicator={false}
        onScroll={e => {
          const y = e.nativeEvent.contentOffset.y;
          setSticky(y > tabOffsetY.current + 20);
        }}
        scrollEventThrottle={16}
      >
        {/* ── Hero Cover ── */}
        <View style={p.coverWrap}>
          <Image
            source={{ uri: 'https://images.pexels.com/photos/1884574/pexels-photo-1884574.jpeg?auto=compress&cs=tinysrgb&w=800' }}
            style={p.coverImg}
            resizeMode="cover"
          />
          <LinearGradient
            colors={['rgba(10,14,20,0)', 'rgba(10,14,20,0.4)', 'rgba(10,14,20,0.85)']}
            style={StyleSheet.absoluteFillObject}
          />
          {/* AI Score badge */}
          <View style={p.aiScoreBadge}>
            <Text style={p.aiScoreNum}>92</Text>
            <Text style={p.aiScoreLbl}>AI Score</Text>
            <View style={p.elitePill}>
              <Zap color={Colors.bg} size={9} fill={Colors.bg} />
              <Text style={p.eliteTxt}>Elite</Text>
            </View>
          </View>
        </View>

        {/* ── Profile Card ── */}
        <View style={p.heroCard}>
          {/* Athlete photo + availability */}
          <View style={{ alignItems: 'flex-start', marginBottom: Spacing.md }}>
            <View style={p.athletePhotoWrap}>
              <View style={p.athletePhoto}>
                <Text style={p.athletePhotoTxt}>{profile?.full_name?.[0]?.toUpperCase() ?? 'A'}</Text>
              </View>
              {isOwn && (
                <TouchableOpacity style={p.cameraOverlay}>
                  <Camera color={Colors.white} size={13} />
                </TouchableOpacity>
              )}
            </View>
            <View style={p.availPill}>
              <View style={p.availDot} />
              <Text style={p.availTxt}>Open to Trials</Text>
            </View>
          </View>

          {/* Name + badge */}
          <View style={p.nameRow}>
            <Text style={p.heroName} numberOfLines={1}>{profile?.full_name ?? 'Athlete Name'}</Text>
            <BadgeCheck color={Colors.primary} size={20} />
          </View>
          <Text style={p.heroPos}>
            {[profile?.position, profile?.sport].filter(Boolean).join(' · ') || 'Striker · Football'}
          </Text>

          {/* Meta row */}
          <View style={p.metaRow}>
            {profile?.league && (
              <View style={p.metaItem}>
                <Shield color={Colors.primary} size={11} />
                <Text style={p.metaTxt}>{profile.league}</Text>
              </View>
            )}
            {profile?.current_location && (
              <View style={p.metaItem}>
                <MapPin color={Colors.textDisabled} size={11} />
                <Text style={p.metaTxt}>{profile.current_location}</Text>
              </View>
            )}
            {profile?.nationality && (
              <View style={p.metaItem}>
                <Globe color={Colors.textDisabled} size={11} />
                <Text style={p.metaTxt}>{profile.nationality}</Text>
              </View>
            )}
            <View style={[p.clearedPill]}>
              <BadgeCheck color={Colors.success} size={10} />
              <Text style={p.clearedTxt}>Cleared</Text>
            </View>
          </View>

          {/* Counts */}
          <View style={p.countsRow}>
            <View style={p.countItem}>
              <Text style={p.countVal}>1.4K</Text>
              <Text style={p.countLbl}>Followers</Text>
            </View>
            <View style={p.countDivider} />
            <View style={p.countItem}>
              <Text style={p.countVal}>248</Text>
              <Text style={p.countLbl}>Connections</Text>
            </View>
          </View>

          {/* Own-profile banner */}
          {isOwn && (
            <View style={p.ownBanner}>
              <Text style={p.ownBannerTxt}>You are viewing your public profile</Text>
              <View style={{ flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm }}>
                <TouchableOpacity style={p.dashBtn} onPress={() => router.push('/(tabs)/' as any)}>
                  <Text style={p.dashBtnTxt}>Dashboard</Text>
                </TouchableOpacity>
                <TouchableOpacity style={p.editProfileBtn}>
                  <Edit3 color={Colors.primary} size={12} />
                  <Text style={p.editProfileBtnTxt}>Edit Profile</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Actions */}
          <View style={p.actionsRow}>
            <TouchableOpacity style={p.endorseAction}>
              <LinearGradient
                colors={[Colors.accent, `${Colors.accent}CC`]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={p.endorseGrad}
              >
                <ThumbsUp color={Colors.bg} size={15} fill={Colors.bg} />
                <Text style={p.endorseActionTxt}>Endorse</Text>
              </LinearGradient>
            </TouchableOpacity>
            {!isOwn && (
              <TouchableOpacity style={p.connectBtn}>
                <UserCheck color={Colors.primary} size={15} />
                <Text style={p.connectBtnTxt}>Connect</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={p.shareBtn} onPress={handleShare}>
              <Share2 color={Colors.primary} size={15} />
              <Text style={p.shareBtnTxt}>Share</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Tabs ── */}
        <View onLayout={e => { tabOffsetY.current = e.nativeEvent.layout.y; }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={p.tabsBar}>
            {TABS.map(tab => (
              <TouchableOpacity key={tab} style={[p.tabBtn, tab === activeTab && p.tabBtnActive]} onPress={() => setActiveTab(tab)}>
                <Text style={[p.tabBtnTxt, tab === activeTab && p.tabBtnTxtActive]}>{tab}</Text>
                {tab === activeTab && <View style={p.tabUnderline} />}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* ── Tab Content ── */}
        <View style={p.tabContent}>
          {activeTab === 'Overview' && <OverviewTab profile={profile} reduced={reduced} isOwn={isOwn} router={router} />}
          {activeTab === 'Performance' && <PerformanceTab router={router} sport={profile?.sport ?? null} userId={profile?.id} profile={profile} />}
          {activeTab === 'Career' && <CareerTab router={router} />}
          {activeTab === 'Network' && <NetworkTab router={router} />}
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const p = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  scroll: { flex: 1 },

  // Sticky header
  stickyHeader: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 100, flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.border, gap: Spacing.sm },
  stickyAv: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  stickyAvTxt: { fontFamily: Typography.family.bold, fontSize: 13, color: Colors.white },
  stickyName: { fontFamily: Typography.family.bold, fontSize: 13, color: Colors.textPrimary },
  stickyPos: { fontFamily: Typography.family.regular, fontSize: 10, color: Colors.textMuted },
  stickyTab: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: Radii.sm },
  stickyTabActive: { backgroundColor: `${Colors.primary}20` },
  stickyTabTxt: { fontFamily: Typography.family.medium, fontSize: 11, color: Colors.textMuted },
  stickyTabTxtActive: { color: Colors.primary, fontFamily: Typography.family.bold },

  // Cover
  coverWrap: { height: 200, position: 'relative' },
  coverImg: { width: '100%', height: '100%' },
  aiScoreBadge: { position: 'absolute', top: 16, right: 16, alignItems: 'center', backgroundColor: 'rgba(10,14,20,0.75)', borderRadius: Radii.md, padding: Spacing.md, borderWidth: 1, borderColor: `${Colors.accent}50` },
  aiScoreNum: { fontFamily: Typography.family.display, fontSize: 30, color: Colors.accent, lineHeight: 34 },
  aiScoreLbl: { fontFamily: Typography.family.mono, fontSize: 9, color: Colors.textMuted, letterSpacing: 1 },
  elitePill: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: Colors.accent, borderRadius: Radii.full, paddingHorizontal: 7, paddingVertical: 3, marginTop: 4 },
  eliteTxt: { fontFamily: Typography.family.display, fontSize: 9, color: Colors.bg, letterSpacing: 0.8 },

  // Hero card
  heroCard: { backgroundColor: Colors.surface, marginHorizontal: Spacing.lg, marginTop: -Spacing.xxl, borderRadius: Radii.xl, padding: Spacing.lg, borderWidth: 1, borderColor: Colors.border, marginBottom: 0 },
  athletePhotoWrap: { position: 'relative' },
  athletePhoto: { width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: Colors.bg },
  athletePhotoTxt: { fontFamily: Typography.family.display, fontSize: 30, color: Colors.white },
  cameraOverlay: { position: 'absolute', bottom: 0, right: 0, width: 26, height: 26, borderRadius: 13, backgroundColor: Colors.elevated, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: Colors.bg },
  availPill: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: `${Colors.success}15`, borderRadius: Radii.full, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: `${Colors.success}30`, marginTop: 8 },
  availDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.success },
  availTxt: { fontFamily: Typography.family.bold, fontSize: 11, color: Colors.success },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  heroName: { fontFamily: Typography.family.display, fontSize: 26, color: Colors.textPrimary, flex: 1 },
  heroPos: { fontFamily: Typography.family.medium, fontSize: Typography.size.sm, color: Colors.textMuted, marginBottom: Spacing.sm },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.md },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaTxt: { fontFamily: Typography.family.regular, fontSize: Typography.size.xs, color: Colors.textMuted },
  clearedPill: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: `${Colors.success}15`, borderRadius: Radii.full, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: `${Colors.success}28` },
  clearedTxt: { fontFamily: Typography.family.bold, fontSize: 10, color: Colors.success },
  countsRow: { flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: Spacing.md, marginBottom: Spacing.md },
  countItem: { flex: 1, alignItems: 'center' },
  countVal: { fontFamily: Typography.family.monoBold, fontSize: Typography.size.xl, color: Colors.textPrimary },
  countLbl: { fontFamily: Typography.family.regular, fontSize: 10, color: Colors.textMuted },
  countDivider: { width: 1, height: 32, backgroundColor: Colors.border },
  ownBanner: { backgroundColor: Colors.elevated, borderRadius: Radii.md, padding: Spacing.md, marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.border },
  ownBannerTxt: { fontFamily: Typography.family.regular, fontSize: Typography.size.xs, color: Colors.textMuted, textAlign: 'center' },
  dashBtn: { flex: 1, alignItems: 'center', paddingVertical: 8, backgroundColor: `${Colors.primary}15`, borderRadius: Radii.md, borderWidth: 1, borderColor: `${Colors.primary}30` },
  dashBtnTxt: { fontFamily: Typography.family.bold, fontSize: Typography.size.xs, color: Colors.primary },
  editProfileBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 8, backgroundColor: `${Colors.primary}15`, borderRadius: Radii.md, borderWidth: 1, borderColor: `${Colors.primary}30` },
  editProfileBtnTxt: { fontFamily: Typography.family.bold, fontSize: Typography.size.xs, color: Colors.primary },
  actionsRow: { flexDirection: 'row', gap: Spacing.sm },
  endorseAction: { flex: 2, borderRadius: Radii.md, overflow: 'hidden' },
  endorseGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 11 },
  endorseActionTxt: { fontFamily: Typography.family.bold, fontSize: Typography.size.sm, color: Colors.bg },
  connectBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, backgroundColor: `${Colors.primary}15`, borderRadius: Radii.md, borderWidth: 1, borderColor: `${Colors.primary}30`, paddingVertical: 11 },
  connectBtnTxt: { fontFamily: Typography.family.bold, fontSize: Typography.size.xs, color: Colors.primary },
  shareBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, backgroundColor: Colors.elevated, borderRadius: Radii.md, borderWidth: 1, borderColor: Colors.border, paddingVertical: 11 },
  shareBtnTxt: { fontFamily: Typography.family.bold, fontSize: Typography.size.xs, color: Colors.textMuted },

  // Tabs bar
  tabsBar: { marginTop: Spacing.lg, borderBottomWidth: 1, borderBottomColor: Colors.border },
  tabBtn: { paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md, position: 'relative' },
  tabBtnActive: {},
  tabBtnTxt: { fontFamily: Typography.family.medium, fontSize: Typography.size.sm, color: Colors.textMuted },
  tabBtnTxtActive: { fontFamily: Typography.family.bold, color: Colors.primary },
  tabUnderline: { position: 'absolute', bottom: 0, left: Spacing.xl, right: Spacing.xl, height: 2, backgroundColor: Colors.primary, borderRadius: 1 },

  // Tab content
  tabContent: { padding: Spacing.lg, gap: Spacing.md },

  // Card base
  card: { backgroundColor: Colors.surface, borderRadius: Radii.lg, padding: Spacing.lg, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden' },

  // Section header
  sh: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: Spacing.md },
  shAccent: { width: 3, height: 14, backgroundColor: Colors.primary, borderRadius: 2 },
  shTitle: { flex: 1, fontFamily: Typography.family.bold, fontSize: Typography.size.md, color: Colors.textPrimary },
  shBtn: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  shBtnTxt: { fontFamily: Typography.family.medium, fontSize: Typography.size.xs, color: Colors.primary },

  // Scout match card
  scoutMatchCard: { borderColor: `${Colors.accent}30` },
  scoutMatchIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.accent, alignItems: 'center', justifyContent: 'center' },
  scoutMatchTitle: { fontFamily: Typography.family.bold, fontSize: Typography.size.md, color: Colors.textPrimary, marginBottom: 4 },
  scoutMatchBody: { fontFamily: Typography.family.regular, fontSize: Typography.size.sm, color: Colors.textMuted, lineHeight: 19 },
  scoutMatchBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: Colors.accent, borderRadius: Radii.md, paddingVertical: 10, marginTop: Spacing.md },
  scoutMatchBtnTxt: { fontFamily: Typography.family.bold, fontSize: Typography.size.sm, color: Colors.bg },

  // Verification
  verifyRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.border },
  verifyIconWrap: { width: 38, height: 38, borderRadius: Radii.md, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  verifyLabel: { fontFamily: Typography.family.bold, fontSize: Typography.size.sm, color: Colors.textPrimary },
  verifySource: { fontFamily: Typography.family.regular, fontSize: 10, color: Colors.textDisabled },
  verifyPill: { borderRadius: Radii.full, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1 },
  verifyPillTxt: { fontFamily: Typography.family.bold, fontSize: 10 },

  // Gauges
  gaugesRow: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: Spacing.sm },
  gaugeWrap: { alignItems: 'center', gap: 5 },
  gaugeCenter: { position: 'absolute' },
  gaugeV: { fontFamily: Typography.family.monoBold, fontSize: 17 },
  gaugeLabel: { fontFamily: Typography.family.medium, fontSize: 11, color: Colors.textPrimary },

  // Stat tiles
  statTilesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginTop: Spacing.md },
  statTile: { flex: 1, minWidth: (SW - 80) / 3, backgroundColor: Colors.elevated, borderRadius: Radii.md, padding: Spacing.md, borderWidth: 1, borderColor: Colors.border, alignItems: 'center' },
  statTileVal: { fontFamily: Typography.family.monoBold, fontSize: Typography.size.xl, color: Colors.textPrimary },
  statTileUnit: { fontFamily: Typography.family.mono, fontSize: 11, color: Colors.textMuted },
  statTileLabel: { fontFamily: Typography.family.mono, fontSize: 9, color: Colors.textDisabled, letterSpacing: 0.8, marginTop: 2 },

  // Bio
  bioTxt: { fontFamily: Typography.family.regular, fontSize: Typography.size.sm, color: Colors.textMuted, lineHeight: 20 },
  moreBtn: { fontFamily: Typography.family.bold, fontSize: Typography.size.sm, color: Colors.primary },
  aiTagTxt: { fontFamily: Typography.family.mono, fontSize: 10, color: Colors.textDisabled, marginBottom: Spacing.md },

  // Highlights
  toggleRow: { flexDirection: 'row', backgroundColor: Colors.elevated, borderRadius: Radii.md, padding: 2, borderWidth: 1, borderColor: Colors.border },
  toggleBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: Radii.sm - 2 },
  toggleBtnActive: { backgroundColor: Colors.surface },
  toggleTxt: { fontFamily: Typography.family.medium, fontSize: Typography.size.xs, color: Colors.textMuted },
  toggleTxtActive: { fontFamily: Typography.family.bold, color: Colors.textPrimary },
  uploadClipBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: `${Colors.primary}15`, borderRadius: Radii.md, paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1, borderColor: `${Colors.primary}28` },
  uploadClipTxt: { fontFamily: Typography.family.bold, fontSize: Typography.size.xs, color: Colors.primary },
  allClipsTxt: { fontFamily: Typography.family.mono, fontSize: 10, color: Colors.textDisabled, letterSpacing: 1.2, marginVertical: Spacing.sm },
  activityEmpty: { alignItems: 'center', paddingVertical: Spacing.xxxl, gap: Spacing.md },
  activityEmptyTxt: { fontFamily: Typography.family.regular, fontSize: Typography.size.sm, color: Colors.textDisabled },

  // Video clip card
  clipCard: { width: 160, marginRight: Spacing.md, backgroundColor: Colors.elevated, borderRadius: Radii.md, overflow: 'hidden', borderWidth: 1, borderColor: Colors.border },
  clipThumb: { height: 100, backgroundColor: Colors.border, position: 'relative' },
  featuredBadge: { position: 'absolute', top: 6, left: 6, flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: Colors.accent, borderRadius: Radii.full, paddingHorizontal: 7, paddingVertical: 3 },
  featuredTxt: { fontFamily: Typography.family.display, fontSize: 8, color: Colors.bg, letterSpacing: 1 },
  playBtn: { position: 'absolute', top: '50%', left: '50%', marginTop: -16, marginLeft: -16, width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  durationChip: { position: 'absolute', bottom: 6, right: 6, backgroundColor: 'rgba(0,0,0,0.7)', borderRadius: 4, paddingHorizontal: 5, paddingVertical: 2 },
  durationTxt: { fontFamily: Typography.family.mono, fontSize: 10, color: Colors.white },
  clipInfo: { padding: Spacing.sm },
  clipTitle: { fontFamily: Typography.family.bold, fontSize: Typography.size.xs, color: Colors.textPrimary, lineHeight: 16 },
  clipTag: { backgroundColor: `${Colors.primary}18`, borderRadius: Radii.xs, paddingHorizontal: 5, paddingVertical: 2 },
  clipTagTxt: { fontFamily: Typography.family.mono, fontSize: 9, color: Colors.primary },
  clipViews: { fontFamily: Typography.family.regular, fontSize: 10, color: Colors.textDisabled },

  // Attributes
  attrRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  attrName: { fontFamily: Typography.family.medium, fontSize: Typography.size.xs, color: Colors.textMuted, width: 70 },
  attrBarWrap: { flex: 1, height: 5, backgroundColor: Colors.elevated, borderRadius: 3, overflow: 'hidden' },
  attrBar: { height: '100%', borderRadius: 3 },
  attrVal: { fontFamily: Typography.family.monoBold, fontSize: Typography.size.sm, width: 26, textAlign: 'right' },
  endorseCount: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  endorseCountTxt: { fontFamily: Typography.family.mono, fontSize: 10, color: Colors.textDisabled },
  endorseBtn: { backgroundColor: `${Colors.primary}18`, borderRadius: Radii.xs, paddingHorizontal: 7, paddingVertical: 3, borderWidth: 1, borderColor: `${Colors.primary}28` },
  endorseBtnTxt: { fontFamily: Typography.family.bold, fontSize: 10, color: Colors.primary },

  // Languages
  langName: { fontFamily: Typography.family.medium, fontSize: Typography.size.sm, color: Colors.textPrimary },
  langProf: { fontFamily: Typography.family.mono, fontSize: Typography.size.xs },
  langBarBg: { height: 5, backgroundColor: Colors.elevated, borderRadius: 3, overflow: 'hidden' },
  langBarFill: { height: '100%', borderRadius: 3 },

  // Similar athletes
  similarRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: 10 },
  similarAv: { width: 38, height: 38, borderRadius: 19, backgroundColor: Colors.elevated, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border },
  similarAvTxt: { fontFamily: Typography.family.bold, fontSize: Typography.size.md, color: Colors.primary },
  similarName: { fontFamily: Typography.family.bold, fontSize: Typography.size.sm, color: Colors.textPrimary },
  similarPos: { fontFamily: Typography.family.regular, fontSize: Typography.size.xs, color: Colors.textMuted },
  aiScoreChip: { flexDirection: 'row', alignItems: 'center', gap: 2, backgroundColor: Colors.accent, borderRadius: Radii.full, paddingHorizontal: 7, paddingVertical: 3 },
  aiScoreChipTxt: { fontFamily: Typography.family.monoBold, fontSize: 10, color: Colors.bg },
  followBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: `${Colors.primary}15`, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: `${Colors.primary}28` },

  // Performance tab
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginTop: Spacing.xs },
  statsCell: { flex: 1, minWidth: (SW - 80) / 2 - 8, backgroundColor: Colors.elevated, borderRadius: Radii.md, padding: Spacing.md, borderWidth: 1, borderColor: Colors.border },
  statsCellVal: { fontFamily: Typography.family.monoBold, fontSize: Typography.size.xxl, color: Colors.primary },
  statsCellLabel: { fontFamily: Typography.family.medium, fontSize: 11, color: Colors.textPrimary, marginTop: 2 },
  statsCellSub: { fontFamily: Typography.family.mono, fontSize: 9, color: Colors.textDisabled },
  matchStatRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  resultBadge: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5 },
  resultTxt: { fontFamily: Typography.family.bold, fontSize: 11, color: Colors.textPrimary },
  matchOpp: { fontFamily: Typography.family.bold, fontSize: Typography.size.sm, color: Colors.textPrimary },
  matchDate: { fontFamily: Typography.family.regular, fontSize: Typography.size.xs, color: Colors.textDisabled },
  matchRating: { fontFamily: Typography.family.monoBold, fontSize: Typography.size.lg, color: Colors.primary },
  anaRow: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.xs },
  anaCell: { flex: 1, backgroundColor: Colors.elevated, borderRadius: Radii.md, padding: Spacing.lg, alignItems: 'center', gap: 6, borderWidth: 1, borderColor: Colors.border },
  anaCellTxt: { fontFamily: Typography.family.medium, fontSize: Typography.size.xs, color: Colors.textMuted },
  goToSettingsBtn: { backgroundColor: `${Colors.primary}15`, borderRadius: Radii.md, paddingVertical: 9, paddingHorizontal: Spacing.xl, borderWidth: 1, borderColor: `${Colors.primary}30`, marginTop: Spacing.sm },
  goToSettingsTxt: { fontFamily: Typography.family.bold, fontSize: Typography.size.sm, color: Colors.primary },

  // Career tab
  timelineItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 0 },
  timelineDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: Colors.textDisabled, borderWidth: 2, borderColor: Colors.border, marginTop: 14 },
  timelineDotActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  timelineLine: { width: 2, flex: 1, backgroundColor: Colors.border, marginLeft: 5, minHeight: 20 },
  timelineCard: { flex: 1, backgroundColor: Colors.elevated, borderRadius: Radii.md, padding: Spacing.md, marginLeft: Spacing.md, marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.border },
  clubName: { fontFamily: Typography.family.bold, fontSize: Typography.size.md, color: Colors.textPrimary },
  clubRole: { fontFamily: Typography.family.medium, fontSize: Typography.size.sm, color: Colors.textMuted },
  clubPeriod: { fontFamily: Typography.family.mono, fontSize: Typography.size.xs, color: Colors.primary, marginTop: 2 },
  currentBadge: { backgroundColor: `${Colors.primary}18`, borderRadius: Radii.full, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: `${Colors.primary}28` },
  currentBadgeTxt: { fontFamily: Typography.family.bold, fontSize: 10, color: Colors.primary },
  clubStats: { flexDirection: 'row', gap: Spacing.lg, marginTop: Spacing.sm, paddingTop: Spacing.sm, borderTopWidth: 1, borderTopColor: Colors.border },
  clubStatItem: { alignItems: 'center' },
  clubStatVal: { fontFamily: Typography.family.monoBold, fontSize: Typography.size.xl, color: Colors.primary },
  clubStatLbl: { fontFamily: Typography.family.mono, fontSize: 9, color: Colors.textDisabled },
  milestoneRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.border },
  milestoneIcon: { width: 34, height: 34, borderRadius: Radii.sm, backgroundColor: `${Colors.accent}15`, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: `${Colors.accent}28` },
  milestoneTxt: { fontFamily: Typography.family.bold, fontSize: Typography.size.sm, color: Colors.textPrimary },
  milestoneDate: { fontFamily: Typography.family.mono, fontSize: Typography.size.xs, color: Colors.textDisabled },

  // Network tab
  networkStats: { flexDirection: 'row', marginBottom: Spacing.md },
  networkStat: { flex: 1, alignItems: 'center', paddingVertical: Spacing.sm },
  networkStatVal: { fontFamily: Typography.family.monoBold, fontSize: Typography.size.xxl, color: Colors.primary },
  networkStatLbl: { fontFamily: Typography.family.regular, fontSize: 10, color: Colors.textMuted },
  networkRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: 10 },
  networkAv: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.elevated, alignItems: 'center', justifyContent: 'center', borderWidth: 2 },
  networkAvTxt: { fontFamily: Typography.family.bold, fontSize: Typography.size.md, color: Colors.primary },
  networkName: { fontFamily: Typography.family.bold, fontSize: Typography.size.sm, color: Colors.textPrimary },
  networkRole: { fontFamily: Typography.family.regular, fontSize: Typography.size.xs, color: Colors.textMuted },
  networkTypePill: { borderRadius: Radii.full, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1 },
  networkTypeTxt: { fontFamily: Typography.family.bold, fontSize: 10 },
});
