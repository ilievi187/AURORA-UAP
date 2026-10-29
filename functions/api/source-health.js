import {checkSourceHealth} from "../_lib/source-health.js";
import {REGIONS} from "../_lib/source-catalog.js";

const SECURITY = {"X-Content-Type-Options": "nosniff"};

export async function onRequestGet({request, fetcher} = {}) {
  const url = new URL(request.url);
  const unexpected = [...url.searchParams.keys()].filter((key) => key !== "region");
  if (unexpected.length) {
    return Response.json({error: "invalid_query"}, {status: 400, headers: {"Cache-Control": "no-store", ...SECURITY}});
  }
  const region = url.searchParams.get("region") || "all";
  if (!REGIONS.includes(region)) {
    return Response.json({error: "invalid_region"}, {status: 400, headers: {"Cache-Control": "no-store", ...SECURITY}});
  }
  const result = await checkSourceHealth({region, fetcher});
  const status = result.status === "unavailable" ? 503 : 200;
  const cache = status === 200 ? "public, max-age=120" : "no-store";
  return Response.json(result, {status, headers: {"Cache-Control": cache, ...SECURITY}});
}
