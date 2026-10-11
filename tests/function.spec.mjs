import { test, expect } from '@playwright/test';
import handler from '../netlify/functions/uhuru-data.mjs';

const ORIGINAL_ENV={...process.env};
const ORIGINAL_FETCH=global.fetch;

function configure(){
  process.env.GITHUB_TOKEN='token';
  process.env.GITHUB_OWNER='owner';
  process.env.GITHUB_REPO='repo';
  process.env.GITHUB_BRANCH='develop';
  process.env.UHURU_SYNC_KEY='secret';
}
function req(method='GET',key='secret',body){
  return new Request('http://localhost/.netlify/functions/uhuru-data',{
    method,headers:{'x-uhuru-key':key,'content-type':'application/json'},
    body:body?JSON.stringify(body):undefined
  });
}
function ghFile(state,sha='sha1'){
  return {sha,content:Buffer.from(JSON.stringify(state),'utf8').toString('base64')};
}

test.describe.configure({mode:'serial'});

test.afterEach(()=>{
  process.env={...ORIGINAL_ENV};
  global.fetch=ORIGINAL_FETCH;
});

test('function rejects invalid sync key before GitHub access', async ()=>{
  configure();
  let called=false;global.fetch=async()=>{called=true;throw new Error('should not call')};
  const r=await handler(req('GET','wrong'));
  expect(r.status).toBe(401);
  expect((await r.json()).error).toBe('Invalid sync key');
  expect(called).toBe(false);
});

test('function GET decodes GitHub state from configured branch', async ()=>{
  configure();
  let url='';
  global.fetch=async input=>{
    url=String(input);
    return new Response(JSON.stringify(ghFile({version:2,settings:{stepGoal:8000}})),{status:200});
  };
  const r=await handler(req());
  expect(r.status).toBe(200);
  const j=await r.json();
  expect(j.state.settings.stepGoal).toBe(8000);
  expect(url).toContain('ref=develop');
});

test('function PUT writes state to configured branch with current sha', async ()=>{
  configure();
  const calls=[];
  global.fetch=async (input,init={})=>{
    calls.push({url:String(input),method:init.method||'GET',body:init.body});
    if((init.method||'GET')==='GET') return new Response(JSON.stringify(ghFile({version:2},'oldsha')),{status:200});
    return new Response(JSON.stringify({commit:{sha:'newcommit'}}),{status:200});
  };
  const state={version:2,settings:{stepGoal:9000}};
  const r=await handler(req('PUT','secret',{state,message:'test update'}));
  expect(r.status).toBe(200);
  expect((await r.json()).commit).toBe('newcommit');
  const put=calls.find(x=>x.method==='PUT');
  const body=JSON.parse(put.body);
  expect(body.branch).toBe('develop');
  expect(body.sha).toBe('oldsha');
  expect(body.message).toBe('test update');
  expect(JSON.parse(Buffer.from(body.content,'base64').toString('utf8')).settings.stepGoal).toBe(9000);
});

test('function retries one GitHub write conflict with refreshed sha', async ()=>{
  configure();
  let gets=0,puts=0;
  global.fetch=async (input,init={})=>{
    const method=init.method||'GET';
    if(method==='GET'){
      gets++;
      return new Response(JSON.stringify(ghFile({version:2},gets===1?'sha1':'sha2')),{status:200});
    }
    puts++;
    if(puts===1)return new Response(JSON.stringify({message:'conflict'}),{status:409});
    const body=JSON.parse(init.body);
    expect(body.sha).toBe('sha2');
    return new Response(JSON.stringify({commit:{sha:'resolved'}}),{status:200});
  };
  const r=await handler(req('PUT','secret',{state:{version:2}}));
  expect(r.status).toBe(200);
  expect((await r.json()).commit).toBe('resolved');
  expect(gets).toBe(2);
  expect(puts).toBe(2);
});

test('function validates PUT body', async ()=>{
  configure();
  global.fetch=async()=>new Response(JSON.stringify(ghFile({version:2})),{status:200});
  const r=await handler(req('PUT','secret',{foo:'bar'}));
  expect(r.status).toBe(400);
  expect((await r.json()).error).toBe('Missing state');
});

test('function returns 405 for unsupported methods', async ()=>{
  configure();
  global.fetch=async()=>{throw new Error('not used')};
  const r=await handler(req('DELETE'));
  expect(r.status).toBe(405);
});

test('function reports incomplete server config', async ()=>{
  delete process.env.GITHUB_TOKEN;
  delete process.env.GITHUB_OWNER;
  delete process.env.GITHUB_REPO;
  delete process.env.UHURU_SYNC_KEY;
  const r=await handler(new Request('http://localhost/.netlify/functions/uhuru-data',{method:'GET'}));
  expect(r.status).toBe(500);
  expect((await r.json()).error).toMatch(/configuration is incomplete/i);
});
