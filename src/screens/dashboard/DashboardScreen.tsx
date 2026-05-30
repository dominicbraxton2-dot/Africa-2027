import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, BorderRadius } from '../../constants/theme';
import { Card } from '../../components/common/Card';
import { useAuthStore } from '../../store/authStore';
import { useTripStore } from '../../store/tripStore';
import { differenceInDays, format } from 'date-fns';

const { width } = Dimensions.get('window');

const DEPARTURE_DATE = new Date('2027-01-14T00:00:00');

const QUICK_ACTIONS = [
  { id: 'itinerary', label: 'Itinerary', icon: '📅', screen: 'Itinerary' },
  { id: 'receipts', label: 'Scan Receipt', icon: '📸', screen: 'Receipts' },
  { id: 'emergency', label: 'Emergency', icon: '🆘', screen: 'Emergency' },
  { id: 'expenses', label: 'Expenses', icon: '💰', screen: 'ExpensesTab' },
  { id: 'directory', label: 'Travelers', icon: '👥', screen: 'Directory' },
  { id: 'updates', label: 'Updates', icon: '📢', screen: 'Announcements' },
];

const DESTINATION_SCENES = [
  { flag: '🌴', name: 'Stone Town', location: 'Zanzibar', color1: Colors.teal + 'CC', color2: '#0A2A20', note: 'UNESCO World Heritage Site' },
  { flag: '🦁', name: 'Safari', location: 'Tanzania', color1: Colors.amber + 'CC', color2: '#1A0A00', note: 'Wildlife & Adventure' },
  { flag: '🏔', name: 'Table Mountain', location: 'Cape Town', color1: Colors.safariGreen + 'CC', color2: '#0A1520', note: 'New 7 Wonders of Nature' },
  { flag: '🍷', name: 'Wine Country', location: 'Stellenbosch', color1: '#4A1A3A' + 'CC', color2: '#1A0A10', note: 'World-class vineyards' },
];

interface Props {
  navigation: any;
}

function useCountdown(target: Date) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const calc = () => {
      const now = new Date().getTime();
      const diff = target.getTime() - now;
      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft({ days, hours, minutes, seconds });
    };
    calc();
    const interval = setInterval(calc, 1000);
    return () => clearInterval(interval);
  }, [target]);

  return timeLeft;
}

export function DashboardScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const { fetchAllUsers, fetchExpenses, allUsers } = useTripStore();
  const [refreshing, setRefreshing] = useState(false);
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const timeLeft = useCountdown(DEPARTURE_DATE);
  const daysUntil = differenceInDays(DEPARTURE_DATE, new Date());

  useEffect(() => {
    fetchAllUsers();
    fetchExpenses();
  }, []);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, { toValue: 1, duration: 2000, useNativeDriver: true }),
        Animated.timing(shimmerAnim, { toValue: 0, duration: 2000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchAllUsers(), fetchExpenses()]);
    setRefreshing(false);
  };

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const shimmerOpacity = shimmerAnim.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] });
  const isLive = daysUntil <= 0;

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <LinearGradient
        colors={[Colors.safariGreenDark, Colors.black, '#0A0800']}
        locations={[0, 0.25, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* Top gold accent */}
      <View style={styles.topAccent}>
        <LinearGradient
          colors={['transparent', Colors.gold, 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ height: 3 }}
        />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.gold} />
        }
        contentContainerStyle={styles.scroll}
      >
        {/* Header Row */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{greeting()},</Text>
            <Text style={styles.userName}>{user?.full_name?.split(' ')[0] || 'Traveler'}</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('Profile')} style={styles.avatarBtn}>
            <LinearGradient
              colors={['#F0CC50', '#D4AF37', '#A8860A']}
              style={styles.avatar}
            >
              <Text style={styles.avatarText}>
                {(user?.full_name || 'T').charAt(0).toUpperCase()}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Hero Expedition Card */}
        <View style={styles.heroWrapper}>
          <LinearGradient
            colors={[Colors.safariGreen + 'CC', Colors.safariGreenDark, '#0A1208']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroCard}
          >
            {/* Gold shimmer top bar */}
            <Animated.View style={[styles.heroTopBar, { opacity: shimmerOpacity }]}>
              <LinearGradient
                colors={['transparent', Colors.gold, Colors.amberLight, Colors.gold, 'transparent']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{ height: 2 }}
              />
            </Animated.View>

            <Text style={styles.heroSuperLabel}>✦ ANDRETTA'S 40TH BIRTHDAY ✦</Text>

            <Text style={styles.heroTitle}>Africa{'\n'}Expedition</Text>

            {/* Countdown */}
            {isLive ? (
              <View style={styles.liveContainer}>
                <Text style={styles.liveText}>🎉 WE'RE HERE! 🌍</Text>
              </View>
            ) : (
              <View style={styles.countdownRow}>
                {[
                  { value: timeLeft.days, label: 'DAYS' },
                  { value: timeLeft.hours, label: 'HRS' },
                  { value: timeLeft.minutes, label: 'MIN' },
                  { value: timeLeft.seconds, label: 'SEC' },
                ].map((unit, i) => (
                  <React.Fragment key={unit.label}>
                    {i > 0 && <Text style={styles.countdownColon}>:</Text>}
                    <View style={styles.countdownUnit}>
                      <LinearGradient
                        colors={[Colors.black + '80', Colors.safariGreenDark + 'CC']}
                        style={styles.countdownBox}
                      >
                        <Text style={styles.countdownValue}>
                          {String(unit.value).padStart(2, '0')}
                        </Text>
                      </LinearGradient>
                      <Text style={styles.countdownLabel}>{unit.label}</Text>
                    </View>
                  </React.Fragment>
                ))}
              </View>
            )}

            <Text style={styles.heroDate}>
              {format(DEPARTURE_DATE, 'MMMM d')} – January 27, 2027
            </Text>

            <View style={styles.heroDestRow}>
              <View style={styles.heroDestTag}>
                <Text style={styles.heroDestText}>🇹🇿 Zanzibar</Text>
              </View>
              <Text style={styles.heroDestSep}>✦</Text>
              <View style={styles.heroDestTag}>
                <Text style={styles.heroDestText}>🇿🇦 Cape Town</Text>
              </View>
            </View>

            <Text style={styles.heroSubtitle}>Host: Charmaine Braxton</Text>
          </LinearGradient>
        </View>

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
                colors={[Colors.safariGreen + '30', Colors.cardBg]}
                style={styles.actionGradient}
              >
                <Text style={styles.actionIcon}>{action.icon}</Text>
                <Text style={styles.actionLabel}>{action.label}</Text>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>

        {/* Destination Scenes */}
        <Text style={styles.sectionTitle}>The Journey</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.destRow}
        >
          {DESTINATION_SCENES.map((scene, i) => (
            <View key={i} style={[styles.destCard, i < DESTINATION_SCENES.length - 1 && { marginRight: Spacing.md }]}>
              <LinearGradient
                colors={[scene.color1, scene.color2]}
                style={styles.destCardGrad}
              >
                <Text style={styles.destFlag}>{scene.flag}</Text>
                <Text style={styles.destName}>{scene.name}</Text>
                <Text style={styles.destLocation}>{scene.location}</Text>
                <View style={styles.destNotePill}>
                  <Text style={styles.destNoteText}>{scene.note}</Text>
                </View>
              </LinearGradient>
            </View>
          ))}
        </ScrollView>

        {/* The Group */}
        <View style={styles.groupHeader}>
          <Text style={styles.sectionTitle}>
            The Group{allUsers.length > 0 ? ` · ${allUsers.length}` : ''}
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
          {allUsers.slice(0, 10).map((u) => (
            <View key={u.id} style={styles.travelerChip}>
              <LinearGradient
                colors={['#F0CC50', '#D4AF37', '#A8860A']}
                style={styles.travelerAvatar}
              >
                <Text style={styles.travelerAvatarText}>
                  {(u.full_name || 'T').charAt(0).toUpperCase()}
                </Text>
              </LinearGradient>
              <Text style={styles.travelerName} numberOfLines={1}>
                {u.full_name?.split(' ')[0]}
              </Text>
              {u.role === 'admin' && <Text style={styles.travelerStar}>★</Text>}
            </View>
          ))}
        </ScrollView>

        {/* Admin card */}
        {user?.role === 'admin' && (
          <Card variant="gold" style={styles.adminCard}>
            <Text style={styles.adminTitle}>⚙️ Organizer Controls</Text>
            <TouchableOpacity
              style={styles.adminAction}
              onPress={() => navigation.navigate('Itinerary')}
            >
              <Text style={styles.adminActionText}>📎 Upload Itinerary</Text>
              <Text style={styles.adminChevron}>→</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.adminAction}
              onPress={() => navigation.navigate('Announcements')}
            >
              <Text style={styles.adminActionText}>📢 Post Update</Text>
              <Text style={styles.adminChevron}>→</Text>
            </TouchableOpacity>
          </Card>
        )}

        <View style={{ height: Spacing['2xl'] }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.black },
  topAccent: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 },
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
    marginTop: Spacing.sm,
  },
  greeting: {
    color: Colors.textSecondary,
    fontSize: Typography.sizes.base,
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
    borderWidth: 2,
    borderColor: Colors.gold + '60',
  },
  avatarText: {
    color: Colors.black,
    fontSize: Typography.sizes.xl,
    fontWeight: '900',
  },

  // Hero Card
  heroWrapper: {
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.gold + '40',
    marginBottom: Spacing.xl,
  },
  heroCard: {
    padding: Spacing.xl,
    alignItems: 'center',
    position: 'relative',
  },
  heroTopBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  heroSuperLabel: {
    color: Colors.gold,
    fontSize: Typography.sizes.xs,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  heroTitle: {
    color: Colors.textPrimary,
    fontSize: Typography.sizes['4xl'],
    fontWeight: '900',
    textAlign: 'center',
    lineHeight: 44,
    letterSpacing: -1,
    marginBottom: Spacing.xl,
  },
  liveContainer: {
    marginBottom: Spacing.base,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.gold + '20',
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.gold,
  },
  liveText: {
    color: Colors.gold,
    fontSize: Typography.sizes.xl,
    fontWeight: '800',
    letterSpacing: 1,
  },
  countdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.base,
  },
  countdownUnit: {
    alignItems: 'center',
    gap: 4,
  },
  countdownBox: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.gold + '40',
  },
  countdownValue: {
    color: Colors.gold,
    fontSize: Typography.sizes['2xl'],
    fontWeight: '900',
    letterSpacing: 1,
  },
  countdownLabel: {
    color: Colors.textMuted,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 2,
  },
  countdownColon: {
    color: Colors.gold + '60',
    fontSize: Typography.sizes['2xl'],
    fontWeight: '900',
    marginBottom: 20,
  },
  heroDate: {
    color: Colors.gold,
    fontSize: Typography.sizes.sm,
    fontWeight: '600',
    marginBottom: Spacing.md,
    letterSpacing: 0.5,
  },
  heroDestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  heroDestTag: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.black + '50',
    borderWidth: 1,
    borderColor: Colors.gold + '40',
  },
  heroDestText: {
    color: Colors.textPrimary,
    fontSize: Typography.sizes.sm,
    fontWeight: '600',
  },
  heroDestSep: {
    color: Colors.gold + '80',
    fontSize: Typography.sizes.xs,
  },
  heroSubtitle: {
    color: Colors.textSecondary,
    fontSize: Typography.sizes.xs,
    letterSpacing: 0.5,
    marginTop: Spacing.xs,
  },

  // Quick Actions
  sectionTitle: {
    color: Colors.textPrimary,
    fontSize: Typography.sizes.md,
    fontWeight: '800',
    marginBottom: Spacing.md,
    letterSpacing: 0.5,
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
    gap: Spacing.xs,
  },
  actionIcon: {
    fontSize: 28,
  },
  actionLabel: {
    color: Colors.textSecondary,
    fontSize: Typography.sizes.xs,
    fontWeight: '600',
    textAlign: 'center',
  },

  // Destination scenes
  destRow: {
    paddingBottom: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  destCard: {
    width: width * 0.58,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.borderColor,
  },
  destCardGrad: {
    padding: Spacing.base,
    minHeight: 160,
    justifyContent: 'flex-end',
  },
  destFlag: {
    fontSize: 36,
    marginBottom: Spacing.xs,
  },
  destName: {
    color: Colors.textPrimary,
    fontSize: Typography.sizes.xl,
    fontWeight: '800',
  },
  destLocation: {
    color: Colors.textSecondary,
    fontSize: Typography.sizes.sm,
    marginBottom: Spacing.sm,
  },
  destNotePill: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    backgroundColor: Colors.black + '60',
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.gold + '30',
  },
  destNoteText: {
    color: Colors.gold,
    fontSize: Typography.sizes.xs,
    fontWeight: '600',
  },

  // Group
  groupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  viewAll: {
    color: Colors.gold,
    fontSize: Typography.sizes.sm,
    fontWeight: '700',
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
    borderWidth: 1.5,
    borderColor: Colors.gold + '50',
  },
  travelerAvatarText: {
    color: Colors.black,
    fontSize: Typography.sizes.lg,
    fontWeight: '900',
  },
  travelerName: {
    color: Colors.textSecondary,
    fontSize: Typography.sizes.xs,
    fontWeight: '500',
    textAlign: 'center',
  },
  travelerStar: {
    color: Colors.gold,
    fontSize: 10,
    marginTop: 1,
  },

  // Admin card
  adminCard: {
    marginBottom: Spacing.base,
  },
  adminTitle: {
    color: Colors.gold,
    fontSize: Typography.sizes.base,
    fontWeight: '800',
    marginBottom: Spacing.sm,
    letterSpacing: 0.3,
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
    fontWeight: '700',
  },
});
