// utils/phoneUtils.js

/* ===========================================
   CLEAN PHONE NUMBER (GLOBAL SMART PARSER)
   Supports:
   - +91 98765 43210
   - 9876543210
   - (987) 654-3210
   - 0044 7911 123456
   - 1 (222) 333 4444
=========================================== */
export const cleanPhone = (number, defaultCountry = "91") => {
  if (!number) return null;

  let cleaned = number.toString().trim().replace(/[^0-9]/g, "");

  // If 00-prefixed international number → remove leading "00"
  if (cleaned.startsWith("00")) {
    cleaned = cleaned.substring(2);
  }

  // Remove leading zero when number is longer (India specific)
  if (cleaned.startsWith("0") && cleaned.length > 10) {
    cleaned = cleaned.substring(1);
  }

  // If 10-digit number → assume default country
  if (cleaned.length === 10) {
    cleaned = defaultCountry + cleaned;
  }

  return cleaned;
};

/* ===========================================
   CONVERT TO BAILEYS JID
=========================================== */
export const toJID = (phone, defaultCountry = "91") => {
  const cleaned = cleanPhone(phone, defaultCountry);
  if (!cleaned) return null;
  return `${cleaned}@s.whatsapp.net`;
};

/* ===========================================
   CHECK IF NUMBER LOOKS VALID
=========================================== */
export const isValidPhone = (number) => {
  const cleaned = cleanPhone(number);
  return cleaned && cleaned.length >= 10;
};
