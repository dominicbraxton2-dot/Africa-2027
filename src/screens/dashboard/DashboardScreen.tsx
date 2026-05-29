import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../constants/theme';
import { Card } from '../../components/common/Card';
import { useAuthStore } from '../../store/authStore';
import { useTripStore } from '../../store/tripStore';
import { differenceInDays, format, parseISO } from 'date-fns';

const { width } = Dimensions.get('window');

// Trip date: adjust as needed
const DEPARTURE_DATE = new Date('2027-08-01');

const QUICK_ACTIONS = [
  { id: 'itinerary', label: 'Itinerary', icon: '📋', screen: 'Itinerary' },
  { id: 'receipts', label: 'Scan Receipt', icon: '📷', screen: 'Receipts' },
  { id: 'emergency', label: 'Emergency', icon: '🆘', screen: 'Emergency' },
  { id: 'expenses', label: 'Expenses', icon: '💳', screen: 'ExpensesTab' },
  { id: 'directory', label: 'Travelers', icon: '👥', screen: 'Directory' },
  { id: 'balances', label: 'Balances', icon: '⚖️', screen: 'BalancesTab' },
];

interface Props {
  navigation: any;
}

export function DashboardScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const { fetchAllUsers, fetchExpenses, allUsers } = useTripStore();
  const [refreshing, setRefreshing] = useState(false);
  const [zanzibarWeather] = useState({ temp: '28°C', condition: 'Sunny', humidity: '75%' });
  const [capeTownWeather] = useState({ temp: '18°C', condition: 'Partly Cloudy', humidity: '60%' });

  const daysUntil = differenceInDays(DEPARTURE_DATE, new Date());

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchAllUsers(), fetchExpenses()]);
    setRefreshing(false);
  };

  useEffect(() => {
    fetchAllUsers();
    fetchExpenses();
  }, []);

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <LinearGradient
        colors={[Colors.black, '#0F0B00', Colors.black]}
        style={StyleSheet.absoluteFill}
      />
      {/* Gold top accent */}
      <View style={styles.topAccent} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.gold} />
        }
        contentContainerStyle={styles.scroll}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{greeting()},</Text>
            <Text style={styles.userName}>{user?.full_name?.split(' ')[0] || 'Traveler'}</Text>
          </View>
          <TouchableOpacity
            onPress={() => navigation.navigate('Profile')}
            style={styles.avatarBtn}
          >
            <LinearGradient
              colors={[Colors.goldLight, Colors.goldDark]}
              style={styles.avatar}
            >
              <Text style={styles.avatarText}>
                {(user?.full_name || 'T').charAt(0).toUpperCase()}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Hero countdown */}
        <LinearGradient
          colors={['#1A1200', Colors.goldDark + '30', '#1A1200']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          <View style={styles.heroBorder} />
          <Text style={styles.heroLabel}>ANDRETTA'S 40TH BIRTHDAY EXPEDITION</Text>
          <Text style={styles.countdownNumber}>
            {daysUntil > 0 ? daysUntil : '🎉'}
          </Text>
          <Text style={styles.countdownLabel}>
            {daysUntil > 0 ? 'days until departure' : 'We\'re here! 🌍'}
          </Text>
          <Text style={styles.departureDate}>
            {format(DEPARTURE_DATE, 'MMMM d, yyyy')}
          </Text>
          <View style={styles.destinations}>
            <Text style={styles.destinationTag}>🇹🇿 Zanzibar</Text>
            <View style={styles.destDivider} />
            <Text style={styles.destinationTag}>🇿🇦 Cape Town</Text>
          </View>
        </LinearGradient>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Access</Text>
        <View style={styles.actionsGrid}>
          {QUICK_ACTIONS.map((action) => (
            <TouchableOpacity
              key={action.id}
              style={styles.actionCard}
              onPress={() => navigation.navigate(action.screen)}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={[Colors.surfaceBg, Colors.cardBg]}
                style={styles.actionGradient}
              >
                <Text style={styles.actionIcon}>{action.icon}</Text>
                <Text style={styles.actionLabel}>{action.label}</Text>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>

        {/* Destination Cards */}
        <Text style={styles.sectionTitle}>Destinations</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.destRow}
        >
          {/* Zanzibar Card */}
          <View style={[styles.destCard, { marginRight: Spacing.md }]}>
            <LinearGradient
              colors={[Colors.zanzibar + 'CC', '#0A2A22']}
              style={styles.destCardGradient}
            >
              <Text style={styles.destFlag}>🇹🇿</Text>
              <Text style={styles.destName}>Zanzibar</Text>
              <Text style={styles.destCountry}>Tanzania</Text>
              <View style={styles.destInfo}>
                <Text style={styles.weatherText}>☀️ {zanzibarWeather.temp}</Text>
                <Text style={styles.destMeta}>TZS · GMT+3</Text>
              </View>
              <Text style={styles.destNote}>Stone Town & beaches</Text>
            </LinearGradient>
          </View>

          {/* Cape Town Card */}
          <View style={styles.destCard}>
            <LinearGradient
              colors={[Colors.ocean + 'CC', '#0A1A2A']}
              style={styles.destCardGradient}
            >
              <Text style={styles.destFlag}>🇿🇦</Text>
              <Text style={styles.destName}>Cape Town</Text>
              <Text style={styles.destCountry}>South Africa</Text>
              <View style={styles.destInfo}>
                <Text style={styles.weatherText}>⛅ {capeTownWeather.temp}</Text>
                <Text style={styles.destMeta}>ZAR · GMT+2</Text>
              </View>
              <Text style={styles.destNote}>Table Mountain & vineyards</Text>
            </LinearGradient>
          </View>
        </ScrollView>

        {/* Travelers Summary */}
        <View style={styles.travelersSummary}>
          <Text style={styles.sectionTitle}>
            The Group ({allUsers.length} {allUsers.length === 1 ? 'traveler' : 'travelers'})
          </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Directory')}>
            <Text style={styles.viewAll}>View all →</Text>
          </TouchableOpacity>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.travelersRow}
        >
          {allUsers.slice(0, 8).map((u) => (
            <View key={u.id} style={styles.travelerChip}>
              <LinearGradient
                colors={[Colors.goldLight, Colors.goldDark]}
                style={styles.travelerAvatar}
              >
                <Text style={styles.travelerAvatarText}>
                  {(u.full_name || 'T').charAt(0).toUpperCase()}
                </Text>
              </LinearGradient>
              <Text style={styles.travelerName} numberOfLines={1}>
                {u.full_name?.split(' ')[0]}
              </Text>
            </View>
          ))}
        </ScrollView>

        {/* Admin-only actions */}
        {user?.role === 'admin' && (
          <Card variant="gold" style={styles.adminCard}>
            <Text style={styles.adminTitle}>⚙️ Admin Controls</Text>
            <TouchableOpacity
              style={styles.adminAction}
              onPress={() => navigation.navigate('Itinerary')}
            >
              <Text style={styles.adminActionText}>📎 Upload Itinerary</Text>
              <Text style={styles.adminChevron}>→</Text>
            </TouchableOpacity>
          </Card>
        )}

        <View style={{ height: Spacing.xl }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.black },
  topAccent: {
    height: 3,
    backgroundColor: Colors.gold,
  },
  scroll: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.base,
    paddingBottom: Spacing['2xl'],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  greeting: {
    color: Colors.textSecondary,
    fontSize: Typography.sizes.base,
    fontWeight: '400',
  },
  userName: {
    color: Colors.textPrimary,
    fontSize: Typography.sizes['2xl'],
    fontWeight: '800',
  },
  avatarBtn: { borderRadius: 24 },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: Colors.black,
    fontSize: Typography.sizes.xl,
    fontWeight: '800',
  },
  heroCard: {
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.gold + '40',
    padding: Spacing.xl,
    alignItems: 'center',
    marginBottom: Spacing.xl,
    position: 'relative',
    overflow: 'hidden',
  },
  heroBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: Colors.gold,
    opacity: 0.5,
  },
  heroLabel: {
    color: Colors.gold,
    fontSize: Typography.sizes.xs,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  countdownNumber: {
    color: Colors.textPrimary,
    fontSize: 80,
    fontWeight: '900',
    lineHeight: 86,
  },
  countdownLabel: {
    color: Colors.textSecondary,
    fontSize: Typography.sizes.base,
    letterSpacing: 1,
    marginTop: Spacing.xs,
  },
  departureDate: {
    color: Colors.gold,
    fontSize: Typography.sizes.sm,
    fontWeight: '600',
    marginTop: Spacing.sm,
    letterSpacing: 0.5,
  },
  destinations: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.base,
    backgroundColor: Colors.black + '60',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.borderColor,
  },
  destinationTag: {
    color: Colors.textPrimary,
    fontSize: Typography.sizes.sm,
    fontWeight: '600',
  },
  destDivider: {
    width: 1,
    height: 14,
    backgroundColor: Colors.borderColor,
    marginHorizontal: Spacing.md,
  },
  sectionTitle: {
    color: Colors.textPrimary,
    fontSize: Typography.sizes.md,
    fontWeight: '700',
    marginBottom: Spacing.md,
    letterSpacing: 0.3,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  actionCard: {
    width: (width - Spacing.base * 2 - Spacing.sm * 2) / 3,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.borderColor,
  },
  actionGradient: {
    padding: Spacing.md,
    alignItems: 'center',
    minHeight: 82,
    justifyContent: 'center',
  },
  actionIcon: {
    fontSize: 28,
    marginBottom: Spacing.xs,
  },
  actionLabel: {
    color: Colors.textSecondary,
    fontSize: Typography.sizes.xs,
    fontWeight: '600',
    textAlign: 'center',
  },
  destRow: {
    paddingBottom: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  destCard: {
    width: width * 0.62,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.borderColor,
  },
  destCardGradient: {
    padding: Spacing.base,
    minHeight: 160,
  },
  destFlag: {
    fontSize: 32,
    marginBottom: Spacing.xs,
  },
  destName: {
    color: Colors.textPrimary,
    fontSize: Typography.sizes.xl,
    fontWeight: '800',
  },
  destCountry: {
    color: Colors.textSecondary,
    fontSize: Typography.sizes.sm,
    marginBottom: Spacing.sm,
  },
  destInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  weatherText: {
    color: Colors.textPrimary,
    fontSize: Typography.sizes.base,
    fontWeight: '600',
  },
  destMeta: {
    color: Colors.gold,
    fontSize: Typography.sizes.xs,
    fontWeight: '600',
  },
  destNote: {
    color: Colors.textMuted,
    fontSize: Typography.sizes.xs,
    fontStyle: 'italic',
    marginTop: Spacing.xs,
  },
  travelersSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  viewAll: {
    color: Colors.gold,
    fontSize: Typography.sizes.sm,
    fontWeight: '600',
  },
  travelersRow: {
    paddingBottom: Spacing.sm,
    gap: Spacing.base,
    marginBottom: Spacing.xl,
  },
  travelerChip: {
    alignItems: 'center',
    width: 56,
  },
  travelerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  travelerAvatarText: {
    color: Colors.black,
    fontSize: Typography.sizes.lg,
    fontWeight: '800',
  },
  travelerName: {
    color: Colors.textSecondary,
    fontSize: Typography.sizes.xs,
    fontWeight: '500',
    textAlign: 'center',
  },
  adminCard: {
    marginBottom: Spacing.base,
  },
  adminTitle: {
    color: Colors.gold,
    fontSize: Typography.sizes.base,
    fontWeight: '700',
    marginBottom: Spacing.sm,
  },
  adminAction: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.borderColor,
  },
  adminActionText: {
    color: Colors.textSecondary,
    fontSize: Typography.sizes.base,
  },
  adminChevron: {
    color: Colors.gold,
    fontSize: Typography.sizes.base,
  },
});
