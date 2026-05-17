import twilio from 'twilio';

let cached: ReturnType<typeof twilio> | null = null;

function client() {
  if (cached) return cached;
  const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN } = process.env;
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
    throw new Error('Twilio credentials missing');
  }
  cached = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
  return cached;
}

export async function sendSms(to: string, body: string) {
  if (process.env.NODE_ENV !== 'production' && !process.env.TWILIO_ACCOUNT_SID) {
    console.log(`[sms:dev] -> ${to}: ${body}`);
    return;
  }
  const from = process.env.TWILIO_FROM_NUMBER;
  if (!from) throw new Error('TWILIO_FROM_NUMBER missing');
  await client().messages.create({ to, from, body });
}

const E164 = /^\+[1-9]\d{7,14}$/;

export function normalizePhone(input: string): string | null {
  const digits = input.replace(/[^\d+]/g, '');
  if (digits.startsWith('+')) return E164.test(digits) ? digits : null;
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  return null;
}

export function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}
