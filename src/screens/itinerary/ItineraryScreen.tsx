import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  Linking,
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
import { TripDocument, DocumentCategory } from '../../types';

const CATEGORY_META: Record<DocumentCategory, { icon: string; label: string; color: string }> = {
  flights: { icon: '✈️', label: 'Flights', color: '#4A8CE8' },
  hotels: { icon: '🏨', label: 'Hotels', color: '#8B6F47' },
  activities: { icon: '🤿', label: 'Activities', color: '#1A8C7A' },
  transportation: { icon: '🚗', label: 'Transport', color: '#E8643A' },
  documents: { icon: '📄', label: 'Documents', color: '#C9A84C' },
};

const CATEGORIES: DocumentCategory[] = ['flights', 'hotels', 'activities', 'transportation', 'documents'];

interface Props {
  navigation: any;
}

export function ItineraryScreen({ navigation }: Props) {
  const { documents, fetchDocuments, uploadDocument, deleteDocument } = useTripStore();
  const { user } = useAuthStore();
  const [selectedCategory, setSelectedCategory] = useState<DocumentCategory | 'all'>('all');
  const [uploading, setUploading] = useState(false);
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    fetchDocuments();
  }, []);

  const filtered = selectedCategory === 'all'
    ? documents
    : documents.filter((d) => d.category === selectedCategory);

  const handleUpload = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const file = result.assets[0];
      setUploading(true);

      // Prompt for category
      Alert.alert('Document Category', 'Select a category for this document:', [
        ...CATEGORIES.map((cat) => ({
          text: `${CATEGORY_META[cat].icon} ${CATEGORY_META[cat].label}`,
          onPress: async () => {
            await uploadDocument(file as any, {
              title: file.name.replace(/\.[^.]+$/, ''),
              category: cat,
              file_name: file.name,
              file_size: file.size,
              uploaded_by: user?.id || '',
            });
            setUploading(false);
          },
        })),
        { text: 'Cancel', style: 'cancel', onPress: () => setUploading(false) },
      ]);
    } catch (err) {
      setUploading(false);
      Alert.alert('Error', 'Failed to upload document. Please try again.');
    }
  };

  const handleOpen = (doc: TripDocument) => {
    if (doc.file_url) {
      Linking.openURL(doc.file_url).catch(() => {
        Alert.alert('Error', 'Unable to open this document.');
      });
    }
  };

  const handleDelete = (doc: TripDocument) => {
    Alert.alert('Delete Document', `Remove "${doc.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteDocument(doc.id),
      },
    ]);
  };

  const renderDocument = ({ item }: { item: TripDocument }) => {
    const meta = CATEGORY_META[item.category];
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
              {item.destination && (
                <Text style={styles.docDest}>
                  {' '}· {item.destination === 'zanzibar' ? '🇹🇿' : item.destination === 'cape_town' ? '🇿🇦' : '🌍'}
                </Text>
              )}
            </View>
          </View>
          <View style={styles.docActions}>
            <TouchableOpacity onPress={() => handleOpen(item)} style={styles.docAction}>
              <Text style={styles.docActionText}>Open</Text>
            </TouchableOpacity>
            {isAdmin && (
              <TouchableOpacity onPress={() => handleDelete(item)} style={styles.docActionDanger}>
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

      {/* Category Filter */}
      <View style={styles.filterContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={['all', ...CATEGORIES] as (DocumentCategory | 'all')[]}
          keyExtractor={(item) => item}
          contentContainerStyle={styles.filterList}
          renderItem={({ item }) => {
            const isSelected = selectedCategory === item;
            const label = item === 'all' ? '🗂️ All' : `${CATEGORY_META[item].icon} ${CATEGORY_META[item].label}`;
            return (
              <TouchableOpacity
                onPress={() => setSelectedCategory(item)}
                style={[styles.filterChip, isSelected && styles.filterChipActive]}
              >
                <Text style={[styles.filterChipText, isSelected && styles.filterChipTextActive]}>
                  {label}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* Upload Button (Admin only) */}
      {isAdmin && (
        <View style={styles.uploadContainer}>
          <GoldButton
            title={uploading ? 'Uploading…' : 'Upload Document'}
            onPress={handleUpload}
            loading={uploading}
            icon="📎"
            variant="outline"
            size="sm"
            style={styles.uploadBtn}
          />
        </View>
      )}

      {/* Document List */}
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
            action={isAdmin ? { label: 'Upload Document', onPress: handleUpload } : undefined}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.black },
  filterContainer: {
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderColor,
  },
  filterList: {
    paddingHorizontal: Spacing.base,
    gap: Spacing.sm,
  },
  filterChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.borderColor,
    backgroundColor: Colors.surfaceBg,
  },
  filterChipActive: {
    backgroundColor: Colors.gold,
    borderColor: Colors.gold,
  },
  filterChipText: {
    color: Colors.textSecondary,
    fontSize: Typography.sizes.sm,
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: Colors.black,
  },
  uploadContainer: {
    padding: Spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderColor,
  },
  uploadBtn: {
    alignSelf: 'flex-start',
  },
  list: {
    padding: Spacing.base,
    gap: Spacing.sm,
  },
  docCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  docIconBg: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  docIcon: { fontSize: 24 },
  docInfo: { flex: 1 },
  docTitle: {
    color: Colors.textPrimary,
    fontSize: Typography.sizes.base,
    fontWeight: '600',
    marginBottom: 4,
  },
  docMeta: { flexDirection: 'row', alignItems: 'center' },
  docCategory: {
    fontSize: Typography.sizes.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  docSize: { color: Colors.textMuted, fontSize: Typography.sizes.xs },
  docDest: { color: Colors.textMuted, fontSize: Typography.sizes.xs },
  docActions: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  docAction: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    backgroundColor: Colors.gold + '20',
    borderRadius: BorderRadius.sm,
  },
  docActionText: {
    color: Colors.gold,
    fontSize: Typography.sizes.xs,
    fontWeight: '700',
  },
  docActionDanger: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.error + '20',
    borderRadius: BorderRadius.sm,
  },
  docActionDangerText: {
    color: Colors.error,
    fontSize: 18,
    fontWeight: '700',
  },
});
