/* Словарь перевода страницы «Нарды»: html, нарды-экран.js, нарды-сеть.js,
   нарды-лобби.js и серверные фразы server/игры/нарды.js.
   Ключ — русская фраза как её видит игрок; строка: русский|українська|English.
   Общие фразы (кнопки «Играть», «Закрыть» и т. п.) лежат в общее/js/языки.js. */
(function (корень) {
  'use strict';
  const Языки = typeof module !== 'undefined' && module.exports
    ? require('../../общее/js/языки') : корень.Языки;
  if (!Языки) return;

  const строки = `
нарды|нарди|backgammon
Нарды онлайн с живым соперником|Нарди онлайн із живим суперником|Online backgammon with a live opponent
Нарды онлайн с друзьями в Telegram|Нарди онлайн з друзями в Telegram|Online backgammon with friends in Telegram
Нарды — игра на двоих с кубиками. Каждый играет пятнадцатью шашками и должен провести их все в свой дом, то есть в шесть последних пунктов, а потом вынести с доски. Кто первым вынес все пятнадцать, тот выиграл. В игре есть две версии: короткие и длинные нарды. Играть можно прямо в Telegram: с другом, со случайным соперником, с ботом или вдвоём на одном телефоне.|Нарди — гра для двох із кубиками. Кожен грає п’ятнадцятьма шашками й має провести їх усі до свого дому, тобто на шість останніх пунктів, а потім винести з дошки. Хто першим виніс усі п’ятнадцять, той виграв. У грі є дві версії: короткі й довгі нарди. Грати можна просто в Telegram: з другом, з випадковим суперником, з ботом або вдвох на одному телефоні.|Backgammon is a game for two with dice. Each player has fifteen checkers and must bring them all into their home board, the last six points, and then bear them off the board. Whoever bears off all fifteen first wins. There are two versions: short and long backgammon. You can play right in Telegram: with a friend, with a random opponent, with a bot, or two players on one phone.
В свой ход вы бросаете два кубика и двигаете шашки: на каждом кубике — одна шашка, либо обе цифры одной шашкой. Выпал дубль, то есть одинаковые числа, — ходов будет четыре. В коротких нардах одиночную шашку соперника можно побить: она уходит на середину доски и заходит заново. В длинных нардах бить нельзя, а с головы за ход обычно снимается одна шашка. Игра сама подсвечивает, чем и куда можно пойти.|У свій хід ви кидаєте два кубики й рухаєте шашки: на кожному кубику — одна шашка, або обидві цифри однією шашкою. Випав дубль, тобто однакові числа, — ходів буде чотири. У коротких нардах одиноку шашку суперника можна побити: вона йде на середину дошки й заходить заново. У довгих нардах бити не можна, а з голови за хід зазвичай знімається одна шашка. Гра сама підсвічує, чим і куди можна піти.|On your turn you roll two dice and move checkers: one checker per die, or both numbers with one checker. A double, meaning two equal numbers, gives four moves. In short backgammon a lone opposing checker can be hit: it goes to the middle of the board and re-enters. In long backgammon you cannot hit, and usually only one checker leaves the head per turn. The game highlights what you can move and where.
Частые вопросы|Часті запитання|Frequently asked questions
Как играть вдвоём с другом?|Як грати вдвох з другом?|How do I play with a friend?
Откройте игру в Telegram, создайте партию и отправьте другу ссылку-приглашение или код. Друг войдёт по ней, и партия начнётся. Если вы рядом, можно играть по очереди на одном телефоне.|Відкрийте гру в Telegram, створіть партію й надішліть другові посилання-запрошення або код. Друг увійде за ним, і партія почнеться. Якщо ви поруч, можна грати по черзі на одному телефоні.|Open the game in Telegram, create a match and send your friend an invite link or code. They join with it and the match starts. If you are together, you can take turns on one phone.
Сколько игроков?|Скільки гравців?|How many players?
Двое: вы и соперник. Соперником может быть друг, случайный игрок или бот.|Двоє: ви та суперник. Суперником може бути друг, випадковий гравець або бот.|Two: you and an opponent. The opponent can be a friend, a random player or a bot.
Нужно ли что-то скачивать?|Чи потрібно щось завантажувати?|Do I need to download anything?
Нет. Игра открывается внутри Telegram, отдельное приложение устанавливать не нужно.|Ні. Гра відкривається всередині Telegram, окремий застосунок встановлювати не потрібно.|No. The game opens inside Telegram, no separate app is needed.
Можно ли играть с ботом?|Чи можна грати з ботом?|Can I play against a bot?
Да, есть бот трёх уровней сложности.|Так, є бот трьох рівнів складності.|Yes, there is a bot with three difficulty levels.
Это бесплатно?|Це безкоштовно?|Is it free?
Да, игра бесплатная, в ней нет покупок.|Так, гра безкоштовна, у ній немає покупок.|Yes, the game is free and has no purchases.
Открыть игру в Telegram: @BoardingGames_bot|Відкрити гру в Telegram: @BoardingGames_bot|Open the game in Telegram: @BoardingGames_bot
К выбору игры|До вибору гри|Back to game selection
К лобби|До лобі|Back to lobby
Разделы нард|Розділи нард|Backgammon sections
адрес|адреса|address
Классическая игра для двоих|Класична гра для двох|A classic game for two
Бросок кубиков решает многое|Кидок кубиків вирішує багато|The dice roll matters a lot
Вдвоём на этом устройстве|Удвох на цьому пристрої|Two players on this device
Один телефон на двоих|Один телефон на двох|One phone for two
Версия|Версія|Version
Короткие|Короткі|Short
Длинные|Довгі|Long
Выберите, с кем играть|Оберіть, з ким грати|Choose who to play with
Играть вдвоём|Грати вдвох|Play two-player
на этом устройстве|на цьому пристрої|on this device
Играть с другом|Грати з другом|Play with a friend
онлайн|онлайн|online
Игра с ботом|Гра з ботом|Game with a bot
Вариант|Варіант|Variant
Мастер|Майстер|Master
Лучше вдвоём на этом устройстве|Краще вдвох на цьому пристрої|Better two players on this device
Один создаёт игру и говорит код, второй входит по коду. Играть вдвоём можно, пока включён компьютер того, кто запускает игру.|Один створює гру й каже код, другий входить за кодом. Грати вдвох можна, поки ввімкнений комп’ютер того, хто запускає гру.|One player creates the game and shares the code, the other joins with it. You can play together while the host’s computer is on.
Указать адрес сервера|Вказати адресу сервера|Set server address
Адрес спрашивают у того, кто запустил сервер игры.|Адресу питають у того, хто запустив сервер гри.|Ask for the address from whoever started the game server.
Сохранить адрес|Зберегти адресу|Save address
Стереть вписанный адрес|Стерти вписану адресу|Clear the entered address
В сети|У мережі|Online
Ходят белые|Ходять білі|White to move
Ходят чёрные|Ходять чорні|Black to move
Бросить кубики|Кинути кубики|Roll dice
Отменить ход|Скасувати хід|Undo move
Подтвердить|Підтвердити|Confirm
Сдаться|Здатися|Resign
Вынесено: белые 0 · чёрные 0|Винесено: білі 0 · чорні 0|Borne off: white 0 · black 0
Реванш|Реванш|Rematch
Фон стола|Тло столу|Table background
короткие|короткі|short
длинные|довгі|long
белые|білі|white
чёрные|чорні|black
Белые|Білі|White
Чёрные|Чорні|Black
Выиграли белые|Виграли білі|White wins
Выиграли чёрные|Виграли чорні|Black wins
дерево|дерево|wood
камень|камінь|stone
классика|класика|classic
Варианты сукна скоро появятся|Варіанти сукна незабаром з’являться|More cloth options coming soon
лёгкий бот|легкий бот|easy bot
сложный бот|складний бот|hard bot
мастер бот|майстер-бот|master bot
игра вдвоём|гра вдвох|two players
игра по сети|гра по мережі|online game
Ход отправлен…|Хід надіслано…|Move sent…
Ходит соперник — ждём|Ходить суперник — чекаємо|Opponent is moving — waiting
Бросьте кубики|Киньте кубики|Roll the dice
Ходить нечем — ход переходит сопернику|Ходити нічим — хід переходить до суперника|No moves — the turn passes to the opponent
Ход доигран|Хід зіграно|Move complete
Выберите, куда пойти|Оберіть, куди піти|Choose where to move
Остался один кубик|Залишився один кубик|One die left
Ходов нет — подтвердить|Ходів немає — підтвердити|No moves — confirm
Боту ходить нечем|Боту ходити нічим|The bot has no moves
Сопернику ходить нечем|Супернику ходити нічим|The opponent has no moves
Этим кубиком пойти нельзя: пропадёт второй, а по правилам нужно играть оба|Цим кубиком піти не можна: пропаде другий, а за правилами треба зіграти обидва|You can’t move with this die: the other would be lost, and the rules require playing both
С головы можно снимать одну шашку за ход|З голови можна знімати одну шашку за хід|Only one checker per turn may leave the head
Туда нельзя: пункт занят соперником|Туди не можна: пункт зайнятий суперником|You can’t go there: the point is held by the opponent
Этой шашкой сейчас пойти нельзя|Цією шашкою зараз піти не можна|This checker can’t move right now
Так пойти нельзя|Так піти не можна|You can’t move like that
Так пойти сейчас нельзя|Так піти зараз не можна|You can’t move like that right now
Кубиками сюда не дойти|Кубиками сюди не дійти|The dice can’t reach this point
Это действие игре по сети неизвестно|Ця дія грі по мережі невідома|This action is unknown to the online game
Игра по сети не загрузилась — обновите страницу|Гра по мережі не завантажилась — оновіть сторінку|The online game didn’t load — refresh the page
Связь с игрой потеряна — ход не ушёл|Зв’язок із грою втрачено — хід не пішов|Connection to the game lost — the move wasn’t sent
Ход не удалось отправить|Хід не вдалося надіслати|The move couldn’t be sent
Да, сдаюсь|Так, здаюся|Yes, I resign
Доска пришла испорченной — обновите страницу|Дошка прийшла пошкодженою — оновіть сторінку|The board arrived corrupted — refresh the page
Готовим…|Готуємо…|Preparing…
Не вышло|Не вийшло|Didn’t work
Реванша не будет — вернитесь в меню|Реваншу не буде — поверніться до меню|No rematch — return to the menu
Ждём соперника…|Чекаємо суперника…|Waiting for the opponent…
Соперник хочет реванш|Суперник хоче реванш|The opponent wants a rematch
Не вышло позвать на реванш|Не вдалося покликати на реванш|Couldn’t invite to a rematch
Так сходить не вышло|Так піти не вийшло|That move didn’t work
Выиграли|Виграли|Won
Марс|Марс|Gammon
Кокс|Кокс|Backgammon
Обычная победа|Звичайна перемога|Normal win
Вы выиграли|Ви виграли|You won
Выиграл соперник|Виграв суперник|The opponent won
Соперник сдался|Суперник здався|The opponent resigned
Вы сдались|Ви здалися|You resigned
Засчитается поражение, сопернику — победа.|Зарахується поразка, супернику — перемога.|It counts as a loss for you and a win for the opponent.
Партия закончится без результата.|Партія закінчиться без результату.|The match will end without a result.
Короткие: шашки стоят по четырём местам, одинокую шашку соперника можно сбить — она уходит на середину доски и заходит заново. Это те нарды, которые в мире зовут backgammon.|Короткі: шашки стоять на чотирьох місцях, одиноку шашку суперника можна збити — вона йде на середину дошки й заходить заново. Це ті нарди, які у світі звуть backgammon.|Short: checkers start in four places, a lone opposing checker can be hit — it goes to the middle of the board and re-enters. This is what the world calls backgammon.
Длинные: все пятнадцать шашек стоят в одном углу (на голове), сбивать нельзя вовсе, зато можно запирать соперника стеной. Это русские нарды, их часто зовут классическими.|Довгі: усі п’ятнадцять шашок стоять в одному куті (на голові), збивати не можна взагалі, зате можна замикати суперника стіною. Це російські нарди, їх часто звуть класичними.|Long: all fifteen checkers start in one corner (the head), hitting is not allowed at all, but you can block the opponent with a wall. This is Russian nardy, often called classic.
Правила знает, но играет невнимательно и часто выбирает не лучший ход. С ним хорошо освоиться.|Правила знає, але грає неуважно й часто обирає не найкращий хід. З ним добре освоїтися.|Knows the rules but plays carelessly and often picks a weak move. Good for getting started.
Смотрит на всю доску: гонку, свой дом, стены, а в коротких — ещё и на то, кого можно сбить и кого подставляешь.|Дивиться на всю дошку: перегони, свій дім, стіни, а в коротких — ще й на те, кого можна збити і кого підставляєш.|Looks at the whole board: the race, its home, walls, and in short backgammon also whom it can hit and whom you expose.
Смотрит на все броски соперника вперёд и считает, кого можно сбить, — сильнее «Сложного» в обеих версиях.|Дивиться на всі кидки суперника наперед і рахує, кого можна збити, — сильніший за «Складного» в обох версіях.|Looks ahead at all of the opponent’s rolls and counts whom it can hit — stronger than “Hard” in both versions.
Вас ждёт партия — доиграть|На вас чекає партія — дограти|A match is waiting — finish it
короткие нарды|короткі нарди|short backgammon
длинные нарды|довгі нарди|long backgammon
Как играть в короткие нарды|Як грати в короткі нарди|How to play short backgammon
Как играть в длинные нарды|Як грати в довгі нарди|How to play long backgammon
Цель|Мета|Goal
Провести все пятнадцать своих шашек по доске в свой дом — шесть последних пунктов — и вынести их с доски. Кто вынес все пятнадцать, тот выиграл.|Провести всі п’ятнадцять своїх шашок по дошці до свого дому — шість останніх пунктів — і винести їх з дошки. Хто виніс усі п’ятнадцять, той виграв.|Bring all fifteen of your checkers around the board into your home — the last six points — and bear them off. Whoever bears off all fifteen wins.
Ход|Хід|Move
Бросаете два кубика и двигаете шашки: на одном кубике — одна шашка, или обе цифры одной шашкой. Выпал дубль (одинаковые числа) — ходов четыре. Играть надо столько кубиков, сколько получается; если выходит только один — обязательно старший. Игра сама подсвечивает, чем и куда можно пойти.|Кидаєте два кубики й рухаєте шашки: на одному кубику — одна шашка, або обидві цифри однією шашкою. Випав дубль (однакові числа) — ходів чотири. Грати треба стільки кубиків, скільки виходить; якщо виходить лише один — обов’язково старший. Гра сама підсвічує, чим і куди можна піти.|You roll two dice and move checkers: one checker per die, or both numbers with one checker. A double (equal numbers) gives four moves. You must play as many dice as possible; if only one can be played, it must be the higher. The game highlights what you can move and where.
Бой|Бій|Hitting
Пункт, где стоит одна шашка соперника, можно занять — его шашка уходит на середину доски. Оттуда она заходит заново, и пока она там, остальными ходить нельзя. Пункт, где стоят две шашки соперника и больше, закрыт.|Пункт, де стоїть одна шашка суперника, можна зайняти — його шашка йде на середину дошки. Звідти вона заходить заново, і поки вона там, іншими ходити не можна. Пункт, де стоять дві шашки суперника чи більше, закритий.|You may take a point holding a single opposing checker — that checker goes to the middle of the board. It must re-enter from there, and while it is on the bar you can’t move others. A point with two or more opposing checkers is blocked.
Голова и стена|Голова і стіна|Head and wall
Сбивать нельзя вовсе: пункт, где стоит хоть одна шашка соперника, закрыт. За ход с головы — с того пункта, где стоят все пятнадцать, — уходит одна шашка. Только на первом ходу при дублях 6-6, 4-4 и 3-3 можно снять две. Занять шесть пунктов подряд можно, но не тогда, когда впереди этой стены нет ни одной шашки соперника: запирать все пятнадцать нельзя.|Збивати не можна взагалі: пункт, де стоїть бодай одна шашка суперника, закритий. За хід з голови — з того пункту, де стоять усі п’ятнадцять, — іде одна шашка. Лише на першому ході при дублях 6-6, 4-4 і 3-3 можна зняти дві. Зайняти шість пунктів поспіль можна, але не тоді, коли попереду цієї стіни немає жодної шашки суперника: замикати всі п’ятнадцять не можна.|Hitting is not allowed: a point with even one opposing checker is blocked. Only one checker leaves the head per turn — the point where all fifteen stand. Only on the first move with doubles 6-6, 4-4 and 3-3 may two leave. You may hold six points in a row, but not if no opposing checker is ahead of the wall: blocking all fifteen is forbidden.
Вынос|Виведення|Bearing off
Когда все пятнадцать ваших шашек дошли до дома, их можно снимать с доски: на кубике столько же, сколько до края, — снимаете. Если кубик больше, чем нужно, снимается самая дальняя шашка. Чтобы вынести, нажмите на свою полку под доской.|Коли всі п’ятнадцять ваших шашок дійшли до дому, їх можна знімати з дошки: на кубику стільки ж, скільки до краю, — знімаєте. Якщо кубик більший, ніж треба, знімається найдальша шашка. Щоб винести, натисніть на свою полицю під дошкою.|When all fifteen of your checkers reach home, you can take them off: if a die equals the distance to the edge, you bear off. If the die is higher than needed, the farthest checker is taken. To bear off, tap your tray under the board.
Счёт|Рахунок|Score
Обычная победа — 1 очко. Марс (соперник не вынес ни одной шашки) — 2 очка. Кокс (не вынес ни одной и застрял на середине доски или в вашем доме) — 3 очка.|Звичайна перемога — 1 бал. Марс (суперник не виніс жодної шашки) — 2 бали. Кокс (не виніс жодної й застряг на середині дошки або у вашому домі) — 3 бали.|A normal win is 1 point. Gammon (the opponent bore off no checkers) is 2 points. Backgammon (none borne off and stuck on the bar or in your home) is 3 points.
Обычная победа — 1 очко. Марс (соперник не вынес ни одной шашки) — 2 очка. Кокса в длинных нардах не бывает.|Звичайна перемога — 1 бал. Марс (суперник не виніс жодної шашки) — 2 бали. Кокса в довгих нардах не буває.|A normal win is 1 point. Gammon (the opponent bore off no checkers) is 2 points. There is no backgammon in long backgammon.
Партия уже закончена|Партія вже закінчена|The match is already over
В нардах так не ходят|У нардах так не ходять|That move is not allowed in backgammon
Вас нет за этой доской|Вас немає за цією дошкою|You are not at this board
Сейчас не ваш ход|Зараз не ваш хід|It’s not your turn
Кубики уже брошены — теперь ваш ход|Кубики вже кинуто — тепер ваш хід|The dice are already rolled — it’s your move
Бросать сейчас нельзя|Кидати зараз не можна|You can’t roll right now
Сначала бросьте кубики|Спочатку киньте кубики|Roll the dice first
Ход не понят: нужен список перемещений «откуда-куда»|Хід не зрозуміло: потрібен список переміщень «звідки-куди»|Move not understood: a list of “from-to” moves is needed
Ходить есть чем — пропустить ход нельзя|Ходити є чим — пропустити хід не можна|You have moves — you can’t skip your turn
Ход не доигран: сыграть надо столько кубиков, сколько получается|Хід не дограно: зіграти треба стільки кубиків, скільки виходить|Move unfinished: you must play as many dice as possible
На баре у вас нет шашек|На барі у вас немає шашок|You have no checkers on the bar
С бара сейчас ходить нельзя|З бару зараз ходити не можна|You can’t move from the bar right now
С бара сюда не зайти — этот пункт занят соперником|З бару сюди не зайти — цей пункт зайнятий суперником|You can’t enter here from the bar — this point is held by the opponent
Сначала введите шашку с бара — другими ходить нельзя|Спочатку введіть шашку з бару — іншими ходити не можна|Enter the checker from the bar first — you can’t move others
На этом пункте шашек нет|На цьому пункті шашок немає|There are no checkers on this point
Это шашка соперника — ходить можно только своими|Це шашка суперника — ходити можна лише своїми|That’s the opponent’s checker — you can only move your own
Этой шашкой сейчас ходить нельзя|Цією шашкою зараз ходити не можна|This checker can’t move right now
Так эта шашка не ходит|Так ця шашка не ходить|This checker doesn’t move that way
`;
  Языки.добавить(строки);

  /* Фразы с числами и именами. Имена игроков не меняются: общий перевод
     трогает только «Вы» и «Соперник». */
  Языки.добавитьШаблоны([
    [/^Вынесено: белые (\d+)$/, 'Винесено: білі $1', 'Borne off: white $1'],
    [/^чёрные (\d+)$/, 'чорні $1', 'black $1'],
    [/^Осталось кубиков: (\d+)$/, 'Залишилося кубиків: $1', 'Dice left: $1'],
    [/^Обычная победа — (\d+) очк(?:о|а|ов)$/, 'Звичайна перемога — $1 б.', 'Normal win — $1 pt'],
    [/^Победа по сдаче — (\d+) очк(?:о|а|ов)$/, 'Перемога через здачу — $1 б.', 'Win by resignation — $1 pt'],
    [/^Фон стола «(.+)»$/, 'Тло столу «$1»', 'Table background “$1”'],
    [/^Играть надо старшим кубиком — (\d+), с бара так не выйдет$/, 'Грати треба старшим кубиком — $1, з бару так не вийде', 'You must play the higher die — $1, you can’t move like that from the bar'],
    [/^Играть надо старшим кубиком — (\d+), этой шашкой так не выйдет$/, 'Грати треба старшим кубиком — $1, цією шашкою так не вийде', 'You must play the higher die — $1, this checker can’t do that'],
    [/^(.+): бросок кубиков$/, '$1: кидок кубиків', '$1: dice roll'],
    [/^(.+): ходить нечем, ход переходит$/, '$1: ходити нічим, хід переходить', '$1: no moves, the turn passes'],
    [/^(.+): ход$/, '$1: хід', '$1: move'],
    [/^(.+) за доской$/, '$1 за дошкою', '$1 is at the board'],
    [/^(.+) больше не играет$/, '$1 більше не грає', '$1 is no longer playing'],
    [/^(.+) слишком долго не на связи — партия закончена$/, '$1 надто довго не на зв’язку — партію завершено', '$1 was offline too long — the match is over']
  ]);
})(typeof window === 'undefined' ? globalThis : window);
