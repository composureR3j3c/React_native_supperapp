// Encodes coordinates as a full 10-digit Open Location Code (Plus Code), e.g. "8FVC9G8F+6X" (~14m x 14m).
// Mirrors the integer math of Google's reference encoder: https://github.com/google/open-location-code
const ALPHABET = '23456789CFGHJMPQRVWX';
const BASE = ALPHABET.length;
const PAIR_COUNT = 5;
// Reference precision is 15 digits: 5 pairs, then 5 grid digits of 5 rows x 4 columns each.
const GRID_LAT_FACTOR = 5 ** 5;
const GRID_LNG_FACTOR = 4 ** 5;
const LAT_PRECISION = BASE ** 3 * GRID_LAT_FACTOR;
const LNG_PRECISION = BASE ** 3 * GRID_LNG_FACTOR;

// Clears float noise before flooring, e.g. -37.014 * 25e6 = -925350000.0000001 must stay -925350000.
function toInteger(value) {
  return Math.floor(Math.round(value * 1e6) / 1e6);
}

export function encodePlusCode(latitude, longitude) {
  const latMax = 180 * LAT_PRECISION;
  const lngRange = 360 * LNG_PRECISION;

  let latValue = toInteger(latitude * LAT_PRECISION) + 90 * LAT_PRECISION;
  latValue = Math.min(Math.max(latValue, 0), latMax - 1);
  let lngValue = (toInteger(longitude * LNG_PRECISION) + 180 * LNG_PRECISION) % lngRange;
  if (lngValue < 0) lngValue += lngRange;

  latValue = Math.floor(latValue / GRID_LAT_FACTOR);
  lngValue = Math.floor(lngValue / GRID_LNG_FACTOR);

  let code = '';
  for (let i = 0; i < PAIR_COUNT; i += 1) {
    code = ALPHABET[latValue % BASE] + ALPHABET[lngValue % BASE] + code;
    latValue = Math.floor(latValue / BASE);
    lngValue = Math.floor(lngValue / BASE);
  }
  return `${code.slice(0, 8)}+${code.slice(8)}`;
}
