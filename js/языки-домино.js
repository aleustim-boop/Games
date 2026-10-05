/* Словарь перевода страницы «Домино»: html, домино-экран.js, домино-стол.js,
   домино-кости.js, домино-память.js и серверные фразы server/игры/домино.js.
   Ключ — русская фраза как её видит игрок; строка: русский|українська|English.
   Общие фразы (кнопки, лобби, «Играть онлайн») лежат в js/языки.js. */
(function (корень) {
  'use strict';
  const Языки = typeof module !== 'undefined' && module.exports
    ? require('./языки') : корень.Языки;
  if (!Языки) return;

  const строки = `
Костяшки из слоновой кости на зелёном сукне|Кістки зі слонової кістки на зеленому сукні|Ivory dominoes on green cloth
Разделы игры|Розділи гри|Game sections
Игроков за столом|Гравців за столом|Players at the table
Места за столом|Місця за столом|Seats at the table
Цель партии|Мета партії|Match target
Сила ботов|Сила ботів|Bot strength
Цепь домино|Ланцюг доміно|Domino chain
Ваши кости|Ваші кістки|Your tiles
Адрес сервера|Адреса сервера|Server address
Частые вопросы|Часті запитання|Frequently asked questions
Как играть вдвоём с другом?|Як грати вдвох з другом?|How do I play with a friend?
Сколько игроков?|Скільки гравців?|How many players?
Нужно ли что-то скачивать?|Чи потрібно щось завантажувати?|Do I need to download anything?
Нет. Игра открывается внутри Telegram, отдельное приложение устанавливать не нужно.|Ні. Гра відкривається всередині Telegram, окремий застосунок встановлювати не потрібно.|No. The game opens inside Telegram, no separate app is needed.
Можно ли играть с ботом?|Чи можна грати з ботом?|Can I play against a bot?
Это бесплатно?|Це безкоштовно?|Is it free?
Да, игра бесплатная, в ней нет покупок.|Так, гра безкоштовна, у ній немає покупок.|Yes, the game is free and has no purchases.
Открыть игру в Telegram: @BoardingGames_bot|Відкрити гру в Telegram: @BoardingGames_bot|Open the game in Telegram: @BoardingGames_bot
Указать адрес сервера|Вказати адресу сервера|Set server address
Сохранить адрес|Зберегти адресу|Save address
Стереть вписанный адрес|Стерти вписану адресу|Clear the entered address
Готовим…|Готуємо…|Preparing…
Не вышло|Не вийшло|Didn’t work
Реванш|Реванш|Rematch
Бот|Бот|Bot
Выбрать игрока на место|Вибрати гравця на місце|Choose a player for the seat
один бот|один бот|one bot
два бота|два боти|two bots
три бота|три боти|three bots
Код комнаты|Код кімнати|Room code
Увеличенный стол|Збільшений стіл|Enlarged table
Домино онлайн с друзьями и ботами — бесплатно|Доміно онлайн з друзями та ботами — безкоштовно|Online dominoes with friends and bots — free
Домино онлайн с друзьями в Telegram|Доміно онлайн з друзями в Telegram|Online dominoes with friends in Telegram
Домино — классическая игра с костями, в которой побеждает тот, кто первым наберёт 50, 100 или 150 очков, как выбрано в начале. Играют от двух до четырёх человек, каждый за себя. Играть можно прямо в Telegram: с друзьями по ссылке, со случайными соперниками или с ботами.|Доміно — класична гра з кістками, у якій перемагає той, хто першим набере 50, 100 або 150 очок, як обрано на початку. Грають від двох до чотирьох людей, кожен за себе. Грати можна просто в Telegram: з друзями за посиланням, з випадковими суперниками або з ботами.|Dominoes is a classic tile game won by the first player to reach 50, 100 or 150 points, as chosen at the start. Two to four people play, each for themselves. You can play right in Telegram: with friends via a link, with random opponents or with bots.
Набор состоит из 28 костей. Вдвоём каждому раздают по 7 костей, втроём и вчетвером — по 5. Раунд открывает старший дубль, а если дублей нет — самая тяжёлая кость. Дальше ходят по часовой стрелке: число на конце кости должно совпасть с числом на стыке цепочки. Если подходящей кости нет, нужно брать из базара, то есть из оставшихся костей, а когда базар пуст — пропустить ход. Кто первым выложил все кости, получает сумму очков с костей остальных. Если все пасуют и ходов больше нет, это «рыба»: очки получает игрок с наименьшим остатком.|Набір складається з 28 кісток. Удвох кожному роздають по 7 кісток, утрьох і вчотирьох — по 5. Раунд відкриває старший дубль, а якщо дублів немає — найважча кістка. Далі ходять за годинниковою стрілкою: число на кінці кістки має збігтися з числом на стику ланцюжка. Якщо підхожої кістки немає, треба брати з базару, тобто із залишених кісток, а коли базар порожній — пропустити хід. Хто першим виклав усі кістки, отримує суму очок з кісток решти. Якщо всі пасують і ходів більше немає, це «риба»: очки отримує гравець із найменшим залишком.|The set has 28 tiles. With two players each gets 7 tiles, with three or four — 5. The round opens with the highest double, or the heaviest tile if there are no doubles. Play goes clockwise: the number on the end of the tile must match the number at the chain end. If you have no matching tile, draw from the boneyard — the remaining tiles — and when it is empty, skip your turn. Whoever plays all their tiles first scores the sum of the others’ pips. If everyone passes and no moves remain, it is a “blocked game”: the player with the lowest remainder scores.
Откройте игру в Telegram, выберите «Играть онлайн» и пригласите друга по ссылке. Друг сядет за ваш стол, и партия начнётся.|Відкрийте гру в Telegram, оберіть «Грати онлайн» і запросіть друга за посиланням. Друг сяде за ваш стіл, і партія почнеться.|Open the game in Telegram, choose “Play online” and invite a friend via a link. Your friend sits at your table and the match begins.
От двух до четырёх, каждый играет сам за себя.|Від двох до чотирьох, кожен грає сам за себе.|Two to four, each playing for themselves.
Да, можно играть против ботов и тренироваться в своём темпе.|Так, можна грати проти ботів і тренуватися у своєму темпі.|Yes, you can play against bots and practice at your own pace.
Классическое · 2–4 игрока|Класичне · 2–4 гравці|Classic · 2–4 players
Продолжить партию с ботами|Продовжити партію з ботами|Continue the match with bots
Хороший ход.|Гарний хід.|Nice move.
Отличная компания.|Чудова компанія.|Great company.
Найдите стол или пригласите друзей|Знайдіть стіл або запросіть друзів|Find a table or invite friends
Кости, базар и подсчёт очков|Кістки, базар і підрахунок очок|Tiles, boneyard and scoring
Ваш стол|Ваш стіл|Your table
Соберите свой стол|Зберіть свій стіл|Set up your table
Нажмите свободное место, чтобы посадить бота.|Натисніть вільне місце, щоб посадити бота.|Tap a free seat to add a bot.
Двое|Двоє|Two
Трое|Троє|Three
Четверо|Четверо|Four
До скольких очков?|До скількох очок?|Play to how many points?
50 очков|50 очок|50 points
100 очков|100 очок|100 points
150 очков|150 очок|150 points
Каждый за себя. Боты не видят чужие кости и базар.|Кожен за себе. Боти не бачать чужі кістки й базар.|Everyone for themselves. Bots can’t see others’ tiles or the boneyard.
Увеличить ↗|Збільшити ↗|Enlarge ↗
← Левый конец|← Лівий кінець|← Left end
Правый конец →|Правий кінець →|Right end →
Выберите кость|Оберіть кістку|Choose a tile
Нажмите место, чтобы пригласить друга или посадить бота.|Натисніть місце, щоб запросити друга або посадити бота.|Tap a seat to invite a friend or add a bot.
2–4 игрока · 28 костей · с базаром|2–4 гравці · 28 кісток · з базаром|2–4 players · 28 tiles · with boneyard
Стол появится в онлайн-списке. Друга можно пригласить по коду.|Стіл з’явиться в онлайн-списку. Друга можна запросити за кодом.|The table will appear in the online list. You can invite a friend by code.
Вернуться к игре с другом|Повернутися до гри з другом|Return to the game with a friend
Уже пригласили?|Уже запросили?|Already invited?
Присоединитесь к столу друзей|Приєднайтеся до столу друзів|Join your friends’ table
Ввести код|Ввести код|Enter code
Адрес сервера игры|Адреса сервера гри|Game server address
Классическое домино с базаром: 28 костей, 2–4 игрока, каждый за себя. Вдвоём раздаём по 7 костей, втроём и вчетвером — по 5.|Класичне доміно з базаром: 28 кісток, 2–4 гравці, кожен за себе. Удвох роздаємо по 7 кісток, утрьох і вчотирьох — по 5.|Classic dominoes with a boneyard: 28 tiles, 2–4 players, each for themselves. Two players get 7 tiles each, three or four get 5.
Каждый раунд открывает старший розданный дубль. Если дублей нет — самая тяжёлая кость. Затем ходим по часовой стрелке: числа на стыке должны совпадать. Дубль кладётся поперёк и не даёт ещё одного хода.|Кожен раунд відкриває старший розданий дубль. Якщо дублів немає — найважча кістка. Потім ходимо за годинниковою стрілкою: числа на стику мають збігатися. Дубль кладеться впоперек і не дає ще одного ходу.|Each round opens with the highest double dealt, or the heaviest tile if there are none. Then we play clockwise: numbers at the joint must match. A double is placed crosswise and gives no extra move.
Выберите кость, затем левый или правый конец. Если хода нет — возьмите из базара до первой подходящей кости. Если базар пуст — пасуйте. При наличии хода добор и пас запрещены.|Оберіть кістку, потім лівий або правий кінець. Якщо ходу немає — візьміть із базару до першої підхожої кістки. Якщо базар порожній — пасуйте. Коли хід є, добір і пас заборонені.|Choose a tile, then the left or right end. If you have no move, draw from the boneyard until you get a matching tile. If the boneyard is empty, pass. With a move available, drawing and passing are not allowed.
Кто первым выложит всё, получает сумму точек у остальных. Полный круг пасов — «рыба»: игрок с наименьшим остатком получает сумму остальных минус свой остаток. Если минимум одинаковый — ничья, всем +0. Пустая кость стоит 0.|Хто першим викладе все, отримує суму точок у решти. Повне коло пасів — «риба»: гравець із найменшим залишком отримує суму решти мінус свій залишок. Якщо мінімум однаковий — нічия, усім +0. Порожня кістка коштує 0.|Whoever plays everything first gets the sum of the others’ pips. A full circle of passes is a “blocked game”: the player with the lowest remainder gets the sum of the others minus their own. If the minimum is tied, it’s a draw, everyone gets +0. A blank tile is worth 0.
Побеждает первый, кто набрал выбранные 50, 100 или 150 очков. Базар при подсчёте не учитывается. В нашей версии он добирается полностью, без закрытого остатка.|Перемагає перший, хто набрав обрані 50, 100 або 150 очок. Базар при підрахунку не враховується. У нашій версії він добирається повністю, без закритого залишку.|The first to reach the chosen 50, 100 or 150 points wins. The boneyard is not counted. In our version it is drawn down completely, with no closed remainder.
Все раунды и подсчёт|Усі раунди й підрахунок|All rounds and scoring
Следующий раунд|Наступний раунд|Next round
Посмотреть стол|Переглянути стіл|View table
Сдаться?|Здатися?|Resign?
Партия завершится. Сопернику будет записана победа.|Партія завершиться. Супернику буде записано перемогу.|The match will end. The opponent will be credited with a win.
Да, сдаться|Так, здатися|Yes, resign
Продолжить игру|Продовжити гру|Continue game
Начать новую партию?|Почати нову партію?|Start a new match?
Сохранённая партия с ботами будет заменена.|Збережену партію з ботами буде замінено.|The saved match with bots will be replaced.
Новая партия|Нова партія|New match
Продолжить старую|Продовжити стару|Continue old match
Игровой стол|Ігровий стіл|Game table
Вернуться к игре|Повернутися до гри|Return to the game
Мои партии|Мої партії|My matches
Следующий раунд начнётся через|Наступний раунд почнеться через|The next round starts in
За вас доиграет бот. Вернуться можно в любой момент.|За вас дограє бот. Повернутися можна в будь-який момент.|A bot will finish for you. You can come back at any time.
Партия завершится. Остальным участникам будет записана победа.|Партія завершиться. Решті учасників буде записано перемогу.|The match will end. The other players will be credited with a win.
Вы сдадитесь. Остальным участникам будет записана победа.|Ви здастеся. Решті учасників буде записано перемогу.|You will resign. The other players will be credited with a win.
Вы сдадитесь. Сопернику будет записана победа.|Ви здастеся. Супернику буде записано перемогу.|You will resign. The opponent will be credited with a win.
Игрок|Гравець|Player
Вы победили!|Ви перемогли!|You won!
Партия завершена|Партію завершено|Match finished
Партия прервана без результата.|Партію перервано без результату.|The match was stopped with no result.
Сначала ответьте на голосование|Спочатку дайте відповідь на голосування|Answer the vote first
Идёт голосование…|Триває голосування…|Voting in progress…
Сначала вернитесь в игру|Спочатку поверніться до гри|Return to the game first
Сохранение повреждено. Можно начать новую партию.|Збереження пошкоджено. Можна почати нову партію.|The save is corrupted. You can start a new match.
Браузер запретил сохранение. Не закрывайте текущую партию.|Браузер заборонив збереження. Не закривайте поточну партію.|The browser blocked saving. Don’t close the current match.
Нет связи. Попробуйте ещё раз.|Немає зв’язку. Спробуйте ще раз.|No connection. Try again.
Вы выложили все кости|Ви виклали всі кістки|You played all your tiles
равный минимум, очки не начисляются|рівний мінімум, очки не нараховуються|tied minimum, no points awarded
Соперник зовёт сыграть ещё.|Суперник кличе зіграти ще.|The opponent invites you to play again.
Ждём согласия игроков…|Чекаємо на згоду гравців…|Waiting for the players to agree…
Сыграть ещё|Зіграти ще|Play again
Ждём хозяина стола…|Чекаємо господаря столу…|Waiting for the table host…
слева|зліва|left
справа →|справа →|right →
Начать цепь|Почати ланцюг|Start the chain
Правый конец|Правий кінець|Right end
Раунд завершён|Раунд завершено|Round finished
Ход отправляется|Хід надсилається|Sending move
Очередь по часовой стрелке|Черга за годинниковою стрілкою|Clockwise turn order
Выберите подсвеченный конец на столе|Оберіть підсвічений кінець на столі|Choose the highlighted end on the table
Выберите подходящую кость|Оберіть підхожу кістку|Choose a matching tile
Нет подходящей кости — возьмите из базара|Немає підхожої кістки — візьміть із базару|No matching tile — draw from the boneyard
Нет хода и базар пуст — пасуйте|Ходу немає й базар порожній — пасуйте|No move and the boneyard is empty — pass
Ваша рука|Ваша рука|Your hand
↕ листайте|↕ гортайте|↕ scroll
Результат раунда|Результат раунду|Round result
Ждём хода|Чекаємо ходу|Waiting for a move
Выберите конец на столе|Оберіть кінець на столі|Choose an end on the table
Взять из базара|Взяти з базару|Draw from the boneyard
Здесь появятся завершённые партии с ботами.|Тут з’являться завершені партії з ботами.|Finished matches with bots will appear here.
Нет связи|Немає зв’язку|No connection
ДОМИНО|ДОМІНО|DOMINOES
Ваше место|Ваше місце|Your seat
Для игры нужен хотя бы один соперник|Для гри потрібен принаймні один суперник|You need at least one opponent to play
Создаём стол…|Створюємо стіл…|Creating the table…
Вы и один бот|Ви та один бот|You and one bot
Вы и два бота|Ви та два боти|You and two bots
Вы и три бота|Ви та три боти|You and three bots
каждый за себя|кожен за себе|each for themselves
Здесь начинается цепь|Тут починається ланцюг|The chain starts here
Сохранение повреждено|Збереження пошкоджено|The save is corrupted
Такой ход не принят|Такий хід не прийнято|That move was not accepted
Нужно от двух до четырёх игроков|Потрібно від двох до чотирьох гравців|Two to four players are needed
Партия недоступна|Партія недоступна|The match is unavailable
Ход не разобран|Хід не розпізнано|Move not understood
Следующий раунд начинает хозяин стола|Наступний раунд починає господар столу|The table host starts the next round
Время вышло — ход за вас сделал бот|Час вийшов — хід за вас зробив бот|Time’s up — a bot moved for you
Следующий раунд начался сам|Наступний раунд почався сам|The next round started by itself
Неверный набор костей|Неправильний набір кісток|Wrong tile set
Неверные настройки|Неправильні налаштування|Wrong settings
Неизвестный игрок|Невідомий гравець|Unknown player
Раунд уже завершён|Раунд уже завершено|The round is already over
Сейчас ход другого игрока|Зараз хід іншого гравця|It’s another player’s turn
Эта кость не подходит к выбранному концу|Ця кістка не підходить до обраного кінця|This tile doesn’t fit the chosen end
Есть подходящая кость — сыграйте её|Є підхожа кістка — зіграйте її|You have a matching tile — play it
Базар пуст|Базар порожній|The boneyard is empty
Пасовать нельзя: сыграйте кость или возьмите из базара|Пасувати не можна: зіграйте кістку або візьміть із базару|You can’t pass: play a tile or draw from the boneyard
Новый раунд пока недоступен|Новий раунд поки недоступний|The new round is not available yet
Неизвестное действие|Невідома дія|Unknown action
`;
  Языки.добавить(строки);

  /* Фразы с числами и именами. Имена игроков не меняются: общий перевод
     трогает только «Вы» и «Соперник». Составные строки вида «A · B» общий
     перевод режет по « · » и переводит по частям — шаблоны ниже на части. */
  Языки.добавитьШаблоны([
    [/^Раунд №?(\d+)$/, 'Раунд $1', 'Round $1'],
    [/^до (\d+)$/, 'до $1', 'to $1'],
    [/^(\d+) очков$/, '$1 очок', '$1 points'],
    [/^(\d+) костей$/, '$1 кісток', '$1 tiles'],
    [/^(\d+) места$/, '$1 місця', '$1 seats'],
    [/^(\d+) из (\d+)$/, '$1 з $2', '$1 of $2'],
    [/^Остаток: (\d+)$/, 'Залишок: $1', 'Remainder: $1'],
    [/^Базар: (\d+) костей$/, 'Базар: $1 кісток', 'Boneyard: $1 tiles'],
    [/^наименьший остаток: (.+)$/, 'найменший залишок: $1', 'lowest remainder: $1'],
    [/^Начните с (.+)$/, 'Почніть із $1', 'Start with $1'],
    [/^Ходит (.+)$/, 'Ходить $1', '$1 is playing'],
    [/^Следующий раунд начнётся через (\d+) с$/, 'Наступний раунд почнеться через $1 с', 'The next round starts in $1 s'],
    [/^Игрок (\d+)$/, 'Гравець $1', 'Player $1'],
    [/^(.+): взято (\d+)$/, '$1: взято $2', '$1: drew $2'],
    [/^(.+): пас$/, '$1: пас', '$1: pass'],
    [/^(.+): сдача$/, '$1: здався', '$1: resigned'],
    [/^(.+): все кости выложены$/, '$1: усі кістки викладено', '$1: all tiles played'],
    [/^(.+): сбой хода$/, '$1: збій ходу', '$1: move failed'],
    [/^(.+): время вышло — ход сделал бот$/, '$1: час вийшов — хід зробив бот', '$1: time’s up — a bot moved'],
    [/^(.+) выходит из игры — партию доигрывает бот$/, '$1 виходить із гри — партію дограє бот', '$1 leaves the game — a bot finishes the match'],
    [/^(.+) возвращается за стол — дальше играет вместо бота$/, '$1 повертається за стіл — далі грає замість бота', '$1 returns to the table — plays instead of the bot'],
    [/^Рыба: (.+) \+(\d+) \(всего (\d+)\)$/, 'Риба: $1 +$2 (усього $3)', 'Fish: $1 +$2 (total $3)'],
    [/^Выход: (.+) \+(\d+) \(всего (\d+)\)$/, 'Вихід: $1 +$2 (усього $3)', 'Went out: $1 +$2 (total $3)'],
    [/^(.+) \+(\d+) \(всего (\d+)\)$/, '$1 +$2 (усього $3)', '$1 +$2 (total $3)']
  ]);
})(typeof window === 'undefined' ? globalThis : window);
