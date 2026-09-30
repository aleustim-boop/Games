'use strict';
module.exports = `
  html { scroll-padding-top: 90px; }
  body { font-family: system-ui, -apple-system, 'Segoe UI', sans-serif; font-size:15px; line-height:1.55; padding:0 24px 56px; }
  .лист { max-width:1240px; }
  h1,h2,h3,.свежесть strong { font-family:inherit; letter-spacing:-.025em; }
  h1 { font-size:clamp(28px,3.5vw,42px); line-height:1.15; }
  h2 { font-size:24px; }
  .шапка { padding:32px 0 22px; border:0; align-items:center; }
  .подзаголовок { margin-top:10px; font-size:15px; max-width:60ch; }
  .отметка-времени { font:12px/1.7 system-ui,sans-serif; padding:12px 16px; border:1px solid var(--line); border-radius:14px; background:var(--surface); }
  .даш-навигация { position:sticky; top:8px; z-index:20; display:flex; gap:4px; align-items:center; padding:7px; margin:0 0 24px; background:var(--surface); border:1px solid var(--line); border-radius:16px; box-shadow:0 6px 24px #0000000d; overflow-x:auto; }
  .даш-навигация a,.даш-навигация button { flex:none; padding:10px 14px; border:0; border-radius:10px; font:600 13px/1.4 system-ui,sans-serif; text-decoration:none; color:var(--ink-soft); background:transparent; cursor:pointer; }
  .даш-навигация a:hover,.даш-навигация button:hover { background:var(--sukno-soft); color:var(--sukno); }
  .даш-навигация button { margin-left:auto; }
  .даш-навигация a:focus-visible,.даш-навигация button:focus-visible { outline:2px solid var(--sukno); outline-offset:-2px; }
  .даш-раздел { scroll-margin-top:90px; }
  .сводка { gap:12px; border:0; background:none; margin-bottom:20px; grid-template-columns:repeat(5,minmax(0,1fr)); }
  .число { border:1px solid var(--line); border-radius:16px; padding:20px; background:var(--surface); box-shadow:0 4px 14px #00000005; }
  .число strong { font:750 36px/1.1 system-ui,sans-serif; font-variant-numeric:tabular-nums; }
  .число span { font-size:12px; letter-spacing:0; text-transform:none; }
  .число--янтарь { background:var(--yantar-soft); border-color:color-mix(in srgb,var(--yantar) 25%,var(--line)); }
  .число--сукно { background:var(--sukno-soft); }
  .даш-раздел > section { padding:24px; border:1px solid var(--line); border-radius:18px; background:var(--surface); box-shadow:0 8px 24px #00000005; margin-bottom:24px; }
  .даш-раздел h2 { margin-bottom:12px; }
  .пояснение { max-width:90ch; color:var(--muted); font-size:13px; line-height:1.6; }
  .работы { gap:14px; }
  .работа { border-radius:14px; padding:18px; box-shadow:none; background:var(--surface-2); }
  .свежесть { border-radius:14px; box-shadow:none; font-size:13px; }
  .лента li { padding-block:14px; }
  summary { cursor:pointer; }
  input,textarea,select,button { font-family:inherit; }
  textarea { line-height:1.5; }
  .сноска { font-size:12px; opacity:.85; }
  @media(max-width:800px) { .сводка { grid-template-columns:repeat(3,minmax(0,1fr)); }.число { padding:16px; }.отметка-времени { text-align:left; } }
  @media(max-width:520px) { body { padding-inline:12px; }.шапка { padding-top:22px; gap:16px; }.отметка-времени { width:100%; }.даш-навигация { top:4px; margin-bottom:16px; }.даш-навигация a,.даш-навигация button { padding:9px 11px; }.сводка { grid-template-columns:repeat(2,minmax(0,1fr)); gap:9px; }.число strong { font-size:30px; }.даш-раздел > section { padding:16px; border-radius:14px; }h2 { font-size:21px; } }
`;
