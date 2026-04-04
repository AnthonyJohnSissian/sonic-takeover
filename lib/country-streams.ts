/**
 * Country stream data and ISO 3166-1 numeric mapping
 * for the D3 choropleth world map.
 */

// Stream counts by country name
export const COUNTRY_STREAMS: Record<string, number> = {
  Australia: 350,
  "United States of America": 16,
  India: 10,
  Indonesia: 9,
  "United Kingdom": 7,
  Canada: 5,
  Singapore: 4,
  Brazil: 3,
  Egypt: 3,
  "Costa Rica": 2,
  Germany: 2,
  France: 2,
  "Hong Kong": 2,
  Mexico: 2,
  Turkey: 2,
  Vanuatu: 2,
  "United Arab Emirates": 1,
  Bulgaria: 1,
  Chile: 1,
  Colombia: 1,
  "Dominican Republic": 1,
  Ethiopia: 1,
  Ireland: 1,
  Kenya: 1,
  Nigeria: 1,
  Netherlands: 1,
  Norway: 1,
  Nepal: 1,
  Portugal: 1,
  Sweden: 1,
  "Sierra Leone": 1,
  Thailand: 1,
  Tunisia: 1,
  Ukraine: 1,
  "South Africa": 1,
};

// City dots with pulsing animation
export interface CityDot {
  name: string;
  lat: number;
  lng: number;
}

export const CITY_DOTS: CityDot[] = [
  { name: "Sydney", lat: -33.8688, lng: 151.2093 },
  { name: "Brisbane", lat: -27.4698, lng: 153.0251 },
  { name: "Toronto", lat: 43.6532, lng: -79.3832 },
  { name: "Melbourne", lat: -37.8136, lng: 144.9631 },
  { name: "Perth", lat: -31.9505, lng: 115.8605 },
  { name: "Jakarta", lat: -6.2088, lng: 106.8456 },
  { name: "London", lat: 51.5074, lng: -0.1278 },
  { name: "Nairobi", lat: -1.2921, lng: 36.8219 },
  { name: "North Pole", lat: 64.7511, lng: -147.3536 },
  { name: "Ismailia", lat: 30.5965, lng: 32.2715 },
];

/**
 * Get gold intensity color based on stream count.
 * 1 stream:  #3d3000
 * 5 streams: #7a6000
 * 10 streams: #b89000
 * 20+ streams: #D4AF37
 */
export function getStreamColor(count: number): string {
  if (count >= 20) return "#D4AF37";
  if (count >= 10) return "#b89000";
  if (count >= 5) return "#7a6000";
  if (count >= 1) return "#3d3000";
  return "#1a1a1a";
}

// Total countries
export const TOTAL_COUNTRIES = Object.keys(COUNTRY_STREAMS).length;
