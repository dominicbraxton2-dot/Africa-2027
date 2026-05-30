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
import { Colors, Typography, Spacing, BorderRadius } from '../../constants/theme';
import { GoldButton } from '../../components/common/GoldButton';
import { GoldInput } from '../../components/common/GoldInput';
import { useCalendarStore } from '../../store/calendarStore';
import { useAuthStore } from '../../store/authStore';
import { ItineraryEvent, EventCategory, EVENT_CATEGORIES } from '../../types';

// 14 trip days Jan 14–27 2027
const TRIP_DAYS: string[] = Array.from({ length: 14 }, (_, i) => {
  const d = new Date('2027-01-14');
  d.setDate(14 + i);
  return d.toISOString().split('T')[0];
});

interface Props {
  visible: boolean;
  onClose: () => void;
  editingEvent?: ItineraryEvent | null;
  defaultDate?: string;
}

export function EventFormModal({ visible, onClose, editingEvent, defaultDate }: Props) {
  const { addEvent, updateEvent, deleteEvent } = useCalendarStore();
  const { user } = useAuthStore();

  const isEdit = !!editingEvent;
  const initial = editingEvent ?? null;

  const [title, setTitle] = useState('');
  const [date, setDate] = useState(defaultDate || TRIP_DAYS[0]);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [location, setLocation] = useState('');
  const [category, setCategory] = useState<EventCategory>('general');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (visible) {
      if (initial) {
        setTitle(initial.title);
        setDate(initial.event_date);
        setStartTime(initial.start_time || '');
        setEndTime(initial.end_time || '');
        setLocation(initial.location || '');
        setCategory(initial.category);
        setNotes(initial.notes || '');
      } else {
        setTitle('');
        setDate(defaultDate || TRIP_DAYS[0]);
        setStartTime('');
        setEndTime('');
        setLocation('');
        setCategory('general');
        setNotes('');
      }
      setError('');
      setConfirmDelete(false);
    }
  }, [visible]);

  const handleSave = async () => {
    if (!title.trim()) { setError('Title is required.'); return; }
    if (!date) { setError('Date is required.'); return; }
    setError('');
    setSaving(true);
    try {
      const data = {
        title: title.trim(),
        event_date: date,
        start_time: startTime.trim() || undefined,
        end_time: endTime.trim() || undefined,
        location: location.trim() || undefined,
        category,
        notes: notes.trim() || undefined,
        created_by: user?.id,
      };
      if (isEdit && editingEvent) {
        await updateEvent(editingEvent.id, data);
      } else {
        await addEvent(data);
      }
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!editingEvent) return;
    await deleteEvent(editingEvent.id);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.root}>
        <View style={styles.header}>
          <Text style={styles.title}>{isEdit ? 'Edit Event' : 'Add Event'}</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.closeBtn}>✕</Text>
          </TouchableOpacity>
        </View>

        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

            <GoldInput
              label="Event Title"
              placeholder="e.g. Flight to Zanzibar"
              value={title}
              onChangeText={(v) => { setTitle(v); setError(''); }}
              icon="📝"
            />

            {/* Date selector */}
            <Text style={styles.fieldLabel}>DATE</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dayScroll}>
              {TRIP_DAYS.map((d) => {
                const sel = d === date;
                const label = format(parseISO(d), 'MMM d');
                const dow = format(parseISO(d), 'EEE').toUpperCase();
                return (
                  <TouchableOpacity
                    key={d}
                    onPress={() => setDate(d)}
                    style={[styles.dayChip, sel && styles.dayChipActive]}
                  >
                    <Text style={[styles.dayDow, sel && styles.dayDowActive]}>{dow}</Text>
                    <Text style={[styles.dayNum, sel && styles.dayNumActive]}>{label.split(' ')[1]}</Text>
                    <Text style={[styles.dayMonth, sel && styles.dayMonthActive]}>{label.split(' ')[0]}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Time row */}
            <View style={styles.timeRow}>
              <GoldInput
                label="Start Time"
                placeholder="09:00"
                value={startTime}
                onChangeText={setStartTime}
                containerStyle={{ flex: 1 }}
              />
              <View style={styles.timeSep}><Text style={styles.timeSepText}>→</Text></View>
              <GoldInput
                label="End Time"
                placeholder="14:30"
                value={endTime}
                onChangeText={setEndTime}
                containerStyle={{ flex: 1 }}
              />
            </View>

            <GoldInput
              label="Location (optional)"
              placeholder="e.g. Julius Nyerere International"
              value={location}
              onChangeText={setLocation}
              icon="📍"
            />

            {/* Category */}
            <Text style={styles.fieldLabel}>CATEGORY</Text>
            <View style={styles.catGrid}>
              {EVENT_CATEGORIES.map((c) => (
                <TouchableOpacity
                  key={c.key}
                  onPress={() => setCategory(c.key)}
                  style={[
                    styles.catChip,
                    category === c.key && { borderColor: c.color, backgroundColor: c.color + '20' },
                  ]}
                >
                  <Text style={styles.catIcon}>{c.icon}</Text>
                  <Text style={[styles.catLabel, category === c.key && { color: c.color }]}>{c.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <GoldInput
              label="Notes (optional)"
              placeholder="Any extra details..."
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
            />

            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>⚠️  {error}</Text>
              </View>
            ) : null}

            <GoldButton
              title={saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Add to Calendar'}
              onPress={handleSave}
              loading={saving}
              size="lg"
              style={{ marginTop: Spacing.sm }}
            />

            {isEdit && !confirmDelete && (
              <TouchableOpacity style={styles.deleteRow} onPress={() => setConfirmDelete(true)}>
                <Text style={styles.deleteText}>Delete Event</Text>
              </TouchableOpacity>
            )}
            {isEdit && confirmDelete && (
              <View style={styles.confirmRow}>
                <Text style={styles.confirmMsg}>Delete this event?</Text>
                <View style={styles.confirmBtns}>
                  <TouchableOpacity style={styles.confirmCancelBtn} onPress={() => setConfirmDelete(false)}>
                    <Text style={styles.confirmCancelText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.confirmDeleteBtn} onPress={handleDelete}>
                    <Text style={styles.confirmDeleteText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            <View style={{ height: Spacing['2xl'] }} />
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.black },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderColor,
  },
  title: { color: Colors.textPrimary, fontSize: Typography.sizes.xl, fontWeight: '800' },
  closeBtn: { color: Colors.textSecondary, fontSize: 22, fontWeight: '600' },

  scroll: { padding: Spacing.xl },

  fieldLabel: {
    color: Colors.textSecondary,
    fontSize: Typography.sizes.xs,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: Spacing.sm,
    marginTop: Spacing.md,
  },

  dayScroll: { gap: Spacing.sm, paddingBottom: Spacing.sm },
  dayChip: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.borderColor,
    backgroundColor: Colors.surfaceBg,
    minWidth: 56,
  },
  dayChipActive: { borderColor: Colors.gold, backgroundColor: Colors.gold + '20' },
  dayDow: { color: Colors.textMuted, fontSize: Typography.sizes.xs, fontWeight: '700', letterSpacing: 0.5 },
  dayDowActive: { color: Colors.gold },
  dayNum: { color: Colors.textPrimary, fontSize: Typography.sizes.md, fontWeight: '800', marginVertical: 2 },
  dayNumActive: { color: Colors.gold },
  dayMonth: { color: Colors.textMuted, fontSize: Typography.sizes.xs },
  dayMonthActive: { color: Colors.gold },

  timeRow: { flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.sm },
  timeSep: { paddingBottom: Spacing.base + 2 },
  timeSepText: { color: Colors.textMuted, fontSize: Typography.sizes.base },

  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.sm },
  catChip: {
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
  catIcon: { fontSize: 14 },
  catLabel: { color: Colors.textSecondary, fontSize: Typography.sizes.sm, fontWeight: '600' },

  errorBox: {
    backgroundColor: Colors.error + '15',
    borderWidth: 1,
    borderColor: Colors.error + '50',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  errorText: { color: Colors.error, fontSize: Typography.sizes.sm, fontWeight: '600' },

  deleteRow: { alignItems: 'center', marginTop: Spacing.base, paddingVertical: Spacing.sm },
  deleteText: { color: Colors.error, fontSize: Typography.sizes.base, fontWeight: '600' },
  confirmRow: { marginTop: Spacing.base, backgroundColor: Colors.error + '10', borderRadius: BorderRadius.md, padding: Spacing.base },
  confirmMsg: { color: Colors.error, fontWeight: '700', textAlign: 'center', marginBottom: Spacing.sm },
  confirmBtns: { flexDirection: 'row', gap: Spacing.sm },
  confirmCancelBtn: { flex: 1, padding: Spacing.sm, borderRadius: BorderRadius.sm, backgroundColor: Colors.surfaceBg, alignItems: 'center' },
  confirmCancelText: { color: Colors.textSecondary, fontWeight: '700' },
  confirmDeleteBtn: { flex: 1, padding: Spacing.sm, borderRadius: BorderRadius.sm, backgroundColor: Colors.error, alignItems: 'center' },
  confirmDeleteText: { color: Colors.textPrimary, fontWeight: '700' },
});
