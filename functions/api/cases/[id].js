import {reply,unavailable,invalid,getCase} from "../../_lib/public.js";
export async function onRequestGet({env,params}){
 if(!env.DB||env.AURORA_REGISTRY_PUBLIC!=="enabled")return unavailable();
 try{const item=await getCase(env.DB,params.id);return item?reply(item):reply({error:"not_found"},404)}
 catch(error){if(String(error.message).startsWith("Invalid"))return invalid(error.message);console.error(error);return reply({error:"query_failed"},503)}
}
