// Sends only protection flags, never page text, form values, or credentials.
const tell=flags=>chrome.runtime.sendMessage({type:'guard',...flags}).catch(()=>{});
if(navigator.webdriver)tell({automation:true});
document.addEventListener('input',()=>tell({dirty:true}),true);
document.addEventListener('change',()=>tell({dirty:true}),true);
let lastTouch=0;
function touch(){const now=Date.now();if(now-lastTouch>15000){lastTouch=now;tell({touched:true});}}
document.addEventListener('pointerdown',touch,true);
document.addEventListener('keydown',touch,true);
// A form stays protected until navigation: a SPA can retain an unsent draft
// even after a submit event. Frame guards are combined conservatively.
document.addEventListener('play',()=>tell({media:true}),true);
document.addEventListener('playing',()=>tell({media:true}),true);
const mediaState=()=>tell({media:[...document.querySelectorAll('video,audio')].some(m=>!m.paused&&!m.ended)});
document.addEventListener('pause',mediaState,true);
document.addEventListener('ended',mediaState,true);
