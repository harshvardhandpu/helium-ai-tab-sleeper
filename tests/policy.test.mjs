import test from 'node:test';
import assert from 'node:assert/strict';
import {AI_SITES,IDLE_MS,isProtectedSite,reasonToKeep} from '../extension/policy.mjs';
const now=1800000000000;
const tab={url:'https://example.org/',active:false,highlighted:false,pinned:false,audible:false,status:'complete',discarded:false,autoDiscardable:true,lastAccessed:now-IDLE_MS};
const old={touched:now-IDLE_MS};
test('eligible background tab sleeps at five minutes, never before',()=>{
 assert.equal(reasonToKeep(tab,old,AI_SITES,now),null);
 assert(reasonToKeep(tab,{touched:now-IDLE_MS+1},AI_SITES,now));
 assert(reasonToKeep({...tab,lastAccessed:now-1},old,AI_SITES,now));
 assert(reasonToKeep(tab,{},AI_SITES,now));
});
test('AI/local sites and subdomains are protected; lookalike hosts are not',()=>{
 for(const host of AI_SITES){assert(isProtectedSite('https://'+host));assert(isProtectedSite('https://sub.'+host));}
 for(const host of ['localhost','127.0.0.1','[::1]'])assert(isProtectedSite('http://'+host));
 assert(!isProtectedSite('https://chatgpt.com.evil.example'));
 assert(!isProtectedSite('https://evilchatgpt.com'));
 assert(isProtectedSite('https://custom.ai',['custom.ai']));
});
test('selected, pinned, audible, loading, navigating and sleeping tabs are skipped',()=>{
 for(const key of ['active','highlighted','pinned','audible','discarded'])assert(reasonToKeep({...tab,[key]:true},old,AI_SITES,now));
 assert(reasonToKeep({...tab,status:'loading'},old,AI_SITES,now));
 assert(reasonToKeep({...tab,pendingUrl:'https://next.example'},old,AI_SITES,now));
 assert(reasonToKeep({...tab,autoDiscardable:false},old,AI_SITES,now));
 assert(reasonToKeep({...tab,url:'file:///document'},old,AI_SITES,now));
});
test('drafts, media and agent/work protection veto sleeping',()=>{
 for(const key of ['keep','automation','dirty','media'])assert(reasonToKeep(tab,{...old,[key]:true},AI_SITES,now));
});
