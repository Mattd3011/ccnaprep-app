import React, { useState, useEffect, useRef, useMemo } from "react";

/* ============================================================================
   CCNA 200-301 — DEEP SPACE OBSERVATORY
   An interactive, self-paced curriculum rendered as a celestial atlas.
   Single-file React component. Works in Vite/React; localStorage-persisted
   progress degrades gracefully to in-memory state where storage is blocked.
   ============================================================================ */

/* ----------------------------- safe storage ------------------------------ */
const memStore = {};
const storage = {
  get(key, fallback) {
    try {
      const v = window.localStorage.getItem(key);
      return v == null ? fallback : JSON.parse(v);
    } catch (e) {
      return key in memStore ? memStore[key] : fallback;
    }
  },
  set(key, value) {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      memStore[key] = value;
    }
  },
};

/* ------------------------------- styles ---------------------------------- */
const STYLE = `
@import url('https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@400;500;600;700&family=Exo+2:ital,wght@0,300;0,400;0,500;0,600;1,400&family=JetBrains+Mono:wght@400;500;700&display=swap');

* { box-sizing: border-box; margin: 0; padding: 0; }

.ccna-root {
  --void:#04050d; --deep:#080a1b; --panel:#0e1130; --panel-2:#13183f;
  --line:rgba(150,160,255,0.13); --line-bright:rgba(150,170,255,0.32);
  --ink:#e9e9ff; --ink-dim:#a7a9d4; --ink-faint:#7174a3;
  --cyan:#52d9ff; --violet:#9d83ff; --magenta:#ff6fb8;
  --gold:#ffce5e; --coral:#ff8169; --teal:#46e3b6; --star:#fbfaff;
  font-family:'Exo 2',system-ui,sans-serif;
  color:var(--ink);
  background:var(--void);
  min-height:100vh;
  position:relative;
  overflow-x:hidden;
  line-height:1.65;
  -webkit-font-smoothing:antialiased;
}

/* ---- starfield + nebula ---- */
.sky { position:fixed; inset:0; z-index:0; overflow:hidden; pointer-events:none; }
.nebula {
  position:absolute; border-radius:50%; filter:blur(80px); opacity:0.5;
  mix-blend-mode:screen; animation:drift 38s ease-in-out infinite alternate;
}
.neb-1 { width:60vw; height:60vw; left:-12vw; top:-14vw;
  background:radial-gradient(circle,#5b3aa8 0%,transparent 68%); }
.neb-2 { width:54vw; height:54vw; right:-14vw; top:18vh;
  background:radial-gradient(circle,#9a2f6e 0%,transparent 66%);
  animation-duration:46s; animation-delay:-8s; }
.neb-3 { width:48vw; height:48vw; left:24vw; bottom:-22vw;
  background:radial-gradient(circle,#1d6c8e 0%,transparent 66%);
  animation-duration:52s; animation-delay:-20s; }
@keyframes drift {
  0%   { transform:translate(0,0) scale(1); }
  100% { transform:translate(5vw,4vh) scale(1.18); }
}
.stars, .stars2, .stars3 { position:absolute; inset:0; }
.stars  { animation:tw 4.5s ease-in-out infinite alternate; }
.stars2 { animation:tw 7s ease-in-out infinite alternate; }
.stars3 { animation:tw 9.5s ease-in-out infinite alternate; }
@keyframes tw { 0%{opacity:0.35;} 100%{opacity:1;} }

/* ---- layout ---- */
.wrap { position:relative; z-index:2; max-width:1080px; margin:0 auto; padding:0 22px 120px; }

/* ---- masthead ---- */
.mast { text-align:center; padding:74px 0 30px; }
.badge {
  display:inline-flex; align-items:center; gap:8px;
  font-family:'JetBrains Mono',monospace; font-size:11px; letter-spacing:3px;
  text-transform:uppercase; color:var(--cyan);
  border:1px solid var(--line-bright); border-radius:30px;
  padding:7px 16px; margin-bottom:24px;
  background:rgba(82,217,255,0.05);
}
.badge .dot { width:6px;height:6px;border-radius:50%;background:var(--cyan);
  box-shadow:0 0 8px var(--cyan); animation:pulse 2.2s ease-in-out infinite; }
@keyframes pulse { 0%,100%{opacity:1;} 50%{opacity:0.25;} }
.mast h1 {
  font-family:'Chakra Petch',sans-serif; font-weight:700;
  font-size:clamp(2.4rem,6vw,4.1rem); line-height:1.04; letter-spacing:-1px;
  background:linear-gradient(120deg,#fff 12%,var(--cyan) 42%,var(--violet) 66%,var(--magenta) 92%);
  -webkit-background-clip:text; background-clip:text; color:transparent;
  text-shadow:0 0 60px rgba(157,131,255,0.25);
}
.mast .sub {
  margin:18px auto 0; max-width:620px; color:var(--ink-dim);
  font-size:1.04rem; font-weight:300;
}
.mast .exam {
  margin-top:14px; font-family:'JetBrains Mono',monospace;
  font-size:12px; color:var(--ink-faint); letter-spacing:1px;
}

/* ---- mission progress ---- */
.mission {
  display:flex; align-items:center; gap:26px; flex-wrap:wrap;
  justify-content:center; margin:34px auto 8px;
  border:1px solid var(--line); border-radius:18px;
  background:linear-gradient(180deg,rgba(19,24,63,0.7),rgba(8,10,27,0.7));
  padding:22px 30px; max-width:680px;
  backdrop-filter:blur(6px);
}
.orbit-wrap { position:relative; width:96px; height:96px; flex-shrink:0; }
.orbit-num {
  position:absolute; inset:0; display:flex; flex-direction:column;
  align-items:center; justify-content:center;
}
.orbit-num b { font-family:'Chakra Petch',sans-serif; font-size:1.5rem; color:#fff; }
.orbit-num span { font-size:9px; letter-spacing:2px; color:var(--ink-faint);
  text-transform:uppercase; font-family:'JetBrains Mono',monospace; }
.mission-txt { flex:1; min-width:220px; }
.mission-txt h3 { font-family:'Chakra Petch',sans-serif; font-size:1.05rem;
  font-weight:600; margin-bottom:4px; }
.mission-txt p { font-size:0.86rem; color:var(--ink-dim); }
.mbar { height:7px; border-radius:6px; background:rgba(255,255,255,0.06);
  margin-top:12px; overflow:hidden; }
.mbar i { display:block; height:100%; border-radius:6px;
  background:linear-gradient(90deg,var(--cyan),var(--violet),var(--magenta));
  box-shadow:0 0 12px rgba(157,131,255,0.6); transition:width .6s cubic-bezier(.2,.8,.2,1); }
.reset-btn {
  font-family:'JetBrains Mono',monospace; font-size:10px; letter-spacing:1px;
  color:var(--ink-faint); background:none; border:1px solid var(--line);
  padding:6px 12px; border-radius:8px; cursor:pointer; transition:.2s;
}
.reset-btn:hover { color:var(--coral); border-color:var(--coral); }

/* ---- section heading ---- */
.eyebrow {
  font-family:'JetBrains Mono',monospace; font-size:11px; letter-spacing:3px;
  text-transform:uppercase; color:var(--violet); margin:54px 0 6px;
  display:flex; align-items:center; gap:10px;
}
.eyebrow::before { content:''; width:26px; height:1px; background:var(--violet); }

/* ---- sector grid ---- */
.sectors { display:grid; grid-template-columns:repeat(auto-fill,minmax(300px,1fr));
  gap:18px; margin-top:14px; }
.sector {
  position:relative; text-align:left; cursor:pointer;
  border:1px solid var(--line); border-radius:18px; padding:24px 22px;
  background:linear-gradient(165deg,rgba(19,24,63,0.78),rgba(8,10,27,0.86));
  overflow:hidden; transition:transform .25s cubic-bezier(.2,.8,.2,1),
    border-color .25s, box-shadow .25s;
}
.sector:hover { transform:translateY(-6px); border-color:var(--sc);
  box-shadow:0 18px 44px -18px var(--sc); }
.sector .glow {
  position:absolute; width:160px; height:160px; border-radius:50%;
  filter:blur(46px); opacity:0.4; right:-50px; top:-50px; background:var(--sc);
}
.sector .idx {
  font-family:'JetBrains Mono',monospace; font-size:11px; letter-spacing:2px;
  color:var(--sc);
}
.sector h3 {
  font-family:'Chakra Petch',sans-serif; font-weight:600; font-size:1.28rem;
  margin:8px 0 8px; color:#fff;
}
.sector p { font-size:0.9rem; color:var(--ink-dim); min-height:48px; }
.sector .meta {
  display:flex; align-items:center; justify-content:space-between;
  margin-top:16px; padding-top:14px; border-top:1px solid var(--line);
}
.sector .meta span { font-size:0.78rem; color:var(--ink-faint);
  font-family:'JetBrains Mono',monospace; }
.sec-ring { width:40px; height:40px; }
.constellation { position:absolute; right:18px; bottom:16px; opacity:0.5; }

/* ---- back nav ---- */
.backbar { display:flex; align-items:center; gap:10px; margin:38px 0 4px; }
.back {
  display:inline-flex; align-items:center; gap:7px;
  font-family:'JetBrains Mono',monospace; font-size:11px; letter-spacing:1.5px;
  text-transform:uppercase; color:var(--ink-dim);
  background:none; border:1px solid var(--line); border-radius:9px;
  padding:8px 14px; cursor:pointer; transition:.2s;
}
.back:hover { color:#fff; border-color:var(--line-bright); }
.crumb { font-family:'JetBrains Mono',monospace; font-size:11px;
  color:var(--ink-faint); letter-spacing:1px; }

/* ---- lesson list ---- */
.sector-head { margin:14px 0 8px; }
.sector-head h2 {
  font-family:'Chakra Petch',sans-serif; font-weight:700;
  font-size:clamp(1.7rem,4vw,2.5rem); color:#fff; letter-spacing:-0.5px;
}
.sector-head p { color:var(--ink-dim); margin-top:8px; max-width:680px; }
.lessons { display:flex; flex-direction:column; gap:12px; margin-top:24px; }
.lcard {
  display:flex; align-items:center; gap:18px; text-align:left;
  border:1px solid var(--line); border-radius:14px; padding:18px 20px;
  background:linear-gradient(165deg,rgba(19,24,63,0.7),rgba(8,10,27,0.8));
  cursor:pointer; transition:transform .2s, border-color .2s, background .2s;
}
.lcard:hover { transform:translateX(6px); border-color:var(--sc); }
.lnode {
  width:46px; height:46px; flex-shrink:0; border-radius:50%;
  display:flex; align-items:center; justify-content:center;
  font-family:'Chakra Petch',sans-serif; font-weight:700; font-size:1rem;
  border:1px solid var(--sc); color:var(--sc);
  background:radial-gradient(circle at 40% 35%,rgba(255,255,255,0.12),transparent 70%);
  position:relative;
}
.lnode.done { background:var(--sc); color:var(--void); border-color:var(--sc);
  box-shadow:0 0 18px -2px var(--sc); }
.lcard .lt { flex:1; }
.lcard .lt h4 { font-family:'Chakra Petch',sans-serif; font-weight:600;
  font-size:1.05rem; color:#fff; }
.lcard .lt p { font-size:0.85rem; color:var(--ink-dim); margin-top:2px; }
.lcard .chev { color:var(--ink-faint); flex-shrink:0; }
.pill {
  font-family:'JetBrains Mono',monospace; font-size:9px; letter-spacing:1px;
  padding:3px 8px; border-radius:20px; text-transform:uppercase;
}
.pill.ok { background:rgba(70,227,182,0.13); color:var(--teal);
  border:1px solid rgba(70,227,182,0.3); }
.pill.todo { background:rgba(255,255,255,0.04); color:var(--ink-faint);
  border:1px solid var(--line); }

/* ---- lesson body ---- */
.lesson { margin-top:14px; }
.lesson-hero {
  border:1px solid var(--line); border-left:3px solid var(--sc);
  border-radius:14px; padding:26px 26px; margin-bottom:8px;
  background:linear-gradient(110deg,rgba(19,24,63,0.8),rgba(8,10,27,0.5));
}
.lesson-hero .tag { font-family:'JetBrains Mono',monospace; font-size:11px;
  letter-spacing:2px; color:var(--sc); text-transform:uppercase; }
.lesson-hero h2 { font-family:'Chakra Petch',sans-serif; font-weight:700;
  font-size:clamp(1.5rem,3.6vw,2.2rem); color:#fff; margin:8px 0 8px;
  letter-spacing:-0.5px; }
.lesson-hero p { color:var(--ink-dim); }

.block { margin:26px 0; }
.block h3 {
  font-family:'Chakra Petch',sans-serif; font-weight:600; font-size:1.32rem;
  color:#fff; margin-bottom:6px;
}
.block h3::before { content:'◆'; color:var(--sc); font-size:0.7rem;
  margin-right:9px; vertical-align:middle; }
.block p { color:var(--ink-dim); margin:9px 0; }
.block p strong, .block li strong { color:var(--ink); font-weight:600; }
.block .hi { color:var(--cyan); font-weight:500; }
.block ul { margin:10px 0 10px 6px; list-style:none; }
.block ul li { color:var(--ink-dim); margin:7px 0; padding-left:22px;
  position:relative; }
.block ul li::before { content:'▸'; position:absolute; left:0;
  color:var(--sc); }

/* ---- term grid ---- */
.terms { display:grid; grid-template-columns:repeat(auto-fit,minmax(240px,1fr));
  gap:12px; margin:14px 0; }
.term {
  border:1px solid var(--line); border-radius:11px; padding:14px 16px;
  background:rgba(13,16,42,0.6);
}
.term b { font-family:'Chakra Petch',sans-serif; color:var(--sc);
  font-size:0.96rem; }
.term span { display:block; color:var(--ink-dim); font-size:0.86rem;
  margin-top:4px; }

/* ---- callout ---- */
.callout {
  display:flex; gap:14px; border-radius:12px; padding:15px 17px; margin:18px 0;
  border:1px solid var(--line); background:rgba(13,16,42,0.7);
  border-left:3px solid var(--cv);
}
.callout .ci { font-size:1.1rem; flex-shrink:0; }
.callout .ct b { font-family:'Chakra Petch',sans-serif; display:block;
  margin-bottom:3px; color:#fff; font-size:0.95rem; }
.callout .ct p { font-size:0.88rem; color:var(--ink-dim); margin:0; }

/* ---- code ---- */
.code {
  border:1px solid var(--line-bright); border-radius:12px; overflow:hidden;
  margin:18px 0; background:#070912;
}
.code-top {
  display:flex; align-items:center; justify-content:space-between;
  padding:9px 14px; background:rgba(157,131,255,0.07);
  border-bottom:1px solid var(--line);
}
.code-top .ct-l { display:flex; align-items:center; gap:9px; }
.code-top .lights { display:flex; gap:5px; }
.code-top .lights i { width:9px;height:9px;border-radius:50%;display:block; }
.code-top .title { font-family:'JetBrains Mono',monospace; font-size:11px;
  color:var(--ink-dim); letter-spacing:0.5px; }
.copy {
  font-family:'JetBrains Mono',monospace; font-size:10px; letter-spacing:1px;
  color:var(--ink-dim); background:none; border:1px solid var(--line);
  padding:5px 11px; border-radius:7px; cursor:pointer; transition:.2s;
  text-transform:uppercase;
}
.copy:hover { color:var(--cyan); border-color:var(--cyan); }
.copy.copied { color:var(--teal); border-color:var(--teal); }
.code pre {
  margin:0; padding:15px 16px; overflow-x:auto;
  font-family:'JetBrains Mono',monospace; font-size:12.5px; line-height:1.75;
}
.code .cl { white-space:pre; }
.code .cmt { color:#5f6488; font-style:italic; }
.code .prm { color:var(--teal); }
.code .kw  { color:var(--magenta); }
.code .arg { color:var(--gold); }
.code .ip  { color:var(--cyan); }
.code .out { color:var(--ink-faint); }

/* ---- figure ---- */
.figure { margin:22px 0; border:1px solid var(--line); border-radius:14px;
  padding:18px 16px 12px; background:rgba(7,9,18,0.7); }
.figure svg { display:block; width:100%; height:auto; }
.figcap { text-align:center; font-family:'JetBrains Mono',monospace;
  font-size:11px; color:var(--ink-faint); margin-top:10px; letter-spacing:0.5px; }

/* ---- table ---- */
.tbl-wrap { margin:18px 0; overflow-x:auto; border:1px solid var(--line);
  border-radius:12px; }
table.dt { width:100%; border-collapse:collapse; font-size:0.86rem; }
table.dt th {
  font-family:'JetBrains Mono',monospace; font-size:10px; letter-spacing:1px;
  text-transform:uppercase; text-align:left; padding:11px 14px;
  background:rgba(157,131,255,0.09); color:var(--violet);
  border-bottom:1px solid var(--line);
}
table.dt td { padding:10px 14px; color:var(--ink-dim);
  border-bottom:1px solid var(--line); }
table.dt tr:last-child td { border-bottom:none; }
table.dt tr:hover td { background:rgba(157,131,255,0.04); }
table.dt td strong { color:var(--ink); }

/* ---- quiz ---- */
.quiz {
  margin-top:38px; border:1px solid var(--line-bright); border-radius:16px;
  background:linear-gradient(180deg,rgba(19,24,63,0.7),rgba(8,10,27,0.8));
  padding:26px 24px;
}
.quiz-head { display:flex; align-items:center; gap:12px; margin-bottom:6px; }
.quiz-head h3 { font-family:'Chakra Petch',sans-serif; font-weight:700;
  font-size:1.35rem; color:#fff; }
.quiz-head .qscore {
  margin-left:auto; font-family:'JetBrains Mono',monospace; font-size:12px;
  color:var(--ink-dim); border:1px solid var(--line); border-radius:8px;
  padding:5px 11px;
}
.quiz > .qsub { color:var(--ink-dim); font-size:0.9rem; margin-bottom:8px; }
.q { border-top:1px solid var(--line); padding:22px 0 4px; }
.q:first-of-type { border-top:none; }
.q .qn { display:flex; gap:11px; }
.q .qnum { font-family:'Chakra Petch',sans-serif; font-weight:700;
  color:var(--sc); flex-shrink:0; }
.q .qtext { font-weight:500; color:var(--ink); }
.opts { margin:14px 0 0; display:flex; flex-direction:column; gap:9px; }
.opt {
  display:flex; align-items:flex-start; gap:11px; text-align:left;
  border:1px solid var(--line); border-radius:10px; padding:12px 14px;
  background:rgba(7,9,18,0.5); cursor:pointer; transition:.18s;
  color:var(--ink-dim); font-size:0.92rem; font-family:'Exo 2',sans-serif;
  width:100%;
}
.opt:hover:not(:disabled) { border-color:var(--line-bright); color:var(--ink); }
.opt:disabled { cursor:default; }
.opt .ol {
  width:22px;height:22px;border-radius:6px;flex-shrink:0;
  border:1px solid var(--line); display:flex;align-items:center;
  justify-content:center; font-family:'JetBrains Mono',monospace;
  font-size:11px; font-weight:700;
}
.opt.correct { border-color:var(--teal); background:rgba(70,227,182,0.1);
  color:var(--ink); }
.opt.correct .ol { background:var(--teal); color:var(--void);
  border-color:var(--teal); }
.opt.wrong { border-color:var(--coral); background:rgba(255,129,105,0.09);
  color:var(--ink); }
.opt.wrong .ol { background:var(--coral); color:var(--void);
  border-color:var(--coral); }
.explain {
  margin-top:12px; border-radius:10px; padding:13px 15px;
  border:1px solid var(--line); background:rgba(7,9,18,0.65);
  border-left:3px solid var(--cyan);
  animation:fadein .35s ease;
}
@keyframes fadein { from{opacity:0;transform:translateY(-5px);} to{opacity:1;} }
.explain .ev {
  font-family:'JetBrains Mono',monospace; font-size:10px; letter-spacing:1.5px;
  text-transform:uppercase; margin-bottom:5px;
}
.explain.right .ev { color:var(--teal); }
.explain.miss .ev { color:var(--coral); }
.explain p { font-size:0.88rem; color:var(--ink-dim); margin:0; }
.explain p strong { color:var(--ink); }

.lesson-done {
  margin-top:30px; text-align:center; border:1px solid var(--line);
  border-radius:16px; padding:30px 24px;
  background:radial-gradient(circle at 50% 0%,rgba(70,227,182,0.1),transparent 70%);
}
.lesson-done h3 { font-family:'Chakra Petch',sans-serif; font-weight:700;
  font-size:1.3rem; color:#fff; }
.lesson-done p { color:var(--ink-dim); font-size:0.92rem; margin:8px 0 18px; }
.nav-next {
  display:inline-flex; align-items:center; gap:9px;
  font-family:'Chakra Petch',sans-serif; font-weight:600; font-size:0.95rem;
  background:linear-gradient(120deg,var(--cyan),var(--violet));
  color:var(--void); border:none; border-radius:11px; padding:13px 24px;
  cursor:pointer; transition:transform .2s, box-shadow .2s;
}
.nav-next:hover { transform:translateY(-3px);
  box-shadow:0 14px 30px -10px var(--violet); }
.nav-next.ghost { background:none; border:1px solid var(--line-bright);
  color:var(--ink); }
.nav-next.ghost:hover { box-shadow:none; border-color:var(--cyan); }
.nav-row { display:flex; gap:12px; justify-content:center; flex-wrap:wrap;
  margin-top:8px; }

/* ---- footer ---- */
.foot { text-align:center; margin-top:70px; padding-top:26px;
  border-top:1px solid var(--line); }
.foot p { font-family:'JetBrains Mono',monospace; font-size:11px;
  color:var(--ink-faint); letter-spacing:1px; }

::-webkit-scrollbar { height:9px; width:9px; }
::-webkit-scrollbar-thumb { background:rgba(157,131,255,0.3); border-radius:9px; }
::selection { background:rgba(82,217,255,0.3); color:#fff; }

@media (max-width:560px){
  .mast { padding:48px 0 22px; }
  .lcard { gap:13px; padding:15px 15px; }
  .quiz, .lesson-hero { padding:20px 17px; }
}
`;

/* ----------------------------- starfield --------------------------------- */
function starShadows(count, max) {
  let s = [];
  for (let i = 0; i < count; i++) {
    const x = Math.floor(Math.random() * max);
    const y = Math.floor(Math.random() * max);
    s.push(`${x}px ${y}px #fff`);
  }
  return s.join(",");
}
function Sky() {
  const layers = useMemo(
    () => ({
      a: starShadows(700, 2000),
      b: starShadows(220, 2000),
      c: starShadows(90, 2000),
    }),
    []
  );
  return (
    <div className="sky" aria-hidden="true">
      <div className="nebula neb-1" />
      <div className="nebula neb-2" />
      <div className="nebula neb-3" />
      <div
        className="stars"
        style={{ boxShadow: layers.a, width: 1, height: 1, background: "transparent" }}
      />
      <div
        className="stars2"
        style={{ boxShadow: layers.b, width: 2, height: 2, background: "transparent" }}
      />
      <div
        className="stars3"
        style={{ boxShadow: layers.c, width: 2.4, height: 2.4, background: "transparent" }}
      />
    </div>
  );
}

/* ------------------------------- icons ----------------------------------- */
const Ico = {
  arrow: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M13 5l7 7-7 7" />
    </svg>
  ),
  back: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 12H5M11 19l-7-7 7-7" />
    </svg>
  ),
  chev: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18l6-6-6-6" />
    </svg>
  ),
  check: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  ),
};

/* ------------------------------ diagrams --------------------------------- */
/* shared svg helpers */
const SVG_BG = "#070912";
const node = (x, y, r, fill, stroke) => (
  <g>
    <circle cx={x} cy={y} r={r + 6} fill={stroke} opacity="0.18" />
    <circle cx={x} cy={y} r={r} fill={fill} stroke={stroke} strokeWidth="1.5" />
  </g>
);
const tx = (x, y, t, opt = {}) => (
  <text
    x={x}
    y={y}
    fill={opt.fill || "#cfd0ee"}
    fontSize={opt.size || 12}
    fontFamily={opt.mono ? "'JetBrains Mono',monospace" : "'Exo 2',sans-serif"}
    fontWeight={opt.w || 400}
    textAnchor={opt.anchor || "middle"}
    letterSpacing={opt.ls || 0}
  >
    {t}
  </text>
);

const DIAGRAMS = {
  /* ---- OSI / TCP-IP + encapsulation ---- */
  osi: () => {
    const layers = [
      ["7", "Application", "Data", "#52d9ff"],
      ["6", "Presentation", "Data", "#52d9ff"],
      ["5", "Session", "Data", "#52d9ff"],
      ["4", "Transport", "Segment", "#9d83ff"],
      ["3", "Network", "Packet", "#ff6fb8"],
      ["2", "Data Link", "Frame", "#ffce5e"],
      ["1", "Physical", "Bits", "#46e3b6"],
    ];
    return (
      <svg viewBox="0 0 640 360">
        <rect width="640" height="360" fill={SVG_BG} />
        {tx(150, 26, "OSI MODEL", { mono: true, size: 11, ls: 2, fill: "#7174a3" })}
        {tx(490, 26, "PDU + ENCAPSULATION", {
          mono: true, size: 11, ls: 2, fill: "#7174a3",
        })}
        {layers.map(([n, name, pdu, c], i) => {
          const y = 44 + i * 42;
          return (
            <g key={n}>
              <rect x="40" y={y} width="220" height="34" rx="7"
                fill="rgba(255,255,255,0.03)" stroke={c} strokeWidth="1" />
              <circle cx="62" cy={y + 17} r="11" fill={c} opacity="0.22" />
              {tx(62, y + 21, n, { mono: true, w: 700, fill: c })}
              {tx(150, y + 21, name, { w: 500, fill: "#e9e9ff" })}
              <rect x={300 + (pdu === "Bits" ? 0 : 0)} y={y + 3} width="300"
                height="28" rx="6" fill={c} opacity="0.13" />
              {tx(450, y + 21, pdu, { mono: true, fill: c, size: 11 })}
            </g>
          );
        })}
        <path d="M310 60 L310 296" stroke="#9d83ff" strokeWidth="1.4"
          strokeDasharray="3 4" />
        {tx(316, 178, "data wrapped with headers at each layer →", {
          size: 9, fill: "#7174a3", anchor: "start",
        })}
      </svg>
    );
  },

  /* ---- IPv4 subnetting ---- */
  subnet: () => (
    <svg viewBox="0 0 640 250">
      <rect width="640" height="250" fill={SVG_BG} />
      {tx(320, 28, "192.168.10.0 /26  —  borrowing 2 host bits", {
        mono: true, size: 12, fill: "#52d9ff",
      })}
      {[0, 1, 2, 3].map((b) => (
        <g key={b}>
          <rect x={40 + b * 150} y="48" width="140" height="40" rx="6"
            fill="rgba(255,255,255,0.03)" stroke="#2a2f5e" />
          {tx(110 + b * 150, 73, b < 3 ? "11111111" : "11000000", {
            mono: true, size: 12, fill: b < 3 ? "#46e3b6" : "#ffce5e",
          })}
          {tx(110 + b * 150, 104, b < 3 ? "255" : "192", {
            mono: true, size: 11, fill: "#7174a3",
          })}
        </g>
      ))}
      {tx(320, 132, "Network bits (26)  ·  Host bits (6)", {
        size: 11, fill: "#a7a9d4",
      })}
      <g>
        {[
          [".0", ".63"], [".64", ".127"], [".128", ".191"], [".192", ".255"],
        ].map(([s, e], i) => (
          <g key={i}>
            <rect x={40 + i * 150} y="156" width="140" height="56" rx="8"
              fill="rgba(157,131,255,0.08)" stroke="#9d83ff" strokeWidth="1" />
            {tx(110 + i * 150, 178, "Subnet " + (i + 1), {
              size: 10, fill: "#9d83ff", mono: true,
            })}
            {tx(110 + i * 150, 197, s + " – " + e, {
              mono: true, size: 11, fill: "#e9e9ff",
            })}
          </g>
        ))}
      </g>
      {tx(320, 234, "4 subnets  ·  64 addresses each  ·  62 usable hosts", {
        size: 11, fill: "#7174a3", mono: true,
      })}
    </svg>
  ),

  /* ---- switching: MAC learning ---- */
  switching: () => (
    <svg viewBox="0 0 640 300">
      <rect width="640" height="300" fill={SVG_BG} />
      <rect x="210" y="40" width="220" height="62" rx="10"
        fill="rgba(82,217,255,0.07)" stroke="#52d9ff" strokeWidth="1.4" />
      {tx(320, 67, "SWITCH", { mono: true, w: 700, fill: "#52d9ff", ls: 2 })}
      {tx(320, 87, "examines source + dest MAC", { size: 10, fill: "#7174a3" })}
      {[["Fa0/1", 120], ["Fa0/2", 320], ["Fa0/3", 520]].map(([p, x], i) => (
        <g key={p}>
          <line x1={x} y1="200" x2={x < 320 ? 250 : x > 320 ? 390 : 320}
            y2="102" stroke="#2a2f5e" strokeWidth="1.4" />
          {node(x, 220, 22, "#0e1130", "#9d83ff")}
          {tx(x, 225, "PC" + (i + 1), { size: 11, fill: "#e9e9ff" })}
          {tx(x, 256, p, { mono: true, size: 10, fill: "#7174a3" })}
        </g>
      ))}
      <rect x="430" y="118" width="190" height="96" rx="8"
        fill="rgba(7,9,18,0.9)" stroke="#2a2f5e" />
      {tx(525, 138, "MAC ADDRESS TABLE", {
        mono: true, size: 9, ls: 1, fill: "#9d83ff",
      })}
      {[
        ["aaaa.1111", "Fa0/1"],
        ["bbbb.2222", "Fa0/2"],
        ["cccc.3333", "Fa0/3"],
      ].map(([m, p], i) => (
        <g key={m}>
          {tx(445, 162 + i * 18, m, {
            mono: true, size: 9.5, fill: "#cfd0ee", anchor: "start",
          })}
          {tx(600, 162 + i * 18, p, {
            mono: true, size: 9.5, fill: "#52d9ff", anchor: "end",
          })}
        </g>
      ))}
    </svg>
  ),

  /* ---- VLAN + trunk ---- */
  vlan: () => (
    <svg viewBox="0 0 640 300">
      <rect width="640" height="300" fill={SVG_BG} />
      {[["SW1", 150], ["SW2", 490]].map(([s, x]) => (
        <g key={s}>
          <rect x={x - 80} y="118" width="160" height="48" rx="9"
            fill="rgba(82,217,255,0.07)" stroke="#52d9ff" strokeWidth="1.3" />
          {tx(x, 147, s, { mono: true, w: 700, fill: "#52d9ff", ls: 1 })}
        </g>
      ))}
      <line x1="230" y1="142" x2="410" y2="142" stroke="#ffce5e"
        strokeWidth="3" />
      {tx(320, 132, "802.1Q TRUNK", { mono: true, size: 10, fill: "#ffce5e" })}
      {tx(320, 162, "tagged: VLAN 10, 20", {
        size: 9, fill: "#7174a3", mono: true,
      })}
      {[
        ["VLAN 10", "#ff6fb8", 70, "Sales"],
        ["VLAN 20", "#46e3b6", 230, "Eng"],
      ].map(([v, c, x, name], i) => (
        <g key={v}>
          {node(x, 240, 20, "#0e1130", c)}
          {tx(x, 245, "PC", { size: 10, fill: "#e9e9ff" })}
          <line x1={x} y1="220" x2="150" y2="166" stroke={c}
            strokeWidth="1.4" strokeDasharray="2 3" />
          {tx(x, 274, v + " · " + name, { mono: true, size: 9, fill: c })}
          {node(x + 380, 240, 20, "#0e1130", c)}
          {tx(x + 380, 245, "PC", { size: 10, fill: "#e9e9ff" })}
          <line x1={x + 380} y1="220" x2="490" y2="166" stroke={c}
            strokeWidth="1.4" strokeDasharray="2 3" />
          {tx(x + 380, 274, v + " · " + name, { mono: true, size: 9, fill: c })}
        </g>
      ))}
      {tx(320, 232, "same VLAN = same broadcast domain across switches", {
        size: 9.5, fill: "#7174a3",
      })}
    </svg>
  ),

  /* ---- STP ---- */
  stp: () => (
    <svg viewBox="0 0 640 290">
      <rect width="640" height="290" fill={SVG_BG} />
      {node(320, 60, 30, "#13183f", "#ffce5e")}
      {tx(320, 56, "ROOT", { size: 10, w: 700, fill: "#ffce5e" })}
      {tx(320, 70, "SW1", { size: 10, fill: "#e9e9ff" })}
      {tx(320, 26, "lowest bridge ID wins", {
        size: 10, fill: "#7174a3", mono: true,
      })}
      {node(160, 200, 28, "#13183f", "#52d9ff")}
      {tx(160, 204, "SW2", { size: 11, fill: "#e9e9ff" })}
      {node(480, 200, 28, "#13183f", "#52d9ff")}
      {tx(480, 204, "SW3", { size: 11, fill: "#e9e9ff" })}
      <line x1="296" y1="82" x2="184" y2="178" stroke="#46e3b6"
        strokeWidth="2.5" />
      <line x1="344" y1="82" x2="456" y2="178" stroke="#46e3b6"
        strokeWidth="2.5" />
      <line x1="188" y1="200" x2="452" y2="200" stroke="#ff6fb8"
        strokeWidth="2.5" strokeDasharray="6 5" />
      {tx(320, 192, "BLOCKED", { size: 9, mono: true, fill: "#ff6fb8" })}
      {tx(320, 214, "(prevents the loop)", { size: 9, fill: "#7174a3" })}
      {tx(230, 130, "forwarding", { size: 9, mono: true, fill: "#46e3b6" })}
      {tx(410, 130, "forwarding", { size: 9, mono: true, fill: "#46e3b6" })}
    </svg>
  ),

  /* ---- inter-VLAN routing ---- */
  ivr: () => (
    <svg viewBox="0 0 640 280">
      <rect width="640" height="280" fill={SVG_BG} />
      {node(320, 56, 30, "#13183f", "#ff6fb8")}
      {tx(320, 60, "ROUTER", { size: 9, w: 700, fill: "#ff6fb8" })}
      {tx(320, 26, "Router-on-a-Stick", {
        mono: true, size: 11, fill: "#ff6fb8",
      })}
      <rect x="220" y="132" width="200" height="46" rx="9"
        fill="rgba(82,217,255,0.07)" stroke="#52d9ff" strokeWidth="1.3" />
      {tx(320, 160, "SWITCH", { mono: true, w: 700, fill: "#52d9ff", ls: 1 })}
      <line x1="320" y1="86" x2="320" y2="132" stroke="#ffce5e"
        strokeWidth="3" />
      {tx(398, 112, "trunk · subinterfaces", {
        size: 9, fill: "#7174a3", mono: true, anchor: "start",
      })}
      {tx(412, 124, "G0/0.10  G0/0.20", {
        size: 9, fill: "#ffce5e", mono: true, anchor: "start",
      })}
      {[
        ["VLAN 10", "#ff6fb8", 140],
        ["VLAN 20", "#46e3b6", 500],
      ].map(([v, c, x]) => (
        <g key={v}>
          {node(x, 230, 22, "#0e1130", c)}
          {tx(x, 235, "PC", { size: 10, fill: "#e9e9ff" })}
          <line x1={x} y1="208" x2={x < 320 ? 250 : 390} y2="178"
            stroke={c} strokeWidth="1.5" />
          {tx(x, 264, v, { mono: true, size: 10, fill: c })}
        </g>
      ))}
      {tx(320, 250, "router moves traffic between VLAN subnets", {
        size: 9.5, fill: "#7174a3",
      })}
    </svg>
  ),

  /* ---- routing table decision ---- */
  routetable: () => (
    <svg viewBox="0 0 640 250">
      <rect width="640" height="250" fill={SVG_BG} />
      {tx(320, 28, "Packet to 10.1.1.50 — which route wins?", {
        size: 12, fill: "#e9e9ff", w: 500,
      })}
      {[
        ["10.0.0.0/8", "matches", "#7174a3", false],
        ["10.1.0.0/16", "matches", "#7174a3", false],
        ["10.1.1.0/24", "longest prefix — WINS", "#46e3b6", true],
      ].map(([net, note, c, win], i) => (
        <g key={net}>
          <rect x="80" y={56 + i * 50} width="480" height="40" rx="8"
            fill={win ? "rgba(70,227,182,0.1)" : "rgba(255,255,255,0.03)"}
            stroke={win ? "#46e3b6" : "#2a2f5e"} strokeWidth={win ? 1.6 : 1} />
          {tx(110, 80 + i * 50, net, {
            mono: true, size: 13, fill: win ? "#46e3b6" : "#cfd0ee",
            anchor: "start", w: win ? 700 : 400,
          })}
          {tx(530, 80 + i * 50, note, {
            size: 11, fill: c, anchor: "end", mono: true,
          })}
        </g>
      ))}
      {tx(320, 230, "most specific prefix is chosen, then admin distance, then metric", {
        size: 10, fill: "#7174a3", mono: true,
      })}
    </svg>
  ),

  /* ---- OSPF DR/BDR ---- */
  ospf: () => (
    <svg viewBox="0 0 640 280">
      <rect width="640" height="280" fill={SVG_BG} />
      <rect x="120" y="130" width="400" height="14" rx="7"
        fill="rgba(82,217,255,0.1)" stroke="#52d9ff" strokeWidth="1" />
      {tx(320, 124, "multi-access segment (Area 0)", {
        size: 9.5, fill: "#7174a3", mono: true,
      })}
      {[
        ["R1 · DR", "#ffce5e", 160, 60],
        ["R2 · BDR", "#52d9ff", 320, 60],
        ["R3 · DROTHER", "#9d83ff", 480, 60],
        ["R4 · DROTHER", "#9d83ff", 480, 220],
      ].map(([n, c, x, y]) => (
        <g key={n}>
          {node(x, y, 26, "#13183f", c)}
          {tx(x, y + 4, n.split(" · ")[0], { size: 11, w: 700, fill: c })}
          {tx(x, y + (y < 130 ? -34 : 46), n.split(" · ")[1], {
            size: 9, mono: true, fill: c,
          })}
          <line x1={x} y1={y < 130 ? y + 26 : y - 26} x2={x}
            y2="137" stroke={c} strokeWidth="1.5" strokeDasharray="2 3" />
        </g>
      ))}
      {tx(320, 268, "DR/BDR cut down adjacencies — others form full adjacency only with DR & BDR", {
        size: 9.5, fill: "#7174a3",
      })}
    </svg>
  ),

  /* ---- HSRP ---- */
  hsrp: () => (
    <svg viewBox="0 0 640 270">
      <rect width="640" height="270" fill={SVG_BG} />
      {node(180, 70, 30, "#13183f", "#46e3b6")}
      {tx(180, 66, "R1", { size: 12, w: 700, fill: "#46e3b6" })}
      {tx(180, 80, "ACTIVE", { size: 8, mono: true, fill: "#46e3b6" })}
      {node(460, 70, 30, "#13183f", "#7174a3")}
      {tx(460, 66, "R2", { size: 12, w: 700, fill: "#a7a9d4" })}
      {tx(460, 80, "STANDBY", { size: 8, mono: true, fill: "#7174a3" })}
      <rect x="250" y="128" width="140" height="40" rx="9"
        fill="rgba(255,206,94,0.1)" stroke="#ffce5e" strokeWidth="1.3" />
      {tx(320, 146, "Virtual IP", { size: 10, fill: "#ffce5e" })}
      {tx(320, 161, ".1 / vMAC", { size: 9, mono: true, fill: "#ffce5e" })}
      <line x1="180" y1="100" x2="285" y2="138" stroke="#46e3b6"
        strokeWidth="2" />
      <line x1="460" y1="100" x2="355" y2="138" stroke="#7174a3"
        strokeWidth="1.5" strokeDasharray="3 3" />
      {node(320, 230, 24, "#0e1130", "#9d83ff")}
      {tx(320, 235, "PC", { size: 10, fill: "#e9e9ff" })}
      <line x1="320" y1="206" x2="320" y2="168" stroke="#9d83ff"
        strokeWidth="1.5" />
      {tx(320, 200, "default gateway = Virtual IP", {
        size: 9, fill: "#7174a3", mono: true,
      })}
      {tx(320, 254, "if R1 fails, R2 takes over the same IP + MAC", {
        size: 9.5, fill: "#7174a3",
      })}
    </svg>
  ),

  /* ---- DHCP DORA ---- */
  dora: () => (
    <svg viewBox="0 0 640 250">
      <rect width="640" height="250" fill={SVG_BG} />
      {node(90, 120, 30, "#0e1130", "#9d83ff")}
      {tx(90, 124, "Client", { size: 10, fill: "#e9e9ff" })}
      {node(550, 120, 30, "#13183f", "#52d9ff")}
      {tx(550, 124, "DHCP", { size: 10, fill: "#52d9ff" })}
      {[
        ["DISCOVER", 56, "#ff6fb8", 1],
        ["OFFER", 100, "#ffce5e", -1],
        ["REQUEST", 144, "#ff6fb8", 1],
        ["ACK", 188, "#46e3b6", -1],
      ].map(([t, y, c, dir]) => (
        <g key={t}>
          <line x1={dir > 0 ? 124 : 516} y1={y} x2={dir > 0 ? 516 : 124}
            y2={y} stroke={c} strokeWidth="1.8"
            markerEnd="url(#ah)" />
          {tx(320, y - 7, t, { mono: true, size: 11, fill: c })}
          {tx(320, y + 13, dir > 0 ? "broadcast →" : "← offer", {
            size: 8, fill: "#7174a3",
          })}
        </g>
      ))}
      <defs>
        <marker id="ah" markerWidth="9" markerHeight="9" refX="7" refY="3"
          orient="auto">
          <path d="M0,0 L7,3 L0,6 Z" fill="#cfd0ee" />
        </marker>
      </defs>
      {tx(320, 230, "D-O-R-A: the four-step DHCP lease handshake", {
        size: 10, fill: "#7174a3", mono: true,
      })}
    </svg>
  ),

  /* ---- NAT ---- */
  nat: () => (
    <svg viewBox="0 0 640 230">
      <rect width="640" height="230" fill={SVG_BG} />
      <rect x="40" y="40" width="240" height="150" rx="12"
        fill="rgba(70,227,182,0.05)" stroke="#46e3b6" strokeWidth="1"
        strokeDasharray="4 4" />
      {tx(160, 60, "INSIDE — private", { size: 10, mono: true, fill: "#46e3b6" })}
      <rect x="360" y="40" width="240" height="150" rx="12"
        fill="rgba(255,111,184,0.05)" stroke="#ff6fb8" strokeWidth="1"
        strokeDasharray="4 4" />
      {tx(480, 60, "OUTSIDE — internet", { size: 10, mono: true, fill: "#ff6fb8" })}
      {node(110, 120, 24, "#0e1130", "#9d83ff")}
      {tx(110, 124, "PC", { size: 10, fill: "#e9e9ff" })}
      {tx(110, 158, "10.0.0.5", { mono: true, size: 9, fill: "#46e3b6" })}
      <rect x="270" y="96" width="100" height="48" rx="9"
        fill="rgba(255,206,94,0.1)" stroke="#ffce5e" strokeWidth="1.3" />
      {tx(320, 117, "NAT", { mono: true, w: 700, fill: "#ffce5e" })}
      {tx(320, 133, "router", { size: 8, fill: "#7174a3" })}
      {node(520, 120, 24, "#13183f", "#52d9ff")}
      {tx(520, 124, "WWW", { size: 9, fill: "#52d9ff" })}
      <line x1="134" y1="120" x2="270" y2="120" stroke="#46e3b6"
        strokeWidth="1.6" markerEnd="url(#na)" />
      <line x1="370" y1="120" x2="496" y2="120" stroke="#ff6fb8"
        strokeWidth="1.6" markerEnd="url(#na)" />
      <defs>
        <marker id="na" markerWidth="9" markerHeight="9" refX="7" refY="3"
          orient="auto">
          <path d="M0,0 L7,3 L0,6 Z" fill="#cfd0ee" />
        </marker>
      </defs>
      {tx(480, 158, "203.0.113.7", { mono: true, size: 9, fill: "#ff6fb8" })}
      {tx(320, 210, "private source IP is swapped for a public one (PAT adds ports)", {
        size: 9.5, fill: "#7174a3",
      })}
    </svg>
  ),

  /* ---- ACL placement ---- */
  acl: () => (
    <svg viewBox="0 0 640 230">
      <rect width="640" height="230" fill={SVG_BG} />
      {node(110, 110, 26, "#0e1130", "#9d83ff")}
      {tx(110, 114, "Host", { size: 10, fill: "#e9e9ff" })}
      {[["R1", 270], ["R2", 470]].map(([r, x]) => (
        <g key={r}>
          {node(x, 110, 28, "#13183f", "#ff6fb8")}
          {tx(x, 114, r, { size: 12, w: 700, fill: "#ff6fb8" })}
        </g>
      ))}
      <line x1="136" y1="110" x2="242" y2="110" stroke="#2a2f5e"
        strokeWidth="1.6" />
      <line x1="298" y1="110" x2="442" y2="110" stroke="#2a2f5e"
        strokeWidth="1.6" />
      {node(560, 110, 26, "#13183f", "#52d9ff")}
      {tx(560, 114, "Srv", { size: 10, fill: "#52d9ff" })}
      <line x1="498" y1="110" x2="534" y2="110" stroke="#2a2f5e"
        strokeWidth="1.6" />
      <rect x="218" y="58" width="120" height="30" rx="7"
        fill="rgba(255,206,94,0.12)" stroke="#ffce5e" />
      {tx(278, 77, "EXTENDED ACL", { size: 9, mono: true, fill: "#ffce5e" })}
      <line x1="278" y1="88" x2="278" y2="100" stroke="#ffce5e"
        strokeWidth="1.4" strokeDasharray="2 2" />
      {tx(278, 110 + 38, "place close to SOURCE", {
        size: 8.5, mono: true, fill: "#ffce5e",
      })}
      <rect x="500" y="58" width="120" height="30" rx="7"
        fill="rgba(82,217,255,0.12)" stroke="#52d9ff" />
      {tx(560, 77, "STANDARD ACL", { size: 9, mono: true, fill: "#52d9ff" })}
      <line x1="560" y1="88" x2="560" y2="100" stroke="#52d9ff"
        strokeWidth="1.4" strokeDasharray="2 2" />
      {tx(560, 148, "place close to DEST", {
        size: 8.5, mono: true, fill: "#52d9ff",
      })}
      {tx(320, 200, "extended filters precisely — put it near the source to drop traffic early", {
        size: 9.5, fill: "#7174a3",
      })}
    </svg>
  ),

  /* ---- SDN planes ---- */
  sdn: () => (
    <svg viewBox="0 0 640 280">
      <rect width="640" height="280" fill={SVG_BG} />
      <rect x="120" y="30" width="400" height="48" rx="10"
        fill="rgba(82,217,255,0.08)" stroke="#52d9ff" strokeWidth="1.3" />
      {tx(320, 50, "APPLICATIONS / ORCHESTRATION", {
        mono: true, size: 11, fill: "#52d9ff", ls: 1,
      })}
      {tx(320, 67, "business intent", { size: 9, fill: "#7174a3" })}
      <rect x="120" y="120" width="400" height="48" rx="10"
        fill="rgba(157,131,255,0.1)" stroke="#9d83ff" strokeWidth="1.3" />
      {tx(320, 140, "SDN CONTROLLER — Control Plane", {
        mono: true, size: 11, fill: "#9d83ff", ls: 1,
      })}
      {tx(320, 157, "central brain / decisions", { size: 9, fill: "#7174a3" })}
      {[150, 320, 490].map((x, i) => (
        <g key={i}>
          <rect x={x - 70} y="210" width="140" height="44" rx="9"
            fill="rgba(255,111,184,0.08)" stroke="#ff6fb8" strokeWidth="1.1" />
          {tx(x, 230, "Switch " + (i + 1), { size: 10, fill: "#ff6fb8" })}
          {tx(x, 245, "data plane", { size: 8, mono: true, fill: "#7174a3" })}
          <line x1={x} y1="210" x2="320" y2="168" stroke="#ff6fb8"
            strokeWidth="1.3" strokeDasharray="3 3" />
        </g>
      ))}
      <line x1="320" y1="78" x2="320" y2="120" stroke="#52d9ff"
        strokeWidth="1.6" />
      {tx(420, 102, "Northbound API (REST)", {
        size: 9, mono: true, fill: "#52d9ff", anchor: "start",
      })}
      {tx(420, 192, "Southbound API", {
        size: 9, mono: true, fill: "#ff6fb8", anchor: "start",
      })}
    </svg>
  ),

  /* ---- CAPWAP / WLC ---- */
  capwap: () => (
    <svg viewBox="0 0 640 270">
      <rect width="640" height="270" fill={SVG_BG} />
      {node(320, 56, 32, "#13183f", "#52d9ff")}
      {tx(320, 53, "WLC", { size: 12, w: 700, fill: "#52d9ff" })}
      {tx(320, 67, "controller", { size: 8, fill: "#7174a3" })}
      {tx(320, 26, "Wireless LAN Controller", {
        mono: true, size: 11, fill: "#52d9ff",
      })}
      {[140, 320, 500].map((x, i) => (
        <g key={i}>
          {node(x, 180, 24, "#0e1130", "#9d83ff")}
          {tx(x, 184, "LAP", { size: 10, fill: "#e9e9ff" })}
          {tx(x, 214, "lightweight AP", { size: 8, mono: true, fill: "#7174a3" })}
          <line x1={x} y1="156" x2="320" y2="86" stroke="#9d83ff"
            strokeWidth="1.5" />
          <circle cx={(x + 320) / 2} cy={(156 + 86) / 2} r="3" fill="#ffce5e" />
        </g>
      ))}
      {tx(250, 120, "CAPWAP tunnels", {
        size: 9, mono: true, fill: "#ffce5e", anchor: "end",
      })}
      {tx(320, 250, "split-MAC: APs handle radio, WLC handles management & policy", {
        size: 9.5, fill: "#7174a3",
      })}
    </svg>
  ),
};

/* ============================ CURRICULUM ================================= */
const CURRICULUM = [
{
  id: "s1", idx: "01", name: "Network Fundamentals", color: "#52d9ff",
  tagline: "The Physics of the Cosmos",
  blurb: "Models, addressing, hardware and the rules that govern how data moves through space.",
  lessons: [
  {
    id: "s1l1",
    title: "Network Components & Architectures",
    subtitle: "The hardware that builds every network",
    blocks: [
      { t:"p", text:`A network is simply two or more devices that share data. The CCNA expects you to recognize each major **device class**, what layer it operates at, and where it belongs in a design. Think of these as the building blocks of every topology you will ever configure.` },
      { t:"terms", items:[
        { term:"Router", def:"Operates at Layer 3. Connects different networks/subnets and chooses the best path between them using IP addresses." },
        { term:"Switch", def:"Operates at Layer 2. Connects devices within the same network and forwards frames using MAC addresses." },
        { term:"Firewall", def:"Enforces a security policy between trusted and untrusted zones, inspecting and filtering traffic." },
        { term:"Access Point (AP)", def:"Bridges wireless clients onto the wired LAN; extends the network over radio frequencies." },
        { term:"Endpoint", def:"Any user or host device — PC, phone, server, IoT sensor — that produces or consumes data." },
        { term:"WLC", def:"Wireless LAN Controller — centrally manages many lightweight access points." },
      ]},
      { t:"h", text:"Network architectures by scale" },
      { t:"p", text:`Networks are designed differently depending on size. A **two-tier (collapsed core)** design merges the core and distribution layers and suits smaller campuses. A **three-tier** design separates **access**, **distribution**, and **core** layers for large enterprises that need scale and redundancy. A **spine-leaf** fabric is common in modern data centers: every leaf connects to every spine, giving predictable, low-latency paths.` },
      { t:"list", items:[
        `**SOHO** — Small Office / Home Office: often a single all-in-one device combining router, switch, AP, and firewall.`,
        `**LAN** — a network in one location; **WAN** — connects LANs across geographic distance, usually via a service provider.`,
        `**On-premises vs cloud** — resources you own and run locally versus services delivered over the internet from a provider.`,
      ]},
      { t:"callout", cv:"#52d9ff", icon:"✦", title:"Exam anchor", text:`Know the layer of each device cold. \"Layer 2 = switch = MAC\" and \"Layer 3 = router = IP\" is the single most reused fact on the exam.` },
    ],
    quiz: [
      { q:`At which OSI layer does a traditional switch make forwarding decisions?`,
        opts:[`Layer 1 — Physical`,`Layer 2 — Data Link`,`Layer 3 — Network`,`Layer 4 — Transport`],
        answer:1,
        explain:`Switches forward frames using **MAC addresses**, which live at Layer 2 (Data Link). Routers work at Layer 3 with IP addresses.` },
      { q:`Which design separates access, distribution, and core into distinct layers?`,
        opts:[`Two-tier collapsed core`,`Spine-leaf`,`Three-tier hierarchical`,`SOHO`],
        answer:2,
        explain:`The **three-tier** model uses separate access, distribution, and core layers and is built for large enterprise scale and redundancy. Two-tier merges core and distribution.` },
      { q:`What is the primary role of a Wireless LAN Controller (WLC)?`,
        opts:[`Route between VLANs`,`Centrally manage lightweight access points`,`Assign IP addresses to clients`,`Filter traffic between security zones`],
        answer:1,
        explain:`A **WLC** centrally manages many lightweight APs — pushing configuration, RF settings, and security policy from one place via CAPWAP.` },
    ],
  },
  {
    id: "s1l2",
    title: "The OSI & TCP/IP Models",
    subtitle: "Seven layers, encapsulation, and how data is wrapped",
    blocks: [
      { t:"p", text:`Networking models break communication into **layers** so each layer can be designed, taught, and troubleshot independently. The **OSI model** has 7 layers; the **TCP/IP model** collapses them into 4. CCNA uses OSI as the common reference language.` },
      { t:"diagram", key:"osi", cap:"OSI layers and the Protocol Data Unit (PDU) at each level" },
      { t:"h", text:"Encapsulation & de-encapsulation" },
      { t:"p", text:`As data moves **down** the stack on the sender, each layer adds its own header (and the Data Link layer adds a trailer). This wrapping is **encapsulation**. The receiver does the reverse — **de-encapsulation** — stripping headers as data moves up. The unit of data at each layer is its **PDU**: data → segment → packet → frame → bits.` },
      { t:"terms", items:[
        { term:"Layer 4 — Transport", def:"TCP (reliable, connection-oriented, uses sequencing/ACKs) and UDP (fast, connectionless). Adds port numbers." },
        { term:"Layer 3 — Network", def:"IP addressing and routing. Adds source/destination IP. PDU = packet." },
        { term:"Layer 2 — Data Link", def:"MAC addressing, framing, error detection (FCS). PDU = frame." },
        { term:"Layer 1 — Physical", def:"Bits on the wire — voltages, light, radio. Cables, connectors, signaling." },
      ]},
      { t:"callout", cv:"#52d9ff", icon:"✦", title:"TCP vs UDP", text:`TCP guarantees delivery with a three-way handshake (SYN, SYN-ACK, ACK) and retransmissions. UDP just sends — preferred for voice, video, and DNS where speed beats reliability.` },
      { t:"h", text:"A memory hook" },
      { t:"p", text:`A classic mnemonic for layers 7→1 is "**A**ll **P**eople **S**eem **T**o **N**eed **D**ata **P**rocessing" — Application, Presentation, Session, Transport, Network, Data Link, Physical.` },
    ],
    quiz: [
      { q:`What is the PDU at the Network layer?`,
        opts:[`Frame`,`Segment`,`Packet`,`Bit`],
        answer:2,
        explain:`Layer 3 (Network) works with **packets**. Layer 4 = segment, Layer 2 = frame, Layer 1 = bits.` },
      { q:`Which protocol provides reliable, connection-oriented delivery?`,
        opts:[`UDP`,`TCP`,`ICMP`,`ARP`],
        answer:1,
        explain:`**TCP** is connection-oriented and reliable — it uses a three-way handshake, sequencing, and acknowledgements. UDP is connectionless and best-effort.` },
      { q:`Adding a Layer 2 header and trailer as data moves down the stack is called:`,
        opts:[`De-encapsulation`,`Fragmentation`,`Encapsulation`,`Segmentation`],
        answer:2,
        explain:`**Encapsulation** is the process of wrapping data with each layer's header (and the Data Link trailer) as it travels down the sending stack.` },
      { q:`A network engineer needs the fastest possible transport for a VoIP call. Which is the better fit?`,
        opts:[`TCP — its retransmissions ensure clear audio`,`UDP — low overhead and no waiting for ACKs`,`ICMP — designed for media streams`,`ARP — resolves audio endpoints`],
        answer:1,
        explain:`**UDP** suits real-time voice/video: it skips handshakes and retransmissions, so there is no delay. A late retransmitted voice packet is useless anyway.` },
    ],
  },
  {
    id: "s1l3",
    title: "Physical Layer — Cables & Interfaces",
    subtitle: "Copper, fiber, and choosing the right medium",
    blocks: [
      { t:"p", text:`Layer 1 is where bits become physical signals. CCNA expects you to pick the correct **cable type** for a scenario and understand interface settings like **speed** and **duplex**.` },
      { t:"h", text:"Copper (twisted pair)" },
      { t:"p", text:`Ethernet over copper uses **UTP** (unshielded twisted pair) — Cat5e, Cat6, Cat6a. It is cheap and easy but limited to about **100 meters** and vulnerable to electromagnetic interference. Two wiring patterns exist:` },
      { t:"list", items:[
        `**Straight-through** — connects *unlike* devices (PC↔switch, switch↔router).`,
        `**Crossover** — connects *like* devices (switch↔switch, PC↔PC). Modern ports with **Auto-MDIX** detect and fix this automatically.`,
      ]},
      { t:"h", text:"Fiber optic" },
      { t:"p", text:`Fiber carries light instead of electricity — immune to EMI, far greater distance and bandwidth. **Single-mode fiber (SMF)** uses a tiny core and a laser for very long runs (campus/WAN). **Multimode fiber (MMF)** uses a wider core and an LED/VCSEL for shorter runs inside a building.` },
      { t:"terms", items:[
        { term:"Speed", def:"Negotiated link rate — 10/100/1000 Mbps or higher. Mismatched fixed speeds = link down." },
        { term:"Duplex", def:"Half = one direction at a time; Full = both directions simultaneously. A duplex mismatch causes late collisions and slow throughput." },
        { term:"Auto-negotiation", def:"Ports agree on speed and duplex automatically. Best practice: auto on both ends, or hard-code both ends identically." },
      ]},
      { t:"callout", cv:"#ffce5e", icon:"⚠", title:"Classic troubleshooting trap", text:`A **duplex mismatch** (one side full, one side half) is a famous cause of slow links and CRC errors. The link still comes up — which makes it sneaky. Always match both ends.` },
    ],
    quiz: [
      { q:`Which cable connects two switches together (without Auto-MDIX)?`,
        opts:[`Straight-through`,`Crossover`,`Rollover/console`,`Coaxial`],
        answer:1,
        explain:`Switch-to-switch is a "like device" connection, requiring a **crossover** cable. Auto-MDIX, when present, removes the need to choose.` },
      { q:`Which fiber type is best for the longest distances?`,
        opts:[`Multimode fiber`,`Single-mode fiber`,`Cat6a UTP`,`Coaxial`],
        answer:1,
        explain:`**Single-mode fiber** has a narrow core and uses a laser, supporting the longest runs. Multimode is for shorter, in-building distances.` },
      { q:`A 1 Gbps link is performing poorly with CRC errors, yet the interface shows "up/up". The most likely cause is:`,
        opts:[`A crossover cable was used`,`A duplex mismatch`,`The cable exceeds 1000 meters`,`Auto-MDIX is enabled`],
        answer:1,
        explain:`A **duplex mismatch** still brings the link up but causes collisions, CRC errors, and poor throughput — a classic Layer 1/2 troubleshooting scenario.` },
    ],
  },
  {
    id: "s1l4",
    title: "IPv4 Addressing & Subnetting",
    subtitle: "The math that divides networks",
    blocks: [
      { t:"p", text:`An IPv4 address is **32 bits**, written as four octets (e.g. 192.168.1.10). A **subnet mask** marks which bits are the network portion and which are the host portion. Subnetting is splitting one network into smaller ones — a guaranteed exam topic.` },
      { t:"terms", items:[
        { term:"Private ranges (RFC 1918)", def:"10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16 — not routable on the internet." },
        { term:"Network address", def:"All host bits 0 — identifies the subnet itself. Not assignable to a host." },
        { term:"Broadcast address", def:"All host bits 1 — reaches every host in the subnet. Not assignable." },
        { term:"Usable hosts", def:"2^(host bits) − 2 (subtract network + broadcast)." },
        { term:"CIDR / prefix", def:"/24 means 24 network bits. /26 = 255.255.255.192." },
        { term:"VLSM", def:"Variable Length Subnet Masking — use different mask sizes to match each subnet's host count and avoid waste." },
      ]},
      { t:"diagram", key:"subnet", cap:"Borrowing host bits splits one /24 into four /26 subnets" },
      { t:"h", text:"Subnetting in three steps" },
      { t:"p", text:`To carve up a network: (1) decide how many **subnets** or **hosts** you need; (2) **borrow** host bits accordingly — each borrowed bit doubles the subnet count and halves the hosts; (3) find the **block size** (256 − the interesting octet of the mask) and count off subnets. For a /26, the mask's last octet is 192, so block size = 64, giving subnets at .0, .64, .128, .192.` },
      { t:"callout", cv:"#52d9ff", icon:"✦", title:"Powers of two", text:`Memorize: 2,4,8,16,32,64,128,256. Hosts in a subnet = 2^h − 2. A /30 (2 host bits) yields exactly 2 usable hosts — perfect for router-to-router links.` },
    ],
    quiz: [
      { q:`How many usable host addresses are in a /27 subnet?`,
        opts:[`32`,`30`,`14`,`62`],
        answer:1,
        explain:`A /27 leaves 5 host bits → 2^5 = 32 total, minus 2 (network + broadcast) = **30 usable hosts**.` },
      { q:`Which subnet mask corresponds to a /26 prefix?`,
        opts:[`255.255.255.192`,`255.255.255.224`,`255.255.255.128`,`255.255.255.240`],
        answer:0,
        explain:`A /26 has 26 network bits → last octet is 11000000 = **192**, so the mask is 255.255.255.192.` },
      { q:`Which address range is private (RFC 1918)?`,
        opts:[`11.0.0.0/8`,`172.32.0.0/12`,`192.168.0.0/16`,`169.254.0.0/16`],
        answer:2,
        explain:`**192.168.0.0/16** is private. The 172 private block is 172.16.0.0/12 (172.16–172.31), and 169.254.0.0/16 is APIPA link-local — not RFC 1918.` },
      { q:`For point-to-point router links, which prefix is most efficient?`,
        opts:[`/24`,`/28`,`/30`,`/32`],
        answer:2,
        explain:`A **/30** provides exactly 2 usable hosts — ideal for a link with one router on each end and minimal address waste.` },
    ],
  },
  {
    id: "s1l5",
    title: "IPv6 Addressing",
    subtitle: "128 bits and the address types you must know",
    blocks: [
      { t:"p", text:`IPv4's ~4.3 billion addresses ran out. **IPv6** uses **128-bit** addresses written as eight groups of four hex digits, e.g. 2001:0db8:0000:0000:0000:ff00:0042:8329.` },
      { t:"h", text:"Shortening rules" },
      { t:"list", items:[
        `Drop **leading zeros** in any group: 0db8 → db8, 0042 → 42.`,
        `Replace **one** run of all-zero groups with **::** — but only once per address.`,
        `Example: 2001:db8:0:0:0:ff00:42:8329 → **2001:db8::ff00:42:8329**.`,
      ]},
      { t:"h", text:"Address types" },
      { t:"terms", items:[
        { term:"Global Unicast (GUA)", def:"Internet-routable, public. Currently assigned from 2000::/3." },
        { term:"Link-Local", def:"Begins FE80::/10. Auto-configured on every interface; valid only on the local link. Used by routing protocols and neighbor discovery." },
        { term:"Unique Local (ULA)", def:"FC00::/7 — the IPv6 equivalent of private addresses." },
        { term:"Multicast", def:"Begins FF00::/8. IPv6 has no broadcast — multicast replaces it." },
        { term:"Anycast", def:"One address shared by multiple devices; traffic goes to the nearest one." },
      ]},
      { t:"callout", cv:"#52d9ff", icon:"✦", title:"SLAAC & EUI-64", text:`With Stateless Address Autoconfiguration, a host learns the /64 prefix from a router advertisement and builds its own address. **EUI-64** generates the interface ID from the MAC: split it, insert FFFE in the middle, and flip the 7th bit.` },
      { t:"p", text:`A host can hold many IPv6 addresses at once — at minimum a link-local plus a global unicast. Routers exchange routing updates over link-local addresses.` },
    ],
    quiz: [
      { q:`Which prefix identifies an IPv6 link-local address?`,
        opts:[`2000::/3`,`FE80::/10`,`FF00::/8`,`FC00::/7`],
        answer:1,
        explain:`**FE80::/10** is link-local — automatically configured on every IPv6 interface and valid only on the local link.` },
      { q:`How is the address 2001:0db8:0000:0000:0000:0000:0000:0001 correctly compressed?`,
        opts:[`2001:db8::1`,`2001:db8:0::0:1`,`2001:0db8::::1`,`21:db8::1`],
        answer:0,
        explain:`Drop leading zeros and collapse the single run of zero groups with **::** → **2001:db8::1**. The :: may appear only once.` },
      { q:`IPv6 has no broadcast address. What replaces broadcast functionality?`,
        opts:[`Anycast`,`Unicast`,`Multicast`,`Loopback`],
        answer:2,
        explain:`IPv6 eliminates broadcast entirely; **multicast** (FF00::/8) delivers traffic to groups of interested hosts instead.` },
    ],
  },
  {
    id: "s1l6",
    title: "Switching Concepts",
    subtitle: "How a switch learns, forwards, and floods",
    blocks: [
      { t:"p", text:`A switch's job is to forward Ethernet frames intelligently within a LAN. It does three things: **learn** source MAC addresses, **forward** frames toward known destinations, and **flood** when it doesn't know where to send.` },
      { t:"diagram", key:"switching", cap:"The switch builds its MAC address table from source addresses" },
      { t:"h", text:"The forwarding logic" },
      { t:"list", items:[
        `**Learning** — when a frame arrives, the switch records the **source MAC** and the port it came in on, into the MAC address (CAM) table.`,
        `**Forwarding** — if the **destination MAC** is in the table, send the frame out only that one port.`,
        `**Flooding** — if the destination is unknown, or is a broadcast/multicast, send the frame out **all ports except** the one it arrived on.`,
        `**Filtering** — if the destination is on the *same* port the frame arrived on, drop it.`,
      ]},
      { t:"h", text:"Collision vs broadcast domains" },
      { t:"terms", items:[
        { term:"Collision domain", def:"Each switch port is its own collision domain. Switches eliminate collisions on full-duplex links." },
        { term:"Broadcast domain", def:"All ports in the same VLAN. A switch forwards broadcasts everywhere within a VLAN; only a router (or separate VLAN) breaks a broadcast domain." },
        { term:"CAM table", def:"Content Addressable Memory — the hardware table holding MAC-to-port mappings. Entries age out after inactivity (default ~300s)." },
      ]},
      { t:"callout", cv:"#52d9ff", icon:"✦", title:"Frame switching methods", text:`Store-and-forward reads the whole frame and checks the FCS before sending (most common, error-checking). Cut-through starts forwarding after reading just the destination MAC — faster, but no error check.` },
    ],
    quiz: [
      { q:`A switch receives a frame for a destination MAC not in its table. What does it do?`,
        opts:[`Drops the frame`,`Floods it out all ports except the incoming port`,`Sends it back out the incoming port`,`Forwards it to the default gateway`],
        answer:1,
        explain:`An unknown unicast is **flooded** out every port except the one it arrived on, so it can reach the destination wherever it is.` },
      { q:`Which device boundary breaks up a broadcast domain?`,
        opts:[`A hub`,`A switch port`,`A router (or a different VLAN)`,`A straight-through cable`],
        answer:2,
        explain:`Broadcasts stay within a VLAN. Only a **router** (Layer 3) — or assigning ports to a separate VLAN — divides broadcast domains.` },
      { q:`How does a switch populate its MAC address table?`,
        opts:[`From the destination MAC of incoming frames`,`From the source MAC of incoming frames`,`From DHCP`,`From the routing table`],
        answer:1,
        explain:`The switch learns by recording the **source MAC** of each arriving frame against the port it entered on.` },
    ],
  },
  {
    id: "s1l7",
    title: "Wireless Principles",
    subtitle: "Radio frequency, channels, and Wi-Fi behavior",
    blocks: [
      { t:"p", text:`Wi-Fi (IEEE 802.11) carries data over **radio frequency** instead of cable. Because RF is a shared medium, wireless uses **CSMA/CA** — devices listen and try to avoid collisions before transmitting (unlike wired Ethernet's CSMA/CD).` },
      { t:"h", text:"Frequency bands & channels" },
      { t:"terms", items:[
        { term:"2.4 GHz", def:"Longer range, better wall penetration, but crowded and slower. Only channels 1, 6, 11 are non-overlapping." },
        { term:"5 GHz", def:"More channels, faster, less interference, but shorter range." },
        { term:"6 GHz", def:"Introduced with Wi-Fi 6E — lots of clean spectrum, newest devices only." },
        { term:"Channel overlap", def:"Overlapping channels cause interference. In 2.4 GHz, design around 1/6/11 only." },
      ]},
      { t:"h", text:"Key wireless terms" },
      { t:"list", items:[
        `**SSID** — the network name clients connect to.`,
        `**BSS / BSSID** — one AP and its clients; BSSID is the AP's radio MAC.`,
        `**ESS** — multiple APs sharing one SSID so clients roam seamlessly.`,
        `**Channel width / RF cell** — the coverage area of an AP; overlapping cells enable roaming.`,
      ]},
      { t:"callout", cv:"#ffce5e", icon:"⚠", title:"Coverage vs capacity", text:`More APs at lower power generally beats fewer APs at high power: it reduces co-channel interference and supports more clients. Cranking transmit power up usually makes things worse.` },
    ],
    quiz: [
      { q:`Which channels are the non-overlapping choices in the 2.4 GHz band?`,
        opts:[`1, 5, 9`,`1, 6, 11`,`2, 7, 12`,`All channels are non-overlapping`],
        answer:1,
        explain:`In 2.4 GHz, only channels **1, 6, and 11** do not overlap, so well-designed deployments use only those three.` },
      { q:`Wireless networks use which access method to reduce collisions?`,
        opts:[`CSMA/CD`,`CSMA/CA`,`Token passing`,`TDMA`],
        answer:1,
        explain:`Wi-Fi uses **CSMA/CA** (Collision Avoidance) — devices can't detect collisions over RF, so they try to avoid them. Wired Ethernet historically used CSMA/CD.` },
      { q:`Multiple APs sharing one SSID so a client can roam between them form a:`,
        opts:[`BSS`,`ESS`,`IBSS`,`VLAN`],
        answer:1,
        explain:`An **ESS** (Extended Service Set) ties multiple APs together under one SSID, enabling seamless roaming. A single AP+clients is a BSS.` },
    ],
  },
  {
    id: "s1l8",
    title: "Virtualization & Cloud",
    subtitle: "Virtual machines, containers, and cloud models",
    blocks: [
      { t:"p", text:`Modern networks run heavily on **virtualization** — abstracting compute, storage, and networking away from physical hardware so one server can host many isolated workloads.` },
      { t:"terms", items:[
        { term:"Virtual Machine (VM)", def:"A full guest OS running on virtualized hardware. Multiple VMs share one physical host." },
        { term:"Hypervisor", def:"Software that creates and runs VMs. Type 1 runs directly on hardware (bare-metal, e.g. ESXi); Type 2 runs on top of a host OS." },
        { term:"Container", def:"Lightweight, OS-level isolation that packages an app and its dependencies. Faster and smaller than VMs — they share the host kernel." },
        { term:"Virtual switch (vSwitch)", def:"A software switch inside the hypervisor that connects VMs to each other and the physical network." },
      ]},
      { t:"h", text:"Cloud service models" },
      { t:"list", items:[
        `**IaaS** — Infrastructure as a Service: you get virtual servers, storage, and networking; you manage the OS and apps.`,
        `**PaaS** — Platform as a Service: a ready-made environment to deploy code; the provider manages the OS and runtime.`,
        `**SaaS** — Software as a Service: a finished application delivered over the web (email, CRM).`,
      ]},
      { t:"h", text:"Deployment models" },
      { t:"p", text:`A **public cloud** is shared infrastructure from a provider; a **private cloud** is dedicated to one organization; a **hybrid cloud** connects both, letting workloads move between on-prem and public cloud.` },
      { t:"callout", cv:"#52d9ff", icon:"✦", title:"VM vs container", text:`A VM virtualizes hardware and includes a full OS. A container virtualizes the OS and shares the host kernel — so it boots in seconds and uses far fewer resources.` },
    ],
    quiz: [
      { q:`A Type 1 hypervisor runs:`,
        opts:[`As an app on top of Windows or macOS`,`Directly on the physical hardware (bare-metal)`,`Inside a container`,`Only in the public cloud`],
        answer:1,
        explain:`A **Type 1 (bare-metal)** hypervisor runs directly on the hardware. Type 2 runs as an application on top of a host operating system.` },
      { q:`Which cloud model delivers a finished application to end users over the web?`,
        opts:[`IaaS`,`PaaS`,`SaaS`,`On-premises`],
        answer:2,
        explain:`**SaaS** delivers complete software (e.g. webmail) — the provider manages everything beneath it. IaaS gives infrastructure; PaaS gives a development platform.` },
      { q:`Compared with a VM, a container is generally:`,
        opts:[`Larger because it includes a full OS`,`Slower to start`,`Lighter and faster because it shares the host kernel`,`Unable to be isolated from other workloads`],
        answer:2,
        explain:`**Containers** share the host kernel and package only the app and its dependencies, so they are lighter and start far faster than full VMs.` },
    ],
  },
  ],
},
{
  id: "s2", idx: "02", name: "Network Access", color: "#9d83ff",
  tagline: "Constellations of the Switched Frontier",
  blurb: "VLANs, trunking, loop prevention, link bundling and wireless — the Layer 2 universe.",
  lessons: [
  {
    id: "s2l1",
    title: "VLANs & Access Ports",
    subtitle: "Segmenting one switch into many logical networks",
    blocks: [
      { t:"p", text:`A **VLAN** (Virtual LAN) logically splits one physical switch into multiple separate broadcast domains. Devices in different VLANs cannot talk without a router, even on the same switch. VLANs improve **security**, **performance**, and **organization**.` },
      { t:"terms", items:[
        { term:"Access port", def:"Carries traffic for exactly one VLAN. Connects to end devices (PCs, printers)." },
        { term:"Default VLAN", def:"VLAN 1 — all ports start here. Best practice: don't use VLAN 1 for user data." },
        { term:"Voice VLAN", def:"A separate VLAN on an access port for IP phones, keeping voice traffic isolated from data." },
        { term:"VLAN database", def:"VLANs 1–1005 are stored in vlan.dat in flash; extended VLANs 1006–4094 require the running-config." },
      ]},
      { t:"code", title:"Create a VLAN and assign an access port", lights:["#ff6f6f","#ffce5e","#46e3b6"], lines:[
        `! Define VLAN 10 and name it`,
        `Switch(config)# vlan 10`,
        `Switch(config-vlan)# name SALES`,
        `Switch(config-vlan)# exit`,
        `! Put an interface into VLAN 10 as an access port`,
        `Switch(config)# interface fastEthernet 0/1`,
        `Switch(config-if)# switchport mode access`,
        `Switch(config-if)# switchport access vlan 10`,
        `! Verify`,
        `Switch# show vlan brief`,
      ]},
      { t:"callout", cv:"#9d83ff", icon:"✦", title:"Why VLANs matter", text:`Each VLAN is its own broadcast domain and usually its own IP subnet. Moving a user to a new VLAN is a config change — no recabling required.` },
    ],
    quiz: [
      { q:`Two PCs are on the same switch but in different VLANs. How do they communicate?`,
        opts:[`Directly — same switch means same network`,`Through a Layer 3 device (router or L3 switch)`,`They cannot communicate at all, ever`,`Through a crossover cable`],
        answer:1,
        explain:`Different VLANs are different broadcast domains/subnets. They need a **Layer 3 device** — a router or Layer 3 switch — to route between them.` },
      { q:`Which command places interface Fa0/5 into VLAN 20 as an access port?`,
        opts:[`switchport trunk vlan 20`,`switchport access vlan 20`,`vlan 20 access`,`switchport mode vlan 20`],
        answer:1,
        explain:`After setting the port to access mode, **switchport access vlan 20** assigns it to VLAN 20.` },
      { q:`Which VLAN is the default VLAN on a Cisco switch?`,
        opts:[`VLAN 0`,`VLAN 1`,`VLAN 99`,`VLAN 1005`],
        answer:1,
        explain:`**VLAN 1** is the default — every port belongs to it out of the box. Best practice is to avoid using VLAN 1 for production user traffic.` },
    ],
  },
  {
    id: "s2l2",
    title: "Trunking with 802.1Q",
    subtitle: "Carrying many VLANs over one link",
    blocks: [
      { t:"p", text:`An **access port** carries one VLAN. To carry **multiple VLANs** between switches over a single link, you need a **trunk port**. The IEEE **802.1Q** standard adds a 4-byte **VLAN tag** to each frame so the receiving switch knows which VLAN it belongs to.` },
      { t:"diagram", key:"vlan", cap:"An 802.1Q trunk carries tagged frames for multiple VLANs between switches" },
      { t:"h", text:"The native VLAN" },
      { t:"p", text:`On an 802.1Q trunk, one VLAN is **untagged** — the **native VLAN** (VLAN 1 by default). Frames in the native VLAN cross the trunk with no tag. The native VLAN **must match on both ends** or you get a mismatch and possible VLAN leaking. Best practice: set the native VLAN to an unused VLAN.` },
      { t:"code", title:"Configure a trunk port", lights:["#ff6f6f","#ffce5e","#46e3b6"], lines:[
        `Switch(config)# interface gigabitEthernet 0/1`,
        `Switch(config-if)# switchport mode trunk`,
        `! Restrict which VLANs cross the trunk`,
        `Switch(config-if)# switchport trunk allowed vlan 10,20,30`,
        `! Move the native VLAN off VLAN 1`,
        `Switch(config-if)# switchport trunk native vlan 99`,
        `Switch# show interfaces trunk`,
      ]},
      { t:"callout", cv:"#ffce5e", icon:"⚠", title:"DTP caution", text:`Dynamic Trunking Protocol can auto-negotiate trunks — and an attacker can abuse it. Hard-code ports with switchport mode trunk or access, and disable negotiation with switchport nonegotiate.` },
    ],
    quiz: [
      { q:`What does the 802.1Q standard add to an Ethernet frame on a trunk?`,
        opts:[`A new source MAC`,`A 4-byte VLAN tag`,`An IP header`,`A second FCS`],
        answer:1,
        explain:`**802.1Q** inserts a 4-byte tag containing the VLAN ID so the receiving switch can identify the frame's VLAN.` },
      { q:`On an 802.1Q trunk, the native VLAN is special because:`,
        opts:[`Its frames are sent untagged`,`It carries voice traffic only`,`It is always VLAN 99`,`It cannot carry user data`],
        answer:0,
        explain:`Frames in the **native VLAN** traverse the trunk **untagged**. The native VLAN must match on both ends of the link.` },
      { q:`Which command limits a trunk to only VLANs 10 and 20?`,
        opts:[`switchport access vlan 10,20`,`switchport trunk allowed vlan 10,20`,`switchport native vlan 10,20`,`vlan trunk 10,20`],
        answer:1,
        explain:`**switchport trunk allowed vlan 10,20** restricts which VLANs are permitted to cross the trunk — good for security and efficiency.` },
    ],
  },
  {
    id: "s2l3",
    title: "Inter-VLAN Routing",
    subtitle: "Letting VLANs talk to each other",
    blocks: [
      { t:"p", text:`VLANs isolate traffic — but users still need to reach other VLANs (and the internet). **Inter-VLAN routing** is how a Layer 3 device moves traffic between VLAN subnets. There are three approaches.` },
      { t:"diagram", key:"ivr", cap:"Router-on-a-stick: one trunked link with a subinterface per VLAN" },
      { t:"terms", items:[
        { term:"Legacy (one link per VLAN)", def:"A separate physical router interface for each VLAN. Simple but does not scale." },
        { term:"Router-on-a-Stick", def:"One physical link configured as a trunk, with a logical subinterface per VLAN (each with an IP = that VLAN's gateway)." },
        { term:"Layer 3 switch / SVI", def:"A multilayer switch routes between VLANs internally using Switched Virtual Interfaces — fastest and most scalable." },
      ]},
      { t:"code", title:"Router-on-a-Stick subinterfaces", lights:["#ff6f6f","#ffce5e","#46e3b6"], lines:[
        `Router(config)# interface g0/0.10`,
        `Router(config-subif)# encapsulation dot1Q 10`,
        `Router(config-subif)# ip address 192.168.10.1 255.255.255.0`,
        `Router(config-subif)# exit`,
        `Router(config)# interface g0/0.20`,
        `Router(config-subif)# encapsulation dot1Q 20`,
        `Router(config-subif)# ip address 192.168.20.1 255.255.255.0`,
      ]},
      { t:"code", title:"Layer 3 switch with SVIs", lights:["#ff6f6f","#ffce5e","#46e3b6"], lines:[
        `Switch(config)# ip routing`,
        `Switch(config)# interface vlan 10`,
        `Switch(config-if)# ip address 192.168.10.1 255.255.255.0`,
        `Switch(config)# interface vlan 20`,
        `Switch(config-if)# ip address 192.168.20.1 255.255.255.0`,
      ]},
      { t:"callout", cv:"#9d83ff", icon:"✦", title:"Don't forget ip routing", text:`On a multilayer switch, SVIs won't route between each other until you enable ip routing globally. It's a frequent "why isn't this working" moment.` },
    ],
    quiz: [
      { q:`In router-on-a-stick, what is configured for each VLAN?`,
        opts:[`A separate physical interface`,`A subinterface with an 802.1Q encapsulation and IP`,`An access port`,`A loopback interface`],
        answer:1,
        explain:`Router-on-a-stick uses one trunk link with a **subinterface per VLAN**, each tagged with encapsulation dot1Q and given that VLAN's gateway IP.` },
      { q:`What must be enabled on a Layer 3 switch for SVIs to route between VLANs?`,
        opts:[`spanning-tree`,`ip routing`,`switchport trunk`,`no shutdown`],
        answer:1,
        explain:`The global command **ip routing** enables routing functions on a multilayer switch so SVIs can pass traffic between VLANs.` },
      { q:`Which inter-VLAN method scales best for a large campus?`,
        opts:[`Legacy one-link-per-VLAN`,`Router-on-a-stick`,`A Layer 3 (multilayer) switch with SVIs`,`A hub`],
        answer:2,
        explain:`A **Layer 3 switch with SVIs** routes in hardware at high speed and scales well — the preferred design for large networks.` },
    ],
  },
  {
    id: "s2l4",
    title: "Discovery Protocols — CDP & LLDP",
    subtitle: "How devices learn about their neighbors",
    blocks: [
      { t:"p", text:`Discovery protocols let directly connected devices advertise information about themselves — invaluable for mapping a network and troubleshooting.` },
      { t:"terms", items:[
        { term:"CDP", def:"Cisco Discovery Protocol — Cisco-proprietary, Layer 2, enabled by default. Shares device ID, IP, platform, capabilities, and port." },
        { term:"LLDP", def:"Link Layer Discovery Protocol — the open IEEE 802.1AB standard. Works across vendors; disabled by default on Cisco gear." },
      ]},
      { t:"code", title:"CDP and LLDP verification", lights:["#ff6f6f","#ffce5e","#46e3b6"], lines:[
        `! See a summary of neighbors`,
        `Switch# show cdp neighbors`,
        `! Full detail including IP addresses`,
        `Switch# show cdp neighbors detail`,
        `! Enable LLDP globally (off by default)`,
        `Switch(config)# lldp run`,
        `Switch# show lldp neighbors`,
      ]},
      { t:"callout", cv:"#ffce5e", icon:"⚠", title:"Security note", text:`CDP/LLDP reveal device models, IOS versions, and IPs. On untrusted or edge ports, disable them with no cdp enable / no lldp transmit to avoid handing reconnaissance to attackers.` },
      { t:"p", text:`Both protocols operate at **Layer 2**, so neighbors are discovered even if IP addressing is misconfigured — making them perfect first-step troubleshooting tools.` },
    ],
    quiz: [
      { q:`Which discovery protocol is an open, vendor-neutral standard?`,
        opts:[`CDP`,`LLDP`,`STP`,`DTP`],
        answer:1,
        explain:`**LLDP** (IEEE 802.1AB) is the open standard and works across vendors. CDP is Cisco-proprietary.` },
      { q:`CDP is enabled by default and operates at which layer?`,
        opts:[`Layer 1`,`Layer 2`,`Layer 3`,`Layer 4`],
        answer:1,
        explain:`**CDP** runs at **Layer 2**, so it discovers neighbors even when IP addressing is wrong — and it is on by default on Cisco devices.` },
      { q:`Which command shows the IP address of a directly connected Cisco neighbor?`,
        opts:[`show cdp`,`show cdp neighbors detail`,`show ip interface brief`,`show lldp run`],
        answer:1,
        explain:`**show cdp neighbors detail** includes the neighbor's IP address, platform, and IOS version — the summary view does not show the IP.` },
    ],
  },
  {
    id: "s2l5",
    title: "EtherChannel",
    subtitle: "Bundling links for bandwidth and redundancy",
    blocks: [
      { t:"p", text:`**EtherChannel** combines several physical links into one logical link (a **port-channel**). This multiplies bandwidth and provides redundancy — and crucially, **STP treats the bundle as a single link**, so none of the member links get blocked.` },
      { t:"terms", items:[
        { term:"LACP", def:"Link Aggregation Control Protocol — the open IEEE 802.3ad standard. Modes: active / passive." },
        { term:"PAgP", def:"Port Aggregation Protocol — Cisco-proprietary. Modes: desirable / auto." },
        { term:"Static (mode on)", def:"Forces the channel up with no negotiation protocol — both sides must be 'on'." },
        { term:"Load balancing", def:"Distributes frames across members by hashing src/dst MAC or IP — not a perfect even split." },
      ]},
      { t:"h", text:"Negotiation pairings" },
      { t:"p", text:`For a channel to form, the modes must be compatible. With LACP: **active+active** or **active+passive** works (passive+passive does not). With PAgP: **desirable+desirable** or **desirable+auto** works. Static **on** works only with **on** on both ends.` },
      { t:"code", title:"Build an LACP EtherChannel", lights:["#ff6f6f","#ffce5e","#46e3b6"], lines:[
        `Switch(config)# interface range g0/1 - 2`,
        `Switch(config-if-range)# channel-group 1 mode active`,
        `Switch(config-if-range)# exit`,
        `! Configure the logical interface`,
        `Switch(config)# interface port-channel 1`,
        `Switch(config-if)# switchport mode trunk`,
        `Switch# show etherchannel summary`,
      ]},
      { t:"callout", cv:"#ffce5e", icon:"⚠", title:"Consistency is mandatory", text:`All member ports must match in speed, duplex, mode (access/trunk), allowed VLANs, and native VLAN. One mismatch and the port is excluded from the bundle.` },
    ],
    quiz: [
      { q:`Which EtherChannel protocol is the open IEEE standard?`,
        opts:[`PAgP`,`LACP`,`DTP`,`CDP`],
        answer:1,
        explain:`**LACP** (802.3ad) is the open, vendor-neutral standard. PAgP is Cisco-proprietary.` },
      { q:`Which LACP mode combination will successfully form a channel?`,
        opts:[`passive + passive`,`active + passive`,`auto + auto`,`on + active`],
        answer:1,
        explain:`LACP needs at least one **active** side: active+active or **active+passive** works. Passive+passive never initiates, and 'on' is static (no LACP).` },
      { q:`Why doesn't Spanning Tree block the redundant links in an EtherChannel?`,
        opts:[`STP is disabled on the bundle`,`STP sees the bundle as one logical link`,`EtherChannel runs at Layer 3`,`The links use crossover cables`],
        answer:1,
        explain:`STP treats the **port-channel as a single logical link**, so it cannot see a loop and leaves all member links forwarding.` },
    ],
  },
  {
    id: "s2l6",
    title: "Spanning Tree Protocol",
    subtitle: "Preventing Layer 2 loops",
    blocks: [
      { t:"p", text:`Redundant switch links are great for resilience — but at Layer 2 they create **loops**, and a loop causes a **broadcast storm** that melts the network (Ethernet frames have no TTL). **STP** (IEEE 802.1D) prevents this by logically **blocking** redundant paths while keeping one active.` },
      { t:"diagram", key:"stp", cap:"STP elects a root bridge and blocks one port to break the loop" },
      { t:"h", text:"How STP builds a loop-free tree" },
      { t:"list", items:[
        `**Elect a root bridge** — the switch with the lowest **Bridge ID** (priority + MAC). All decisions are relative to it.`,
        `**Choose a root port** on every non-root switch — the one lowest-cost path back to the root.`,
        `**Choose a designated port** on each segment — the port advertising the best path.`,
        `Any remaining port becomes a **non-designated (blocking)** port — it discards data to break the loop.`,
      ]},
      { t:"terms", items:[
        { term:"BPDU", def:"Bridge Protocol Data Unit — the messages switches exchange every 2 seconds to build and maintain the tree." },
        { term:"Port states (802.1D)", def:"Blocking → Listening → Learning → Forwarding. Convergence takes ~30–50 seconds." },
        { term:"RSTP (802.1w)", def:"Rapid STP — converges in seconds. Port roles: root, designated, alternate, backup." },
        { term:"PortFast + BPDU Guard", def:"PortFast skips listening/learning on access ports; BPDU Guard shuts the port if a BPDU appears (rogue switch protection)." },
      ]},
      { t:"callout", cv:"#9d83ff", icon:"✦", title:"Lower is better", text:`Lowest Bridge ID becomes root. To force a specific switch to be root: spanning-tree vlan 1 root primary (or set priority to 0/4096). Default priority is 32768.` },
    ],
    quiz: [
      { q:`What problem does Spanning Tree Protocol solve?`,
        opts:[`IP address exhaustion`,`Layer 2 switching loops and broadcast storms`,`Slow routing convergence`,`VLAN tagging mismatches`],
        answer:1,
        explain:`**STP** prevents **Layer 2 loops**. Without it, redundant links cause broadcast storms because Ethernet frames have no TTL to expire.` },
      { q:`The STP root bridge is the switch with the:`,
        opts:[`Highest IP address`,`Lowest Bridge ID`,`Most ports`,`Fastest CPU`],
        answer:1,
        explain:`The switch with the **lowest Bridge ID** (priority then MAC address) becomes the root bridge.` },
      { q:`Which feature shuts a port down if it unexpectedly receives a BPDU?`,
        opts:[`PortFast`,`BPDU Guard`,`Root Guard only`,`EtherChannel`],
        answer:1,
        explain:`**BPDU Guard**, applied to PortFast access ports, err-disables the port if a BPDU arrives — protecting against a rogue switch being plugged in.` },
      { q:`Compared to 802.1D STP, RSTP (802.1w) primarily improves:`,
        opts:[`VLAN capacity`,`Convergence speed`,`Routing metrics`,`Cable distance`],
        answer:1,
        explain:`**RSTP** converges in seconds rather than the 30–50 seconds of legacy 802.1D, by replacing slow timer-based states with a fast handshake.` },
    ],
  },
  {
    id: "s2l7",
    title: "Wireless LAN Architecture & Config",
    subtitle: "Autonomous vs lightweight APs, WLCs, and CAPWAP",
    blocks: [
      { t:"p", text:`Small deployments may use **autonomous APs** — each one fully self-managed. That doesn't scale. Enterprises use **lightweight APs** centrally controlled by a **WLC** (Wireless LAN Controller).` },
      { t:"diagram", key:"capwap", cap:"Lightweight APs tunnel to a WLC over CAPWAP using the split-MAC model" },
      { t:"h", text:"The split-MAC model & CAPWAP" },
      { t:"p", text:`In the **split-MAC** architecture, real-time radio functions stay on the AP, while management, security policy, and roaming decisions move to the **WLC**. The AP and WLC connect through a **CAPWAP** tunnel (Control And Provisioning of Wireless Access Points) — one tunnel for control traffic, one for data.` },
      { t:"terms", items:[
        { term:"Autonomous AP", def:"Standalone, individually configured. Fine for tiny sites." },
        { term:"Lightweight AP (LAP)", def:"Gets its config from a WLC; nearly useless on its own." },
        { term:"WLC", def:"Central controller — pushes SSIDs, RF tuning, and security policy to all APs." },
        { term:"AP modes", def:"Local (normal client service), FlexConnect (survives WAN loss to controller), Monitor, Sniffer, Sensor, Bridge." },
      ]},
      { t:"h", text:"Configuring a WLAN on a WLC" },
      { t:"p", text:`A WLAN is built in the WLC's GUI/CLI: create the **WLAN**, map it to an **SSID** and an **interface/VLAN**, choose a **security policy** (e.g. WPA2/WPA3), and configure **QoS** and advanced settings. Management access to the WLC itself should use **HTTPS** and **SSH** — never plain HTTP/Telnet.` },
      { t:"callout", cv:"#9d83ff", icon:"✦", title:"FlexConnect", text:`In FlexConnect mode, an AP at a remote branch can keep switching client traffic locally even if the WAN link to the central WLC goes down.` },
    ],
    quiz: [
      { q:`What protocol carries traffic between a lightweight AP and its WLC?`,
        opts:[`CDP`,`CAPWAP`,`STP`,`HSRP`],
        answer:1,
        explain:`**CAPWAP** tunnels both control and data traffic between a lightweight AP and the WLC.` },
      { q:`In the split-MAC model, which functions move to the WLC?`,
        opts:[`Radio transmission and reception`,`Management, security policy, and roaming decisions`,`Frame encryption only`,`Nothing — APs do everything`],
        answer:1,
        explain:`Split-MAC keeps real-time radio on the AP but moves **management, security, and roaming** decisions to the **WLC**.` },
      { q:`Which AP mode lets a branch AP keep serving clients if the WAN link to the WLC fails?`,
        opts:[`Monitor`,`Sniffer`,`FlexConnect`,`Local`],
        answer:2,
        explain:`**FlexConnect** allows a remote AP to switch client traffic locally and continue operating even when it loses its connection to the central WLC.` },
    ],
  },
  ],
},
{
  id: "s3", idx: "03", name: "IP Connectivity", color: "#ff6fb8",
  tagline: "Charting Routes Between Worlds",
  blurb: "How routers find paths, static and dynamic routing, OSPF, and gateway redundancy.",
  lessons: [
  {
    id: "s3l1",
    title: "Routing Fundamentals & the Routing Table",
    subtitle: "How a router decides where to send a packet",
    blocks: [
      { t:"p", text:`A router's purpose is to move packets between networks. To do that it consults its **routing table** — the list of known destination networks and how to reach each one. Understanding the routing table is the heart of Layer 3.` },
      { t:"diagram", key:"routetable", cap:"When several routes match, the longest prefix wins" },
      { t:"h", text:"The route selection logic" },
      { t:"list", items:[
        `**Longest prefix match** — among all matching routes, the most specific (longest mask) is chosen. /24 beats /16 beats /8.`,
        `**Administrative Distance (AD)** — if two sources offer the *same* prefix, the lower AD (more trustworthy source) wins.`,
        `**Metric** — within a single routing protocol, the lowest metric (cost) breaks the tie.`,
      ]},
      { t:"h", text:"Administrative Distance values" },
      { t:"table", headers:["Route source","AD"], rows:[
        ["Connected interface","0"],
        ["Static route","1"],
        ["External BGP","20"],
        ["OSPF","110"],
        ["RIP","120"],
        ["Unknown / unusable","255"],
      ]},
      { t:"terms", items:[
        { term:"Route codes", def:"In 'show ip route': C = connected, L = local /32, S = static, O = OSPF, D = EIGRP, R = RIP." },
        { term:"Default route", def:"0.0.0.0/0 — the 'gateway of last resort' used when nothing more specific matches." },
        { term:"Next hop", def:"The IP address of the neighboring router that packets are forwarded to." },
      ]},
      { t:"callout", cv:"#ff6fb8", icon:"✦", title:"Order of operations", text:`First, longest prefix match selects which routes are eligible. Only among equally specific routes does AD apply, and only within one protocol does metric apply.` },
    ],
    quiz: [
      { q:`A router has routes for 10.1.0.0/16 and 10.1.1.0/24. A packet is destined for 10.1.1.5. Which route is used?`,
        opts:[`10.1.0.0/16 — it appears first`,`10.1.1.0/24 — longest prefix match`,`Neither — the packet is dropped`,`Both, load-balanced`],
        answer:1,
        explain:`The router always picks the **most specific** (longest prefix) matching route. /24 is more specific than /16, so **10.1.1.0/24** is used.` },
      { q:`Two protocols advertise the exact same network. The router prefers the route with the:`,
        opts:[`Highest metric`,`Lowest administrative distance`,`Longest uptime`,`Highest AD`],
        answer:1,
        explain:`When prefixes are equal, **administrative distance** decides — the lower AD (more trusted source) is installed. A static route (AD 1) beats OSPF (AD 110).` },
      { q:`What is the administrative distance of a directly connected route?`,
        opts:[`0`,`1`,`110`,`255`],
        answer:0,
        explain:`A **connected** route has an AD of **0** — the router trusts its own interfaces above all other sources.` },
      { q:`The route 0.0.0.0/0 in a routing table represents the:`,
        opts:[`Loopback network`,`Default route / gateway of last resort`,`Multicast range`,`A blackhole route`],
        answer:1,
        explain:`**0.0.0.0/0** is the **default route** — used for any destination not matched by a more specific entry.` },
    ],
  },
  {
    id: "s3l2",
    title: "Static Routing",
    subtitle: "Manually telling a router where networks live",
    blocks: [
      { t:"p", text:`A **static route** is a route you configure by hand. Static routing is predictable, secure, and uses no CPU or bandwidth for updates — but it does not adapt automatically when topology changes. It is ideal for small networks, stub networks, and default routes.` },
      { t:"code", title:"IPv4 static and default routes", lights:["#ff6f6f","#ffce5e","#46e3b6"], lines:[
        `! Reach 192.168.20.0/24 via next-hop 10.0.0.2`,
        `Router(config)# ip route 192.168.20.0 255.255.255.0 10.0.0.2`,
        `! A default route - everything else goes out to the ISP`,
        `Router(config)# ip route 0.0.0.0 0.0.0.0 203.0.113.1`,
        `! Verify`,
        `Router# show ip route static`,
      ]},
      { t:"terms", items:[
        { term:"Next-hop route", def:"Specifies the neighbor's IP. The router does a recursive lookup to find the exit interface." },
        { term:"Directly attached route", def:"Specifies an exit interface instead of an IP - best on point-to-point links." },
        { term:"Fully specified route", def:"Lists both exit interface and next-hop IP - needed on multi-access links." },
        { term:"Floating static route", def:"A backup static route with a higher AD; it only activates if the primary route disappears." },
      ]},
      { t:"code", title:"A floating static backup route", lights:["#ff6f6f","#ffce5e","#46e3b6"], lines:[
        `! AD of 130 makes this less preferred than OSPF (110)`,
        `Router(config)# ip route 192.168.20.0 255.255.255.0 10.0.0.6 130`,
        `! IPv6 equivalent`,
        `Router(config)# ipv6 route 2001:db8:20::/64 2001:db8:1::2`,
      ]},
      { t:"callout", cv:"#ff6fb8", icon:"✦", title:"Static vs dynamic", text:`Static = no overhead, full control, no auto-recovery. Dynamic (OSPF) = adapts to failures automatically but uses CPU and bandwidth. Real networks combine both.` },
    ],
    quiz: [
      { q:`Which command creates a default route pointing to 198.51.100.1?`,
        opts:[`ip route default 198.51.100.1`,`ip route 0.0.0.0 0.0.0.0 198.51.100.1`,`ip default-network 198.51.100.1`,`ip route 0.0.0.0 255.255.255.255 198.51.100.1`],
        answer:1,
        explain:`A default route uses the all-zeros network and mask: **ip route 0.0.0.0 0.0.0.0 198.51.100.1**.` },
      { q:`A floating static route is characterized by:`,
        opts:[`A lower metric than dynamic routes`,`A higher administrative distance so it acts as a backup`,`Pointing only to a loopback`,`Being injected by OSPF`],
        answer:1,
        explain:`A **floating static route** is configured with a higher AD so it stays out of the routing table until the preferred dynamic route fails.` },
      { q:`Which static route type is recommended on a point-to-point serial link?`,
        opts:[`Next-hop only`,`Directly attached (exit interface)`,`Floating only`,`Default only`],
        answer:1,
        explain:`On a **point-to-point** link, a **directly attached** route specifying the exit interface avoids an extra recursive lookup and is fully deterministic.` },
    ],
  },
  {
    id: "s3l3",
    title: "OSPF Concepts",
    subtitle: "Link-state routing, areas, and adjacencies",
    blocks: [
      { t:"p", text:`**OSPF** (Open Shortest Path First) is an open-standard **link-state** routing protocol. Every router builds a complete map of the topology (the link-state database), then runs the **Dijkstra SPF algorithm** to compute the shortest path to every network.` },
      { t:"diagram", key:"ospf", cap:"On a multi-access segment, OSPF elects a DR and BDR to limit adjacencies" },
      { t:"h", text:"Building neighbor relationships" },
      { t:"p", text:`OSPF routers discover each other with **Hello** packets. For two routers to become neighbors, several values **must match**: area ID, hello/dead timers, subnet/mask, authentication, and stub flags. The **Router ID** - the highest loopback IP, or highest active interface IP, or a manually set value - uniquely identifies each router.` },
      { t:"terms", items:[
        { term:"Areas", def:"OSPF divides large networks into areas to limit database size. Area 0 is the backbone; all other areas connect to it." },
        { term:"DR / BDR", def:"On multi-access (Ethernet) segments, a Designated Router and Backup DR are elected so routers don't all form full adjacencies." },
        { term:"Cost metric", def:"OSPF metric = reference bandwidth / interface bandwidth. Lower cost = preferred path." },
        { term:"Neighbor states", def:"Down, Init, 2-Way, Exstart, Exchange, Loading, Full. 'Full' means the adjacency is complete." },
      ]},
      { t:"h", text:"DR/BDR election" },
      { t:"p", text:`On a segment, the router with the **highest OSPF priority** becomes DR; the next highest becomes BDR. A tie is broken by the **highest Router ID**. Priority 0 means a router will never become DR/BDR. Other routers (DROTHERs) form a **full adjacency only with the DR and BDR**, drastically reducing overhead.` },
      { t:"callout", cv:"#ff6fb8", icon:"✦", title:"Why 2-Way is normal", text:`Two DROTHER routers intentionally stay at the 2-Way state with each other - that is not a problem. They each go Full only with the DR and BDR.` },
    ],
    quiz: [
      { q:`OSPF is best described as which type of routing protocol?`,
        opts:[`Distance vector`,`Link-state`,`Path vector`,`Static`],
        answer:1,
        explain:`**OSPF** is a **link-state** protocol - each router builds a full topology map and runs SPF (Dijkstra) to find shortest paths.` },
      { q:`Which value, by default, becomes the OSPF Router ID first if available?`,
        opts:[`Lowest physical interface IP`,`Highest loopback interface IP`,`The MAC address`,`0.0.0.0`],
        answer:1,
        explain:`OSPF chooses the **highest loopback IP** as Router ID if any loopback exists; otherwise the highest active physical interface IP, unless set manually.` },
      { q:`On a multi-access segment, the router with the highest OSPF priority becomes the:`,
        opts:[`BDR`,`DR`,`DROTHER`,`ABR`],
        answer:1,
        explain:`The **highest priority** wins the DR election; the next highest becomes BDR. Ties are broken by the highest Router ID.` },
      { q:`Two OSPF routers will not form an adjacency. Which mismatch is a likely cause?`,
        opts:[`Different hostnames`,`Different hello/dead timers`,`Different MAC addresses`,`Different interface descriptions`],
        answer:1,
        explain:`OSPF neighbors must agree on **hello/dead timers**, area ID, subnet/mask, and authentication. Mismatched timers prevent the adjacency.` },
    ],
  },
  {
    id: "s3l4",
    title: "OSPF Configuration",
    subtitle: "Bringing single-area OSPFv2 online",
    blocks: [
      { t:"p", text:`Configuring single-area OSPFv2 is a guaranteed CCNA skill. You start an OSPF process, identify which interfaces participate, and verify the result.` },
      { t:"code", title:"Single-area OSPF with network statements", lights:["#ff6f6f","#ffce5e","#46e3b6"], lines:[
        `Router(config)# router ospf 1`,
        `! Set a stable, explicit Router ID`,
        `Router(config-router)# router-id 1.1.1.1`,
        `! Advertise interfaces in 10.0.0.0/30 into area 0`,
        `Router(config-router)# network 10.0.0.0 0.0.0.3 area 0`,
        `Router(config-router)# network 192.168.1.0 0.0.0.255 area 0`,
        `! Do not send hellos toward end users`,
        `Router(config-router)# passive-interface g0/1`,
      ]},
      { t:"h", text:"Wildcard masks" },
      { t:"p", text:`OSPF network statements use a **wildcard mask** - the inverse of a subnet mask. A /30 (255.255.255.252) becomes wildcard **0.0.0.3**; a /24 becomes **0.0.0.255**. The network command matches *interfaces* whose IP falls in that range and activates OSPF on them.` },
      { t:"h", text:"Interface-mode alternative" },
      { t:"code", title:"Enabling OSPF directly on an interface", lights:["#ff6f6f","#ffce5e","#46e3b6"], lines:[
        `Router(config)# interface g0/0`,
        `Router(config-if)# ip ospf 1 area 0`,
      ]},
      { t:"terms", items:[
        { term:"passive-interface", def:"Stops OSPF Hellos on an interface (so no neighbor forms) but still advertises that network. Use it on LAN/user interfaces." },
        { term:"show ip ospf neighbor", def:"Confirms adjacencies and their state - the first verification command." },
        { term:"show ip route ospf", def:"Shows OSPF-learned routes, marked with an 'O'." },
      ]},
      { t:"callout", cv:"#ffce5e", icon:"⚠", title:"Do not forget passive-interface", text:`Advertising a user LAN without making it passive sends OSPF Hellos toward endpoints - wasted traffic and a security risk. Make user-facing interfaces passive.` },
    ],
    quiz: [
      { q:`What is the wildcard mask for the network statement covering a /24?`,
        opts:[`255.255.255.0`,`0.0.0.255`,`0.0.0.0`,`0.0.255.255`],
        answer:1,
        explain:`A wildcard mask is the inverse of the subnet mask. /24 = 255.255.255.0, so the wildcard is **0.0.0.255**.` },
      { q:`What does the passive-interface command do in OSPF?`,
        opts:[`Removes the network from OSPF`,`Stops sending Hellos on that interface but still advertises its network`,`Shuts the interface down`,`Forces the interface to be the DR`],
        answer:1,
        explain:`**passive-interface** suppresses OSPF Hellos on the interface (no neighbor will form) while still advertising that interface's subnet.` },
      { q:`Which command first verifies that OSPF adjacencies have formed?`,
        opts:[`show running-config`,`show ip ospf neighbor`,`show interfaces status`,`show cdp neighbors`],
        answer:1,
        explain:`**show ip ospf neighbor** lists OSPF neighbors and their states - you want to see the 'FULL' state for working adjacencies.` },
    ],
  },
  {
    id: "s3l5",
    title: "First-Hop Redundancy — HSRP",
    subtitle: "Keeping the default gateway always available",
    blocks: [
      { t:"p", text:`Every host has a single **default gateway**. If that router fails, every host loses off-subnet connectivity. A **First-Hop Redundancy Protocol** solves this: two or more routers share a **virtual IP** and **virtual MAC**, so hosts always have a working gateway.` },
      { t:"diagram", key:"hsrp", cap:"HSRP — hosts use a virtual IP; standby takes over if the active router fails" },
      { t:"h", text:"How HSRP works" },
      { t:"p", text:`**HSRP** (Hot Standby Router Protocol, Cisco-proprietary) elects one **Active** router and one **Standby**. Hosts point their default gateway at the **virtual IP**. The Active router answers for the virtual IP and virtual MAC; the Standby monitors it with hellos and takes over instantly if the Active fails.` },
      { t:"terms", items:[
        { term:"Priority", def:"Higher priority becomes Active (default 100). Ties are broken by the highest interface IP." },
        { term:"Preemption", def:"Off by default. With preempt enabled, a higher-priority router that comes back online reclaims the Active role." },
        { term:"Virtual IP / MAC", def:"The shared gateway address. HSRP v1 virtual MAC is 0000.0c07.acXX (XX = group number)." },
        { term:"Object tracking", def:"HSRP can lower its priority if an uplink fails, triggering a failover to a router with a healthy path." },
      ]},
      { t:"code", title:"Configure HSRP on an interface", lights:["#ff6f6f","#ffce5e","#46e3b6"], lines:[
        `Router(config)# interface g0/0`,
        `Router(config-if)# ip address 192.168.1.2 255.255.255.0`,
        `Router(config-if)# standby 1 ip 192.168.1.1`,
        `Router(config-if)# standby 1 priority 110`,
        `Router(config-if)# standby 1 preempt`,
      ]},
      { t:"callout", cv:"#ff6fb8", icon:"✦", title:"Know the alternatives", text:`VRRP is the open-standard equivalent of HSRP. GLBP (Cisco) goes further by load-balancing traffic across multiple active routers at once.` },
    ],
    quiz: [
      { q:`What is the main purpose of HSRP?`,
        opts:[`Routing between VLANs`,`Providing a redundant default gateway via a virtual IP`,`Preventing Layer 2 loops`,`Assigning IP addresses`],
        answer:1,
        explain:`**HSRP** provides **default-gateway redundancy** - multiple routers share a virtual IP/MAC so hosts keep connectivity if the active router fails.` },
      { q:`In an HSRP group, which router becomes Active?`,
        opts:[`The one with the lowest priority`,`The one with the highest priority (tie: highest IP)`,`The one with the most interfaces`,`Always the first one configured`],
        answer:1,
        explain:`The router with the **highest priority** becomes Active; if priorities tie, the **highest interface IP** wins.` },
      { q:`Which HSRP feature lets a recovered higher-priority router reclaim the Active role?`,
        opts:[`Tracking`,`Preemption`,`Load balancing`,`Authentication`],
        answer:1,
        explain:`**Preemption** (off by default) allows a higher-priority router that comes back online to take over the Active role.` },
      { q:`Which protocol is the open-standard alternative to HSRP?`,
        opts:[`GLBP`,`VRRP`,`STP`,`LACP`],
        answer:1,
        explain:`**VRRP** is the IETF open-standard first-hop redundancy protocol. GLBP is a Cisco protocol that adds load balancing.` },
    ],
  },
  ],
},
{
  id: "s4", idx: "04", name: "IP Services", color: "#ffce5e",
  tagline: "The Support Systems of the Fleet",
  blurb: "DHCP, DNS, NAT, time sync, monitoring and traffic prioritization — the services that keep networks usable.",
  lessons: [
  {
    id: "s4l1",
    title: "DHCP",
    subtitle: "Automatic IP address assignment",
    blocks: [
      { t:"p", text:`**DHCP** (Dynamic Host Configuration Protocol) automatically hands out IP addresses and network settings - gateway, subnet mask, DNS servers - so hosts do not need manual configuration.` },
      { t:"diagram", key:"dora", cap:"The DHCP lease process: Discover, Offer, Request, Acknowledge" },
      { t:"h", text:"The DORA process" },
      { t:"list", items:[
        `**Discover** - the client broadcasts looking for any DHCP server.`,
        `**Offer** - a server replies offering an available address.`,
        `**Request** - the client broadcasts acceptance of one offer.`,
        `**Acknowledge** - the server confirms the lease and finalizes the settings.`,
      ]},
      { t:"h", text:"DHCP relay" },
      { t:"p", text:`DHCP relies on broadcasts, which routers do not forward. When the DHCP server is on a different subnet, configure an **ip helper-address** on the client-side interface. The router then relays the request as a unicast to the server.` },
      { t:"code", title:"Cisco router as a DHCP server", lights:["#ff6f6f","#ffce5e","#46e3b6"], lines:[
        `! Exclude addresses the router/servers use`,
        `Router(config)# ip dhcp excluded-address 192.168.1.1 192.168.1.10`,
        `Router(config)# ip dhcp pool LAN_POOL`,
        `Router(dhcp-config)# network 192.168.1.0 255.255.255.0`,
        `Router(dhcp-config)# default-router 192.168.1.1`,
        `Router(dhcp-config)# dns-server 8.8.8.8`,
        `Router(dhcp-config)# lease 7`,
      ]},
      { t:"code", title:"DHCP relay (server on another subnet)", lights:["#ff6f6f","#ffce5e","#46e3b6"], lines:[
        `Router(config)# interface g0/1`,
        `Router(config-if)# ip helper-address 10.0.0.50`,
      ]},
      { t:"callout", cv:"#ffce5e", icon:"⚠", title:"APIPA", text:`If a host cannot reach a DHCP server it self-assigns a 169.254.x.x APIPA address. Seeing 169.254.x.x is a strong clue that DHCP failed.` },
    ],
    quiz: [
      { q:`What is the correct order of the DHCP lease process?`,
        opts:[`Discover, Request, Offer, Acknowledge`,`Discover, Offer, Request, Acknowledge`,`Offer, Discover, Acknowledge, Request`,`Request, Offer, Discover, Acknowledge`],
        answer:1,
        explain:`The DHCP exchange is **DORA**: **Discover, Offer, Request, Acknowledge**.` },
      { q:`A client and DHCP server are on different subnets. What is needed on the router?`,
        opts:[`ip dhcp pool`,`ip helper-address pointing to the server`,`ip routing`,`A static route to the client`],
        answer:1,
        explain:`**ip helper-address** on the client-facing interface relays DHCP broadcasts as unicasts to the server on another subnet.` },
      { q:`A host shows the IP 169.254.10.4. What most likely happened?`,
        opts:[`It received a normal DHCP lease`,`It failed to reach a DHCP server and self-assigned APIPA`,`It has a static address`,`Its gateway is down`],
        answer:1,
        explain:`A **169.254.x.x** address is **APIPA**, assigned by the host itself when no DHCP server could be reached.` },
    ],
  },
  {
    id: "s4l2",
    title: "DNS",
    subtitle: "Turning names into IP addresses",
    blocks: [
      { t:"p", text:`**DNS** (Domain Name System) resolves human-friendly names like www.example.com into the IP addresses computers actually use. Without DNS, users would have to memorize an IP address for every site.` },
      { t:"h", text:"How resolution works" },
      { t:"p", text:`When a host needs an IP, it queries a configured DNS server. If that server does not know the answer, it performs a **recursive lookup** through the DNS hierarchy - root servers, top-level domain servers, then the authoritative server for the domain - and returns the result, caching it for next time.` },
      { t:"h", text:"Common record types" },
      { t:"table", headers:["Record","Purpose"], rows:[
        ["A","Maps a name to an IPv4 address"],
        ["AAAA","Maps a name to an IPv6 address"],
        ["CNAME","An alias pointing one name to another name"],
        ["MX","Identifies the mail server for a domain"],
        ["NS","Identifies the authoritative name server"],
        ["PTR","Reverse lookup - maps an IP back to a name"],
      ]},
      { t:"code", title:"DNS settings on a Cisco device", lights:["#ff6f6f","#ffce5e","#46e3b6"], lines:[
        `! Let the device itself resolve names`,
        `Router(config)# ip name-server 8.8.8.8`,
        `Router(config)# ip domain-lookup`,
        `Router(config)# ip domain-name lab.local`,
      ]},
      { t:"callout", cv:"#ffce5e", icon:"✦", title:"DNS uses UDP 53", text:`DNS queries normally use UDP port 53 for speed. Larger transfers, like zone transfers, fall back to TCP 53.` },
    ],
    quiz: [
      { q:`Which DNS record maps a hostname to an IPv4 address?`,
        opts:[`AAAA`,`A`,`MX`,`CNAME`],
        answer:1,
        explain:`An **A record** maps a name to an **IPv4** address. AAAA is for IPv6; MX is for mail; CNAME is an alias.` },
      { q:`DNS queries primarily use which transport protocol and port?`,
        opts:[`TCP 80`,`UDP 53`,`TCP 443`,`UDP 67`],
        answer:1,
        explain:`DNS uses **UDP port 53** for normal queries (fast, low overhead), falling back to TCP 53 for larger transfers.` },
      { q:`Which record type identifies the mail server for a domain?`,
        opts:[`NS`,`PTR`,`MX`,`A`],
        answer:2,
        explain:`The **MX** (Mail Exchange) record specifies which server handles email for a domain.` },
    ],
  },
  {
    id: "s4l3",
    title: "NAT & PAT",
    subtitle: "Translating private addresses to public",
    blocks: [
      { t:"p", text:`There are not enough public IPv4 addresses for every device. **NAT** (Network Address Translation) lets many devices with **private** addresses share one or a few **public** addresses when reaching the internet.` },
      { t:"diagram", key:"nat", cap:"NAT swaps a private inside address for a public one at the network edge" },
      { t:"h", text:"Three flavors of NAT" },
      { t:"terms", items:[
        { term:"Static NAT", def:"A fixed one-to-one mapping of one private address to one public address - useful for servers that must be reachable from outside." },
        { term:"Dynamic NAT", def:"Private addresses are mapped to a pool of public addresses, first-come first-served." },
        { term:"PAT (NAT Overload)", def:"Many private addresses share ONE public address, distinguished by port numbers. This is what home routers do." },
      ]},
      { t:"h", text:"The four address terms" },
      { t:"table", headers:["Term","Meaning"], rows:[
        ["Inside local","Private address of the inside host (as seen inside)"],
        ["Inside global","Public address the inside host is translated to"],
        ["Outside global","Real public address of the outside host"],
        ["Outside local","How the outside host appears to the inside (often same as outside global)"],
      ]},
      { t:"code", title:"Configure PAT (NAT overload)", lights:["#ff6f6f","#ffce5e","#46e3b6"], lines:[
        `! Mark interfaces as inside and outside`,
        `Router(config)# interface g0/0`,
        `Router(config-if)# ip nat inside`,
        `Router(config)# interface g0/1`,
        `Router(config-if)# ip nat outside`,
        `! Match the inside hosts to translate`,
        `Router(config)# access-list 1 permit 192.168.1.0 0.0.0.255`,
        `! Overload the outside interface address`,
        `Router(config)# ip nat inside source list 1 interface g0/1 overload`,
      ]},
      { t:"callout", cv:"#ffce5e", icon:"✦", title:"Why PAT is everywhere", text:`PAT lets thousands of internal hosts share a single public IP by tracking unique port numbers - it is the reason home and office networks need only one ISP-assigned address.` },
    ],
    quiz: [
      { q:`Which NAT type lets many private hosts share one public IP using port numbers?`,
        opts:[`Static NAT`,`Dynamic NAT`,`PAT (NAT overload)`,`Twice NAT`],
        answer:2,
        explain:`**PAT** (Port Address Translation / NAT overload) maps many inside addresses to one public address by tracking unique source ports.` },
      { q:`A web server must be permanently reachable from the internet on a fixed public IP. Which NAT type fits?`,
        opts:[`Static NAT`,`Dynamic NAT`,`PAT`,`No NAT is possible`],
        answer:0,
        explain:`**Static NAT** creates a fixed one-to-one mapping, so the server is always reachable at the same public address.` },
      { q:`The private address of an inside host, as seen on the inside network, is called the:`,
        opts:[`Inside global`,`Inside local`,`Outside global`,`Outside local`],
        answer:1,
        explain:`The **inside local** address is the private IP of the inside host before translation. After NAT it becomes the inside global address.` },
    ],
  },
  {
    id: "s4l4",
    title: "NTP",
    subtitle: "Synchronizing time across the network",
    blocks: [
      { t:"p", text:`Accurate, consistent time matters more than it sounds. **NTP** (Network Time Protocol) synchronizes the clocks of all devices so that **log timestamps**, **certificates**, and **security events** line up. Troubleshooting is nearly impossible if every device shows a different time.` },
      { t:"h", text:"Stratum and hierarchy" },
      { t:"p", text:`NTP is organized by **stratum** - a measure of distance from an authoritative time source. Stratum 0 is a reference clock (atomic clock, GPS). A server directly attached to it is stratum 1, the next layer stratum 2, and so on. **Lower stratum = more authoritative.**` },
      { t:"code", title:"Configure NTP client and server", lights:["#ff6f6f","#ffce5e","#46e3b6"], lines:[
        `! Point this device at an NTP server`,
        `Router(config)# ntp server 129.6.15.28`,
        `! Optionally make this device an NTP source for others`,
        `Router(config)# ntp master 3`,
        `! Verify synchronization`,
        `Router# show ntp status`,
        `Router# show ntp associations`,
      ]},
      { t:"callout", cv:"#ffce5e", icon:"✦", title:"Pair NTP with logging", text:`Always combine NTP with the command service timestamps log datetime so syslog entries carry accurate, correlated times across every device.` },
    ],
    quiz: [
      { q:`In NTP, a lower stratum number means the time source is:`,
        opts:[`Less accurate and further from the reference`,`More authoritative and closer to the reference clock`,`Located on a slower link`,`A backup server only`],
        answer:1,
        explain:`A **lower stratum** is closer to the authoritative reference clock and therefore more trusted. Stratum 1 servers sit right next to stratum 0 reference clocks.` },
      { q:`Why is synchronized time important on network devices?`,
        opts:[`It speeds up routing convergence`,`It makes log timestamps and security events correlate correctly`,`It increases bandwidth`,`It is required for VLANs to function`],
        answer:1,
        explain:`Synchronized clocks ensure **log timestamps and security events** across devices align, which is essential for troubleshooting and forensics.` },
      { q:`Which command points a Cisco device to an external NTP time source?`,
        opts:[`ntp master`,`ntp server <ip>`,`clock set`,`ntp peer-only`],
        answer:1,
        explain:`**ntp server <ip>** configures the device as an NTP client of that server. ntp master makes the device itself a time source.` },
    ],
  },
  {
    id: "s4l5",
    title: "SNMP, Syslog & Management",
    subtitle: "Monitoring and logging the network",
    blocks: [
      { t:"p", text:`You cannot manage what you cannot see. Two services give visibility: **SNMP** for monitoring/polling, and **Syslog** for event logging.` },
      { t:"h", text:"SNMP" },
      { t:"p", text:`**SNMP** (Simple Network Management Protocol) lets a management station (NMS) poll devices for status and receive **traps** when events occur. **SNMPv3** is strongly preferred - it adds **authentication and encryption**; v1/v2c rely on plaintext community strings.` },
      { t:"h", text:"Syslog severity levels" },
      { t:"p", text:`Syslog messages carry a **severity** from 0 (most critical) to 7 (most verbose). A common mnemonic is "Every Awesome Cisco Engineer Will Need Ice cream Daily."` },
      { t:"table", headers:["Level","Name","Meaning"], rows:[
        ["0","Emergency","System unusable"],
        ["1","Alert","Immediate action needed"],
        ["2","Critical","Critical condition"],
        ["3","Error","Error condition"],
        ["4","Warning","Warning condition"],
        ["5","Notification","Normal but significant"],
        ["6","Informational","Informational message"],
        ["7","Debugging","Debug-level output"],
      ]},
      { t:"code", title:"Send logs to a syslog server", lights:["#ff6f6f","#ffce5e","#46e3b6"], lines:[
        `Router(config)# logging host 10.0.0.50`,
        `! Send level 4 (warnings) and more severe`,
        `Router(config)# logging trap warnings`,
        `Router(config)# service timestamps log datetime msec`,
      ]},
      { t:"callout", cv:"#ff8169", icon:"⚠", title:"Use secure management", text:`Always manage devices over SSH, not Telnet, and use SNMPv3 rather than v1/v2c. Telnet and SNMP community strings travel in cleartext.` },
    ],
    quiz: [
      { q:`Which SNMP version provides authentication and encryption?`,
        opts:[`SNMPv1`,`SNMPv2c`,`SNMPv3`,`None do`],
        answer:2,
        explain:`**SNMPv3** adds authentication and encryption. v1 and v2c rely on plaintext community strings and are not secure.` },
      { q:`Which syslog severity level is the most critical?`,
        opts:[`Level 7 - Debugging`,`Level 0 - Emergency`,`Level 4 - Warning`,`Level 5 - Notification`],
        answer:1,
        explain:`Syslog severity **0 (Emergency)** is the most critical - the system is unusable. Level 7 (Debugging) is the least severe.` },
      { q:`A device sends an unsolicited alert to its management station when an event occurs. This SNMP message is a:`,
        opts:[`Get request`,`Set request`,`Trap`,`Walk`],
        answer:2,
        explain:`An SNMP **trap** is an unsolicited notification sent by a device to the NMS when a defined event occurs.` },
    ],
  },
  {
    id: "s4l6",
    title: "Quality of Service",
    subtitle: "Prioritizing traffic when the link is busy",
    blocks: [
      { t:"p", text:`When a link gets congested, something has to wait. **QoS** decides what waits. Real-time traffic like **voice** and **video** is sensitive to delay, jitter, and loss, so QoS ensures it is treated better than bulk data.` },
      { t:"h", text:"The QoS toolkit" },
      { t:"terms", items:[
        { term:"Classification", def:"Identifying traffic types - by port, protocol, or ACL - so each can be treated differently." },
        { term:"Marking", def:"Tagging packets with a priority value. Layer 3 uses DSCP in the IP header; Layer 2 uses CoS." },
        { term:"Queuing", def:"Holding packets in separate queues; priority/low-latency queuing serves voice first." },
        { term:"Policing vs shaping", def:"Policing drops/remarks traffic over a limit; shaping buffers and delays it to smooth the rate." },
        { term:"Congestion avoidance", def:"Selectively dropping lower-priority packets (e.g. WRED) before queues overflow." },
      ]},
      { t:"h", text:"Key concepts" },
      { t:"list", items:[
        `**Trust boundary** - the point where the network begins to trust the QoS markings on incoming traffic. Usually pushed to the access edge (e.g. an IP phone).`,
        `**EF (Expedited Forwarding, DSCP 46)** - the marking used for voice traffic, ensuring lowest delay.`,
        `Voice tolerances: one-way delay under ~150 ms, jitter under ~30 ms, loss under ~1%.`,
      ]},
      { t:"callout", cv:"#ffce5e", icon:"✦", title:"QoS does not create bandwidth", text:`QoS only manages contention - it decides who goes first when the pipe is full. It cannot manufacture capacity that is not there.` },
    ],
    quiz: [
      { q:`Which QoS action tags a packet with a priority value in the IP header?`,
        opts:[`Classification`,`Marking (DSCP)`,`Shaping`,`Policing`],
        answer:1,
        explain:`**Marking** sets a priority value such as DSCP in the IP header so downstream devices can treat the packet appropriately.` },
      { q:`What is the key difference between traffic policing and traffic shaping?`,
        opts:[`Policing buffers excess traffic; shaping drops it`,`Policing drops or remarks excess traffic; shaping buffers and delays it`,`They are identical`,`Shaping only works on voice`],
        answer:1,
        explain:`**Policing** drops or remarks traffic above the limit immediately; **shaping** buffers excess traffic and releases it later to smooth the rate.` },
      { q:`Which traffic type is most sensitive to delay and jitter?`,
        opts:[`Email`,`File downloads`,`Real-time voice (VoIP)`,`Web browsing`],
        answer:2,
        explain:`**Real-time voice** is highly sensitive to delay, jitter, and loss, so QoS prioritizes it - typically with the EF (DSCP 46) marking.` },
    ],
  },
  ],
},
{
  id: "s5", idx: "05", name: "Security Fundamentals", color: "#ff8169",
  tagline: "Shields of the Outer Rim",
  blurb: "Threats, device hardening, access control lists, Layer 2 defenses, VPNs and wireless security.",
  lessons: [
  {
    id: "s5l1",
    title: "Security Concepts & Threats",
    subtitle: "The vocabulary of network defense",
    blocks: [
      { t:"p", text:`Security starts with shared language. The CCNA expects you to distinguish a few foundational terms and recognize common attacks.` },
      { t:"terms", items:[
        { term:"Vulnerability", def:"A weakness in a system - unpatched software, weak passwords, misconfiguration." },
        { term:"Threat", def:"A potential danger that could exploit a vulnerability." },
        { term:"Exploit", def:"The actual tool or technique used to take advantage of a vulnerability." },
        { term:"Risk", def:"The likelihood that a threat exploits a vulnerability, and the impact if it does." },
        { term:"Mitigation", def:"A control or countermeasure that reduces risk." },
      ]},
      { t:"h", text:"The CIA triad" },
      { t:"p", text:`Every security control protects one or more of: **Confidentiality** (only authorized parties see the data), **Integrity** (data is not altered), and **Availability** (systems are accessible when needed).` },
      { t:"h", text:"Common attacks to recognize" },
      { t:"list", items:[
        `**Denial of Service (DoS/DDoS)** - overwhelming a system so it cannot serve legitimate users.`,
        `**Man-in-the-Middle** - intercepting traffic between two parties (e.g. ARP spoofing).`,
        `**Spoofing** - forging a source address (IP, MAC) to impersonate a trusted device.`,
        `**Social engineering** - phishing, pretexting, tailgating - manipulating people, not machines.`,
        `**Password attacks** - brute force and dictionary attacks against credentials.`,
        `**Reconnaissance** - scanning and probing to map a target before attacking.`,
      ]},
      { t:"callout", cv:"#ff8169", icon:"✦", title:"Defense in depth", text:`No single control is enough. Layered security - physical, network, host, application, and user awareness - means one failure does not breach everything.` },
    ],
    quiz: [
      { q:`A weakness such as unpatched software is best described as a:`,
        opts:[`Threat`,`Vulnerability`,`Exploit`,`Risk`],
        answer:1,
        explain:`A **vulnerability** is the weakness itself. A threat could exploit it; an exploit is the tool used; risk is the likelihood and impact.` },
      { q:`Which element of the CIA triad ensures data has not been altered?`,
        opts:[`Confidentiality`,`Integrity`,`Availability`,`Authentication`],
        answer:1,
        explain:`**Integrity** ensures data is not modified by unauthorized parties. Confidentiality protects secrecy; availability protects access.` },
      { q:`Phishing emails that trick users into revealing credentials are an example of:`,
        opts:[`A DoS attack`,`Social engineering`,`IP spoofing`,`A man-in-the-middle attack`],
        answer:1,
        explain:`**Social engineering** manipulates people rather than exploiting technical flaws. Phishing is its most common form.` },
    ],
  },
  {
    id: "s5l2",
    title: "Device Hardening & AAA",
    subtitle: "Securing access to the devices themselves",
    blocks: [
      { t:"p", text:`Network devices are high-value targets. Hardening means closing off easy ways in and controlling who can do what.` },
      { t:"h", text:"Baseline hardening" },
      { t:"code", title:"Essential device hardening", lights:["#ff6f6f","#ffce5e","#46e3b6"], lines:[
        `! Encrypt the privileged-EXEC password`,
        `Router(config)# enable secret StrongPass!`,
        `! Encrypt all plaintext passwords in the config`,
        `Router(config)# service password-encryption`,
        `! Require SSH (not Telnet) for remote access`,
        `Router(config)# ip domain-name lab.local`,
        `Router(config)# crypto key generate rsa modulus 2048`,
        `Router(config)# line vty 0 4`,
        `Router(config-line)# transport input ssh`,
        `Router(config-line)# login local`,
        `! Warn unauthorized users`,
        `Router(config)# banner motd #Authorized access only#`,
      ]},
      { t:"h", text:"AAA" },
      { t:"p", text:`**AAA** centralizes identity control into three functions: **Authentication** (who are you?), **Authorization** (what may you do?), and **Accounting** (what did you do?). Rather than local accounts on each device, AAA uses a central server.` },
      { t:"terms", items:[
        { term:"RADIUS", def:"Open standard, UDP, encrypts only the password. Common for end-user network access (often with 802.1X)." },
        { term:"TACACS+", def:"Cisco, TCP, encrypts the entire payload, separates the three A's. Preferred for device administration." },
        { term:"802.1X", def:"Port-based network access control - a client (supplicant) authenticates through a switch (authenticator) to a server before the port opens." },
      ]},
      { t:"callout", cv:"#ff8169", icon:"⚠", title:"enable secret vs enable password", text:`Always use enable secret - it stores a strong hash. The older enable password uses weak, reversible encoding and should never be used.` },
    ],
    quiz: [
      { q:`Which AAA function records what an authenticated user did?`,
        opts:[`Authentication`,`Authorization`,`Accounting`,`Accreditation`],
        answer:2,
        explain:`**Accounting** logs user activity - commands run, session times, data used. Authentication verifies identity; authorization grants permissions.` },
      { q:`Which protocol encrypts the entire payload and is preferred for device administration?`,
        opts:[`RADIUS`,`TACACS+`,`SNMPv2c`,`Telnet`],
        answer:1,
        explain:`**TACACS+** (Cisco, TCP) encrypts the whole packet and separates the three A's - ideal for granular device administration. RADIUS encrypts only the password.` },
      { q:`Which command stores the privileged-EXEC password as a strong hash?`,
        opts:[`enable password`,`enable secret`,`service password-encryption`,`username admin password`],
        answer:1,
        explain:`**enable secret** stores a strong cryptographic hash. enable password uses weak, reversible encoding.` },
    ],
  },
  {
    id: "s5l3",
    title: "Access Control Lists",
    subtitle: "Filtering traffic with permit and deny rules",
    blocks: [
      { t:"p", text:`An **ACL** is an ordered list of permit/deny rules that filters traffic. ACLs are evaluated **top to bottom**, and processing **stops at the first match**. There is an invisible **implicit deny any** at the end of every ACL.` },
      { t:"diagram", key:"acl", cap:"Standard ACLs go near the destination; extended ACLs go near the source" },
      { t:"h", text:"Standard vs extended" },
      { t:"terms", items:[
        { term:"Standard ACL (1-99)", def:"Filters on source IP only. Place close to the destination so you don't accidentally block too much." },
        { term:"Extended ACL (100-199)", def:"Filters on source, destination, protocol, and port. Place close to the source to drop unwanted traffic early." },
        { term:"Named ACL", def:"Uses a descriptive name instead of a number; easier to read and to edit individual lines." },
        { term:"Wildcard mask", def:"Inverse of a subnet mask. 0.0.0.255 matches a /24; the keyword 'host' = 0.0.0.0; 'any' = 0.0.0.0 255.255.255.255." },
      ]},
      { t:"code", title:"An extended ACL applied to an interface", lights:["#ff6f6f","#ffce5e","#46e3b6"], lines:[
        `Router(config)# ip access-list extended WEB_ONLY`,
        `! Allow HTTP and HTTPS from the LAN to the server`,
        `Router(config-ext-nacl)# permit tcp 192.168.1.0 0.0.0.255 host 10.0.0.5 eq 80`,
        `Router(config-ext-nacl)# permit tcp 192.168.1.0 0.0.0.255 host 10.0.0.5 eq 443`,
        `Router(config-ext-nacl)# exit`,
        `! Apply it inbound on the LAN interface`,
        `Router(config)# interface g0/0`,
        `Router(config-if)# ip access-group WEB_ONLY in`,
      ]},
      { t:"callout", cv:"#ff8169", icon:"⚠", title:"The implicit deny", text:`Every ACL ends with an unseen deny any. If your ACL only has permit statements, everything else is silently dropped. Always plan for what you allow.` },
    ],
    quiz: [
      { q:`How is an ACL processed?`,
        opts:[`Bottom to top, all rules evaluated`,`Top to bottom, stopping at the first match`,`In random order`,`Only the last rule matters`],
        answer:1,
        explain:`ACLs are read **top to bottom** and stop at the **first match**. Rule order is critical.` },
      { q:`An extended ACL should generally be placed:`,
        opts:[`Close to the destination`,`Close to the source`,`On a loopback interface`,`It does not matter`],
        answer:1,
        explain:`Because an **extended ACL** can match precisely (protocol/port), placing it **close to the source** drops unwanted traffic early, saving bandwidth.` },
      { q:`An ACL contains only permit statements for two subnets. What happens to all other traffic?`,
        opts:[`It is permitted by default`,`It is dropped by the implicit deny any`,`It is logged but allowed`,`It causes an error`],
        answer:1,
        explain:`Every ACL ends with an **implicit deny any** - traffic not explicitly permitted is silently dropped.` },
      { q:`What does the wildcard mask 0.0.0.255 match?`,
        opts:[`A single host`,`All hosts in a /24 network`,`Any address`,`A /16 network`],
        answer:1,
        explain:`The wildcard **0.0.0.255** matches all addresses in a **/24** - the last octet is a 'don't care'.` },
    ],
  },
  {
    id: "s5l4",
    title: "Layer 2 Security",
    subtitle: "Defending the switched access edge",
    blocks: [
      { t:"p", text:`Layer 2 is often the softest target - attacks here happen before any router or firewall sees the traffic. Several features harden the switch edge.` },
      { t:"h", text:"Port security" },
      { t:"p", text:`**Port security** limits which and how many MAC addresses may use a switch port. A violation can trigger one of three actions: **protect** (drop silently), **restrict** (drop and log), or **shutdown** (err-disable the port - the default).` },
      { t:"code", title:"Port security on an access port", lights:["#ff6f6f","#ffce5e","#46e3b6"], lines:[
        `Switch(config)# interface fa0/1`,
        `Switch(config-if)# switchport mode access`,
        `Switch(config-if)# switchport port-security`,
        `Switch(config-if)# switchport port-security maximum 2`,
        `! Learn the MAC dynamically and save it to config`,
        `Switch(config-if)# switchport port-security mac-address sticky`,
        `Switch(config-if)# switchport port-security violation restrict`,
      ]},
      { t:"h", text:"Other Layer 2 defenses" },
      { t:"terms", items:[
        { term:"DHCP Snooping", def:"Marks ports as trusted or untrusted; drops rogue DHCP offers from untrusted ports. Stops rogue-DHCP-server attacks." },
        { term:"Dynamic ARP Inspection (DAI)", def:"Uses the DHCP snooping database to validate ARP messages, blocking ARP spoofing / man-in-the-middle." },
        { term:"BPDU Guard", def:"Disables a PortFast access port if it receives a BPDU - stops a rogue switch from influencing STP." },
        { term:"Disable unused ports", def:"Administratively shut down unused interfaces and place them in an unused VLAN." },
      ]},
      { t:"callout", cv:"#ff8169", icon:"✦", title:"Layers work together", text:`DHCP snooping builds a binding table of legitimate IP/MAC/port mappings - and Dynamic ARP Inspection then relies on that table to catch ARP spoofing. Enable snooping first.` },
    ],
    quiz: [
      { q:`What is the default port-security violation action?`,
        opts:[`protect`,`restrict`,`shutdown`,`log-only`],
        answer:2,
        explain:`The default violation action is **shutdown** - the port is placed in err-disabled state and must be manually recovered.` },
      { q:`Which feature stops a rogue DHCP server from handing out bad addresses?`,
        opts:[`Port security`,`DHCP snooping`,`BPDU Guard`,`Dynamic ARP Inspection`],
        answer:1,
        explain:`**DHCP snooping** classifies ports as trusted/untrusted and drops DHCP server messages arriving on untrusted ports.` },
      { q:`Dynamic ARP Inspection relies on which other feature's database?`,
        opts:[`Port security`,`STP`,`DHCP snooping`,`CDP`],
        answer:2,
        explain:`**DAI** validates ARP packets against the **DHCP snooping** binding table, so snooping must be enabled first.` },
      { q:`The sticky option in port security does what?`,
        opts:[`Permanently blocks the port`,`Dynamically learns a MAC and adds it to the running config`,`Allows unlimited MACs`,`Disables the port on startup`],
        answer:1,
        explain:`**sticky** lets the switch learn a connected device's MAC dynamically and write it into the running configuration as a secure address.` },
    ],
  },
  {
    id: "s5l5",
    title: "VPNs & Wireless Security",
    subtitle: "Protecting traffic in transit and over the air",
    blocks: [
      { t:"p", text:`Data is most exposed while crossing untrusted networks - the internet and the airwaves. VPNs and wireless encryption protect it.` },
      { t:"h", text:"VPNs" },
      { t:"terms", items:[
        { term:"Site-to-site VPN", def:"Connects whole networks (e.g. branch to HQ) over the internet. Gateways handle encryption; hosts are unaware." },
        { term:"Remote-access VPN", def:"An individual user's device runs VPN client software to securely reach the corporate network." },
        { term:"IPsec", def:"A framework that provides confidentiality, integrity, and authentication for IP traffic - the basis of most VPNs." },
        { term:"GRE", def:"A tunneling protocol that encapsulates traffic (including multicast) but does not encrypt - often paired with IPsec." },
      ]},
      { t:"h", text:"Wireless security" },
      { t:"p", text:`Wireless security has evolved: **WEP** is broken and obsolete; **WPA2** uses strong AES encryption; **WPA3** is the current standard, adding protections against offline password guessing. Two authentication modes exist:` },
      { t:"list", items:[
        `**Personal (PSK)** - everyone shares one pre-shared key/passphrase. Simple; used at home and small offices.`,
        `**Enterprise (802.1X)** - each user authenticates with unique credentials against a RADIUS server. The right choice for organizations.`,
      ]},
      { t:"callout", cv:"#ff8169", icon:"⚠", title:"Never use WEP", text:`WEP can be cracked in minutes. Use WPA2 at minimum and WPA3 where supported. For business networks, choose Enterprise (802.1X) mode over a shared PSK.` },
    ],
    quiz: [
      { q:`Which VPN type connects an entire branch network to headquarters with hosts unaware of the encryption?`,
        opts:[`Remote-access VPN`,`Site-to-site VPN`,`SSL clientless VPN`,`Split-tunnel VPN`],
        answer:1,
        explain:`A **site-to-site VPN** links whole networks via gateways - the encryption happens at the gateways, transparent to end hosts.` },
      { q:`Which wireless security standard is currently recommended and resists offline password attacks?`,
        opts:[`WEP`,`WPA`,`WPA2-only`,`WPA3`],
        answer:3,
        explain:`**WPA3** is the current standard and strengthens protection against offline dictionary/brute-force attacks. WEP is obsolete.` },
      { q:`In a corporate WLAN, which authentication mode gives each user unique credentials via RADIUS?`,
        opts:[`Personal (PSK)`,`Enterprise (802.1X)`,`Open authentication`,`MAC filtering`],
        answer:1,
        explain:`**Enterprise (802.1X)** mode authenticates each user individually against a RADIUS server - far more secure and accountable than a shared PSK.` },
      { q:`Which framework provides encryption, integrity, and authentication for most VPNs?`,
        opts:[`GRE`,`IPsec`,`HTTP`,`CDP`],
        answer:1,
        explain:`**IPsec** is the security framework providing confidentiality, integrity, and authentication for IP traffic in most VPNs.` },
    ],
  },
  ],
},
{
  id: "s6", idx: "06", name: "Automation & Programmability", color: "#46e3b6",
  tagline: "Engines of the Autonomous Age",
  blurb: "Automation's impact, SDN and controllers, REST APIs, JSON, and configuration management tools.",
  lessons: [
  {
    id: "s6l1",
    title: "Network Automation Concepts",
    subtitle: "Why the network is becoming programmable",
    blocks: [
      { t:"p", text:`Traditionally, engineers configured devices one box at a time over the CLI. That is slow, error-prone, and hard to keep consistent. **Automation** treats the network like software - configurations are templated, version-controlled, and pushed at scale.` },
      { t:"h", text:"Traditional vs controller-based" },
      { t:"terms", items:[
        { term:"Traditional networking", def:"Each device is independently configured and runs its own control plane. Distributed but manual and inconsistent." },
        { term:"Controller-based networking", def:"A central controller programs many devices from a single point, using a unified policy and APIs." },
        { term:"Configuration drift", def:"When devices that should be identical slowly diverge through manual edits. Automation prevents it." },
        { term:"Infrastructure as Code", def:"Network state defined in text files, stored in version control, and applied repeatably." },
      ]},
      { t:"h", text:"Benefits of automation" },
      { t:"list", items:[
        `**Speed** - deploy changes to hundreds of devices in minutes, not weeks.`,
        `**Consistency** - every device gets the exact same tested configuration.`,
        `**Fewer errors** - removes manual typos and missed steps.`,
        `**Scalability & auditability** - changes are repeatable and tracked in version control.`,
      ]},
      { t:"callout", cv:"#46e3b6", icon:"✦", title:"Automation is augmentation", text:`Automation does not replace network engineers - it removes repetitive toil so they can focus on design, security, and solving real problems.` },
    ],
    quiz: [
      { q:`What is configuration drift?`,
        opts:[`Devices losing power intermittently`,`Devices that should match slowly diverging through manual changes`,`Routing tables aging out`,`A type of DoS attack`],
        answer:1,
        explain:`**Configuration drift** is the gradual divergence of devices that should be identical, caused by ad-hoc manual edits. Automation enforces consistency.` },
      { q:`A key advantage of controller-based networking over traditional networking is:`,
        opts:[`Each device runs its own independent control plane`,`Centralized, consistent configuration from a single point`,`It removes the need for any IP addressing`,`It eliminates all security concerns`],
        answer:1,
        explain:`**Controller-based** networking programs many devices centrally with unified policy, giving consistency and speed that per-device CLI cannot match.` },
      { q:`Which is NOT a typical benefit of network automation?`,
        opts:[`Faster deployments`,`Greater configuration consistency`,`Slower, more manual workflows`,`Fewer human errors`],
        answer:2,
        explain:`Automation makes workflows **faster and more consistent** with fewer errors - "slower and more manual" is the opposite of its purpose.` },
    ],
  },
  {
    id: "s6l2",
    title: "SDN & Controller-Based Networking",
    subtitle: "Separating the brains from the muscle",
    blocks: [
      { t:"p", text:`**Software-Defined Networking** separates the network's decision-making from its packet-forwarding. Understanding the **planes** is the core idea.` },
      { t:"diagram", key:"sdn", cap:"SDN layers: applications, a central controller, and the data-plane devices" },
      { t:"h", text:"The three planes" },
      { t:"terms", items:[
        { term:"Data plane", def:"Actually forwards packets/frames - the 'muscle'. Runs in hardware for speed." },
        { term:"Control plane", def:"Makes the decisions - builds routing/switching tables, runs protocols - the 'brains'." },
        { term:"Management plane", def:"How humans and tools configure and monitor devices (CLI, SSH, SNMP, GUI)." },
      ]},
      { t:"p", text:`In SDN, the **control plane is centralized** in a controller, while devices keep only the data plane. The controller becomes the single source of truth.` },
      { t:"h", text:"Northbound and southbound APIs" },
      { t:"list", items:[
        `**Northbound API** - faces upward to applications and orchestration tools. Usually a **REST API**. It lets software express *intent* to the controller.`,
        `**Southbound API** - faces downward to the network devices. Examples: **OpenFlow**, **NETCONF**, Cisco's APIs. It pushes the controller's decisions to the hardware.`,
      ]},
      { t:"callout", cv:"#46e3b6", icon:"✦", title:"Cisco controllers", text:`Cisco Catalyst Center (formerly DNA Center) is an intent-based controller for campus networks. It uses an underlay (physical) and an overlay (virtual fabric) to deliver policy.` },
    ],
    quiz: [
      { q:`Which plane is responsible for actually forwarding packets?`,
        opts:[`Control plane`,`Data plane`,`Management plane`,`Application plane`],
        answer:1,
        explain:`The **data plane** forwards packets and frames - typically in hardware. The control plane makes the decisions it follows.` },
      { q:`In SDN, a northbound API typically connects the controller to:`,
        opts:[`Network forwarding devices`,`Applications and orchestration tools`,`The physical cabling`,`End-user laptops`],
        answer:1,
        explain:`The **northbound API** faces upward toward **applications** - commonly a REST API through which software expresses intent to the controller.` },
      { q:`What fundamental change does SDN make compared to traditional networking?`,
        opts:[`It removes the data plane`,`It centralizes the control plane in a controller`,`It eliminates IP addressing`,`It forces every device to run OSPF`],
        answer:1,
        explain:`SDN **centralizes the control plane** into a controller, leaving devices to handle only data-plane forwarding.` },
    ],
  },
  {
    id: "s6l3",
    title: "REST APIs",
    subtitle: "How software talks to the network",
    blocks: [
      { t:"p", text:`A **REST API** (Representational State Transfer) is the standard way applications request data and actions from a controller or service over HTTP/HTTPS. CCNA expects you to know its building blocks.` },
      { t:"h", text:"HTTP methods and CRUD" },
      { t:"table", headers:["Method","CRUD action","Purpose"], rows:[
        ["GET","Read","Retrieve data"],
        ["POST","Create","Create a new resource"],
        ["PUT / PATCH","Update","Modify an existing resource"],
        ["DELETE","Delete","Remove a resource"],
      ]},
      { t:"h", text:"HTTP response status codes" },
      { t:"table", headers:["Code","Meaning"], rows:[
        ["200 / 201","Success / created"],
        ["400","Bad request - malformed input"],
        ["401","Unauthorized - authentication failed"],
        ["403","Forbidden - authenticated but not allowed"],
        ["404","Not found"],
        ["500","Internal server error"],
      ]},
      { t:"h", text:"Anatomy of a REST call" },
      { t:"p", text:`A REST request has a **URI** (the resource address), an HTTP **method**, **headers** (often including an authentication token and a content type), and an optional **body**. Authentication commonly uses an **API key** or a **token** (e.g. obtained via OAuth) carried in the headers.` },
      { t:"callout", cv:"#46e3b6", icon:"✦", title:"Stateless by design", text:`REST is stateless - each request carries everything the server needs, including credentials. The server keeps no session memory between calls.` },
    ],
    quiz: [
      { q:`Which HTTP method is used to retrieve data without changing it?`,
        opts:[`POST`,`GET`,`DELETE`,`PUT`],
        answer:1,
        explain:`**GET** retrieves a resource and corresponds to the 'Read' operation in CRUD. It should not modify server state.` },
      { q:`A REST API call returns HTTP status code 401. This means:`,
        opts:[`Success`,`Authentication failed / unauthorized`,`The resource was not found`,`Internal server error`],
        answer:1,
        explain:`**401 Unauthorized** indicates authentication failed - the credentials were missing or invalid.` },
      { q:`Which CRUD operation does the POST method map to?`,
        opts:[`Read`,`Create`,`Update`,`Delete`],
        answer:1,
        explain:`**POST** maps to **Create** - it adds a new resource on the server.` },
      { q:`REST APIs are described as stateless because:`,
        opts:[`They never use HTTPS`,`Each request carries all needed information; the server keeps no session`,`They cannot return data`,`They only work with JSON`],
        answer:1,
        explain:`**Stateless** means each request is self-contained - the server stores no session between calls, so every request must include its own context and credentials.` },
    ],
  },
  {
    id: "s6l4",
    title: "Data Formats — JSON",
    subtitle: "The structured language of APIs",
    blocks: [
      { t:"p", text:`APIs exchange **structured data**, and **JSON** (JavaScript Object Notation) is by far the most common format. It is lightweight, human-readable, and the CCNA expects you to read it and spot syntax errors.` },
      { t:"h", text:"JSON syntax rules" },
      { t:"list", items:[
        `Data is written as **key/value pairs**: "key": value.`,
        `**Objects** are wrapped in curly braces { } and hold a set of key/value pairs.`,
        `**Arrays** are wrapped in square brackets [ ] and hold an ordered list of values.`,
        `Keys and string values use **double quotes**. Values may also be numbers, true/false, or null.`,
        `Pairs and elements are separated by **commas** - with no trailing comma after the last one.`,
      ]},
      { t:"code", title:"A JSON object describing an interface", lights:["#ff6f6f","#ffce5e","#46e3b6"], lines:[
        `{`,
        `  "interface": "GigabitEthernet0/1",`,
        `  "enabled": true,`,
        `  "mtu": 1500,`,
        `  "addresses": [`,
        `    { "ip": "10.0.0.1", "prefix": 30 }`,
        `  ]`,
        `}`,
      ]},
      { t:"h", text:"JSON vs XML vs YAML" },
      { t:"p", text:`**XML** uses verbose opening/closing tags and is common in older systems and NETCONF. **YAML** uses indentation instead of brackets and is favored for human-written config files (e.g. Ansible playbooks). **JSON** sits in between - structured, compact, and ideal for API payloads.` },
      { t:"callout", cv:"#ff8169", icon:"⚠", title:"Common JSON mistakes", text:`The most frequent errors: a trailing comma after the last item, missing double quotes on keys, and mismatched { } or [ ] brackets. The exam loves to test this.` },
    ],
    quiz: [
      { q:`In JSON, which characters enclose an array?`,
        opts:[`Curly braces { }`,`Square brackets [ ]`,`Angle brackets < >`,`Parentheses ( )`],
        answer:1,
        explain:`**Square brackets [ ]** enclose a JSON array (an ordered list). Curly braces { } enclose an object.` },
      { q:`JSON data is fundamentally organized as:`,
        opts:[`Opening and closing tags`,`Key/value pairs`,`Indented lines only`,`Comma-separated columns`],
        answer:1,
        explain:`JSON is built from **key/value pairs** grouped into objects and arrays.` },
      { q:`Which data format relies on indentation rather than brackets and is common in Ansible playbooks?`,
        opts:[`JSON`,`XML`,`YAML`,`CSV`],
        answer:2,
        explain:`**YAML** uses indentation to denote structure and is widely used for human-written configuration such as Ansible playbooks.` },
      { q:`Which is a common JSON syntax error the exam tests?`,
        opts:[`Using double quotes on keys`,`A trailing comma after the last element`,`Using square brackets for arrays`,`Including numeric values`],
        answer:1,
        explain:`A **trailing comma** after the final element is invalid JSON. Double quotes on keys and bracketed arrays are correct.` },
    ],
  },
  {
    id: "s6l5",
    title: "Config Management — Ansible, Puppet, Chef",
    subtitle: "Tools that enforce desired state at scale",
    blocks: [
      { t:"p", text:`Configuration management tools push and enforce a **desired state** across many devices. The CCNA expects you to compare the three big names on two axes: **agent vs agentless** and **push vs pull**.` },
      { t:"h", text:"The three tools compared" },
      { t:"table", headers:["Tool","Agent?","Model","Language"], rows:[
        ["Ansible","Agentless (uses SSH)","Push","YAML playbooks"],
        ["Puppet","Agent-based","Pull","Puppet DSL (Ruby-like)"],
        ["Chef","Agent-based","Pull","Ruby (recipes/cookbooks)"],
      ]},
      { t:"terms", items:[
        { term:"Agent-based", def:"Software is installed on each managed device; it periodically checks in with the central server. Puppet and Chef." },
        { term:"Agentless", def:"No software to install on devices - the tool connects over SSH/API. Ansible. Easiest for network gear." },
        { term:"Push model", def:"The central server initiates and sends configuration out to devices. Ansible." },
        { term:"Pull model", def:"Devices (agents) periodically request their configuration from the server. Puppet and Chef." },
        { term:"Idempotency", def:"Running the same automation repeatedly produces the same end state - no unintended changes on re-runs." },
      ]},
      { t:"h", text:"Why Ansible is popular for networking" },
      { t:"p", text:`Network devices often cannot run a custom agent, so **Ansible's agentless, SSH-based** approach fits naturally. Its **playbooks** are written in readable YAML, and it ships with modules for Cisco IOS and many other platforms.` },
      { t:"callout", cv:"#46e3b6", icon:"✦", title:"Memory hook", text:`Ansible = Agentless + push + YAML. Puppet and Chef = Agent-based + pull. If a question mentions YAML playbooks, the answer is Ansible.` },
    ],
    quiz: [
      { q:`Which configuration management tool is agentless and uses SSH?`,
        opts:[`Puppet`,`Chef`,`Ansible`,`All three`],
        answer:2,
        explain:`**Ansible** is agentless - it connects over SSH/API with no software installed on the managed device. Puppet and Chef are agent-based.` },
      { q:`Puppet and Chef primarily use which model?`,
        opts:[`Push`,`Pull`,`Broadcast`,`Multicast`],
        answer:1,
        explain:`**Puppet and Chef** use a **pull** model - agents on devices periodically request their configuration from the central server.` },
      { q:`Ansible playbooks are written in which language?`,
        opts:[`Ruby`,`Python`,`YAML`,`XML`],
        answer:2,
        explain:`Ansible **playbooks** are written in **YAML**, a readable, indentation-based format.` },
      { q:`Idempotency in automation means:`,
        opts:[`Each run produces a different result`,`Running the same automation repeatedly yields the same end state`,`The tool requires an agent`,`Configuration is never saved`],
        answer:1,
        explain:`**Idempotency** means re-running the same automation leaves the system in the same desired state, with no unintended side effects.` },
    ],
  },
  ],
},
];

/* ============================ RENDER HELPERS ============================= */
/* parse **bold** inside text */
function rich(text) {
  const parts = String(text).split(/(\*\*[^*]+\*\*)/g);
  return parts.map((p, i) =>
    p.startsWith("**") && p.endsWith("**") ? (
      <strong key={i}>{p.slice(2, -2)}</strong>
    ) : (
      <React.Fragment key={i}>{p}</React.Fragment>
    )
  );
}

/* colorize one line of code (Cisco CLI or JSON) */
function codeLine(line, idx) {
  if (line.trimStart().startsWith("!")) {
    return (
      <span className="cl cmt" key={idx}>
        {line}
        {"\n"}
      </span>
    );
  }
  const parts = [];
  let rest = line;
  let key = 0;
  const pm = rest.match(/^(\S+(?:\([^)]*\))?[>#])(\s?)/);
  if (pm) {
    parts.push(
      <span className="prm" key={key++}>
        {pm[0]}
      </span>
    );
    rest = rest.slice(pm[0].length);
  }
  const rx = /(\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}(?:\/\d+)?\b|"[^"]*")/g;
  let last = 0;
  let m;
  while ((m = rx.exec(rest)) !== null) {
    if (m.index > last)
      parts.push(<span key={key++}>{rest.slice(last, m.index)}</span>);
    const tok = m[0];
    parts.push(
      <span key={key++} className={tok.startsWith('"') ? "arg" : "ip"}>
        {tok}
      </span>
    );
    last = m.index + tok.length;
  }
  if (last < rest.length) parts.push(<span key={key++}>{rest.slice(last)}</span>);
  return (
    <span className="cl" key={idx}>
      {parts}
      {"\n"}
    </span>
  );
}

function CodeBlock({ title, lights, lines }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    const text = lines.join("\n");
    try {
      navigator.clipboard.writeText(text);
    } catch (e) {
      /* clipboard unavailable */
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };
  return (
    <div className="code">
      <div className="code-top">
        <div className="ct-l">
          <div className="lights">
            {(lights || ["#ff6f6f", "#ffce5e", "#46e3b6"]).map((c, i) => (
              <i key={i} style={{ background: c }} />
            ))}
          </div>
          <span className="title">{title || "console"}</span>
        </div>
        <button
          className={"copy" + (copied ? " copied" : "")}
          onClick={copy}
        >
          {copied ? "✓ copied" : "copy"}
        </button>
      </div>
      <pre>{lines.map((l, i) => codeLine(l, i))}</pre>
    </div>
  );
}

function Block({ b, color }) {
  if (b.t === "p") return <p>{rich(b.text)}</p>;
  if (b.t === "h") return <h3>{b.text}</h3>;
  if (b.t === "list")
    return (
      <ul>
        {b.items.map((it, i) => (
          <li key={i}>{rich(it)}</li>
        ))}
      </ul>
    );
  if (b.t === "terms")
    return (
      <div className="terms">
        {b.items.map((it, i) => (
          <div className="term" key={i}>
            <b>{it.term}</b>
            <span>{rich(it.def)}</span>
          </div>
        ))}
      </div>
    );
  if (b.t === "code") return <CodeBlock {...b} />;
  if (b.t === "callout")
    return (
      <div className="callout" style={{ "--cv": b.cv || color }}>
        <span className="ci" style={{ color: b.cv || color }}>
          {b.icon || "✦"}
        </span>
        <div className="ct">
          <b>{b.title}</b>
          <p>{rich(b.text)}</p>
        </div>
      </div>
    );
  if (b.t === "diagram") {
    const D = DIAGRAMS[b.key];
    if (!D) return null;
    return (
      <div className="figure">
        <D />
        {b.cap && <div className="figcap">{b.cap}</div>}
      </div>
    );
  }
  if (b.t === "table")
    return (
      <div className="tbl-wrap">
        <table className="dt">
          <thead>
            <tr>
              {b.headers.map((h, i) => (
                <th key={i}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {b.rows.map((row, i) => (
              <tr key={i}>
                {row.map((cell, j) => (
                  <td key={j}>{j === 0 ? <strong>{cell}</strong> : cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  return null;
}

/* ------------------------------- quiz ------------------------------------ */
const LETTERS = ["A", "B", "C", "D", "E"];

function Quiz({ quiz, color, answers, onAnswer }) {
  const answered = Object.keys(answers).length;
  const score = quiz.reduce(
    (n, q, i) => (answers[i] === q.answer ? n + 1 : n),
    0
  );
  return (
    <div className="quiz">
      <div className="quiz-head">
        <h3 style={{ color: "#fff" }}>Knowledge Check</h3>
        <span className="qscore" style={{ color }}>
          {answered === quiz.length
            ? `Score ${score}/${quiz.length}`
            : `${answered}/${quiz.length} answered`}
        </span>
      </div>
      <p className="qsub">
        Pick an answer to lock it in — the explanation appears either way, so a
        wrong guess still teaches you something.
      </p>
      {quiz.map((q, qi) => {
        const chosen = answers[qi];
        const locked = chosen !== undefined;
        const correct = locked && chosen === q.answer;
        return (
          <div className="q" key={qi}>
            <div className="qn">
              <span className="qnum" style={{ color }}>
                {String(qi + 1).padStart(2, "0")}
              </span>
              <span className="qtext">{q.q}</span>
            </div>
            <div className="opts">
              {q.opts.map((opt, oi) => {
                let cls = "opt";
                if (locked) {
                  if (oi === q.answer) cls += " correct";
                  else if (oi === chosen) cls += " wrong";
                }
                return (
                  <button
                    key={oi}
                    className={cls}
                    disabled={locked}
                    onClick={() => onAnswer(qi, oi)}
                  >
                    <span className="ol">{LETTERS[oi]}</span>
                    <span>{opt}</span>
                  </button>
                );
              })}
            </div>
            {locked && (
              <div className={"explain " + (correct ? "right" : "miss")}>
                <div className="ev">
                  {correct ? "✓ Correct" : "✗ Not quite"}
                </div>
                <p>{rich(q.explain)}</p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ------------------------- progress ring --------------------------------- */
function Ring({ pct, size = 96, stroke = 7, color = "#9d83ff" }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const off = c * (1 - pct);
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="rgba(255,255,255,0.07)"
        strokeWidth={stroke}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={off}
        style={{
          transition: "stroke-dashoffset .7s cubic-bezier(.2,.8,.2,1)",
          filter: `drop-shadow(0 0 5px ${color})`,
        }}
      />
    </svg>
  );
}

/* tiny constellation flourish for sector cards */
function Constellation({ color }) {
  const pts = useMemo(() => {
    const a = [];
    for (let i = 0; i < 5; i++)
      a.push([10 + Math.random() * 70, 8 + Math.random() * 44]);
    return a;
  }, []);
  return (
    <svg className="constellation" width="90" height="60">
      {pts.slice(1).map((p, i) => (
        <line
          key={i}
          x1={pts[i][0]}
          y1={pts[i][1]}
          x2={p[0]}
          y2={p[1]}
          stroke={color}
          strokeWidth="0.7"
          opacity="0.55"
        />
      ))}
      {pts.map((p, i) => (
        <circle key={i} cx={p[0]} cy={p[1]} r={i === 0 ? 2.6 : 1.7}
          fill={color} />
      ))}
    </svg>
  );
}

/* ============================== APP ===================================== */
const ALL_LESSONS = CURRICULUM.reduce((n, s) => n + s.lessons.length, 0);

export default function CCNAAcademy() {
  const [view, setView] = useState("home"); // home | sector | lesson
  const [si, setSi] = useState(0);
  const [li, setLi] = useState(0);
  const [progress, setProgress] = useState(() =>
    storage.get("ccna.progress.v1", {})
  );
  const topRef = useRef(null);

  useEffect(() => {
    storage.set("ccna.progress.v1", progress);
  }, [progress]);

  useEffect(() => {
    if (topRef.current) topRef.current.scrollIntoView({ behavior: "smooth" });
  }, [view, si, li]);

  const doneCount = Object.values(progress).filter((p) => p && p.done).length;
  const pct = ALL_LESSONS ? doneCount / ALL_LESSONS : 0;

  const sectorDone = (sec) =>
    sec.lessons.filter((l) => progress[l.id] && progress[l.id].done).length;

  const answerQuestion = (lessonId, quizLen, qi, oi) => {
    setProgress((prev) => {
      const cur = prev[lessonId] || { answers: {}, done: false };
      const answers = { ...cur.answers, [qi]: oi };
      const done = Object.keys(answers).length === quizLen;
      return { ...prev, [lessonId]: { answers, done } };
    });
  };

  const resetAll = () => {
    if (
      typeof window !== "undefined" &&
      window.confirm &&
      !window.confirm("Reset all lesson progress and quiz answers?")
    )
      return;
    setProgress({});
  };

  const openLesson = (sIdx, lIdx) => {
    setSi(sIdx);
    setLi(lIdx);
    setView("lesson");
  };

  /* ---- next-lesson navigation ---- */
  const goNext = () => {
    const sec = CURRICULUM[si];
    if (li + 1 < sec.lessons.length) {
      setLi(li + 1);
    } else if (si + 1 < CURRICULUM.length) {
      setSi(si + 1);
      setLi(0);
    } else {
      setView("home");
    }
  };

  return (
    <div className="ccna-root">
      <style>{STYLE}</style>
      <Sky />
      <div className="wrap">
        <div ref={topRef} />

        {/* ---------------- HOME ---------------- */}
        {view === "home" && (
          <>
            <header className="mast">
              <div className="badge">
                <span className="dot" />
                Interactive Certification Atlas
              </div>
              <h1>
                CCNA: Deep
                <br />
                Space Observatory
              </h1>
              <p className="sub">
                A complete, self-paced journey through the Cisco Certified
                Network Associate blueprint — six sectors, {ALL_LESSONS} guided
                lessons, hands-on CLI, star-chart diagrams, and a quiz at every
                stop.
              </p>
              <div className="exam">EXAM 200-301 · NETWORK ENGINEERING TRACK</div>
            </header>

            <div className="mission">
              <div className="orbit-wrap">
                <Ring pct={pct} color="#9d83ff" />
                <div className="orbit-num">
                  <b>{Math.round(pct * 100)}%</b>
                  <span>charted</span>
                </div>
              </div>
              <div className="mission-txt">
                <h3>Mission Progress</h3>
                <p>
                  {doneCount} of {ALL_LESSONS} lessons complete across all six
                  sectors. Your progress is saved on this device.
                </p>
                <div className="mbar">
                  <i style={{ width: `${pct * 100}%` }} />
                </div>
              </div>
              <button className="reset-btn" onClick={resetAll}>
                Reset
              </button>
            </div>

            <div className="eyebrow">Navigate the Sectors</div>
            <div className="sectors">
              {CURRICULUM.map((sec, idx) => {
                const d = sectorDone(sec);
                const sp = d / sec.lessons.length;
                return (
                  <button
                    key={sec.id}
                    className="sector"
                    style={{ "--sc": sec.color }}
                    onClick={() => {
                      setSi(idx);
                      setView("sector");
                    }}
                  >
                    <div className="glow" />
                    <Constellation color={sec.color} />
                    <div className="idx">SECTOR {sec.idx}</div>
                    <h3>{sec.name}</h3>
                    <p>{sec.blurb}</p>
                    <div className="meta">
                      <span>
                        {d}/{sec.lessons.length} lessons
                      </span>
                      <div style={{ width: 40, height: 40 }}>
                        <Ring
                          pct={sp}
                          size={40}
                          stroke={4}
                          color={sec.color}
                        />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="foot">
              <p>
                CCNA · DEEP SPACE OBSERVATORY · {ALL_LESSONS} LESSONS ·{" "}
                {CURRICULUM.reduce(
                  (n, s) =>
                    n + s.lessons.reduce((m, l) => m + l.quiz.length, 0),
                  0
                )}{" "}
                QUIZ QUESTIONS
              </p>
            </div>
          </>
        )}

        {/* ---------------- SECTOR ---------------- */}
        {view === "sector" && (
          <>
            <div className="backbar">
              <button className="back" onClick={() => setView("home")}>
                {Ico.back} All Sectors
              </button>
              <span className="crumb">
                / SECTOR {CURRICULUM[si].idx}
              </span>
            </div>
            <div
              className="sector-head"
              style={{ "--sc": CURRICULUM[si].color }}
            >
              <div
                className="idx"
                style={{
                  fontFamily: "'JetBrains Mono',monospace",
                  fontSize: 11,
                  letterSpacing: 2,
                  color: CURRICULUM[si].color,
                }}
              >
                {CURRICULUM[si].tagline.toUpperCase()}
              </div>
              <h2>{CURRICULUM[si].name}</h2>
              <p>{CURRICULUM[si].blurb}</p>
            </div>
            <div className="lessons">
              {CURRICULUM[si].lessons.map((les, idx) => {
                const p = progress[les.id];
                const done = p && p.done;
                return (
                  <button
                    key={les.id}
                    className="lcard"
                    style={{ "--sc": CURRICULUM[si].color }}
                    onClick={() => openLesson(si, idx)}
                  >
                    <div className={"lnode" + (done ? " done" : "")}>
                      {done ? Ico.check : idx + 1}
                    </div>
                    <div className="lt">
                      <h4>{les.title}</h4>
                      <p>{les.subtitle}</p>
                    </div>
                    <span className={"pill " + (done ? "ok" : "todo")}>
                      {done ? "Complete" : `${les.quiz.length} Q`}
                    </span>
                    <span className="chev">{Ico.chev}</span>
                  </button>
                );
              })}
            </div>
            <div className="foot">
              <p>SECTOR {CURRICULUM[si].idx} · {CURRICULUM[si].lessons.length} LESSONS</p>
            </div>
          </>
        )}

        {/* ---------------- LESSON ---------------- */}
        {view === "lesson" &&
          (() => {
            const sec = CURRICULUM[si];
            const les = sec.lessons[li];
            const p = progress[les.id] || { answers: {}, done: false };
            const isLastLesson =
              li + 1 >= sec.lessons.length && si + 1 >= CURRICULUM.length;
            return (
              <>
                <div className="backbar">
                  <button
                    className="back"
                    onClick={() => setView("sector")}
                  >
                    {Ico.back} {sec.name}
                  </button>
                  <span className="crumb">
                    / LESSON {li + 1} OF {sec.lessons.length}
                  </span>
                </div>

                <div
                  className="lesson"
                  style={{ "--sc": sec.color }}
                >
                  <div className="lesson-hero">
                    <div className="tag">
                      Sector {sec.idx} · {sec.name}
                    </div>
                    <h2>{les.title}</h2>
                    <p>{les.subtitle}</p>
                  </div>

                  {les.blocks.map((b, i) => (
                    <div className="block" key={i}>
                      <Block b={b} color={sec.color} />
                    </div>
                  ))}

                  <Quiz
                    quiz={les.quiz}
                    color={sec.color}
                    answers={p.answers || {}}
                    onAnswer={(qi, oi) =>
                      answerQuestion(les.id, les.quiz.length, qi, oi)
                    }
                  />

                  <div className="lesson-done">
                    {p.done ? (
                      <>
                        <h3>Lesson charted ✦</h3>
                        <p>
                          You've worked through every question in this lesson.
                          Continue your journey through the blueprint.
                        </p>
                      </>
                    ) : (
                      <>
                        <h3>Keep going</h3>
                        <p>
                          Answer every question above to mark this lesson
                          complete — or move ahead and return later.
                        </p>
                      </>
                    )}
                    <div className="nav-row">
                      <button
                        className="nav-next ghost"
                        onClick={() => setView("sector")}
                      >
                        Back to sector
                      </button>
                      <button className="nav-next" onClick={goNext}>
                        {isLastLesson
                          ? "Finish — return to atlas"
                          : "Next lesson"}{" "}
                        {Ico.arrow}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="foot">
                  <p>
                    {sec.name.toUpperCase()} · {les.title.toUpperCase()}
                  </p>
                </div>
              </>
            );
          })()}
      </div>
    </div>
  );
}
