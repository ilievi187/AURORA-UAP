import {reply,unavailable,getStats} from "../_lib/public.js";
export async function onRequestGet({env}){
 if(!env.DB)return unavailable();
 try{return reply(await getStats(env.DB))}
 catch(error){console.error(error);return reply({error:"query_failed"},503)}
}
