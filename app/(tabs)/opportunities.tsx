import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  RefreshControl,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Search,
  SlidersHorizontal,
  MapPin,
  Calendar,
  DollarSign,
  Bookmark,
  Zap,
  BadgeCheck,
  Trophy,
  ChevronRight,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { AppHeader } from '@/components/AppHeader';
import { FilterSheet } from '@/components/opportunities/FilterSheet';
import { OpportunityDetail } from '@/components/opportunities/OpportunityDetail';
import { ApplySheet } from '@/components/opportunities/ApplySheet';
import { Colors, Spacing, Radii, Typography } from '@/constants/theme';
import {
  Opportunity,
  Application,
  OpportunityFilters,
  fetchForYouOpportunities,
  fetchAllOpportunities,
  fetchSavedOpportunities,
  fetchMyApplications,
  toggleOpportunitySave,
  formatSalary,
  deadlineLabel,
  oppTimeAgo,
  APP_STATUS_LABELS,
  APP_STATUS_COLORS,
} from '@/lib/opportunitiesService';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';

type Tab = 'For You' | 'All' | 'Saved' | 'Applied';
const TABS: Tab[] = ['For You', 'All', 'Saved', 'Applied'];

export default function OpportunitiesScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const router = useRouter();

  const [tab, setTab] = useState<Tab>('For You');
  const [filters, setFilters] = useState<OpportunityFilters>({});
  const [searchText, setSearchText] = useState('');

  // Data
  const [forYou, setForYou] = useState<Opportunity[]>([]);
  const [all, setAll] = useState<Opportunity[]>([]);
  const [saved, setSaved] = useState<Opportunity[]>([]);
  const [applied, setApplied] = useState<Application[]>([]);

  // Loading
  const [loadingMap, setLoadingMap] = useState<Record<Tab, boolean>>({
    'For You': true, All: false, Saved: false, Applied: false,
  });
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const allCursorRef = useRef<string | undefined>(undefined);
  const allHasMoreRef = useRef(true);
  const fetchedTabs = useRef<Set<Tab>>(new Set());

  // Modals
  const [filterVisible, setFilterVisible] = useState(false);
  const [detailOpp, setDetailOpp] = useState<Opportunity | null>(null);
  const [applyOpp, setApplyOpp] = useState<Opportunity | null>(null);

  const setLoading = (t: Tab, v: boolean) =>
    setLoadingMap((prev) => ({ ...prev, [t]: v }));

  // ── Loaders ────────────────────────────────────────────────────────────────

  const loadForYou = useCallback(async (reset = false) => {
    if (!user) return;
    const f = { ...filters, search: searchText || undefined };
    const data = await fetchForYouOpportunities(user.id, f);
    setForYou(data);
  }, [user, filters, searchText]);

  const loadAll = useCallback(async (reset = false) => {
    if (!user) return;
    const f = { ...filters, search: searchText || undefined };
    const cursor = reset ? undefined : allCursorRef.current;
    const data = await fetchAllOpportunities(user.id, cursor, f);
    if (data.length > 0) allCursorRef.current = data[data.length - 1].created_at;
    allHasMoreRef.current = data.length === 20;
    setAll((prev) => (reset ? data : [...prev, ...data]));
  }, [user, filters, searchText]);

  const loadSaved = useCallback(async () => {
    if (!user) return;
    const data = await fetchSavedOpportunities(user.id);
    setSaved(data);
  }, [user]);

  const loadApplied = useCallback(async () => {
    if (!user) return;
    const data = await fetchMyApplications(user.id);
    setApplied(data);
  }, [user]);

  // Initial load
  useEffect(() => {
    if (!user) return;
    setLoading('For You', true);
    loadForYou().finally(() => setLoading('For You', false));
    fetchedTabs.current = new Set(['For You']);
  }, [user]);

  // Lazy load other tabs
  useEffect(() => {
    if (!user || fetchedTabs.current.has(tab)) return;
    fetchedTabs.current.add(tab);
    setLoading(tab, true);
    const loader = tab === 'All' ? loadAll(true) : tab === 'Saved' ? loadSaved() : loadApplied();
    loader.finally(() => setLoading(tab, false));
  }, [tab, user]);

  // Refetch when filters change
  useEffect(() => {
    if (!user) return;
    if (tab === 'For You') {
      setLoading('For You', true);
      loadForYou().finally(() => setLoading('For You', false));
    } else if (tab === 'All') {
      allCursorRef.current = undefined;
      allHasMoreRef.current = true;
      setLoading('All', true);
      loadAll(true).finally(() => setLoading('All', false));
    }
  }, [filters, searchText]);

  // Realtime application status
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`applications:${user.id}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'applications',
        filter: `athlete_id=eq.${user.id}`,
      }, () => loadApplied())
      .subscribe();
    return () => { channel.unsubscribe(); };
  }, [user, loadApplied]);

  const onRefresh = async () => {
    setRefreshing(true);
    fetchedTabs.current = new Set();
    allCursorRef.current = undefined;
    allHasMoreRef.current = true;
    if (tab === 'For You') await loadForYou();
    if (tab === 'All') await loadAll(true);
    if (tab === 'Saved') await loadSaved();
    if (tab === 'Applied') await loadApplied();
    fetchedTabs.current.add(tab);
    setRefreshing(false);
  };

  const onLoadMoreAll = async () => {
    if (loadingMore || !allHasMoreRef.current || tab !== 'All') return;
    setLoadingMore(true);
    await loadAll(false);
    setLoadingMore(false);
  };

  // ── Mutations ──────────────────────────────────────────────────────────────

  const handleSaveToggle = useCallback(async (oppId: string, nowSaved: boolean) => {
    if (!user) return;
    const update = (opp: Opportunity) =>
      opp.id === oppId ? { ...opp, saved: nowSaved } : opp;
    setForYou((p) => p.map(update));
    setAll((p) => p.map(update));
    setSaved((p) => (nowSaved ? p : p.filter((o) => o.id !== oppId)));
    if (detailOpp?.id === oppId) setDetailOpp((prev) => prev ? { ...prev, saved: nowSaved } : prev);
    await toggleOpportunitySave(oppId, user.id, !nowSaved);
  }, [user, detailOpp]);

  const handleApplied = useCallback((oppId: string, appId: string) => {
    const markApplied = (opp: Opportunity) =>
      opp.id === oppId ? { ...opp, applied: true, application_status: 'applied' as const, application_id: appId } : opp;
    setForYou((p) => p.map(markApplied));
    setAll((p) => p.map(markApplied));
    setSaved((p) => p.map(markApplied));
    if (detailOpp?.id === oppId) setDetailOpp((prev) => prev ? markApplied(prev) : prev);
    // Refresh applied list
    loadApplied();
  }, [detailOpp, loadApplied]);

  const activeFiltersCount = Object.values(filters).filter(Boolean).length;

  // ── Render ─────────────────────────────────────────────────────────────────

  const currentData = tab === 'For You' ? forYou : tab === 'All' ? all : tab === 'Saved' ? saved : [];
  const isLoading = loadingMap[tab];

  const matchCount = forYou.length;
  const highMatchCount = forYou.filter((o) => (o.match_score ?? 0) >= 80).length;

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <AppHeader title="Opportunities" />

      {/* Summary strip */}
      <View style={s.summary}>
        <Text style={s.summaryTxt}>
          <Text style={s.summaryHighlight}>{matchCount}</Text> matched · {' '}
          <Text style={s.summaryHighlight}>{highMatchCount}</Text> high match
        </Text>
      </View>

      {/* Search + filter bar */}
      <View style={s.searchBar}>
        <View style={s.searchField}>
          <Search color={Colors.textDisabled} size={15} />
          <TextInput
            style={s.searchInput}
            value={searchText}
            onChangeText={setSearchText}
            placeholder="Club, position, location…"
            placeholderTextColor={Colors.textDisabled}
            returnKeyType="search"
          />
        </View>
        <TouchableOpacity
          style={[s.filterBtn, activeFiltersCount > 0 && s.filterBtnActive]}
          onPress={() => setFilterVisible(true)}
        >
          <SlidersHorizontal color={activeFiltersCount > 0 ? Colors.primary : Colors.textMuted} size={18} />
          {activeFiltersCount > 0 && (
            <View style={s.filterBadge}>
              <Text style={s.filterBadgeTxt}>{activeFiltersCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={s.tabRow}>
        {TABS.map((t) => (
          <TouchableOpacity
            key={t}
            style={[s.tabBtn, tab === t && s.tabBtnActive]}
            onPress={() => setTab(t)}
          >
            <Text style={[s.tabTxt, tab === t && s.tabTxtActive]}>{t}</Text>
            {t === 'Applied' && applied.length > 0 && (
              <View style={s.tabBadge}><Text style={s.tabBadgeTxt}>{applied.length}</Text></View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      {tab === 'Applied' ? (
        isLoading ? (
          <ActivityIndicator color={Colors.primary} style={{ marginTop: Spacing.xxxl }} />
        ) : (
          <FlatList
            data={applied}
            keyExtractor={(a) => a.id}
            renderItem={({ item }) => (
              <ApplicationRow
                app={item}
                onPress={() => item.opportunity && setDetailOpp(item.opportunity)}
              />
            )}
            contentContainerStyle={s.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={<EmptyState tab="Applied" onProfilePress={() => router.push('/(tabs)/profile')} />}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
          />
        )
      ) : (
        isLoading ? (
          <ActivityIndicator color={Colors.primary} style={{ marginTop: Spacing.xxxl }} />
        ) : (
          <FlatList
            data={currentData}
            keyExtractor={(o) => o.id}
            renderItem={({ item }) => (
              <OpportunityCard
                opp={item}
                onPress={() => setDetailOpp(item)}
                onSave={() => handleSaveToggle(item.id, !item.saved)}
                onApply={() => !item.applied && setApplyOpp(item)}
              />
            )}
            contentContainerStyle={s.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={<EmptyState tab={tab} onProfilePress={() => router.push('/(tabs)/profile')} />}
            ListFooterComponent={
              loadingMore ? (
                <ActivityIndicator color={Colors.primary} style={{ paddingVertical: Spacing.xl }} />
              ) : null
            }
            onEndReached={onLoadMoreAll}
            onEndReachedThreshold={0.4}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
          />
        )
      )}

      {/* Modals */}
      <FilterSheet
        visible={filterVisible}
        filters={filters}
        onApply={(f) => { setFilters(f); fetchedTabs.current = new Set(); }}
        onClose={() => setFilterVisible(false)}
      />

      <OpportunityDetail
        opportunity={detailOpp}
        onClose={() => setDetailOpp(null)}
        onApply={(opp) => { setApplyOpp(opp); }}
        onSaveToggled={handleSaveToggle}
      />

      <ApplySheet
        opportunity={applyOpp}
        onClose={() => setApplyOpp(null)}
        onApplied={handleApplied}
      />
    </View>
  );
}

// ── Opportunity card ──────────────────────────────────────────────────────────

function OpportunityCard({
  opp,
  onPress,
  onSave,
  onApply,
}: {
  opp: Opportunity;
  onPress: () => void;
  onSave: () => void;
  onApply: () => void;
}) {
  const salary = formatSalary(opp);
  const deadline = deadlineLabel(opp.deadline);
  const score = opp.match_score;
  const isHot = score != null && score >= 85;
  const isNew = (() => {
    const diff = Date.now() - new Date(opp.created_at).getTime();
    return diff < 48 * 3600000;
  })();

  return (
    <TouchableOpacity style={c.card} onPress={onPress} activeOpacity={0.85}>
      {/* Header */}
      <View style={c.headerRow}>
        <View style={c.crest}>
          <Text style={c.crestTxt}>{opp.club_abbr ?? opp.club.slice(0, 3).toUpperCase()}</Text>
        </View>
        <View style={c.titleCol}>
          <Text style={c.position} numberOfLines={1}>{opp.position}</Text>
          <View style={c.clubRow}>
            <Text style={c.club} numberOfLines={1}>{opp.club}</Text>
            <BadgeCheck color={Colors.primary} size={13} />
          </View>
          <View style={c.metaRow}>
            <MapPin color={Colors.textDisabled} size={12} />
            <Text style={c.meta} numberOfLines={1}>{opp.location}</Text>
            {opp.level && (
              <>
                <Text style={c.metaDot}>·</Text>
                <Text style={c.meta} numberOfLines={1}>{opp.level}</Text>
              </>
            )}
          </View>
        </View>
        <TouchableOpacity onPress={onSave} hitSlop={8} style={c.saveBtn}>
          <Bookmark
            color={opp.saved ? Colors.accent : Colors.textFaint}
            fill={opp.saved ? Colors.accent : 'transparent'}
            size={18}
          />
        </TouchableOpacity>
      </View>

      {/* Salary */}
      {salary && (
        <Text style={c.salary}>{salary}</Text>
      )}

      {/* Badges row */}
      <View style={c.badgesRow}>
        <View style={c.badgesLeft}>
          {score != null && (
            <View style={[c.badge, { borderColor: isHot ? Colors.error : Colors.primary }]}>
              {isHot && <Zap color={Colors.error} size={10} fill={Colors.error} />}
              <Text style={[c.badgeTxt, { color: isHot ? Colors.error : Colors.primary }]}>
                {isHot ? 'Hot Match' : `${score}% match`}
              </Text>
            </View>
          )}
          <TypeChipSmall type={opp.type} />
          {isNew && <View style={[c.badge, { borderColor: Colors.success }]}><Text style={[c.badgeTxt, { color: Colors.success }]}>New</Text></View>}
        </View>
        <View style={c.deadlineRow}>
          <Calendar color={Colors.textDisabled} size={11} />
          <Text style={c.deadlineTxt}>{deadline}</Text>
        </View>
      </View>

      {/* Footer */}
      <View style={c.footer}>
        {opp.applied ? (
          <View style={c.appliedChip}>
            <BadgeCheck color={Colors.success} size={14} />
            <Text style={c.appliedTxt}>{APP_STATUS_LABELS[opp.application_status ?? 'applied']}</Text>
          </View>
        ) : (
          <TouchableOpacity style={c.applyBtn} onPress={onApply}>
            <Text style={c.applyTxt}>Apply Now</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={c.detailBtn} onPress={onPress}>
          <Text style={c.detailTxt}>Details</Text>
          <ChevronRight color={Colors.textMuted} size={14} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

function TypeChipSmall({ type }: { type: string }) {
  const colors: Record<string, string> = {
    Trial: Colors.warning, Contract: Colors.primary, Academy: Colors.success,
    Loan: Colors.accent, Tryout: Colors.error,
  };
  const c = colors[type] ?? Colors.textMuted;
  return (
    <View style={[tc.wrap, { borderColor: c }]}>
      <Text style={[tc.txt, { color: c }]}>{type}</Text>
    </View>
  );
}

function ApplicationRow({ app, onPress }: { app: Application; onPress: () => void }) {
  const opp = app.opportunity;
  return (
    <TouchableOpacity style={ar.card} onPress={onPress} activeOpacity={0.85}>
      <View style={ar.crest}>
        <Text style={ar.crestTxt}>{opp?.club_abbr ?? (opp?.club ?? '?').slice(0, 3).toUpperCase()}</Text>
      </View>
      <View style={ar.body}>
        <Text style={ar.position} numberOfLines={1}>{opp?.position ?? 'Opportunity'}</Text>
        <Text style={ar.club} numberOfLines={1}>{opp?.club}</Text>
        <Text style={ar.time}>{oppTimeAgo(app.updated_at)}</Text>
      </View>
      <View style={[ar.statusPill, { borderColor: APP_STATUS_COLORS[app.status] + '60', backgroundColor: APP_STATUS_COLORS[app.status] + '18' }]}>
        <Text style={[ar.statusTxt, { color: APP_STATUS_COLORS[app.status] }]}>
          {APP_STATUS_LABELS[app.status]}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

function EmptyState({ tab, onProfilePress }: { tab: Tab; onProfilePress: () => void }) {
  const messages: Record<Tab, { title: string; body: string; cta?: boolean }> = {
    'For You': { title: 'No matches yet', body: 'Complete your profile to improve AI matching.', cta: true },
    All: { title: 'No opportunities', body: 'Check back soon — new opportunities are added daily.' },
    Saved: { title: 'No saved opportunities', body: 'Bookmark opportunities to find them here quickly.' },
    Applied: { title: 'No applications yet', body: 'Browse opportunities and express your interest.' },
  };
  const m = messages[tab];
  return (
    <View style={es.wrap}>
      <Trophy color={Colors.textFaint} size={44} strokeWidth={1.5} />
      <Text style={es.title}>{m.title}</Text>
      <Text style={es.body}>{m.body}</Text>
      {m.cta && (
        <TouchableOpacity style={es.ctaBtn} onPress={onProfilePress}>
          <Text style={es.ctaTxt}>Complete Profile</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },

  summary: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.sm, paddingBottom: Spacing.xs },
  summaryTxt: { fontFamily: Typography.family.regular, fontSize: Typography.size.sm, color: Colors.textMuted },
  summaryHighlight: { fontFamily: Typography.family.bold, color: Colors.textPrimary },

  searchBar: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm },
  searchField: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: Colors.elevated, borderRadius: Radii.full, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  searchInput: { flex: 1, fontFamily: Typography.family.regular, fontSize: Typography.size.sm, color: Colors.textPrimary },
  filterBtn: { width: 40, height: 40, borderRadius: Radii.full, backgroundColor: Colors.elevated, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  filterBtnActive: { borderColor: Colors.primary, backgroundColor: `${Colors.primary}15` },
  filterBadge: { position: 'absolute', top: -2, right: -2, width: 16, height: 16, borderRadius: 8, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  filterBadgeTxt: { fontFamily: Typography.family.bold, fontSize: 9, color: Colors.white },

  tabRow: { flexDirection: 'row', paddingHorizontal: Spacing.lg, gap: Spacing.xs, borderBottomWidth: 1, borderBottomColor: Colors.border, marginBottom: Spacing.xs },
  tabBtn: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderBottomWidth: 2, borderBottomColor: 'transparent', flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  tabBtnActive: { borderBottomColor: Colors.primary },
  tabTxt: { fontFamily: Typography.family.medium, fontSize: Typography.size.sm, color: Colors.textMuted },
  tabTxtActive: { fontFamily: Typography.family.bold, color: Colors.primary },
  tabBadge: { width: 18, height: 18, borderRadius: 9, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  tabBadgeTxt: { fontFamily: Typography.family.bold, fontSize: 10, color: Colors.white },

  listContent: { padding: Spacing.lg, gap: Spacing.md, paddingBottom: Spacing.xxxl + 20 },
});

const c = StyleSheet.create({
  card: { backgroundColor: Colors.surface, borderRadius: Radii.lg, borderWidth: 1, borderColor: Colors.border, padding: Spacing.lg, gap: Spacing.md },
  headerRow: { flexDirection: 'row', gap: Spacing.md, alignItems: 'flex-start' },
  crest: { width: 48, height: 48, borderRadius: Radii.md, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  crestTxt: { fontFamily: Typography.family.bold, fontSize: Typography.size.xs, color: Colors.white, textAlign: 'center' },
  titleCol: { flex: 1, gap: 2 },
  position: { fontFamily: Typography.family.bold, fontSize: Typography.size.md, color: Colors.textPrimary },
  clubRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  club: { fontFamily: Typography.family.medium, fontSize: Typography.size.sm, color: Colors.textMuted },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  meta: { fontFamily: Typography.family.regular, fontSize: Typography.size.xs, color: Colors.textDisabled },
  metaDot: { fontFamily: Typography.family.regular, fontSize: Typography.size.xs, color: Colors.textFaint },
  saveBtn: { padding: Spacing.xs },
  salary: { fontFamily: Typography.family.monoBold, fontSize: Typography.size.sm, color: Colors.accent },
  badgesRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  badgesLeft: { flexDirection: 'row', gap: Spacing.xs, flexWrap: 'wrap' },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: Spacing.sm, paddingVertical: 3, borderRadius: Radii.full, borderWidth: 1 },
  badgeTxt: { fontFamily: Typography.family.bold, fontSize: Typography.size.xs },
  deadlineRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  deadlineTxt: { fontFamily: Typography.family.regular, fontSize: Typography.size.xs, color: Colors.textDisabled },
  footer: { flexDirection: 'row', gap: Spacing.md, alignItems: 'center' },
  applyBtn: { flex: 1, backgroundColor: Colors.primary, borderRadius: Radii.lg, paddingVertical: Spacing.sm + 2, alignItems: 'center' },
  applyTxt: { fontFamily: Typography.family.bold, fontSize: Typography.size.sm, color: Colors.white },
  appliedChip: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.xs, backgroundColor: `${Colors.success}15`, borderRadius: Radii.lg, paddingVertical: Spacing.sm + 2, borderWidth: 1, borderColor: `${Colors.success}40` },
  appliedTxt: { fontFamily: Typography.family.bold, fontSize: Typography.size.sm, color: Colors.success },
  detailBtn: { flexDirection: 'row', alignItems: 'center', gap: 2, paddingHorizontal: Spacing.sm },
  detailTxt: { fontFamily: Typography.family.medium, fontSize: Typography.size.sm, color: Colors.textMuted },
});

const tc = StyleSheet.create({
  wrap: { paddingHorizontal: Spacing.sm, paddingVertical: 3, borderRadius: Radii.full, borderWidth: 1 },
  txt: { fontFamily: Typography.family.bold, fontSize: Typography.size.xs },
});

const ar = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, backgroundColor: Colors.surface, borderRadius: Radii.lg, borderWidth: 1, borderColor: Colors.border, padding: Spacing.lg },
  crest: { width: 44, height: 44, borderRadius: Radii.md, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  crestTxt: { fontFamily: Typography.family.bold, fontSize: Typography.size.xs, color: Colors.white, textAlign: 'center' },
  body: { flex: 1 },
  position: { fontFamily: Typography.family.bold, fontSize: Typography.size.sm, color: Colors.textPrimary },
  club: { fontFamily: Typography.family.regular, fontSize: Typography.size.xs, color: Colors.textMuted, marginTop: 1 },
  time: { fontFamily: Typography.family.regular, fontSize: Typography.size.xs, color: Colors.textDisabled, marginTop: 2 },
  statusPill: { paddingHorizontal: Spacing.md, paddingVertical: 5, borderRadius: Radii.full, borderWidth: 1 },
  statusTxt: { fontFamily: Typography.family.bold, fontSize: Typography.size.xs },
});

const es = StyleSheet.create({
  wrap: { alignItems: 'center', paddingTop: Spacing.huge, paddingHorizontal: Spacing.xxxl, gap: Spacing.lg },
  title: { fontFamily: Typography.family.bold, fontSize: Typography.size.xl, color: Colors.textMuted },
  body: { fontFamily: Typography.family.regular, fontSize: Typography.size.sm, color: Colors.textDisabled, textAlign: 'center', lineHeight: 20 },
  ctaBtn: { paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md, backgroundColor: Colors.primary, borderRadius: Radii.full },
  ctaTxt: { fontFamily: Typography.family.bold, fontSize: Typography.size.sm, color: Colors.white },
});
