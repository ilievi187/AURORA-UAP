import {CATALOG_CHECKED_ON, SOURCE_CATALOG, validateSourceCatalog} from "../_lib/source-catalog.js";

const HEADERS = {"Cache-Control": "public, max-age=300", "X-Content-Type-Options": "nosniff"};

export function onRequestGet({request}) {
  const url = new URL(request.url);
  if ([...url.searchParams.keys()].length) {
    return Response.json({error: "invalid_query"}, {status: 400, headers: {"Cache-Control": "no-store", "X-Content-Type-Options": "nosniff"}});
  }
  const errors = validateSourceCatalog(SOURCE_CATALOG);
  if (errors.length) {
    return Response.json({error: "catalog_invalid"}, {status: 500, headers: {"Cache-Control": "no-store", "X-Content-Type-Options": "nosniff"}});
  }
  return Response.json({
    status: "catalog",
    checked_on: CATALOG_CHECKED_ON,
    count: SOURCE_CATALOG.length,
    notice: "Official RSS and Atom endpoints checked on 2026-10-29. Global news combines Google News with a bounded 12-feed publisher window; official news adds official-institution feeds; Bulgaria news adds Bulgarian publisher feeds. Results are keyword matches, not verified sightings.",
    sources: SOURCE_CATALOG
  }, {headers: HEADERS});
}
