import {countryCode} from "../_lib/public.js";
// Serve ONE accessible template for every ISO 3166-1 alpha-2 country path.
export async function onRequestGet({request,params,env}){
 const code=countryCode(params.code);
 if(!code)return new Response("Invalid country code",{status:400,headers:{"Cache-Control":"no-store"}});
 const url=new URL(request.url);url.pathname="/country.html";url.search="";
 const response=await env.ASSETS.fetch(new Request(url.toString(),{method:"GET"}));
 return new Response(response.body,{status:response.status,headers:response.headers});
}
