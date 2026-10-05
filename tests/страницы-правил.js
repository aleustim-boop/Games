'use strict';
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { игры } = require('../scripts/страницы-правил');
const корень = path.join(__dirname, '..');
const карта = fs.readFileSync(path.join(корень, 'sitemap.xml'), 'utf8');
function проверить(html, метка, игра) {
  const статья = html.match(/<article>([\s\S]*?)<\/article>/)[1];
  const слов = статья.replace(/<[^>]+>/g, ' ').trim().split(/\s+/).length;
  assert.ok(слов >= 400 && слов <= 800, метка + ': ' + слов + ' слов');
  const вопросов = (статья.match(/<h3>/g) || []).length;
  assert.ok(вопросов >= 4 && вопросов <= 6);
  for (const тег of ['<title>', 'name="description"', 'property="og:title"', 'property="og:description"', 'property="og:image"']) assert.ok(html.includes(тег), метка + ': ' + тег);
  assert.equal((html.match(/>Сыграть сейчас<\/a>/g) || []).length, 2);
  assert.equal((html.match(new RegExp('start=src_rules_' + метка, 'g')) || []).length, 2);
  assert.ok(html.includes('href="/' + encodeURI(игра) + (метка === 'durak' ? '?game=durak' : '') + '"'));
  assert.ok(карта.includes('/rules/' + метка + '/'));
  assert.ok(!html.includes('<script'), 'правила читаются без JS');
  const картинка = new URL(html.match(/property="og:image" content="([^"]+)"/)[1]);
  assert.ok(fs.existsSync(path.join(корень, decodeURIComponent(картинка.pathname))));
  return слов;
}
for (const [метка, игра] of игры) {
  const html = fs.readFileSync(path.join(корень, 'rules', метка, 'index.html'), 'utf8');
  const слов = проверить(html, метка, игра);
  assert.throws(() => проверить(html.replace(/<article>[\s\S]*?<\/article>/, '<article>Нет правил</article>'), метка, игра));
  assert.throws(() => проверить(html.replace(/start=src_rules_/g, 'start=lost_'), метка, игра));
  console.log('PASS', метка, слов, 'слов; потеря статьи и метки замечены');
}
assert.ok(!fs.readFileSync(path.join(корень, 'robots.txt'), 'utf8').includes('Disallow: /rules'));
