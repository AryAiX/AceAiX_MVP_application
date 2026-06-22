import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Users, Search, Filter, MapPin, BadgeCheck, Star, UserPlus } from 'lucide-react-native';
import { AppHeader } from '@/components/AppHeader';
import { Colors, Typography, Spacing, Radii } from '@/constants/theme';

const ATHLETES = [
  { id: '1', name: 'Marcus Williams', pos: 'Striker', sport: 'Football', club: 'Al Jazira FC', loc: 'Abu Dhabi, UAE', rating: 8.9, verified: true, connected: false, tags: ['Hot Prospect', 'Trending'] },
  { id: '2', name: 'Aisha Al-Rashid', pos: 'Goalkeeper', sport: 'Football', club: 'Al Wahda', loc: 'Abu Dhabi, UAE', rating: 8.4, verified: true, connected: true, tags: ['Award Nominee'] },
  { id: '3', name: 'Diego Santos', pos: 'Midfielder', sport: 'Football', club: 'Shabab Al Ahli', loc: 'Dubai, UAE', rating: 8.1, verified: false, connected: false, tags: ['Rising Star'] },
  { id: '4', name: 'Elena Kovac', pos: 'Defender', sport: 'Football', club: 'Al Ain FC', loc: 'Al Ain, UAE', rating: 7.8, verified: true, connected: true, tags: [] },
  { id: '5', name: 'Jordan Phillips', pos: 'Forward', sport: 'Football', club: 'Baniyas SC', loc: 'Abu Dhabi, UAE', rating: 7.5, verified: true, connected: false, tags: ['Trending'] },
  { id: '6', name: 'Carlos Mendez', pos: 'Winger', sport: 'Football', club: 'Ajman FC', loc: 'Ajman, UAE', rating: 7.2, verified: false, connected: false, tags: [] },
];

const FILTERS = ['All', 'Football', 'Basketball', 'Tennis', 'Athletics'];
const COLORS = [Colors.primary, Colors.accent, Colors.success, Colors.warning, '#9B59B6', '#E67E22'];

export default function Discover() {
  const [activeFilter, setActiveFilter] = useState('All');
  const [connected, setConnected] = useState<Set<string>>(new Set(ATHLETES.filter(a => a.connected).map(a => a.id)));

  return (
    <View style={s.root}>
      <AppHeader title="Discover Athletes" />
      <ScrollView style={s.scroll} showsVerticalScrollIndicator={false}>
        <View style={s.filterRow}>
          {FILTERS.map(f => (
            <TouchableOpacity key={f} style={[s.chip, f === activeFilter && s.chipActive]} onPress={() => setActiveFilter(f)}>
              <Text style={[s.chipTxt, f === activeFilter && s.chipTxtActive]}>{f}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={s.statsRow}>
          <View style={s.statBox}>
            <Text style={s.statNum}>1,240</Text>
            <Text style={s.statLbl}>Athletes</Text>
          </View>
          <View style={s.statBox}>
            <Text style={[s.statNum, { color: Colors.accent }]}>84</Text>
            <Text style={s.statLbl}>Near You</Text>
          </View>
          <View style={s.statBox}>
            <Text style={[s.statNum, { color: Colors.success }]}>23</Text>
            <Text style={s.statLbl}>Connections</Text>
          </View>
        </View>

        <View style={s.list}>
          {ATHLETES.map((a, i) => {
            const isConn = connected.has(a.id);
            return (
              <View key={a.id} style={s.card}>
                <View style={[s.av, { backgroundColor: COLORS[i % COLORS.length] }]}>
                  <Text style={s.avTxt}>{a.name[0]}</Text>
                </View>
                <View style={s.info}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Text style={s.name}>{a.name}</Text>
                    {a.verified && <BadgeCheck color={Colors.primary} size={14} />}
                  </View>
                  <Text style={s.pos}>{a.pos} · {a.sport}</Text>
                  <Text style={s.club}>{a.club}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <MapPin color={Colors.textDisabled} size={11} />
                    <Text style={s.loc}>{a.loc}</Text>
                  </View>
                  <View style={s.tagsRow}>
                    {a.tags.map(tag => (
                      <View key={tag} style={s.tag}>
                        <Text style={s.tagTxt}>{tag}</Text>
                      </View>
                    ))}
                  </View>
                </View>
                <View style={s.right}>
                  <View style={s.ratingBadge}>
                    <Star color={Colors.accent} size={12} fill={Colors.accent} />
                    <Text style={s.ratingTxt}>{a.rating}</Text>
                  </View>
                  <TouchableOpacity
                    style={[s.connectBtn, isConn && s.connectBtnActive]}
                    onPress={() => setConnected(prev => {
                      const next = new Set(prev);
                      isConn ? next.delete(a.id) : next.add(a.id);
                      return next;
                    })}
                  >
                    <UserPlus color={isConn ? Colors.primary : Colors.textPrimary} size={14} />
                    <Text style={[s.connectTxt, isConn && s.connectTxtActive]}>
                      {isConn ? 'Connected' : 'Connect'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </View>
        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  scroll: { flex: 1 },
  filterRow: { flexDirection: 'row', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, gap: Spacing.sm },
  chip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: Radii.full, backgroundColor: Colors.elevated, borderWidth: 1, borderColor: Colors.border },
  chipActive: { backgroundColor: `${Colors.primary}20`, borderColor: `${Colors.primary}50` },
  chipTxt: { fontFamily: Typography.family.medium, fontSize: Typography.size.xs, color: Colors.textMuted },
  chipTxtActive: { color: Colors.primary },
  statsRow: { flexDirection: 'row', marginHorizontal: Spacing.lg, marginBottom: Spacing.md, backgroundColor: Colors.surface, borderRadius: Radii.lg, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden' },
  statBox: { flex: 1, alignItems: 'center', paddingVertical: Spacing.md },
  statNum: { fontFamily: Typography.family.bold, fontSize: Typography.size.xl, color: Colors.textPrimary },
  statLbl: { fontFamily: Typography.family.regular, fontSize: Typography.size.xs, color: Colors.textMuted },
  list: { paddingHorizontal: Spacing.lg, gap: Spacing.md },
  card: { flexDirection: 'row', backgroundColor: Colors.surface, borderRadius: Radii.lg, padding: Spacing.md, borderWidth: 1, borderColor: Colors.border, gap: Spacing.md },
  av: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  avTxt: { fontFamily: Typography.family.bold, fontSize: Typography.size.lg, color: Colors.white },
  info: { flex: 1, gap: 3 },
  name: { fontFamily: Typography.family.bold, fontSize: Typography.size.md, color: Colors.textPrimary },
  pos: { fontFamily: Typography.family.medium, fontSize: Typography.size.xs, color: Colors.primary },
  club: { fontFamily: Typography.family.regular, fontSize: Typography.size.xs, color: Colors.textMuted },
  loc: { fontFamily: Typography.family.regular, fontSize: 10, color: Colors.textDisabled },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 4 },
  tag: { backgroundColor: `${Colors.accent}18`, borderRadius: Radii.full, paddingHorizontal: 7, paddingVertical: 2 },
  tagTxt: { fontFamily: Typography.family.bold, fontSize: 9, color: Colors.accent },
  right: { alignItems: 'flex-end', gap: Spacing.sm },
  ratingBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: `${Colors.accent}15`, borderRadius: Radii.full, paddingHorizontal: 8, paddingVertical: 3 },
  ratingTxt: { fontFamily: Typography.family.bold, fontSize: Typography.size.xs, color: Colors.accent },
  connectBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: Radii.md, backgroundColor: Colors.elevated, borderWidth: 1, borderColor: Colors.border, flexDirection: 'row', alignItems: 'center', gap: 4 },
  connectBtnActive: { backgroundColor: `${Colors.primary}15`, borderColor: `${Colors.primary}40` },
  connectTxt: { fontFamily: Typography.family.medium, fontSize: Typography.size.xs, color: Colors.textPrimary },
  connectTxtActive: { color: Colors.primary },
});
