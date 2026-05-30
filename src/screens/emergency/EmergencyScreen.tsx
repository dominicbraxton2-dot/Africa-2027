import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Typography, Spacing, BorderRadius } from '../../constants/theme';
import { ScreenHeader } from '../../components/common/ScreenHeader';
import { Card } from '../../components/common/Card';
import { EMERGENCY_INFO } from '../../types';

interface Props {
  navigation: any;
}

function callNumber(number: string) {
  const clean = number.replace(/\s/g, '');
  Linking.openURL(`tel:${clean}`).catch(() => {});
}

export function EmergencyScreen({ navigation }: Props) {
  const [activeTab, setActiveTab] = useState<'cape_town' | 'zanzibar'>('cape_town');
  const info = EMERGENCY_INFO.find((e) => e.destination === activeTab)!;

  return (
    <View style={styles.root}>
      <ScreenHeader
        title="Emergency Center"
        subtitle="Critical contacts & information"
        onBack={() => navigation.goBack()}
      />

      {/* Tab switcher */}
      <View style={styles.tabs}>
        {(['cape_town', 'zanzibar'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.activeTab]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={styles.tabFlag}>
              {tab === 'zanzibar' ? '🇹🇿' : '🇿🇦'}
            </Text>
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
              {tab === 'zanzibar' ? 'Zanzibar' : 'Cape Town'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* SOS Banner */}
        <LinearGradient
          colors={[Colors.error + 'CC', '#5A0000']}
          style={styles.sosBanner}
        >
          <Text style={styles.sosTitle}>🚨 Local Emergency Numbers</Text>
          <Text style={styles.sosSubtitle}>
            {activeTab === 'zanzibar' ? 'Zanzibar, Tanzania' : 'Cape Town, South Africa'}
          </Text>
        </LinearGradient>

        {/* Police & Ambulance */}
        <View style={styles.emergencyRow}>
          <TouchableOpacity
            style={styles.emergencyCard}
            onPress={() => callNumber(info.police)}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#1A2A4A', '#0A1220']}
              style={styles.emergencyCardGradient}
            >
              <Text style={styles.emergencyIcon}>🚔</Text>
              <Text style={styles.emergencyLabel}>Police</Text>
              <Text style={styles.emergencyNumber}>{info.police}</Text>
              <View style={styles.callBtn}>
                <Text style={styles.callBtnText}>Call Now</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.emergencyCard}
            onPress={() => callNumber(info.ambulance)}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#1A0A0A', '#2A0808']}
              style={styles.emergencyCardGradient}
            >
              <Text style={styles.emergencyIcon}>🚑</Text>
              <Text style={styles.emergencyLabel}>Ambulance</Text>
              <Text style={styles.emergencyNumber}>{info.ambulance}</Text>
              <View style={styles.callBtn}>
                <Text style={styles.callBtnText}>Call Now</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Embassy / Consulate */}
        <Text style={styles.sectionTitle}>🏛️ U.S. Embassy Information</Text>
        <Card variant="gold" style={styles.embassyCard}>
          <Text style={styles.embassyName}>{info.embassy_name}</Text>
          <View style={styles.embassyRow}>
            <Text style={styles.embassyIcon}>📍</Text>
            <Text style={styles.embassyText}>{info.embassy_address}</Text>
          </View>
          {info.embassy_hours && (
            <View style={styles.embassyRow}>
              <Text style={styles.embassyIcon}>🕐</Text>
              <Text style={styles.embassyText}>{info.embassy_hours}</Text>
            </View>
          )}
          <TouchableOpacity
            style={styles.embassyCallBtn}
            onPress={() => callNumber(info.embassy_phone)}
          >
            <Text style={styles.embassyPhone}>{info.embassy_phone}</Text>
            <LinearGradient
              colors={[Colors.goldLight, Colors.goldDark]}
              style={styles.callGold}
            >
              <Text style={styles.callGoldText}>📞 Call</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Card>

        {/* Additional Tips */}
        <Text style={styles.sectionTitle}>📋 Emergency Tips</Text>
        <Card style={styles.tipsCard}>
          {TIPS.map((tip, i) => (
            <View key={i} style={[styles.tipRow, i < TIPS.length - 1 && styles.tipBorder]}>
              <Text style={styles.tipIcon}>{tip.icon}</Text>
              <View style={styles.tipContent}>
                <Text style={styles.tipTitle}>{tip.title}</Text>
                <Text style={styles.tipBody}>{tip.body}</Text>
              </View>
            </View>
          ))}
        </Card>

        <View style={{ height: Spacing.xl }} />
      </ScrollView>
    </View>
  );
}

const TIPS = [
  {
    icon: '🆔',
    title: 'Carry a Copy',
    body: 'Keep a copy of your passport and travel insurance separate from the originals.',
  },
  {
    icon: '💊',
    title: 'Medical Info',
    body: 'Ensure your allergies and blood type are in the app\'s Traveler Profile.',
  },
  {
    icon: '📱',
    title: 'Screenshot This Screen',
    body: 'Screenshot emergency contacts in case you lose internet access.',
  },
  {
    icon: '💰',
    title: 'Emergency Cash',
    body: 'Keep USD $100–200 hidden separately from your main wallet.',
  },
  {
    icon: '✈️',
    title: 'Travel Insurance',
    body: 'Know your travel insurance number. Available in your trip documents.',
  },
];

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.black },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderColor,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    gap: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.borderColor,
    backgroundColor: Colors.surfaceBg,
  },
  activeTab: {
    backgroundColor: Colors.error + '20',
    borderColor: Colors.error + '60',
  },
  tabFlag: { fontSize: 18 },
  tabText: {
    color: Colors.textSecondary,
    fontSize: Typography.sizes.base,
    fontWeight: '600',
  },
  activeTabText: {
    color: Colors.textPrimary,
  },
  scroll: {
    padding: Spacing.base,
    gap: Spacing.base,
  },
  sosBanner: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.base,
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  sosTitle: {
    color: Colors.white,
    fontSize: Typography.sizes.lg,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  sosSubtitle: {
    color: Colors.white + 'AA',
    fontSize: Typography.sizes.sm,
    marginTop: 4,
  },
  emergencyRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.base,
  },
  emergencyCard: {
    flex: 1,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.error + '40',
  },
  emergencyCardGradient: {
    padding: Spacing.base,
    alignItems: 'center',
    gap: Spacing.xs,
  },
  emergencyIcon: { fontSize: 36 },
  emergencyLabel: {
    color: Colors.textSecondary,
    fontSize: Typography.sizes.sm,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  emergencyNumber: {
    color: Colors.textPrimary,
    fontSize: Typography.sizes.base,
    fontWeight: '700',
    textAlign: 'center',
  },
  callBtn: {
    backgroundColor: Colors.error,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    marginTop: Spacing.xs,
  },
  callBtnText: {
    color: Colors.white,
    fontSize: Typography.sizes.xs,
    fontWeight: '700',
    letterSpacing: 1,
  },
  sectionTitle: {
    color: Colors.textPrimary,
    fontSize: Typography.sizes.md,
    fontWeight: '700',
    marginBottom: Spacing.sm,
  },
  embassyCard: {
    gap: Spacing.sm,
    marginBottom: Spacing.base,
  },
  embassyName: {
    color: Colors.gold,
    fontSize: Typography.sizes.md,
    fontWeight: '800',
    marginBottom: Spacing.xs,
  },
  embassyRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    alignItems: 'flex-start',
  },
  embassyIcon: { fontSize: 16 },
  embassyText: {
    color: Colors.textSecondary,
    fontSize: Typography.sizes.base,
    flex: 1,
    lineHeight: 20,
  },
  embassyCallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.borderColor,
  },
  embassyPhone: {
    color: Colors.textPrimary,
    fontSize: Typography.sizes.md,
    fontWeight: '700',
  },
  callGold: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  callGoldText: {
    color: Colors.black,
    fontSize: Typography.sizes.sm,
    fontWeight: '800',
  },
  tipsCard: {
    gap: 0,
    padding: 0,
    overflow: 'hidden',
  },
  tipRow: {
    flexDirection: 'row',
    padding: Spacing.base,
    gap: Spacing.md,
    alignItems: 'flex-start',
  },
  tipBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderColor,
  },
  tipIcon: { fontSize: 24, marginTop: 2 },
  tipContent: { flex: 1 },
  tipTitle: {
    color: Colors.textPrimary,
    fontSize: Typography.sizes.base,
    fontWeight: '700',
    marginBottom: 4,
  },
  tipBody: {
    color: Colors.textSecondary,
    fontSize: Typography.sizes.sm,
    lineHeight: 20,
  },
});
