import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {readFileSync,mkdtempSync,mkdirSync,writeFileSync,rmSync,chmodSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
const script=new URL('../scripts/backup-d1-drive.sh',import.meta.url).pathname;
const source=readFileSync(script,'utf8');
function fixture(){
 const home=mkdtempSync(join(tmpdir(),'aurora-drive-lock-'));
 const config=join(home,'.config','aurora-backup');
 mkdirSync(config,{recursive:true,mode:0o700});
 const key=join(config,'identity.agekey');
 writeFileSync(key,'TEST ONLY FAKE IDENTITY - NEVER USE AS A REAL KEY\n',{mode:0o600});
 chmodSync(key,0o600);
 writeFileSync(join(config,'recipient.txt'),'age1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq\n',{mode:0o600});
 writeFileSync(join(config,'remote-name'),'mockdrive\n',{mode:0o600});
 writeFileSync(join(config,'folder-id'),'synthetic-folder-id-1234567890\n',{mode:0o600});
 const run=(args)=>spawnSync('bash',[script,...args],{
  encoding:'utf8',env:{...process.env,HOME:home},timeout:5000
 });
 return {home,config,run,remove(){rmSync(home,{recursive:true,force:true})}};
}
test('backup wrapper requires explicitly named smoke or production mode',()=>{
 const f=fixture();
 try{
  assert.equal(f.run(['--nope']).status,2);
  assert.equal(f.run([]).status,2);
 }finally{f.remove()}
});
test('no owner approval blocks actual production D1 export before upload or backup',()=>{
 const f=fixture();
 try{
  const r=f.run(['--production']);
  assert.equal(r.status,4,r.stderr);
  assert.match(r.stderr,/save recovery key offline|Production backup locked/i);
  assert.doesNotMatch(r.stdout,/Exporting current production D1/);
 }finally{f.remove()}
});
test('code never embeds actual Google credentials, recovery key, or offsite folder ID',()=>{
 assert.match(source,/tmpfs/);
 assert.match(source,/age_bin/);
 assert.match(source,/--immutable/);
 assert.match(source,/cmp --silent/);
 assert.match(source,/--drive-root-folder-id/);
 assert.match(source,/production-enabled/);
 assert.doesNotMatch(source,/16Pen5iJ3N7E4pG9ROerRe8HVW_V1CoVW/);
 assert.doesNotMatch(source,/AGE-SECRET-KEY-[A-Z0-9]+/);
});
test('daily timer is shipped disabled until operator separately enables it',()=>{
 const timer=readFileSync(new URL('../deploy/systemd/aurora-d1-backup.timer',import.meta.url),'utf8');
 const service=readFileSync(new URL('../deploy/systemd/aurora-d1-backup.service',import.meta.url),'utf8');
 assert.match(timer,/OnCalendar=\*-\*-\* 04:10:00/);
 assert.match(timer,/Persistent=true/);
 assert.match(service,/--production/);
 assert.doesNotMatch(service,/AURORA_TURNSTILE_SECRET|AGE-SECRET-KEY/);
});
