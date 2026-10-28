import {intakeEnabled,intakeSchemaReady} from "../../_lib/intake.js";
export async function onRequestGet({request,env}){
 const hostname=new URL(request.url).hostname;
 const accepting=intakeEnabled(env,hostname)&&await intakeSchemaReady(env.DB);
 return Response.json({
  accepting,
  mode:accepting?"text_only_quarantine":"local_draft_only",
  attachments_enabled:false,contact_collection_enabled:false,automatic_publication:false,
  ...(accepting?{site_key:env.AURORA_TURNSTILE_SITE_KEY,policy_version:env.AURORA_INTAKE_POLICY_VERSION,policy_url:env.AURORA_INTAKE_POLICY_URL}: {})
 },{status:200,headers:{"Cache-Control":"no-store","X-Content-Type-Options":"nosniff"}});
}
