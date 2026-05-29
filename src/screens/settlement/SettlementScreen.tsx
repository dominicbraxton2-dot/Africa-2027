import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Typography, Spacing, BorderRadius } from '../../constants/theme';
import { ScreenHeader } from '../../components/common/ScreenHeader';
import { Card } from '../../components/common/Card';
import { GoldButton } from '../../components/common/GoldButton';
import { GoldInput } from '../../components/common/GoldInput';
import { useTripStore } from '../../store/tripStore';
import { useAuthStore } from '../../store/authStore';
import { SettlementMethod } from '../../types';
import { format } from 'date-fns';

const PAYMENT_METHODS: Array<{ key: SettlementMethod; icon: string; label: string; color: string }> = [
  { key: 'cash', icon: '💵', label: 'Cash', color: '#4CAF78' },
  { key: 'zelle', icon: '⚡', label: 'Zelle', color: '#6D2AD2' },
  { key: 'venmo', icon: '💙', label: 'Venmo', color: '#3D95CE' },
  { key: 'paypal', icon: '🅿️', label: 'PayPal', color: '#003087' },
];

interface Props {
  navigation: any;
  route?: any;
}

export function SettlementScreen({ navigation, route }: Props) {
  const { allUsers, settlements, addSettlement, fetchAllUsers } = useTripStore();
  const { user } = useAuthStore();

  const [toUserId, setToUserId] = useState<string>(route?.params?.toUserId || '');
  const [amount, setAmount] = useState<string>(route?.params?.amount ? String(route.params.amount.toFixed(2)) : '');
  const [method, setMethod] = useState<SettlementMethod>('cash');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    fetchAllUsers();
  }, []);

  const toUser = allUsers.find((u) => u.id === toUserId);
  const otherUsers = allUsers.filter((u) => u.id !== user?.id);

  const mySettlements = settlements.filter(
    (s) => s.from_user_id === user?.id || s.to_user_id === user?.id
  );

  const handleSettle = async () => {
    if (!toUserId) return Alert.alert('Required', 'Select who you are paying.');
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      return Alert.alert('Required', 'Enter a valid amount.');
    }

    setSaving(true);
    try {
      await addSettlement({
        from_user_id: user?.id || '',
        to_user_id: toUserId,
        amount: parseFloat(amount),
        method,
        date: new Date().toISOString(),
        notes: notes.trim() || undefined,
      });

      Alert.alert('✅ Payment Recorded', `$${parseFloat(amount).toFixed(2)} paid to ${toUser?.full_name} via ${method}.`, [
        { text: 'Done', onPress: () => navigation.goBack() },
      ]);
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.root}>
      <ScreenHeader
        title="Settlement Center"
        subtitle="Record payments"
        onBack={() => navigation.goBack()}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* Who are you paying? */}
        <Text style={styles.sectionLabel}>PAYING TO</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.usersRow}
          style={styles.usersScroll}
        >
          {otherUsers.map((u) => {
            const selected = u.id === toUserId;
            const initials = (u.full_name || 'T').split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
            return (
              <TouchableOpacity
                key={u.id}
                onPress={() => setToUserId(u.id)}
                style={styles.userOption}
              >
                {selected ? (
                  <LinearGradient
                    colors={[Colors.goldLight, Colors.goldDark]}
                    style={styles.userAvatar}
                  >
                    <Text style={styles.userInitialsSelected}>{initials}</Text>
                  </LinearGradient>
                ) : (
                  <View style={[styles.userAvatar, styles.userAvatarUnselected]}>
                    <Text style={styles.userInitials}>{initials}</Text>
                  </View>
                )}
                <Text style={[styles.userName, selected && styles.userNameSelected]} numberOfLines={1}>
                  {u.full_name?.split(' ')[0]}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Amount */}
        <GoldInput
          label="Amount (USD)"
          placeholder="0.00"
          value={amount}
          onChangeText={setAmount}
          keyboardType="decimal-pad"
          icon="💵"
        />

        {/* Payment Method */}
        <Text style={styles.sectionLabel}>PAYMENT METHOD</Text>
        <View style={styles.methodsGrid}>
          {PAYMENT_METHODS.map((m) => (
            <TouchableOpacity
              key={m.key}
              onPress={() => setMethod(m.key)}
              style={[styles.methodCard, method === m.key && { borderColor: m.color, backgroundColor: m.color + '15' }]}
            >
              <Text style={styles.methodIcon}>{m.icon}</Text>
              <Text style={[styles.methodLabel, method === m.key && { color: m.color }]}>{m.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <GoldInput
          label="Notes (optional)"
          placeholder="e.g. Cape Town dinner from Tuesday"
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={2}
        />

        {/* Summary */}
        {toUser && amount && parseFloat(amount) > 0 && (
          <Card variant="gold" style={styles.summary}>
            <Text style={styles.summaryLabel}>Payment Summary</Text>
            <Text style={styles.summaryLine}>
              You → <Text style={styles.summaryHighlight}>{toUser.full_name}</Text>
            </Text>
            <Text style={styles.summaryLine}>
              Amount: <Text style={styles.summaryHighlight}>${parseFloat(amount).toFixed(2)}</Text>
            </Text>
            <Text style={styles.summaryLine}>
              Via: <Text style={styles.summaryHighlight}>
                {PAYMENT_METHODS.find((m) => m.key === method)?.label}
              </Text>
            </Text>
          </Card>
        )}

        <GoldButton
          title="Record Payment"
          onPress={handleSettle}
          loading={saving}
          style={{ marginTop: Spacing.base }}
          size="lg"
        />

        {/* Payment History */}
        <TouchableOpacity
          style={styles.historyToggle}
          onPress={() => setShowHistory(!showHistory)}
        >
          <Text style={styles.historyToggleText}>
            {showHistory ? '▲' : '▼'} Payment History ({mySettlements.length})
          </Text>
        </TouchableOpacity>

        {showHistory && (
          <View style={styles.historyList}>
            {mySettlements.length === 0 ? (
              <Text style={styles.noHistory}>No payments recorded yet.</Text>
            ) : (
              mySettlements.map((s) => {
                const isFrom = s.from_user_id === user?.id;
                const otherPerson = allUsers.find((u) =>
                  u.id === (isFrom ? s.to_user_id : s.from_user_id)
                )?.full_name || 'Unknown';
                const methodMeta = PAYMENT_METHODS.find((m) => m.key === s.method);

                return (
                  <Card key={s.id} style={styles.historyCard}>
                    <View style={styles.historyRow}>
                      <Text style={styles.historyIcon}>
                        {isFrom ? '↗️' : '↙️'}
                      </Text>
                      <View style={styles.historyInfo}>
                        <Text style={styles.historyLabel}>
                          {isFrom ? `Paid ${otherPerson}` : `Received from ${otherPerson}`}
                        </Text>
                        <Text style={styles.historyDate}>
                          {format(new Date(s.date), 'MMM d, yyyy')} · {methodMeta?.icon} {methodMeta?.label}
                        </Text>
                        {s.notes && <Text style={styles.historyNotes}>{s.notes}</Text>}
                      </View>
                      <Text style={[styles.historyAmount, isFrom ? { color: Colors.error } : { color: Colors.success }]}>
                        {isFrom ? '-' : '+'}${s.amount.toFixed(2)}
                      </Text>
                    </View>
                  </Card>
                );
              })
            )}
          </View>
        )}

        <View style={{ height: Spacing.xl }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.black },
  scroll: {
    padding: Spacing.base,
  },
  sectionLabel: {
    color: Colors.textSecondary,
    fontSize: Typography.sizes.xs,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: Spacing.sm,
    marginTop: Spacing.base,
  },
  usersScroll: {
    marginBottom: Spacing.xl,
  },
  usersRow: {
    gap: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  userOption: {
    alignItems: 'center',
    width: 64,
  },
  userAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  userAvatarUnselected: {
    backgroundColor: Colors.surfaceBg,
    borderWidth: 1,
    borderColor: Colors.borderColor,
  },
  userInitials: {
    color: Colors.textMuted,
    fontSize: Typography.sizes.md,
    fontWeight: '700',
  },
  userInitialsSelected: {
    color: Colors.black,
    fontSize: Typography.sizes.md,
    fontWeight: '800',
  },
  userName: {
    color: Colors.textMuted,
    fontSize: Typography.sizes.xs,
    textAlign: 'center',
  },
  userNameSelected: {
    color: Colors.gold,
    fontWeight: '700',
  },
  methodsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  methodCard: {
    width: '47%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.base,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.borderColor,
    backgroundColor: Colors.surfaceBg,
  },
  methodIcon: { fontSize: 24 },
  methodLabel: {
    color: Colors.textSecondary,
    fontSize: Typography.sizes.md,
    fontWeight: '700',
  },
  summary: {
    gap: Spacing.xs,
    marginVertical: Spacing.base,
  },
  summaryLabel: {
    color: Colors.gold,
    fontSize: Typography.sizes.sm,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.xs,
  },
  summaryLine: {
    color: Colors.textSecondary,
    fontSize: Typography.sizes.base,
  },
  summaryHighlight: {
    color: Colors.textPrimary,
    fontWeight: '700',
  },
  historyToggle: {
    paddingVertical: Spacing.base,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: Colors.borderColor,
    marginTop: Spacing.xl,
  },
  historyToggleText: {
    color: Colors.gold,
    fontSize: Typography.sizes.base,
    fontWeight: '600',
  },
  historyList: {
    gap: Spacing.sm,
  },
  noHistory: {
    color: Colors.textMuted,
    fontSize: Typography.sizes.base,
    textAlign: 'center',
    paddingVertical: Spacing.base,
  },
  historyCard: {},
  historyRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
  },
  historyIcon: { fontSize: 22 },
  historyInfo: { flex: 1 },
  historyLabel: {
    color: Colors.textPrimary,
    fontSize: Typography.sizes.base,
    fontWeight: '600',
    marginBottom: 4,
  },
  historyDate: {
    color: Colors.textMuted,
    fontSize: Typography.sizes.xs,
  },
  historyNotes: {
    color: Colors.textSecondary,
    fontSize: Typography.sizes.xs,
    fontStyle: 'italic',
    marginTop: 4,
  },
  historyAmount: {
    fontSize: Typography.sizes.lg,
    fontWeight: '800',
  },
});
