// Owner-only Cloudflare Access panel. Render all report and audit data as text.
(()=>{
 const queue=document.getElementById('queue'),notice=document.getElementById('notice');
 const summary=document.getElementById('moderationSummary'),search=document.getElementById('receiptQuery');
 let currentOffset=0,requestVersion=0;
 const RECEIPT=/^aur-int-[a-f0-9]{8}-[a-f0-9]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[a-f0-9]{12}$/i;
 const element=(tag,text)=>{const el=document.createElement(tag);if(text!==undefined)el.textContent=text;return el};
 const api=async suffix=>{
  const response=await fetch('/api/moderation/'+suffix,{cache:'no-store',credentials:'same-origin'});
  if(!response.ok)throw Error('moderation_unavailable');
  return response.json();
 };
 async function loadOverview(){
  try{
   const data=await api('?view=overview');
   const c=data.counts||{},due=data.due||{};
   const items=[
    ['All',data.total],['Pending review',c.pending],['Needs clarification',c.needs_clarification],
    ['Reviewed',c.approved],['Rejected',c.rejected],
    ['Rejected, due for deletion after 90 days',due.rejected_expired],
    ['Pending review for more than 180 days',due.awaiting_review],
    ['Approved, due for reassessment after 12 months',due.approved_reassessment]
   ];
   const list=element('dl');
   for(const [label,count] of items){
    const item=element('div');item.append(element('dt',label),element('dd',Number.isFinite(Number(count))?String(count):'—'));
    list.append(item);
   }
   summary.replaceChildren(list);
  }catch{summary.textContent='Overview is temporarily unavailable. No changes were made.'}
 }
 function renderRecord(record,{events=null,truncated=false}={}){
  const card=element('article');card.className='report-section';
  card.append(element('h2',record.id),
   element('p',`${record.status} · ${record.created_at} · ${record.country_code} / ${record.region}`),
   element('p',`${record.approximate_location} · ${record.occurred_local} (${record.time_zone}) · ${record.category}`));
  const desc=element('p',record.description);desc.className='moderation-description';card.append(desc);
  if(events===null){
   const history=element('button','Review and decision history');
   history.type='button';history.addEventListener('click',()=>loadReceipt(record.id));card.append(history);
  }else{
   const section=element('section');section.className='moderation-audit';
   section.append(element('h3','Private audit history'));
   if(!events.length)section.append(element('p','No recorded actions.'));
   for(const item of events){
    const entry=element('div');entry.className='moderation-audit-entry';
    entry.append(element('strong',`${item.created_at} · ${item.actor_type} · ${item.action} · ${item.previous_status||'—'} → ${item.new_status||'—'}`));
    entry.append(element('p',item.rationale));section.append(entry);
   }
   if(truncated)section.append(element('p','Showing the first 100 actions.'));
   card.append(section);
  }
  if(['pending','needs_clarification'].includes(record.status)){
   const form=element('form'),label=element('label','Decision'),select=element('select');
   for(const [value,title] of [['approved','Reviewed'],['rejected','Rejected'],['needs_clarification','Needs clarification']]){
    const option=element('option',title);option.value=value;select.append(option)
   }
   label.append(select);
   const reasonLabel=element('label','Reason for decision'),reason=element('textarea');
   reason.required=true;reason.minLength=12;reason.maxLength=1000;reasonLabel.append(reason);
   const button=element('button','Save decision');button.type='submit';form.append(label,reasonLabel,button);
   form.addEventListener('submit',async event=>{
    event.preventDefault();button.disabled=true;
    try{
     const response=await fetch('/api/moderation/',{method:'POST',credentials:'same-origin',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({id:record.id,decision:select.value,rationale:reason.value})});
     if(!response.ok)throw Error('review_failed');
     await Promise.all([loadReceipt(record.id),loadOverview()]);
    }catch{
     notice.textContent='The decision was not saved. Refresh and try again.';
     button.disabled=false;
    }
   });
   card.append(form);
  }
  return card;
 }
 async function load(offset=0){
  const version=++requestVersion;
  queue.replaceChildren();notice.textContent='Loading…';
  try{
   const data=await api('?offset='+offset);
   if(version!==requestVersion)return;
   currentOffset=data.offset;
   notice.textContent=data.submissions.length?'Private reports — page '+(Math.floor(currentOffset/data.limit)+1)+':':'No reports to display.';
   for(const record of data.submissions)queue.append(renderRecord(record));
   const pager=element('nav');pager.setAttribute('aria-label','Report pages');
   if(currentOffset>0){
    const prev=element('button','← Previous');prev.type='button';
    prev.addEventListener('click',()=>load(Math.max(0,currentOffset-data.limit)));pager.append(prev);
   }
   if(data.has_more){
    const next=element('button','Next →');next.type='button';
    next.addEventListener('click',()=>load(data.next_offset));pager.append(next);
   }
   queue.append(pager);
  }catch{
   if(version===requestVersion)notice.textContent='The private review is unavailable or access was denied.';
  }
 }
 async function loadReceipt(id){
  if(!RECEIPT.test(id)){notice.textContent='Invalid report reference.';return}
  const version=++requestVersion;
  queue.replaceChildren();notice.textContent='Loading private report…';
  try{
   const data=await api('?receipt='+encodeURIComponent(id));
   if(version!==requestVersion)return;
   notice.textContent='Private report — '+id;
   const back=element('button','← Back to queue');back.type='button';
   back.addEventListener('click',()=>load(currentOffset));
   queue.append(back,renderRecord(data.submission,{events:data.events||[],truncated:data.events_truncated===true}));
  }catch{
   if(version===requestVersion)notice.textContent='The report was not found or the service is unavailable.';
  }
 }
 document.getElementById('receiptLookup').addEventListener('submit',event=>{
  event.preventDefault();loadReceipt(search.value.trim());
 });
 document.getElementById('allReports').addEventListener('click',()=>{search.value='';load(0)});
 document.getElementById('reloadReports').addEventListener('click',()=>{
  loadOverview();const id=search.value.trim();
  if(id)loadReceipt(id);else load(0);
 });
 loadOverview();load();
})();
