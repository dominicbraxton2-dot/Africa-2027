import { ReceiptData } from '../types';
import { detectCurrency } from './currencyService';

const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY || '';

export async function scanReceiptWithVision(base64Image: string): Promise<ReceiptData> {
  if (!OPENAI_API_KEY) {
    return parseFallback('');
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        max_tokens: 500,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Extract receipt data from this image. Return JSON with these fields:
{
  "merchant": "store/restaurant name",
  "date": "YYYY-MM-DD or null",
  "currency": "3-letter currency code (TZS, ZAR, USD, EUR, GBP)",
  "total": number (numeric amount only),
  "line_items": [{"description": "item name", "amount": number}],
  "raw_text": "full text from receipt"
}
Detect the currency from symbols or text. TZS for Tanzanian Shilling, ZAR for South African Rand.`,
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${base64Image}`,
                  detail: 'high',
                },
              },
            ],
          },
        ],
      }),
    });

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]) as ReceiptData;
    }
  } catch (err) {
    console.error('OCR error:', err);
  }

  return parseFallback('');
}

function parseFallback(text: string): ReceiptData {
  return {
    merchant: undefined,
    date: new Date().toISOString().split('T')[0],
    currency: detectCurrency(text),
    total: undefined,
    line_items: [],
    raw_text: text,
  };
}
