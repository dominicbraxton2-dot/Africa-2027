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
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Typography, Spacing, BorderRadius } from '../../constants/theme';
import { ScreenHeader } from '../../components/common/ScreenHeader';
import { Card } from '../../components/common/Card';
import { GoldButton } from '../../components/common/GoldButton';
import { GoldInput } from '../../components/common/GoldInput';
import { EmptyState } from '../../components/common/EmptyState';
import { useTripStore } from '../../store/tripStore';
import { useAuthStore } from '../../store/authStore';
import { Itinerary, ItineraryCategory, ITINERARY_CATEGORIES } from '../../types';
import { format } from 'date-fns';
import { CalendarView } from './CalendarView';
import { ScanReviewModal } from './ScanReviewModal';
import { parseItineraryFile, ParsedEvent, ParseError } from '../../services/itineraryParser';

const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'heic', 'heif', 'gif', 'webp', 'bmp'];

function isImageFile(filename?: string): boolean {
  if (!filename) return false;
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  return IMAGE_EXTENSIONS.includes(ext);
}

function inferMimeType(filename?: string): string {
  const ext = filename?.split('.').pop()?.toLowerCase() || '';
  if (ext === 'pdf') return 'application/pdf';
  if (['heic', 'heif'].includes(ext)) return 'image/heic';
  if (ext === 'png') return 'image/png';
  return 'image/jpeg';
}

function DocThumb({ uri, fallbackIcon, fallbackColor }: { uri: string; fallbackIcon: string; fallbackColor: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <View style={[styles.docIconBg, { backgroundColor: fallbackColor + '20' }]}>
        <Text style={styles.docIcon}>{fallbackIcon}</Text>
      </View>
    );
  }
  return (
    <Image
      source={{ uri }}
      style={styles.docThumb}
      resizeMode="cover"
      onError={() => setFailed(true)}
    />
  );
}

const DESTINATION_OPTIONS = [
  { key: 'both' as const, label: '🌍 Both', color: Colors.gold },
  { key: 'cape_town' as const, label: '🇿🇦 Cape Town', color: '#4A8CE8' },
  { key: 'zanzibar' as const, label: '🇹🇿 Zanzibar', color: '#1A8C7A' },
];

interface Props {
  navigation: any;
}

export function ItineraryScreen({ navigation }: Props) {
  const { documents: itineraries, fetchDocuments, uploadDocument, deleteDocument, allUsers, fetchAllUsers } = useTripStore();
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';

  const [activeView, setActiveView] = useState<'documents' | 'calendar'>('documents');

  const [selectedCategory, setSelectedCategory] = useState<ItineraryCategory | 'all'>('all');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [pendingAsset, setPendingAsset] = useState<any>(null);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');
  const [uploadCategory, setUploadCategory] = useState<ItineraryCategory>('general');
  const [uploadDestination, setUploadDestination] = useState<'zanzibar' | 'cape_town' | 'both'>('both');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const [scanningDocId, setScanningDocId] = useState<string | null>(null);
  const [showScanReview, setShowScanReview] = useState(false);
  const [parsedEvents, setParsedEvents] = useState<ParsedEvent[]>([]);
  const [scanDocId, setScanDocId] = useState<string | undefined>(undefined);
  const [scanError, setScanError] = useState<ParseError | null>(null);

  useEffect(() => {
    fetchDocuments();
    fetchAllUsers();
  }, []);

  const filtered = selectedCategory === 'all'
    ? itineraries
    : itineraries.filter((d) => d.category === selectedCategory);

  const handlePickFile = async () => {
    setUploadError('');
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*', 'image/heic', 'image/heif'],
        copyToCacheDirectory: true,
        multiple: false,
      });
      if (result.canceled || !result.assets?.[0]) return;

      const asset = result.assets[0];
      setPendingAsset(asset);
      setUploadTitle(asset.name.replace(/\.[^.]+$/, '').replace(/[_-]/g, ' '));
      setUploadDescription('');
      setUploadCategory('general');
      setUploadDestination('both');
      setShowUploadModal(true);
    } catch {
      setUploadError('Could not open the file picker. Please try again or choose a different file.');
    }
  };

  const handleConfirmUpload = async () => {
    if (!pendingAsset) return;
    if (!uploadTitle.trim()) {
      setUploadError('Please enter a title for this document.');
      return;
    }
    setShowUploadModal(false);
    setUploading(true);
    setUploadError('');
    try {
      await uploadDocument(pendingAsset, {
        title: uploadTitle.trim(),
        description: uploadDescription.trim() || undefined,
        category: uploadCategory,
        destination: uploadDestination,
        file_name: pendingAsset.name,
        file_size: pendingAsset.size,
        uploaded_by: user?.id || '',
      });
    } catch {
      setUploadError('Upload failed. Please try again or choose a different file.');
    } finally {
      setUploading(false);
      setPendingAsset(null);
    }
  };

  const handleCancelUpload = () => {
    setShowUploadModal(false);
    setPendingAsset(null);
    setUploadError('');
  };

  const handleOpen = (doc: Itinerary) => {
    if (!doc.file_url) {
      setUploadError('This file was saved locally and is not available for viewing. Connect Supabase to enable persistent file storage.');
      return;
    }
    Linking.openURL(doc.file_url).catch(() => {
      setUploadError(`Could not open "${doc.title}". The file may have expired. Try re-uploading.`);
    });
  };

  const handleDeleteConfirm = async () => {
    if (!confirmDeleteId) return;
    await deleteDocument(confirmDeleteId);
    setConfirmDeleteId(null);
  };

  const handleScan = async (doc: Itinerary) => {
    if (!doc.file_url) {
      setScanError('FETCH_FAILED' as ParseError);
      setParsedEvents([]);
      setScanDocId(doc.id);
      setShowScanReview(true);
      return;
    }
    setScanningDocId(doc.id);
    setScanError(null);
    try {
      const events = await parseItineraryFile(null, doc.file_url, inferMimeType(doc.file_name));
      setParsedEvents(events);
      setScanDocId(doc.id);
      setScanError(null);
    } catch (e: any) {
      setParsedEvents([]);
      setScanDocId(doc.id);
      setScanError((e.code as ParseError) || 'API_ERROR');
    } finally {
      setScanningDocId(null);
      setShowScanReview(true);
    }
  };

  const canDelete = (doc: Itinerary) =>
    isAdmin || doc.uploaded_by === user?.id;

  const uploaderName = (uploadedBy?: string) => {
    if (!uploadedBy) return null;
    const profile = allUsers.find((u) => u.id === uploadedBy);
    return profile?.full_name?.split(' ')[0] || null;
  };

  const renderDocument = ({ item }: { item: Itinerary }) => {
    const meta = ITINERARY_CATEGORIES.find((c) => c.key === item.category) || ITINERARY_CATEGORIES[4];
    const sizeKB = item.file_size ? Math.round(item.file_size / 1024) : null;
    const showImage = isImageFile(item.file_name) && item.file_url && !item.file_url.startsWith('blob:');
    const isLocal = item.id.startsWith('local-');
    const uploader = uploaderName(item.uploaded_by);
    const isScanning = scanningDocId === item.id;

    return (
      <Card style={styles.docCard}>
        {/* Thumbnail / icon */}
        <TouchableOpacity onPress={() => handleOpen(item)} activeOpacity={0.8}>
          {showImage ? (
            <DocThumb uri={item.file_url!} fallbackIcon={meta.icon} fallbackColor={meta.color} />
          ) : (
            <View style={[styles.docIconBg, { backgroundColor: meta.color + '20' }]}>
              <Text style={styles.docIcon}>{meta.icon}</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Info */}
        <View style={styles.docInfo}>
          <Text style={styles.docTitle} numberOfLines={2}>{item.title}</Text>
          {item.description ? (
            <Text style={styles.docDesc} numberOfLines={1}>{item.description}</Text>
          ) : null}
          <View style={styles.docMetaRow}>
            <View style={[styles.catBadge, { backgroundColor: meta.color + '15' }]}>
              <Text style={[styles.docCategory, { color: meta.color }]}>{meta.icon} {meta.label}</Text>
            </View>
            {item.destination && item.destination !== 'both' && (
              <Text style={styles.destFlag}>
                {item.destination === 'zanzibar' ? '🇹🇿' : '🇿🇦'}
              </Text>
            )}
            {isLocal && (
              <View style={styles.localBadge}>
                <Text style={styles.localBadgeText}>local</Text>
              </View>
            )}
          </View>
          <View style={styles.docSubMeta}>
            {uploader && <Text style={styles.docMeta}>by {uploader}</Text>}
            {uploader && item.created_at && <Text style={styles.docMetaDot}> · </Text>}
            {item.created_at && (
              <Text style={styles.docMeta}>{format(new Date(item.created_at), 'MMM d')}</Text>
            )}
            {sizeKB && <Text style={styles.docMeta}> · {sizeKB < 1000 ? `${sizeKB}KB` : `${(sizeKB / 1024).toFixed(1)}MB`}</Text>}
          </View>
        </View>

        {/* Actions */}
        <View style={styles.docActions}>
          <TouchableOpacity onPress={() => handleOpen(item)} style={styles.docActionBtn}>
            <Text style={styles.docActionText}>Open</Text>
          </TouchableOpacity>
          {item.file_url && !item.file_url.startsWith('blob:') && (
            <TouchableOpacity
              onPress={() => Linking.openURL(item.file_url || '')}
              style={styles.docActionBtn}
            >
              <Text style={styles.docActionText}>↓</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={() => handleScan(item)}
            style={[styles.docActionBtn, styles.scanActionBtn]}
            disabled={isScanning}
          >
            <Text style={styles.scanActionText}>{isScanning ? '⏳' : '🔍'}</Text>
          </TouchableOpacity>
          {canDelete(item) && (
            <TouchableOpacity onPress={() => setConfirmDeleteId(item.id)} style={styles.docDeleteBtn}>
              <Text style={styles.docDeleteText}>×</Text>
            </TouchableOpacity>
          )}
        </View>
      </Card>
    );
  };

  return (
    <View style={styles.root}>
      <ScreenHeader
        title="Itinerary"
        subtitle="Trip Documents & Schedules"
        onBack={() => navigation.goBack()}
      />

      {/* View switcher tabs */}
      <View style={styles.viewTabs}>
        <TouchableOpacity
          onPress={() => setActiveView('documents')}
          style={[styles.viewTab, activeView === 'documents' && styles.viewTabActive]}
        >
          <Text style={[styles.viewTabText, activeView === 'documents' && styles.viewTabTextActive]}>
            📄 Documents
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveView('calendar')}
          style={[styles.viewTab, activeView === 'calendar' && styles.viewTabActive]}
        >
          <Text style={[styles.viewTabText, activeView === 'calendar' && styles.viewTabTextActive]}>
            📅 Calendar
          </Text>
        </TouchableOpacity>
      </View>

      {activeView === 'calendar' ? (
        <CalendarView onSwitchToDocuments={() => setActiveView('documents')} />
      ) : (
        <>
          {/* Category filter */}
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

          {/* Upload bar */}
          <View style={styles.uploadBar}>
            {uploadError ? <Text style={styles.uploadError}>{uploadError}</Text> : null}
            <GoldButton
              title={uploading ? 'Uploading…' : '📎  Upload File or Image'}
              onPress={handlePickFile}
              loading={uploading}
              variant="outline"
              size="sm"
              style={styles.uploadBtn}
            />
          </View>

          {/* Document list */}
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.id}
            renderItem={renderDocument}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <EmptyState
                icon="📋"
                title="No Itinerary Documents Yet"
                subtitle="Upload a file or image to share with the group."
                action={{ label: 'Upload File or Image', onPress: handlePickFile }}
              />
            }
          />
        </>
      )}

      {/* ── Scan Review Modal ── */}
      <ScanReviewModal
        visible={showScanReview}
        onClose={() => setShowScanReview(false)}
        parsedEvents={parsedEvents}
        sourceDocId={scanDocId}
        errorType={scanError}
        onSaved={() => setActiveView('calendar')}
      />

      {/* ── Upload Modal ── */}
      <Modal visible={showUploadModal} animationType="slide" presentationStyle="pageSheet" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalSheet}>
              <View style={styles.modalHandle} />
              <Text style={styles.modalTitle}>Upload Document</Text>
              {pendingAsset && (
                <View style={styles.filePreviewRow}>
                  <Text style={styles.filePreviewIcon}>
                    {isImageFile(pendingAsset.name) ? '🖼️' : '📄'}
                  </Text>
                  <Text style={styles.filePreviewName} numberOfLines={1}>{pendingAsset.name}</Text>
                </View>
              )}

              <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                <GoldInput
                  label="Title"
                  placeholder="e.g. Kenya Airways Flight Confirmation"
                  value={uploadTitle}
                  onChangeText={(v) => { setUploadTitle(v); setUploadError(''); }}
                />

                <GoldInput
                  label="Notes (optional)"
                  placeholder="Any details about this document..."
                  value={uploadDescription}
                  onChangeText={setUploadDescription}
                  multiline
                  numberOfLines={2}
                />

                <Text style={styles.fieldLabel}>CATEGORY</Text>
                <View style={styles.catGrid}>
                  {ITINERARY_CATEGORIES.map((c) => (
                    <TouchableOpacity
                      key={c.key}
                      onPress={() => setUploadCategory(c.key)}
                      style={[
                        styles.catChip,
                        uploadCategory === c.key && { borderColor: c.color, backgroundColor: c.color + '20' },
                      ]}
                    >
                      <Text style={styles.catIcon}>{c.icon}</Text>
                      <Text style={[styles.catLabel, uploadCategory === c.key && { color: c.color }]}>
                        {c.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.fieldLabel}>DESTINATION</Text>
                <View style={styles.destGrid}>
                  {DESTINATION_OPTIONS.map((d) => (
                    <TouchableOpacity
                      key={d.key}
                      onPress={() => setUploadDestination(d.key)}
                      style={[
                        styles.destChip,
                        uploadDestination === d.key && { borderColor: d.color, backgroundColor: d.color + '20' },
                      ]}
                    >
                      <Text style={[styles.destChipText, uploadDestination === d.key && { color: d.color }]}>
                        {d.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {uploadError ? (
                  <View style={styles.errorBox}>
                    <Text style={styles.errorText}>⚠️  {uploadError}</Text>
                  </View>
                ) : null}

                <View style={styles.modalActions}>
                  <GoldButton title="Upload" onPress={handleConfirmUpload} style={{ flex: 1 }} />
                  <GoldButton
                    title="Cancel"
                    onPress={handleCancelUpload}
                    variant="outline"
                    style={{ marginLeft: Spacing.sm }}
                  />
                </View>
                <View style={{ height: Spacing.xl }} />
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Delete Confirm Modal ── */}
      <Modal visible={!!confirmDeleteId} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, styles.deleteSheet]}>
            <Text style={styles.modalTitle}>Delete Document?</Text>
            <Text style={styles.modalSubtitle}>This cannot be undone.</Text>
            <View style={styles.modalActions}>
              <GoldButton title="Cancel" onPress={() => setConfirmDeleteId(null)} variant="outline" style={{ flex: 1 }} />
              <GoldButton title="Delete" onPress={handleDeleteConfirm} style={[{ flex: 1, marginLeft: Spacing.sm }, styles.deleteBtnStyle]} />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.black },

  viewTabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderColor,
  },
  viewTab: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  viewTabActive: {
    borderBottomColor: Colors.gold,
  },
  viewTabText: {
    color: Colors.textSecondary,
    fontSize: Typography.sizes.sm,
    fontWeight: '700',
  },
  viewTabTextActive: {
    color: Colors.gold,
  },

  filterContainer: {
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderColor,
  },
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

  uploadBar: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderColor,
  },
  uploadError: {
    color: Colors.error,
    fontSize: Typography.sizes.sm,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  uploadBtn: { alignSelf: 'flex-start' },

  list: { padding: Spacing.base, gap: Spacing.sm },

  docCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
    padding: Spacing.md,
  },
  docThumb: {
    width: 52,
    height: 52,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surfaceBg,
  },
  docIconBg: {
    width: 52,
    height: 52,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  docIcon: { fontSize: 26 },
  docInfo: { flex: 1 },
  docTitle: {
    color: Colors.textPrimary,
    fontSize: Typography.sizes.base,
    fontWeight: '700',
    marginBottom: 3,
  },
  docDesc: {
    color: Colors.textSecondary,
    fontSize: Typography.sizes.sm,
    marginBottom: Spacing.xs,
  },
  docMetaRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, marginBottom: 4 },
  catBadge: {
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  docCategory: { fontSize: Typography.sizes.xs, fontWeight: '700' },
  destFlag: { fontSize: Typography.sizes.sm },
  localBadge: {
    paddingHorizontal: Spacing.xs,
    paddingVertical: 1,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.safariGreen + '30',
    borderWidth: 1,
    borderColor: Colors.safariGreenLight + '50',
  },
  localBadgeText: {
    color: Colors.safariGreenLight,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  docSubMeta: { flexDirection: 'row', flexWrap: 'wrap' },
  docMeta: { color: Colors.textMuted, fontSize: Typography.sizes.xs },
  docMetaDot: { color: Colors.textMuted, fontSize: Typography.sizes.xs },

  docActions: { flexDirection: 'column', gap: Spacing.xs, alignItems: 'flex-end' },
  docActionBtn: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    backgroundColor: Colors.gold + '20',
    borderRadius: BorderRadius.sm,
    minWidth: 48,
    alignItems: 'center',
  },
  docActionText: { color: Colors.gold, fontSize: Typography.sizes.xs, fontWeight: '700' },
  scanActionBtn: {
    backgroundColor: Colors.safariGreen + '20',
    minWidth: 48,
  },
  scanActionText: { fontSize: Typography.sizes.sm },
  docDeleteBtn: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.error + '20',
    borderRadius: BorderRadius.sm,
  },
  docDeleteText: { color: Colors.error, fontSize: 18, fontWeight: '700', lineHeight: 22 },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: Colors.cardBg,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.xl,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderColor: Colors.borderColor,
    maxHeight: '90%',
  },
  deleteSheet: {
    maxHeight: 240,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.borderColor,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: Spacing.base,
  },
  modalTitle: {
    color: Colors.textPrimary,
    fontSize: Typography.sizes.xl,
    fontWeight: '800',
    marginBottom: Spacing.sm,
  },
  modalSubtitle: {
    color: Colors.textSecondary,
    fontSize: Typography.sizes.sm,
    marginBottom: Spacing.xl,
  },
  filePreviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.surfaceBg,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.borderColor,
  },
  filePreviewIcon: { fontSize: 20 },
  filePreviewName: {
    color: Colors.textSecondary,
    fontSize: Typography.sizes.sm,
    flex: 1,
  },
  fieldLabel: {
    color: Colors.textSecondary,
    fontSize: Typography.sizes.xs,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: Spacing.sm,
    marginTop: Spacing.md,
  },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.xs },
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
  catIcon: { fontSize: 16 },
  catLabel: { color: Colors.textSecondary, fontSize: Typography.sizes.sm, fontWeight: '600' },

  destGrid: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.sm },
  destChip: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.borderColor,
    backgroundColor: Colors.surfaceBg,
  },
  destChipText: { color: Colors.textSecondary, fontSize: Typography.sizes.sm, fontWeight: '700' },

  errorBox: {
    backgroundColor: Colors.error + '18',
    borderWidth: 1,
    borderColor: Colors.error + '60',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    marginTop: Spacing.sm,
  },
  errorText: { color: Colors.error, fontSize: Typography.sizes.sm, fontWeight: '600' },

  modalActions: { flexDirection: 'row', marginTop: Spacing.base },
  deleteBtnStyle: { backgroundColor: Colors.error + '20' },
});
