// src/utils/currency.ts
export const formatCurrency = (value: number | string) => {
  const num = typeof value === 'string' ? parseFloat(value.replace(/\./g, '').replace(',', '.')) : value;
  return new Intl.NumberFormat('es-EC', {
    style: 'currency',
    currency: 'USD',
  }).format(num);
};

export const parsePrice = (priceString: string): number => {
    if (!priceString) return 0;
    // Remove dots (thousands) and replace comma with dot (decimal)
    // E.g. "1.028,00" -> 1028.00
    // "27,00" -> 27.00
    const clean = priceString.replace(/\./g, '').replace(',', '.');
    return parseFloat(clean);
}
