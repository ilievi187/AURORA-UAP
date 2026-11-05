import test from 'node:test';
import assert from 'node:assert/strict';
import {buildDiscoverySnapshot,normalizeDiscoveryItems} from '../scripts/update-public-discovery-snapshot.mjs';
import {onRequestGet as discovery} from '../functions/api/discovery.js';
import {REGIONS} from '../functions/_lib/source-catalog.js';
const now=new Date('2026-11-06T12:00:00Z');
const item=n=>({title:'Sourced UAP article '+n,url:'https://thedebrief.org/news/item-'+n+'/',source:'The Debrief',source_id:'the-debrief',published:'2026-11-05T12:00:00Z'});
test('discovery snapshot builds all catalog regions from attributed HTTPS source links',async()=>{
 const data=await buildDiscoverySnapshot(async({region})=>({status:'live',region,checked:['the-debrief'],failed:[],items:[item(region+'-1'),item(region+'-2')]}),now);
 assert.deepEqual(Object.keys(data.regions),REGIONS);
 assert.equal(data.checked_on,'2026-11-06');
 assert.equal(data.regions.all.count,2);
 assert.equal(data.regions.americas.items[0].source_region,'americas');
 assert.equal(data.regions.all.items[0].feed_host,'thedebrief.org');
 assert.ok(!JSON.stringify(data).includes('reporter_email'));
});
test('discovery snapshot rejects unknown providers and malicious or duplicate URLs',()=>{
 const x=normalizeDiscoveryItems([item('safe'),item('safe'),{...item('host'),url:'https://evil.example/redirect'},
  {...item('https'),url:'http://thedebrief.org/post'},
  {...item('credentials'),url:'https://me:pw@thedebrief.org/post'},
  {...item('unknown'),source_id:'nonexistent-provider'},item('also')]);
 assert.deepEqual(x.map(item=>item.title),['Sourced UAP article safe','Sourced UAP article also']);
});
test('valid production snapshot returns cached publisher matches without worker network fanout',async()=>{
 const stamp=new Date().toISOString().slice(0,10);
 const raw={schema_version:1,checked_on:stamp,regions:{all:{status:'cached',checked:['the-debrief'],failed:[],items:[item('one'),item('two')]}}};
 let fetched=0,assets=0;
 const res=await discovery({request:new Request('https://aurorauap.org/api/discovery?region=all'),env:{ASSETS:{async fetch(){assets++;return Response.json(raw)}}},
  fetcher:async()=>{fetched++;throw Error('No visitor-source RSS fetches')} });
 assert.equal(res.status,200);
 assert.equal((await res.json()).cache_source,'scheduled_publisher_snapshot');
 assert.equal(assets,1);assert.equal(fetched,0);
});
test('missing snapshot fails without unbounded source scanning and invalid queries remain rejected',async()=>{
 let fetched=0;
 const env={ASSETS:{async fetch(){return new Response('not found',{status:404})}}};
 const res=await discovery({request:new Request('https://aurorauap.org/api/discovery?region=all'),env,fetcher:async()=>{fetched++;throw Error('forbidden')}});
 assert.equal(res.status,503);assert.equal((await res.json()).error,'source_snapshot_unavailable');
 const rejected=await discovery({request:new Request('https://aurorauap.org/api/discovery?region=all&feed=https://evil.example'),env});
 assert.equal(rejected.status,400);assert.equal(fetched,0);
});
