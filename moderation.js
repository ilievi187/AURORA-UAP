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
    ['Всички',data.total],['Чакат преглед',c.pending],['Нужно уточнение',c.needs_clarification],
    ['Прегледани',c.approved],['Отхвърлени',c.rejected],
    ['Отхвърлени за изтриване след 90 дни',due.rejected_expired],
    ['Чакат преглед над 180 дни',due.awaiting_review],
    ['Одобрени за преоценка над 12 месеца',due.approved_reassessment]
   ];
   const list=element('dl');
   for(const [label,count] of items){
    const item=element('div');item.append(element('dt',label),element('dd',Number.isFinite(Number(count))?String(count):'—'));
    list.append(item);
   }
   summary.replaceChildren(list);
  }catch{summary.textContent='Справката временно не е достъпна. Нищо не е променено.'}
 }
 function renderRecord(record,{events=null,truncated=false}={}){
  const card=element('article');card.className='report-section';
  card.append(element('h2',record.id),
   element('p',`${record.status} · ${record.created_at} · ${record.country_code} / ${record.region}`),
   element('p',`${record.approximate_location} · ${record.occurred_local} (${record.time_zone}) · ${record.category}`));
  const desc=element('p',record.description);desc.className='moderation-description';card.append(desc);
  if(events===null){
   const history=element('button','Преглед и история на решенията');
   history.type='button';history.addEventListener('click',()=>loadReceipt(record.id));card.append(history);
  }else{
   const section=element('section');section.className='moderation-audit';
   section.append(element('h3','Одитна история (частна)'));
   if(!events.length)section.append(element('p','Няма записани действия.'));
   for(const item of events){
    const entry=element('div');entry.className='moderation-audit-entry';
    entry.append(element('strong',`${item.created_at} · ${item.actor_type} · ${item.action} · ${item.previous_status||'—'} → ${item.new_status||'—'}`));
    entry.append(element('p',item.rationale));section.append(entry);
   }
   if(truncated)section.append(element('p','Показани са първите 100 действия.'));
   card.append(section);
  }
  if(['pending','needs_clarification'].includes(record.status)){
   const form=element('form'),label=element('label','Решение'),select=element('select');
   for(const [value,title] of [['approved','Проверен'],['rejected','Отхвърлен'],['needs_clarification','Нужно уточнение']]){
    const option=element('option',title);option.value=value;select.append(option)
   }
   label.append(select);
   const reasonLabel=element('label','Основание за решението'),reason=element('textarea');
   reason.required=true;reason.minLength=12;reason.maxLength=1000;reasonLabel.append(reason);
   const button=element('button','Запази решението');button.type='submit';form.append(label,reasonLabel,button);
   form.addEventListener('submit',async event=>{
    event.preventDefault();button.disabled=true;
    try{
     const response=await fetch('/api/moderation/',{method:'POST',credentials:'same-origin',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({id:record.id,decision:select.value,rationale:reason.value})});
     if(!response.ok)throw Error('review_failed');
     await Promise.all([loadReceipt(record.id),loadOverview()]);
    }catch{
     notice.textContent='Решението не беше запазено. Обнови и опитай отново.';
     button.disabled=false;
    }
   });
   card.append(form);
  }
  return card;
 }
 async function load(offset=0){
  const version=++requestVersion;
  queue.replaceChildren();notice.textContent='Зареждане…';
  try{
   const data=await api('?offset='+offset);
   if(version!==requestVersion)return;
   currentOffset=data.offset;
   notice.textContent=data.submissions.length?'Частни сигнали — страница '+(Math.floor(currentOffset/data.limit)+1)+':':'Няма сигнали за показване.';
   for(const record of data.submissions)queue.append(renderRecord(record));
   const pager=element('nav');pager.setAttribute('aria-label','Страници със сигнали');
   if(currentOffset>0){
    const prev=element('button','← Предишни');prev.type='button';
    prev.addEventListener('click',()=>load(Math.max(0,currentOffset-data.limit)));pager.append(prev);
   }
   if(data.has_more){
    const next=element('button','Следващи →');next.type='button';
    next.addEventListener('click',()=>load(data.next_offset));pager.append(next);
   }
   queue.append(pager);
  }catch{
   if(version===requestVersion)notice.textContent='Няма достъп до защитения преглед или услугата временно не е достъпна.';
  }
 }
 async function loadReceipt(id){
  if(!RECEIPT.test(id)){notice.textContent='Невалиден номер на сигнал.';return}
  const version=++requestVersion;
  queue.replaceChildren();notice.textContent='Зареждане на защитеното досие…';
  try{
   const data=await api('?receipt='+encodeURIComponent(id));
   if(version!==requestVersion)return;
   notice.textContent='Частно досие — '+id;
   const back=element('button','← Обратно към опашката');back.type='button';
   back.addEventListener('click',()=>load(currentOffset));
   queue.append(back,renderRecord(data.submission,{events:data.events||[],truncated:data.events_truncated===true}));
  }catch{
   if(version===requestVersion)notice.textContent='Сигналът не е намерен или услугата е недостъпна.';
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
