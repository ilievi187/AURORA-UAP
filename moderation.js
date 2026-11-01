(()=>{
 const queue=document.getElementById('queue'),notice=document.getElementById('notice');
 const element=(tag,text)=>{const el=document.createElement(tag);if(text!==undefined)el.textContent=text;return el};
 async function load(){
  queue.replaceChildren();notice.textContent='Зареждане…';
  try{
   const response=await fetch('/api/moderation/',{cache:'no-store',credentials:'same-origin'});
   if(!response.ok)throw Error();
   const data=await response.json();
   notice.textContent=data.submissions.length?'Последните сигнали:':'Няма сигнали за показване.';
   for(const record of data.submissions){
    const card=element('article');card.className='report-section';
    card.append(element('h2',record.id),element('p',`${record.status} · ${record.created_at} · ${record.country_code} / ${record.region}`),element('p',`${record.approximate_location} · ${record.occurred_local} (${record.time_zone}) · ${record.category}`));
    const desc=element('p',record.description);desc.className='moderation-description';card.append(desc);
    if(['pending','needs_clarification'].includes(record.status)){
     const form=element('form'),label=element('label','Решение'),select=element('select');
     for(const [value,title] of [['approved','Проверен'],['rejected','Отхвърлен'],['needs_clarification','Нужно уточнение']]){const option=element('option',title);option.value=value;select.append(option)}
     label.append(select);const reasonLabel=element('label','Основание за решението'),reason=element('textarea');reason.required=true;reason.minLength=12;reason.maxLength=1000;reasonLabel.append(reason);
     const button=element('button','Запази решението');button.type='submit';form.append(label,reasonLabel,button);
     form.addEventListener('submit',async event=>{event.preventDefault();button.disabled=true;
      try{const res=await fetch('/api/moderation/',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:record.id,decision:select.value,rationale:reason.value})});if(!res.ok)throw Error();await load()}
      catch{notice.textContent='Решението не беше запазено. Обнови и опитай отново.';button.disabled=false}
     });card.append(form);
    }
    queue.append(card);
   }
  }catch{notice.textContent='Няма достъп до защитения преглед или услугата временно не е достъпна.'}
 }
 load();
})();
