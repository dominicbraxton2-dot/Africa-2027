import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { format, parseISO } from 'date-fns';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Typography, Spacing, BorderRadius } from '../../constants/theme';
import { useCalendarStore } from '../../store/calendarStore';
import { EventFormModal } from './EventFormModal';
import { ItineraryEvent, EventCategory, EVENT_CATEGORIES } from '../../types';

// Jan 14–27 2027
const TRIP_DAYS: string[] = Array.from({ length: 14 }, (_, i) => {
  const d = new Date('2027-01-14');
  d.setDate(14 + i);
  return d.toISOString().split('T')[0];
});

const DAY_WIDTH = 68;

function formatDisplayTime(t?: string): string {
  if (!t) return '';
  const [hh, mm] = t.split(':').map(Number);
  const period = hh >= 12 ? 'PM' : 'AM';
  const h = hh % 12 || 12;
  return `${h}:${String(mm).padStart(2, '0')} ${period}`;
}

interface Props {
  onSwitchToDocuments?: () => void;
}

export function CalendarView({ onSwitchToDocuments }: Props) {
  const { events, fetchEvents } = useCalendarStore();
  const [selectedDate, setSelectedDate] = useState(TRIP_DAYS[0]);
  const [filterCat, setFilterCat] = useState<EventCategory | 'all'>('all');
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<ItineraryEvent | null>(null);
  const dayScrollRef = useRef<ScrollView>(null);

  useEffect(() => { fetchEvents(); }, []);

  useEffect(() => {
    const idx = TRIP_DAYS.indexOf(selectedDate);
    if (idx >= 0) {
      dayScrollRef.current?.scrollTo({ x: Math.max(0, idx * DAY_WIDTH - 40), animated: true });
    }
  }, [selectedDate]);

  const eventCountByDay = TRIP_DAYS.reduce<Record<string, number>>((acc, d) => {
    acc[d] = events.filter((e) => e.event_date === d).length;
    return acc;
  }, {});

  const dayEvents = events.filter(
    (e) => e.event_date === selectedDate && (filterCat === 'all' || e.category === filterCat),
  );

  const openAdd = () => { setEditingEvent(null); setShowForm(true); };
  const openEdit = (ev: ItineraryEvent) => { setEditingEvent(ev); setShowForm(true); };

  return (
    <View style={styles.root}>
      {/* Category filter strip */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.catStrip}
        style={styles.catStripWrap}
      >
        <TouchableOpacity
          onPress={() => setFilterCat('all')}
          style={[styles.catChip, filterCat === 'all' && styles.catChipActive]}
        >
          <Text style={[styles.catChipText, filterCat === 'all' && styles.catChipTextActive]}>🗂 All</Text>
        </TouchableOpacity>
        {EVENT_CATEGORIES.map((c) => (
          <TouchableOpacity
            key={c.key}
            onPress={() => setFilterCat(c.key)}
            style={[styles.catChip, filterCat === c.key && { backgroundColor: c.color, borderColor: c.color }]}
          >
            <Text style={[styles.catChipText, filterCat === c.key && { color: Colors.black }]}>
              {c.icon} {c.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Day selector strip */}
      <View style={styles.dayStripWrap}>
        <ScrollView
          ref={dayScrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.dayStrip}
        >
          {TRIP_DAYS.map((d) => {
            const sel = d === selectedDate;
            const hasEvents = (eventCountByDay[d] || 0) > 0;
            const dayLabel = format(parseISO(d), 'd');
            const dowLabel = format(parseISO(d), 'EEE').toUpperCase();
            const monLabel = format(parseISO(d), 'MMM').toUpperCase();
            return (
              <TouchableOpacity
                key={d}
                onPress={() => setSelectedDate(d)}
                style={[styles.dayItem, { width: DAY_WIDTH }]}
                activeOpacity={0.7}
              >
                {sel && (
                  <LinearGradient
                    colors={['#F0CC50', '#D4AF37', '#A8860A']}
                    style={StyleSheet.absoluteFill}
                  />
                )}
                <Text style={[styles.dayDow, sel && styles.dayTextSel]}>{dowLabel}</Text>
                <Text style={[styles.dayNum, sel && styles.dayTextSel]}>{dayLabel}</Text>
                <Text style={[styles.dayMon, sel && styles.dayTextSel]}>{monLabel}</Text>
                {hasEvents && (
                  <View style={[styles.eventDot, sel && styles.eventDotSel]} />
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
        <LinearGradient
          colors={['transparent', Colors.gold + '30', 'transparent']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          style={styles.dayStripBorder}
        />
      </View>

      {/* Day header + Add button */}
      <View style={styles.dayHeader}>
        <View style={styles.dayHeaderLeft}>
          <View style={styles.dayHeaderAccent} />
          <Text style={styles.dayHeaderText}>
            {format(parseISO(selectedDate), 'EEEE, MMMM d')}
          </Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={openAdd}>
          <Text style={styles.addBtnText}>＋ Add</Text>
        </TouchableOpacity>
      </View>

      {/* Events list */}
      <FlatList
        data={dayEvents}
        keyExtractor={(e) => e.id}
        contentContainerStyle={styles.eventList}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const meta = EVENT_CATEGORIES.find((c) => c.key === item.category) ?? EVENT_CATEGORIES[5];
          return (
            <TouchableOpacity activeOpacity={0.8} onPress={() => openEdit(item)}>
              <View style={styles.eventCard}>
                <View style={[styles.eventBar, { backgroundColor: meta.color }]} />
                <View style={styles.eventBody}>
                  <View style={styles.eventTopRow}>
                    <Text style={styles.eventCatIcon}>{meta.icon}</Text>
                    <Text style={styles.eventTitle} numberOfLines={1}>{item.title}</Text>
                  </View>
                  {(item.start_time || item.end_time) && (
                    <Text style={styles.eventTime}>
                      {item.start_time ? formatDisplayTime(item.start_time) : ''}
                      {item.end_time ? ` → ${formatDisplayTime(item.end_time)}` : ''}
                    </Text>
                  )}
                  {!item.start_time && !item.end_time && (
                    <Text style={styles.eventTime}>All day</Text>
                  )}
                  {item.location && (
                    <Text style={styles.eventLocation} numberOfLines={1}>📍 {item.location}</Text>
                  )}
                </View>
                <View style={[styles.eventCatDot, { backgroundColor: meta.color + '30', borderColor: meta.color + '60' }]}>
                  <Text style={{ fontSize: 12 }}>{meta.icon}</Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📅</Text>
            <Text style={styles.emptyTitle}>No events on this day</Text>
            <Text style={styles.emptySubtitle}>
              Tap ＋ Add to create an event, or scan an itinerary document to auto-fill.
            </Text>
            <TouchableOpacity style={styles.emptyAddBtn} onPress={openAdd}>
              <Text style={styles.emptyAddText}>＋ Add Event</Text>
            </TouchableOpacity>
            {onSwitchToDocuments && (
              <TouchableOpacity style={styles.emptyDocBtn} onPress={onSwitchToDocuments}>
                <Text style={styles.emptyDocText}>📄 Scan a Document</Text>
              </TouchableOpacity>
            )}
          </View>
        }
      />

      <EventFormModal
        visible={showForm}
        onClose={() => { setShowForm(false); setEditingEvent(null); }}
        editingEvent={editingEvent}
        defaultDate={selectedDate}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.black },

  catStripWrap: {
    maxHeight: 48,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderColor,
  },
  catStrip: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
    alignItems: 'center',
  },
  catChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.borderColor,
    backgroundColor: Colors.surfaceBg,
  },
  catChipActive: { backgroundColor: Colors.gold, borderColor: Colors.gold },
  catChipText: { color: Colors.textSecondary, fontSize: Typography.sizes.sm, fontWeight: '600' },
  catChipTextActive: { color: Colors.black },

  dayStripWrap: { position: 'relative' },
  dayStrip: { paddingVertical: Spacing.sm, paddingHorizontal: Spacing.xs },
  dayItem: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    marginHorizontal: 2,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    gap: 1,
  },
  dayDow: { color: Colors.textMuted, fontSize: Typography.sizes.xs, fontWeight: '700', letterSpacing: 0.5 },
  dayNum: { color: Colors.textPrimary, fontSize: Typography.sizes.md, fontWeight: '900' },
  dayMon: { color: Colors.textMuted, fontSize: Typography.sizes.xs, letterSpacing: 0.3 },
  dayTextSel: { color: Colors.black },
  eventDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: Colors.gold, marginTop: 2 },
  eventDotSel: { backgroundColor: Colors.black },
  dayStripBorder: { height: 1, position: 'absolute', bottom: 0, left: 0, right: 0 },

  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderColor,
  },
  dayHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  dayHeaderAccent: { width: 3, height: 16, borderRadius: 2, backgroundColor: Colors.gold },
  dayHeaderText: { color: Colors.textPrimary, fontSize: Typography.sizes.base, fontWeight: '700' },
  addBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    backgroundColor: Colors.gold + '20',
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.gold + '60',
  },
  addBtnText: { color: Colors.gold, fontSize: Typography.sizes.sm, fontWeight: '700' },

  eventList: { padding: Spacing.base, gap: Spacing.sm, paddingBottom: Spacing['3xl'] },
  eventCard: {
    flexDirection: 'row',
    alignItems: 'stretch',
    backgroundColor: Colors.cardBg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.borderColor,
    overflow: 'hidden',
  },
  eventBar: { width: 4 },
  eventBody: { flex: 1, padding: Spacing.md, gap: 3 },
  eventTopRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  eventCatIcon: { fontSize: 16 },
  eventTitle: { color: Colors.textPrimary, fontSize: Typography.sizes.base, fontWeight: '700', flex: 1 },
  eventTime: { color: Colors.textSecondary, fontSize: Typography.sizes.sm, marginLeft: 26 },
  eventLocation: { color: Colors.textMuted, fontSize: Typography.sizes.sm, marginLeft: 26 },
  eventCatDot: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginRight: Spacing.md,
    borderWidth: 1,
  },

  emptyState: { alignItems: 'center', paddingTop: Spacing['2xl'], gap: Spacing.sm },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { color: Colors.textPrimary, fontSize: Typography.sizes.lg, fontWeight: '700' },
  emptySubtitle: { color: Colors.textSecondary, fontSize: Typography.sizes.sm, textAlign: 'center', paddingHorizontal: Spacing['2xl'] },
  emptyAddBtn: {
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.gold,
    borderRadius: BorderRadius.full,
  },
  emptyAddText: { color: Colors.black, fontWeight: '800', fontSize: Typography.sizes.base },
  emptyDocBtn: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.borderColor,
  },
  emptyDocText: { color: Colors.textSecondary, fontWeight: '600', fontSize: Typography.sizes.base },
});
