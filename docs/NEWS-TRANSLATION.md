# AURORA — Automatic headline translation

## Cloudflare Pages production setup

AURORA translates fetched source headlines to the visitor's previously selected website language. The translator is **Cloudflare Workers AI**, Meta model `@cf/meta/m2m100-1.2b`.

Cloudflare Pages project admin action **required**:

1. Cloudflare Dashboard → Workers & Pages → the AURORA Pages project → Settings.
2. Under **Production** → Bindings, select **Add** → **Workers AI**.
3. Set the binding variable name to **AI**.
4. Save and redeploy the latest **main** commit.
5. For PR previews, create the same AI binding separately under **Preview**, if desired.

Official setup: https://developers.cloudflare.com/pages/functions/bindings/#workers-ai

With the binding absent, translations cannot be generated. The site instead shows original headlines with a clear unavailable indicator — it does **not** silently claim the headlines were translated. Do not declare production translation working until live endpoint verification succeeds.

## Test the production integration

Open `https://aurorauap.org/api/news?edition=global&lang=bg&offset=0` and inspect `translation.status`: it should be `translated` (or `original` if all twelve titles were already in Bulgarian). At least one English source article should gain `translated_title` while keeping its `title`, `url` and `source`.

Switch the website language to Spanish and verify `lang=es` appears in the network request and the rendered headlines. The article opens at the publisher; expandable text exposes the original title.

## Cost and integrity controls

- Only fixed Google News RSS upstream headlines can be translated. No arbitrary user text endpoint exists.
- Translation is limited to **12 headlines per request**. Clicking Show More requests the next batch on demand.
- Translation requests run with at most **3 concurrent model calls**.
- 18 allowed target languages. Original source language is approximated from Google News feed locale; some articles may be in another language.
- Successful translations cache by edition, source snapshot, target and offset at the Cloudflare edge. Browser snapshots are also keyed by edition *and* selected locale.
- If inference fails, the original article title remains visible; partial translations are not misrepresented as complete.
- Workers AI uses account quotas and may incur costs. Review current pricing: https://developers.cloudflare.com/workers-ai/platform/pricing/

Use `npm run test:feeds` and `npm run test:browser` for checks. All headline results remain source-attributed and retain their original URLs.
