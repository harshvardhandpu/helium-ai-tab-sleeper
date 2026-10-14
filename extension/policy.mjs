export const IDLE_MS=5*60*1000;
export const AI_SITES=['chatgpt.com','chat.openai.com','claude.ai','gemini.google.com','aistudio.google.com','grok.com','perplexity.ai','copilot.microsoft.com','chat.deepseek.com','chat.qwen.ai','chat.mistral.ai','poe.com'];
export function isProtectedSite(url,sites=AI_SITES){
  try{const h=new URL(url).hostname.toLowerCase();return sites.some(s=>h===s||h.endsWith('.'+s))||h==='localhost'||h==='127.0.0.1'||h==='[::1]';}catch{return true;}
}
export function reasonToKeep(tab,state={},sites=AI_SITES,now=Date.now()){
  if(!/^https?:\/\//i.test(tab.url||'')||tab.pendingUrl)return 'internal page or navigating';
  if(isProtectedSite(tab.url,sites))return 'AI / local site';
  if(tab.active||tab.highlighted)return 'selected tab';
  if(tab.pinned)return 'pinned tab';
  if(tab.audible)return 'playing audio';
  if(tab.status!=='complete'||tab.discarded)return 'loading or sleeping';
  if(tab.autoDiscardable===false||state.keep)return 'kept active for work';
  if(state.automation)return 'automated browser session';
  if(state.dirty)return 'unsent form input';
  if(state.media)return 'playing media';
  if(now-Math.max(tab.lastAccessed||0,state.touched||now)<IDLE_MS)return 'used within five minutes';
  return null;
}
