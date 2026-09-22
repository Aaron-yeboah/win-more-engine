export function normalizeGhanaPhone(value: string) {
  const digits = value.replace(/\D/g, "");
  if (/^0\d{9}$/.test(digits)) return `233${digits.slice(1)}`;
  if (/^233\d{9}$/.test(digits)) return digits;
  return null;
}

export function phoneEmail(phone: string) {
  return `${phone}@dexecutive.local`;
}
