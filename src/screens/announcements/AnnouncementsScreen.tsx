import React, { useEffect, useState } from 'react';
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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Typography, Spacing, BorderRadius } from '../../constants/theme';
import { ScreenHeader } from '../../components/common/ScreenHeader';
import { Card } from '../../components/common/Card';
import { GoldButton } from '../../components/common/GoldButton';
import { GoldInput } from '../../components/common/GoldInput';
import { EmptyState } from '../../components/common/EmptyState';
import { useAnnouncementsStore } from '../../store/announcementsStore';
import { useAuthStore } from '../../store/authStore';
import { useTripStore } from '../../store/tripStore';
import { UserAvatar } from '../../components/common/UserAvatar';
import { Announcement } from '../../types';
import { format } from 'date-fns';

const TYPE_META: Record<Announcement['type'], { icon: string; color: string; label: string }> = {
  info:      { icon: 'ℹ️', color: '#4A8CE8', label: 'Info' },
  warning:   { icon: '⚠️', color: '#E8A84C', label: 'Warning' },
  emergency: { icon: '🚨', color: '#E84C4C', label: 'Emergency' },
  flight:    { icon: '✈️', color: '#4A8CE8', label: 'Flight' },
  schedule:  { icon: '📅', color: '#1A8C7A', label: 'Schedule' },
};

interface Props {
  navigation: any;
}

export function AnnouncementsScreen({ navigation }: Props) {
  const { announcements, loading, fetchAnnouncements, addAnnouncement, deleteAnnouncement, togglePin } =
    useAnnouncementsStore();
  const { user } = useAuthStore();
  const { allUsers } = useTripStore();
  const isAdmin = user?.role === 'admin';

  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [type, setType] = useState<Announcement['type']>('info');
  const [pinned, setPinned] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const resetForm = () => {
    setTitle('');
    setBody('');
    setType('info');
    setPinned(false);
    setErrorMsg('');
  };

  const handleSave = async () => {
    if (!title.trim()) { setErrorMsg('Title is required.'); return; }
    if (!body.trim()) { setErrorMsg('Message body is required.'); return; }
    setSaving(true);
    try {
      await addAnnouncement({
        author_id: user?.id || '',
        title: title.trim(),
        body: body.trim(),
        type,
        pinned,
      });
      setShowModal(false);
      resetForm();
    } finally {
      setSaving(false);
    }
  };

  const renderAnnouncement = ({ item }: { item: Announcement }) => {
    const meta = TYPE_META[item.type];
    const author = allUsers.find((u) => u.id === item.author_id);
    return (
      <Card style={[styles.card, item.pinned && styles.pinnedCard]}>
        {item.pinned && (
          <View style={styles.pinnedBadge}>
            <Text style={styles.pinnedBadgeText}>📌 PINNED</Text>
          </View>
        )}
        <View style={styles.cardHeader}>
          <View style={[styles.typeBadge, { backgroundColor: meta.color + '20' }]}>
            <Text style={styles.typeIcon}>{meta.icon}</Text>
            <Text style={[styles.typeLabel, { color: meta.color }]}>{meta.label}</Text>
          </View>
          <Text style={styles.cardDate}>
            {format(new Date(item.created_at), 'MMM d, h:mm a')}
          </Text>
        </View>
        <Text style={styles.cardTitle}>{item.title}</Text>
        <Text style={styles.cardBody}>{item.body}</Text>
        {author && (
          <View style={styles.authorRow}>
            <UserAvatar user={author} size={22} />
            <Text style={styles.authorName}>{author.full_name}</Text>
          </View>
        )}
        {isAdmin && (
          <View style={styles.adminActions}>
            <TouchableOpacity
              onPress={() => togglePin(item.id, !item.pinned)}
              style={styles.adminBtn}
            >
              <Text style={styles.adminBtnText}>{item.pinned ? 'Unpin' : 'Pin'}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => deleteAnnouncement(item.id)}
              style={[styles.adminBtn, styles.deleteBtnStyle]}
            >
              <Text style={[styles.adminBtnText, styles.deleteText]}>Delete</Text>
            </TouchableOpacity>
          </View>
        )}
      </Card>
    );
  };

  return (
    <View style={styles.root}>
      <ScreenHeader
        title="Expedition Updates"
        subtitle="Announcements, alerts & notices"
        onBack={() => navigation.goBack()}
        rightAction={isAdmin ? { icon: '＋', onPress: () => setShowModal(true) } : undefined}
      />

      <FlatList
        data={announcements}
        keyExtractor={(item) => item.id}
        renderItem={renderAnnouncement}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshing={loading}
        onRefresh={fetchAnnouncements}
        ListEmptyComponent={
          <EmptyState
            icon="📢"
            title="No Announcements Yet"
            subtitle="Trip updates and alerts will appear here."
            action={isAdmin ? { label: 'Post Announcement', onPress: () => setShowModal(true) } : undefined}
          />
        }
      />

      <Modal visible={showModal} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>New Announcement</Text>
            <TouchableOpacity onPress={() => { setShowModal(false); resetForm(); }}>
              <Text style={styles.modalClose}>✕</Text>
            </TouchableOpacity>
          </View>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
            <ScrollView contentContainerStyle={styles.modalScroll} showsVerticalScrollIndicator={false}>
              <GoldInput
                label="Title"
                placeholder="e.g. Flight time change"
                value={title}
                onChangeText={(v) => { setTitle(v); setErrorMsg(''); }}
              />
              <GoldInput
                label="Message"
                placeholder="Details of the announcement..."
                value={body}
                onChangeText={(v) => { setBody(v); setErrorMsg(''); }}
                multiline
                numberOfLines={4}
              />

              <Text style={styles.fieldLabel}>TYPE</Text>
              <View style={styles.typeGrid}>
                {(Object.keys(TYPE_META) as Announcement['type'][]).map((t) => {
                  const m = TYPE_META[t];
                  return (
                    <TouchableOpacity
                      key={t}
                      onPress={() => setType(t)}
                      style={[styles.typeChip, type === t && { borderColor: m.color, backgroundColor: m.color + '20' }]}
                    >
                      <Text style={styles.typeChipIcon}>{m.icon}</Text>
                      <Text style={[styles.typeChipLabel, type === t && { color: m.color }]}>{m.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <TouchableOpacity
                onPress={() => setPinned(!pinned)}
                style={[styles.pinToggle, pinned && styles.pinToggleActive]}
              >
                <Text style={styles.pinToggleIcon}>📌</Text>
                <Text style={[styles.pinToggleText, pinned && styles.pinToggleTextActive]}>
                  {pinned ? 'Pinned to top' : 'Pin to top'}
                </Text>
              </TouchableOpacity>

              {errorMsg ? (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>⚠️  {errorMsg}</Text>
                </View>
              ) : null}

              <GoldButton
                title="Post Announcement"
                onPress={handleSave}
                loading={saving}
                style={{ marginTop: Spacing.base }}
                size="lg"
              />
              <View style={{ height: Spacing.xl }} />
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.black },
  list: { padding: Spacing.base, gap: Spacing.sm },
  card: { gap: Spacing.sm },
  pinnedCard: {
    borderColor: Colors.gold + '60',
    borderWidth: 1,
  },
  pinnedBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.gold + '20',
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
  },
  pinnedBadgeText: {
    color: Colors.gold,
    fontSize: Typography.sizes.xs,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  typeIcon: { fontSize: 14 },
  typeLabel: {
    fontSize: Typography.sizes.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cardDate: {
    color: Colors.textMuted,
    fontSize: Typography.sizes.xs,
  },
  cardTitle: {
    color: Colors.textPrimary,
    fontSize: Typography.sizes.md,
    fontWeight: '700',
  },
  cardBody: {
    color: Colors.textSecondary,
    fontSize: Typography.sizes.base,
    lineHeight: 22,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: 2,
  },
  authorName: {
    color: Colors.textMuted,
    fontSize: Typography.sizes.xs,
    fontWeight: '600',
  },
  adminActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.borderColor,
  },
  adminBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.surfaceBg,
    borderWidth: 1,
    borderColor: Colors.borderColor,
  },
  deleteBtnStyle: {
    borderColor: Colors.error + '40',
    backgroundColor: Colors.error + '10',
  },
  adminBtnText: {
    color: Colors.textSecondary,
    fontSize: Typography.sizes.xs,
    fontWeight: '700',
  },
  deleteText: { color: Colors.error },
  modal: { flex: 1, backgroundColor: Colors.black },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderColor,
  },
  modalTitle: {
    color: Colors.textPrimary,
    fontSize: Typography.sizes.xl,
    fontWeight: '800',
  },
  modalClose: {
    color: Colors.textSecondary,
    fontSize: 22,
    fontWeight: '600',
  },
  modalScroll: { padding: Spacing.xl },
  fieldLabel: {
    color: Colors.textSecondary,
    fontSize: Typography.sizes.xs,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: Spacing.sm,
    marginTop: Spacing.md,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  typeChip: {
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
  typeChipIcon: { fontSize: 16 },
  typeChipLabel: {
    color: Colors.textSecondary,
    fontSize: Typography.sizes.sm,
    fontWeight: '600',
  },
  pinToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.borderColor,
    backgroundColor: Colors.surfaceBg,
    marginBottom: Spacing.md,
  },
  pinToggleActive: {
    borderColor: Colors.gold + '60',
    backgroundColor: Colors.gold + '15',
  },
  pinToggleIcon: { fontSize: 20 },
  pinToggleText: {
    color: Colors.textSecondary,
    fontSize: Typography.sizes.base,
    fontWeight: '600',
  },
  pinToggleTextActive: { color: Colors.gold },
  errorBox: {
    backgroundColor: Colors.error + '18',
    borderWidth: 1,
    borderColor: Colors.error + '60',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  errorText: {
    color: Colors.error,
    fontSize: Typography.sizes.sm,
    fontWeight: '600',
  },
});
