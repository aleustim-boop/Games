'use strict';
// CASUAL_BASE selects local server or the published site for browser tests.
const {spawnSync}=require('node:child_process');
// «games» — только игры из фильтра «головоломки», которые СЕЙЧАС видны на
// витрине index.html. casual-ui.js в конце пути кликает по каталогу
// (data-фильтр="головоломки", затем плитка data-игра="…") — если плитки
// физически нет в разметке (blocks/match3/wordsearch/fifteen/snake
// спрятаны с витрины владельцем 29.09, см. CLAUDE.md «Все игры выглядят
// одинаково»), клик виснет на 30 секунд таймаутом. Эти пять по-прежнему
// проверяются отдельными стендами casual-<игра>-ui.js — те открывают
// страницу игры напрямую по адресу, а не через каталог витрины.
// Карточные (klondike, spider, freecell) по той же причине не годятся
// сюда вовсе — их фильтр «карточные», а не «головоломки»; они проверяются
// отдельным стендом casual-card-ui.js — список ниже, cardGames.
const games=['mines','mahjong'];
const cardGames=['klondike','spider','freecell'];
const rules=[...['mines','solitaire','mahjong','blocks','match3','wordsearch','fifteen','snake'].map(id=>['tests/casual-'+id+'.js']),['tests/casual-card-completion.js'],['tests/match3-campaign.js']];
const browser=[...games.map(id=>['tests/casual-ui.js',id]),...cardGames.map(id=>['tests/casual-card-ui.js',id]),...['mahjong','blocks','match3','wordsearch','fifteen','snake'].map(id=>['tests/casual-'+id+'-ui.js']),...['card-completion-ui','card-touch-drag','full-games-ui','recovery-ui','studio-loading','studio-interactions','studio-cards','studio-puzzles','premium'].map(id=>['tests/casual-'+id+'.js'])];
browser.push(['tests/match3-campaign-ui.js'],['tests/match3-effects-ui.js']);
const cases=process.argv.includes('--browser-only')?browser:[...rules,...browser];
for(const args of cases){const result=spawnSync(process.execPath,args,{stdio:'inherit',timeout:(args[0].includes('full-games')||args[0].includes('campaign-ui'))?600000:120000});if(result.status!==0){console.error('FAILED:',args.join(' '),result.error?.message||'');process.exit(result.status||1);}}
console.log(`All ${cases.length} casual-game checks passed for ${process.env.CASUAL_BASE||'http://127.0.0.1:8137'}`);
