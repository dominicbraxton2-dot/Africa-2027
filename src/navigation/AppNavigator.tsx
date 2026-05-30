import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, BorderRadius } from '../constants/theme';
import { useAuthStore } from '../store/authStore';

// Auth
import { LoginScreen } from '../screens/auth/LoginScreen';
import { ProfileSetupScreen } from '../screens/auth/ProfileSetupScreen';

// Screens
import { DashboardScreen } from '../screens/dashboard/DashboardScreen';
import { ItineraryScreen } from '../screens/itinerary/ItineraryScreen';
import { DirectoryScreen } from '../screens/directory/DirectoryScreen';
import { ExpensesScreen } from '../screens/expenses/ExpensesScreen';
import { ReceiptsScreen } from '../screens/receipts/ReceiptsScreen';
import { BalancesScreen } from '../screens/balances/BalancesScreen';
import { SettlementScreen } from '../screens/settlement/SettlementScreen';
import { MemoryScreen } from '../screens/memory/MemoryScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { AnnouncementsScreen } from '../screens/announcements/AnnouncementsScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// ── Custom Tab Bar ────────────────────────────────────────────────────────────

const TAB_CONFIG = [
  { name: 'HomeTab', label: 'Expedition', icon: '🏝' },
  { name: 'ItineraryTab', label: 'Itinerary', icon: '📅' },
  { name: 'ExpensesTab', label: 'Expenses', icon: '💰' },
  { name: 'ReceiptsTab', label: 'Receipts', icon: '📸' },
  { name: 'HubTab', label: 'Hub', icon: '☰' },
];

function CustomTabBar({ state, navigation }: any) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[tabStyles.barWrapper, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      <LinearGradient
        colors={[Colors.safariGreenDark, Colors.black]}
        style={StyleSheet.absoluteFill}
      />
      <View style={tabStyles.topBorder}>
        <LinearGradient
          colors={['transparent', Colors.gold + '70', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ height: 1 }}
        />
      </View>
      <View style={tabStyles.bar}>
        {state.routes.map((route: any, index: number) => {
          const config = TAB_CONFIG.find((t) => t.name === route.name) || TAB_CONFIG[0];
          const isFocused = state.index === index;

          return (
            <TouchableOpacity
              key={route.key}
              style={tabStyles.tab}
              onPress={() => { if (!isFocused) navigation.navigate(route.name); }}
              activeOpacity={0.7}
            >
              {isFocused && (
                <LinearGradient
                  colors={[Colors.gold + '20', 'transparent']}
                  style={tabStyles.activeBg}
                />
              )}
              <Text style={tabStyles.tabIcon}>{config.icon}</Text>
              <Text style={[tabStyles.tabLabel, isFocused && tabStyles.tabLabelActive]}>
                {config.label}
              </Text>
              {isFocused && <View style={tabStyles.activeDot} />}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

// ── Hub / More Menu ───────────────────────────────────────────────────────────

function HubScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();

  const ITEMS = [
    { icon: '📢', label: 'Expedition Updates', subtitle: 'Announcements, alerts & trip notices', screen: 'Announcements', accent: Colors.amber },
    { icon: '👥', label: 'Traveler Directory', subtitle: 'Contact the group', screen: 'Directory', accent: Colors.teal },
    { icon: '⚖️', label: 'Balances', subtitle: 'Who owes whom', screen: 'BalancesTab', accent: Colors.safariGreenLight },
    { icon: '💸', label: 'Settlement Center', subtitle: 'Record payments & settle debts', screen: 'Settlement', accent: Colors.gold },
    { icon: '🖼️', label: 'Memory Vault', subtitle: 'Photos & moments from the trip', screen: 'Memory', accent: Colors.teal },
  ];

  return (
    <View style={[hubStyles.root, { paddingTop: insets.top }]}>
      <LinearGradient
        colors={[Colors.safariGreenDark, Colors.black, '#0A0800']}
        locations={[0, 0.3, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* Gold accent top */}
      <View style={hubStyles.topAccent}>
        <LinearGradient
          colors={['transparent', Colors.gold + '80', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ height: 3 }}
        />
      </View>

      <View style={hubStyles.header}>
        <Text style={hubStyles.title}>Expedition Hub</Text>
        <Text style={hubStyles.subtitle}>🌍 Zanzibar & Cape Town 2027</Text>
        <View style={hubStyles.divider}>
          <LinearGradient
            colors={['transparent', Colors.gold + '60', 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ height: 1 }}
          />
        </View>
      </View>

      <View style={hubStyles.list}>
        {ITEMS.map((item) => (
          <TouchableOpacity
            key={item.screen}
            style={hubStyles.item}
            onPress={() => navigation.navigate(item.screen)}
            activeOpacity={0.75}
          >
            <LinearGradient
              colors={[Colors.safariGreen + '20', Colors.cardBg]}
              style={hubStyles.itemGrad}
            >
              <View style={[hubStyles.iconBg, { backgroundColor: item.accent + '20', borderColor: item.accent + '40' }]}>
                <Text style={hubStyles.icon}>{item.icon}</Text>
              </View>
              <View style={hubStyles.content}>
                <Text style={hubStyles.label}>{item.label}</Text>
                <Text style={hubStyles.itemSubtitle}>{item.subtitle}</Text>
              </View>
              <Text style={[hubStyles.chevron, { color: item.accent }]}>›</Text>
            </LinearGradient>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

// ── Tab Navigator ─────────────────────────────────────────────────────────────

function TabNavigator() {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="HomeTab" component={DashboardScreen} />
      <Tab.Screen name="ItineraryTab" component={ItineraryScreen} />
      <Tab.Screen name="ExpensesTab" component={ExpensesScreen} />
      <Tab.Screen name="ReceiptsTab" component={ReceiptsScreen} />
      <Tab.Screen name="HubTab" component={HubScreen} />
    </Tab.Navigator>
  );
}

// ── Root Navigator ────────────────────────────────────────────────────────────

export function AppNavigator() {
  const { isAuthenticated, needsProfileSetup } = useAuthStore();

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <Stack.Screen name="Login" component={LoginScreen} />
        ) : needsProfileSetup ? (
          <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
        ) : (
          <>
            <Stack.Screen name="Main" component={TabNavigator} />
            <Stack.Screen name="Profile" component={ProfileScreen} />
            <Stack.Screen name="Itinerary" component={ItineraryScreen} />
            <Stack.Screen name="Directory" component={DirectoryScreen} />
            <Stack.Screen name="Receipts" component={ReceiptsScreen} />
            <Stack.Screen name="Expenses" component={ExpensesScreen} />
            <Stack.Screen name="Balances" component={BalancesScreen} />
            <Stack.Screen name="BalancesTab" component={BalancesScreen} />
            <Stack.Screen name="Settlement" component={SettlementScreen} />
            <Stack.Screen name="Memory" component={MemoryScreen} />
            <Stack.Screen name="Announcements" component={AnnouncementsScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const tabStyles = StyleSheet.create({
  barWrapper: {
    position: 'relative',
    paddingTop: Spacing.xs,
  },
  topBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  bar: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.xs,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    position: 'relative',
  },
  activeBg: {
    position: 'absolute',
    top: 0,
    left: 4,
    right: 4,
    bottom: 0,
    borderRadius: BorderRadius.md,
  },
  tabIcon: {
    fontSize: 22,
    marginBottom: 2,
  },
  tabLabel: {
    color: Colors.textMuted,
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  tabLabelActive: {
    color: Colors.gold,
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.gold,
    marginTop: 2,
  },
});

const hubStyles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.black,
    paddingHorizontal: Spacing.base,
  },
  topAccent: {
    marginBottom: Spacing.base,
  },
  header: {
    marginBottom: Spacing.xl,
    paddingTop: Spacing.base,
  },
  title: {
    color: Colors.gold,
    fontSize: Typography.sizes['2xl'],
    fontWeight: '900',
    marginBottom: Spacing.xs,
    letterSpacing: 0.5,
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: Typography.sizes.base,
    marginBottom: Spacing.base,
  },
  divider: {
    marginTop: Spacing.xs,
  },
  list: {
    gap: Spacing.sm,
  },
  item: {
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.borderColor,
  },
  itemGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.base,
    gap: Spacing.md,
  },
  iconBg: {
    width: 52,
    height: 52,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: { fontSize: 24 },
  content: { flex: 1 },
  label: {
    color: Colors.textPrimary,
    fontSize: Typography.sizes.md,
    fontWeight: '700',
    marginBottom: 3,
  },
  itemSubtitle: {
    color: Colors.textSecondary,
    fontSize: Typography.sizes.sm,
  },
  chevron: {
    fontSize: 28,
    fontWeight: '300',
    lineHeight: 32,
  },
});
