let current,summary;
async function refresh(message={type:'status'}){
 summary=await chrome.runtime.sendMessage(message);
 if(summary.error){document.querySelector('#status').textContent=summary.error;return;}
 [current]=await chrome.tabs.query({active:true,currentWindow:true});
 const info=summary.tabs.find(t=>t.id===current?.id);
 document.querySelector('#status').textContent=`${summary.slept} tabs unloaded this session. ${summary.paused?'Sleeping paused.':'Sleeping enabled.'}`;
 document.querySelector('#current').textContent=info?.reason?`This tab: ${info.reason}.`:'This tab can sleep when inactive.';
 document.querySelector('#keep').textContent=info?.keep?'Release work protection':'Keep this tab active for work';
 document.querySelector('#pause').textContent=summary.paused?'Resume sleeping':'Pause sleeping';
}
document.querySelector('#keep').onclick=()=>refresh({type:'keep',id:current.id,keep:!summary.tabs.find(t=>t.id===current.id)?.keep});
document.querySelector('#site').onclick=()=>refresh({type:'protect-site',id:current.id});
document.querySelector('#pause').onclick=()=>refresh({type:'pause',paused:!summary.paused});
refresh();
