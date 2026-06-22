import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { Shield, Activity, AlertCircle, CheckCircle2, Clock, FileText, BadgeCheck } from 'lucide-react-native';
import { AppHeader } from '@/components/AppHeader';
import { Colors, Typography, Spacing, Radii } from '@/constants/theme';

const RECORDS = [
  { date: 'Jun 15, 2025', type: 'Fitness Assessment', status: 'Cleared', notes: 'All metrics within optimal range.' },
  { date: 'May 2, 2025', type: 'Pre-Season Physical', status: 'Cleared', notes: 'No injuries detected. Full clearance granted.' },
  { date: 'Mar 10, 2025', type: 'Injury Follow-Up', status: 'Cleared', notes: 'Previous minor strain fully recovered.' },
  { date: 'Jan 8, 2025', type: 'Annual Health Check', status: 'Cleared', notes: 'All blood work and cardiac checks normal.' },
];

const RISK_FACTORS = [
  { label: 'Overuse Risk', level: 'Low', color: Colors.success },
  { label: 'Injury History', level: 'Minimal', color: Colors.success },
  { label: 'Recovery Score', level: '91%', color: Colors.primary },
  { label: 'Cardiac Health', level: 'Optimal', color: Colors.success },
];

export default function Medical() {
  return (
    <View style={s.root}>
      <AppHeader title="Medical" />
      <ScrollView style={s.scroll} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <View style={[s.card, s.clearanceCard]}>
          <View style={s.clearanceRow}>
            <Shield color={Colors.success} size={32} />
            <View>
              <Text style={s.clearanceStatus}>Full Clearance Active</Text>
              <Text style={s.clearanceSub}>Medically verified athlete</Text>
            </View>
            <BadgeCheck color={Colors.success} size={22} />
          </View>
          <View style={s.clearanceMeta}>
            <Clock color={Colors.textDisabled} size={12} />
            <Text style={s.clearanceDate}>Last verified: Jun 15, 2025 · Expires: Jun 15, 2026</Text>
          </View>
        </View>

        <View style={s.card}>
          <Text style={s.cardTitle}>AI Risk Summary</Text>
          <Text style={s.aiSummary}>
            Based on your training load, recovery patterns, and match history, your overall injury risk is LOW.
            Your cardiovascular fitness is in the top 15% for your age group and sport. Continue your current
            recovery protocol for optimal performance.
          </Text>
          <View style={s.riskGrid}>
            {RISK_FACTORS.map(rf => (
              <View key={rf.label} style={s.riskItem}>
                <Text style={[s.riskLevel, { color: rf.color }]}>{rf.level}</Text>
                <Text style={s.riskLabel}>{rf.label}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={s.card}>
          <Text style={s.cardTitle}>Medical Records</Text>
          {RECORDS.map((rec, i) => (
            <View key={rec.date} style={[s.recordRow, i > 0 && { borderTopWidth: 1, borderTopColor: Colors.border }]}>
              <View style={s.recordLeft}>
                <CheckCircle2 color={Colors.success} size={16} />
                <View>
                  <Text style={s.recordType}>{rec.type}</Text>
                  <Text style={s.recordDate}>{rec.date}</Text>
                  <Text style={s.recordNotes}>{rec.notes}</Text>
                </View>
              </View>
              <View style={s.recordStatus}>
                <Text style={s.recordStatusTxt}>{rec.status}</Text>
              </View>
            </View>
          ))}
        </View>

        <TouchableOpacity style={s.uploadBtn}>
          <FileText color={Colors.primary} size={18} />
          <Text style={s.uploadTxt}>Upload Medical Document</Text>
        </TouchableOpacity>

        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  scroll: { flex: 1 },
  content: { padding: Spacing.lg, gap: Spacing.md },
  card: { backgroundColor: Colors.surface, borderRadius: Radii.lg, padding: Spacing.lg, borderWidth: 1, borderColor: Colors.border },
  clearanceCard: { borderColor: `${Colors.success}40`, backgroundColor: `${Colors.success}08` },
  clearanceRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.md },
  clearanceStatus: { fontFamily: Typography.family.bold, fontSize: Typography.size.lg, color: Colors.success },
  clearanceSub: { fontFamily: Typography.family.regular, fontSize: Typography.size.xs, color: Colors.textMuted },
  clearanceMeta: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  clearanceDate: { fontFamily: Typography.family.regular, fontSize: Typography.size.xs, color: Colors.textDisabled },
  cardTitle: { fontFamily: Typography.family.bold, fontSize: Typography.size.md, color: Colors.textPrimary, marginBottom: Spacing.md },
  aiSummary: { fontFamily: Typography.family.regular, fontSize: Typography.size.sm, color: Colors.textMuted, lineHeight: 20, marginBottom: Spacing.lg },
  riskGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  riskItem: { flex: 1, minWidth: '44%', backgroundColor: Colors.elevated, borderRadius: Radii.md, padding: Spacing.md, borderWidth: 1, borderColor: Colors.border },
  riskLevel: { fontFamily: Typography.family.bold, fontSize: Typography.size.lg },
  riskLabel: { fontFamily: Typography.family.regular, fontSize: Typography.size.xs, color: Colors.textMuted, marginTop: 2 },
  recordRow: { paddingVertical: Spacing.md, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  recordLeft: { flexDirection: 'row', gap: Spacing.md, flex: 1 },
  recordType: { fontFamily: Typography.family.bold, fontSize: Typography.size.sm, color: Colors.textPrimary },
  recordDate: { fontFamily: Typography.family.regular, fontSize: Typography.size.xs, color: Colors.textMuted, marginTop: 2 },
  recordNotes: { fontFamily: Typography.family.regular, fontSize: Typography.size.xs, color: Colors.textDisabled, marginTop: 3, maxWidth: 220 },
  recordStatus: { backgroundColor: `${Colors.success}20`, borderRadius: Radii.full, paddingHorizontal: 10, paddingVertical: 3, borderWidth: 1, borderColor: `${Colors.success}35` },
  recordStatusTxt: { fontFamily: Typography.family.bold, fontSize: 10, color: Colors.success },
  uploadBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.md, borderRadius: Radii.lg, paddingVertical: Spacing.md + 2, borderWidth: 2, borderColor: `${Colors.primary}40`, borderStyle: 'dashed' as any },
  uploadTxt: { fontFamily: Typography.family.bold, fontSize: Typography.size.md, color: Colors.primary },
});
