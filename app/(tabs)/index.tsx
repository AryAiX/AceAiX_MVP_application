import React, { useMemo, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, Dimensions,
  Animated, AccessibilityInfo,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Polygon, Line, Path } from 'react-native-svg';
import {
  BadgeCheck, Flame, Shield, Eye, Star, TrendingUp, ChevronRight,
  Zap, MessageCircle, Sparkles, MapPin, Clock, Target,
} from 'lucide-react-native';
import { AppHeader } from '@/components/AppHeader';
import { useAuth } from '@/context/AuthContext';
import { Colors, Typography, Spacing, Radii } from '@/constants/theme';
import { useRouter } from 'expo-router';

const { width: SW } = Dimensions.get('window');

// ── Static demo data ─────────────────────────────────────────────────────────
const FORM = [
  { r: 'W', opp: 'Al Jazira', rating: 8.2, g: 2, a: 1 },
  { r: 'W', opp: 'Shabab Al Ahli', rating: 7.8, g: 1, a: 0 },
  { r: 'D', opp: 'Al Wahda', rating: 6.5, g: 0, a: 1 },
  { r: 'L', opp: 'Al Ain', rating: 6.1, g: 0, a: 0 },
  { r: 'W', opp: 'Baniyas SC', rating: 7.5, g: 1, a: 2 },
];

const ATTRIBUTES = [
  { label: 'Pace', v: 85 }, { label: 'Shooting', v: 78 },
  { label: 'Passing', v: 82 }, { label: 'Defending', v: 45 }, { label: 'Physical', v: 76 },
];

const CAREER = {
  years: ['2020', '2021', '2022', '2023', '2024', '2025'],
  actual:   [6.2, 7.1, 7.8, 8.0, 8.4, 8.7],
  forecast: [6.2, 7.1, 7.8, 8.3, 8.9, 9.4],
};

const SCOUTS = [
  { name: 'Manchester United FC', role: 'Head Scout', verified: true, time: '2h ago', views: 12 },
  { name: 'Al Nassr FC', role: 'Talent Scout', verified: true, time: '1d ago', views: 8 },
  { name: 'AC Milan', role: 'Regional Scout', verified: false, time: '3d ago', views: 5 },
];

const OPPS = [
  { title: 'Central Midfielder', club: 'Al Nassr FC', loc: 'Riyadh, SA',
    salary: '$1.2M – $2M/yr', tag: 'Hot Match', isNew: true, match: 94 },
  { title: 'Attacking Midfielder', club: 'Al Hilal', loc: 'Riyadh, SA',
    salary: '$800K – $1.5M/yr', tag: 'AI Match', isNew: false, match: 87 },
];

const STAT_CARDS = [
  { label: 'Scout Views', value: '2,847', delta: '+23%', sub: 'this month', up: true, Icon: Eye },
  { label: 'Endorsements', value: '24', delta: '+3', sub: 'this month', up: true, Icon: Star },
  { label: 'Open Opps', value: '18', delta: '7 new', sub: 'today', up: true, Icon: Target },
  { label: 'Regional Rank', value: '#47', delta: '↑12', sub: 'spots', up: true, Icon: TrendingUp },
];

const CHECKLIST = [
  { label: 'Complete profile info', key: 'full_name' },
  { label: 'Upload profile photo', key: 'avatar_url' },
  { label: 'Medical verification', key: null },
  { label: 'Get endorsements', key: null },
  { label: 'Add match records', key: null },
];

// ── LIVE pulse dot ────────────────────────────────────────────────────────────
function LiveDot({ reduced }: { reduced: boolean }) {
  const anim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (reduced) return;
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 0.25, duration: 700, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 1, duration: 700, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return <Animated.View style={[s.liveDot, { opacity: anim }]} />;
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
    <View style={[{ padding: 6 }, style]}>
      <View style={corner(true, true)} />
      <View style={corner(true, false)} />
      <View style={corner(false, true)} />
      <View style={corner(false, false)} />
      {children}
    </View>
  );
}

// ── Angular beam section header ───────────────────────────────────────────────
function BeamHeader({ label, accent = Colors.primary }: { label: string; accent?: string }) {
  return (
    <View style={s.beamWrap}>
      <View style={[s.beamBar, { backgroundColor: accent }]} />
      <Text style={[s.beamLabel, { color: accent }]}>{label.toUpperCase()}</Text>
    </View>
  );
}

// ── Staggered card reveal ─────────────────────────────────────────────────────
function RevealCard({ children, index, style, reduced }: {
  children: React.ReactNode; index: number; style?: object; reduced: boolean;
}) {
  const opacity = useRef(new Animated.Value(reduced ? 1 : 0)).current;
  const translateY = useRef(new Animated.Value(reduced ? 0 : 16)).current;

  useEffect(() => {
    if (reduced) return;
    const delay = 60 + index * 50;
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 320, delay, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 320, delay, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[s.card, style, { opacity, transform: [{ translateY }] }]}>
      {children}
    </Animated.View>
  );
}

// ── SVG gauge (static arc) ────────────────────────────────────────────────────
function Gauge({ value, max = 10, size = 88, sw = 8, color, bg }: {
  value: number; max?: number; size?: number; sw?: number; color: string; bg: string;
}) {
  const r = (size - sw) / 2;
  const circ = 2 * Math.PI * r;
  const filled = Math.min(value / max, 1) * circ;
  const c = size / 2;
  return (
    <Svg width={size} height={size}>
      <Circle cx={c} cy={c} r={r} stroke={bg} strokeWidth={sw} fill="none" />
      <Circle cx={c} cy={c} r={r} stroke={color} strokeWidth={sw} fill="none"
        strokeDasharray={`${filled} ${circ - filled}`}
        strokeLinecap="round"
        transform={`rotate(-90, ${c}, ${c})`}
      />
    </Svg>
  );
}

// ── Radar chart ───────────────────────────────────────────────────────────────
function RadarChart({ data, size = 170 }: { data: number[]; size?: number }) {
  const cx = size / 2, cy = size / 2, maxR = size / 2 - 26;
  const n = data.length;
  const angles = data.map((_, i) => (i * 2 * Math.PI) / n - Math.PI / 2);
  const pts = (scale: number) =>
    angles.map(a => `${cx + maxR * scale * Math.cos(a)},${cy + maxR * scale * Math.sin(a)}`).join(' ');
  const dataPts = data.map((v, i) =>
    `${cx + (v / 100) * maxR * Math.cos(angles[i])},${cy + (v / 100) * maxR * Math.sin(angles[i])}`
  ).join(' ');
  return (
    <Svg width={size} height={size}>
      {[0.25, 0.5, 0.75, 1].map(sc => (
        <Polygon key={sc} points={pts(sc)} stroke={Colors.border} strokeWidth="1" fill="none" />
      ))}
      {angles.map((a, i) => (
        <Line key={i} x1={cx} y1={cy}
          x2={cx + maxR * Math.cos(a)} y2={cy + maxR * Math.sin(a)}
          stroke={Colors.border} strokeWidth="1" />
      ))}
      <Polygon points={dataPts} fill={`${Colors.primary}28`} stroke={Colors.primary} strokeWidth="2" />
    </Svg>
  );
}

function LineChart({ actual, forecast, w, h }: { actual: number[]; forecast: number[]; w: number; h: number }) {
  const pad = { t: 8, r: 8, b: 8, l: 8 };
  const cw = w - pad.l - pad.r, ch = h - pad.t - pad.b;
  const all = [...actual, ...forecast];
  const minV = Math.min(...all) - 0.3, maxV = Math.max(...all) + 0.3;
  const xS = (i: number) => pad.l + (i / (actual.length - 1)) * cw;
  const yS = (v: number) => pad.t + ch - ((v - minV) / (maxV - minV)) * ch;
  const aPath = actual.map((v, i) => `${i === 0 ? 'M' : 'L'}${xS(i)},${yS(v)}`).join(' ');
  const fPath = forecast.map((v, i) => `${i === 0 ? 'M' : 'L'}${xS(i)},${yS(v)}`).join(' ');
  return (
    <Svg width={w} height={h}>
      <Path d={aPath} stroke={Colors.primary} strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <Path d={fPath} stroke={Colors.accent} strokeWidth="2" fill="none" strokeDasharray="5,4" strokeLinecap="round" />
    </Svg>
  );
}

function SH({ title, onMore }: { title: string; onMore?: () => void }) {
  return (
    <View style={s.sh}>
      <Text style={s.shTitle}>{title}</Text>
      {onMore && (
        <TouchableOpacity onPress={onMore} style={s.shMore}>
          <Text style={s.shMoreTxt}>View all</Text>
          <ChevronRight color={Colors.primary} size={14} />
        </TouchableOpacity>
      )}
    </View>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────
export default function Dashboard() {
  const { profile } = useAuth();
  const router = useRouter();
  const [reduced, setReduced] = React.useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduced);
  }, []);

  const completedKeys = useMemo(() => {
    if (!profile) return new Set<string>();
    return new Set(Object.entries(profile).filter(([, v]) => !!v).map(([k]) => k));
  }, [profile]);

  const completeness = useMemo(() => {
    const keys = CHECKLIST.map(c => c.key).filter(Boolean) as string[];
    const done = keys.filter(k => completedKeys.has(k)).length;
    return Math.round((done / keys.length) * 100);
  }, [completedKeys]);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const GAUGES = [
    { label: 'Visibility', v: 9.2, max: 10, color: Colors.accent, sub: 'Scout Reach', detail: 'Top 8%' },
    { label: 'AI Score', v: 8.7, max: 10, color: Colors.primary, sub: 'vs Peers', detail: 'UAE Pro' },
    { label: 'Profile', v: completeness, max: 100, color: Colors.primary, sub: 'Complete', detail: `${completeness}%` },
  ];

  return (
    <View style={s.root}>
      <AppHeader title="Dashboard" />
      <ScrollView style={s.scroll} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

        {/* ── Hero ── */}
        <RevealCard index={0} reduced={reduced}>
          <LinearGradient
            colors={[`${Colors.primary}12`, Colors.surface, Colors.surface]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={s.heroGrad}
          >
            <View style={s.heroTop}>
              <View style={{ flex: 1 }}>
                <Text style={s.greeting}>{greeting},</Text>
                <View style={s.nameRow}>
                  <Text style={s.heroName} numberOfLines={1}>
                    {profile?.full_name?.split(' ')[0] ?? 'Athlete'}
                  </Text>
                  <BadgeCheck color={Colors.primary} size={20} />
                </View>
                <Text style={s.heroBio} numberOfLines={2}>
                  {[profile?.position, profile?.sport, profile?.league, profile?.nationality]
                    .filter(Boolean).join(' · ') || 'Professional Athlete'}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end', gap: Spacing.sm }}>
                <View style={s.livePill}>
                  <LiveDot reduced={reduced} />
                  <Text style={s.liveTxt}>LIVE</Text>
                </View>
                <TouchableOpacity style={s.viewPubBtn} onPress={() => router.push('/(tabs)/public-profile' as any)}>
                  <Text style={s.viewPubTxt}>View Public</Text>
                </TouchableOpacity>
              </View>
            </View>
            <View style={s.formRow}>
              <View>
                <Text style={s.formLabel}>RECENT FORM</Text>
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  {FORM.map((m, i) => (
                    <View key={i} style={[s.fc,
                      m.r === 'W' && s.fw, m.r === 'D' && s.fd, m.r === 'L' && s.fl]}>
                      <Text style={s.fcTxt}>{m.r}</Text>
                    </View>
                  ))}
                </View>
                <Text style={s.formSub}>Last 5 matches</Text>
              </View>
              <View style={s.avgBox}>
                <Flame color={Colors.accent} size={16} fill={Colors.accent} />
                <View>
                  <Text style={s.avgVal}>7.6</Text>
                  <Text style={s.avgSub}>Avg rating</Text>
                </View>
              </View>
            </View>
          </LinearGradient>
        </RevealCard>

        {/* ── Telemetry Cluster (HUD) ── */}
        <RevealCard index={1} reduced={reduced}>
          <BeamHeader label="Telemetry" accent={Colors.accent} />
          <HudFrame style={{ marginTop: Spacing.sm }}>
            <View style={s.gaugesRow}>
              {GAUGES.map(({ label, v, max, color, sub, detail }) => (
                <View key={label} style={s.gaugeWrap}>
                  <View style={{ position: 'relative', alignItems: 'center', justifyContent: 'center' }}>
                    <Gauge value={v} max={max} color={color} bg={`${color}20`} size={86} sw={8} />
                    <View style={s.gaugeCenter}>
                      <Text style={[s.gaugeV, { color }]}>
                        {max === 100 ? `${v}%` : v.toFixed(1)}
                      </Text>
                    </View>
                  </View>
                  <Text style={s.gaugeLabel}>{label}</Text>
                  <Text style={s.gaugeSub}>{sub}</Text>
                  <Text style={[s.gaugeDetail, { color }]}>{detail}</Text>
                </View>
              ))}
            </View>
          </HudFrame>
        </RevealCard>

        {/* ── Stat Grid ── */}
        <BeamHeader label="At a Glance" />
        <View style={s.statGrid}>
          {STAT_CARDS.map(({ label, value, delta, sub, up, Icon }, i) => (
            <RevealCard key={label} index={2 + i} reduced={reduced} style={s.statCard}>
              <Icon color={Colors.primary} size={18} />
              <Text style={s.statVal}>{value}</Text>
              <Text style={s.statLabel}>{label}</Text>
              <View style={{ flexDirection: 'row' }}>
                <Text style={[s.statDelta, { color: up ? Colors.success : Colors.error }]}>{delta}</Text>
                <Text style={s.statSub}> {sub}</Text>
              </View>
            </RevealCard>
          ))}
        </View>

        {/* ── Profile Strength ── */}
        <RevealCard index={6} reduced={reduced}>
          <SH title="Profile Strength" />
          <View style={s.strengthBg}>
            <LinearGradient colors={[Colors.primary, Colors.accent]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={[s.strengthFill, { width: `${completeness}%` }]} />
          </View>
          <Text style={s.strengthPct}>{completeness}% complete</Text>
          <View style={{ gap: 8 }}>
            {CHECKLIST.map(item => {
              const done = item.key ? completedKeys.has(item.key) : false;
              return (
                <View key={item.label} style={s.checkRow}>
                  <View style={[s.checkDot, done && s.checkDotOn]} />
                  <Text style={[s.checkTxt, done && s.checkTxtOn]}>{item.label}</Text>
                </View>
              );
            })}
          </View>
        </RevealCard>

        {/* ── Attribute Breakdown ── */}
        <RevealCard index={7} reduced={reduced}>
          <BeamHeader label="Attribute Breakdown" />
          <Text style={s.aiTag}>AI-calculated · {profile?.sport ?? 'Football'} · 2024/25</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <RadarChart data={ATTRIBUTES.map(a => a.v)} size={170} />
            <View style={{ flex: 1, gap: 10, paddingLeft: Spacing.md }}>
              {ATTRIBUTES.map(a => (
                <View key={a.label} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={s.attrLabel}>{a.label}</Text>
                  <Text style={s.attrVal}>{a.v}</Text>
                </View>
              ))}
            </View>
          </View>
        </RevealCard>

        {/* ── Career Trajectory ── */}
        <RevealCard index={8} reduced={reduced}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.sm }}>
            <BeamHeader label="Career Trajectory" />
            <View style={s.top15}>
              <Sparkles color={Colors.accent} size={12} />
              <Text style={s.top15Txt}>Top 15%</Text>
            </View>
          </View>
          <LineChart actual={CAREER.actual} forecast={CAREER.forecast} w={SW - 64} h={110} />
          <View style={s.yearRow}>
            {CAREER.years.map(y => <Text key={y} style={s.yearLabel}>{y}</Text>)}
          </View>
          <View style={{ flexDirection: 'row', gap: Spacing.lg, marginTop: Spacing.sm }}>
            <View style={s.legendItem}>
              <View style={[s.legendLine, { backgroundColor: Colors.primary }]} />
              <Text style={s.legendTxt}>Actual</Text>
            </View>
            <View style={s.legendItem}>
              <View style={[s.legendLine, { backgroundColor: Colors.accent }]} />
              <Text style={s.legendTxt}>Forecast</Text>
            </View>
          </View>
        </RevealCard>

        {/* ── Medical Intelligence ── */}
        <RevealCard index={9} reduced={reduced}>
          <SH title="Medical Intelligence" onMore={() => router.push('/(tabs)/medical' as any)} />
          <View style={s.medPill}>
            <Shield color={Colors.success} size={14} />
            <Text style={s.medPillTxt}>Cleared · Full clearance active</Text>
          </View>
          <Text style={s.medDesc}>AI Risk: Low risk profile. No flagged conditions. Fitness trending upward.</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <Clock color={Colors.textDisabled} size={11} />
            <Text style={s.medTime}>Last verified: Jun 15, 2025</Text>
            <BadgeCheck color={Colors.primary} size={13} />
            <Text style={s.medVerified}>Verified</Text>
          </View>
        </RevealCard>

        {/* ── Scout Interest ── */}
        <RevealCard index={10} reduced={reduced}>
          <SH title="Recent Scout Interest" onMore={() => router.push('/(tabs)/network' as any)} />
          {SCOUTS.map(sc => (
            <View key={sc.name} style={s.scoutRow}>
              <View style={s.scoutAv}>
                <Text style={s.scoutAvTxt}>{sc.name[0]}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Text style={s.scoutName}>{sc.name}</Text>
                  {sc.verified && <BadgeCheck color={Colors.primary} size={12} />}
                </View>
                <Text style={s.scoutRole}>{sc.role}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={s.scoutViews}>{sc.views} views</Text>
                <Text style={s.scoutTime}>{sc.time}</Text>
              </View>
            </View>
          ))}
        </RevealCard>

        {/* ── Matched Opportunities ── */}
        <RevealCard index={11} reduced={reduced}>
          <SH title="Matched Opportunities" onMore={() => router.push('/(tabs)/opportunities' as any)} />
          {OPPS.map(opp => (
            <View key={opp.title} style={s.oppCard}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  {opp.isNew && <View style={s.oppNew}><Text style={s.oppNewTxt}>New</Text></View>}
                  <View style={[s.oppTag, { backgroundColor: opp.tag === 'Hot Match' ? `${Colors.error}20` : `${Colors.primary}20` }]}>
                    <Text style={[s.oppTagTxt, { color: opp.tag === 'Hot Match' ? Colors.error : Colors.primary }]}>{opp.tag}</Text>
                  </View>
                </View>
                <Text style={s.oppMatch}>{opp.match}%</Text>
              </View>
              <Text style={s.oppTitle}>{opp.title}</Text>
              <Text style={s.oppClub}>{opp.club}</Text>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <MapPin color={Colors.textDisabled} size={11} />
                  <Text style={s.oppLoc}>{opp.loc}</Text>
                </View>
                <Text style={s.oppSalary}>{opp.salary}</Text>
              </View>
            </View>
          ))}
        </RevealCard>

        {/* ── AI Coach ── */}
        <RevealCard index={12} reduced={reduced} style={{ borderColor: `${Colors.primary}35` }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.md }}>
            <View style={s.aiAv}>
              <Zap color={Colors.bg} size={18} fill={Colors.bg} />
            </View>
            <View>
              <Text style={s.aiName}>AI Career Coach</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                <View style={s.aiStatusDot} />
                <Text style={s.aiOnline}>Online · Ready</Text>
              </View>
            </View>
          </View>
          <View style={s.aiBubble}>
            <Text style={s.aiBubbleTxt}>
              Based on your recent form (+3 wins), your visibility score has increased by 0.4 points.
              Consider adding highlight clips to reach the Top 5% globally.
            </Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: Spacing.md }}>
            {['Improve my score', 'Matching clubs', 'Training plan'].map(chip => (
              <TouchableOpacity key={chip} style={s.aiChip} onPress={() => router.push('/(tabs)/ai-coach' as any)}>
                <Text style={s.aiChipTxt}>{chip}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <TouchableOpacity style={s.aiInput} onPress={() => router.push('/(tabs)/ai-coach' as any)}>
            <Text style={s.aiPlaceholder}>Ask your AI coach…</Text>
            <MessageCircle color={Colors.primary} size={18} />
          </TouchableOpacity>
        </RevealCard>

        {/* ── Last 5 Match Performances ── */}
        <RevealCard index={13} reduced={reduced}>
          <SH title="Last 5 Performances" onMore={() => router.push('/(tabs)/performance' as any)} />
          {FORM.map((m, i) => (
            <View key={i} style={[s.matchRow, i < FORM.length - 1 && { borderBottomWidth: 1, borderBottomColor: Colors.border }]}>
              <View style={[s.mr, m.r === 'W' && s.mrW, m.r === 'D' && s.mrD, m.r === 'L' && s.mrL]}>
                <Text style={s.mrTxt}>{m.r}</Text>
              </View>
              <Text style={s.matchOpp}>{m.opp}</Text>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={s.matchRating}>{m.rating.toFixed(1)}</Text>
                <Text style={s.matchGoals}>{m.g}G {m.a}A</Text>
              </View>
            </View>
          ))}
        </RevealCard>

        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  scroll: { flex: 1 },
  content: { padding: Spacing.lg, gap: Spacing.md },
  card: { backgroundColor: Colors.surface, borderRadius: Radii.lg, padding: Spacing.lg, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden' },
  heroGrad: { borderRadius: Radii.md, margin: -Spacing.lg, padding: Spacing.lg },

  sh: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.md },
  shTitle: { fontFamily: Typography.family.bold, fontSize: Typography.size.md, color: Colors.textPrimary },
  shMore: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  shMoreTxt: { fontFamily: Typography.family.medium, fontSize: Typography.size.sm, color: Colors.primary },

  // Beam header
  beamWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: Spacing.sm },
  beamBar: { width: 3, height: 14, borderRadius: 2 },
  beamLabel: { fontFamily: Typography.family.display, fontSize: Typography.size.xs, letterSpacing: 1.5 },

  // Hero
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.lg },
  greeting: { fontFamily: Typography.family.regular, fontSize: Typography.size.sm, color: Colors.textMuted },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2, marginBottom: 4 },
  heroName: { fontFamily: Typography.family.display, fontSize: 30, color: Colors.textPrimary },
  heroBio: { fontFamily: Typography.family.regular, fontSize: Typography.size.xs, color: Colors.textMuted, maxWidth: 180 },
  livePill: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: `${Colors.success}18`, borderRadius: Radii.full, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: `${Colors.success}35` },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.success },
  liveTxt: { fontFamily: Typography.family.display, fontSize: 11, color: Colors.success, letterSpacing: 1.5 },
  viewPubBtn: { backgroundColor: `${Colors.primary}18`, borderRadius: Radii.md, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: `${Colors.primary}35` },
  viewPubTxt: { fontFamily: Typography.family.bold, fontSize: Typography.size.xs, color: Colors.primary },
  formRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.border },
  formLabel: { fontFamily: Typography.family.display, fontSize: 10, color: Colors.textMuted, marginBottom: 8, letterSpacing: 1.2 },
  fc: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  fw: { backgroundColor: `${Colors.success}28`, borderWidth: 1.5, borderColor: Colors.success },
  fd: { backgroundColor: `${Colors.warning}28`, borderWidth: 1.5, borderColor: Colors.warning },
  fl: { backgroundColor: `${Colors.error}28`, borderWidth: 1.5, borderColor: Colors.error },
  fcTxt: { fontFamily: Typography.family.bold, fontSize: 11, color: Colors.textPrimary },
  formSub: { fontFamily: Typography.family.regular, fontSize: 10, color: Colors.textDisabled, marginTop: 4 },
  avgBox: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: `${Colors.accent}12`, borderRadius: Radii.md, padding: Spacing.md, borderWidth: 1, borderColor: `${Colors.accent}25` },
  avgVal: { fontFamily: Typography.family.bold, fontSize: Typography.size.xl, color: Colors.textPrimary },
  avgSub: { fontFamily: Typography.family.regular, fontSize: Typography.size.xs, color: Colors.textMuted },

  // Gauges
  gaugesRow: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: Spacing.sm },
  gaugeWrap: { alignItems: 'center', gap: 4 },
  gaugeCenter: { position: 'absolute' },
  gaugeV: { fontFamily: Typography.family.bold, fontSize: 13 },
  gaugeLabel: { fontFamily: Typography.family.bold, fontSize: Typography.size.sm, color: Colors.textPrimary },
  gaugeSub: { fontFamily: Typography.family.regular, fontSize: 10, color: Colors.textMuted },
  gaugeDetail: { fontFamily: Typography.family.mono, fontSize: 10 },

  // Profile Strength
  strengthBg: { height: 8, backgroundColor: Colors.elevated, borderRadius: 4, overflow: 'hidden', marginBottom: 6 },
  strengthFill: { height: '100%', borderRadius: 4 },
  strengthPct: { fontFamily: Typography.family.mono, fontSize: Typography.size.xs, color: Colors.textMuted, marginBottom: Spacing.md },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  checkDot: { width: 16, height: 16, borderRadius: 8, borderWidth: 2, borderColor: Colors.border },
  checkDotOn: { backgroundColor: Colors.success, borderColor: Colors.success },
  checkTxt: { fontFamily: Typography.family.regular, fontSize: Typography.size.sm, color: Colors.textMuted },
  checkTxtOn: { color: Colors.textPrimary, textDecorationLine: 'line-through' },

  // Stat grid
  statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  statCard: { flex: 1, minWidth: (SW - 48) / 2 - 16, gap: 4 },
  statVal: { fontFamily: Typography.family.bold, fontSize: 22, color: Colors.textPrimary, marginTop: 4 },
  statLabel: { fontFamily: Typography.family.medium, fontSize: 11, color: Colors.textMuted },
  statDelta: { fontFamily: Typography.family.bold, fontSize: Typography.size.sm },
  statSub: { fontFamily: Typography.family.regular, fontSize: Typography.size.xs, color: Colors.textDisabled },

  // Radar
  aiTag: { fontFamily: Typography.family.mono, fontSize: 10, color: Colors.textDisabled, marginBottom: Spacing.md },
  attrLabel: { fontFamily: Typography.family.medium, fontSize: Typography.size.sm, color: Colors.textMuted },
  attrVal: { fontFamily: Typography.family.bold, fontSize: Typography.size.sm, color: Colors.primary },

  // Career chart
  top15: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: `${Colors.accent}18`, borderRadius: Radii.full, paddingHorizontal: 8, paddingVertical: 3 },
  top15Txt: { fontFamily: Typography.family.bold, fontSize: 11, color: Colors.accent },
  yearRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  yearLabel: { fontFamily: Typography.family.mono, fontSize: 9, color: Colors.textDisabled },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendLine: { width: 16, height: 3, borderRadius: 2 },
  legendTxt: { fontFamily: Typography.family.regular, fontSize: Typography.size.xs, color: Colors.textMuted },

  // Medical
  medPill: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: `${Colors.success}15`, borderRadius: Radii.full, paddingHorizontal: 12, paddingVertical: 5, alignSelf: 'flex-start', borderWidth: 1, borderColor: `${Colors.success}28`, marginBottom: 10 },
  medPillTxt: { fontFamily: Typography.family.bold, fontSize: Typography.size.xs, color: Colors.success },
  medDesc: { fontFamily: Typography.family.regular, fontSize: Typography.size.sm, color: Colors.textMuted, lineHeight: 20, marginBottom: 8 },
  medTime: { fontFamily: Typography.family.mono, fontSize: 10, color: Colors.textDisabled, flex: 1 },
  medVerified: { fontFamily: Typography.family.bold, fontSize: 10, color: Colors.primary },

  // Scout
  scoutRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.border },
  scoutAv: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.elevated, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border },
  scoutAvTxt: { fontFamily: Typography.family.bold, fontSize: Typography.size.md, color: Colors.primary },
  scoutName: { fontFamily: Typography.family.bold, fontSize: Typography.size.sm, color: Colors.textPrimary },
  scoutRole: { fontFamily: Typography.family.regular, fontSize: Typography.size.xs, color: Colors.textMuted },
  scoutViews: { fontFamily: Typography.family.mono, fontSize: Typography.size.xs, color: Colors.primary },
  scoutTime: { fontFamily: Typography.family.regular, fontSize: 10, color: Colors.textDisabled },

  // Opportunities
  oppCard: { backgroundColor: Colors.elevated, borderRadius: Radii.md, padding: Spacing.md, marginBottom: 8, borderWidth: 1, borderColor: Colors.border },
  oppNew: { backgroundColor: `${Colors.success}20`, borderRadius: Radii.full, paddingHorizontal: 8, paddingVertical: 2, borderWidth: 1, borderColor: `${Colors.success}35` },
  oppNewTxt: { fontFamily: Typography.family.bold, fontSize: 10, color: Colors.success },
  oppTag: { borderRadius: Radii.full, paddingHorizontal: 8, paddingVertical: 2 },
  oppTagTxt: { fontFamily: Typography.family.bold, fontSize: 10 },
  oppMatch: { fontFamily: Typography.family.bold, fontSize: Typography.size.sm, color: Colors.accent },
  oppTitle: { fontFamily: Typography.family.bold, fontSize: Typography.size.md, color: Colors.textPrimary },
  oppClub: { fontFamily: Typography.family.medium, fontSize: Typography.size.sm, color: Colors.textMuted, marginBottom: 8 },
  oppLoc: { fontFamily: Typography.family.regular, fontSize: Typography.size.xs, color: Colors.textDisabled },
  oppSalary: { fontFamily: Typography.family.mono, fontSize: Typography.size.xs, color: Colors.success },

  // AI Coach
  aiAv: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  aiName: { fontFamily: Typography.family.bold, fontSize: Typography.size.md, color: Colors.textPrimary },
  aiStatusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.success },
  aiOnline: { fontFamily: Typography.family.regular, fontSize: Typography.size.xs, color: Colors.success },
  aiBubble: { backgroundColor: Colors.elevated, borderRadius: Radii.md, padding: Spacing.md, marginBottom: Spacing.md, borderLeftWidth: 3, borderLeftColor: Colors.primary },
  aiBubbleTxt: { fontFamily: Typography.family.regular, fontSize: Typography.size.sm, color: Colors.textPrimary, lineHeight: 20 },
  aiChip: { backgroundColor: `${Colors.primary}15`, borderRadius: Radii.full, paddingHorizontal: 14, paddingVertical: 7, marginRight: 8, borderWidth: 1, borderColor: `${Colors.primary}28` },
  aiChipTxt: { fontFamily: Typography.family.medium, fontSize: Typography.size.sm, color: Colors.primary },
  aiInput: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: Colors.elevated, borderRadius: Radii.md, paddingHorizontal: 14, paddingVertical: 12, borderWidth: 1, borderColor: Colors.border },
  aiPlaceholder: { fontFamily: Typography.family.regular, fontSize: Typography.size.sm, color: Colors.textDisabled },

  // Match history
  matchRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  mr: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  mrW: { backgroundColor: `${Colors.success}25`, borderWidth: 1.5, borderColor: Colors.success },
  mrD: { backgroundColor: `${Colors.warning}25`, borderWidth: 1.5, borderColor: Colors.warning },
  mrL: { backgroundColor: `${Colors.error}25`, borderWidth: 1.5, borderColor: Colors.error },
  mrTxt: { fontFamily: Typography.family.bold, fontSize: 11, color: Colors.textPrimary },
  matchOpp: { flex: 1, fontFamily: Typography.family.medium, fontSize: Typography.size.sm, color: Colors.textPrimary },
  matchRating: { fontFamily: Typography.family.bold, fontSize: Typography.size.md, color: Colors.primary },
  matchGoals: { fontFamily: Typography.family.regular, fontSize: Typography.size.xs, color: Colors.textMuted },
});
