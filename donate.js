"use strict";
const locales=window.AURORA_DONATION_TRANSLATIONS;
const options=['bg','en','de','ru','zh-CN'];
let lang='bg';
try{const stored=localStorage.getItem('aurora-lang');if(options.includes(stored))lang=stored;else if(stored)lang='en';}catch(_){}
const sel=document.getElementById('langSelect');
const checkout=document.getElementById('donateCheckout');
const status=document.getElementById('paymentStatus');
function translate(){document.documentElement.lang=lang;document.title=locales[lang].title;sel.value=lang;document.querySelectorAll('[data-donate-t]').forEach(el=>{el.textContent=locales[lang][el.dataset.donateT]||locales.en[el.dataset.donateT]||'';});}
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
