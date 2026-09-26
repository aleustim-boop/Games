'use strict';
// CASUAL_BASE selects local server or the published site for browser tests.
const {spawnSync}=require('node:child_process');
const games=['mines','klondike','spider','freecell','mahjong','blocks','match3','wordsearch','fifteen','snake'];
const all=[...['mines','solitaire','mahjong','blocks','match3','wordsearch','fifteen','snake'].map(id=>['tests/casual-'+id+'.js']),...games.map(id=>['tests/casual-ui.js',id]),...['klondike','spider','freecell'].map(id=>['tests/casual-card-ui.js',id]),...['mahjong','blocks','match3','wordsearch','fifteen','snake'].map(id=>['tests/casual-'+id+'-ui.js'])];
const cases=process.argv.includes('--browser-only')?all.slice(8):all;
for(const args of cases){const result=spawnSync(process.execPath,args,{stdio:'inherit',timeout:120000});if(result.status!==0){console.error('FAILED:',args.join(' '),result.error?.message||'');process.exit(result.status||1);}}
console.log(`All ${cases.length} casual-game checks passed for ${process.env.CASUAL_BASE||'http://127.0.0.1:8137'}`);
