'use strict';
// CASUAL_BASE selects local server or the published site for browser tests.
const {spawnSync}=require('node:child_process');
const games=['mines','klondike','spider','freecell','mahjong','blocks','match3','wordsearch','fifteen','snake'];
const rules=[...['mines','solitaire','mahjong','blocks','match3','wordsearch','fifteen','snake'].map(id=>['tests/casual-'+id+'.js']),['tests/casual-card-completion.js']];
const browser=[...games.map(id=>['tests/casual-ui.js',id]),...['klondike','spider','freecell'].map(id=>['tests/casual-card-ui.js',id]),...['mahjong','blocks','match3','wordsearch','fifteen','snake'].map(id=>['tests/casual-'+id+'-ui.js']),...['card-completion-ui','card-touch-drag','full-games-ui','recovery-ui','studio-loading','studio-interactions','studio-cards','studio-puzzles','premium'].map(id=>['tests/casual-'+id+'.js'])];
const cases=process.argv.includes('--browser-only')?browser:[...rules,...browser];
for(const args of cases){const result=spawnSync(process.execPath,args,{stdio:'inherit',timeout:args[0].includes('full-games')?600000:120000});if(result.status!==0){console.error('FAILED:',args.join(' '),result.error?.message||'');process.exit(result.status||1);}}
console.log(`All ${cases.length} casual-game checks passed for ${process.env.CASUAL_BASE||'http://127.0.0.1:8137'}`);
