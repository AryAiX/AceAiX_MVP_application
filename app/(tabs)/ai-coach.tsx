import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { Bot, Zap, Send, Sparkles, TrendingUp, Users, Target, RefreshCw } from 'lucide-react-native';
import { AppHeader } from '@/components/AppHeader';
import { Colors, Typography, Spacing, Radii } from '@/constants/theme';

const INITIAL_MESSAGES = [
  { id: '1', from: 'ai', text: 'Hello! I\'m your AI Career Coach, powered by AceAiX. I\'ve analyzed your profile, performance data, and market trends to give you personalized guidance. What would you like to work on today?' },
  { id: '2', from: 'user', text: 'How can I improve my visibility score?' },
  { id: '3', from: 'ai', text: 'Great question! Your current Visibility Score is 9.2/10, placing you in the Top 8% globally. Here are 3 targeted actions to push you into the Top 5%:\n\n1. Upload at least 2 highlight clips — scouts viewing your profile are 3.4x more likely to reach out when video is present.\n\n2. Complete your Medical Verification — verified athletes receive 28% more scout profile views.\n\n3. Request endorsements from 2 coaches in your network — each endorsement adds ~0.3 to your AI Score.\n\nWant me to create a 30-day action plan for you?' },
];

const CHIPS = [
  { label: 'Improve my score', Icon: TrendingUp },
  { label: 'Matching clubs', Icon: Target },
  { label: 'Training plan', Icon: Zap },
  { label: 'Career advice', Icon: Sparkles },
];

export default function AICoach() {
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  function sendMessage(text: string) {
    if (!text.trim()) return;
    const userMsg = { id: Date.now().toString(), from: 'user', text: text.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    setTimeout(() => {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        from: 'ai',
        text: 'Thanks for sharing that. Based on your current profile data and the latest market insights, I can see several opportunities for improvement. Would you like me to dive deeper into any specific area?',
      }]);
      setLoading(false);
    }, 1400);
  }

  return (
    <View style={s.root}>
      <AppHeader title="AI Coach" />
      <View style={s.coachBar}>
        <View style={s.coachAv}><Zap color={Colors.bg} size={18} fill={Colors.bg} /></View>
        <View>
          <Text style={s.coachName}>AceAiX Career Coach</Text>
          <View style={s.onlineRow}>
            <View style={s.onlineDot} />
            <Text style={s.onlineTxt}>Online · Powered by AI</Text>
          </View>
        </View>
        <TouchableOpacity style={s.refreshBtn} onPress={() => setMessages(INITIAL_MESSAGES)}>
          <RefreshCw color={Colors.textMuted} size={16} />
        </TouchableOpacity>
      </View>

      <ScrollView style={s.msgList} contentContainerStyle={{ padding: Spacing.lg, gap: Spacing.md }}>
        {messages.map(msg => (
          <View key={msg.id} style={[s.bubble, msg.from === 'user' ? s.bubbleUser : s.bubbleAI]}>
            {msg.from === 'ai' && (
              <View style={s.aiAvMini}><Zap color={Colors.bg} size={12} fill={Colors.bg} /></View>
            )}
            <View style={[s.bubbleInner, msg.from === 'user' ? s.bubbleInnerUser : s.bubbleInnerAI]}>
              <Text style={[s.bubbleTxt, msg.from === 'user' && s.bubbleTxtUser]}>{msg.text}</Text>
            </View>
          </View>
        ))}
        {loading && (
          <View style={[s.bubble, s.bubbleAI]}>
            <View style={s.aiAvMini}><Zap color={Colors.bg} size={12} fill={Colors.bg} /></View>
            <View style={s.bubbleInnerAI}>
              <Text style={s.typingDots}>● ● ●</Text>
            </View>
          </View>
        )}
        <View style={{ height: 8 }} />
      </ScrollView>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.chipsRow}>
        {CHIPS.map(chip => (
          <TouchableOpacity key={chip.label} style={s.chip} onPress={() => sendMessage(chip.label)}>
            <chip.Icon color={Colors.primary} size={13} />
            <Text style={s.chipTxt}>{chip.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={s.inputRow}>
        <TextInput
          style={s.input}
          value={input}
          onChangeText={setInput}
          placeholder="Ask your AI coach…"
          placeholderTextColor={Colors.textDisabled}
          multiline
          returnKeyType="send"
          onSubmitEditing={() => sendMessage(input)}
        />
        <TouchableOpacity
          style={[s.sendBtn, !input.trim() && s.sendBtnDisabled]}
          onPress={() => sendMessage(input)}
          disabled={!input.trim()}
        >
          <Send color={input.trim() ? Colors.white : Colors.textDisabled} size={18} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  coachBar: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.lg, backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border },
  coachAv: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  coachName: { fontFamily: Typography.family.display, fontSize: Typography.size.lg, color: Colors.textPrimary, letterSpacing: 0.5 },
  onlineRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  onlineDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.success },
  onlineTxt: { fontFamily: Typography.family.regular, fontSize: Typography.size.xs, color: Colors.success },
  refreshBtn: { marginLeft: 'auto' as any, padding: Spacing.sm },
  msgList: { flex: 1 },
  bubble: { flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.sm, marginBottom: Spacing.sm },
  bubbleUser: { flexDirection: 'row-reverse' },
  bubbleAI: {},
  aiAvMini: { width: 24, height: 24, borderRadius: 12, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  bubbleInner: { maxWidth: '80%', borderRadius: 16, padding: Spacing.md },
  bubbleInnerUser: { backgroundColor: Colors.primary, borderBottomRightRadius: 4 },
  bubbleInnerAI: { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderBottomLeftRadius: 4 },
  bubbleTxt: { fontFamily: Typography.family.regular, fontSize: Typography.size.sm, color: Colors.textPrimary, lineHeight: 20 },
  bubbleTxtUser: { color: Colors.white },
  typingDots: { fontFamily: Typography.family.regular, fontSize: Typography.size.xs, color: Colors.textMuted, letterSpacing: 4 },
  chipsRow: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: `${Colors.primary}15`, borderRadius: Radii.full, paddingHorizontal: 14, paddingVertical: 7, marginRight: 8, borderWidth: 1, borderColor: `${Colors.primary}28` },
  chipTxt: { fontFamily: Typography.family.medium, fontSize: Typography.size.xs, color: Colors.primary },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.sm, padding: Spacing.lg, borderTopWidth: 1, borderTopColor: Colors.border, backgroundColor: Colors.surface },
  input: { flex: 1, backgroundColor: Colors.elevated, borderRadius: Radii.lg, paddingHorizontal: Spacing.md, paddingVertical: Spacing.md, fontFamily: Typography.family.regular, fontSize: Typography.size.sm, color: Colors.textPrimary, maxHeight: 100, borderWidth: 1, borderColor: Colors.border },
  sendBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  sendBtnDisabled: { backgroundColor: Colors.elevated },
});
