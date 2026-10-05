/* Словарь страницы «Шашки»: html, экран, лобби, рекорды, знаки и тексты сервера.
   Ключ — русская фраза как её видит игрок; строка «русский|українська|English».
   Фразы с именами и числами — шаблонами ниже. Проверка: tests/языки-шашки.js. */
(function (корень) {
  'use strict';
  const Языки = typeof module !== 'undefined' && module.exports ? require('./языки') : корень.Языки;
  const строки = `
К выбору игры|До вибору гри|Back to games
Разделы шашек|Розділи шашок|Checkers sections
Шашки онлайн с друзьями и ботом — бесплатно|Шашки онлайн із друзями та ботом — безкоштовно|Play checkers online with friends and a bot — free
Шашки онлайн с друзьями в Telegram|Шашки онлайн із друзями в Telegram|Play checkers online with friends in Telegram
Шашки — игра на двоих на доске из тёмных и светлых клеток. Цель — оставить соперника без шашек или без возможных ходов. Играть можно прямо в Telegram: с другом по ссылке-приглашению, со случайным соперником или с ботом.|Шашки — гра на двох на дошці з темних і світлих клітинок. Мета — залишити суперника без шашок або без можливих ходів. Грати можна просто в Telegram: з другом за посиланням-запрошенням, з випадковим суперником або з ботом.|Checkers is a game for two on a board of dark and light squares. The goal is to leave your opponent with no pieces or no possible moves. You can play right in Telegram: with a friend via an invite link, with a random opponent or with a bot.
Частые вопросы|Часті запитання|FAQ
Как играть вдвоём с другом?|Як грати вдвох з другом?|How do I play with a friend?
Откройте игру в Telegram, создайте партию и отправьте другу ссылку-приглашение или код. Друг войдёт по ней, и вы начнёте играть. Если вы рядом, можно играть по очереди на одном телефоне.|Відкрийте гру в Telegram, створіть партію й надішліть другові посилання-запрошення або код. Друг зайде за ним, і ви почнете грати. Якщо ви поруч, можна грати по черзі на одному телефоні.|Open the game in Telegram, create a game and send your friend an invite link or a code. They join with it and you start playing. If you are together, you can take turns on one phone.
Сколько игроков?|Скільки гравців?|How many players?
Двое: вы и соперник. Соперником может быть друг, случайный игрок или бот.|Двоє: ви та суперник. Суперником може бути друг, випадковий гравець або бот.|Two: you and an opponent. The opponent can be a friend, a random player or a bot.
Нужно ли что-то скачивать?|Чи потрібно щось завантажувати?|Do I need to download anything?
Нет. Игра открывается внутри Telegram, отдельное приложение устанавливать не нужно.|Ні. Гра відкривається всередині Telegram, окремий застосунок встановлювати не потрібно.|No. The game opens inside Telegram, there is no separate app to install.
Можно ли играть с ботом?|Чи можна грати з ботом?|Can I play against a bot?
Да, есть бот трёх уровней сложности: лёгкий, обычный и сложный.|Так, є бот трьох рівнів складності: легкий, звичайний і складний.|Yes, there is a bot with three difficulty levels: easy, normal and hard.
Это бесплатно?|Це безкоштовно?|Is it free?
Да, игра бесплатная, в ней нет покупок.|Так, гра безкоштовна, у ній немає покупок.|Yes, the game is free and has no purchases.
Открыть игру в Telegram: @BoardingGames_bot|Відкрити гру в Telegram: @BoardingGames_bot|Open the game in Telegram: @BoardingGames_bot
Классическая игра для двоих|Класична гра для двох|A classic game for two
Одна дамка решает партию|Одна дамка вирішує партію|One king decides the game
Вдвоём на этом устройстве|Удвох на цьому пристрої|Two players on this device
Один телефон на двоих|Один телефон на двох|One phone for two
Выберите, с кем играть|Оберіть, з ким грати|Choose who to play with
Играть вдвоём|Грати вдвох|Play with a friend
на этом устройстве|на цьому пристрої|on this device
Играть с другом|Грати з другом|Play with a friend
Игра с ботом|Гра з ботом|Play against a bot
Контроль времени|Контроль часу|Time control
Без часов|Без годинника|No clock
5 минут|5 хвилин|5 minutes
Блиц 3+2|Бліц 3+2|Blitz 3+2
Рапид 10+0|Рапід 10+0|Rapid 10+0
Начать|Почати|Start
Один создаёт игру и говорит код, второй входит по коду. Играть вдвоём можно, пока включён компьютер того, кто запускает игру.|Один створює гру й каже код, другий заходить за кодом. Грати вдвох можна, доки ввімкнений комп'ютер того, хто запускає гру.|One player creates the game and shares the code, the other joins with it. You can play together as long as the host's computer is on.
Указать адрес сервера|Вказати адресу сервера|Set the server address
Адрес спрашивают у того, кто запустил сервер игры.|Адресу питають у того, хто запустив сервер гри.|Ask for the address from whoever started the game server.
Сохранить адрес|Зберегти адресу|Save address
Стереть вписанный адрес|Стерти вписану адресу|Clear the entered address
Ходят белые|Ходять білі|White to move
Ходят чёрные|Ходять чорні|Black to move
Предложить ничью|Запропонувати нічию|Offer a draw
Сдаться|Здатися|Resign
Отменить ход|Скасувати хід|Undo move
Реванш|Реванш|Rematch
Ещё партию с другом|Ще партію з другом|Another game with a friend
Другой соперник|Інший суперник|New opponent
Рекорды шашек|Рекорди шашок|Checkers records
Назад к доске|Назад до дошки|Back to the board
Ходят по тёмным полям на клетку вперёд по диагонали. Первыми ходят белые.|Ходять по темних полях на клітинку вперед по діагоналі. Першими ходять білі.|Pieces move one square forward diagonally on the dark squares. White moves first.
Бой обязателен: есть кого бить — тихо пойти нельзя. Игра подсветит бьющих.|Бій обов'язковий: є кого бити — тихо піти не можна. Гра підсвітить шашки, що б'ють.|Capturing is mandatory: if you can capture, you cannot make a quiet move. The game highlights the capturing pieces.
Простая бьёт и назад. Ходит она только вперёд, но удар может прийти сзади.|Проста б'є й назад. Ходить вона лише вперед, але удар може прийти ззаду.|A man also captures backwards. It only moves forward, but a capture can go backwards.
Бейте дальше, пока есть кого. Побитые лежат на доске до конца хода — второй раз через них не прыгнуть.|Б'яйте далі, поки є кого. Побиті лежать на дошці до кінця ходу — удруге через них не стрибнути.|Keep capturing while you can. Captured pieces stay on the board until the end of the move — you cannot jump over them twice.
Победа — когда у соперника не осталось шашек или ему нечем ходить.|Перемога — коли в суперника не залишилося шашок або йому нічим ходити.|You win when your opponent has no pieces left or cannot move.
Буквы и цифры на доске: да|Літери й цифри на дошці: так|Letters and numbers on the board: on
Буквы и цифры на доске: нет|Літери й цифри на дошці: ні|Letters and numbers on the board: off
Красивая комбинация|Гарна комбінація|Nice combination
Бью!|Б'ю!|Capturing!
У меня дамка!|У мене дамка!|I have a king!
Не ожидал…|Не очікував…|Did not expect that…
Не спешите, думайте|Не поспішайте, думайте|Take your time, think
Может, ничья?|Може, нічия?|Maybe a draw?
Хорошая партия!|Гарна партія!|Good game!
Мне повезло|Мені пощастило|I got lucky
Звук выключен|Звук вимкнено|Sound is off
Бот|Бот|Bot
Белые|Білі|White
Чёрные|Чорні|Black
Побед подряд пока нет|Перемог поспіль поки немає|No winning streak yet
Побед подряд пока не было.|Перемог поспіль поки не було.|No winning streaks yet.
Рекорды сейчас негде хранить: хранилище не подключилось.|Рекорди зараз ніде зберігати: сховище не підключилося.|There is nowhere to keep records right now: storage did not connect.
Играть это не мешает, а рекорды появятся после обновления страницы.|Грати це не заважає, а рекорди з'являться після оновлення сторінки.|It does not stop you from playing, and the records will appear after the page is refreshed.
Рекорды не прочитались. Попробуйте открыть их ещё раз.|Рекорди не прочиталися. Спробуйте відкрити їх ще раз.|The records could not be read. Try opening them again.
Читаем рекорды…|Читаємо рекорди…|Loading records…
Рекордов пока нет. Сыграйте партию против робота — победы подряд попадут сюда.|Рекордів поки немає. Зіграйте партію проти робота — перемоги поспіль потраплять сюди.|No records yet. Play a game against the robot — winning streaks will show up here.
Лучшие серии побед|Найкращі серії перемог|Best winning streaks
Счёт по уровням|Рахунок за рівнями|Score by level
Последние партии|Останні партії|Recent games
Партий пока не записано.|Партій поки не записано.|No games recorded yet.
Ничья. Серия побед не начата|Нічия. Серію перемог не розпочато|Draw. No winning streak started
Лёгкий: не играли|Легкий: не грали|Easy: not played
Обычный: не играли|Звичайний: не грали|Normal: not played
Сложный: не играли|Складний: не грали|Hard: not played
Не вышло|Не вийшло|Failed
Готовим…|Готуємо…|Getting ready…
Игра по сети не загрузилась — обновите страницу|Гра по мережі не завантажилась — оновіть сторінку|The online game did not load — refresh the page
Игра по сети не загрузилась — обновите страницу (Ctrl+F5). С ботом и вдвоём на этом устройстве играть можно.|Гра по мережі не завантажилась — оновіть сторінку (Ctrl+F5). З ботом і вдвох на цьому пристрої грати можна.|The online game did not load — refresh the page (Ctrl+F5). You can still play against the bot or two on this device.
Игра по сети не загрузилась|Гра по мережі не завантажилась|The online game did not load
Связь с игрой потеряна — ход не ушёл|Зв'язок із грою втрачено — хід не надіслано|Connection to the game is lost — the move was not sent
Ход не удалось отправить|Хід не вдалося надіслати|The move could not be sent
Правила не загрузились — обновите страницу|Правила не завантажились — оновіть сторінку|The rules did not load — refresh the page
часы соперника|годинник суперника|opponent's clock
ваши часы|ваш годинник|your clock
Вы выиграли|Ви виграли|You won
Выиграл соперник|Виграв суперник|The opponent won
Соперник выиграл|Суперник виграв|The opponent won
Выиграли белые|Виграли білі|White won
Выиграли чёрные|Виграли чорні|Black won
Белые выиграли|Білі виграли|White won
Чёрные выиграли|Чорні виграли|Black won
Соперник думает…|Суперник думає…|The opponent is thinking…
Соперник бьёт|Суперник б'є|The opponent is capturing
Бьём дальше: побитые снимутся в конце хода|Б'ємо далі: побиті знімуться в кінці ходу|Keep capturing: captured pieces are removed at the end of the move
Ход отправлен…|Хід надіслано…|Move sent…
Ходит соперник|Ходить суперник|Opponent's move
Ваш ход: есть бой, брать обязательно|Ваш хід: є бій, брати обов'язково|Your move: you must capture
Ход соперника: есть бой, брать обязательно|Хід суперника: є бій, брати обов'язково|Opponent's move: a capture is available
Ходит соперник: есть бой, брать обязательно|Ходить суперник: є бій, брати обов'язково|Opponent's move: a capture is available
Ходят белые: есть бой, брать обязательно|Ходять білі: є бій, брати обов'язково|White to move: you must capture
Ходят чёрные: есть бой, брать обязательно|Ходять чорні: є бій, брати обов'язково|Black to move: you must capture
Так походить не вышло — начните ход заново|Так піти не вийшло — почніть хід заново|That move did not work — start the move again
Нужно бить: выберите шашку, которая может взять|Треба бити: оберіть шашку, яка може взяти|You must capture: pick a piece that can capture
Этой шашкой ходить некуда|Цією шашкою ходити нікуди|This piece has nowhere to move
Это шашка соперника|Це шашка суперника|That is the opponent's piece
Это шашка друга|Це шашка друга|That is your friend's piece
Сейчас ход белых|Зараз хід білих|It is White's move
Сейчас ход чёрных|Зараз хід чорних|It is Black's move
Выберите свою шашку|Оберіть свою шашку|Pick your own piece
Сюда пойти нельзя|Сюди піти не можна|You cannot move here
Соперник не загрузился — обновите страницу|Суперник не завантажився — оновіть сторінку|The opponent did not load — refresh the page
Соперник запутался — начните партию заново|Суперник заплутався — почніть партію заново|The opponent got confused — start a new game
Доска пришла испорченной — обновите страницу|Дошка прийшла пошкодженою — оновіть сторінку|The board arrived corrupted — refresh the page
Так сходить не вышло|Так піти не вийшло|That move did not work
Реванша не будет — вернитесь в меню|Реваншу не буде — поверніться до меню|No rematch — go back to the menu
Ждём соперника…|Чекаємо на суперника…|Waiting for the opponent…
Соперник хочет реванш|Суперник хоче реванш|Your opponent wants a rematch
Не вышло позвать на реванш|Не вдалося запросити на реванш|Could not ask for a rematch
Пока ничего не было — сделайте первый ход.|Поки нічого не було — зробіть перший хід.|Nothing yet — make the first move.
Соперник предлагает ничью|Суперник пропонує нічию|Your opponent offers a draw
Согласиться|Погодитися|Accept
Играть дальше|Грати далі|Keep playing
Ничья предложена — ждём ответа соперника|Нічию запропоновано — чекаємо на відповідь суперника|Draw offered — waiting for the opponent's answer
Не вышло предложить ничью|Не вдалося запропонувати нічию|Could not offer a draw
Белые предлагают ничью. Согласны?|Білі пропонують нічию. Згодні?|White offers a draw. Do you agree?
Чёрные предлагают ничью. Согласны?|Чорні пропонують нічию. Згодні?|Black offers a draw. Do you agree?
Соперник хочет играть дальше|Суперник хоче грати далі|The opponent wants to keep playing
Да, сдаюсь|Так, здаюсь|Yes, I resign
Не вышло сдаться|Не вдалося здатися|Could not resign
Засчитается поражение, сопернику — победа|Зарахується поразка, суперникові — перемога|It counts as a loss, and a win for the opponent
Партия прервётся, результат не запишется|Партію буде перервано, результат не запишеться|The game will stop and the result will not be saved
Партия закончится без результата|Партія завершиться без результату|The game will end with no result
Сказать сопернику|Сказати суперникові|Say to the opponent
Сказать|Сказати|Say
Кидать пока не в кого — соперник ещё не за доской|Кидати поки не в кого — суперник ще не за дошкою|Nobody to throw to yet — the opponent is not at the board
Знак не ушёл — попробуйте ещё раз|Знак не надіслано — спробуйте ще раз|The sign was not sent — try again
Слишком часто — подождите пару секунд|Надто часто — зачекайте кілька секунд|Too often — wait a couple of seconds
Слишком много подряд — сделайте паузу|Забагато поспіль — зробіть паузу|Too many in a row — take a break
Вас ждёт партия — доиграть|На вас чекає партія — дограти|A game is waiting for you — finish it
У белых не осталось шашек|У білих не залишилося шашок|White has no pieces left
У чёрных не осталось шашек|У чорних не залишилося шашок|Black has no pieces left
Белым нечем ходить: все шашки заперты|Білим нічим ходити: усі шашки заблоковані|White cannot move: all pieces are blocked
Чёрным нечем ходить: все шашки заперты|Чорним нічим ходити: усі шашки заблоковані|Black cannot move: all pieces are blocked
Одна и та же позиция повторилась три раза|Одна й та сама позиція повторилася тричі|The same position occurred three times
Пятнадцать ходов подряд двигались только дамки: ни взятий, ни ходов простыми|П'ятнадцять ходів поспіль рухалися лише дамки: ні взять, ні ходів простими|Fifteen moves in a row with only kings moving: no captures, no moves by men
Три дамки против одной за пятнадцать ходов не взяли дамку соперника|Три дамки проти однієї за п'ятнадцять ходів не взяли дамку суперника|Three kings against one failed to capture the opponent's king in fifteen moves
Время вышло|Час вийшов|Time is up
Игрок завершил партию|Гравець завершив партію|A player ended the game
По соглашению|За згодою|By agreement
Ничья по соглашению|Нічия за згодою|Draw by agreement
Белые сдались|Білі здалися|White resigned
Чёрные сдались|Чорні здалися|Black resigned
Вы сдались|Ви здалися|You resigned
Соперник сдался|Суперник здався|The opponent resigned
Партия уже закончена|Партію вже завершено|The game is already over
В шашках так не ходят|У шашках так не ходять|That is not how checkers works
Сейчас не ваш ход|Зараз не ваш хід|It is not your move
Этот ход не получился — попробуйте другой|Цей хід не вийшов — спробуйте інший|That move did not work — try another
Вас нет за этой доской|Вас немає за цією дошкою|You are not at this board
Вы уже предложили ничью — ждём ответа|Ви вже запропонували нічию — чекаємо на відповідь|You already offered a draw — waiting for an answer
Соперник сам предложил ничью — ответьте на его предложение|Суперник сам запропонував нічию — дайте відповідь на його пропозицію|The opponent offered a draw — answer their offer
Ничью никто не предлагал|Нічию ніхто не пропонував|Nobody offered a draw
Это ваше предложение — ответить может соперник|Це ваша пропозиція — відповісти може суперник|This is your offer — only the opponent can answer
Бить обязательно — этой шашкой сейчас нельзя|Бити обов'язково — цією шашкою зараз не можна|Capturing is mandatory — this piece cannot move now
Этой шашкой сюда не пойти|Цією шашкою сюди не піти|This piece cannot go here
Тут несколько разных боёв — укажите, какие шашки снимаете|Тут кілька різних боїв — вкажіть, які шашки знімаєте|There are several different captures — say which pieces you remove
Вы играете дальше|Ви граєте далі|You keep playing
`;
  const шашки = [['шашки', 'шашки', 'checkers'], ['шашек', 'шашок', 'checkers']];
  const победы = [['победа', 'перемога', 'win'], ['победы', 'перемоги', 'wins'], ['побед', 'перемог', 'wins']];
  const уровни = [['Лёгкий', 'Легкий', 'Easy'], ['Обычный', 'Звичайний', 'Normal'], ['Сложный', 'Складний', 'Hard']];

  const шаблоны = [
    [/^Побед подряд: (\d+)$/, 'Перемог поспіль: $1', 'Winning streak: $1'],
    [/^Побед подряд: (\d+) \(сохранить не удалось\)$/, 'Перемог поспіль: $1 (зберегти не вдалося)', 'Winning streak: $1 (could not save)'],
    [/^Побед подряд: (\d+) — это рекорд!$/, 'Перемог поспіль: $1 — це рекорд!', 'Winning streak: $1 — a record!'],
    [/^Побед подряд: (\d+)\. Лучшая серия: (\d+)$/, 'Перемог поспіль: $1. Найкраща серія: $2', 'Winning streak: $1. Best streak: $2'],
    [/^Ничья серию не прерывает\. Побед подряд: (\d+)$/, 'Нічия серію не перериває. Перемог поспіль: $1', 'A draw does not break the streak. Winning streak: $1'],
    [/^сейчас (\d+)$/, 'зараз $1', 'now $1'],
    [/^сыграно (\d+), побед (\d+)$/, 'зіграно $1, перемог $2', 'played $1, wins $2'],
    [/^Последний ход (.+)$/, 'Останній хід $1', 'Last move $1'],
    [/^Соперник только что отказался\. Предложить снова можно через (\d+) ход$/, 'Суперник щойно відмовився. Запропонувати знову можна через $1 хід', 'The opponent just declined. You can offer again in $1 move'],
    [/^Соперник только что отказался\. Предложить снова можно через (\d+) хода$/, 'Суперник щойно відмовився. Запропонувати знову можна через $1 ходи', 'The opponent just declined. You can offer again in $1 moves'],
    [/^(.+): ход — (.+)$/, '$1: хід — $2', '$1: move — $2'],
    [/^(.+): бой — (.+)$/, '$1: бій — $2', '$1: capture — $2'],
    [/^(.+): в дамки — (.+)$/, '$1: у дамки — $2', '$1: crowned — $2'],
    [/^(.+): ход$/, '$1: хід', '$1: move'],
    [/^(.+) предлагает ничью$/, '$1 пропонує нічию', '$1 offers a draw'],
    [/^(.+) за доской$/, '$1 за дошкою', '$1 is at the board'],
    [/^(.+) больше не играет$/, '$1 більше не грає', '$1 is no longer playing'],
    [/^(.+) слишком долго не на связи — партия закончена$/, '$1 надто довго не на зв\'язку — партію завершено', '$1 has been offline too long — the game is over'],
    [/^взята 1 белая шашка$/, 'взято 1 білу шашку', '1 white piece captured'],
    [/^взята 1 чёрная шашка$/, 'взято 1 чорну шашку', '1 black piece captured'],
    [/^взято (\d+) белые шашки$/, 'взято $1 білі шашки', '$1 white pieces captured'],
    [/^взято (\d+) чёрные шашки$/, 'взято $1 чорні шашки', '$1 black pieces captured'],
    [/^взято (\d+) белых шашек$/, 'взято $1 білих шашок', '$1 white pieces captured'],
    [/^взято (\d+) чёрных шашек$/, 'взято $1 чорних шашок', '$1 black pieces captured']
  ];
  // «Аня: бой, 2 шашки — c3:e5:c7» — слово определяет форму, поэтому на каждую форму свой шаблон.
  for (const [ru, uk, en] of шашки) {
    шаблоны.push([new RegExp('^(.+): бой, (\\d+) ' + ru + ' — (.+)$'), '$1: бій, $2 ' + uk + ' — $3', '$1: capture, $2 ' + en + ' — $3']);
  }
  for (const [ru, uk, en] of победы) {
    шаблоны.push([new RegExp('^Серия прервалась: было (\\d+) ' + ru + ' подряд$'), 'Серія перервалася: було $1 ' + uk + ' поспіль', 'Streak broken: was $1 ' + en + ' in a row']);
    шаблоны.push([new RegExp('^Лучшая серия: (\\d+) ' + ru + ' подряд$'), 'Найкраща серія: $1 ' + uk + ' поспіль', 'Best streak: $1 ' + en + ' in a row']);
    шаблоны.push([new RegExp('^(\\d+) ' + ru + ' подряд$'), '$1 ' + uk + ' поспіль', '$1 ' + en + ' in a row']);
    for (const [ruУ, ukУ, enУ] of уровни) {
      шаблоны.push([new RegExp('^' + ruУ + ': (\\d+) ' + ru + '$'), ukУ + ': $1 ' + uk, enУ + ': $1 ' + en]);
    }
  }

  Языки.добавить(строки);
  Языки.добавитьШаблоны(шаблоны);
  if (typeof module !== 'undefined' && module.exports) module.exports = { строки, шаблоны };
})(typeof window === 'undefined' ? globalThis : window);
