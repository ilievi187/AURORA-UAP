import {reply,unavailable,invalid,countryStats} from "../../_lib/public.js";
export async function onRequestGet({env,params}){
 if(!env.DB)return unavailable();
 try{return reply(await countryStats(env.DB,params.code))}
 catch(error){if(String(error.message).startsWith("Invalid"))return invalid(error.message);console.error(error);return reply({error:"query_failed"},503)}
}
