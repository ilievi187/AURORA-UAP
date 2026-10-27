// Public legacy historical reference dossiers. Not a D1 route.
export async function onRequestGet({request,params,env}){
 if(typeof params.id!=="string"||!/^[a-z0-9-]{3,90}$/.test(params.id))
  return new Response("Invalid archive ID",{status:400,headers:{"Cache-Control":"no-store"}});
 const url=new URL(request.url);url.pathname="/dossier";url.search="";
 const asset=await env.ASSETS.fetch(new Request(url.href));
 return new Response(asset.body,{status:asset.status,headers:asset.headers});
}
