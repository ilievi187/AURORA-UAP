// Bundled locally for AURORA. Never load auth JS from a third-party CDN at runtime.
import {createClient} from "@supabase/supabase-js";
window.AURORAReportAuth={
 create(url,publishableKey){
  return createClient(url,publishableKey,{
   auth:{autoRefreshToken:true,persistSession:true,detectSessionInUrl:true,flowType:"pkce"},
   global:{headers:{"X-Client-Info":"aurora-reporter-web"}}
  });
 }
};
