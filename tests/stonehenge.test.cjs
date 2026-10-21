const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const {webcrypto} = require('node:crypto');
const path = require('node:path');
const root = path.join(__dirname, '..');
function frontend({enabled=true, fetchMode='ok', statuses=[true]}={}) {
  const elements = new Map();
  const node = id => {
    if (!elements.has(id)) elements.set(id, {style:{},hidden:true,disabled:false,textContent:'',listeners:{},
      addEventListener(e,f){this.listeners[e]=f},setAttribute(){},removeAttribute(){},focus(){},
      reset(){this.resetCount=(this.resetCount||0)+1},close(){},querySelector(){return node('submit')},querySelectorAll(){return []}});
    return elements.get(id);
  };
  const fields={name:'TEST — DO NOT CONTACT',phone:'TEST-NO-CALL',goal:'Other',preferred_time:'Evening',interest:'Free consultation'};
  const posts=[], urls=[]; let calls=0;
  const window={stonehengeFormConfig:{enabled,endpoint:'https://example.invalid/exec'},scrollTo(){}};
  const document={getElementById:node,querySelectorAll(){return []},addEventListener(){},
    createElement(){return {remove(){}}},head:{appendChild(script){urls.push(script.src); const u=new URL(script.src);const result=statuses[Math.min(calls++,statuses.length-1)];
      queueMicrotask(()=>{if(result==='error')script.onerror();else if(result!=='timeout')window[u.searchParams.get('callback')]({ok:result===true,id:result==='wrong'?'wrong':u.searchParams.get('id')});});}}};
  const context={window,document,crypto:webcrypto,AbortController,FormData:class{entries(){return Object.entries(fields)}},
    setTimeout(fn,ms){const t=setTimeout(fn,ms===90000?100000:ms===6500?15:ms===15000?10:0); t.unref();return t;},clearTimeout,
    fetch:async (url,opts)=>{posts.push(JSON.parse(opts.body));if(fetchMode==='error')throw Error('offline');if(fetchMode==='hang')return new Promise((r,j)=>opts.signal.addEventListener('abort',()=>j(Error('aborted'))));return {};}};
  vm.runInNewContext(fs.readFileSync(path.join(root,'stonehenge/form.js'),'utf8'), context);
  return {node,posts,urls,fields,submit:()=>node('leadForm').listeners.submit({preventDefault(){}})};
}
// Keep the event loop alive while the accelerated browser timers run.
const keepAlive=setInterval(()=>{},1000);test.after(()=>clearInterval(keepAlive));
test('disabled form never posts',async()=>{const f=frontend({enabled:false});await f.submit();assert.equal(f.posts.length,0);assert.equal(f.node('formError').hidden,false)});
for(const status of [false,'wrong','error','timeout'])test('no false success: '+status,async()=>{const f=frontend({statuses:[status]});await f.submit();assert.notEqual(f.node('successView').style.display,'block');assert.equal(f.node('formError').hidden,false);assert.equal(f.node('submit').disabled,false);assert.equal(f.node('leadForm').resetCount,undefined)});
test('success requires matching ID and explicit acceptance',async()=>{const f=frontend();await f.submit();assert.equal(f.node('successView').style.display,'block');assert.equal(f.posts.length,1);assert.ok(f.urls.every(u=>!u.includes('TEST')))});
for(const fetchMode of ['error','hang'])test('uncertain POST still checks server: '+fetchMode,async()=>{const f=frontend({fetchMode});await f.submit();assert.equal(f.node('successView').style.display,'block')});
test('retry checks prior acceptance without another POST',async()=>{const f=frontend({statuses:[false,false,false,false,false,true]});await f.submit();await f.submit();assert.equal(f.posts.length,1);assert.equal(f.node('successView').style.display,'block')});
test('unconfirmed retry reuses request ID',async()=>{const f=frontend({statuses:[false]});await f.submit();await f.submit();assert.equal(f.posts.length,2);assert.equal(f.posts[0].request_id,f.posts[1].request_id)});
test('unavailable status on retry does not repost',async()=>{const f=frontend({statuses:['error']});await f.submit();await f.submit();assert.equal(f.posts.length,1)});
function backend(){const store=new Map(),mail=[];let fail=false;const c={LockService:{getScriptLock:()=>({waitLock(){},releaseLock(){}})},PropertiesService:{getScriptProperties:()=>({getProperty:k=>store.get(k),setProperty:(k,v)=>store.set(k,v)})},MailApp:{sendEmail:m=>{if(fail)throw Error('quota');mail.push(m)}},ContentService:{MimeType:{JSON:'json',JAVASCRIPT:'js'},createTextOutput:text=>({text,setMimeType(){return this}})}};vm.createContext(c);vm.runInContext(fs.readFileSync(path.join(root,'stonehenge/apps-script/Code.gs'),'utf8'),c);return{c,mail,setFail:()=>fail=true};}
const lead={name:'TEST',phone:'TEST-NO-CALL',goal:'Other',preferred_time:'Evening',interest:'Free consultation',request_id:'diagnostic_test_20261020'};
test('backend validates, deduplicates, preserves recipients, status is queryable',()=>{const b=backend();const post=data=>JSON.parse(b.c.doPost({postData:{contents:JSON.stringify(data)}}).text);assert.equal(post({}).ok,false);assert.equal(b.mail.length,0);assert.equal(post(lead).ok,true);assert.equal(post(lead).ok,true);assert.equal(b.mail.length,1);assert.equal(b.mail[0].to,'bolshakov@joinunited.ae');assert.equal(b.mail[0].cc,'support@joinunited.ae');assert.match(b.c.doGet({parameter:{id:lead.request_id,callback:'check'}}).text,/"ok":true/);assert.equal(b.c.doGet({parameter:{id:lead.request_id,callback:'alert(1)'}}).text,'Invalid request')});
test('backend mail exception never records success',()=>{const b=backend();b.setFail();assert.equal(JSON.parse(b.c.doPost({postData:{contents:JSON.stringify(lead)}}).text).ok,false);assert.match(b.c.doGet({parameter:{id:lead.request_id,callback:'check'}}).text,/"ok":false/)});
