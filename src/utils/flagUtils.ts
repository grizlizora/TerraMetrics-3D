/**
 * Converts ISO-3166-1 alpha-2 or alpha-3 code to Emoji Flag
 */
const ISO3_TO_ISO2: Record<string, string> = {
  // Europe & North Atlantic
  UKR: 'UA', GBR: 'GB', DEU: 'DE', FRA: 'FR', POL: 'PL', ITA: 'IT', ESP: 'ES', NLD: 'NL',
  BEL: 'BE', AUT: 'AT', PRT: 'PT', GRC: 'GR', CZE: 'CZ', ROU: 'RO', HUN: 'HU', SWE: 'SE',
  NOR: 'NO', FIN: 'FI', DNK: 'DK', IRL: 'IE', CHE: 'CH', BLR: 'BY', MDA: 'MD', BGR: 'BG',
  SRB: 'RS', HRV: 'HR', SVK: 'SK', SVN: 'SI', BIH: 'BA', ALB: 'AL', MKD: 'MK', MNE: 'ME',
  CYP: 'CY', ISL: 'IS', LUX: 'LU', EST: 'EE', LVA: 'LV', LTU: 'LT', MLT: 'MT', AND: 'AD',
  LIE: 'LI', MCO: 'MC', SMR: 'SM', VAT: 'VA', XKX: 'XK', KOS: 'XK', GIB: 'GI', FRO: 'FO',
  IMN: 'IM', JEY: 'JE', GGY: 'GG', RUS: 'RU', ALA: 'AX', SJM: 'SJ',

  // Asia & Middle East
  CHN: 'CN', IND: 'IN', JPN: 'JP', KOR: 'KR', IDN: 'ID', TUR: 'TR', SAU: 'SA', ISR: 'IL',
  SGP: 'SG', THA: 'TH', VNM: 'VN', MYS: 'MY', PHL: 'PH', ARE: 'AE', QAT: 'QA', KWT: 'KW',
  KAZ: 'KZ', UZB: 'UZ', GEO: 'GE', ARM: 'AM', AZE: 'AZ', IRN: 'IR', IRQ: 'IQ', PAK: 'PK',
  BGD: 'BD', AFG: 'AF', LBN: 'LB', JOR: 'JO', OMN: 'OM', YEM: 'YE', SYR: 'SY', LKA: 'LK',
  NPL: 'NP', MMR: 'MM', KHM: 'KH', LAO: 'LA', MNG: 'MN', TWN: 'TW', PRK: 'KP', KGZ: 'KG',
  TJK: 'TJ', TKM: 'TM', MDV: 'MV', BRN: 'BN', BTN: 'BT', TLS: 'TL', PSE: 'PS', BHR: 'BH',
  HKG: 'HK', MAC: 'MO', CYN: 'CY', IOT: 'IO', CXR: 'CX', CCK: 'CC',

  // Americas (North, Central, South, Caribbean)
  USA: 'US', CAN: 'CA', MEX: 'MX', BRA: 'BR', ARG: 'AR', COL: 'CO', CHL: 'CL', PER: 'PE',
  VEN: 'VE', ECU: 'EC', GTM: 'GT', CUB: 'CU', HTI: 'HT', DOM: 'DO', HND: 'HN', PRY: 'PY',
  NIC: 'NI', SLV: 'SV', CRI: 'CR', PAN: 'PA', URY: 'UY', JAM: 'JM', TTO: 'TT', GUY: 'GY',
  SUR: 'SR', BLZ: 'BZ', BHS: 'BS', BRB: 'BB', LCA: 'LC', VCT: 'VC', ATG: 'AG', GRD: 'GD',
  KNA: 'KN', DMA: 'DM', BOL: 'BO', PRI: 'PR', CYM: 'KY', BMU: 'BM', ABW: 'AW', CUW: 'CW',
  SXM: 'SX', VGB: 'VG', VIR: 'VI', GRL: 'GL', FLK: 'FK', GUF: 'GF', MTQ: 'MQ', GLP: 'GP',
  SPM: 'PM', AIA: 'AI', TCA: 'TC', MSR: 'MS', BES: 'BQ', BLM: 'BL', MAF: 'MF',

  // Africa
  NGA: 'NG', ETH: 'ET', EGY: 'EG', COD: 'CD', TZA: 'TZ', ZAF: 'ZA', KEN: 'KE', UGA: 'UG',
  DZA: 'DZ', SDN: 'SD', MAR: 'MA', AGO: 'AO', GHA: 'GH', MOZ: 'MZ', MDG: 'MG', CIV: 'CI',
  CMR: 'CM', NER: 'NE', BFA: 'BF', MLI: 'ML', MWI: 'MW', ZMB: 'ZM', SOM: 'SO', SEN: 'SN',
  TCD: 'TD', ZWE: 'ZW', GIN: 'GN', RWA: 'RW', BEN: 'BJ', BDI: 'BI', TUN: 'TN', SSD: 'SS',
  TGO: 'TG', SLE: 'SL', LBY: 'LY', COG: 'CG', LBR: 'LR', CAF: 'CF', MRT: 'MR', ERI: 'ER',
  NAM: 'NA', GMB: 'GM', BWA: 'BW', GAB: 'GA', LSO: 'LS', GNB: 'GW', GNQ: 'GQ', MUS: 'MU',
  SWZ: 'SZ', DJI: 'DJ', COM: 'KM', CPV: 'CV', STP: 'ST', SYC: 'SC', MYT: 'YT', REU: 'RE',
  SHN: 'SH', ESH: 'EH', SOL: 'SO',

  // Oceania
  AUS: 'AU', NZL: 'NZ', PNG: 'PG', FJI: 'FJ', SLB: 'SB', VUT: 'VU', WSM: 'WS', KIR: 'KI',
  FSM: 'FM', TON: 'TO', MHL: 'MH', PLW: 'PW', COK: 'CK', NRU: 'NR', TUV: 'TV', NIU: 'NU',
  NCL: 'NC', PYF: 'PF', GUM: 'GU', MNP: 'MP', ASM: 'AS', WLF: 'WF', NFK: 'NF', PCN: 'PN',
  UMI: 'UM',

  // Antarctica & Subantarctic
  ATA: 'AQ', ATF: 'TF', SGS: 'GS', BVT: 'BV', HMD: 'HM',
};

export function getCountryFlag(isoCode?: string): string {
  if (!isoCode) return '🌐';
  const clean = isoCode.trim().toUpperCase();

  let iso2 = clean;
  if (clean.length === 3) {
    iso2 = ISO3_TO_ISO2[clean] || '';
  }

  if (iso2.length === 2 && /^[A-Z]{2}$/.test(iso2)) {
    const codePoints = [...iso2].map((c) => 127397 + c.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
  }

  return '🌐';
}
