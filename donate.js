"use strict";
const locales=window.AURORA_DONATION_TRANSLATIONS;
const options=['bg','en','de','ru','zh-CN','fr','es','it','pt','tr','ro','el','sr','uk','pl','ar','ja','ko'];
let lang='bg';
try{
  const queryLang=new URLSearchParams(window.location.search).get('lang');
  const stored=localStorage.getItem('aurora-lang');
  if(queryLang&&options.includes(queryLang)){lang=queryLang;localStorage.setItem('aurora-lang',lang);}
  else if(options.includes(stored))lang=stored;
  else if(stored)lang='en';
}catch(_){}
const sel=document.getElementById('langSelect');
const checkout=document.getElementById('donateCheckout');
const status=document.getElementById('paymentStatus');
function translate(){
  const pack=locales[lang]||locales.en;
  document.documentElement.lang=lang;
  document.title=pack.title||locales.en.title;
  sel.value=lang;
  const label=document.querySelector('label[for="langSelect"]');
  if(label)label.textContent=pack.lang||locales.en.lang||'Language';
  const metaDesc=document.querySelector('meta[name="description"]');
  if(metaDesc&&pack.intro)metaDesc.setAttribute('content',pack.intro);
  document.querySelectorAll('[data-donate-t]').forEach(el=>{el.textContent=pack[el.dataset.donateT]||locales.en[el.dataset.donateT]||'';});
}
function verifiedCheckoutLink(){
  const url=window.AURORA_PAYMENT_LINK;
  if(typeof url!=='string')return null;
  try{
    const u=new URL(url);
    if(u.protocol!=='https:'||u.username||u.password)return null;
    if(!['buymeacoffee.com','www.buymeacoffee.com'].includes(u.hostname))return null;
    if(!u.pathname||u.pathname==='/')return null;
    return u.toString();
  }catch{return null;}
}
const link=verifiedCheckoutLink();
checkout.disabled=false;
if(link){
  status.hidden=true;
  checkout.addEventListener('click',()=>{window.location.assign(link);});
}else{
  status.hidden=false;
  checkout.addEventListener('click',()=>{
    status.hidden=false;
    status.setAttribute('tabindex','-1');
    status.focus();
  });
}
sel.addEventListener('change',()=>{lang=sel.value;try{localStorage.setItem('aurora-lang',lang);}catch(_){}translate();});
translate();
