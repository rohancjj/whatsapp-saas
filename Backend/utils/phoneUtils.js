
export const cleanPhone = (number, defaultCountry = "91") => {
  if (!number) return null;

  let cleaned = number.toString().trim().replace(/[^0-9]/g, "");


  if (cleaned.startsWith("00")) {
    cleaned = cleaned.substring(2);
  }

  
  if (cleaned.startsWith("0") && cleaned.length > 10) {
    cleaned = cleaned.substring(1);
  }

  
  if (cleaned.length === 10) {
    cleaned = defaultCountry + cleaned;
  }

  return cleaned;
};


export const toJID = (phone, defaultCountry = "91") => {
  const cleaned = cleanPhone(phone, defaultCountry);
  if (!cleaned) return null;
  return `${cleaned}@s.whatsapp.net`;
};


export const isValidPhone = (number) => {
  const cleaned = cleanPhone(number);
  return cleaned && cleaned.length >= 10;
};
