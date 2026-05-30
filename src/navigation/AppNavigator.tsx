import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, BorderRadius } from '../constants/theme';
import { useAuthStore } from '../store/authStore';

// Auth
import { LoginScreen } from '../screens/auth/LoginScreen';

// Screens
import { DashboardScreen } from '../screens/dashboard/DashboardScreen';
import { ItineraryScreen } from '../screens/itinerary/ItineraryScreen';
import { EmergencyScreen } from '../screens/emergency/EmergencyScreen';
import { DirectoryScreen } from '../screens/directory/DirectoryScreen';
import { ExpensesScreen } from '../screens/expenses/ExpensesScreen';
import { ReceiptsScreen } from '../screens/receipts/ReceiptsScreen';
import { BalancesScreen } from '../screens/balances/BalancesScreen';
import { SettlementScreen } from '../screens/settlement/SettlementScreen';
import { MemoryScreen } from '../screens/memory/MemoryScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// ── Custom Tab Bar ────────────────────────────────────────────────────────────

const TAB_CONFIG = [
  { name: 'HomeTab', label: 'Home', icon: '🏠' },
  { name: 'ExpensesTab', label: 'Expenses', icon: '💳' },
  { name: 'ReceiptsTab', label: 'Scan', icon: '📷' },
  { name: 'BalancesTab', label: 'Balance', icon: '⚖️' },
  { name: 'MoreTab', label: 'More', icon: '☰' },
];

function CustomTabBar({ state, navigation }: any) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[tabStyles.bar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      <View style={tabStyles.topBorder} />
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
            <View style={[tabStyles.tabInner, isFocused && tabStyles.tabInnerActive]}>
              <Text style={tabStyles.tabIcon}>{config.icon}</Text>
              <Text style={[tabStyles.tabLabel, isFocused && tabStyles.tabLabelActive]}>
                {config.label}
              </Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ── More Menu Screen ──────────────────────────────────────────────────────────

function MoreMenuScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();

  const ITEMS = [
    { icon: '📋', label: 'Itinerary', subtitle: 'Flights, hotels & activity schedules', screen: 'Itinerary' },
    { icon: '🆘', label: 'Emergency Center', subtitle: 'Police, ambulance & embassy contacts', screen: 'Emergency' },
    { icon: '👥', label: 'Traveler Directory', subtitle: 'Group contact list', screen: 'Directory' },
    { icon: '💸', label: 'Settlement Center', subtitle: 'Record payments & settle debts', screen: 'Settlement' },
    { icon: '📸', label: 'Memory Vault', subtitle: 'Photos & moments from the trip', screen: 'Memory' },
  ];

  return (
    <View style={[moreStyles.root, { paddingTop: insets.top }]}>
      <LinearGradient
        colors={[Colors.black, '#0A0800', Colors.black]}
        style={StyleSheet.absoluteFill}
      />
      <View style={moreStyles.topAccent} />

      <View style={moreStyles.header}>
        <Text style={moreStyles.title}>Expedition Hub</Text>
        <Text style={moreStyles.subtitle}>🌍 Zanzibar & Cape Town 2027</Text>
      </View>

      <View style={moreStyles.list}>
        {ITEMS.map((item) => (
          <TouchableOpacity
            key={item.screen}
            style={moreStyles.item}
            onPress={() => navigation.navigate(item.screen)}
            activeOpacity={0.8}
          >
            <View style={moreStyles.iconBg}>
              <Text style={moreStyles.icon}>{item.icon}</Text>
            </View>
            <View style={moreStyles.content}>
              <Text style={moreStyles.label}>{item.label}</Text>
              <Text style={moreStyles.subtitle2}>{item.subtitle}</Text>
            </View>
            <Text style={moreStyles.chevron}>›</Text>
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
      <Tab.Screen name="ExpensesTab" component={ExpensesScreen} />
      <Tab.Screen name="ReceiptsTab" component={ReceiptsScreen} />
      <Tab.Screen name="BalancesTab" component={BalancesScreen} />
      <Tab.Screen name="MoreTab" component={MoreMenuScreen} />
    </Tab.Navigator>
  );
}

// ── Root Navigator ────────────────────────────────────────────────────────────

export function AppNavigator() {
  const { session, isDemoMode } = useAuthStore();
  const isAuthenticated = !!session || isDemoMode;

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <Stack.Screen name="Login" component={LoginScreen} />
        ) : (
          <>
            <Stack.Screen name="Main" component={TabNavigator} />
            <Stack.Screen name="Profile" component={ProfileScreen} />
            <Stack.Screen name="Itinerary" component={ItineraryScreen} />
            <Stack.Screen name="Emergency" component={EmergencyScreen} />
            <Stack.Screen name="Directory" component={DirectoryScreen} />
            <Stack.Screen name="Receipts" component={ReceiptsScreen} />
            <Stack.Screen name="Expenses" component={ExpensesScreen} />
            <Stack.Screen name="Balances" component={BalancesScreen} />
            <Stack.Screen name="Settlement" component={SettlementScreen} />
            <Stack.Screen name="Memory" component={MemoryScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const tabStyles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: Colors.black,
    paddingTop: Spacing.sm,
    borderTopWidth: 0,
  },
  topBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: Colors.gold + '50',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
  },
  tabInner: {
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.md,
    minWidth: 52,
  },
  tabInnerActive: {
    backgroundColor: Colors.gold + '18',
  },
  tabIcon: {
    fontSize: 22,
    marginBottom: 2,
  },
  tabLabel: {
    color: Colors.textMuted,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  tabLabelActive: {
    color: Colors.gold,
  },
});

const moreStyles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.black,
    paddingHorizontal: Spacing.base,
  },
  topAccent: {
    height: 2,
    backgroundColor: Colors.gold,
    marginBottom: Spacing.xl,
  },
  header: {
    marginBottom: Spacing['2xl'],
  },
  title: {
    color: Colors.textPrimary,
    fontSize: Typography.sizes['2xl'],
    fontWeight: '800',
    marginBottom: Spacing.xs,
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: Typography.sizes.base,
  },
  list: {
    gap: Spacing.sm,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardBg,
    borderRadius: BorderRadius.xl,
    padding: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.borderColor,
    gap: Spacing.md,
  },
  iconBg: {
    width: 52,
    height: 52,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.gold + '15',
    borderWidth: 1,
    borderColor: Colors.gold + '30',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: { fontSize: 26 },
  content: { flex: 1 },
  label: {
    color: Colors.textPrimary,
    fontSize: Typography.sizes.md,
    fontWeight: '700',
    marginBottom: 3,
  },
  subtitle2: {
    color: Colors.textSecondary,
    fontSize: Typography.sizes.sm,
  },
  chevron: {
    color: Colors.gold,
    fontSize: 28,
    fontWeight: '300',
    lineHeight: 32,
  },
});
