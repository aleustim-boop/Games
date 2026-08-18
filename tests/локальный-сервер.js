/* Простейший локальный сервер для ручной проверки игры в браузере.
   Нужен потому, что браузер-робот не открывает файлы по адресу file://.
   Запуск: node tests/локальный-сервер.js [порт]   (по умолчанию 8130) */

'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');

const КОРЕНЬ = path.join(__dirname, '..');
const ПОРТ = Number(process.argv[2]) || 8130;

const ТИПЫ = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8'
};

/** Убираем из адреса всё, чем можно вылезти за пределы папки проекта. */
function безопасныйПуть(адрес) {
  return path.normalize(адрес).replace(/^(\.\.[\\/])+/, '').replace(/^[\\/]+/, '');
}

http.createServer(function (запрос, ответ) {
  let адрес = decodeURIComponent(запрос.url.split('?')[0]);
  if (адрес === '/') адрес = '/index.html';
  const файл = path.join(КОРЕНЬ, безопасныйПуть(адрес));
  fs.readFile(файл, function (ошибка, данные) {
    if (ошибка) {
      ответ.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      ответ.end('не найдено: ' + адрес);
      return;
    }
    ответ.writeHead(200, {
      'Content-Type': ТИПЫ[path.extname(файл).toLowerCase()] || 'application/octet-stream',
      'Cache-Control': 'no-store'
    });
    ответ.end(данные);
  });
}).listen(ПОРТ, function () {
  console.log('сервер запущен: http://localhost:' + ПОРТ + '/index.html');
});
