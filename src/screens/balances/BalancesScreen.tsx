import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Typography, Spacing, BorderRadius } from '../../constants/theme';
import { ScreenHeader } from '../../components/common/ScreenHeader';
import { Card } from '../../components/common/Card';
import { GoldButton } from '../../components/common/GoldButton';
import { EmptyState } from '../../components/common/EmptyState';
import { useTripStore } from '../../store/tripStore';
import { useAuthStore } from '../../store/authStore';
import { Balance } from '../../types';

interface Props {
  navigation: any;
}

export function BalancesScreen({ navigation }: Props) {
  const { balances, fetchBalances, fetchExpenses, fetchAllUsers, expenses, allUsers } = useTripStore();
  const { user } = useAuthStore();

  useEffect(() => {
    const load = async () => {
      await Promise.all([fetchExpenses(), fetchAllUsers()]);
      if (user?.id) fetchBalances(user.id);
    };
    load();
  }, [user?.id]);

  const totalOwed = balances.filter((b) => b.amount > 0).reduce((s, b) => s + b.amount, 0);
  const totalOwe = balances.filter((b) => b.amount < 0).reduce((s, b) => s + Math.abs(b.amount), 0);
  const netBalance = totalOwed - totalOwe;

  const renderBalance = ({ item }: { item: Balance }) => {
    const isPositive = item.amount > 0;
    const initials = item.user_name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();

    return (
      <Card style={styles.balanceCard}>
        <View style={styles.balanceRow}>
          <LinearGradient
            colors={isPositive ? [Colors.success + '40', Colors.success + '20'] : [Colors.error + '40', Colors.error + '20']}
            style={styles.avatar}
          >
            <Text style={styles.avatarText}>{initials}</Text>
          </LinearGradient>
          <View style={styles.balanceInfo}>
            <Text style={styles.balanceName}>{item.user_name}</Text>
            <Text style={[styles.balanceDirection, isPositive ? styles.positiveText : styles.negativeText]}>
              {isPositive ? '→ Owes you' : '← You owe'}
            </Text>
          </View>
          <View style={styles.balanceAmountCol}>
            <Text style={[styles.balanceAmount, isPositive ? styles.positiveText : styles.negativeText]}>
              ${Math.abs(item.amount).toFixed(2)}
            </Text>
            {!isPositive && (
              <GoldButton
                title="Settle"
                onPress={() => navigation.navigate('Settlement', { toUserId: item.user_id, amount: Math.abs(item.amount) })}
                size="sm"
                style={styles.settleBtn}
              />
            )}
          </View>
        </View>
      </Card>
    );
  };

  return (
    <View style={styles.root}>
      <ScreenHeader
        title="Balances"
        subtitle="Who owes whom"
        onBack={() => navigation.goBack()}
      />

      {/* Net summary */}
      <LinearGradient
        colors={['#0A0F00', '#141400']}
        style={styles.netSummary}
      >
        <View style={styles.netItem}>
          <Text style={styles.netLabel}>Owed to You</Text>
          <Text style={[styles.netAmount, styles.positiveText]}>${totalOwed.toFixed(2)}</Text>
        </View>
        <View style={styles.netCenter}>
          <Text style={[
            styles.netBalance,
            { color: netBalance >= 0 ? Colors.success : Colors.error }
          ]}>
            {netBalance >= 0 ? '+' : ''}{netBalance.toFixed(2)}
          </Text>
          <Text style={styles.netCenterLabel}>Net</Text>
        </View>
        <View style={styles.netItem}>
          <Text style={styles.netLabel}>You Owe</Text>
          <Text style={[styles.netAmount, styles.negativeText]}>${totalOwe.toFixed(2)}</Text>
        </View>
      </LinearGradient>

      <FlatList
        data={balances}
        keyExtractor={(item) => item.user_id}
        renderItem={renderBalance}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          balances.length > 0 ? (
            <View style={styles.listHeader}>
              <Text style={styles.listHeaderText}>Outstanding Balances</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Settlement', {})}>
                <Text style={styles.viewSettlements}>Settlements →</Text>
              </TouchableOpacity>
            </View>
          ) : null
        }
        ListEmptyComponent={
          <EmptyState
            icon="⚖️"
            title="All Settled Up!"
            subtitle="No outstanding balances. Everyone is square."
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.black },
  netSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderColor,
  },
  netItem: {
    flex: 1,
    alignItems: 'center',
  },
  netLabel: {
    color: Colors.textMuted,
    fontSize: Typography.sizes.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  netAmount: {
    fontSize: Typography.sizes.xl,
    fontWeight: '800',
  },
  netCenter: {
    flex: 1,
    alignItems: 'center',
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: Colors.borderColor,
    paddingVertical: Spacing.xs,
  },
  netBalance: {
    fontSize: Typography.sizes['2xl'],
    fontWeight: '900',
  },
  netCenterLabel: {
    color: Colors.textMuted,
    fontSize: Typography.sizes.xs,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 2,
  },
  positiveText: { color: Colors.success },
  negativeText: { color: Colors.error },
  list: {
    padding: Spacing.base,
    gap: Spacing.sm,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  listHeaderText: {
    color: Colors.textSecondary,
    fontSize: Typography.sizes.sm,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  viewSettlements: {
    color: Colors.gold,
    fontSize: Typography.sizes.sm,
    fontWeight: '600',
  },
  balanceCard: {},
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: Colors.white,
    fontSize: Typography.sizes.md,
    fontWeight: '800',
  },
  balanceInfo: { flex: 1 },
  balanceName: {
    color: Colors.textPrimary,
    fontSize: Typography.sizes.base,
    fontWeight: '700',
    marginBottom: 4,
  },
  balanceDirection: {
    fontSize: Typography.sizes.sm,
    fontWeight: '600',
  },
  balanceAmountCol: {
    alignItems: 'flex-end',
    gap: Spacing.xs,
  },
  balanceAmount: {
    fontSize: Typography.sizes.xl,
    fontWeight: '900',
  },
  settleBtn: {
    paddingHorizontal: Spacing.md,
  },
});
