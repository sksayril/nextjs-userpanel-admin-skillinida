/** All 23 administrative districts of West Bengal (alphabetical). */
export const WEST_BENGAL_DISTRICTS = [
  "Alipurduar",
  "Bankura",
  "Birbhum",
  "Cooch Behar",
  "Dakshin Dinajpur",
  "Darjeeling",
  "Hooghly",
  "Howrah",
  "Jalpaiguri",
  "Jhargram",
  "Kalimpong",
  "Kolkata",
  "Malda",
  "Murshidabad",
  "Nadia",
  "North 24 Parganas",
  "Paschim Bardhaman",
  "Paschim Medinipur",
  "Purba Bardhaman",
  "Purba Medinipur",
  "Purulia",
  "South 24 Parganas",
  "Uttar Dinajpur",
] as const;

export type WestBengalDistrict = (typeof WEST_BENGAL_DISTRICTS)[number];

export function isValidWestBengalDistrict(value: string): value is WestBengalDistrict {
  return (WEST_BENGAL_DISTRICTS as readonly string[]).includes(value);
}
