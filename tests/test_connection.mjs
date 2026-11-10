import test from 'node:test';
import assert from 'node:assert/strict';
import {requestJSON} from '../gitcraft/web/connection.mjs';

test('a successful request preserves HTTP status and parsed data',async()=>{
 const response={ok:false,status:400,json:async()=>({error:'Unsupported command'})};
 const result=await requestJSON('/command',{method:'POST'},{fetcher:async()=>response});
 assert.equal(result.response,response);assert.equal(result.result.error,'Unsupported command');
});
test('a stalled mutation times out, aborts and is never retried',async()=>{
 let calls=0,signal;
 await assert.rejects(requestJSON('/command',{method:'POST'},{timeout:15,fetcher:async(_,options)=>{calls++;signal=options.signal;return new Promise(()=>{});}}),/outcome unknown/);
 assert.equal(calls,1);assert.equal(signal.aborted,true);
});
test('a stalled response body is bounded too',async()=>{
 await assert.rejects(requestJSON('/state',{}, {timeout:15,fetcher:async()=>({json:()=>new Promise(()=>{})})}),/timed out/);
});
test('network and invalid JSON errors remain failures rather than fabricated state',async()=>{
 await assert.rejects(requestJSON('/state',{}, {fetcher:async()=>{throw new Error('offline');}}),/offline/);
 await assert.rejects(requestJSON('/state',{}, {fetcher:async()=>({json:async()=>{throw new SyntaxError('invalid JSON');}})}),/invalid JSON/);
});
