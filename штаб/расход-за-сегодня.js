// Обёртка для ежедневной задачи планировщика: считает расход.js за сегодня
// (от полуночи по системным часам) и пишет результат в штаб/расход-<дата>.txt.
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const сейчас = new Date();
const дата = сейчас.toISOString().slice(0, 10);
const полночь = дата + 'T00:00:00';

const вывод = execFileSync('node', [path.join(__dirname, 'расход.js'), полночь], { encoding: 'utf8' });
fs.writeFileSync(path.join(__dirname, 'расход-' + дата + '.txt'), вывод);
console.log('записано: штаб/расход-' + дата + '.txt');
