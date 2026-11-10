/**
 * Converts numeric value into words in the Indian numbering system.
 * e.g. 1050 -> "One Thousand Fifty Rupees Only"
 * e.g. 3645.50 -> "Three Thousand Six Hundred Forty Five Rupees and Fifty Paise Only"
 */
export function numberToWordsINR(num) {
  if (isNaN(num) || num === null || num === undefined) return 'Zero Rupees Only';
  let n = Math.round(Number(num) * 100) / 100;
  if (n === 0) return 'Zero Rupees Only';

  const isNegative = n < 0;
  n = Math.abs(n);

  let rupees = Math.floor(n);
  const paise = Math.round((n - rupees) * 100);

  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
                'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
                'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function convertTwoDigits(val) {
    if (val < 20) return ones[val];
    return tens[Math.floor(val / 10)] + (val % 10 > 0 ? ' ' + ones[val % 10] : '');
  }

  function convertThreeDigits(val) {
    let str = '';
    if (Math.floor(val / 100) > 0) {
      str += ones[Math.floor(val / 100)] + ' Hundred';
      if (val % 100 > 0) str += ' ';
    }
    if (val % 100 > 0) {
      str += convertTwoDigits(val % 100);
    }
    return str;
  }

  let words = '';

  // Crores (1,00,00,000)
  const crores = Math.floor(rupees / 10000000);
  rupees %= 10000000;
  if (crores > 0) {
    words += convertThreeDigits(crores) + ' Crore ';
  }

  // Lakhs (1,00,000)
  const lakhs = Math.floor(rupees / 100000);
  rupees %= 100000;
  if (lakhs > 0) {
    words += convertTwoDigits(lakhs) + ' Lakh ';
  }

  // Thousands (1,000)
  const thousands = Math.floor(rupees / 1000);
  rupees %= 1000;
  if (thousands > 0) {
    words += convertTwoDigits(thousands) + ' Thousand ';
  }

  // Hundreds & below
  if (rupees > 0) {
    words += convertThreeDigits(rupees);
  }

  words = words.trim();
  if (!words) words = 'Zero';
  words += ' Rupees';

  if (paise > 0) {
    words += ' and ' + convertTwoDigits(paise) + ' Paise';
  }

  words += ' Only';
  if (isNegative) words = 'Minus ' + words;
  return words;
}

export function formatINR(val) {
  if (isNaN(val) || val === null || val === undefined) return '0.00';
  return Number(val).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}
