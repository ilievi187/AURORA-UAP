// Supabase email invitations use the site's default root URL.
 // Transfer only recognized auth fragments to the report page where Supabase
 // can consume the credentials. Never log or transmit URL fragments elsewhere.
(()=>{
 const fragment=location.hash;
 if(!fragment.startsWith("#"))return;
 const params=new URLSearchParams(fragment.slice(1));
 if(!["invite","magiclink","signup","recovery"].includes(params.get("type")))return;
 if(!params.get("access_token")||!params.get("refresh_token"))return;
 location.replace("/report.html"+fragment);
})();
