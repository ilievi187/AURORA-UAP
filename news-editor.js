"use strict";
(()=>{
 const $=id=>document.getElementById(id),status=$("newsEditorStatus"),articleForm=$("articleForm");
 let articles=[],articleOffset=0,articleHasMore=false,tips=[],tipOffset=0,tipHasMore=false,currentArticleStatus="draft";
 const api=(params={})=>'/api/news-editor?'+new URLSearchParams(params).toString();
 const safeHttps=value=>{try{const url=new URL(value);return url.protocol==='https:'&&!url.username&&!url.password&&!url.port?url.href:''}catch{return ''}};
 const element=(tag,text)=>{const node=document.createElement(tag);if(text!==undefined)node.textContent=text;return node};
 const message=text=>{status.textContent=text};
 async function request(url,options={}){
  const response=await fetch(url,{cache:'no-store',credentials:'same-origin',...options});
  let data={};try{data=await response.json()}catch{}
  if(!response.ok)throw Error(data.error||'unavailable');
  return data;
 }
 function articlePayload(){
  return {
   ...( $("articleId").value?{id:$("articleId").value}:{}),
   language_code:$("articleLanguage").value,category:$("articleCategory").value,
   title:$("articleTitle").value.trim(),summary:$("articleSummary").value.trim(),body:$("articleBody").value.trim(),
   source_name:$("articleSourceName").value.trim(),source_url:$("articleSourceUrl").value.trim(),
   source_published_at:$("articleSourceDate").value||null,
   image_url:$("articleImageUrl").value.trim()||null,video_url:$("articleVideoUrl").value.trim()||null,
   media_rights_confirmed:$("mediaRightsConfirmed").checked,media_rights_note:$("mediaRightsNote").value.trim()
  };
 }
 function validMedia(){
  const image=$("articleImageUrl").value.trim(),video=$("articleVideoUrl").value.trim();
  return (!image&&!video)||($("mediaRightsConfirmed").checked&&$("mediaRightsNote").value.trim().length>=12);
 }
 function refreshActionButtons(){
  const canSave=articleForm.checkValidity()&&validMedia();
  $("saveArticle").disabled=!canSave;
  $("publishArticle").disabled=!canSave;
  $("unpublishArticle").hidden=!$("articleId").value||currentArticleStatus!=='published';
 }
 function resetArticle(){
  articleForm.reset();$("articleId").value='';currentArticleStatus='draft';
  $("articleFormHeading").textContent='Нова статия';$("articleStatusBadge").textContent='DRAFT';
  $("unpublishArticle").hidden=true;$("articlePreview").hidden=true;$("translationEditor").hidden=true;refreshActionButtons();
 }
 function fillArticle(article){
  $("articleId").value=article.id;$("articleLanguage").value=article.language_code;$("articleCategory").value=article.category;
  $("articleTitle").value=article.title;$("articleSummary").value=article.summary;$("articleBody").value=article.body;
  $("articleSourceName").value=article.source_name;$("articleSourceUrl").value=article.source_url;
  $("articleSourceDate").value=article.source_published_at||'';$("articleImageUrl").value=article.image_url||'';$("articleVideoUrl").value=article.video_url||'';
  $("mediaRightsConfirmed").checked=Boolean(article.media_rights_confirmed);$("mediaRightsNote").value=article.media_rights_note||'';
  currentArticleStatus=article.status;$("articleFormHeading").textContent='Редактиране на статия';$("articleStatusBadge").textContent=String(article.status||'draft').toUpperCase();
  $("translationEditor").hidden=false;$("articlePreview").hidden=true;refreshActionButtons();void loadTranslation();
 }
 function renderArticleList(){
  const root=$("articleList");root.replaceChildren();
  for(const article of articles){
   const button=element('button');button.type='button';button.className='news-editor-list-item';
   button.setAttribute('aria-current',article.id===$("articleId").value?'true':'false');
   button.append(element('strong',article.title),element('small',article.status+' · '+article.category+' · '+article.updated_at));
   button.addEventListener('click',()=>fillArticle(article));root.append(button);
  }
  if(!articles.length)root.append(element('p','Няма статии за показване.'));
  $("articlePrev").disabled=articleOffset===0;$("articleNext").disabled=!articleHasMore;
 }
 async function loadArticles(offset=0){
  articleOffset=offset;message('Зареждане на статии…');
  try{
   const data=await request(api({kind:'articles',status:$("articleStatus").value,offset}));
   articles=data.articles||[];articleHasMore=data.has_more===true;articleOffset=data.offset||0;renderArticleList();message('Редакционните записи са заредени.');
  }catch{articles=[];articleHasMore=false;renderArticleList();message('Няма достъп до защитения редактор или услугата временно не е достъпна.');}
 }
 function renderPreview(){
  const preview=$("articlePreview");preview.replaceChildren();
  const payload=articlePayload(),header=element('p',payload.category+' · '+payload.language_code.toUpperCase()),title=element('h2',payload.title),summary=element('p',payload.summary),body=element('div');
  body.className='news-editor-preview-body';
  for(const paragraph of payload.body.split(/\n{2,}/).map(value=>value.trim()).filter(Boolean))body.append(element('p',paragraph));
  preview.append(header,title,summary);
  const imageUrl=safeHttps(payload.image_url);
  if(imageUrl){const image=element('img');image.alt='Editorial image preview';image.loading='lazy';image.referrerPolicy='no-referrer';image.src=imageUrl;preview.append(image)}
  preview.append(body);
  const sourceUrl=safeHttps(payload.source_url);
  if(sourceUrl){const source=element('a','Original source · '+payload.source_name);source.href=sourceUrl;source.target='_blank';source.rel='noopener noreferrer';preview.append(source)}
  const videoUrl=safeHttps(payload.video_url);
  if(videoUrl){const video=element('a','Video source · external link');video.href=videoUrl;video.target='_blank';video.rel='noopener noreferrer';preview.append(video)}
  preview.hidden=false;preview.scrollIntoView({block:'nearest'});
 }
 async function saveArticle(){
  if(!articleForm.reportValidity()||!validMedia()){message('Провери задължителните полета и потвърждението за права върху медията.');return null}
  const result=await request('/api/news-editor',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'save_article',article:articlePayload()})});
  $("articleId").value=result.id;currentArticleStatus=result.status==='updated'?currentArticleStatus:'draft';$("translationEditor").hidden=false;
  const savedMessage=currentArticleStatus==='published'?'Промените в публикуваната статия са запазени.':'Черновата е запазена.';
  await loadArticles(articleOffset);message(savedMessage);return result.id;
 }
 async function publishArticle(){
  try{
   const id=await saveArticle();if(!id)return;
   const result=await request('/api/news-editor',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'publish_article',id})});
   currentArticleStatus=result.status;$("articleStatusBadge").textContent='PUBLISHED';
   await loadArticles(articleOffset);message('Статията е публикувана в публичния новинарски поток.');
  }catch{message('Статията не беше публикувана. Провери източника, медийните права и достъпа до D1.');}
 }
 async function unpublishArticle(){
  const id=$("articleId").value;if(!id)return;
  try{
   const result=await request('/api/news-editor',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'unpublish_article',id,rationale:'Withdrawn by editor.'})});
   currentArticleStatus=result.status;$("articleStatusBadge").textContent='UNPUBLISHED';await loadArticles(articleOffset);message('Статията е свалена от публичния поток; историята остава в архива на редактора.');
  }catch{message('Статията не беше свалена. Обнови екрана и опитай отново.')}
 }
 async function loadTranslation(){
  const id=$("articleId").value;if(!id)return;
  const language=$("translationLanguage").value;
  try{
   const data=await request(api({kind:'translation',article_id:id,language_code:language}));
   const row=data.translation;
   $("translationTitle").value=row?.title||'';$("translationSummary").value=row?.summary||'';$("translationBody").value=row?.body||'';
   if(data.source_language===language)message('Този език е оригиналният; избери различен език за превод.');
  }catch{message('Преводът не можа да бъде зареден.')}
 }
 async function saveTranslation(){
  const articleId=$("articleId").value;if(!articleId){message('Първо запази черновата на статията.');return}
  const translation={article_id:articleId,language_code:$("translationLanguage").value,title:$("translationTitle").value.trim(),summary:$("translationSummary").value.trim(),body:$("translationBody").value.trim()};
  try{await request('/api/news-editor',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'save_translation',translation})});message('Редакторският превод е запазен.');}
  catch{message('Преводът не е запазен. Провери пълнотата на полетата и избрания език.')}
 }
 function renderTips(){
  const root=$("tipQueue");root.replaceChildren();
  for(const tip of tips){
   const card=element('article');card.className='news-tip-review-card';
   card.append(element('h3',tip.title),element('p',tip.status+' · '+tip.submitted_at));
   const link=element('a',tip.source_url);link.href=tip.source_url;link.target='_blank';link.rel='noopener noreferrer';card.append(link);
   if(tip.status==='pending'){
    const controls=element('div');controls.className='news-tip-review-actions';
    const rationale=element('textarea');rationale.maxLength=1000;rationale.minLength=12;rationale.required=true;rationale.setAttribute('aria-label','Причина за решението');
    const approve=element('button','Одобри за редакционен преглед');approve.type='button';
    const reject=element('button','Отхвърли');reject.type='button';
    const submitDecision=async decision=>{
     if(rationale.value.trim().length<12){message('Добави кратко основание за решението.');return}
     approve.disabled=true;reject.disabled=true;
     try{await request('/api/news-editor',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'review_tip',id:tip.id,decision,rationale:rationale.value.trim()})});await loadTips(tipOffset);message(decision==='approved'?'Предложението е одобрено само за редакционна употреба.':'Предложението е отхвърлено.')}
     catch{message('Решението не беше запазено. Обнови опашката.');approve.disabled=false;reject.disabled=false}
    };
    approve.addEventListener('click',()=>void submitDecision('approved'));reject.addEventListener('click',()=>void submitDecision('rejected'));
    controls.append(rationale,approve,reject);card.append(controls);
   }
   root.append(card);
  }
  if(!tips.length)root.append(element('p','Няма предложения за показване.'));
  $("tipPrev").disabled=tipOffset===0;$("tipNext").disabled=!tipHasMore;
 }
 async function loadTips(offset=0){
  tipOffset=offset;
  try{const data=await request(api({kind:'tips',status:'pending',offset}));tips=data.tips||[];tipOffset=data.offset||0;tipHasMore=data.has_more===true;renderTips();message('Предложенията са показани за преглед; одобрението не публикува статия.')}
  catch{tips=[];tipHasMore=false;renderTips();message('Няма достъп до защитената опашка за предложения.')}
 }
 $("newArticle").addEventListener('click',resetArticle);
 $("saveArticle").addEventListener('click',()=>void saveArticle().catch(()=>message('Черновата не беше запазена. Провери източника и опитай отново.')));
 $("previewArticle").addEventListener('click',renderPreview);
 $("publishArticle").addEventListener('click',()=>void publishArticle());
 $("unpublishArticle").addEventListener('click',()=>void unpublishArticle());
 $("saveTranslation").addEventListener('click',()=>void saveTranslation());
 $("translationLanguage").addEventListener('change',()=>void loadTranslation());
 $("articleStatus").addEventListener('change',()=>void loadArticles(0));
 $("articlePrev").addEventListener('click',()=>void loadArticles(Math.max(0,articleOffset-30)));
 $("articleNext").addEventListener('click',()=>void loadArticles(articleOffset+30));
 $("tipPrev").addEventListener('click',()=>void loadTips(Math.max(0,tipOffset-30)));
 $("tipNext").addEventListener('click',()=>void loadTips(tipOffset+30));
 $("showArticles").addEventListener('click',()=>{$("articlesWorkspace").hidden=false;$("tipsWorkspace").hidden=true;$("showArticles").setAttribute('aria-pressed','true');$("showTips").setAttribute('aria-pressed','false');void loadArticles(articleOffset)});
 $("showTips").addEventListener('click',()=>{$("articlesWorkspace").hidden=true;$("tipsWorkspace").hidden=false;$("showArticles").setAttribute('aria-pressed','false');$("showTips").setAttribute('aria-pressed','true');void loadTips(0)});
 for(const field of articleForm.querySelectorAll('input,textarea,select'))field.addEventListener('input',refreshActionButtons);
 resetArticle();void loadArticles(0);
})();
