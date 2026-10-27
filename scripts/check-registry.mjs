import {verifyDeployment} from "./verify-registry.mjs";

function getArgs(argv){
 const values=new Map();
 for(let i=0;i<argv.length;i+=2){
  const key=argv[i];
  if(!["--base","--mode"].includes(key)||!argv[i+1]||values.has(key))throw Error("Usage: node scripts/check-registry.mjs --base https://aurorauap.org --mode staged|active");
  values.set(key,argv[i+1]);
 }
 if(values.size!==2)throw Error("Expected --base and --mode");
 return {base:values.get("--base"),mode:values.get("--mode")};
}
try{
 const result=await verifyDeployment({...getArgs(process.argv.slice(2))});
 for(const row of result.results)console.log("OK "+row);
 console.log("PASS AURORA "+result.mode+" release gate — "+result.origin);
 if(result.mode==="active")console.log("Verified D1 sightings="+result.sightings+" countries="+result.countries+" last_sync="+result.last_sync);
}catch(error){
 console.error("FAIL AURORA release gate: "+error.message);
 process.exitCode=1;
}
