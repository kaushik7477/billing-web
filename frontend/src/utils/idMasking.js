/**
 * Utility to mask sensitive customer ID documents (Aadhaar, Voter ID, PAN, Passport, DL)
 * Masks the first half with 'X' for guest privacy on printed and downloaded bills,
 * while keeping the last 4 characters visible for identification.
 * 
 * Examples:
 * - '4521 8974 6502' -> 'XXXX XXXX 6502'
 * - '4521-8974-6502' -> 'XXXX-XXXX-6502'
 * - '452189746502'   -> 'XXXXXXXX6502'
 * - 'ABCDE1234F'     -> 'XXXXX1234F'
 * - 'WBD1234567'     -> 'XXXXX34567'
 */
export function maskIdNumber(id) {
  if (!id) return '';
  const str = String(id).trim();
  if (str.length <= 4) return str;

  // 12-digit Aadhaar formatted with spaces: '4521 8974 6502' -> 'XXXX XXXX 6502'
  if (/^\d{4}\s\d{4}\s\d{4}$/.test(str)) {
    return `XXXX XXXX ${str.slice(-4)}`;
  }

  // 12-digit Aadhaar formatted with hyphens: '4521-8974-6502' -> 'XXXX-XXXX-6502'
  if (/^\d{4}-\d{4}-\d{4}$/.test(str)) {
    return `XXXX-XXXX-${str.slice(-4)}`;
  }

  // 12 continuous digits: '452189746502' -> 'XXXXXXXX6502'
  if (/^\d{12}$/.test(str)) {
    return `XXXXXXXX${str.slice(-4)}`;
  }

  // General ID (Voter ID, Passport, PAN, Driving Licence):
  // Mask the first half, keeping at least the last 4 characters visible
  const visibleCount = Math.max(4, Math.floor(str.length / 2));
  const maskedCount = str.length - visibleCount;
  let masked = '';
  for (let i = 0; i < maskedCount; i++) {
    const ch = str[i];
    masked += (ch === ' ' || ch === '-' || ch === '/') ? ch : 'X';
  }
  return masked + str.slice(maskedCount);
}

