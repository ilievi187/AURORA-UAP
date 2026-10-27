import {reply,unavailable,invalid,getCases} from "../_lib/public.js";
export async function onRequestGet({request,env}){
 if(!env.DB)return unavailable();
 try{return reply(await getCases(env.DB,new URL(request.url).searchParams))}
 catch(error){if(String(error.message).startsWith("Invalid")||String(error.message).startsWith("Pagination")||String(error.message).startsWith("Only"))return invalid(error.message);console.error("cases query failed",error);return reply({error:"query_failed"},503)}
}
