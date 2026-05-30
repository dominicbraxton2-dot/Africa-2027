import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Typography, Spacing, BorderRadius } from '../../constants/theme';
import { ScreenHeader } from '../../components/common/ScreenHeader';
import { Card } from '../../components/common/Card';
import { GoldButton } from '../../components/common/GoldButton';
import { GoldInput } from '../../components/common/GoldInput';
import { EmptyState } from '../../components/common/EmptyState';
import { useTripStore } from '../../store/tripStore';
import { useAuthStore } from '../../store/authStore';
import { supabase, BUCKETS, isSupabaseConfigured } from '../../lib/supabase';
import { Expense, ExpenseCategory, SplitType, ExpenseParticipant, EXPENSE_CATEGORIES, CURRENCIES } from '../../types';
import { convertToUSD, formatCurrency } from '../../services/currencyService';
import { format } from 'date-fns';

interface Props {
  navigation: any;
  route?: any;
}

// ── Web file-input helper ─────────────────────────────────────────────────────
// Returns { uri: string (object URL), file: File } or null
function webPickImage(capture?: boolean): Promise<{ uri: string; file: File } | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/jpeg,image/jpg,image/png,image/heic,image/heif,image/webp,image/*';
    if (capture) input.capture = 'environment';
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) { resolve(null); return; }
      resolve({ uri: URL.createObjectURL(file), file });
    };
    input.oncancel = () => resolve(null);
    input.click();
  });
}

export function ExpensesScreen({ navigation, route }: Props) {
  const { expenses, fetchExpenses, addExpense, allUsers, fetchAllUsers } = useTripStore();
  const { user } = useAuthStore();
  const [showModal, setShowModal] = useState(route?.params?.openAdd || false);
  const [filterCategory, setFilterCategory] = useState<ExpenseCategory | 'all'>('all');

  // Form state
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [category, setCategory] = useState<ExpenseCategory>('dining');
  const [splitType, setSplitType] = useState<SplitType>('equal');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [customAmounts, setCustomAmounts] = useState<Record<string, string>>({});
  const [customPercentages, setCustomPercentages] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [converting, setConverting] = useState(false);
  const [usdPreview, setUsdPreview] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Receipt state
  const [receiptUri, setReceiptUri] = useState<string | null>(null);
  const [receiptFile, setReceiptFile] = useState<File | null>(null); // web only
  const [receiptError, setReceiptError] = useState('');

  // Full-size viewer
  const [viewReceiptUrl, setViewReceiptUrl] = useState<string | null>(null);

  useEffect(() => {
    fetchExpenses();
    fetchAllUsers();
  }, []);

  useEffect(() => {
    if (route?.params?.receiptData) {
      const { merchant, total, currency: rc } = route.params.receiptData;
      if (merchant) setTitle(merchant);
      if (total) setAmount(String(total));
      if (rc) setCurrency(rc);
      setShowModal(true);
    }
  }, [route?.params]);

  const handleAmountChange = async (val: string) => {
    setAmount(val);
    if (val && !isNaN(parseFloat(val))) {
      setConverting(true);
      const { usdAmount } = await convertToUSD(parseFloat(val), currency);
      setUsdPreview(usdAmount);
      setConverting(false);
    } else {
      setUsdPreview(null);
    }
  };

  const toggleUser = (userId: string) => {
    setSelectedUsers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const resetForm = () => {
    setTitle('');
    setAmount('');
    setCurrency('USD');
    setCategory('dining');
    setSplitType('equal');
    setSelectedUsers([]);
    setCustomAmounts({});
    setCustomPercentages({});
    setNotes('');
    setUsdPreview(null);
    setErrorMsg('');
    setReceiptUri(null);
    setReceiptFile(null);
    setReceiptError('');
  };

  // ── Receipt picking ───────────────────────────────────────────────────────

  const pickReceiptImage = async (source: 'camera' | 'library') => {
    setReceiptError('');
    try {
      if (Platform.OS === 'web') {
        const result = await webPickImage(source === 'camera');
        if (result) {
          setReceiptUri(result.uri);
          setReceiptFile(result.file);
        }
        return;
      }

      // Native: request permissions then launch picker
      if (source === 'camera') {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          setReceiptError('Camera permission is required.');
          return;
        }
        const result = await ImagePicker.launchCameraAsync({
          quality: 0.85,
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
        });
        if (!result.canceled && result.assets[0]) {
          setReceiptUri(result.assets[0].uri);
          setReceiptFile(null);
        }
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          setReceiptError('Gallery permission is required.');
          return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
          quality: 0.85,
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: false,
        });
        if (!result.canceled && result.assets[0]) {
          setReceiptUri(result.assets[0].uri);
          setReceiptFile(null);
        }
      }
    } catch {
      // Camera not available on web — fall back to library file input
      if (Platform.OS === 'web') {
        const result = await webPickImage(false);
        if (result) {
          setReceiptUri(result.uri);
          setReceiptFile(result.file);
        }
      } else {
        setReceiptError('Could not access image source. Please try again.');
      }
    }
  };

  // Upload receipt image to Supabase and return public URL
  const uploadReceiptToStorage = async (): Promise<string | undefined> => {
    if (!receiptUri) return undefined;
    if (!isSupabaseConfigured()) return undefined;

    try {
      let blob: Blob;
      if (receiptFile instanceof File) {
        blob = receiptFile;
      } else {
        const resp = await fetch(receiptUri);
        blob = await resp.blob();
      }

      const ext = blob.type.includes('png') ? 'png' : blob.type.includes('heic') ? 'heic' : 'jpg';
      const path = `${user?.id || 'anon'}/${Date.now()}.${ext}`;

      const { error } = await supabase.storage
        .from(BUCKETS.EXPENSE_RECEIPTS)
        .upload(path, blob, { contentType: blob.type || 'image/jpeg', upsert: false });

      if (error) return undefined;

      const { data: { publicUrl } } = supabase.storage
        .from(BUCKETS.EXPENSE_RECEIPTS)
        .getPublicUrl(path);

      return publicUrl;
    } catch {
      return undefined;
    }
  };

  const handleSave = async () => {
    if (!title.trim()) { setErrorMsg('Please enter an expense title.'); return; }
    if (!amount || isNaN(parseFloat(amount))) { setErrorMsg('Please enter a valid amount.'); return; }
    if (selectedUsers.length === 0) { setErrorMsg('Select at least one person to split with.'); return; }
    setErrorMsg('');

    setSaving(true);
    try {
      const rawAmount = parseFloat(amount);
      const { usdAmount, rate } = await convertToUSD(rawAmount, currency);

      let participants: ExpenseParticipant[] = [];
      if (splitType === 'equal') {
        const perPerson = usdAmount / selectedUsers.length;
        participants = selectedUsers.map((uid) => ({
          profile_id: uid,
          amount: Math.round(perPerson * 100) / 100,
          is_settled: uid === user?.id,
        }));
      } else if (splitType === 'percentage') {
        participants = selectedUsers.map((uid) => {
          const pct = parseFloat(customPercentages[uid] || '0') / 100;
          return {
            profile_id: uid,
            amount: Math.round(usdAmount * pct * 100) / 100,
            percentage: pct * 100,
            is_settled: uid === user?.id,
          };
        });
      } else {
        participants = selectedUsers.map((uid) => ({
          profile_id: uid,
          amount: parseFloat(customAmounts[uid] || '0'),
          is_settled: uid === user?.id,
        }));
      }

      // Upload receipt if present
      const receipt_url = await uploadReceiptToStorage();

      await addExpense({
        title: title.trim(),
        category,
        amount_usd: Math.round(usdAmount * 100) / 100,
        original_amount: rawAmount,
        original_currency: currency,
        exchange_rate: rate,
        paid_by: user?.id || '',
        split_type: splitType,
        receipt_url: receipt_url || (receiptUri ? receiptUri : undefined),
        participants,
        expense_date: new Date().toISOString(),
        notes: notes.trim() || undefined,
      });

      setShowModal(false);
      resetForm();
    } catch {
      setErrorMsg('Failed to save expense. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const filtered = filterCategory === 'all'
    ? expenses
    : expenses.filter((e) => e.category === filterCategory);

  const totalSpent = expenses.reduce((sum, e) => sum + e.amount_usd, 0);

  const renderExpense = ({ item }: { item: Expense }) => {
    const catMeta = EXPENSE_CATEGORIES.find((c) => c.key === item.category)!;
    const paidByName = allUsers.find((u) => u.id === item.paid_by)?.full_name?.split(' ')[0] || 'Someone';
    const myParticipant = item.participants?.find((p) => p.profile_id === user?.id);

    return (
      <Card style={styles.expenseCard}>
        <View style={styles.expenseRow}>
          <View style={[styles.catBadge, { backgroundColor: catMeta.color + '20' }]}>
            <Text style={styles.catIcon}>{catMeta.icon}</Text>
          </View>
          <View style={styles.expenseInfo}>
            <Text style={styles.expenseTitle}>{item.title}</Text>
            <Text style={styles.expenseMeta}>
              {format(new Date(item.expense_date), 'MMM d')} · Paid by {paidByName}
              {item.original_currency !== 'USD' && item.original_amount && (
                <Text style={styles.originalCurrency}>
                  {' '}({formatCurrency(item.original_amount, item.original_currency!)})
                </Text>
              )}
            </Text>
          </View>
          <View style={styles.expenseRight}>
            <View style={styles.expenseAmounts}>
              <Text style={styles.expenseTotal}>${item.amount_usd.toFixed(2)}</Text>
              {myParticipant && (
                <Text style={[styles.mySplit, myParticipant.is_settled && styles.settled]}>
                  {myParticipant.is_settled ? '✓ settled' : `you: $${myParticipant.amount.toFixed(2)}`}
                </Text>
              )}
            </View>
            {item.receipt_url && (
              <TouchableOpacity onPress={() => setViewReceiptUrl(item.receipt_url!)} style={styles.thumbBtn}>
                <Image source={{ uri: item.receipt_url }} style={styles.receiptThumb} />
                <View style={styles.thumbOverlay}>
                  <Text style={styles.thumbIcon}>🧾</Text>
                </View>
              </TouchableOpacity>
            )}
          </View>
        </View>
        {item.participants && item.participants.length > 0 && (
          <View style={styles.splitPreview}>
            {item.participants.slice(0, 4).map((p) => {
              const name = allUsers.find((u) => u.id === p.profile_id)?.full_name?.split(' ')[0] || '?';
              return (
                <View key={p.profile_id} style={styles.splitChip}>
                  <Text style={styles.splitChipText}>{name}</Text>
                </View>
              );
            })}
            {item.participants.length > 4 && (
              <Text style={styles.moreSplits}>+{item.participants.length - 4}</Text>
            )}
          </View>
        )}
      </Card>
    );
  };

  return (
    <View style={styles.root}>
      <ScreenHeader
        title="Group Expenses"
        subtitle="Track & split costs"
        onBack={() => navigation.goBack()}
        rightAction={{ icon: '＋', onPress: () => setShowModal(true) }}
      />

      <LinearGradient colors={[Colors.safariGreenDark + '40', Colors.black]} style={styles.summary}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Total Spent</Text>
          <Text style={styles.summaryValue}>${totalSpent.toFixed(2)}</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Expenses</Text>
          <Text style={styles.summaryValue}>{expenses.length}</Text>
        </View>
        <View style={styles.summaryDivider} />
        <TouchableOpacity style={styles.summaryItem} onPress={() => navigation.navigate('Balances')}>
          <Text style={styles.summaryLabel}>My Balance</Text>
          <Text style={[styles.summaryValue, { color: Colors.gold }]}>View →</Text>
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
        style={styles.filterScroll}
      >
        <TouchableOpacity
          onPress={() => setFilterCategory('all')}
          style={[styles.filterChip, filterCategory === 'all' && styles.filterActive]}
        >
          <Text style={[styles.filterText, filterCategory === 'all' && styles.filterTextActive]}>All</Text>
        </TouchableOpacity>
        {EXPENSE_CATEGORIES.map((c) => (
          <TouchableOpacity
            key={c.key}
            onPress={() => setFilterCategory(c.key)}
            style={[styles.filterChip, filterCategory === c.key && styles.filterActive]}
          >
            <Text style={[styles.filterText, filterCategory === c.key && styles.filterTextActive]}>
              {c.icon} {c.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={renderExpense}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <EmptyState
            icon="💰"
            title="No Expenses Yet"
            subtitle="Add your first expense by tapping ＋ above."
            action={{ label: 'Add Expense', onPress: () => setShowModal(true) }}
          />
        }
      />

      {/* ── Add Expense Modal ─────────────────────────────────────────────── */}
      <Modal visible={showModal} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Expense</Text>
            <TouchableOpacity onPress={() => { setShowModal(false); resetForm(); }}>
              <Text style={styles.modalClose}>✕</Text>
            </TouchableOpacity>
          </View>

          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
            <ScrollView contentContainerStyle={styles.modalScroll} showsVerticalScrollIndicator={false}>

              <GoldInput
                label="Description"
                placeholder="e.g. Dinner at Gold Restaurant"
                value={title}
                onChangeText={(v) => { setTitle(v); setErrorMsg(''); }}
              />

              <Text style={styles.fieldLabel}>AMOUNT</Text>
              <View style={styles.amountRow}>
                <GoldInput
                  placeholder="0.00"
                  value={amount}
                  onChangeText={handleAmountChange}
                  keyboardType="decimal-pad"
                  containerStyle={{ flex: 1, marginBottom: 0 }}
                />
                <View style={styles.currencyPicker}>
                  {Object.keys(CURRENCIES).map((c) => (
                    <TouchableOpacity
                      key={c}
                      onPress={() => { setCurrency(c); if (amount) handleAmountChange(amount); }}
                      style={[styles.currencyChip, currency === c && styles.currencyActive]}
                    >
                      <Text style={[styles.currencyText, currency === c && styles.currencyTextActive]}>{c}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              {usdPreview !== null && currency !== 'USD' && (
                <Text style={styles.usdPreview}>
                  {converting ? 'Converting…' : `≈ $${usdPreview.toFixed(2)} USD`}
                </Text>
              )}

              <Text style={[styles.fieldLabel, { marginTop: Spacing.md }]}>CATEGORY</Text>
              <View style={styles.categoryGrid}>
                {EXPENSE_CATEGORIES.map((c) => (
                  <TouchableOpacity
                    key={c.key}
                    onPress={() => setCategory(c.key)}
                    style={[styles.categoryChip, category === c.key && { backgroundColor: c.color + '30', borderColor: c.color }]}
                  >
                    <Text style={styles.categoryIcon}>{c.icon}</Text>
                    <Text style={[styles.categoryLabel, category === c.key && { color: c.color }]}>{c.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.fieldLabel, { marginTop: Spacing.md }]}>SPLIT AMONG</Text>
              <View style={styles.usersGrid}>
                {allUsers.map((u) => {
                  const selected = selectedUsers.includes(u.id);
                  const initials = (u.full_name || 'T').split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
                  return (
                    <TouchableOpacity
                      key={u.id}
                      onPress={() => { toggleUser(u.id); setErrorMsg(''); }}
                      style={[styles.userChip, selected && styles.userChipSelected]}
                    >
                      <View style={[styles.userChipAvatar, !selected && { backgroundColor: Colors.surfaceBg }]}>
                        {selected ? (
                          <LinearGradient colors={[Colors.goldLight, Colors.goldDark]} style={styles.userChipAvatar}>
                            <Text style={styles.userChipInitialsSelected}>{initials}</Text>
                          </LinearGradient>
                        ) : (
                          <Text style={styles.userChipInitials}>{initials}</Text>
                        )}
                      </View>
                      <Text style={[styles.userChipName, selected && styles.userChipNameSelected]} numberOfLines={1}>
                        {u.full_name?.split(' ')[0]}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {selectedUsers.length > 0 && (
                <>
                  <Text style={[styles.fieldLabel, { marginTop: Spacing.md }]}>SPLIT TYPE</Text>
                  <View style={styles.splitTypeRow}>
                    {(['equal', 'percentage', 'custom'] as SplitType[]).map((t) => (
                      <TouchableOpacity
                        key={t}
                        onPress={() => setSplitType(t)}
                        style={[styles.splitTypeBtn, splitType === t && styles.splitTypeBtnActive]}
                      >
                        <Text style={[styles.splitTypeBtnText, splitType === t && styles.splitTypeBtnTextActive]}>
                          {t === 'equal' ? '⚖️ Equal' : t === 'percentage' ? '% Split' : '✏️ Custom'}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {splitType === 'equal' && usdPreview !== null && (
                    <Text style={styles.equalPreview}>
                      ${(usdPreview / selectedUsers.length).toFixed(2)} per person
                    </Text>
                  )}

                  {splitType === 'custom' && selectedUsers.map((uid) => {
                    const name = allUsers.find((u) => u.id === uid)?.full_name?.split(' ')[0] || uid;
                    return (
                      <GoldInput
                        key={uid}
                        label={`${name}'s amount (USD)`}
                        placeholder="0.00"
                        value={customAmounts[uid] || ''}
                        onChangeText={(val) => setCustomAmounts((prev) => ({ ...prev, [uid]: val }))}
                        keyboardType="decimal-pad"
                      />
                    );
                  })}

                  {splitType === 'percentage' && selectedUsers.map((uid) => {
                    const name = allUsers.find((u) => u.id === uid)?.full_name?.split(' ')[0] || uid;
                    return (
                      <GoldInput
                        key={uid}
                        label={`${name}'s %`}
                        placeholder="0"
                        value={customPercentages[uid] || ''}
                        onChangeText={(val) => setCustomPercentages((prev) => ({ ...prev, [uid]: val }))}
                        keyboardType="decimal-pad"
                        suffix="%"
                      />
                    );
                  })}
                </>
              )}

              {/* ── RECEIPT SECTION ─────────────────────────────────────── */}
              <Text style={[styles.fieldLabel, { marginTop: Spacing.xl }]}>RECEIPT (OPTIONAL)</Text>

              {receiptUri ? (
                // Preview + change/remove
                <View style={styles.receiptPreviewBox}>
                  <Image source={{ uri: receiptUri }} style={styles.receiptPreviewImg} resizeMode="cover" />
                  <LinearGradient
                    colors={['transparent', Colors.black + 'CC']}
                    style={styles.receiptPreviewOverlay}
                  >
                    <View style={styles.receiptPreviewActions}>
                      <TouchableOpacity
                        style={styles.receiptActionBtn}
                        onPress={() => pickReceiptImage('library')}
                      >
                        <Text style={styles.receiptActionText}>🔄 Change</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.receiptActionBtn, styles.receiptRemoveBtn]}
                        onPress={() => { setReceiptUri(null); setReceiptFile(null); }}
                      >
                        <Text style={[styles.receiptActionText, { color: Colors.error }]}>✕ Remove</Text>
                      </TouchableOpacity>
                    </View>
                  </LinearGradient>
                </View>
              ) : (
                // Pick buttons
                <View style={styles.receiptPickRow}>
                  <TouchableOpacity
                    style={styles.receiptPickBtn}
                    onPress={() => pickReceiptImage('camera')}
                    activeOpacity={0.75}
                  >
                    <LinearGradient
                      colors={[Colors.safariGreen + '40', Colors.cardBg]}
                      style={styles.receiptPickGrad}
                    >
                      <Text style={styles.receiptPickIcon}>📷</Text>
                      <Text style={styles.receiptPickLabel}>Take Photo</Text>
                      {Platform.OS === 'web' && (
                        <Text style={styles.receiptPickSub}>camera / file</Text>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.receiptPickBtn}
                    onPress={() => pickReceiptImage('library')}
                    activeOpacity={0.75}
                  >
                    <LinearGradient
                      colors={[Colors.safariGreen + '40', Colors.cardBg]}
                      style={styles.receiptPickGrad}
                    >
                      <Text style={styles.receiptPickIcon}>🖼️</Text>
                      <Text style={styles.receiptPickLabel}>Upload Image</Text>
                      <Text style={styles.receiptPickSub}>JPG · PNG · HEIC</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              )}

              {receiptError ? (
                <Text style={styles.receiptErrorText}>⚠️ {receiptError}</Text>
              ) : null}

              {/* ── NOTES ─────────────────────────────────────────────────── */}
              <GoldInput
                label="Notes (optional)"
                placeholder="Any notes about this expense..."
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={3}
                containerStyle={{ marginTop: Spacing.md }}
              />

              {errorMsg ? (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>⚠️  {errorMsg}</Text>
                </View>
              ) : null}

              <GoldButton
                title={saving ? 'Saving…' : receiptUri ? 'Save Expense + Receipt' : 'Save Expense'}
                onPress={handleSave}
                loading={saving}
                style={{ marginTop: Spacing.sm }}
                size="lg"
              />

              <View style={{ height: Spacing.xl }} />
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* ── Receipt full-size viewer ──────────────────────────────────────── */}
      <Modal visible={!!viewReceiptUrl} animationType="fade" transparent>
        <TouchableOpacity
          style={styles.viewerBg}
          activeOpacity={1}
          onPress={() => setViewReceiptUrl(null)}
        >
          <View style={styles.viewerCard}>
            <View style={styles.viewerHeader}>
              <Text style={styles.viewerTitle}>🧾 Receipt</Text>
              <TouchableOpacity onPress={() => setViewReceiptUrl(null)}>
                <Text style={styles.viewerClose}>✕</Text>
              </TouchableOpacity>
            </View>
            {viewReceiptUrl && (
              <Image
                source={{ uri: viewReceiptUrl }}
                style={styles.viewerImage}
                resizeMode="contain"
              />
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.black },
  summary: {
    flexDirection: 'row',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderColor,
  },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryLabel: {
    color: Colors.textMuted,
    fontSize: Typography.sizes.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  summaryValue: { color: Colors.textPrimary, fontSize: Typography.sizes.lg, fontWeight: '800' },
  summaryDivider: { width: 1, backgroundColor: Colors.borderColor, marginVertical: Spacing.xs },
  filterScroll: { maxHeight: 54, borderBottomWidth: 1, borderBottomColor: Colors.borderColor },
  filterRow: { paddingHorizontal: Spacing.base, paddingVertical: Spacing.sm, gap: Spacing.sm, alignItems: 'center' },
  filterChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.borderColor,
    backgroundColor: Colors.surfaceBg,
  },
  filterActive: { backgroundColor: Colors.gold, borderColor: Colors.gold },
  filterText: { color: Colors.textSecondary, fontSize: Typography.sizes.sm, fontWeight: '600' },
  filterTextActive: { color: Colors.black },
  list: { padding: Spacing.base, gap: Spacing.sm },

  // Expense card
  expenseCard: { gap: Spacing.sm },
  expenseRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  catBadge: { width: 44, height: 44, borderRadius: BorderRadius.md, alignItems: 'center', justifyContent: 'center' },
  catIcon: { fontSize: 22 },
  expenseInfo: { flex: 1 },
  expenseTitle: { color: Colors.textPrimary, fontSize: Typography.sizes.base, fontWeight: '600', marginBottom: 4 },
  expenseMeta: { color: Colors.textMuted, fontSize: Typography.sizes.xs },
  originalCurrency: { color: Colors.textSecondary, fontStyle: 'italic' },
  expenseRight: { alignItems: 'flex-end', gap: Spacing.xs },
  expenseAmounts: { alignItems: 'flex-end' },
  expenseTotal: { color: Colors.textPrimary, fontSize: Typography.sizes.md, fontWeight: '800' },
  mySplit: { color: Colors.warning, fontSize: Typography.sizes.xs, fontWeight: '600', marginTop: 4 },
  settled: { color: Colors.success },

  // Receipt thumbnail on card
  thumbBtn: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.sm,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.gold + '50',
  },
  receiptThumb: {
    width: 44,
    height: 44,
  },
  thumbOverlay: {
    position: 'absolute',
    inset: 0,
    backgroundColor: Colors.black + '40',
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbIcon: { fontSize: 16 },

  splitPreview: { flexDirection: 'row', gap: Spacing.xs, flexWrap: 'wrap', paddingTop: Spacing.xs },
  splitChip: {
    backgroundColor: Colors.surfaceBg,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: Colors.borderColor,
  },
  splitChipText: { color: Colors.textMuted, fontSize: Typography.sizes.xs },
  moreSplits: { color: Colors.textMuted, fontSize: Typography.sizes.xs, alignSelf: 'center' },

  // Modal
  modal: { flex: 1, backgroundColor: Colors.black },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderColor,
  },
  modalTitle: { color: Colors.textPrimary, fontSize: Typography.sizes.xl, fontWeight: '800' },
  modalClose: { color: Colors.textSecondary, fontSize: 22, fontWeight: '600' },
  modalScroll: { padding: Spacing.xl },
  fieldLabel: { color: Colors.textSecondary, fontSize: Typography.sizes.xs, fontWeight: '700', letterSpacing: 1, marginBottom: Spacing.sm },
  amountRow: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'flex-start', marginBottom: Spacing.xs },
  currencyPicker: { gap: Spacing.xs },
  currencyChip: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.borderColor,
    backgroundColor: Colors.surfaceBg,
    minWidth: 48,
    alignItems: 'center',
  },
  currencyActive: { backgroundColor: Colors.gold + '20', borderColor: Colors.gold },
  currencyText: { color: Colors.textMuted, fontSize: Typography.sizes.xs, fontWeight: '700' },
  currencyTextActive: { color: Colors.gold },
  usdPreview: { color: Colors.gold, fontSize: Typography.sizes.sm, fontWeight: '600', marginBottom: Spacing.md },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.sm },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.borderColor,
    backgroundColor: Colors.surfaceBg,
  },
  categoryIcon: { fontSize: 16 },
  categoryLabel: { color: Colors.textSecondary, fontSize: Typography.sizes.sm, fontWeight: '600' },
  usersGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.sm },
  userChip: {
    alignItems: 'center',
    width: 64,
    padding: Spacing.xs,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.borderColor,
    backgroundColor: Colors.surfaceBg,
  },
  userChipSelected: { borderColor: Colors.gold + '60', backgroundColor: Colors.gold + '10' },
  userChipAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surfaceBg,
    marginBottom: 4,
  },
  userChipInitials: { color: Colors.textMuted, fontSize: Typography.sizes.sm, fontWeight: '700' },
  userChipInitialsSelected: { color: Colors.black, fontSize: Typography.sizes.sm, fontWeight: '800' },
  userChipName: { color: Colors.textMuted, fontSize: Typography.sizes.xs, textAlign: 'center' },
  userChipNameSelected: { color: Colors.gold, fontWeight: '600' },
  splitTypeRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },
  splitTypeBtn: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.borderColor,
    backgroundColor: Colors.surfaceBg,
  },
  splitTypeBtnActive: { backgroundColor: Colors.gold + '20', borderColor: Colors.gold },
  splitTypeBtnText: { color: Colors.textMuted, fontSize: Typography.sizes.xs, fontWeight: '700' },
  splitTypeBtnTextActive: { color: Colors.gold },
  equalPreview: {
    color: Colors.gold,
    fontSize: Typography.sizes.base,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: Spacing.base,
  },

  // Receipt section in form
  receiptPreviewBox: {
    height: 200,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.gold + '40',
    marginBottom: Spacing.sm,
    position: 'relative',
  },
  receiptPreviewImg: {
    width: '100%',
    height: '100%',
  },
  receiptPreviewOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 72,
    justifyContent: 'flex-end',
    padding: Spacing.md,
  },
  receiptPreviewActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  receiptActionBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    backgroundColor: Colors.black + 'CC',
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.borderColor,
  },
  receiptRemoveBtn: {
    borderColor: Colors.error + '50',
  },
  receiptActionText: {
    color: Colors.textPrimary,
    fontSize: Typography.sizes.sm,
    fontWeight: '600',
  },
  receiptPickRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  receiptPickBtn: {
    flex: 1,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.borderColor,
  },
  receiptPickGrad: {
    padding: Spacing.base,
    alignItems: 'center',
    minHeight: 90,
    justifyContent: 'center',
    gap: Spacing.xs,
  },
  receiptPickIcon: { fontSize: 28 },
  receiptPickLabel: {
    color: Colors.textPrimary,
    fontSize: Typography.sizes.sm,
    fontWeight: '700',
    textAlign: 'center',
  },
  receiptPickSub: {
    color: Colors.textMuted,
    fontSize: Typography.sizes.xs,
    textAlign: 'center',
  },
  receiptErrorText: {
    color: Colors.error,
    fontSize: Typography.sizes.sm,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },

  errorBox: {
    backgroundColor: Colors.error + '18',
    borderWidth: 1,
    borderColor: Colors.error + '60',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    marginTop: Spacing.sm,
  },
  errorText: { color: Colors.error, fontSize: Typography.sizes.sm, fontWeight: '600', lineHeight: 20 },

  // Full-size receipt viewer
  viewerBg: {
    flex: 1,
    backgroundColor: Colors.black + 'E8',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  viewerCard: {
    width: '100%',
    maxWidth: 480,
    backgroundColor: Colors.cardBg,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.gold + '40',
    overflow: 'hidden',
  },
  viewerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderColor,
  },
  viewerTitle: {
    color: Colors.gold,
    fontSize: Typography.sizes.md,
    fontWeight: '800',
  },
  viewerClose: {
    color: Colors.textSecondary,
    fontSize: 22,
    fontWeight: '600',
    paddingHorizontal: Spacing.sm,
  },
  viewerImage: {
    width: '100%',
    height: 500,
  },
});
