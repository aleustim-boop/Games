'use strict';
const fs=require('node:fs');
for(const id of process.argv.slice(2)){
 const file=id+'.html';let s=fs.readFileSync(file,'utf8');
 if(!s.includes('style-casual-studio.css'))s=s.replace('<script>window.ИграСтраницы=','<link rel="stylesheet" href="style-casual-studio.css?v=1"><script>window.ИграСтраницы=');
 if(!s.includes('js/casual-studio.js'))s=s.replace('<script src="js/casual-ui.js','<script src="js/casual-studio.js?v=2"></script><script src="js/casual-ui.js');
 s=s.replaceAll('premium-1','studio-1').replace('casual-studio.js?v=1','casual-studio.js?v=2').replace('casual-ui.js?v=studio-1','casual-ui.js?v=studio-2');fs.writeFileSync(file,s);
}
