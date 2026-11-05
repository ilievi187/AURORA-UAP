#!/usr/bin/env python3
"""Offline FR->EN localization for public CC BY CNES GEIPAN cases only.
Preserves every original French narrative, URL, source, location, date and status.
Requires ROCm/CUDA PyTorch, transformers and sentencepiece. No D1/private data.
"""
import argparse,json,pathlib,re,time
ROOT=pathlib.Path(__file__).resolve().parents[1]
DIR=ROOT/"data"/"bulk"
MODEL="Helsinki-NLP/opus-mt-fr-en"
MARK=" GEIPAN classification "
def source(c):
    story=c.get("story",{}).get("en",[])
    if len(story)!=2 or MARK not in story[1]:
        raise ValueError("GEIPAN source malformed: "+c["id"])
    body,tail=story[1].split(MARK,1)
    return body.strip(),"GEIPAN classification "+tail.strip()
def split_text(t,limit=410):
    # Keep punctuation where possible; long sentences split on word boundaries.
    result=[]
    for s in re.split(r"(?<=[.!?;])\s+(?=[A-ZÀ-Ÿ0-9\"'(])",t):
        buf=""
        for w in s.split():
            if buf and len(buf)+1+len(w)>limit:
                result.append(buf);buf=""
            buf=(buf+" "+w).strip()
        if buf:result.append(buf)
    return result
def shorten(t,n=320):
    t=re.sub(r"\s+"," ",t).strip()
    if len(t)<=n:return t
    last=t.rfind(" ",0,n-1)
    return t[:max(80,last)].rstrip(" ,;:")+"\u2026"
def main():
    parser=argparse.ArgumentParser()
    parser.add_argument("--preview",type=int,default=0)
    parser.add_argument("--write",action="store_true")
    parser.add_argument("--batch",type=int,default=16)
    args=parser.parse_args()
    if args.write and args.preview:raise SystemExit("Refusing partial write")
    paths=sorted((DIR/"shards").glob("*.json")); ix=DIR/"index.json"
    if len(paths)!=64:raise SystemExit("Missing public source shards")
    files={p:json.loads(p.read_text()) for p in [*paths,ix]}
    full=[x for p in paths for x in files[p]["cases"] if x.get("original_language")=="fr"]
    index=[x for x in files[ix]["cases"] if x.get("original_language")=="fr"]
    ids={x["id"] for x in full}
    if len(full)!=2715 or len(ids)!=2715 or ids!={x["id"] for x in index}:
        raise SystemExit("Source counts/mapping changed, manual review required")
    if any(x.get("translation",{}).get("target_language")=="en" for x in full):
        raise SystemExit("English translations already present; refusing overwrite")
    selected=full[:args.preview] if args.preview else full
    grouped={}; jobs=[]
    for c in selected:
        fr,footer=source(c)
        grouped[c["id"]]={"fr":fr,"footer":footer,"chunks":[]}
        for i,v in enumerate(split_text(fr)):jobs.append((c["id"],i,v))
    print("INPUT",len(selected),"GEIPAN_CASES",len(jobs),"TRANSLATION_CHUNKS",flush=True)
    import torch
    from transformers import AutoTokenizer,AutoModelForSeq2SeqLM
    torch.set_num_threads(4)
    now=time.monotonic()
    tokenizer=AutoTokenizer.from_pretrained(MODEL)
    net=AutoModelForSeq2SeqLM.from_pretrained(MODEL).to("cuda" if torch.cuda.is_available() else "cpu").eval()
    device=next(net.parameters()).device
    print("MODEL_READY",str(device),"SECONDS",round(time.monotonic()-now),flush=True)
    failures=[]
    with torch.inference_mode():
        for j in range(0,len(jobs),args.batch):
            batch=jobs[j:j+args.batch]
            x=tokenizer([z[2] for z in batch],return_tensors="pt",padding=True)
            input_tokens=x["input_ids"].shape[1]
            if input_tokens>512:raise ValueError("Unexpectedly long French source chunk")
            y=net.generate(**{k:v.to(device) for k,v in x.items()},num_beams=1,do_sample=False,
                max_new_tokens=min(500,max(80,int(input_tokens*2.3))))
            result=tokenizer.batch_decode(y,skip_special_tokens=True)
            for (id,i,fr),en in zip(batch,result):
                en=en.strip()
                if not en or "<unk>" in en or len(en)<max(4,len(fr)//20) or len(en)>len(fr)*4+100 or en.casefold()==fr.casefold():
                    failures.append((id,i))
                    en=""
                grouped[id]["chunks"].append((i,en))
            if (j//args.batch)%20==0 or j+args.batch>=len(jobs):
                print("PROGRESS",min(j+len(batch),len(jobs)),"/",len(jobs),"SECONDS",round(time.monotonic()-now),flush=True)
    results={}
    for id,row in grouped.items():
        parts=[v for _,v in sorted(row["chunks"])]
        results[id]={"en":" ".join(parts).strip(),"full":all(parts),"fr":row["fr"],"footer":row["footer"]}
    print("LOW_CONFIDENCE_PARTS",len(failures),"LOW_CONFIDENCE_CASES",len(set(x[0] for x in failures)),flush=True)
    if args.preview:
        for c in selected[:min(8,len(selected))]:
            r=results[c["id"]]
            print("SAMPLE",c["id"],"FR",r["fr"][:230],"EN",r["en"][:330],flush=True)
        return
    def apply(c,full):
        r=results[c["id"]]
        old=c["summary"]["en"]
        c["summary"]["fr"]=old.removeprefix("Original French account · ").strip()
        if r["full"] and len(r["en"])>=15:
            c["summary"]["en"]=shorten(r["en"])
            if full:
                c["story"]["fr"]=list(c["story"]["en"])
                c["story"]["en"]=[
                    "Machine-translated from a French CNES GEIPAN witness account. Translation is not independently verified; consult the linked original record.",
                    r["en"],r["footer"]]
            status="machine_translated"
        else:
            city=c.get("city",{}).get("en","an unspecified location")
            c["summary"]["en"]=f"CNES GEIPAN recorded a French-language observation report near {city} on {c.get('date','an unspecified date')}. An English translation is unavailable. Consult the original source."
            if full:
                c["story"]["fr"]=list(c["story"]["en"])
                c["story"]["en"]=["Original French witness account preserved. English translation unavailable; use the original GEIPAN source.",r["footer"]]
            status="translation_unavailable"
        c["translation"]={"source_language":"fr","target_language":"en","status":status,
             "method":"automated","model":MODEL,"editorial_reviewed":False}
    for p,doc in files.items():
        n=0
        for c in doc["cases"]:
            if c.get("original_language")=="fr":apply(c,p!=ix);n+=1
        print("WRITING",str(p.relative_to(ROOT)),n,flush=True)
        tmp=p.with_suffix(".next")
        tmp.write_text(json.dumps(doc,ensure_ascii=False,separators=(",",":"))+"\n",encoding="utf8")
        tmp.replace(p)
    print("COMPLETE",len(results),"SECONDS",round(time.monotonic()-now),flush=True)
if __name__=="__main__":main()
