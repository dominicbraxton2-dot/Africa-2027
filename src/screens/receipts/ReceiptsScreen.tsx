import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Typography, Spacing, BorderRadius } from '../../constants/theme';
import { ScreenHeader } from '../../components/common/ScreenHeader';
import { Card } from '../../components/common/Card';
import { GoldButton } from '../../components/common/GoldButton';
import { scanReceiptWithVision } from '../../services/ocrService';
import { convertToUSD, formatCurrency } from '../../services/currencyService';
import { ReceiptData, CURRENCIES } from '../../types';

interface Props {
  navigation: any;
}

export function ReceiptsScreen({ navigation }: Props) {
  const [image, setImage] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);
  const [usdAmount, setUsdAmount] = useState<number | null>(null);
  const [exchangeRate, setExchangeRate] = useState<number | null>(null);

  const pickImage = async (source: 'camera' | 'library') => {
    const result = source === 'camera'
      ? await ImagePicker.launchCameraAsync({
          base64: true,
          quality: 0.8,
          allowsEditing: true,
        })
      : await ImagePicker.launchImageLibraryAsync({
          base64: true,
          quality: 0.8,
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
        });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setImage(asset.uri);
      setReceipt(null);
      setUsdAmount(null);

      if (asset.base64) {
        await processReceipt(asset.base64);
      }
    }
  };

  const processReceipt = async (base64: string) => {
    setScanning(true);
    try {
      const data = await scanReceiptWithVision(base64);
      setReceipt(data);

      if (data.total && data.currency) {
        const { usdAmount: usd, rate } = await convertToUSD(data.total, data.currency);
        setUsdAmount(usd);
        setExchangeRate(rate);
      }
    } catch (err) {
      Alert.alert('Scan Error', 'Unable to scan receipt. Please enter details manually.');
    } finally {
      setScanning(false);
    }
  };

  const handleUseReceipt = () => {
    navigation.navigate('Expenses', {
      openAdd: true,
      receiptData: {
        ...receipt,
        usdAmount,
        exchangeRate,
      },
    });
  };

  const currencyInfo = receipt?.currency ? CURRENCIES[receipt.currency as keyof typeof CURRENCIES] : null;

  return (
    <View style={styles.root}>
      <ScreenHeader
        title="Receipt Scanner"
        subtitle="Scan & convert automatically"
        onBack={() => navigation.goBack()}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* Camera / Library buttons */}
        <View style={styles.captureRow}>
          <TouchableOpacity
            style={styles.captureBtn}
            onPress={() => pickImage('camera')}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[Colors.goldLight, Colors.gold, Colors.goldDark]}
              style={styles.captureBtnGradient}
            >
              <Text style={styles.captureIcon}>📷</Text>
              <Text style={styles.captureBtnText}>Camera</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.captureBtn}
            onPress={() => pickImage('library')}
            activeOpacity={0.8}
          >
            <View style={styles.captureBtnOutline}>
              <Text style={styles.captureIcon}>🖼️</Text>
              <Text style={styles.captureBtnOutlineText}>Gallery</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Preview & Results */}
        {image && (
          <Card variant="gold" style={styles.previewCard}>
            <Image source={{ uri: image }} style={styles.receiptImage} resizeMode="contain" />

            {scanning && (
              <View style={styles.scanningOverlay}>
                <ActivityIndicator color={Colors.gold} size="large" />
                <Text style={styles.scanningText}>Analyzing receipt...</Text>
                <Text style={styles.scanningSubtext}>Detecting currency & extracting totals</Text>
              </View>
            )}
          </Card>
        )}

        {!image && !scanning && (
          <View style={styles.placeholder}>
            <Text style={styles.placeholderIcon}>🧾</Text>
            <Text style={styles.placeholderTitle}>Scan a Receipt</Text>
            <Text style={styles.placeholderText}>
              Take a photo or choose from your gallery. The app will automatically detect:
            </Text>
            <View style={styles.featureList}>
              {[
                { icon: '🏪', label: 'Merchant name' },
                { icon: '💵', label: 'Total amount' },
                { icon: '🌍', label: 'Currency (TZS, ZAR, USD)' },
                { icon: '📅', label: 'Receipt date' },
              ].map((f) => (
                <View key={f.label} style={styles.featureItem}>
                  <Text style={styles.featureIcon}>{f.icon}</Text>
                  <Text style={styles.featureLabel}>{f.label}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Scanned Results */}
        {receipt && !scanning && (
          <View style={styles.results}>
            <Text style={styles.resultsTitle}>✅ Receipt Detected</Text>

            <Card style={styles.resultCard}>
              {/* Merchant */}
              {receipt.merchant && (
                <View style={styles.resultRow}>
                  <Text style={styles.resultIcon}>🏪</Text>
                  <View style={styles.resultContent}>
                    <Text style={styles.resultLabel}>Merchant</Text>
                    <Text style={styles.resultValue}>{receipt.merchant}</Text>
                  </View>
                </View>
              )}

              {/* Date */}
              {receipt.date && (
                <View style={[styles.resultRow, styles.resultBorder]}>
                  <Text style={styles.resultIcon}>📅</Text>
                  <View style={styles.resultContent}>
                    <Text style={styles.resultLabel}>Date</Text>
                    <Text style={styles.resultValue}>{receipt.date}</Text>
                  </View>
                </View>
              )}

              {/* Currency & Amount */}
              {receipt.currency && receipt.total && (
                <View style={[styles.resultRow, styles.resultBorder]}>
                  <Text style={styles.resultIcon}>
                    {currencyInfo?.flag || '💰'}
                  </Text>
                  <View style={styles.resultContent}>
                    <Text style={styles.resultLabel}>Original Amount</Text>
                    <Text style={styles.resultValue}>
                      {formatCurrency(receipt.total, receipt.currency)}
                    </Text>
                    {currencyInfo && (
                      <Text style={styles.currencyName}>{currencyInfo.name}</Text>
                    )}
                  </View>
                </View>
              )}

              {/* USD Conversion */}
              {usdAmount !== null && (
                <View style={[styles.resultRow, styles.resultBorder]}>
                  <Text style={styles.resultIcon}>🇺🇸</Text>
                  <View style={styles.resultContent}>
                    <Text style={styles.resultLabel}>USD Equivalent</Text>
                    <Text style={styles.usdValue}>${usdAmount.toFixed(2)}</Text>
                    {exchangeRate && receipt.currency !== 'USD' && (
                      <Text style={styles.rateNote}>
                        Rate: 1 USD = {exchangeRate.toFixed(4)} {receipt.currency}
                      </Text>
                    )}
                  </View>
                </View>
              )}

              {/* Line Items */}
              {receipt.line_items && receipt.line_items.length > 0 && (
                <View style={[styles.lineItems, styles.resultBorder]}>
                  <Text style={styles.lineItemsTitle}>Items</Text>
                  {receipt.line_items.map((item, i) => (
                    <View key={i} style={styles.lineItem}>
                      <Text style={styles.lineItemDesc}>{item.description}</Text>
                      <Text style={styles.lineItemAmount}>
                        {formatCurrency(item.amount, receipt.currency)}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </Card>

            <View style={styles.actionRow}>
              <GoldButton
                title="Split This Expense"
                onPress={handleUseReceipt}
                style={{ flex: 1 }}
              />
              <GoldButton
                title="Rescan"
                onPress={() => pickImage('camera')}
                variant="outline"
                style={{ marginLeft: Spacing.sm }}
              />
            </View>
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
  captureRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  captureBtn: {
    flex: 1,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  captureBtnGradient: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    gap: Spacing.sm,
  },
  captureBtnOutline: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.gold,
    borderRadius: BorderRadius.lg,
  },
  captureIcon: { fontSize: 36 },
  captureBtnText: {
    color: Colors.black,
    fontSize: Typography.sizes.md,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  captureBtnOutlineText: {
    color: Colors.gold,
    fontSize: Typography.sizes.md,
    fontWeight: '700',
  },
  previewCard: {
    padding: 0,
    overflow: 'hidden',
    marginBottom: Spacing.base,
  },
  receiptImage: {
    width: '100%',
    height: 280,
    backgroundColor: Colors.surfaceBg,
  },
  scanningOverlay: {
    alignItems: 'center',
    padding: Spacing.xl,
    gap: Spacing.sm,
    backgroundColor: Colors.black + 'CC',
  },
  scanningText: {
    color: Colors.gold,
    fontSize: Typography.sizes.lg,
    fontWeight: '700',
  },
  scanningSubtext: {
    color: Colors.textSecondary,
    fontSize: Typography.sizes.sm,
  },
  placeholder: {
    alignItems: 'center',
    paddingVertical: Spacing['2xl'],
    paddingHorizontal: Spacing.xl,
  },
  placeholderIcon: {
    fontSize: 72,
    marginBottom: Spacing.base,
  },
  placeholderTitle: {
    color: Colors.textPrimary,
    fontSize: Typography.sizes.xl,
    fontWeight: '800',
    marginBottom: Spacing.sm,
  },
  placeholderText: {
    color: Colors.textSecondary,
    fontSize: Typography.sizes.base,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.xl,
  },
  featureList: {
    gap: Spacing.sm,
    alignSelf: 'stretch',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.surfaceBg,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderColor,
  },
  featureIcon: { fontSize: 22 },
  featureLabel: {
    color: Colors.textSecondary,
    fontSize: Typography.sizes.base,
    fontWeight: '500',
  },
  results: {
    gap: Spacing.base,
  },
  resultsTitle: {
    color: Colors.success,
    fontSize: Typography.sizes.lg,
    fontWeight: '800',
  },
  resultCard: {
    padding: 0,
    overflow: 'hidden',
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: Spacing.base,
    gap: Spacing.md,
  },
  resultBorder: {
    borderTopWidth: 1,
    borderTopColor: Colors.borderColor,
  },
  resultIcon: { fontSize: 22, marginTop: 2 },
  resultContent: { flex: 1 },
  resultLabel: {
    color: Colors.textMuted,
    fontSize: Typography.sizes.xs,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  resultValue: {
    color: Colors.textPrimary,
    fontSize: Typography.sizes.md,
    fontWeight: '700',
  },
  currencyName: {
    color: Colors.textSecondary,
    fontSize: Typography.sizes.sm,
    marginTop: 2,
  },
  usdValue: {
    color: Colors.gold,
    fontSize: Typography.sizes.xl,
    fontWeight: '900',
  },
  rateNote: {
    color: Colors.textMuted,
    fontSize: Typography.sizes.xs,
    marginTop: 4,
  },
  lineItems: {
    padding: Spacing.base,
  },
  lineItemsTitle: {
    color: Colors.textSecondary,
    fontSize: Typography.sizes.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
  },
  lineItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.xs,
  },
  lineItemDesc: {
    color: Colors.textSecondary,
    fontSize: Typography.sizes.sm,
    flex: 1,
  },
  lineItemAmount: {
    color: Colors.textPrimary,
    fontSize: Typography.sizes.sm,
    fontWeight: '600',
  },
  actionRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
});
