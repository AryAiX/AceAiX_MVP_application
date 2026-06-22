import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Share,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  X,
  MapPin,
  DollarSign,
  Calendar,
  Trophy,
  BadgeCheck,
  Bookmark,
  Share2,
  ChevronRight,
  Zap,
  Target,
  Users,
  Star,
  TrendingUp,
} from 'lucide-react-native';
import { Colors, Spacing, Radii, Typography } from '@/constants/theme';
import {
  Opportunity,
  formatSalary,
  deadlineLabel,
  oppTimeAgo,
  toggleOpportunitySave,
  APP_STATUS_LABELS,
  APP_STATUS_COLORS,
} from '@/lib/opportunitiesService';
import { useAuth } from '@/context/AuthContext';

interface Props {
  opportunity: Opportunity | null;
  onClose: () => void;
  onApply: (opp: Opportunity) => void;
  onSaveToggled: (oppId: string, nowSaved: boolean) => void;
}

const REASON_ICONS: Record<string, React.ElementType> = {
  'Position fit': Target,
  'Location match': MapPin,
  'Level match': Trophy,
  'Age range': Users,
  'Sport match': Star,
  'Profile complete': TrendingUp,
};

export function OpportunityDetail({ opportunity, onClose, onApply, onSaveToggled }: Props) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  if (!opportunity) return null;

  const salary = formatSalary(opportunity);
  const deadline = deadlineLabel(opportunity.deadline);
  const isExpiring = !!opportunity.deadline && (() => {
    const d = new Date(opportunity.deadline!);
    const diff = Math.ceil((d.getTime() - Date.now()) / 86400000);
    return diff >= 0 && diff <= 5;
  })();

  const handleSave = async () => {
    if (!user) return;
    const nowSaved = !opportunity.saved;
    await toggleOpportunitySave(opportunity.id, user.id, opportunity.saved ?? false);
    onSaveToggled(opportunity.id, nowSaved);
  };

  const handleShare = async () => {
    try {
      await Share.share({ message: `Check out this opportunity: ${opportunity.position} at ${opportunity.club}` });
    } catch (_) {}
  };

  const req = opportunity.requirements ?? {};
  const hasScore = opportunity.match_score != null;
  const reasons = opportunity.match_reasons ?? [];

  return (
    <Modal visible={!!opportunity} animationType="slide" transparent={false} statusBarTranslucent>
      <View style={[s.root, { paddingTop: insets.top }]}>
        {/* Top bar */}
        <View style={s.topBar}>
          <TouchableOpacity onPress={onClose} style={s.backBtn} hitSlop={8}>
            <X color={Colors.textMuted} size={22} />
          </TouchableOpacity>
          <View style={s.topActions}>
            <TouchableOpacity style={s.iconBtn} onPress={handleShare}>
              <Share2 color={Colors.textMuted} size={20} />
            </TouchableOpacity>
            <TouchableOpacity style={s.iconBtn} onPress={handleSave}>
              <Bookmark
                color={opportunity.saved ? Colors.accent : Colors.textMuted}
                fill={opportunity.saved ? Colors.accent : 'transparent'}
                size={20}
              />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
          {/* Hero */}
          <LinearGradient
            colors={[Colors.surface, Colors.bg]}
            style={s.hero}
          >
            <View style={s.clubCrest}>
              <Text style={s.crestTxt}>{opportunity.club_abbr ?? opportunity.club.slice(0, 3).toUpperCase()}</Text>
            </View>
            <View style={s.heroInfo}>
              <Text style={s.heroPosition}>{opportunity.position}</Text>
              <View style={s.heroClubRow}>
                <Text style={s.heroClub}>{opportunity.club}</Text>
                <BadgeCheck color={Colors.primary} size={16} />
              </View>
              <View style={s.heroBadgeRow}>
                <TypeChip type={opportunity.type} />
                {hasScore && <MatchBadge score={opportunity.match_score!} />}
                {isExpiring && <View style={s.urgentBadge}><Text style={s.urgentTxt}>Closing Soon</Text></View>}
              </View>
            </View>
          </LinearGradient>

          {/* Key facts */}
          <View style={s.factsRow}>
            <Fact icon={MapPin} label={opportunity.location} />
            {salary && <Fact icon={DollarSign} label={salary} accent />}
            <Fact icon={Calendar} label={deadline} warn={isExpiring} />
            {opportunity.level && <Fact icon={Trophy} label={opportunity.level} />}
          </View>

          {/* Application status banner */}
          {opportunity.applied && opportunity.application_status && (
            <View style={[s.statusBanner, { borderColor: APP_STATUS_COLORS[opportunity.application_status] + '60' }]}>
              <View style={[s.statusDot, { backgroundColor: APP_STATUS_COLORS[opportunity.application_status] }]} />
              <Text style={s.statusBannerTxt}>
                Status: <Text style={{ color: APP_STATUS_COLORS[opportunity.application_status] }}>
                  {APP_STATUS_LABELS[opportunity.application_status]}
                </Text>
              </Text>
            </View>
          )}

          {/* Match score section */}
          {hasScore && (
            <Section title="Why You Match">
              <View style={s.scoreRow}>
                <View style={s.scoreCircle}>
                  <Text style={s.scoreNum}>{opportunity.match_score}</Text>
                  <Text style={s.scorePct}>%</Text>
                </View>
                <View style={s.reasonsCol}>
                  {(reasons.length ? reasons : ['Position fit', 'Level match', 'Sport match']).map((r, i) => {
                    const Icon = REASON_ICONS[r] ?? Zap;
                    return (
                      <View key={i} style={s.reasonRow}>
                        <Icon color={Colors.accent} size={13} />
                        <Text style={s.reasonTxt}>{r}</Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            </Section>
          )}

          {/* Description */}
          {opportunity.description && (
            <Section title="About the Opportunity">
              <Text style={s.descTxt}>{opportunity.description}</Text>
            </Section>
          )}

          {/* Requirements */}
          {Object.keys(req).length > 0 && (
            <Section title="Requirements">
              <View style={s.reqGrid}>
                {req.age_min != null && req.age_max != null && (
                  <ReqItem label="Age" value={`${req.age_min}–${req.age_max} yrs`} />
                )}
                {req.positions?.length && (
                  <ReqItem label="Positions" value={(req.positions as string[]).join(', ')} />
                )}
                {req.nationality && (
                  <ReqItem label="Nationality" value={req.nationality as string} />
                )}
                {req.attributes?.length && (
                  <ReqItem label="Key Attributes" value={(req.attributes as string[]).join(', ')} />
                )}
              </View>
            </Section>
          )}

          {/* Posted */}
          <View style={s.postedRow}>
            <Text style={s.postedTxt}>Posted {oppTimeAgo(opportunity.created_at)}</Text>
          </View>
        </ScrollView>

        {/* Bottom CTA */}
        <View style={[s.cta, { paddingBottom: insets.bottom + Spacing.md }]}>
          {opportunity.applied ? (
            <View style={s.appliedBanner}>
              <BadgeCheck color={Colors.success} size={18} />
              <Text style={s.appliedBannerTxt}>
                Application submitted · {APP_STATUS_LABELS[opportunity.application_status ?? 'applied']}
              </Text>
            </View>
          ) : (
            <TouchableOpacity style={s.applyBtn} onPress={() => onApply(opportunity)}>
              <Zap color={Colors.black} size={18} fill={Colors.black} />
              <Text style={s.applyBtnTxt}>Apply / Express Interest</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={sec.wrap}>
      <Text style={sec.title}>{title}</Text>
      {children}
    </View>
  );
}

function Fact({ icon: Icon, label, accent, warn }: { icon: React.ElementType; label: string; accent?: boolean; warn?: boolean }) {
  const color = warn ? Colors.warning : accent ? Colors.accent : Colors.textMuted;
  return (
    <View style={fac.wrap}>
      <Icon color={color} size={13} />
      <Text style={[fac.txt, { color }]} numberOfLines={1}>{label}</Text>
    </View>
  );
}

function ReqItem({ label, value }: { label: string; value: string }) {
  return (
    <View style={ri.wrap}>
      <Text style={ri.label}>{label}</Text>
      <Text style={ri.value}>{value}</Text>
    </View>
  );
}

function TypeChip({ type }: { type: string }) {
  const colors: Record<string, string> = {
    Trial: Colors.warning,
    Contract: Colors.primary,
    Academy: Colors.success,
    Loan: Colors.accent,
    Tryout: Colors.error,
  };
  const c = colors[type] ?? Colors.textMuted;
  return (
    <View style={[tc.wrap, { borderColor: c }]}>
      <Text style={[tc.txt, { color: c }]}>{type}</Text>
    </View>
  );
}

function MatchBadge({ score }: { score: number }) {
  const color = score >= 85 ? Colors.error : score >= 70 ? Colors.accent : Colors.primary;
  const label = score >= 85 ? 'Hot Match' : `${score}% Match`;
  return (
    <View style={[mb.wrap, { borderColor: color }]}>
      <Text style={[mb.txt, { color }]}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border },
  backBtn: { padding: Spacing.xs },
  topActions: { flexDirection: 'row', gap: Spacing.sm },
  iconBtn: { padding: Spacing.sm, backgroundColor: Colors.elevated, borderRadius: Radii.full, borderWidth: 1, borderColor: Colors.border },

  hero: { padding: Spacing.xl, gap: Spacing.lg, flexDirection: 'row', alignItems: 'flex-start' },
  clubCrest: { width: 64, height: 64, borderRadius: Radii.lg, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  crestTxt: { fontFamily: Typography.family.bold, fontSize: Typography.size.sm, color: Colors.white, textAlign: 'center' },
  heroInfo: { flex: 1, gap: Spacing.xs },
  heroPosition: { fontFamily: Typography.family.display, fontSize: Typography.size.xl, color: Colors.textPrimary, lineHeight: 26 },
  heroClubRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  heroClub: { fontFamily: Typography.family.semiBold, fontSize: Typography.size.md, color: Colors.textMuted },
  heroBadgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginTop: Spacing.xs },
  urgentBadge: { paddingHorizontal: Spacing.sm, paddingVertical: 3, borderRadius: Radii.full, backgroundColor: `${Colors.error}20`, borderWidth: 1, borderColor: Colors.error },
  urgentTxt: { fontFamily: Typography.family.bold, fontSize: Typography.size.xs, color: Colors.error },

  factsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, paddingHorizontal: Spacing.xl, paddingBottom: Spacing.xl, borderBottomWidth: 1, borderBottomColor: Colors.border },

  statusBanner: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginHorizontal: Spacing.xl, marginTop: Spacing.lg, padding: Spacing.md, backgroundColor: Colors.elevated, borderRadius: Radii.md, borderWidth: 1 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusBannerTxt: { fontFamily: Typography.family.medium, fontSize: Typography.size.sm, color: Colors.textPrimary },

  scoreRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xl },
  scoreCircle: { width: 72, height: 72, borderRadius: 36, backgroundColor: Colors.elevated, borderWidth: 2, borderColor: Colors.accent, alignItems: 'center', justifyContent: 'center', flexDirection: 'row' },
  scoreNum: { fontFamily: Typography.family.display, fontSize: Typography.size.xxl, color: Colors.accent },
  scorePct: { fontFamily: Typography.family.bold, fontSize: Typography.size.sm, color: Colors.accent, marginBottom: -6 },
  reasonsCol: { flex: 1, gap: Spacing.sm },
  reasonRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  reasonTxt: { fontFamily: Typography.family.medium, fontSize: Typography.size.sm, color: Colors.textPrimary },

  descTxt: { fontFamily: Typography.family.regular, fontSize: Typography.size.sm, color: Colors.textMuted, lineHeight: 20 },

  reqGrid: { gap: Spacing.sm },

  postedRow: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.lg },
  postedTxt: { fontFamily: Typography.family.regular, fontSize: Typography.size.xs, color: Colors.textDisabled },

  cta: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: Spacing.xl, paddingTop: Spacing.md, backgroundColor: Colors.bg, borderTopWidth: 1, borderTopColor: Colors.border },
  applyBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, backgroundColor: Colors.accent, borderRadius: Radii.lg, paddingVertical: Spacing.md + 2 },
  applyBtnTxt: { fontFamily: Typography.family.bold, fontSize: Typography.size.md, color: Colors.black },
  appliedBanner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, backgroundColor: `${Colors.success}15`, borderRadius: Radii.lg, paddingVertical: Spacing.md, borderWidth: 1, borderColor: `${Colors.success}40` },
  appliedBannerTxt: { fontFamily: Typography.family.bold, fontSize: Typography.size.sm, color: Colors.success },
});

const sec = StyleSheet.create({
  wrap: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.xl, gap: Spacing.md },
  title: { fontFamily: Typography.family.bold, fontSize: Typography.size.md, color: Colors.textPrimary },
});

const fac = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: Colors.elevated, borderRadius: Radii.full, paddingHorizontal: Spacing.md, paddingVertical: 5, borderWidth: 1, borderColor: Colors.border },
  txt: { fontFamily: Typography.family.medium, fontSize: Typography.size.xs, maxWidth: 120 },
});

const ri = StyleSheet.create({
  wrap: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: Colors.elevated, borderRadius: Radii.sm, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderWidth: 1, borderColor: Colors.border },
  label: { fontFamily: Typography.family.medium, fontSize: Typography.size.sm, color: Colors.textMuted },
  value: { fontFamily: Typography.family.bold, fontSize: Typography.size.sm, color: Colors.textPrimary },
});

const tc = StyleSheet.create({
  wrap: { paddingHorizontal: Spacing.sm, paddingVertical: 3, borderRadius: Radii.full, borderWidth: 1 },
  txt: { fontFamily: Typography.family.bold, fontSize: Typography.size.xs },
});

const mb = StyleSheet.create({
  wrap: { paddingHorizontal: Spacing.sm, paddingVertical: 3, borderRadius: Radii.full, borderWidth: 1 },
  txt: { fontFamily: Typography.family.bold, fontSize: Typography.size.xs },
});
