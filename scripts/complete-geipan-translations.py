#!/usr/bin/env python3
"""Finish the 17 unresolved public CNES/GEIPAN records with auditable English.

- No alteration of original French, source links, dates, geolocation or case status.
- No invented eyewitness narrative for sources with only a one-character fragment.
- Never contacts a live report database, user identity provider or payment service.
"""
import argparse,json,pathlib,re,collections,time
ROOT=pathlib.Path(__file__).resolve().parents[1]
BULK=ROOT/"data/bulk"
MODEL="Helsinki-NLP/opus-mt-fr-en"
SOURCE_MARK=" GEIPAN classification "

def english_excerpt(s,n=320):
    s=re.sub(r"\s+"," ",s).strip()
    if len(s)<=n:return s
    pos=s.rfind(" ",0,n-1)
    return s[:max(80,pos)].rstrip(" ,;:")+"\u2026"

def chunks(text,size=250):
    # Do not translate isolated abbreviations. Group short sentences together.
    translate_input=text.replace("Le tmoin", "Le témoin").replace("PV DIRECT.","Compte rendu direct.").replace("PV DIRECT :","Compte rendu direct :")
    translate_input=translate_input.replace("OBS. ANCIENNE","Observation ancienne").replace("Obs ANCIENNE","observation ancienne").replace("T. RECENT/","Témoignage récent; ")
    sentences=re.split(r"(?<=[.!?;:])\s+",translate_input)
    parts=[]
    current=""
    for sentence in sentences:
        if not sentence.strip():continue
        if current and len(current)+len(sentence)+1>size and len(current)>=32:
            parts.append(current)
            current=""
        current=(current+" "+sentence).strip()
        while len(current)>size+75:
            split=current.rfind(" ",0,size)
            if split<65:break
            parts.append(current[:split])
            current=current[split+1:]
    if current:
        if parts and len(current)<32:parts[-1]+=" "+current
        else:parts.append(current)
    return parts

def main():
    parser=argparse.ArgumentParser()
    parser.add_argument("--write",action="store_true",help="Modify tracked public shard/index JSON")
    parser.add_argument("--batch",type=int,default=8)
    args=parser.parse_args()
    files=sorted((BULK/"shards").glob("*.json"))
    assert len(files)==64
    data={p:json.loads(p.read_text()) for p in files}
    ip=BULK/"index.json";data[ip]=json.loads(ip.read_text())
    pending=[c for p in files for c in data[p]["cases"] if c.get("translation",{}).get("status")=="translation_unavailable"]
    if len(pending)!=17:raise RuntimeError(f"Unexpected untranslated source count: {len(pending)}")
    ids={c["id"] for c in pending}; assert len(ids)==17
    source={}
    for c in pending:
        old=c.get("story",{}).get("fr",[])
        if not isinstance(old,list) or len(old)<2 or SOURCE_MARK not in old[1]:raise RuntimeError("Missing original: "+c["id"])
        fr=old[1].split(SOURCE_MARK,1)[0].strip()
        source[c["id"]]=fr
    short={id for id,fr in source.items() if len(fr)<12 or len(fr.split())<3}
    substantive={id:fr for id,fr in source.items() if id not in short}
    print("INPUT",len(pending),"SUBSTANTIVE",len(substantive),"SOURCE_INSUFFICIENT",len(short),sorted(short),flush=True)
    import torch
    from transformers import AutoTokenizer,AutoModelForSeq2SeqLM
    torch.set_num_threads(4)
    start=time.monotonic()
    tk=AutoTokenizer.from_pretrained(MODEL)
    mdl=AutoModelForSeq2SeqLM.from_pretrained(MODEL).to("cuda" if torch.cuda.is_available() else "cpu").eval()
    device=next(mdl.parameters()).device
    print("MODEL_READY",str(device),round(time.monotonic()-start,1),flush=True)
    segs=[(id,i,txt) for id,fr in substantive.items() for i,txt in enumerate(chunks(fr))]
    outputs=collections.defaultdict(list)
    with torch.inference_mode():
        for off in range(0,len(segs),args.batch):
            batch=segs[off:off+args.batch]
            inputs=tk([t for _,_,t in batch],return_tensors="pt",padding=True)
            if inputs["input_ids"].shape[1]>512:raise RuntimeError("Source exceeds model context")
            out=mdl.generate(**{k:v.to(device) for k,v in inputs.items()},num_beams=4,do_sample=False,
               max_new_tokens=max(100,min(440,int(inputs["input_ids"].shape[1]*2.4))))
            texts=tk.batch_decode(out,skip_special_tokens=True)
            for (id,n,fr),en in zip(batch,texts):
                if not en.strip() or len(en.strip())<4 or len(en)>len(fr)*6+70:
                    print("BAD_SEGMENT",id,n,"FR",repr(fr[:150]),"EN",repr(en[:150]),flush=True)
                    raise RuntimeError(f"Source passage {id}/{n} requires review")
                outputs[id].append((n,en.strip()))
    result={id:" ".join(en for _,en in sorted(outputs[id])).strip() for id in substantive}
    # Manually reviewed obvious mistranslations of common witness-report terms.
    glossary={
      "INDIRECT TESTING:":"INDIRECT TESTIMONY:",
      "The troin (":"The witness (",
      "braided in all kinds of direction":"jerks in different directions"
    }
    for id in result:
        for source_text,english in glossary.items():
            result[id]=result[id].replace(source_text,english)
    for c in pending:
        id=c["id"]
        if id in short:
            en=f"Original CNES GEIPAN record for {c.get('city',{}).get('en','this location')} ({c.get('date','date not stated')}) contains only a non-descriptive source fragment, not a usable witness account. No additional observation details are available in this record; see the linked primary source."
        else:en=result[id]
        print("CASE",id,"SOURCE_CHARS",len(source[id]),"EN_CHARS",len(en),"EN",en[:220].replace("\n"," "),flush=True)
        if id not in short and len(en)<len(source[id])*0.35:raise RuntimeError("Unusually short translation for "+id)
    if not args.write:
        print("PREVIEW_ONLY_NO_WRITES");return
    for p,item in data.items():
        full=p!=ip
        for c in item["cases"]:
            id=c["id"]
            if id not in source:continue
            fr=source[id]
            if id in short:
                en=f"The original CNES GEIPAN record for {c.get('city',{}).get('en','this location')} ({c.get('date','date not stated')}) contains only the fragment {json.dumps(fr,ensure_ascii=False)}, not a meaningful witness narrative. Further details are unavailable in the cited data."
                status="source_text_insufficient"
                story=["Source record has no usable eyewitness narrative. This English note describes the limitation rather than inventing details.",en]
            else:
                en=result[id]
                status="machine_translated"
                old=c.get("story",{}).get("fr",[])
                footer="GEIPAN classification "+old[1].split(SOURCE_MARK,1)[1].strip() if full else ""
                story=["Machine-translated from the original French CNES GEIPAN witness account. Translation is not independently verified; consult the linked original source.",en,footer]
            c["summary"]["en"]=english_excerpt(en)
            if full:c["story"]["en"]=story
            c["translation"]={"source_language":"fr","target_language":"en","status":status,
                  "method":"automated" if id not in short else "source_limitation",
                  "model":MODEL if id not in short else None,"editorial_reviewed":False}
    for p,doc in data.items():
        t=p.with_suffix(".next")
        t.write_text(json.dumps(doc,ensure_ascii=False,separators=(",",":"))+"\n")
        t.replace(p)
    print("COMPLETE",len(pending),"elapsed_seconds",round(time.monotonic()-start,1),flush=True)
if __name__=="__main__":main()
