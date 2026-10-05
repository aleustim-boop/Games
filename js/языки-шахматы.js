/* Словарь страницы «Шахматы»: html, экран, лобби, рекорды и тексты сервера.
   Ключ — русская фраза как её видит игрок; строка «русский|українська|English».
   Фразы с именами и числами — шаблонами ниже. Проверка: tests/языки-шахматы.js. */
(function (корень) {
  'use strict';
  const Языки = typeof module !== 'undefined' && module.exports ? require('./языки') : корень.Языки;
  const строки = `
К выбору игры|До вибору гри|Back to games
Светлый конь, пешка и тёмный король на деревянной доске|Світлий кінь, пішак і темний король на дерев'яній дошці|A light knight, a pawn and a dark king on a wooden board
Разделы шахмат|Розділи шахів|Chess sections
Назад к лобби|Назад до лобі|Back to lobby
Контроль времени|Контроль часу|Time control
Назад к столам|Назад до столів|Back to tables
адрес|адреса|address
Ходы партии|Ходи партії|Game moves
Шахматы онлайн с соперником — бесплатно в Telegram|Шахи онлайн із суперником — безкоштовно в Telegram|Play chess online with an opponent — free in Telegram
Шахматы онлайн с друзьями в Telegram|Шахи онлайн із друзями в Telegram|Play chess online with friends in Telegram
Шахматы — игра на двоих, в которой нужно поставить мат королю соперника. Играть можно прямо в Telegram: с другом, со случайным соперником, с ботом или вдвоём по очереди на одном телефоне.|Шахи — гра на двох, у якій треба поставити мат королю суперника. Грати можна просто в Telegram: з другом, з випадковим суперником, з ботом або вдвох по черзі на одному телефоні.|Chess is a game for two where you have to checkmate your opponent's king. You can play right in Telegram: with a friend, with a random opponent, with a bot, or two of you taking turns on one phone.
Частые вопросы|Часті запитання|FAQ
Как играть вдвоём с другом?|Як грати вдвох з другом?|How do I play with a friend?
Откройте игру в Telegram, создайте партию и отправьте другу ссылку-приглашение или код. Друг войдёт по ней, и партия начнётся. Если вы рядом, можно играть по очереди на одном телефоне.|Відкрийте гру в Telegram, створіть партію й надішліть другові посилання-запрошення або код. Друг зайде за ним, і партія почнеться. Якщо ви поруч, можна грати по черзі на одному телефоні.|Open the game in Telegram, create a game and send your friend an invite link or a code. They join with it and the game starts. If you are together, you can take turns on one phone.
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
Ход конём начинает партию|Хід конем починає партію|A knight move starts the game
Вдвоём на этом устройстве|Удвох на цьому пристрої|Two players on this device
Один телефон на двоих|Один телефон на двох|One phone for two
Игра с ботом|Гра з ботом|Play against a bot
Без часов|Без годинника|No clock
Блиц 5+3|Бліц 5+3|Blitz 5+3
Рапид 10+0|Рапід 10+0|Rapid 10+0
Классика 30+0|Класика 30+0|Classic 30+0
Начать|Почати|Start
Назад|Назад|Back
Игра онлайн|Гра онлайн|Play online
Один создаёт игру и говорит код, второй входит по коду. Играть вдвоём можно, пока включён компьютер того, кто запускает игру.|Один створює гру й каже код, другий заходить за кодом. Грати вдвох можна, доки ввімкнений комп'ютер того, хто запускає гру.|One player creates the game and shares the code, the other joins with it. You can play together as long as the host's computer is on.
Указать адрес сервера|Вказати адресу сервера|Set the server address
Адрес спрашивают у того, кто запустил сервер игры.|Адресу питають у того, хто запустив сервер гри.|Ask for the address from whoever started the game server.
Сохранить адрес|Зберегти адресу|Save address
Стереть вписанный адрес|Стерти вписану адресу|Clear the entered address
Ходят белые|Ходять білі|White to move
Ходят чёрные|Ходять чорні|Black to move
Играть вдвоём|Грати вдвох|Play with a friend
Предложить ничью|Запропонувати нічию|Offer a draw
Сдаться|Здатися|Resign
Ход назад|Хід назад|Take back
Звук|Звук|Sound
Реванш|Реванш|Rematch
Другой соперник|Інший суперник|New opponent
Кем станет пешка?|Ким стане пішак?|What will the pawn become?
Ферзь|Ферзь|Queen
Ладья|Тура|Rook
Слон|Слон|Bishop
Конь|Кінь|Knight
Передумал|Передумав|Never mind
Принять|Прийняти|Accept
Отклонить|Відхилити|Decline
Рекорды шахмат|Рекорди шахів|Chess records
Назад к доске|Назад до дошки|Back to the board
Король — на одно поле в любую сторону. Пешка — на одно поле вперёд (из начального ряда можно на два), а бьёт по диагонали.|Король — на одне поле в будь-який бік. Пішак — на одне поле вперед (зі стартового ряду можна на два), а б'є по діагоналі.|The king moves one square in any direction. A pawn moves one square forward (two from its starting row) and captures diagonally.
Шах — королю грозит взятие. Ходить можно только так, чтобы шах исчез.|Шах — королю загрожує взяття. Ходити можна лише так, щоб шах зник.|Check — the king is under attack. You may only make a move that removes the check.
Мат — шах без спасения: партия окончена победой того, кто его поставил.|Мат — шах без порятунку: партія завершена перемогою того, хто його поставив.|Checkmate — a check with no escape: the game is won by the player who gave it.
Рокировка — король и ладья сходятся, если между ними пусто, обе не ходили и король не под боем.|Рокіровка — король і тура зближуються, якщо між ними порожньо, обидві не ходили, а король не під боєм.|Castling — the king and rook come together if nothing is between them, neither has moved and the king is not under attack.
Пешка дошла до края — выбирайте: ферзь, ладья, слон или конь.|Пішак дійшов до краю — обирайте: ферзь, тура, слон або кінь.|The pawn reached the edge — choose a queen, rook, bishop or knight.
Ничья — шаха нет, а ходить нечем (пат), либо трижды повторилась одна позиция.|Нічия — шаху немає, а ходити нічим (пат), або тричі повторилася одна позиція.|Draw — no check but no legal move (stalemate), or the same position happened three times.
Поворот доски: да|Поворот дошки: так|Board rotation: on
Поворот доски: нет|Поворот дошки: ні|Board rotation: off
Буквы и цифры: да|Літери й цифри: так|Letters and numbers: on
Буквы и цифры: нет|Літери й цифри: ні|Letters and numbers: off
Бот|Бот|Bot
Белые|Білі|White
Чёрные|Чорні|Black
Звук выключен|Звук вимкнено|Sound is off
Ход белых|Хід білих|White's move
Ход чёрных|Хід чорних|Black's move
Ход белых — доска повёрнута к вам|Хід білих — дошка повернута до вас|White's move — the board is turned to you
Ход чёрных — доска повёрнута к вам|Хід чорних — дошка повернута до вас|Black's move — the board is turned to you
Ваш ход: королю шах|Ваш хід: королю шах|Your move: the king is in check
Ход соперника: королю шах|Хід суперника: королю шах|Opponent's move: the king is in check
Ходят белые: королю шах|Ходять білі: королю шах|White to move: the king is in check
Ходят чёрные: королю шах|Ходять чорні: королю шах|Black to move: the king is in check
Блиц • 5 + 3|Бліц • 5 + 3|Blitz • 5 + 3
Рапид • 10 + 0|Рапід • 10 + 0|Rapid • 10 + 0
Классика • 30 + 0|Класика • 30 + 0|Classic • 30 + 0
часы соперника|годинник суперника|opponent's clock
ваши часы|ваш годинник|your clock
Правила не загрузились — обновите страницу|Правила не завантажились — оновіть сторінку|The rules did not load — refresh the page
Партия окончена — выберите, с кем играть дальше|Партію завершено — оберіть, з ким грати далі|Game over — choose who to play next
Соперник думает…|Суперник думає…|The opponent is thinking…
Ход отправлен…|Хід надіслано…|Move sent…
Пешка дошла до края — выберите, кем ей стать|Пішак дійшов до краю — оберіть, ким йому стати|The pawn reached the edge — choose what it becomes
Так походить не вышло — начните ход заново|Так піти не вийшло — почніть хід заново|That move did not work — start the move again
Доска пришла испорченной — обновите страницу|Дошка прийшла пошкодженою — оновіть сторінку|The board arrived corrupted — refresh the page
Игра по сети не загрузилась — обновите страницу|Гра по мережі не завантажилась — оновіть сторінку|The online game did not load — refresh the page
Так сходить не вышло|Так піти не вийшло|That move did not work
Ход не удалось отправить|Хід не вдалося надіслати|The move could not be sent
Связь с игрой потеряна — попробуйте ещё раз|Зв'язок із грою втрачено — спробуйте ще раз|Connection to the game is lost — try again
Не вышло|Не вийшло|Failed
Соперник предлагает ничью. Согласны?|Суперник пропонує нічию. Згодні?|Your opponent offers a draw. Do you agree?
Белые предлагают ничью. Согласны?|Білі пропонують нічию. Згодні?|White offers a draw. Do you agree?
Чёрные предлагают ничью. Согласны?|Чорні пропонують нічию. Згодні?|Black offers a draw. Do you agree?
Реванша не будет — вернитесь в меню|Реваншу не буде — поверніться до меню|No rematch — go back to the menu
Ждём соперника…|Чекаємо на суперника…|Waiting for the opponent…
Соперник хочет реванш|Суперник хоче реванш|Your opponent wants a rematch
Не вышло позвать на реванш|Не вдалося запросити на реванш|Could not ask for a rematch
Готовим…|Готуємо…|Getting ready…
Соперник не загрузился — обновите страницу|Суперник не завантажився — оновіть сторінку|The opponent did not load — refresh the page
Соперник запутался — начните партию заново|Суперник заплутався — почніть партію заново|The opponent got confused — start a new game
Королю шах: этой фигурой его не спасти|Королю шах: цією фігурою його не врятувати|The king is in check: this piece cannot save it
Этой фигурой ходить некуда|Цією фігурою ходити нікуди|This piece has nowhere to move
Королю шах — так его не спасти|Королю шах — так його не врятувати|The king is in check — this move will not save it
Туда этой фигурой нельзя|Туди цією фігурою не можна|This piece cannot go there
Это фигура соперника|Це фігура суперника|That is the opponent's piece
Сейчас ход белых|Зараз хід білих|It is White's move
Сейчас ход чёрных|Зараз хід чорних|It is Black's move
Выберите свою фигуру|Оберіть свою фігуру|Pick your own piece
Да, сдаюсь|Так, здаюсь|Yes, I resign
Ничья предложена — ждём ответа|Нічию запропоновано — чекаємо на відповідь|Draw offered — waiting for an answer
Бот отклонил ничью|Бот відхилив нічию|The bot declined the draw
Вы выиграли|Ви виграли|You won
Соперник выиграл|Суперник виграв|The opponent won
Белые выиграли|Білі виграли|White won
Чёрные выиграли|Чорні виграли|Black won
Соперник сдаётся|Суперник здається|The opponent resigns
Вы сдались|Ви здалися|You resigned
Белые сдались|Білі здалися|White resigned
Чёрные сдались|Чорні здалися|Black resigned
Засчитается поражение, сопернику — победа.|Зарахується поразка, суперникові — перемога.|It counts as a loss, and a win for the opponent.
Партия закончится без результата.|Партія завершиться без результату.|The game will end with no result.
Связь с игрой потеряна — ход не ушёл|Зв'язок із грою втрачено — хід не надіслано|Connection to the game is lost — the move was not sent
Вас ждёт партия — доиграть|На вас чекає партія — дограти|A game is waiting for you — finish it
Создаём…|Створюємо…|Creating…
Стол создать не вышло.|Стіл створити не вийшло.|Could not create the table.
Мат: белым некуда деться|Мат: білим нікуди подітися|Checkmate: White has nowhere to go
Мат: чёрным некуда деться|Мат: чорним нікуди подітися|Checkmate: Black has nowhere to go
Пат: белым нечем ходить, а шаха нет|Пат: білим нічим ходити, а шаху немає|Stalemate: White has no move and is not in check
Пат: чёрным нечем ходить, а шаха нет|Пат: чорним нічим ходити, а шаху немає|Stalemate: Black has no move and is not in check
Мата поставить нечем: на доске недостаточно фигур|Мат поставити нічим: на дошці недостатньо фігур|No checkmate is possible: not enough pieces on the board
Одна и та же позиция повторилась три раза|Одна й та сама позиція повторилася тричі|The same position occurred three times
Пятьдесят ходов подряд без взятий и без ходов пешками|П'ятдесят ходів поспіль без взять і без ходів пішаками|Fifty moves in a row with no captures and no pawn moves
Время вышло|Час вийшов|Time is up
Время вышло, а мата поставить нечем — на доске один король|Час вийшов, а мату поставити нічим — на дошці один король|Time is up, but checkmate is impossible — only a king is left on the board
Партия прервана игроком|Партію перервав гравець|The game was stopped by a player
По соглашению|За згодою|By agreement
Ничья по соглашению|Нічия за згодою|Draw by agreement
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
Так эта фигура не ходит|Так ця фігура не ходить|This piece does not move like that
Так не ходят — укажите поле|Так не ходять — вкажіть поле|That is not a legal move — pick a square
Партия уже закончена|Партію вже завершено|The game is already over
В шахматах так не ходят|У шахах так не ходять|That is not how chess works
Сейчас не ваш ход|Зараз не ваш хід|It is not your move
Время вышло — ход не успел|Час вийшов — хід не встиг|Time is up — the move was too late
Этот ход не получился — попробуйте другой|Цей хід не вийшов — спробуйте інший|That move did not work — try another
Здесь пешка не превращается — фигуру выбирать не нужно|Тут пішак не перетворюється — фігуру обирати не треба|The pawn does not promote here — no piece to choose
Пешка дошла до края — выберите фигуру: ферзь, ладья, слон или конь|Пішак дійшов до краю — оберіть фігуру: ферзь, тура, слон або кінь|The pawn reached the edge — choose a piece: queen, rook, bishop or knight
На этом поле нет вашей фигуры|На цьому полі немає вашої фігури|You have no piece on this square
Вам шах — эта фигура от него не спасает|Вам шах — ця фігура від нього не рятує|You are in check — this piece does not save you
Этой фигуре сейчас некуда пойти|Цій фігурі зараз нікуди піти|This piece has nowhere to go right now
Вам шах — такой ход его не снимает|Вам шах — такий хід його не знімає|You are in check — this move does not remove it
Вас нет за этой доской|Вас немає за цією дошкою|You are not at this board
Вы уже предложили ничью — ждём ответа|Ви вже запропонували нічию — чекаємо на відповідь|You already offered a draw — waiting for an answer
Соперник сам предложил ничью — ответьте на его предложение|Суперник сам запропонував нічию — дайте відповідь на його пропозицію|The opponent offered a draw — answer their offer
Ничью никто не предлагал|Нічию ніхто не пропонував|Nobody offered a draw
Это ваше предложение — ответить может соперник|Це ваша пропозиція — відповісти може суперник|This is your offer — only the opponent can answer
Вы играете дальше|Ви граєте далі|You keep playing
Соперник хочет играть дальше|Суперник хоче грати далі|The opponent wants to keep playing
У вас кончилось время|У вас закінчився час|You ran out of time
У соперника кончилось время|У суперника закінчився час|The opponent ran out of time
`;
  /* Склонения, зависящие от числа, ставим готовыми словами: русское слово уже
     определяет форму, поэтому на каждую форму свой шаблон. */
  const победы = [['победа', 'перемога', 'win'], ['победы', 'перемоги', 'wins'], ['побед', 'перемог', 'wins']];
  const ничьи = [['ничья', 'нічия', 'draw'], ['ничьи', 'нічиї', 'draws'], ['ничьих', 'нічиїх', 'draws']];
  const поражения = [['поражение', 'поразка', 'loss'], ['поражения', 'поразки', 'losses'], ['поражений', 'поразок', 'losses']];
  const партии = [['партия', 'партія', 'game'], ['партии', 'партії', 'games'], ['партий', 'партій', 'games']];
  const уровни = [['Лёгкий', 'Легкий', 'Easy'], ['Обычный', 'Звичайний', 'Normal'], ['Сложный', 'Складний', 'Hard']];

  function шаблоныСчёта() {
    const список = [];
    for (const [ruП, ukП, enП] of победы) {
      const строкаП = [['^(\\d+) ' + ruП, '$1 ' + ukП, '$1 ' + enП]];
      // «4 победы», «4 победы, 1 ничья», «4 победы, 2 поражения», «4 победы, 1 ничья, 2 поражения»
      const ниче = [['', '', '']].concat(ничьи.map(([r, u, e]) => [', (\\d+) ' + r, ', $2 ' + u, ', $2 ' + e]));
      for (const [ruН, ukН, enН] of ниче) {
        const поражЧисло = ruН ? '$3' : '$2';
        const поражённые = [['', '', '']].concat(поражения.map(([r, u, e]) => [', (\\d+) ' + r, ', ' + поражЧисло + ' ' + u, ', ' + поражЧисло + ' ' + e]));
        for (const [ruПр, ukПр, enПр] of поражённые) {
          список.push([new RegExp(строкаП[0][0] + ruН + ruПр + '$'), строкаП[0][1] + ukН + ukПр, строкаП[0][2] + enН + enПр]);
        }
      }
    }
    return список;
  }

  const шаблоны = [
    [/^Побед подряд: (\d+)$/, 'Перемог поспіль: $1', 'Winning streak: $1'],
    [/^Побед подряд: (\d+) \(сохранить не удалось\)$/, 'Перемог поспіль: $1 (зберегти не вдалося)', 'Winning streak: $1 (could not save)'],
    [/^Побед подряд: (\d+) — это рекорд!$/, 'Перемог поспіль: $1 — це рекорд!', 'Winning streak: $1 — a record!'],
    [/^Побед подряд: (\d+)\. Лучшая серия: (\d+)$/, 'Перемог поспіль: $1. Найкраща серія: $2', 'Winning streak: $1. Best streak: $2'],
    [/^Ничья серию не прерывает\. Побед подряд: (\d+)$/, 'Нічия серію не перериває. Перемог поспіль: $1', 'A draw does not break the streak. Winning streak: $1'],
    [/^сейчас (\d+)$/, 'зараз $1', 'now $1'],
    [/^Соперник только что отказался\. Предложить снова можно через (\d+) ход$/, 'Суперник щойно відмовився. Запропонувати знову можна через $1 хід', 'The opponent just declined. You can offer again in $1 move'],
    [/^Соперник только что отказался\. Предложить снова можно через (\d+) хода$/, 'Суперник щойно відмовився. Запропонувати знову можна через $1 ходи', 'The opponent just declined. You can offer again in $1 moves'],
    [/^(.+): ход$/, '$1: хід', '$1: move'],
    [/^(.+): взятие$/, '$1: взяття', '$1: capture'],
    [/^(.+) предлагает ничью$/, '$1 пропонує нічию', '$1 offers a draw'],
    [/^(.+) за доской$/, '$1 за дошкою', '$1 is at the board'],
    [/^(.+) больше не играет$/, '$1 більше не грає', '$1 is no longer playing'],
    [/^(.+) слишком долго не на связи — партия закончена$/, '$1 надто довго не на зв\'язку — партію завершено', '$1 has been offline too long — the game is over']
  ];
  for (const [ru, uk, en] of победы) {
    шаблоны.push([new RegExp('^Серия прервалась: было (\\d+) ' + ru + ' подряд$'), 'Серія перервалася: було $1 ' + uk + ' поспіль', 'Streak broken: was $1 ' + en + ' in a row']);
    шаблоны.push([new RegExp('^Лучшая серия: (\\d+) ' + ru + ' подряд$'), 'Найкраща серія: $1 ' + uk + ' поспіль', 'Best streak: $1 ' + en + ' in a row']);
    шаблоны.push([new RegExp('^(\\d+) ' + ru + ' подряд$'), '$1 ' + uk + ' поспіль', '$1 ' + en + ' in a row']);
    for (const [ruУ, ukУ, enУ] of уровни) {
      шаблоны.push([new RegExp('^' + ruУ + ': (\\d+) ' + ru + '$'), ukУ + ': $1 ' + uk, enУ + ': $1 ' + en]);
    }
  }
  for (const [ru, uk, en] of партии) {
    шаблоны.push([new RegExp('^(\\d+) ' + ru + '$'), '$1 ' + uk, '$1 ' + en]);
  }
  шаблоны.push(...шаблоныСчёта());

  Языки.добавить(строки);
  Языки.добавитьШаблоны(шаблоны);
  if (typeof module !== 'undefined' && module.exports) module.exports = { строки, шаблоны };
})(typeof window === 'undefined' ? globalThis : window);
