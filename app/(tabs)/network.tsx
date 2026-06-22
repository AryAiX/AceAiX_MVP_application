import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { Users, UserPlus, MessageSquare, BadgeCheck, Briefcase, Star } from 'lucide-react-native';
import { AppHeader } from '@/components/AppHeader';
import { Colors, Typography, Spacing, Radii } from '@/constants/theme';
import { useRouter } from 'expo-router';

const CONNECTIONS = [
  { id: '1', name: 'Alex Thompson', role: 'Head Scout', org: 'Manchester United FC', type: 'scout', verified: true, connected: true },
  { id: '2', name: 'Sofia Martinez', role: 'Talent Scout', org: 'Barcelona', type: 'scout', verified: true, connected: true },
  { id: '3', name: 'James Park', role: 'Head Coach', org: 'Al Nassr FC', type: 'coach', verified: true, connected: false },
  { id: '4', name: 'Lena Fischer', role: 'Sports Agent', org: 'Elite Sports Management', type: 'agent', verified: false, connected: true },
  { id: '5', name: 'Carlos Rivera', role: 'Midfielder', org: 'Al Hilal', type: 'athlete', verified: true, connected: true },
  { id: '6', name: 'Nina Svensson', role: 'Performance Coach', org: 'UAE Football Federation', type: 'coach', verified: true, connected: false },
];

const COLORS: Record<string, string> = {
  scout: Colors.primary,
  coach: Colors.success,
  agent: Colors.warning,
  athlete: Colors.accent,
};

export default function Network() {
  const router = useRouter();
  const [filter, setFilter] = useState('All');
  const [conns, setConns] = useState(new Set(CONNECTIONS.filter(c => c.connected).map(c => c.id)));
  const filters = ['All', 'Scouts', 'Coaches', 'Agents', 'Athletes'];
  const typeMap: Record<string, string> = { Scouts: 'scout', Coaches: 'coach', Agents: 'agent', Athletes: 'athlete' };
  const filtered = CONNECTIONS.filter(c => filter === 'All' || c.type === typeMap[filter]);

  return (
    <View style={s.root}>
      <AppHeader title="Network" />
      <ScrollView style={s.scroll} showsVerticalScrollIndicator={false}>
        <View style={s.statsRow}>
          {[{ label: 'Connections', value: '47' }, { label: 'Scouts', value: '18' }, { label: 'Clubs', value: '12' }].map((st, i) => (
            <View key={st.label} style={[s.stat, i < 2 && s.statBorder]}>
              <Text style={s.statVal}>{st.value}</Text>
              <Text style={s.statLbl}>{st.label}</Text>
            </View>
          ))}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.filterRow}>
          {filters.map(f => (
            <TouchableOpacity key={f} style={[s.chip, f === filter && s.chipActive]} onPress={() => setFilter(f)}>
              <Text style={[s.chipTxt, f === filter && s.chipTxtActive]}>{f}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={s.list}>
          {filtered.map(c => {
            const isConn = conns.has(c.id);
            const color = COLORS[c.type] ?? Colors.primary;
            return (
              <View key={c.id} style={s.card}>
                <View style={[s.av, { backgroundColor: color }]}>
                  <Text style={s.avTxt}>{c.name[0]}</Text>
                </View>
                <View style={s.info}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Text style={s.cName}>{c.name}</Text>
                    {c.verified && <BadgeCheck color={Colors.primary} size={13} />}
                  </View>
                  <Text style={s.cRole}>{c.role}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                    <Briefcase color={Colors.textDisabled} size={11} />
                    <Text style={s.cOrg}>{c.org}</Text>
                  </View>
                </View>
                <View style={s.actions}>
                  <TouchableOpacity
                    style={s.msgBtn}
                    onPress={() => router.push('/(tabs)/messages' as any)}
                  >
                    <MessageSquare color={Colors.primary} size={16} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[s.connBtn, isConn && s.connBtnActive]}
                    onPress={() => setConns(prev => {
                      const next = new Set(prev);
                      isConn ? next.delete(c.id) : next.add(c.id);
                      return next;
                    })}
                  >
                    <Text style={[s.connTxt, isConn && s.connTxtActive]}>
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
  statsRow: { flexDirection: 'row', marginHorizontal: Spacing.lg, marginTop: Spacing.md, marginBottom: Spacing.sm, backgroundColor: Colors.surface, borderRadius: Radii.lg, borderWidth: 1, borderColor: Colors.border },
  stat: { flex: 1, alignItems: 'center', paddingVertical: Spacing.md },
  statBorder: { borderRightWidth: 1, borderRightColor: Colors.border },
  statVal: { fontFamily: Typography.family.bold, fontSize: Typography.size.xl, color: Colors.textPrimary },
  statLbl: { fontFamily: Typography.family.regular, fontSize: 10, color: Colors.textMuted },
  filterRow: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
  chip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: Radii.full, backgroundColor: Colors.elevated, borderWidth: 1, borderColor: Colors.border, marginRight: 8 },
  chipActive: { backgroundColor: `${Colors.primary}20`, borderColor: `${Colors.primary}50` },
  chipTxt: { fontFamily: Typography.family.medium, fontSize: Typography.size.xs, color: Colors.textMuted },
  chipTxtActive: { color: Colors.primary },
  list: { paddingHorizontal: Spacing.lg, gap: Spacing.md },
  card: { flexDirection: 'row', backgroundColor: Colors.surface, borderRadius: Radii.lg, padding: Spacing.md, borderWidth: 1, borderColor: Colors.border, gap: Spacing.md, alignItems: 'center' },
  av: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  avTxt: { fontFamily: Typography.family.bold, fontSize: Typography.size.lg, color: Colors.white },
  info: { flex: 1, gap: 2 },
  cName: { fontFamily: Typography.family.bold, fontSize: Typography.size.sm, color: Colors.textPrimary },
  cRole: { fontFamily: Typography.family.medium, fontSize: Typography.size.xs, color: Colors.textMuted },
  cOrg: { fontFamily: Typography.family.regular, fontSize: Typography.size.xs, color: Colors.textDisabled },
  actions: { gap: 8, alignItems: 'flex-end' },
  msgBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: `${Colors.primary}15`, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: `${Colors.primary}30` },
  connBtn: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: Radii.md, backgroundColor: Colors.elevated, borderWidth: 1, borderColor: Colors.border },
  connBtnActive: { backgroundColor: `${Colors.primary}15`, borderColor: `${Colors.primary}40` },
  connTxt: { fontFamily: Typography.family.medium, fontSize: 11, color: Colors.textPrimary },
  connTxtActive: { color: Colors.primary },
});
