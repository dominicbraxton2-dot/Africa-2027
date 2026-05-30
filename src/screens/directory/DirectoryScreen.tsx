import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Linking,
  TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { Colors, Typography, Spacing, BorderRadius } from '../../constants/theme';
import { ScreenHeader } from '../../components/common/ScreenHeader';
import { Card } from '../../components/common/Card';
import { EmptyState } from '../../components/common/EmptyState';
import { useTripStore } from '../../store/tripStore';

interface Props {
  navigation: any;
}

export function DirectoryScreen({ navigation }: Props) {
  const { allUsers, fetchAllUsers } = useTripStore();
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchAllUsers();
  }, []);

  const filtered = allUsers.filter((u) =>
    u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  const callUser = (phone?: string) => {
    if (!phone) return;
    Linking.openURL(`tel:${phone.replace(/\s/g, '')}`);
  };

  const messageUser = (phone?: string) => {
    if (!phone) return;
    Linking.openURL(`sms:${phone.replace(/\s/g, '')}`);
  };

  const emailUser = (email?: string) => {
    if (!email) return;
    Linking.openURL(`mailto:${email}`);
  };

  const renderUser = ({ item: user }: { item: any }) => {
    const initials = (user.full_name || 'T')
      .split(' ')
      .map((n: string) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

    return (
      <Card style={styles.card}>
        <View style={styles.cardHeader}>
          <LinearGradient
            colors={[Colors.goldLight, Colors.goldDark]}
            style={styles.avatar}
          >
            <Text style={styles.avatarText}>{initials}</Text>
          </LinearGradient>
          <View style={styles.info}>
            <View style={styles.nameRow}>
              <Text style={styles.name}>{user.full_name}</Text>
              {user.role === 'admin' && (
                <View style={styles.adminBadge}>
                  <Text style={styles.adminBadgeText}>Admin</Text>
                </View>
              )}
            </View>
            {user.email && (
              <TouchableOpacity onPress={() => emailUser(user.email)}>
                <Text style={styles.email}>{user.email}</Text>
              </TouchableOpacity>
            )}
            {user.instagram && (
              <Text style={styles.instagram}>@{user.instagram}</Text>
            )}
          </View>
        </View>

        {(user.phone || user.email) && (
          <View style={styles.actions}>
            {user.phone && (
              <>
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => callUser(user.phone)}
                >
                  <Text style={styles.actionIcon}>📞</Text>
                  <Text style={styles.actionLabel}>Call</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => messageUser(user.phone)}
                >
                  <Text style={styles.actionIcon}>💬</Text>
                  <Text style={styles.actionLabel}>Text</Text>
                </TouchableOpacity>
              </>
            )}
            {user.email && (
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => emailUser(user.email)}
              >
                <Text style={styles.actionIcon}>✉️</Text>
                <Text style={styles.actionLabel}>Email</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </Card>
    );
  };

  return (
    <View style={styles.root}>
      <ScreenHeader
        title="Traveler Directory"
        subtitle="The expedition group"
        onBack={() => navigation.goBack()}
      />

      {/* Search */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInput}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchText}
            placeholder="Search travelers..."
            placeholderTextColor={Colors.textMuted}
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={renderUser}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <Text style={styles.count}>
            {filtered.length} {filtered.length === 1 ? 'traveler' : 'travelers'}
          </Text>
        }
        ListEmptyComponent={
          <EmptyState
            icon="👥"
            title="No Travelers Found"
            subtitle="Travelers will appear here once they join the expedition."
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.black },
  searchContainer: {
    padding: Spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderColor,
  },
  searchInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceBg,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderColor,
  },
  searchIcon: { fontSize: 18, marginRight: Spacing.sm },
  searchText: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: Typography.sizes.md,
    paddingVertical: Spacing.md,
  },
  list: {
    padding: Spacing.base,
    gap: Spacing.sm,
  },
  count: {
    color: Colors.textMuted,
    fontSize: Typography.sizes.sm,
    marginBottom: Spacing.sm,
    letterSpacing: 0.3,
  },
  card: {
    gap: Spacing.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: Colors.black,
    fontSize: Typography.sizes.xl,
    fontWeight: '800',
  },
  info: { flex: 1 },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: 4,
  },
  name: {
    color: Colors.textPrimary,
    fontSize: Typography.sizes.md,
    fontWeight: '700',
  },
  adminBadge: {
    backgroundColor: Colors.gold + '30',
    borderWidth: 1,
    borderColor: Colors.gold + '60',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  adminBadgeText: {
    color: Colors.gold,
    fontSize: Typography.sizes.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  email: {
    color: Colors.textSecondary,
    fontSize: Typography.sizes.sm,
  },
  instagram: {
    color: Colors.gold,
    fontSize: Typography.sizes.sm,
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.borderColor,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    backgroundColor: Colors.surfaceBg,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.borderColor,
  },
  actionIcon: { fontSize: 14 },
  actionLabel: {
    color: Colors.textSecondary,
    fontSize: Typography.sizes.xs,
    fontWeight: '600',
  },
});
