/** Read only PUBLIC precomputed SEO indexes from Cloudflare Pages assets. */
export const SEO_HEADERS={"Cache-Control":"public, max-age=60","X-Content-Type-Options":"nosniff"};
export const shardFor=id=>{let h=2166136261;for(let i=0;i<id.length;i++)h=Math.imul(h^id.charCodeAt(i),16777619)>>>0;return String(h%64).padStart(2,'0')};
export const escapeHtml=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export async function publicAssetJSON(request,env,path){
 if(!env?.ASSETS?.fetch)throw Error('Missing static asset binding');
 const u=new URL(request.url);u.pathname=path;u.search='';
 const response=await env.ASSETS.fetch(new Request(u.toString()));
 if(!response.ok)throw Error('Public SEO index unavailable');
 return response.json();
}
export async function public404(request,env){
 try{
  const url=new URL(request.url);url.pathname='/404.html';url.search='';
  const r=await env.ASSETS.fetch(new Request(url.toString()));
  if(r.ok)return new Response(r.body,{status:404,headers:{...SEO_HEADERS,'Content-Type':'text/html; charset=utf-8','X-Robots-Tag':'noindex, nofollow'}});
 }catch{}
 return new Response('404 — Public page not found',{status:404,headers:{...SEO_HEADERS,'X-Robots-Tag':'noindex, nofollow'}});
}
export function dossierMarkup(html,id,metadata){
 if(!html.includes('<meta name="robots" content="noindex,nofollow">'))throw Error('Dossier template SEO marker missing');
 const canonical='https://aurorauap.org/archive/'+encodeURIComponent(id);
 const title=metadata?.title?.trim()||'Source archive dossier '+id;
 const description=metadata?.summary?.trim().slice(0,200)||'AURORA UAP public source-linked case archive.';
 const indexable=metadata?.indexable===true;
 const og= indexable
  ? `<meta property="og:type" content="article"><meta property="og:title" content="${escapeHtml(title+' | AURORA UAP')}"><meta property="og:description" content="${escapeHtml(description)}"><meta property="og:url" content="${canonical}"><meta name="twitter:card" content="summary">` : '';
 const head=`<link rel="canonical" href="${canonical}">`+og;
 let page=html.replace('<meta name="robots" content="noindex,nofollow">',`<meta name="robots" content="${indexable?'index,follow':'noindex,follow'}">${head}`)
  .replace(/<title>[^<]*<\/title>/,`<title>${escapeHtml(title+' | AURORA UAP')}</title>`)
  .replace(/<meta name="description" content="[^"]*">/,`<meta name="description" content="${escapeHtml(description)}">`);
 if(indexable&&metadata?.source){
  const snippet=`<section class="dossier-server-summary" id="serverDossierIntro" aria-label="Source-backed case summary"><h2>${escapeHtml(title)}</h2><p>${escapeHtml(metadata.summary)}</p><p>Source document: <a href="${escapeHtml(metadata.source)}" rel="noopener noreferrer" target="_blank">Original public reference</a></p></section>`;
  const marker='<!-- AURORA SERVER DOSSIER SUMMARY -->';
  if(!page.includes(marker))throw Error('Dossier excerpt marker missing');
  page=page.replace(marker,snippet);
 }
 return page;
}
