/* Conservative locality anchors for PUBLIC source-linked cases.
 * Map center ≠ observation coordinate. No live geocoding, private reports,
 * arbitrary NLP extraction, or false pinpoint precision.
 * Extend only with a reviewed place and explicit source-location phrase. */
const PLACES = [
  {place:"Colorado Springs, Colorado", country:"US", lat:38.8, lng:-104.8, level:"city-area",
   city:/\bcolorado springs\b/i, summary:/\bnear colorado springs\b/i},
  {place:"Eglin Air Force Base area, Florida", country:"US", lat:30.5, lng:-86.5, level:"local-area",
   city:/\beglin (?:afb|air force base)\b/i, summary:/\bnear eglin (?:afb|air force base)\b/i},
  {place:"Alaska, United States (regional reference)", country:"US", lat:64, lng:-153, level:"large-region",
   city:/\balaska\b/i, summary:/\bover alaska\b/i},
  {place:"Southern California offshore", country:"US", lat:31.7, lng:-118.2, level:"coastal-region",
   city:/\boff (?:southern )?california\b/i, summary:/\boff southern california\b/i},
  {place:"U.S. East Coast offshore", country:"US", lat:35, lng:-72, level:"coastal-region",
   city:/\b(?:u\.s\.|us|united states) east coast\b/i,
   summary:/\boff the (?:u\.s\.|us|united states) east coast\b/i},
  {place:"Northeastern United States", country:"US", lat:42.5, lng:-74, level:"large-region",
   city:/\bnortheastern united states\b/i, summary:/\b(?:from|in|over) the northeastern united states\b/i},
  {place:"Western United States", country:"US", lat:39, lng:-112, level:"large-region",
   city:/\bwestern (?:us|united states)\b/i,
   title:/^(?:western united states|western us event)$/i},
  {place:"Southeast Asia (broad regional reference)", country:"", lat:12, lng:108, level:"large-region",
   city:/\bsoutheast asia\b/i,
   title:/^southeast asia triangles$/i}
];
const text = value => typeof value === "string" ? value.trim() : value?.en || "";
export function withApproximateMapAnchor(record) {
  if(!record || typeof record !== "object") return record;
  // Original source coordinates always win. Never change measured or publisher coordinates.
  if(Number.isFinite(record.lat) && Number.isFinite(record.lng) &&
      Math.abs(record.lat)<=90 && Math.abs(record.lng)<=180) return record;
  // Never anchor an explicitly redacted site or a location marked unknown.
  const city = text(record.city);
  if(/\b(?:blacked out|redacted|no pin|not known|undisclosed|classified location)\b/i.test(city)) return record;
  const summary = text(record.summary), title = text(record.title);
  for(const place of PLACES) {
    const match = (place.city?.test(city) && "source city/region") ||
      (place.summary?.test(summary) && "published case summary") ||
      (place.title?.test(title) && "published case title");
    if(!match) continue;
    return {
      ...record, lat:place.lat, lng:place.lng, country:record.country || place.country,
      location_precision:"Approximate "+place.level+" anchor: "+place.place+
        ". Based on "+match+"; NOT an observed object position or flight track.",
      location_precision_bg:"Ориентировъчен район: "+place.place+
        ". Изведен от "+match+"; НЕ е измерена позиция на обекта.",
      map_anchor:{kind:"approximate_source_locality",place:place.place,
        level:place.level,basis:match,not_observation_coordinates:true}
    };
  }
  return record;
}
