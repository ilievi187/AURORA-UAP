/* AURORA: source-bound original PDF reading inside a public dossier.
 * Publisher PDF is NEVER copied or transformed. Click-to-load with an
 * original-source fallback; unsupported and third-party domains are links. */
(function(root){
"use strict";
const allowed=new Set([
 "www.war.gov","war.gov","www.defense.gov","defense.gov",
 "www.aaro.mil","aaro.mil","www.secnav.navy.mil","secnav.navy.mil",
 "www.archives.gov","archives.gov","www.cia.gov","cia.gov"
]);
const text={
 bg:["ПРОЧЕТИ ДОКУМЕНТА ТУК","ЗАТВОРИ ПРЕГЛЕДА","ОТВОРИ ОРИГИНАЛНИЯ PDF ↗","Ако издателят блокира показването, отвори оригиналния документ."],
 en:["READ DOCUMENT HERE","CLOSE PREVIEW","OPEN ORIGINAL PDF ↗","If the publisher blocks framing, open the original document."],
 de:["DOKUMENT HIER LESEN","VORSCHAU SCHLIESSEN","ORIGINAL-PDF ÖFFNEN ↗","Falls der Herausgeber die Einbettung sperrt, öffnen Sie das Original."],
 ru:["ЧИТАТЬ ДОКУМЕНТ ЗДЕСЬ","ЗАКРЫТЬ ПРОСМОТР","ОТКРЫТЬ ОРИГИНАЛ PDF ↗","Если издатель блокирует просмотр, откройте исходный документ."],
 "zh-CN":["在此阅读文档","关闭预览","打开原始 PDF ↗","若发布方限制嵌入，请打开原始文件。"],
 fr:["LIRE LE DOCUMENT ICI","FERMER L'APERÇU","OUVRIR LE PDF ORIGINAL ↗","Si l'éditeur bloque l'intégration, ouvrez le document d'origine."],
 es:["LEER DOCUMENTO AQUÍ","CERRAR VISTA","ABRIR PDF ORIGINAL ↗","Si el editor impide la inserción, abra el documento original."],
 it:["LEGGI DOCUMENTO QUI","CHIUDI ANTEPRIMA","APRI PDF ORIGINALE ↗","Se l'editore blocca l'anteprima, apri il documento originale."],
 pt:["LER DOCUMENTO AQUI","FECHAR PRÉVIA","ABRIR PDF ORIGINAL ↗","Se o editor bloquear a incorporação, abra o documento original."],
 tr:["BELGEYİ BURADA OKU","ÖNİZLEMEYİ KAPAT","ORİJİNAL PDF'Yİ AÇ ↗","Yayıncı engelliyorsa özgün belgeyi açın."],
 ro:["CITEȘTE DOCUMENTUL AICI","ÎNCHIDE PREVIZUALIZAREA","DESCHIDE PDF ORIGINAL ↗","Dacă editorul blochează afișarea, deschide originalul."],
 el:["ΔΙΑΒΑΣΤΕ ΤΟ ΕΓΓΡΑΦΟ","ΚΛΕΙΣΙΜΟ ΠΡΟΒΟΛΗΣ","ΑΝΟΙΓΜΑ ΑΡΧΙΚΟΥ PDF ↗","Αν ο εκδότης απαγορεύει την προβολή, ανοίξτε το πρωτότυπο."],
 sr:["ПРОЧИТАЈ ДОКУМЕНТ","ЗАТВОРИ ПРЕГЛЕД","ОТВОРИ ОРИГИНАЛНИ PDF ↗","Ако издавач блокира приказ, отвори оригинал."],
 uk:["ЧИТАТИ ДОКУМЕНТ ТУТ","ЗАКРИТИ ПЕРЕГЛЯД","ВІДКРИТИ ОРИГІНАЛ PDF ↗","Якщо видавець блокує перегляд, відкрийте оригінал."],
 pl:["CZYTAJ DOKUMENT TUTAJ","ZAMKNIJ PODGLĄD","OTWÓRZ ORYGINALNY PDF ↗","Jeśli wydawca blokuje osadzanie, otwórz oryginał."],
 ar:["اقرأ المستند هنا","إغلاق المعاينة","فتح ملف PDF الأصلي ↗","إذا منع الناشر العرض المضمّن، افتح المستند الأصلي."],
 ja:["ここで資料を読む","プレビューを閉じる","元の PDF を開く ↗","埋め込みが制限されている場合は元の資料をご覧ください。"],
 ko:["여기에서 문서 읽기","미리보기 닫기","원본 PDF 열기 ↗","제공자가 삽입을 차단하면 원본 문서를 여세요."]
};
function sourcePdf(url){
 try{
  const parsed=new URL(url);
  if(parsed.protocol!=="https:"||parsed.username||parsed.password||parsed.port||!allowed.has(parsed.hostname.toLowerCase()))return null;
  if(!/\.pdf$/i.test(parsed.pathname))return null;
  return parsed.href;
 }catch{return null}
}
function words(lang){return text[lang]||text.en}
function close(){
 const viewer=document.getElementById("caseDocumentViewer"),iframe=document.getElementById("caseDocumentFrame");
 if(!viewer||!iframe)return;
 iframe.removeAttribute("src");
 viewer.hidden=true;
}
function open(url,title,lang){
 const safe=sourcePdf(url);
 if(!safe)return false;
 const viewer=document.getElementById("caseDocumentViewer");
 const iframe=document.getElementById("caseDocumentFrame");
 const name=document.getElementById("caseDocumentTitle");
 const closeBtn=document.getElementById("caseDocumentClose");
 const origin=document.getElementById("caseDocumentSource");
 const note=document.getElementById("caseDocumentNote");
 if(!viewer||!iframe||!name||!closeBtn||!origin||!note)return false;
 const w=words(lang);
 name.textContent=title||"Original published document";
 closeBtn.textContent=w[1]+" ×";closeBtn.setAttribute("aria-label",w[1]);
 origin.href=safe;origin.textContent=w[2];
 note.textContent=w[3];
 iframe.title=(title||"Original document")+" — PDF";
 iframe.src=safe;
 viewer.hidden=false;
 viewer.scrollIntoView({behavior:"instant",block:"nearest"});
 return true;
}
root.AURORA_DOCUMENT_PREVIEW=Object.freeze({sourcePdf,words,open,close});
})(globalThis);
