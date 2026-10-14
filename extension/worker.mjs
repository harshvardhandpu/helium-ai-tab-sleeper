import {AI_SITES,isProtectedSite,reasonToKeep} from './policy.mjs';
const ALARM='check-inactive-tabs';
let queue=Promise.resolve();
function serialize(fn){const next=queue.then(fn);queue=next.catch(console.error);return next;}
async function state(){const s=await chrome.storage.session.get({tabs:{},slept:0});return s;}
async function initialize(){
 const s=await state(),tabs=await chrome.tabs.query({});const live={};
 for(const t of tabs)live[t.id]=s.tabs[t.id]||{touched:Date.now()};
 await chrome.storage.session.set({tabs:live});
 const alarm=await chrome.alarms.get(ALARM);if(!alarm)await chrome.alarms.create(ALARM,{periodInMinutes:0.5});
}
async function scan(){
 const s=await state(),{sites,paused}=await chrome.storage.local.get({sites:AI_SITES,paused:false});
 if(paused)return;
 const now=Date.now(),tabs=await chrome.tabs.query({}),live={};let changed=false;
 for(const t of tabs){
  const entry=s.tabs[t.id]||{touched:now};live[t.id]=entry;
  // Also opt protected sites out of the browser's slower native discarder.
  if(isProtectedSite(t.url,sites)&&/^https?:\/\//i.test(t.url||'')){
   if(t.autoDiscardable!==false){try{await chrome.tabs.update(t.id,{autoDiscardable:false});entry.siteKept=true;changed=true;}catch{}}
  }else if(entry.siteKept&&!entry.keep&&!entry.automation){
   try{await chrome.tabs.update(t.id,{autoDiscardable:true});entry.siteKept=false;changed=true;}catch{}
  }
  if(t.active||t.audible){entry.touched=now;changed=true;}
  if(reasonToKeep(t,entry,sites,now))continue;
  // Re-read immediately before the operation so activation/navigation races
  // cannot unload a tab the user has just selected.
  try{const fresh=await chrome.tabs.get(t.id);if(reasonToKeep(fresh,entry,sites,Date.now()))continue;
   const discarded=await chrome.tabs.discard(t.id);if(discarded?.discarded){s.slept++;changed=true;}
  }catch{/* Closed/activated/changed tab: leave it alone. */}
 }
 if(changed||Object.keys(live).length!==Object.keys(s.tabs).length)await chrome.storage.session.set({tabs:live,slept:s.slept});
}
chrome.runtime.onInstalled.addListener(()=>serialize(initialize));
chrome.runtime.onStartup.addListener(()=>serialize(initialize));
chrome.alarms.onAlarm.addListener(a=>{if(a.name===ALARM)serialize(scan);});
chrome.tabs.onCreated.addListener(t=>serialize(async()=>{const s=await state();s.tabs[t.id]={touched:Date.now()};await chrome.storage.session.set({tabs:s.tabs});}));
chrome.tabs.onActivated.addListener(a=>serialize(async()=>{const s=await state();s.tabs[a.tabId]={...s.tabs[a.tabId],touched:Date.now()};await chrome.storage.session.set({tabs:s.tabs});}));
chrome.tabs.onUpdated.addListener((id,change)=>{if(change.status==='loading')serialize(async()=>{const s=await state();const old=s.tabs[id]||{};s.tabs[id]={keep:old.keep,automation:old.automation,siteKept:old.siteKept,touched:Date.now()};await chrome.storage.session.set({tabs:s.tabs});});});
chrome.tabs.onRemoved.addListener(id=>serialize(async()=>{const s=await state();delete s.tabs[id];await chrome.storage.session.set({tabs:s.tabs});}));
chrome.tabs.onReplaced.addListener((added,removed)=>serialize(async()=>{const s=await state();s.tabs[added]={...s.tabs[removed],touched:Date.now()};delete s.tabs[removed];await chrome.storage.session.set({tabs:s.tabs});}));
chrome.runtime.onMessage.addListener((m,sender,respond)=>{
 const fromPage=sender.tab?.id!==undefined&&!sender.url?.startsWith(chrome.runtime.getURL(''));
 if(m.type==='guard'&&fromPage){serialize(async()=>{
  const s=await state(),id=sender.tab.id,entry=s.tabs[id]||{touched:Date.now()};
  if(m.dirty)entry.dirty=true;if(m.automation)entry.automation=true;
  if(m.media!==undefined){entry.mediaFrames={...entry.mediaFrames,[sender.frameId]:!!m.media};entry.media=Object.values(entry.mediaFrames).some(Boolean);entry.touched=Date.now();}
  if(m.touched)entry.touched=Date.now();s.tabs[id]=entry;await chrome.storage.session.set({tabs:s.tabs});
 });return false;}
 // Management requests are accepted only from this extension's own popup.
 if(fromPage||sender.id!==chrome.runtime.id)return false;
 serialize(async()=>{
  const s=await state();
  if(m.type==='keep'){
   const tab=await chrome.tabs.get(m.id);s.tabs[m.id]={...s.tabs[m.id],keep:!!m.keep,touched:Date.now()};
   await chrome.tabs.update(tab.id,{autoDiscardable:!m.keep});await chrome.storage.session.set({tabs:s.tabs});
  }
  const {sites,paused}=await chrome.storage.local.get({sites:AI_SITES,paused:false});
  if(m.type==='protect-site'){
   const tab=await chrome.tabs.get(m.id),host=new URL(tab.url).hostname;
   if(!sites.includes(host))sites.push(host);await chrome.storage.local.set({sites});
   if(tab.autoDiscardable!==false){await chrome.tabs.update(tab.id,{autoDiscardable:false});s.tabs[tab.id]={...s.tabs[tab.id],siteKept:true};await chrome.storage.session.set({tabs:s.tabs});}
  }
  if(m.type==='pause')await chrome.storage.local.set({paused:!!m.paused});
  const tabs=await chrome.tabs.query({});return {slept:s.slept,paused:m.type==='pause'?!!m.paused:paused,tabs:tabs.map(t=>({id:t.id,url:t.url,keep:!!s.tabs[t.id]?.keep,reason:reasonToKeep(t,s.tabs[t.id],sites)}))};
 }).then(respond,e=>respond({error:e.message}));return true;
});
serialize(initialize);
