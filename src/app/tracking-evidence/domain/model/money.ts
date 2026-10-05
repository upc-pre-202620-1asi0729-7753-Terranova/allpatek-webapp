export function parseMoney(value: string): number {
  const cleaned = value.replace(/[^\d,.]/g, '');
  if (!cleaned) {
    return Number.NaN;
  }
  if (cleaned.includes(',') && cleaned.includes('.')) {
    return Number(cleaned.replace(/,/g, ''));
  }
  if (cleaned.includes(',')) {
    const [whole, fraction = ''] = cleaned.split(',');
    if (fraction.length > 0 && fraction.length <= 2) {
      return Number(`${whole.replace(/\./g, '')}.${fraction}`);
    }
    return Number(cleaned.replace(/,/g, ''));
  }
  return Number(cleaned);
}

export function formatMoney(amount: number): string {
  return `S/ ${amount.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function moneyShares(value: string): string[] {
  const amount = parseMoney(value);
  if (!Number.isFinite(amount)) {
    return ['—', '—', '—', '—'];
  }
  const cents = Math.round(amount * 100);
  const part = Math.floor(cents / 4);
  return [part, part, part, cents - part * 3].map((share) => formatMoney(share / 100));
}
