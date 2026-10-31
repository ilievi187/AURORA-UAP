import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {resolveMediaPlayback} from "../media-player.js";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const cases=JSON.parse(read("data/cases.json")).cases;
test("world archive contains ten or more actual navigable pages of source-linked cases",()=>{
 const js=read("archive-directory.js"),html=read("archive.html");
 assert.ok(cases.length>=100,"archive needs at least 100 sourced records");
 assert.equal(new Set(cases.map(c=>c.id)).size,cases.length);
 assert.match(js,/const PAGE_SIZE=10/);
 assert.match(js,/Math\.ceil\(total\/PAGE_SIZE\)/);
 assert.match(js,/slice\(\(currentPage-1\)\*PAGE_SIZE,currentPage\*PAGE_SIZE\)/);
 assert.match(js,/u\.searchParams\.set\("page",String\(page\)\)/);
 assert.match(js,/querySelectorAll|pageButton\(String\(page\),page,page===currentPage\)/);
 assert.match(html,/id="archivePagination"/);
 assert.ok(Math.ceil(cases.length/10)>=10);
});
test("real embedded playback and source-only video are independent archive filters",()=>{
 const js=read("archive-directory.js"),html=read("archive.html");
 assert.match(html,/value="playable" data-archive-label="hasPlayable"/);
 assert.match(html,/value="video" data-archive-label="hasVideo"/);
 assert.match(js,/if\(mediaType==="playable"&&!playable\(r\)\)return false/);
 assert.match(js,/if\(mediaType==="video"/);
 const withPlayer=cases.filter(c=>c.media?.some(m=>resolveMediaPlayback(m)));
 assert.ok(withPlayer.length>=3,"Navy and DVIDS video records should be playable");
 const linkedOnly=cases.filter(c=>c.media?.some(m=>m.type==="video")&&!c.media.some(m=>resolveMediaPlayback(m)));
 assert.ok(linkedOnly.length>=1,"external publisher-only videos should not be labeled embedded");
 for(const c of cases){
  assert.match(c.source?.url||"",/^https:\/\//);
  assert.ok(c.summary?.en?.length>=45);
  assert.ok(c.story?.en?.length>=1);
 }
});
