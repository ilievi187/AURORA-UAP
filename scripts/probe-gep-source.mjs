/* Read-only checks of prospective public archives. Never prints case rows or free text. */
const RECORD_ID="23117630";
const METADATA="https://zenodo.org/api/records/"+RECORD_ID;
const MAX_BYTES=3_500_000;
async function get(url){
 const response=await fetch(url,{signal:AbortSignal.timeout(20000),headers:{"Accept":"application/json,text/csv,text/plain"}});
 if(!response.ok)throw Error("HTTP "+response.status+" from "+new URL(url).host);
 const length=Number(response.headers.get("content-length")||"0");
 if(length>MAX_BYTES)throw Error("Dataset exceeds safe analysis budget");
 const result=await response.arrayBuffer();
 if(result.byteLength>MAX_BYTES)throw Error("Oversized dataset");
 return new TextDecoder().decode(result);
}
function csvHeader(csv){
 let head="",quoted=false;
 for(let i=0;i<csv.length;i++){
  const char=csv[i];
  if(char==='"'&&csv[i+1]==='"'){if(quoted){head+='"';i++;continue}}
  if(char==='"'){quoted=!quoted;continue}
  if((char==='\n'||char==='\r')&&!quoted)break;
  head+=char;
 }
 const delimiter=head.includes(";")?";":head.includes("\t")?"\t":",";
 return head.split(delimiter).map(x=>x.replace(/^"|"$/g,"").replace(/^\uFEFF/,"").trim());
}
try{
 const upstream=JSON.parse(await get(METADATA));
 const licence=upstream.metadata?.rightsList?.map(x=>x.id||x.title||x.description).filter(Boolean)||
               (upstream.metadata?.license?[upstream.metadata.license.id||upstream.metadata.license.title||"unknown"] : []);
 const files=Array.isArray(upstream.files?.entries)?upstream.files.entries:Object.entries(upstream.files?.entries||{}).map(([key,value])=>({key,...value}));
 const csv=files.find(x=>/\.csv$/i.test(x.key||""));
 const download=csv?.links?.content||csv?.links?.self;
 const out={record:RECORD_ID,version:upstream.metadata?.version||"",
  published:upstream.metadata?.publication_date||"",
  license:licence,file:csv?.key||"",bytes:csv?.size||0,
  md5:csv?.checksum||"",public_url:upstream.links?.self_html||""
 };
 console.log("GEP_ZENODO_METADATA="+JSON.stringify(out));
 if(!csv||!download)throw Error("No public CSV file link in record");
 const contents=await get(download);
 const columns=csvHeader(contents);
 const freeText=columns.filter(c=>/text|name|adresse|kontakt|zeugen|person|beschreibung|bemerk|kommentar|freitext|aussage|sachverhalt/i.test(c));
 console.log("GEP_CSV_SCHEMA="+JSON.stringify({columns,bytes:contents.length,contains_free_text_fields:freeText}));
 if(!columns.length||columns.length>100)throw Error("Invalid CSV column schema");
 // Protect against accidentally importing free-text testimony until a privacy audit is complete.
 console.log("GEP_STATUS=SCHEMA_ONLY_NO_DATA_REPUBLISHED");
}catch(error){
 console.error("GEP_PROBE_FAILED="+error.message);
 process.exitCode=1;
}
