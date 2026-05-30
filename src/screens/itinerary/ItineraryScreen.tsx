import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Linking,
  Modal,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { Colors, Typography, Spacing, BorderRadius } from '../../constants/theme';
import { ScreenHeader } from '../../components/common/ScreenHeader';
import { Card } from '../../components/common/Card';
import { GoldButton } from '../../components/common/GoldButton';
import { EmptyState } from '../../components/common/EmptyState';
import { useTripStore } from '../../store/tripStore';
import { useAuthStore } from '../../store/authStore';
import { Itinerary, ItineraryCategory, ITINERARY_CATEGORIES } from '../../types';

interface Props {
  navigation: any;
}

export function ItineraryScreen({ navigation }: Props) {
  const { documents: itineraries, fetchDocuments, uploadDocument, deleteDocument } = useTripStore();
  const { user } = useAuthStore();
  const [selectedCategory, setSelectedCategory] = useState<ItineraryCategory | 'all'>('all');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [pendingFile, setPendingFile] = useState<any>(null);
  const [selectedUploadCategory, setSelectedUploadCategory] = useState<ItineraryCategory>('general');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    fetchDocuments();
  }, []);

  const filtered = selectedCategory === 'all'
    ? itineraries
    : itineraries.filter((d) => d.category === selectedCategory);

  const handlePickFile = async () => {
    setUploadError('');
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;
      setPendingFile(result.assets[0]);
      setSelectedUploadCategory('general');
      setShowUploadModal(true);
    } catch {
      setUploadError('Failed to pick a file. Please try again.');
    }
  };

  const handleConfirmUpload = async () => {
    if (!pendingFile) return;
    setShowUploadModal(false);
    setUploading(true);
    setUploadError('');
    try {
      await uploadDocument(pendingFile as any, {
        title: pendingFile.name.replace(/\.[^.]+$/, ''),
        category: selectedUploadCategory,
        file_name: pendingFile.name,
        file_size: pendingFile.size,
        destination: 'both',
        uploaded_by: user?.id || '',
      });
    } catch {
      setUploadError('Upload failed. Please check your connection and try again.');
    } finally {
      setUploading(false);
      setPendingFile(null);
    }
  };

  const handleOpen = (doc: Itinerary) => {
    if (doc.file_url) {
      Linking.openURL(doc.file_url).catch(() => {
        setUploadError('Unable to open this document.');
      });
    }
  };

  const handleDeleteConfirm = async () => {
    if (!confirmDeleteId) return;
    await deleteDocument(confirmDeleteId);
    setConfirmDeleteId(null);
  };

  const renderDocument = ({ item }: { item: Itinerary }) => {
    const meta = ITINERARY_CATEGORIES.find((c) => c.key === item.category) || ITINERARY_CATEGORIES[4];
    const sizeKB = item.file_size ? Math.round(item.file_size / 1024) : null;

    return (
      <TouchableOpacity onPress={() => handleOpen(item)} activeOpacity={0.8}>
        <Card style={styles.docCard}>
          <View style={[styles.docIconBg, { backgroundColor: meta.color + '20' }]}>
            <Text style={styles.docIcon}>{meta.icon}</Text>
          </View>
          <View style={styles.docInfo}>
            <Text style={styles.docTitle} numberOfLines={2}>{item.title}</Text>
            <View style={styles.docMeta}>
              <Text style={[styles.docCategory, { color: meta.color }]}>{meta.label}</Text>
              {sizeKB && <Text style={styles.docSize}> · {sizeKB}KB</Text>}
              {item.destination && item.destination !== 'both' && (
                <Text style={styles.docDest}>
                  {' '}· {item.destination === 'zanzibar' ? '🇹🇿' : '🇿🇦'}
                </Text>
              )}
            </View>
          </View>
          <View style={styles.docActions}>
            <TouchableOpacity onPress={() => handleOpen(item)} style={styles.docAction}>
              <Text style={styles.docActionText}>Open</Text>
            </TouchableOpacity>
            {isAdmin && (
              <TouchableOpacity onPress={() => setConfirmDeleteId(item.id)} style={styles.docActionDanger}>
                <Text style={styles.docActionDangerText}>×</Text>
              </TouchableOpacity>
            )}
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.root}>
      <ScreenHeader
        title="Itinerary"
        subtitle="Trip Documents & Schedules"
        onBack={() => navigation.goBack()}
      />

      <View style={styles.filterContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={['all', ...ITINERARY_CATEGORIES.map((c) => c.key)] as (ItineraryCategory | 'all')[]}
          keyExtractor={(item) => item}
          contentContainerStyle={styles.filterList}
          renderItem={({ item }) => {
            const isSelected = selectedCategory === item;
            const meta = item === 'all' ? null : ITINERARY_CATEGORIES.find((c) => c.key === item);
            const label = item === 'all' ? '🗂️ All' : `${meta?.icon} ${meta?.label}`;
            return (
              <TouchableOpacity
                onPress={() => setSelectedCategory(item)}
                style={[styles.filterChip, isSelected && styles.filterChipActive]}
              >
                <Text style={[styles.filterChipText, isSelected && styles.filterChipTextActive]}>{label}</Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {isAdmin && (
        <View style={styles.uploadContainer}>
          {uploadError ? (
            <Text style={styles.uploadError}>{uploadError}</Text>
          ) : null}
          <GoldButton
            title={uploading ? 'Uploading…' : 'Upload Document'}
            onPress={handlePickFile}
            loading={uploading}
            icon="📎"
            variant="outline"
            size="sm"
            style={styles.uploadBtn}
          />
        </View>
      )}

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={renderDocument}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <EmptyState
            icon="📋"
            title="No Documents Yet"
            subtitle={isAdmin ? 'Upload itineraries, flight confirmations, and hotel bookings.' : 'The trip organizer will upload documents here.'}
            action={isAdmin ? { label: 'Upload Document', onPress: handlePickFile } : undefined}
          />
        }
      />

      {/* Upload category picker modal */}
      <Modal visible={showUploadModal} animationType="slide" presentationStyle="pageSheet" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Select Category</Text>
            <Text style={styles.modalSubtitle} numberOfLines={1}>
              {pendingFile?.name}
            </Text>
            <View style={styles.catGrid}>
              {ITINERARY_CATEGORIES.map((c) => (
                <TouchableOpacity
                  key={c.key}
                  onPress={() => setSelectedUploadCategory(c.key)}
                  style={[
                    styles.catChip,
                    selectedUploadCategory === c.key && { borderColor: c.color, backgroundColor: c.color + '20' },
                  ]}
                >
                  <Text style={styles.catIcon}>{c.icon}</Text>
                  <Text style={[styles.catLabel, selectedUploadCategory === c.key && { color: c.color }]}>
                    {c.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.modalActions}>
              <GoldButton title="Upload" onPress={handleConfirmUpload} style={{ flex: 1 }} />
              <GoldButton
                title="Cancel"
                onPress={() => { setShowUploadModal(false); setPendingFile(null); }}
                variant="outline"
                style={{ marginLeft: Spacing.sm }}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Delete confirm modal */}
      <Modal visible={!!confirmDeleteId} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Delete Document?</Text>
            <Text style={styles.modalSubtitle}>This action cannot be undone.</Text>
            <View style={styles.modalActions}>
              <GoldButton title="Delete" onPress={handleDeleteConfirm} style={[styles.deleteConfirmBtn, { flex: 1 }]} />
              <GoldButton
                title="Cancel"
                onPress={() => setConfirmDeleteId(null)}
                variant="outline"
                style={{ marginLeft: Spacing.sm }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.black },
  filterContainer: { paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.borderColor },
  filterList: { paddingHorizontal: Spacing.base, gap: Spacing.sm },
  filterChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.borderColor,
    backgroundColor: Colors.surfaceBg,
  },
  filterChipActive: { backgroundColor: Colors.gold, borderColor: Colors.gold },
  filterChipText: { color: Colors.textSecondary, fontSize: Typography.sizes.sm, fontWeight: '600' },
  filterChipTextActive: { color: Colors.black },
  uploadContainer: {
    padding: Spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderColor,
  },
  uploadError: {
    color: Colors.error,
    fontSize: Typography.sizes.sm,
    marginBottom: Spacing.sm,
    fontWeight: '600',
  },
  uploadBtn: { alignSelf: 'flex-start' },
  list: { padding: Spacing.base, gap: Spacing.sm },
  docCard: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  docIconBg: { width: 48, height: 48, borderRadius: BorderRadius.md, alignItems: 'center', justifyContent: 'center' },
  docIcon: { fontSize: 24 },
  docInfo: { flex: 1 },
  docTitle: { color: Colors.textPrimary, fontSize: Typography.sizes.base, fontWeight: '600', marginBottom: 4 },
  docMeta: { flexDirection: 'row', alignItems: 'center' },
  docCategory: { fontSize: Typography.sizes.xs, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  docSize: { color: Colors.textMuted, fontSize: Typography.sizes.xs },
  docDest: { color: Colors.textMuted, fontSize: Typography.sizes.xs },
  docActions: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  docAction: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    backgroundColor: Colors.gold + '20',
    borderRadius: BorderRadius.sm,
  },
  docActionText: { color: Colors.gold, fontSize: Typography.sizes.xs, fontWeight: '700' },
  docActionDanger: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.error + '20',
    borderRadius: BorderRadius.sm,
  },
  docActionDangerText: { color: Colors.error, fontSize: 18, fontWeight: '700' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: Colors.cardBg,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.xl,
    borderTopWidth: 1,
    borderColor: Colors.borderColor,
  },
  modalTitle: {
    color: Colors.textPrimary,
    fontSize: Typography.sizes.xl,
    fontWeight: '800',
    marginBottom: Spacing.xs,
  },
  modalSubtitle: {
    color: Colors.textSecondary,
    fontSize: Typography.sizes.sm,
    marginBottom: Spacing.xl,
  },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.xl },
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
  catIcon: { fontSize: 18 },
  catLabel: { color: Colors.textSecondary, fontSize: Typography.sizes.sm, fontWeight: '600' },
  modalActions: { flexDirection: 'row' },
  deleteConfirmBtn: { backgroundColor: Colors.error + '20' },
});
