import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Image } from 'react-native';
import { BadgeCheck, Search, Edit, Check, CheckCheck } from 'lucide-react-native';
import { AppHeader } from '@/components/AppHeader';
import { Colors, Typography, Spacing, Radii } from '@/constants/theme';

const CONVOS = [
  { id: '1', name: 'Manchester United FC', role: 'Head Scout', last: 'We are interested in scheduling a trial for next month. Are you available?', time: '2h ago', unread: 2, verified: true, online: true },
  { id: '2', name: 'AI Career Coach', role: 'AceAiX AI', last: 'Based on your recent performance data, I have 3 new club recommendations for you.', time: '5h ago', unread: 1, verified: true, online: true },
  { id: '3', name: 'Aisha Al-Rashid', role: 'Goalkeeper · Football', last: 'Great game yesterday! Your positioning in the second half was really impressive.', time: '1d ago', unread: 0, verified: true, online: false },
  { id: '4', name: 'Al Nassr FC', role: 'Talent Scout', last: 'Thank you for your application. Our coaching staff will review and get back to you.', time: '2d ago', unread: 0, verified: true, online: false },
  { id: '5', name: 'Diego Santos', role: 'Midfielder · Football', last: 'Are you going to the regional training camp next week?', time: '3d ago', unread: 0, verified: false, online: true },
  { id: '6', name: 'AC Milan Scout', role: 'Regional Scout', last: 'We viewed your profile on AceAiX. Very impressive stats this season.', time: '5d ago', unread: 0, verified: true, online: false },
  { id: '7', name: 'Coach Martinez', role: 'Head Coach · Al Jazira', last: 'Practice starts at 7am sharp tomorrow. Don\'t be late.', time: '1w ago', unread: 0, verified: false, online: false },
];

const COLORS = [Colors.primary, Colors.accent, Colors.success, Colors.warning, '#9B59B6', '#E67E22'];

export default function Messages() {
  const [query, setQuery] = useState('');
  const filtered = CONVOS.filter(c =>
    c.name.toLowerCase().includes(query.toLowerCase()) ||
    c.last.toLowerCase().includes(query.toLowerCase())
  );
  const totalUnread = CONVOS.reduce((sum, c) => sum + c.unread, 0);

  return (
    <View style={s.root}>
      <AppHeader title="Messages" />
      <View style={s.searchWrap}>
        <Search color={Colors.textDisabled} size={15} />
        <TextInput
          style={s.searchInput}
          value={query}
          onChangeText={setQuery}
          placeholder="Search messages…"
          placeholderTextColor={Colors.textDisabled}
        />
      </View>

      <View style={s.filterRow}>
        {['All', 'Scouts', 'Clubs', 'Athletes', 'AI'].map(f => (
          <TouchableOpacity key={f} style={[s.filterChip, f === 'All' && s.filterChipActive]}>
            <Text style={[s.filterTxt, f === 'All' && s.filterTxtActive]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={s.list} showsVerticalScrollIndicator={false}>
        {filtered.map((c, i) => (
          <TouchableOpacity key={c.id} style={[s.convo, i < filtered.length - 1 && s.convoBorder]} activeOpacity={0.7}>
            <View style={[s.avatar, { backgroundColor: COLORS[i % COLORS.length] }]}>
              {c.online && <View style={s.onlineDot} />}
              <Text style={s.avatarTxt}>{c.name[0]}</Text>
            </View>
            <View style={s.convoBody}>
              <View style={s.convoTop}>
                <View style={s.nameRow}>
                  <Text style={s.convoName} numberOfLines={1}>{c.name}</Text>
                  {c.verified && <BadgeCheck color={Colors.primary} size={13} />}
                </View>
                <Text style={s.convoTime}>{c.time}</Text>
              </View>
              <Text style={s.convoRole}>{c.role}</Text>
              <View style={s.convoBottom}>
                <Text style={[s.convoLast, c.unread > 0 && s.convoLastUnread]} numberOfLines={2}>
                  {c.last}
                </Text>
                {c.unread > 0 ? (
                  <View style={s.badge}><Text style={s.badgeTxt}>{c.unread}</Text></View>
                ) : (
                  <CheckCheck color={Colors.textDisabled} size={14} />
                )}
              </View>
            </View>
          </TouchableOpacity>
        ))}
        <View style={{ height: 24 }} />
      </ScrollView>

      <TouchableOpacity style={s.fab}>
        <Edit color={Colors.white} size={22} />
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  searchWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.elevated, borderRadius: Radii.md, marginHorizontal: Spacing.lg, marginTop: Spacing.md, marginBottom: Spacing.sm, paddingHorizontal: Spacing.md, height: 40, gap: Spacing.sm, borderWidth: 1, borderColor: Colors.border },
  searchInput: { flex: 1, fontFamily: Typography.family.regular, fontSize: Typography.size.sm, color: Colors.textPrimary },
  filterRow: { flexDirection: 'row', paddingHorizontal: Spacing.lg, gap: Spacing.sm, marginBottom: Spacing.md },
  filterChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: Radii.full, backgroundColor: Colors.elevated, borderWidth: 1, borderColor: Colors.border },
  filterChipActive: { backgroundColor: `${Colors.primary}20`, borderColor: `${Colors.primary}50` },
  filterTxt: { fontFamily: Typography.family.medium, fontSize: Typography.size.xs, color: Colors.textMuted },
  filterTxtActive: { color: Colors.primary },
  list: { flex: 1 },
  convo: { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, gap: Spacing.md },
  convoBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  avatar: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  avatarTxt: { fontFamily: Typography.family.bold, fontSize: Typography.size.lg, color: Colors.white },
  onlineDot: { position: 'absolute', bottom: 1, right: 1, width: 11, height: 11, borderRadius: 6, backgroundColor: Colors.success, borderWidth: 2, borderColor: Colors.bg },
  convoBody: { flex: 1 },
  convoTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 4, flex: 1, marginRight: Spacing.sm },
  convoName: { fontFamily: Typography.family.bold, fontSize: Typography.size.md, color: Colors.textPrimary },
  convoTime: { fontFamily: Typography.family.regular, fontSize: Typography.size.xs, color: Colors.textDisabled },
  convoRole: { fontFamily: Typography.family.regular, fontSize: Typography.size.xs, color: Colors.textMuted, marginTop: 1, marginBottom: 4 },
  convoBottom: { flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.sm },
  convoLast: { flex: 1, fontFamily: Typography.family.regular, fontSize: Typography.size.sm, color: Colors.textMuted, lineHeight: 18 },
  convoLastUnread: { color: Colors.textPrimary, fontFamily: Typography.family.medium },
  badge: { backgroundColor: Colors.primary, borderRadius: 10, minWidth: 20, height: 20, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5 },
  badgeTxt: { color: Colors.white, fontFamily: Typography.family.bold, fontSize: 11 },
  fab: { position: 'absolute', bottom: 24, right: 24, width: 54, height: 54, borderRadius: 27, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 8 },
});
