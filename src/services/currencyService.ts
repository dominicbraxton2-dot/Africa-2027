import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_KEY = 'exchange_rates';
const CACHE_EXPIRY = 6 * 60 * 60 * 1000; // 6 hours

// Uses open.er-api.com (free, no auth required)
const API_URL = 'https://open.er-api.com/v6/latest/USD';

interface RatesCache {
  rates: Record<string, number>;
  timestamp: number;
  base: string;
}

export async function getExchangeRates(): Promise<Record<string, number>> {
  try {
    const cached = await AsyncStorage.getItem(CACHE_KEY);
    if (cached) {
      const data: RatesCache = JSON.parse(cached);
      if (Date.now() - data.timestamp < CACHE_EXPIRY) {
        return data.rates;
      }
    }
  } catch {}

  try {
    const response = await fetch(API_URL);
    const data = await response.json();
    if (data.rates) {
      const cache: RatesCache = {
        rates: data.rates,
        timestamp: Date.now(),
        base: 'USD',
      };
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(cache));
      return data.rates;
    }
  } catch {}

  // Fallback static rates (approximate as of 2024)
  return {
    TZS: 2520,
    ZAR: 18.5,
    USD: 1,
    EUR: 0.92,
    GBP: 0.79,
  };
}

export async function convertToUSD(amount: number, currency: string): Promise<{
  usdAmount: number;
  rate: number;
}> {
  if (currency === 'USD') return { usdAmount: amount, rate: 1 };
  const rates = await getExchangeRates();
  const rate = rates[currency] || 1;
  return {
    usdAmount: amount / rate,
    rate,
  };
}

export async function convertFromUSD(amount: number, currency: string): Promise<number> {
  if (currency === 'USD') return amount;
  const rates = await getExchangeRates();
  const rate = rates[currency] || 1;
  return amount * rate;
}

export function detectCurrency(text: string): string {
  const upper = text.toUpperCase();
  if (upper.includes('TZS') || upper.includes('TSH') || upper.includes('SHILLING')) return 'TZS';
  if (upper.includes('ZAR') || upper.includes('RAND') || upper.includes('R ')) return 'ZAR';
  if (upper.includes('EUR') || upper.includes('€')) return 'EUR';
  if (upper.includes('GBP') || upper.includes('£')) return 'GBP';
  return 'USD';
}

export function formatCurrency(amount: number, currency: string = 'USD'): string {
  if (currency === 'USD') return `$${amount.toFixed(2)}`;
  if (currency === 'TZS') return `TZS ${Math.round(amount).toLocaleString()}`;
  if (currency === 'ZAR') return `R ${amount.toFixed(2)}`;
  if (currency === 'EUR') return `€${amount.toFixed(2)}`;
  if (currency === 'GBP') return `£${amount.toFixed(2)}`;
  return `${currency} ${amount.toFixed(2)}`;
}
