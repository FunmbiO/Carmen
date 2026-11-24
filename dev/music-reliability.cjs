// Developer check for the music player. It swaps YouTube's player for a stand-in that can fail on purpose:
// slow to be ready, ignoring play calls, needing a tap, never becoming ready, and a script that fails to load.
// Needs Playwright (not a project dependency) and the built site served on port 4173:
//   npm run build && npx vite preview --port 4173 --host 127.0.0.1 & node dev/music-reliability.cjs
const { chromium } = require('playwright');
// A stand-in for the YouTube player with switches for the failures we are guarding against.
const FAKE = `
window.__log=[];window.__cfg=window.__cfg||{};
window.YT={PlayerState:{PLAYING:1,PAUSED:2,ENDED:0,BUFFERING:3},Player:function(el,opts){
  const f=document.createElement('iframe');f.src='about:blank';el.replaceWith(f);
  let vid=opts.videoId,state=-1,t=0,timer=null,calls=0,self=this;const ev=opts.events;
  const set=(s)=>{state=s;ev.onStateChange({data:s});if(s===1){clearInterval(timer);timer=setInterval(()=>t+=0.3,300)}else clearInterval(timer)};
  this.getPlayerState=()=>state;this.getVideoData=()=>({video_id:vid});
  this.playVideo=()=>{calls++;__log.push('play '+vid);
    if(window.__cfg.ignorePlays&&__cfg.ignored<__cfg.ignorePlays){__cfg.ignored++;return}
    if(window.__cfg.needTap&&!window.__tapped)return;
    setTimeout(()=>set(1),30)};
  this.pauseVideo=()=>{__log.push('pause '+vid);set(2)};this.setVolume=()=>{};this.getDuration=()=>200;this.getCurrentTime=()=>t;this.seekTo=(s)=>{t=s};
  this.loadVideoById=this.cueVideoById=(v)=>{vid=v};this.destroy=()=>{f.remove();__log.push('destroy')};
  const n=(window.__built=(window.__built||0)+1);
  const delay=(window.__cfg.readyDelay||30)+(window.__cfg.neverReadyFirst&&n<=4?1e9:0);
  setTimeout(()=>ev.onReady({}),delay);
}};
window.onYouTubeIframeAPIReady&&window.onYouTubeIframeAPIReady();`;
async function run(name, cfg, steps) {
  const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 390, height: 900 } })).newPage();
  const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.addInitScript((c) => { window.__cfg = Object.assign({ ignored: 0 }, c); document.addEventListener('pointerup', () => { window.__tapped = true; }, true); }, cfg);
  let apiCalls = 0;
  await p.route('https://www.youtube.com/iframe_api*', (r) => { apiCalls++; if (cfg.apiFailFirst && apiCalls <= cfg.apiFailFirst) return r.abort(); r.fulfill({ contentType: 'application/javascript', body: FAKE }); });
  await p.goto('http://127.0.0.1:4173/#bloom');
  const out = await steps(p, () => ({ apiCalls }));
  const playing = await p.evaluate(() => document.querySelector('#v-bloom .sound').classList.contains('is-playing'));
  const hint = await p.evaluate(() => !document.querySelector('#v-bloom .sound-hint').hidden);
  console.log(`${name.padEnd(34)} playing=${playing} hint=${hint} ${out || ''} ${errs.length ? 'ERR ' + errs : ''}`);
  await b.close();
}
(async () => {
  await run('A normal start', {}, async (p) => { await p.waitForTimeout(1500); });
  await run('B player ready only after 3s', { readyDelay: 3000 }, async (p) => { await p.waitForTimeout(4500); });
  await run('C first 3 play calls ignored', { ignorePlays: 3 }, async (p) => { await p.waitForTimeout(3500); });
  await run('D blocked until a tap (hint, then tap)', { needTap: 1 }, async (p) => {
    await p.waitForTimeout(100); await p.evaluate(() => { window.__tapped = false; });
    await p.waitForTimeout(4200);
    const h = await p.evaluate(() => !document.querySelector('#v-bloom .sound-hint').hidden);
    await p.mouse.click(200, 400); await p.waitForTimeout(900);
    return `hintBeforeTap=${h}`;
  });
  await run('E player never ready, rebuilt', { neverReadyFirst: 1 }, async (p) => { await p.waitForTimeout(12000); return 'built=' + (await p.evaluate(() => window.__built)); });
  await run('F API script fails twice', { apiFailFirst: 2 }, async (p, info) => { await p.waitForTimeout(6500); return 'apiRequests=' + info().apiCalls; });
  await run('G user pause stays paused on tap', {}, async (p) => {
    await p.waitForTimeout(1200); await p.click('#v-bloom .play-pause'); await p.waitForTimeout(400);
    await p.mouse.click(200, 120); await p.waitForTimeout(1200);
    const playing = await p.evaluate(() => document.querySelector('#v-bloom .sound').classList.contains('is-playing'));
    return `afterTapPlaying=${playing}`;
  });
})();
