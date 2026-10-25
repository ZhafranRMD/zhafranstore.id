// Daftar Kode Promo Diskon Resmi Zhafranstore.id
export const promoCodes = {
  "indonesiastore": {
    code: "indonesiastore",
    discountPercent: 10,
    description: "Diskon 10% Spesial Indonesia Store"
  },
  "konhacestore": {
    code: "konhacestore",
    discountPercent: 15,
    description: "Diskon 15% Spesial Konhace Store"
  },
  "capiy142owner": {
    code: "capiy142owner",
    discountPercent: 25,
    description: "Diskon 25% VIP Owner Privilege"
  },
  "4storezhafran": {
    code: "4storezhafran",
    discountPercent: 10,
    description: "Diskon 10% Spesial Store Zhafran"
  },
  "CHALLENGE1K": {
    code: "CHALLENGE1K",
    discountPercent: 10,
    description: "Hadiah Challenge 1K Views Creator Video"
  }
};

export const validAdminCodes = [
  "zhafranstoreindonesia",
  "indonesiastore",
  "konhacestore",
  "capiy142owner",
  "4storezhafran"
];

export function validatePromo(code) {
  if (!code) return null;
  const clean = code.trim().toLowerCase();
  return promoCodes[clean] || promoCodes[code.trim()] || null;
}
