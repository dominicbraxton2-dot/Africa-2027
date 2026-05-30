import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { format, parseISO } from 'date-fns';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Typography, Spacing, BorderRadius } from '../../constants/theme';
import { GoldButton } from '../../components/common/GoldButton';
import { GoldInput } from '../../components/common/GoldInput';
import { useCalendarStore } from '../../store/calendarStore';
import { useAuthStore } from '../../store/authStore';
import { ParsedEvent } from '../../services/itineraryParser';
import { EventCategory, EVENT_CATEGORIES } from '../../types';

const TRIP_DAYS: string[] = Array.from({ length: 14 }, (_, i) => {
  const d = new Date('2027-01-14');
  d.setDate(14 + i);
  return d.toISOString().split('T')[0];
});

interface DraftEvent extends ParsedEvent {
  _key: string;
  _selected: boolean;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  parsedEvents: ParsedEvent[];
  sourceDocId?: string;
  errorType: 'NO_API_KEY' | 'PARSE_FAILED' | 'FETCH_FAILED' | null;
  onSaved: () => void;
}

function genKey() { return `k-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`; }

export function ScanReviewModal({ visible, onClose, parsedEvents, sourceDocId, errorType, onSaved }: Props) {
  const { addEvents } = useCalendarStore();
  const { user } = useAuthStore();

  const [drafts, setDrafts] = useState<DraftEvent[]>([]);
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      setDrafts(parsedEvents.map((e) => ({ ...e, _key: genKey(), _selected: true })));
      setExpandedKey(null);
    }
  }, [visible, parsedEvents]);

  const updateDraft = (key: string, patch: Partial<DraftEvent>) => {
    setDrafts((prev) => prev.map((d) => (d._key === key ? { ...d, ...patch } : d)));
  };

  const addBlankDraft = () => {
    const blank: DraftEvent = {
      _key: genKey(),
      _selected: true,
      title: '',
      event_date: TRIP_DAYS[0],
      category: 'general',
    };
    setDrafts((prev) => [...prev, blank]);
    setExpandedKey(blank._key);
  };

  const removeDraft = (key: string) => {
    setDrafts((prev) => prev.filter((d) => d._key !== key));
    if (expandedKey === key) setExpandedKey(null);
  };

  const handleSave = async () => {
    const selected = drafts.filter((d) => d._selected && d.title.trim());
    if (selected.length === 0) { onClose(); return; }
    setSaving(true);
    try {
      await addEvents(selected.map(({ _key, _selected, ...e }) => ({
        ...e,
        title: e.title.trim(),
        source_document_id: sourceDocId,
        created_by: user?.id,
      })));
      onSaved();
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const selectedCount = drafts.filter((d) => d._selected && d.title.trim()).length;

  const errorBanner = () => {
    if (!errorType) return null;
    const msg =
      errorType === 'NO_API_KEY'
        ? 'Automatic scanning is not configured. Add EXPO_PUBLIC_ANTHROPIC_API_KEY to enable AI parsing. You can add events manually below.'
        : 'We could not automatically read this itinerary. You can add events manually below.';
    return (
      <View style={styles.errorBanner}>
        <Text style={styles.errorBannerIcon}>ℹ️</Text>
        <Text style={styles.errorBannerText}>{msg}</Text>
      </View>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.root}>
        {/* Header */}
        <LinearGradient
          colors={[Colors.safariGreenDark, Colors.black]}
          style={styles.header}
        >
          <View>
            <Text style={styles.headerTitle}>Review Extracted Events</Text>
            <Text style={styles.headerSub}>
              {drafts.length > 0
                ? `${drafts.length} event${drafts.length !== 1 ? 's' : ''} found · ${selectedCount} selected`
                : 'No events extracted — add manually'}
            </Text>
          </View>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.closeBtn}>✕</Text>
          </TouchableOpacity>
        </LinearGradient>

        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

            {errorBanner()}

            {drafts.length === 0 && !errorType && (
              <View style={styles.emptyParsed}>
                <Text style={styles.emptyParsedIcon}>📭</Text>
                <Text style={styles.emptyParsedText}>No events found in this document.</Text>
                <Text style={styles.emptyParsedSub}>Add them manually using the button below.</Text>
              </View>
            )}

            {drafts.map((draft, idx) => {
              const meta = EVENT_CATEGORIES.find((c) => c.key === draft.category) ?? EVENT_CATEGORIES[5];
              const isExpanded = expandedKey === draft._key;

              return (
                <View key={draft._key} style={[styles.draftCard, draft._selected && styles.draftCardSelected]}>
                  {/* Collapsed header row */}
                  <TouchableOpacity
                    style={styles.draftHeader}
                    onPress={() => setExpandedKey(isExpanded ? null : draft._key)}
                    activeOpacity={0.8}
                  >
                    <TouchableOpacity
                      style={[styles.checkbox, draft._selected && styles.checkboxChecked]}
                      onPress={() => updateDraft(draft._key, { _selected: !draft._selected })}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      {draft._selected && <Text style={styles.checkmark}>✓</Text>}
                    </TouchableOpacity>

                    <View style={[styles.catDot, { backgroundColor: meta.color }]} />

                    <View style={styles.draftInfo}>
                      <Text style={styles.draftTitle} numberOfLines={1}>
                        {draft.title || <Text style={styles.draftTitlePlaceholder}>Untitled event</Text>}
                      </Text>
                      <Text style={styles.draftMeta}>
                        {draft.event_date ? format(parseISO(draft.event_date), 'MMM d') : '—'}
                        {draft.start_time ? ` · ${draft.start_time}` : ''}
                        {draft.location ? ` · ${draft.location}` : ''}
                      </Text>
                    </View>

                    <View style={styles.draftActions}>
                      <Text style={styles.draftExpand}>{isExpanded ? '▲' : '▼'}</Text>
                      <TouchableOpacity
                        onPress={() => removeDraft(draft._key)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Text style={styles.draftRemove}>✕</Text>
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>

                  {/* Expanded edit form */}
                  {isExpanded && (
                    <View style={styles.editForm}>
                      <GoldInput
                        label="Title"
                        placeholder="Event name"
                        value={draft.title}
                        onChangeText={(v) => updateDraft(draft._key, { title: v })}
                      />

                      {/* Date chips */}
                      <Text style={styles.miniLabel}>DATE</Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dateDayScroll}>
                        {TRIP_DAYS.map((d) => {
                          const sel = d === draft.event_date;
                          return (
                            <TouchableOpacity
                              key={d}
                              onPress={() => updateDraft(draft._key, { event_date: d })}
                              style={[styles.miniDayChip, sel && styles.miniDayChipActive]}
                            >
                              <Text style={[styles.miniDayText, sel && styles.miniDayTextActive]}>
                                {format(parseISO(d), 'MMM d')}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </ScrollView>

                      {/* Time row */}
                      <View style={styles.timeRow}>
                        <GoldInput
                          label="Start"
                          placeholder="09:00"
                          value={draft.start_time || ''}
                          onChangeText={(v) => updateDraft(draft._key, { start_time: v || undefined })}
                          containerStyle={{ flex: 1 }}
                        />
                        <View style={styles.timeSep}><Text style={styles.timeSepText}>→</Text></View>
                        <GoldInput
                          label="End"
                          placeholder="14:00"
                          value={draft.end_time || ''}
                          onChangeText={(v) => updateDraft(draft._key, { end_time: v || undefined })}
                          containerStyle={{ flex: 1 }}
                        />
                      </View>

                      <GoldInput
                        label="Location (optional)"
                        placeholder="Place name"
                        value={draft.location || ''}
                        onChangeText={(v) => updateDraft(draft._key, { location: v || undefined })}
                      />

                      {/* Category chips */}
                      <Text style={styles.miniLabel}>CATEGORY</Text>
                      <View style={styles.miniCatRow}>
                        {EVENT_CATEGORIES.map((c) => (
                          <TouchableOpacity
                            key={c.key}
                            onPress={() => updateDraft(draft._key, { category: c.key })}
                            style={[
                              styles.miniCatChip,
                              draft.category === c.key && { borderColor: c.color, backgroundColor: c.color + '25' },
                            ]}
                          >
                            <Text style={styles.miniCatIcon}>{c.icon}</Text>
                            <Text style={[styles.miniCatLabel, draft.category === c.key && { color: c.color }]}>
                              {c.label}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>

                      <GoldInput
                        label="Notes (optional)"
                        placeholder="Additional details..."
                        value={draft.notes || ''}
                        onChangeText={(v) => updateDraft(draft._key, { notes: v || undefined })}
                        multiline
                        numberOfLines={2}
                      />
                    </View>
                  )}
                </View>
              );
            })}

            {/* Add event button */}
            <TouchableOpacity style={styles.addManualBtn} onPress={addBlankDraft}>
              <Text style={styles.addManualText}>＋ Add Event Manually</Text>
            </TouchableOpacity>

            <View style={{ height: Spacing['2xl'] }} />
          </ScrollView>
        </KeyboardAvoidingView>

        {/* Footer */}
        <View style={styles.footer}>
          <GoldButton
            title={saving ? 'Saving…' : selectedCount > 0 ? `Save ${selectedCount} Event${selectedCount !== 1 ? 's' : ''}` : 'Done'}
            onPress={handleSave}
            loading={saving}
            size="lg"
          />
          <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.black },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: Spacing.xl,
    paddingTop: Spacing['2xl'],
  },
  headerTitle: { color: Colors.gold, fontSize: Typography.sizes.xl, fontWeight: '800', marginBottom: 4 },
  headerSub: { color: Colors.textSecondary, fontSize: Typography.sizes.sm },
  closeBtn: { color: Colors.textSecondary, fontSize: 22, fontWeight: '600', marginTop: 4 },

  scroll: { padding: Spacing.base, gap: Spacing.sm },

  errorBanner: {
    flexDirection: 'row',
    gap: Spacing.sm,
    backgroundColor: Colors.amber + '15',
    borderWidth: 1,
    borderColor: Colors.amber + '40',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  errorBannerIcon: { fontSize: 18 },
  errorBannerText: { flex: 1, color: Colors.amber, fontSize: Typography.sizes.sm, lineHeight: 20 },

  emptyParsed: { alignItems: 'center', paddingVertical: Spacing.xl, gap: Spacing.sm },
  emptyParsedIcon: { fontSize: 40 },
  emptyParsedText: { color: Colors.textPrimary, fontSize: Typography.sizes.base, fontWeight: '700' },
  emptyParsedSub: { color: Colors.textSecondary, fontSize: Typography.sizes.sm },

  draftCard: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.borderColor,
    backgroundColor: Colors.cardBg,
    overflow: 'hidden',
  },
  draftCardSelected: { borderColor: Colors.gold + '40' },

  draftHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.borderColor,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: { backgroundColor: Colors.gold, borderColor: Colors.gold },
  checkmark: { color: Colors.black, fontSize: 12, fontWeight: '900' },
  catDot: { width: 8, height: 8, borderRadius: 4 },
  draftInfo: { flex: 1 },
  draftTitle: { color: Colors.textPrimary, fontSize: Typography.sizes.base, fontWeight: '700' },
  draftTitlePlaceholder: { color: Colors.textMuted, fontStyle: 'italic', fontWeight: '400' },
  draftMeta: { color: Colors.textMuted, fontSize: Typography.sizes.xs, marginTop: 2 },
  draftActions: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  draftExpand: { color: Colors.textMuted, fontSize: Typography.sizes.xs },
  draftRemove: { color: Colors.error, fontSize: 18, fontWeight: '700', lineHeight: 22 },

  editForm: {
    padding: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.borderColor,
    backgroundColor: Colors.surfaceBg,
    gap: 2,
  },

  miniLabel: {
    color: Colors.textSecondary,
    fontSize: Typography.sizes.xs,
    fontWeight: '700',
    letterSpacing: 1,
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  dateDayScroll: { gap: Spacing.xs, paddingBottom: Spacing.xs },
  miniDayChip: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.borderColor,
    backgroundColor: Colors.cardBg,
  },
  miniDayChipActive: { borderColor: Colors.gold, backgroundColor: Colors.gold + '20' },
  miniDayText: { color: Colors.textSecondary, fontSize: Typography.sizes.xs, fontWeight: '600' },
  miniDayTextActive: { color: Colors.gold },

  timeRow: { flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.xs },
  timeSep: { paddingBottom: Spacing.base + 2 },
  timeSepText: { color: Colors.textMuted, fontSize: Typography.sizes.sm },

  miniCatRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs, marginBottom: Spacing.xs },
  miniCatChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.borderColor,
    backgroundColor: Colors.cardBg,
  },
  miniCatIcon: { fontSize: 12 },
  miniCatLabel: { color: Colors.textSecondary, fontSize: Typography.sizes.xs, fontWeight: '600' },

  addManualBtn: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: Colors.gold + '50',
    marginTop: Spacing.xs,
  },
  addManualText: { color: Colors.gold, fontSize: Typography.sizes.base, fontWeight: '700' },

  footer: {
    padding: Spacing.base,
    paddingBottom: Spacing.xl,
    borderTopWidth: 1,
    borderTopColor: Colors.borderColor,
    gap: Spacing.sm,
    backgroundColor: Colors.black,
  },
  cancelBtn: { alignItems: 'center', paddingVertical: Spacing.sm },
  cancelBtnText: { color: Colors.textSecondary, fontSize: Typography.sizes.base, fontWeight: '600' },
});
