const countryLengths = {
  AD: 24, AL: 28, AT: 20, AZ: 28, BA: 20, BE: 16, BG: 22, BH: 22, BR: 29,
  CH: 21, CR: 22, CY: 28, CZ: 24, DE: 22, DK: 18, DO: 28, EE: 20, ES: 24,
  FI: 18, FO: 18, FR: 27, GB: 22, GE: 22, GI: 23, GL: 18, GR: 27, GT: 28,
  HR: 21, HU: 28, IE: 22, IL: 23, IS: 26, IT: 27, JO: 30, KW: 30, KZ: 20,
  LB: 28, LI: 21, LT: 20, LU: 20, LV: 21, MC: 27, MD: 24, ME: 22, MK: 19,
  MR: 27, MT: 31, MU: 30, NL: 18, NO: 15, PK: 24, PL: 28, PS: 29, PT: 25,
  QA: 29, RO: 24, RS: 22, SA: 24, SE: 24, SI: 19, SK: 24, SM: 27, TN: 24,
  TR: 26, UA: 29, VA: 22, VG: 24, XK: 20
};

function validateIban(iban) {
  const ibanUpper = iban.replace(/ /g, '').toUpperCase();
  const countryCode = ibanUpper.substring(0, 2);

  if (!countryLengths[countryCode] || ibanUpper.length !== countryLengths[countryCode]) {
    return false;
  }

  const rearrangedIban = ibanUpper.substring(4) + ibanUpper.substring(0, 4);
  const numericIban = rearrangedIban.replace(/[A-Z]/g, char => char.charCodeAt(0) - 55);

  let remainder = 0;
  for (let i = 0; i < numericIban.length; i += 6) {
    remainder = parseInt(remainder + numericIban.substring(i, i + 6), 10) % 97;
  }

  return remainder === 1;
}

module.exports = { validateIban };