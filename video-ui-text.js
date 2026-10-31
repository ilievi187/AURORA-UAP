/* Same public-video controls across archive, media and dossier.
 * Load before dossier-hero.js; archive-inline-player.js imports as side effect. */
(function(root){
"use strict";
const names={
 bg:["▶ ГЛЕДАЙ ТУК","Затвори видеото","Оригинален източник ↗","Зареждане на видеото…","Видеото е готово.","Това видео не може да се възпроизведе тук.","Публикувана миниатюра","Илюстрация — не е оригинален кадър","ИЗБЕРИ ЗАПИС · ЕДИН ПЛЕЙЪР","ВИДЕО ОТ ИЗТОЧНИКА"],
 en:["▶ WATCH HERE","Close video","Original source ↗","Loading source video…","Video ready.","This publisher does not permit in-site playback.","Published video thumbnail","Illustration — not original footage","CHOOSE RECORDING · ONE PLAYER","PUBLISHED SOURCE VIDEO"],
 de:["▶ HIER ANSEHEN","Video schließen","Originalquelle ↗","Video wird geladen…","Video bereit.","Dieser Verlag gestattet keine Wiedergabe hier.","Veröffentlichtes Vorschaubild","Illustration – kein Originalbild","AUFNAHME WÄHLEN · EIN PLAYER","VERÖFFENTLICHTES QUELLVIDEO"],
 ru:["▶ СМОТРЕТЬ ЗДЕСЬ","Закрыть видео","Первоисточник ↗","Загрузка видеозаписи…","Видео готово.","Издатель не разрешает воспроизведение здесь.","Миниатюра источника","Иллюстрация — не оригинальный кадр","ВЫБЕРИТЕ ЗАПИС · ОДИН ПЛЕЙЕР","ОПУБЛИКОВАННОЕ ВИДЕО"],
 "zh-CN":["▶ 在此观看","关闭视频","原始来源 ↗","正在加载视频…","视频已就绪。","发布者不允许在本网站播放。","来源视频缩略图","示意图—非原始画面","选择录像 · 单一播放器","已发布来源视频"],
 fr:["▶ REGARDER ICI","Fermer la vidéo","Source originale ↗","Chargement de la vidéo…","Vidéo prête.","L'éditeur n'autorise pas la lecture ici.","Miniature publiée","Illustration — pas une image originale","CHOISIR UN ENREGISTREMENT · UN LECTEUR","VIDÉO DE SOURCE PUBLIÉE"],
 es:["▶ VER AQUÍ","Cerrar vídeo","Fuente original ↗","Cargando vídeo…","Vídeo listo.","El editor no permite reproducirlo aquí.","Miniatura publicada","Ilustración, no imagen original","ELIGE GRABACIÓN · UN REPRODUCTOR","VÍDEO DE FUENTE PUBLICADA"],
 it:["▶ GUARDA QUI","Chiudi video","Fonte originale ↗","Caricamento video…","Video pronto.","L'editore non consente la riproduzione qui.","Anteprima pubblicata","Illustrazione, non fotogramma originale","SCEGLI REGISTRAZIONE · UN PLAYER","VIDEO PUBBLICATO DALLA FONTE"],
 pt:["▶ VER AQUI","Fechar vídeo","Fonte original ↗","A carregar vídeo…","Vídeo pronto.","O editor não permite a reprodução neste site.","Miniatura publicada","Ilustração, não imagem original","ESCOLHER GRAVAÇÃO · UM LEITOR","VÍDEO PUBLICADO PELA FONTE"],
 tr:["▶ BURADA İZLE","Videoyu kapat","Özgün kaynak ↗","Video yükleniyor…","Video hazır.","Yayıncı burada oynatmaya izin vermiyor.","Yayıncı küçük resmi","Görsel — özgün kayıt değil","KAYIT SEÇ · TEK OYNATICI","YAYINLANMIŞ KAYNAK VİDEOSU"],
 ro:["▶ VEZI AICI","Închide video","Sursa originală ↗","Se încarcă videoclipul…","Video pregătit.","Editorul nu permite redarea aici.","Miniatură publicată","Ilustrație, nu cadru original","ALEGE ÎNREGISTRAREA · UN PLAYER","VIDEO PUBLICAT DE SURSĂ"],
 el:["▶ ΠΑΡΑΚΟΛΟΥΘΗΣΗ ΕΔΩ","Κλείσιμο βίντεο","Αρχική πηγή ↗","Φόρτωση βίντεο…","Βίντεο έτοιμο.","Ο εκδότης δεν επιτρέπει αναπαραγωγή εδώ.","Μικρογραφία πηγής","Εικονογράφηση, όχι πρωτότυπο καρέ","ΕΠΙΛΟΓΗ ΕΓΓΡΑΦΗΣ · ΕΝΑΣ ΠΑΙΚΤΗΣ","ΔΗΜΟΣΙΕΥΜΕΝΟ ΒΙΝΤΕΟ"],
 sr:["▶ ГЛЕДАЈ ОВДЕ","Затвори видео","Оригинални извор ↗","Учитавање видеа…","Видео је спреман.","Издавач не дозвољава репродукцију овде.","Сличица извора","Илустрација, није оригинални кадар","ИЗАБЕРИ СНИМАК · ЈЕДАН ПЛЕЈЕР","ОБЈАВЉЕНИ ВИДЕО-ИЗВОР"],
 uk:["▶ ДИВИТИСЯ ТУТ","Закрити відео","Першоджерело ↗","Завантаження відео…","Відео готове.","Видавець не дозволяє відтворення тут.","Мініатюра джерела","Ілюстрація, не оригінальний кадр","ОБЕРІТЬ ЗАПИС · ОДИН ПЛЕЄР","ОПУБЛІКОВАНЕ ВІДЕО"],
 pl:["▶ OGLĄDAJ TUTAJ","Zamknij wideo","Oryginalne źródło ↗","Ładowanie wideo…","Wideo gotowe.","Wydawca nie zezwala na odtwarzanie tutaj.","Miniatura źródła","Ilustracja, nie oryginalna klatka","WYBIERZ NAGRANIE · JEDEN ODTWARZACZ","OPUBLIKOWANE NAGRANIE"],
 ar:["▶ شاهد هنا","إغلاق الفيديو","المصدر الأصلي ↗","جارٍ تحميل الفيديو…","الفيديو جاهز.","الناشر لا يسمح بالتشغيل هنا.","صورة مصغرة من المصدر","رسم توضيحي وليس إطارًا أصليًا","اختر التسجيل · مشغل واحد","فيديو منشور من المصدر"],
 ja:["▶ ここで見る","動画を閉じる","原典 ↗","動画を読み込み中…","動画の準備ができました。","発行元がこのサイトでの再生を許可していません。","公開されたサムネイル","説明用画像（元映像ではありません）","録画を選択 · プレーヤーは1つ","公開された動画"],
 ko:["▶ 여기서 보기","영상 닫기","원본 출처 ↗","영상을 불러오는 중…","영상 준비 완료.","발행처가 사이트 내 재생을 허용하지 않습니다.","원본 출처 썸네일","설명 이미지, 원본 장면 아님","녹화 선택 · 플레이어 하나","공개된 출처 영상"]
};
const keys=["watchHere","close","original","loading","ready","notSupported","sourceThumb","preview","choose","available"];
root.AURORA_VIDEO_UI=Object.fromEntries(Object.entries(names).map(([locale,entries])=>[locale,Object.fromEntries(keys.map((key,i)=>[key,entries[i]]))]));
})(globalThis);
