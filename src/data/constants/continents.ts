import type { ContinentName, ISO3Code } from "../../types/index.ts";

export const ISO3_TO_CONTINENT: Record<string, ContinentName> = {
  // Europe
  ALB: "Europe", AND: "Europe", AUT: "Europe", BLR: "Europe", BEL: "Europe", BIH: "Europe", BGR: "Europe",
  HRV: "Europe", CYP: "Europe", CZE: "Europe", DNK: "Europe", EST: "Europe", FIN: "Europe", FRA: "Europe",
  DEU: "Europe", GRC: "Europe", HUN: "Europe", ISL: "Europe", IRL: "Europe", ITA: "Europe", XKX: "Europe",
  LVA: "Europe", LIE: "Europe", LTU: "Europe", LUX: "Europe", MLT: "Europe", MDA: "Europe", MCO: "Europe",
  MNE: "Europe", NLD: "Europe", MKD: "Europe", NOR: "Europe", POL: "Europe", PRT: "Europe", ROU: "Europe",
  RUS: "Europe", SMR: "Europe", SRB: "Europe", SVK: "Europe", SVN: "Europe", ESP: "Europe", SWE: "Europe",
  CHE: "Europe", UKR: "Europe", GBR: "Europe", VAT: "Europe", GIB: "Europe", FRO: "Europe", IMN: "Europe",
  JEY: "Europe", GGY: "Europe", ALA: "Europe", SJM: "Europe",

  // Asia
  AFG: "Asia", ARM: "Asia", AZE: "Asia", BHR: "Asia", BGD: "Asia", BTN: "Asia", BRN: "Asia", KHM: "Asia",
  CHN: "Asia", GEO: "Asia", HKG: "Asia", IND: "Asia", IDN: "Asia", IRN: "Asia", IRQ: "Asia", ISR: "Asia",
  JPN: "Asia", JOR: "Asia", KAZ: "Asia", KWT: "Asia", KGZ: "Asia", LAO: "Asia", LBN: "Asia", MAC: "Asia",
  MYS: "Asia", MDV: "Asia", MNG: "Asia", MMR: "Asia", NPL: "Asia", PRK: "Asia", OMN: "Asia", PAK: "Asia",
  PSE: "Asia", PHL: "Asia", QAT: "Asia", SAU: "Asia", SGP: "Asia", KOR: "Asia", LKA: "Asia", SYR: "Asia",
  TWN: "Asia", TJK: "Asia", THA: "Asia", TLS: "Asia", TUR: "Asia", TKM: "Asia", ARE: "Asia", UZB: "Asia",
  VNM: "Asia", YEM: "Asia", IOT: "Asia",

  // Africa
  DZA: "Africa", AGO: "Africa", BEN: "Africa", BWA: "Africa", BFA: "Africa", BDI: "Africa", CPV: "Africa",
  CMR: "Africa", CAF: "Africa", TCD: "Africa", COM: "Africa", COD: "Africa", COG: "Africa", CIV: "Africa",
  DJI: "Africa", EGY: "Africa", GNQ: "Africa", ERI: "Africa", SWZ: "Africa", ETH: "Africa", GAB: "Africa",
  GMB: "Africa", GHA: "Africa", GIN: "Africa", GNB: "Africa", KEN: "Africa", LSO: "Africa", LBR: "Africa",
  LBY: "Africa", MDG: "Africa", MWI: "Africa", MLI: "Africa", MRT: "Africa", MUS: "Africa", MAR: "Africa",
  MOZ: "Africa", NAM: "Africa", NER: "Africa", NGA: "Africa", RWA: "Africa", STP: "Africa", SEN: "Africa",
  SYC: "Africa", SLE: "Africa", SOM: "Africa", ZAF: "Africa", SSD: "Africa", SDN: "Africa", TZA: "Africa",
  TGO: "Africa", TUN: "Africa", UGA: "Africa", ZMB: "Africa", ZWE: "Africa", ESH: "Africa", MYT: "Africa",
  REU: "Africa", SHN: "Africa",

  // North America
  ATG: "North America", BHS: "North America", BRB: "North America", BLZ: "North America", CAN: "North America",
  CRI: "North America", CUB: "North America", DMA: "North America", DOM: "North America", SLV: "North America",
  GRL: "North America", GRD: "North America", GTM: "North America", HTI: "North America", HND: "North America",
  JAM: "North America", MEX: "North America", NIC: "North America", PAN: "North America", KNA: "North America",
  LCA: "North America", VCT: "North America", TTO: "North America", USA: "North America", BMU: "North America",
  CYM: "North America", PRI: "North America", VIR: "North America", ABW: "North America", CUW: "North America",
  SXM: "North America", AIA: "North America", VGB: "North America", TCA: "North America", SPM: "North America",
  MSR: "North America", GLP: "North America", MTQ: "North America", BLM: "North America", MAF: "North America",
  UMI: "North America",

  // South America
  ARG: "South America", BOL: "South America", BRA: "South America", CHL: "South America", COL: "South America",
  ECU: "South America", GUY: "South America", PRY: "South America", PER: "South America", SUR: "South America",
  URY: "South America", VEN: "South America", FLK: "South America", GUF: "South America", SGS: "South America",

  // Oceania
  AUS: "Oceania", FJI: "Oceania", KIR: "Oceania", MHL: "Oceania", FSM: "Oceania", NRU: "Oceania",
  NZL: "Oceania", PLW: "Oceania", PNG: "Oceania", WSM: "Oceania", SLB: "Oceania", TON: "Oceania",
  TUV: "Oceania", VUT: "Oceania", NCL: "Oceania", PYF: "Oceania", WLF: "Oceania", COK: "Oceania",
  NIU: "Oceania", ASM: "Oceania", GUM: "Oceania", MNP: "Oceania", TKL: "Oceania", PCN: "Oceania",
  NFK: "Oceania", HMD: "Oceania", ATF: "Oceania", ATA: "Oceania"
};

export function getContinentForIso(iso: string | ISO3Code): ContinentName {
  if (!iso) return "World";
  const normalized = iso.toUpperCase().trim();
  return ISO3_TO_CONTINENT[normalized] || "World";
}
