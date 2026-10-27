"use strict";
const locales=window.AURORA_DONATION_TRANSLATIONS;
const options=['bg','en','de','ru','zh-CN'];
let lang='bg';
try{const stored=localStorage.getItem('aurora-lang');if(options.includes(stored))lang=stored;}catch(_){}
const sel=document.getElementById('langSelect');
const checkout=document.getElementById('donateCheckout');
const status=document.getElementById('paymentStatus');
function translate(){document.documentElement.lang=lang;document.title=locales[lang].title;sel.value=lang;document.querySelectorAll('[data-donate-t]').forEach(el=>{el.textContent=locales[lang][el.dataset.donateT]||locales.en[el.dataset.donateT]||'';});}
function verifiedCheckoutLink(){
  const url=window.AURORA_PAYMENT_LINK;
  if(typeof url!=='string')return null;
  try{const u=new URL(url);return u.protocol==='https:'&&['buy.stripe.com','checkout.stripe.com'].includes(u.hostname)?u.toString():null;}catch{return null;}
}
const link=verifiedCheckoutLink();
if(link){checkout.disabled=false;status.hidden=true;checkout.addEventListener('click',()=>{window.location.assign(link);});}
else {checkout.disabled=true;status.hidden=false;}
sel.addEventListener('change',()=>{lang=sel.value;try{localStorage.setItem('aurora-lang',lang);}catch(_){}translate();});
translate();
