/* Словарь страницы «Катан»: html, экран, поле, правила, лобби и тексты сервера.
   Ключ — русская фраза как её видит игрок; строка «русский|українська|English».
   Фразы с именами и числами — шаблонами ниже. Проверка: tests/языки-катан.js. */
(function (корень) {
  'use strict';
  const Языки = typeof module !== 'undefined' && module.exports ? require('./языки') : корень.Языки;
  const строки = `
Поле Катана: гексы ресурсов, деревянные поселения, дороги и кубики|Поле Катану: гекси ресурсів, дерев'яні поселення, дороги й кубики|Catan board: resource hexes, wooden settlements, roads and dice
Разделы игры|Розділи гри|Game sections
Количество игроков|Кількість гравців|Number of players
Сложность|Складність|Difficulty
ПО — победные очки|ПО — переможні очки|VP — victory points
Остров: стройте на подсвеченных местах|Острів: будуйте на підсвічених місцях|Island: build on the highlighted spots
Увеличить поле|Збільшити поле|Enlarge the board
Ваши ресурсы|Ваші ресурси|Your resources
Игроков онлайн|Гравців онлайн|Players online
Адрес сервера|Адреса сервера|Server address
Код комнаты|Код кімнати|Room code
Катан онлайн с друзьями — бесплатно в Telegram|Катан онлайн із друзями — безкоштовно в Telegram|Play Catan online with friends — free in Telegram
Создайте остров, за который стоит побороться.|Створіть острів, за який варто поборотися.|Create an island worth fighting for.
Продолжить партию с ботами|Продовжити партію з ботами|Continue the game with bots
ОТ ПЕРВОГО ПОСЕЛЕНИЯ|ВІД ПЕРШОГО ПОСЕЛЕННЯ|FROM THE FIRST SETTLEMENT
к целому миру.|до цілого світу.|to a whole world.
10 очков до победы|10 очок до перемоги|10 points to win
Найдите стол или пригласите друзей|Знайдіть стіл або запросіть друзів|Find a table or invite friends
Свой остров и свой темп|Свій острів і свій темп|Your own island and your own pace
КАТАН · С БОТАМИ|КАТАН · З БОТАМИ|CATAN · VS BOTS
Ваш стол|Ваш стіл|Your table
Выберите компанию и силу соперников.|Оберіть компанію й силу суперників.|Choose your company and the strength of your opponents.
Кто за столом?|Хто за столом?|Who is at the table?
Сила соперников|Сила суперників|Opponent strength
Классические правила|Класичні правила|Classic rules
До 10 очков|До 10 очок|Up to 10 points
Увеличить ↗|Збільшити ↗|Enlarge ↗
Вид поля|Вигляд поля|Board view
История ходов|Історія ходів|Move history
1. Поселение|1. Поселення|1. Settlement
2. Дорога|2. Дорога|2. Road
Строить|Будувати|Build
Торговля|Торгівля|Trade
Развитие|Розвиток|Development
Бросить кубики|Кинути кубики|Roll the dice
Отменить выбор|Скасувати вибір|Cancel selection
↶ Отменить ход|↶ Скасувати хід|↶ Undo move
КАТАН · ОНЛАЙН|КАТАН · ОНЛАЙН|CATAN · ONLINE
Пригласите друзей, посадите ботов на свободные места.|Запросіть друзів, посадіть ботів на вільні місця.|Invite friends and seat bots in the free spots.
Создать стол|Створити стіл|Create a table
Вернуться к игре|Повернутися до гри|Back to the game
Уже пригласили?|Уже запросили?|Already invited?
Присоединитесь к столу друзей|Приєднайтеся до столу друзів|Join your friends' table
Ввести код|Ввести код|Enter code
Указать адрес сервера|Вказати адресу сервера|Set server address
Адрес сервера игры|Адреса сервера гри|Game server address
Сохранить адрес|Зберегти адресу|Save address
Стереть вписанный адрес|Стерти вписану адресу|Clear the entered address
Начать новую партию?|Почати нову партію?|Start a new game?
Сохранённая партия будет заменена.|Збережену партію буде замінено.|The saved game will be replaced.
Начать новую|Почати нову|Start new
Продолжить прежнюю|Продовжити попередню|Continue the old one
Мои результаты|Мої результати|My results
Не удалось собрать остров|Не вдалося зібрати острів|Could not build the island
Нужно 3 или 4 игрока|Потрібно 3 або 4 гравці|3 or 4 players needed
Защищённая случайность доступна на сервере|Захищена випадковість доступна на сервері|Secure randomness is available on the server
Не хватает ресурсов|Не вистачає ресурсів|Not enough resources
Партия недоступна|Партія недоступна|The game is unavailable
Неизвестное действие|Невідома дія|Unknown action
Поиск ресурса уже недоступен|Пошук ресурсу вже недоступний|Resource search is no longer available
Предложите искомый ресурс и укажите цену|Запропонуйте шуканий ресурс і вкажіть ціну|Offer the wanted resource and set a price
У вас нет предложенных ресурсов|У вас немає запропонованих ресурсів|You do not have the offered resources
Предложение уже недоступно|Пропозиція вже недоступна|The offer is no longer available
Ресурсы для обмена изменились|Ресурси для обміну змінилися|The resources for the trade have changed
Ваш ответ уже недоступен|Ваша відповідь уже недоступна|Your answer is no longer available
Выберите согласившегося игрока|Оберіть гравця, що погодився|Choose the player who agreed
Условия обмена изменились. Выберите вариант заново|Умови обміну змінилися. Оберіть варіант заново|The trade terms have changed. Choose an option again
Обмен доступен после броска|Обмін доступний після кидка|Trading is available after the roll
Обмен только с активным игроком|Обмін лише з активним гравцем|Trade only with the active player
Выберите разные ресурсы с обеих сторон|Оберіть різні ресурси з обох боків|Choose different resources on both sides
Нельзя отменить чужой обмен|Не можна скасувати чужий обмін|You cannot cancel someone else's trade
Вам не нужно сбрасывать карты|Вам не потрібно скидати карти|You do not need to discard cards
Выберите ровно половину ресурсов|Оберіть рівно половину ресурсів|Choose exactly half of your resources
Сейчас ход другого игрока|Зараз хід іншого гравця|It is another player's turn
Выберите свободное перекрестье с соблюдением расстояния|Оберіть вільне перехрестя з дотриманням відстані|Choose a free intersection that respects the distance rule
Дорога должна идти от нового поселения|Дорога має йти від нового поселення|The road must start from the new settlement
Можно сыграть одну карту развития за ход|Можна зіграти одну карту розвитку за хід|You may play one development card per turn
Эта карта пока недоступна|Ця карта поки недоступна|This card is not available yet
Выберите два доступных ресурса|Оберіть два доступні ресурси|Choose two available resources
Выберите ресурс|Оберіть ресурс|Choose a resource
Нет места для дороги|Немає місця для дороги|No room for a road
Выберите доступный гекс: дружелюбный разбойник не блокирует игроков с 2 очками|Оберіть доступний гекс: дружній розбійник не блокує гравців із 2 очками|Choose an available hex: the friendly robber does not block players with 2 points
Выберите соседа разбойника|Оберіть сусіда розбійника|Choose a neighbor of the robber
Выберите свободный участок своей дороги|Оберіть вільну ділянку своєї дороги|Choose a free segment of your road
Кубики уже брошены|Кубики вже кинуто|The dice have already been rolled
Сначала завершите текущее действие|Спершу завершіть поточну дію|Finish the current action first
Выберите разные ресурсы|Оберіть різні ресурси|Choose different resources
Обмен недоступен|Обмін недоступний|Trading is unavailable
Здесь нельзя построить дорогу|Тут не можна побудувати дорогу|You cannot build a road here
Здесь нельзя построить поселение|Тут не можна побудувати поселення|You cannot build a settlement here
Город заменяет ваше поселение|Місто замінює ваше поселення|The city replaces your settlement
Карты развития закончились|Карти розвитку закінчилися|The development cards have run out
Это действие уже нельзя отменить|Цю дію вже не можна скасувати|This action can no longer be undone
Игрок не найден|Гравця не знайдено|Player not found
Лес — дерево|Ліс — деревина|Forest — lumber
Холмы — глина|Пагорби — глина|Hills — brick
Пастбище — шерсть|Пасовище — вовна|Pasture — wool
Поля — зерно|Поля — зерно|Fields — grain
Горы — руда|Гори — руда|Mountains — ore
Пустыня|Пустеля|Desert
· заблокировано разбойником|· заблоковано розбійником|· blocked by the robber
Порт: любые три одинаковых ресурса за один|Порт: будь-які три однакових ресурси за один|Port: any three identical resources for one
Построить дорогу|Побудувати дорогу|Build a road
Порт:|Порт:|Port:
Разбойник: производство заблокировано|Розбійник: виробництво заблоковано|Robber: production blocked
−1 карта|−1 карта|−1 card
+1 карта|+1 карта|+1 card
Сохранение повреждено|Збереження пошкоджено|The save is damaged
Неизвестная версия правил|Невідома версія правил|Unknown rules version
Дерево|Деревина|Lumber
Глина|Глина|Brick
Шерсть|Вовна|Wool
Зерно|Зерно|Grain
Руда|Руда|Ore
Дорога|Дорога|Road
Поселение|Поселення|Settlement
Город|Місто|City
Рыцарь|Лицар|Knight
Строительство дорог|Будівництво доріг|Road Building
Изобилие|Достаток|Year of Plenty
Победное очко|Переможне очко|Victory point
Переместите разбойника и заберите случайный ресурс у соседа.|Перемістіть розбійника й заберіть випадковий ресурс у сусіда.|Move the robber and take a random resource from a neighbor.
Постройте две дороги бесплатно.|Побудуйте дві дороги безкоштовно.|Build two roads for free.
Возьмите два ресурса из банка.|Візьміть два ресурси з банку.|Take two resources from the bank.
Заберите у соперников все ресурсы выбранного вида.|Заберіть у суперників усі ресурси обраного виду.|Take all resources of the chosen type from your opponents.
Скрытое победное очко. Учитывается автоматически в ваш ход.|Приховане переможне очко. Враховується автоматично у ваш хід.|A hidden victory point. Counted automatically on your turn.
Настройки поля|Налаштування поля|Board settings
Яркость ландшафта|Яскравість ландшафту|Landscape brightness
Приглушённый|Приглушений|Muted
Средний|Середній|Medium
Яркий|Яскравий|Bright
Выделить на поле|Виділити на полі|Highlight on the board
Все земли|Усі землі|All lands
Последний бросок|Останній кидок|Last roll
Мои земли|Мої землі|My lands
Вероятности на жетонах|Імовірності на жетонах|Probabilities on tokens
Анимация броска|Анімація кидка|Roll animation
Темп ботов в одиночной игре|Темп ботів в одиночній грі|Bot pace in single player
Спокойный|Спокійний|Calm
Медленный|Повільний|Slow
Ресурсы игрокам|Ресурси гравцям|Resources for players
Улучшить это поселение до города?|Покращити це поселення до міста?|Upgrade this settlement to a city?
Построить здесь|Побудувати тут|Build here
дорогу?|дорогу?|a road?
поселение?|поселення?|a settlement?
Стоимость:|Вартість:|Cost:
Построить|Побудувати|Build
Что построим?|Що будуватимемо?|What shall we build?
Выберите постройку. Затем укажите подсвеченное место на острове.|Оберіть споруду. Потім вкажіть підсвічене місце на острові.|Choose a building. Then pick a highlighted spot on the island.
Бросок кубиков|Кидок кубиків|Dice roll
Вы бросаете кубики|Ви кидаєте кубики|You are rolling the dice
бросает кубики|кидає кубики|rolls the dice
Часть графики не загрузилась. Проверьте соединение и обновите страницу.|Частина графіки не завантажилась. Перевірте з'єднання й оновіть сторінку.|Some graphics did not load. Check your connection and refresh the page.
Цвет ваших фишек|Колір ваших фішок|Your piece color
Цвет фишек|Колір фішок|Piece color
Розовый|Рожевий|Pink
Синий|Синій|Blue
Слоновая кость|Слонова кістка|Ivory
Оранжевый|Помаранчевий|Orange
Зелёный|Зелений|Green
Коричневый|Коричневий|Brown
Жёлтый|Жовтий|Yellow
Красный|Червоний|Red
Личная палитра поля. У каждого игрока остаётся свой отдельный цвет.|Особиста палітра поля. У кожного гравця лишається свій окремий колір.|Your personal board palette. Each player keeps their own color.
ПРАВИЛА ВАШЕГО ОСТРОВА|ПРАВИЛА ВАШОГО ОСТРОВА|YOUR ISLAND RULES
Как будем играть?|Як гратимемо?|How shall we play?
Дружелюбный разбойник|Дружній розбійник|Friendly robber
Рыцаря играть можно. Игроки с 2 открытыми ПО защищены от блокировки и кражи.|Лицаря грати можна. Гравці з 2 відкритими ПО захищені від блокування й крадіжки.|You may play a knight. Players with 2 open VP are protected from blocking and stealing.
Мягкий старт|М'який старт|Soft start
Семёрки перебрасываются в первые два хода каждого игрока.|Сімки перекидаються в перші два ходи кожного гравця.|Sevens are rerolled in each player's first two turns.
Гавани|Гавані|Harbors
Закреплённые — классическая схема. Случайные — типы гаваней перемешиваются перед партией.|Закріплені — класична схема. Випадкові — типи гаваней перемішуються перед партією.|Fixed — the classic layout. Random — harbor types are shuffled before the game.
Закреплённые|Закріплені|Fixed
Случайные|Випадкові|Random
По истечении времени ход завершается; обязательные действия выполняются автоматически.|Коли час спливає, хід завершується; обов'язкові дії виконуються автоматично.|When time runs out the turn ends; mandatory actions are done automatically.
1 минута|1 хвилина|1 minute
2 минуты|2 хвилини|2 minutes
3 минуты|3 хвилини|3 minutes
Вид поля и анимации|Вигляд поля й анімації|Board view and animations
Сохранение повреждено. Начните новую партию.|Збереження пошкоджено. Почніть нову партію.|The save is damaged. Start a new game.
Не удалось сохранить партию в этом браузере.|Не вдалося зберегти партію в цьому браузері.|Could not save the game in this browser.
Готово ↙|Готово ↙|Done ↙
Вернуть обычный размер поля|Повернути звичайний розмір поля|Restore the normal board size
Время хода истекло|Час ходу вичерпано|Turn time is up
Нет связи. Повторите ход.|Немає зв'язку. Повторіть хід.|No connection. Repeat the move.
Ошибка хода бота:|Помилка ходу бота:|Bot move error:
Поставьте поселение на подсвеченное перекрестье|Поставте поселення на підсвічене перехрестя|Place a settlement on a highlighted intersection
Проложите дорогу от нового поселения|Прокладіть дорогу від нового поселення|Lay a road from the new settlement
Бросьте кубики, чтобы получить ресурсы|Киньте кубики, щоб отримати ресурси|Roll the dice to get resources
Стройте, обменивайтесь или завершите ход|Будуйте, обмінюйтеся або завершіть хід|Build, trade or end your turn
Сбросьте половину ресурсов|Скиньте половину ресурсів|Discard half of your resources
Выберите другой гекс для разбойника|Оберіть інший гекс для розбійника|Choose another hex for the robber
Выберите, у кого забрать ресурс|Оберіть, у кого забрати ресурс|Choose whom to take a resource from
Проложите бесплатную дорогу|Прокладіть безкоштовну дорогу|Lay a free road
Партия завершена|Партію завершено|The game is over
перемещает разбойника|переміщує розбійника|moves the robber
Ресурсы в руке|Ресурси в руці|Resources in hand
Карты развития в руке|Карти розвитку в руці|Development cards in hand
Сыгранные рыцари|Зіграні лицарі|Knights played
Самая длинная непрерывная дорога|Найдовша безперервна дорога|Longest continuous road
Поселения на поле|Поселення на полі|Settlements on the board
Города на поле|Міста на полі|Cities on the board
Самая длинная дорога: +2 ПО|Найдовша дорога: +2 ПО|Longest Road: +2 VP
Самая большая армия: +2 ПО|Найбільше військо: +2 ПО|Largest Army: +2 VP
Соперник думает|Суперник думає|The opponent is thinking
● Ваш ход|● Ваш хід|● Your turn
Сбрасывает карты|Скидає карти|Discarding cards
Думает…|Думає…|Thinking…
Победные карты: скрыто от соперников|Переможні карти: приховано від суперників|Victory cards: hidden from opponents
Переместить сюда|Перемістити сюди|Move here
Кубики ещё не брошены|Кубики ще не кинуто|The dice have not been rolled yet
Украдена 1 карта · постройка сохраняется|Вкрадено 1 карту · споруда зберігається|1 card stolen · the building stays
Выбирает место для поселения|Обирає місце для поселення|Choosing a spot for a settlement
Прокладывает дорогу|Прокладає дорогу|Laying a road
Готовится бросить кубики|Готується кинути кубики|Getting ready to roll the dice
Строит и обменивается|Будує й обмінюється|Building and trading
Ждём сброса ресурсов|Чекаємо скидання ресурсів|Waiting for resources to be discarded
Перемещает разбойника|Переміщує розбійника|Moving the robber
Выбирает соперника|Обирає суперника|Choosing an opponent
Прокладывает бесплатную дорогу|Прокладає безкоштовну дорогу|Laying a free road
Ресурс у:|Ресурс у:|Resource from:
Забрать ресурс не у кого.|Забрати ресурс ні в кого.|There is no one to take a resource from.
Блокирует и ваши постройки.|Блокує й ваші споруди.|It also blocks your buildings.
Выберите первое поселение|Оберіть перше поселення|Choose your first settlement
Не хватает:|Не вистачає:|Missing:
Колода развития закончилась.|Колода розвитку закінчилася.|The development deck has run out.
Нет доступного места или закончились фигуры этого типа.|Немає доступного місця або закінчилися фігури цього типу.|No spot available, or this type of piece has run out.
Вернуть последнее действие:|Скасувати останню дію:|Undo the last action:
обмен с банком|обмін із банком|bank trade
Доступно после своего строительства или обмена с банком, до следующего действия|Доступно після власного будівництва або обміну з банком, до наступної дії|Available after your own building or a bank trade, until the next action
Результаты|Результати|Results
Перемещаем разбойника…|Переміщуємо розбійника…|Moving the robber…
Атака разбойника…|Атака розбійника…|Robber attack…
Смотрим бросок…|Дивимося кидок…|Watching the roll…
Проложить дорогу|Прокласти дорогу|Lay a road
Поставить поселение|Поставити поселення|Place a settlement
Построить город|Побудувати місто|Build a city
Переместить разбойника|Перемістити розбійника|Move the robber
Выбрать соперника|Обрати суперника|Choose an opponent
Завершить ход|Завершити хід|End turn
Выберите место|Оберіть місце|Choose a spot
Ждём хода|Чекаємо ходу|Waiting for the turn
У кого забрать ресурс?|У кого забрати ресурс?|Whom to take a resource from?
Разбойник уже на выбранной соте. Нажмите игрока, у которого хотите забрать случайную карту.|Розбійник уже на обраному гексі. Натисніть гравця, у якого хочете забрати випадкову карту.|The robber is already on the chosen hex. Tap the player you want to take a random card from.
карт ресурсов|карт ресурсів|resource cards
Забрать ресурс у|Забрати ресурс у|Take a resource from
Посмотреть поле|Подивитися поле|View the board
Подтвердить|Підтвердити|Confirm
· можно подтвердить|· можна підтвердити|· can confirm
Получить карты|Отримати карти|Get the cards
Ресурс сейчас недоступен|Ресурс зараз недоступний|The resource is not available now
Нажимайте на карты, которые хотите сбросить. «Вернуть 1» отменяет выбор одной карты.|Натискайте на карти, які хочете скинути. «Повернути 1» скасовує вибір однієї карти.|Tap the cards you want to discard. "Return 1" undoes the choice of one card.
Нажимайте на нужные ресурсы.|Натискайте на потрібні ресурси.|Tap the resources you need.
Вернуть 1|Повернути 1|Return 1
Убрать 1|Прибрати 1|Remove 1
Вернуть:|Повернути:|Return:
Сбросить выбор|Скинути вибір|Reset choice
Поселения|Поселення|Settlements
Города|Міста|Cities
Самая длинная дорога|Найдовша дорога|Longest Road
Самая большая армия|Найбільше військо|Largest Army
Ваши скрытые победные очки|Ваші приховані переможні очки|Your hidden victory points
Карты победных очков|Карти переможних очок|Victory point cards
Победные карты соперника скрыты и не входят в его видимый счёт до конца партии.|Переможні карти суперника приховані й не входять до його видимого рахунку до кінця партії.|The opponent's victory cards are hidden and not part of their visible score until the game ends.
Поселение у такого гекса получает 1 карту, город — 2. Это работает на бросках всех игроков. Гекс с разбойником не производит ресурсов.|Поселення біля такого гекса отримує 1 карту, місто — 2. Це працює на кидках усіх гравців. Гекс із розбійником не виробляє ресурсів.|A settlement next to this hex gets 1 card, a city gets 2. This works on every player's roll. The hex with the robber produces nothing.
Ваша новая карта|Ваша нова карта|Your new card
Добавляет 1 победное очко сразу. Разыгрывать её не нужно; до конца партии соперники не видят это очко.|Одразу додає 1 переможне очко. Розігрувати її не потрібно; до кінця партії суперники не бачать це очко.|Adds 1 victory point right away. You do not need to play it; opponents cannot see this point until the game ends.
Можно разыграть со следующего вашего хода, до или после броска кубиков. За ход разрешена одна карта развития.|Можна розіграти з вашого наступного ходу, до або після кидка кубиків. За хід дозволена одна карта розвитку.|Can be played from your next turn, before or after rolling the dice. One development card is allowed per turn.
Три сыгранных рыцаря могут принести «Самую большую армию» и 2 победных очка.|Три зіграні лицарі можуть принести «Найбільше військо» і 2 переможні очки.|Three played knights can earn "Largest Army" and 2 victory points.
Эта карта принесла вам победу!|Ця карта принесла вам перемогу!|This card won you the game!
Посмотреть результат|Подивитися результат|View the result
В мои карты|До моїх карт|To my cards
Ваш бонус: +2 ПО|Ваш бонус: +2 ПО|Your bonus: +2 VP
получает +2 ПО|отримує +2 ПО|gets +2 VP
Бонус больше не принадлежит игроку|Бонус більше не належить гравцеві|The bonus no longer belongs to the player
Рыцарь — самая большая армия|Лицар — найбільше військо|Knight — Largest Army
Вы получаете|Ви отримуєте|You get
2 победных очка. Они уже учтены в счёте.|2 переможні очки. Їх уже враховано в рахунку.|2 victory points. They are already counted in the score.
теряет 2 победных очка.|втрачає 2 переможні очки.|loses 2 victory points.
Вы теряете|Ви втрачаєте|You lose
этот бонус и 2 очка.|цей бонус і 2 очки.|this bonus and 2 points.
играет карту|грає карту|plays a card
Выбран ресурс:|Обрано ресурс:|Chosen resource:
забирает у остальных игроков все карты этого ресурса.|забирає в решти гравців усі карти цього ресурсу.|takes all cards of this resource from the other players.
Выбранный ресурс не записан в этом событии.|Обраний ресурс не записано в цій події.|The chosen resource is not recorded in this event.
Атака:|Атака:|Attack:
Разбойник перемещён|Розбійника переміщено|The robber has been moved
переместил разбойника. Ресурс не украден: на этой соте нет доступной жертвы.|перемістив розбійника. Ресурс не вкрадено: на цьому гексі немає доступної жертви.|moved the robber. Nothing was stolen: there is no available victim on this hex.
Украдена 1 карта|Вкрадено 1 карту|1 card stolen
забрал 1 карту ресурса у|забрав 1 карту ресурсу в|took 1 resource card from
У вас украли ресурс|У вас вкрали ресурс|A resource was stolen from you
Вы получили ресурс|Ви отримали ресурс|You received a resource
забрал у вас 1 ресурс. Карта уже убрана из вашей руки.|забрав у вас 1 ресурс. Карту вже прибрано з вашої руки.|took 1 resource from you. The card has already been removed from your hand.
Разбойник забрал 1 ресурс у|Розбійник забрав 1 ресурс у|The robber took 1 resource from
В мою руку|До моєї руки|To my hand
Получил карту|Отримав карту|Received a card
Потерял карту|Втратив карту|Lost a card
Карты развития|Карти розвитку|Development cards
Купить карту развития|Купити карту розвитку|Buy a development card
Покупка доступна в ваш ход после броска кубиков.|Купівля доступна у ваш хід після кидка кубиків.|Buying is available on your turn after the dice roll.
Не хватает ресурсов:|Не вистачає ресурсів:|Missing resources:
Ваша рука|Ваша рука|Your hand
Пока нет карт. Рыцарь, дороги, изобилие, монополия или победное очко — какая карта придёт вам?|Поки немає карт. Лицар, дороги, достаток, монополія або переможне очко — яка карта прийде вам?|No cards yet. Knight, roads, plenty, monopoly or a victory point — which card will you get?
Доступна со следующего хода|Доступна з наступного ходу|Available from the next turn
Сейчас разыграть нельзя|Зараз розіграти не можна|Cannot be played now
Отдаёт|Віддає|Gives
Все приглашённые игроки отказались.|Усі запрошені гравці відмовилися.|All invited players declined.
отменяет предложение.|скасовує пропозицію.|cancels the offer.
Ход завершён, предложение закрыто.|Хід завершено, пропозицію закрито.|The turn is over, the offer is closed.
Партия завершена.|Партію завершено.|The game is over.
Предложение заменено новыми условиями.|Пропозицію замінено новими умовами.|The offer was replaced with new terms.
Игрок выполнил другое действие, предложение закрыто.|Гравець виконав іншу дію, пропозицію закрито.|The player did something else, the offer is closed.
Обмен не состоялся|Обмін не відбувся|The trade did not happen
Предложение закрыто.|Пропозицію закрито.|The offer is closed.
Ресурсы по этому предложению не переданы.|Ресурси за цією пропозицією не передано.|No resources were transferred for this offer.
✓ Обмен выполнен|✓ Обмін виконано|✓ Trade completed
Банк / порт|Банк / порт|Bank / port
С|З|With
Отдали:|Віддали:|Gave:
Получили:|Отримали:|Received:
У вас на руках|У вас на руках|In your hand
← Назад к предложению|← Назад до пропозиції|← Back to the offer
Торговля доступна после броска кубиков и завершения действий разбойника.|Торгівля доступна після кидка кубиків і завершення дій розбійника.|Trading is available after the dice roll and the robber's actions.
Ход сменился. Откройте обмен заново.|Хід змінився. Відкрийте обмін заново.|The turn has changed. Open the trade again.
Банк и порты|Банк і порти|Bank and ports
С игроками|З гравцями|With players
Нажмите карту, которую отдаёте, затем карту, которую хотите получить. Курс учитывает ваши порты.|Натисніть карту, яку віддаєте, потім карту, яку хочете отримати. Курс враховує ваші порти.|Tap the card you give, then the card you want to get. The rate accounts for your ports.
Обменять|Обміняти|Trade
У вас|У вас|You have
Пока не хватает ресурсов для банка. Можно договориться с игроками.|Поки не вистачає ресурсів для банку. Можна домовитися з гравцями.|Not enough resources for the bank yet. You can make a deal with players.
Выберите, какой ресурс получить.|Оберіть, який ресурс отримати.|Choose which resource to get.
Отдаю|Віддаю|I give
Получаю|Отримую|I get
Карта — добавить. Выбранная карта — убрать. Выберите только «Получаю», чтобы найти ресурс и получить предложения.|Карта — додати. Обрана карта — прибрати. Оберіть лише «Отримую», щоб знайти ресурс і отримати пропозиції.|A card adds it. A chosen card removes it. Choose only "I get" to look for a resource and receive offers.
Кому предложить обмен|Кому запропонувати обмін|Who to offer the trade to
Всем игрокам|Усім гравцям|All players
Отправить встречное предложение|Надіслати зустрічну пропозицію|Send a counteroffer
Предложить обмен|Запропонувати обмін|Offer a trade
Выбрано|Обрано|Chosen
Этот ресурс уже выбран с другой стороны|Цей ресурс уже обрано з іншого боку|This resource is already chosen on the other side
Можно не выбирать — другие игроки предложат цену|Можна не обирати — інші гравці запропонують ціну|You can skip this — other players will name a price
Выберите, что получите|Оберіть, що отримаєте|Choose what you will get
Это предложение уже изменилось или закрыто. Откройте актуальное предложение.|Ця пропозиція вже змінилася або закрита. Відкрийте актуальну пропозицію.|This offer has changed or closed. Open the current offer.
Для такого обмена не хватает ресурсов. Уберите лишние карты.|Для такого обміну не вистачає ресурсів. Приберіть зайві карти.|Not enough resources for this trade. Remove the extra cards.
Отправить свой вариант|Надіслати свій варіант|Send your option
Искать ресурс|Шукати ресурс|Look for a resource
Очистить|Очистити|Clear
Поиск ресурса|Пошук ресурсу|Resource search
Торговое предложение|Торгова пропозиція|Trade offer
Вы ищете|Ви шукаєте|You are looking for
Игроки предложат свою цену. Выберите подходящий вариант.|Гравці запропонують свою ціну. Оберіть підходящий варіант.|Players will name their price. Choose the best option.
Предложите искомый ресурс и выберите, что хотите взамен.|Запропонуйте шуканий ресурс і оберіть, що хочете натомість.|Offer the wanted resource and choose what you want in return.
Ваше предложение|Ваша пропозиція|Your offer
Любой игрок|Будь-який гравець|Any player
· готов к обмену|· готовий до обміну|· ready to trade
Выбрать|Обрати|Choose
· согласен, ждёт подтверждения|· погодився, чекає підтвердження|· agreed, waiting for confirmation
· отказ|· відмова|· declined
· ожидаем ответа|· чекаємо відповіді|· waiting for an answer
Выберите, с кем обменяться, и подтвердите. До подтверждения ресурсы остаются у игроков.|Оберіть, з ким обмінятися, і підтвердьте. До підтвердження ресурси лишаються в гравців.|Choose who to trade with and confirm. Until confirmed, the resources stay with the players.
Выберите игрока для обмена|Оберіть гравця для обміну|Choose a player to trade with
Обменяться с|Обмінятися з|Trade with
Предложить свой вариант|Запропонувати свій варіант|Suggest your option
Отказаться|Відмовитися|Decline
У вас пока нет искомого ресурса.|У вас поки немає шуканого ресурсу.|You do not have the wanted resource yet.
Ваш вариант отправлен.|Ваш варіант надіслано.|Your option has been sent.
Вы согласились.|Ви погодилися.|You agreed.
выбирает, с кем обменяться.|обирає, з ким обмінятися.|is choosing who to trade with.
Отозвать свой вариант|Відкликати свій варіант|Withdraw your option
Отозвать согласие|Відкликати згоду|Withdraw agreement
Согласиться на обмен|Погодитися на обмін|Agree to the trade
Для обмена не хватает ресурсов. Можно предложить другой вариант.|Для обміну не вистачає ресурсів. Можна запропонувати інший варіант.|Not enough resources for the trade. You can suggest another option.
Отменить предложение|Скасувати пропозицію|Cancel the offer
Свернуть|Згорнути|Collapse
Вы ищете ресурс|Ви шукаєте ресурс|You are looking for a resource
ищет ресурс|шукає ресурс|is looking for a resource
предлагает обмен|пропонує обмін|offers a trade
· Согласны:|· Згодні:|· Agreed:
Ресурсы не получены.|Ресурси не отримано.|No resources received.
Разбойник выходит на остров.|Розбійник виходить на острів.|The robber enters the island.
— выбран ресурс:|— обрано ресурс:|— chosen resource:
Журнал ходов|Журнал ходів|Move log
Здесь появятся броски кубиков, постройки и обмены.|Тут з'являться кидки кубиків, споруди й обміни.|Dice rolls, buildings and trades will appear here.
Кто начинает|Хто починає|Who starts
Начинает:|Починає:|Starts:
Вы победили!|Ви перемогли!|You won!
Партия прервана без результата.|Партію перервано без результату.|The game was stopped with no result.
Посмотреть остров|Подивитися острів|View the island
Кто-то за столом уже зовёт сыграть ещё — жмите «Сыграть ещё».|Хтось за столом уже кличе зіграти ще — натискайте «Зіграти ще».|Someone at the table already wants another game — press "Play again".
Ждём согласия игроков…|Чекаємо згоди гравців…|Waiting for the players to agree…
Сыграть ещё|Зіграти ще|Play again
Нет связи|Немає зв'язку|No connection
Мои партии|Мої партії|My games
Здесь появятся завершённые партии с ботами.|Тут з'являться завершені партії з ботами.|Finished games against bots will appear here.
Как играть в Катан|Як грати в Катан|How to play Catan
Остров|Острів|Island
В новых партиях используем сбалансированную раскладку: рядом не бывает связной группы из трёх одинаковых ресурсов. Это дополнительное правило нашего приложения. Красные жетоны 6 и 8 не соседствуют.|У нових партіях використовуємо збалансоване розкладання: поруч не буває зв'язної групи з трьох однакових ресурсів. Це додаткове правило нашого застосунку. Червоні жетони 6 і 8 не сусідять.|New games use a balanced layout: there is never a connected group of three identical resources. This is an extra rule of our app. Red tokens 6 and 8 are never adjacent.
Отменить ход|Скасувати хід|Undo move
Кнопка возвращает только последнее своё строительство или обмен с банком. При начальной расстановке можно вернуть поселение, пока не поставлена дорога. Отмена возвращает ресурсы и очки, но не время на ход. Она недоступна после чужого действия, броска кубиков, кражи, покупки или розыгрыша карты развития, предложения или принятия обмена с игроком, завершения хода и победы. Повторно отменять предыдущее действие нельзя.|Кнопка повертає лише ваше останнє будівництво або обмін із банком. Під час початкової розстановки можна повернути поселення, доки не поставлено дорогу. Скасування повертає ресурси й очки, але не час на хід. Воно недоступне після чужої дії, кидка кубиків, крадіжки, купівлі чи розіграшу карти розвитку, пропозиції або прийняття обміну з гравцем, завершення ходу та перемоги. Повторно скасовувати попередню дію не можна.|The button undoes only your last build or bank trade. During initial placement you can take back a settlement until the road is placed. Undo returns resources and points, but not turn time. It is unavailable after another player's action, a dice roll, a steal, buying or playing a development card, offering or accepting a trade with a player, ending the turn, and victory. You cannot undo earlier actions again.
Цель — 10 очков|Мета — 10 очок|Goal — 10 points
Поселение даёт 1 очко, город — 2. Самая длинная дорога и самая большая армия дают по 2 очка. Карты победных очков хранятся скрыто. Победа проверяется только в ваш ход.|Поселення дає 1 очко, місто — 2. Найдовша дорога й найбільше військо дають по 2 очки. Карти переможних очок зберігаються приховано. Перемога перевіряється лише у ваш хід.|A settlement gives 1 point, a city gives 2. Longest Road and Largest Army give 2 points each. Victory point cards are kept hidden. Victory is checked only on your turn.
Расстановка|Розстановка|Setup
По очереди поставьте поселение и дорогу. Второй круг идёт в обратном порядке. За второе поселение получите по ресурсу с соседних земель. Между поселениями всегда должно оставаться свободное перекрестье.|По черзі поставте поселення й дорогу. Другий круг іде у зворотному порядку. За друге поселення отримаєте по ресурсу з сусідніх земель. Між поселеннями завжди має лишатися вільне перехрестя.|Take turns placing a settlement and a road. The second round goes in reverse order. For the second settlement you get a resource from each neighboring land. There must always be a free intersection between settlements.
Ресурсы и строительство|Ресурси й будівництво|Resources and building
Бросьте два кубика. Совпавшие номера приносят ресурсы всем соседним поселениям: один за поселение, два за город. Нажмите нужную постройку и выберите подсвеченное место. Можно строить и обмениваться несколько раз за ход.|Киньте два кубики. Збіглися номери приносять ресурси всім сусіднім поселенням: один за поселення, два за місто. Натисніть потрібну споруду й оберіть підсвічене місце. Можна будувати й обмінюватися кілька разів за хід.|Roll two dice. Matching numbers give resources to all adjacent settlements: one per settlement, two per city. Tap the building you need and choose a highlighted spot. You can build and trade several times per turn.
Обмен|Обмін|Trading
С игроками обменивайтесь по договорённости. Банк меняет 4 одинаковых ресурса на 1. Поселение или город в порту улучшает курс до 3:1 либо 2:1 для указанного ресурса.|З гравцями обмінюйтеся за домовленістю. Банк міняє 4 однакових ресурси на 1. Поселення або місто в порту покращує курс до 3:1 чи 2:1 для вказаного ресурсу.|Trade with players by agreement. The bank swaps 4 identical resources for 1. A settlement or city on a port improves the rate to 3:1, or 2:1 for the named resource.
Семёрка и разбойник|Сімка й розбійник|Seven and the robber
Производства нет. Все, у кого больше 7 ресурсов, сбрасывают половину с округлением вниз. Активный игрок перемещает разбойника на другой гекс и забирает случайную карту ресурса у одного из соседей. Гекс с разбойником не производит ресурсы.|Виробництва немає. Усі, у кого більше 7 ресурсів, скидають половину із округленням униз. Активний гравець переміщує розбійника на інший гекс і забирає випадкову карту ресурсу в одного із сусідів. Гекс із розбійником не виробляє ресурсів.|No production. Everyone with more than 7 resources discards half, rounded down. The active player moves the robber to another hex and takes a random resource card from one of the neighbors. The hex with the robber produces nothing.
Можно сыграть одну карту за ход, даже до броска кубиков, но нельзя играть купленную в этом ходу. Исключение — победные очки: они учитываются сразу. Рыцарь перемещает разбойника, остальные эффекты указаны на картах.|Можна зіграти одну карту за хід, навіть до кидка кубиків, але не можна грати куплену в цьому ході. Виняток — переможні очки: вони враховуються одразу. Лицар переміщує розбійника, решта ефектів указана на картах.|You may play one card per turn, even before the dice roll, but not one bought this turn. The exception is victory points: they count right away. A knight moves the robber; the other effects are written on the cards.
Дорога и армия|Дорога й військо|Road and army
Дорога должна содержать не менее 5 непрерывных участков. Чужое поселение разрывает её. Армия — минимум 3 разыгранных рыцаря. При равенстве награда остаётся у текущего владельца.|Дорога має містити щонайменше 5 безперервних ділянок. Чуже поселення розриває її. Військо — щонайменше 3 зіграні лицарі. У разі рівності нагорода лишається в поточного власника.|A road must have at least 5 continuous segments. Another player's settlement breaks it. An army needs at least 3 played knights. In a tie the reward stays with the current holder.
Управление|Керування|Controls
Кнопка «Увеличить» открывает крупный остров. Его можно двигать пальцем. Все доступные места строительства подсвечены. Журнал показывает, кому достались ресурсы после броска.|Кнопка «Збільшити» відкриває великий острів. Його можна рухати пальцем. Усі доступні місця будівництва підсвічені. Журнал показує, кому дістались ресурси після кидка.|The "Enlarge" button opens a large island. You can drag it with your finger. All available building spots are highlighted. The log shows who got resources after a roll.
Официальные правила CATAN|Офіційні правила CATAN|Official CATAN rules
Трое|Троє|Three
Четверо|Четверо|Four
10 ПО|10 ПО|10 VP
12 ПО|12 ПО|12 VP
15 ПО|15 ПО|15 VP
Выбранный уровень применяется ко всем ботам за столом.|Обраний рівень застосовується до всіх ботів за столом.|The chosen level applies to all bots at the table.
Свободное место|Вільне місце|Free spot
После создания стола пригласите друга по коду или посадите сюда бота.|Після створення столу запросіть друга за кодом або посадіть сюди бота.|After creating the table, invite a friend by code or seat a bot here.
Ваше место|Ваше місце|Your seat
Пригласить|Запросити|Invite
Общение|Спілкування|Chat
Вы завершите партию досрочно. Вам будет записано поражение.|Ви завершите партію достроково. Вам буде записано поразку.|You will end the game early. A loss will be recorded for you.
Сбросьте ресурсы|Скиньте ресурси|Discard resources
КАТАН · НАСТРОЙКИ|КАТАН · НАЛАШТУВАННЯ|CATAN · SETTINGS
Правила стола|Правила столу|Table rules
Победные очки|Переможні очки|Victory points
Победные очки онлайн|Переможні очки онлайн|Victory points online
До скольких ПО играем?|До скількох ПО граємо?|How many VP do we play to?
Дополнительные настройки|Додаткові налаштування|Extra settings
Осталось времени на ход|Лишилося часу на хід|Time left for the turn
Кубики|Кубики|Dice
Для Катана нужно 3 или 4 игрока|Для Катану потрібно 3 або 4 гравці|Catan needs 3 or 4 players
Ход не разобран|Хід не розпізнано|The move was not understood
Не хватает данных хода|Не вистачає даних ходу|The move data is incomplete
Используйте действие «сдаться»|Використайте дію «здатися»|Use the "resign" action
пока ничьи постройки|поки що нічиїх споруд|no buildings yet
от 5 участков|від 5 ділянок|from 5 segments
от 3 рыцарей|від 3 лицарів|from 3 knights
Поселение бесплатно|Поселення безкоштовно|Settlement is free
получите соседние ресурсы|отримайте сусідні ресурси|collect the neighboring resources
`;

  // Названия ресурсов по падежам, как их собирает код: [ru, uk, en].
  const ресурсы = [['Дерево', 'Деревина', 'Lumber'], ['Глина', 'Глина', 'Brick'], ['Шерсть', 'Вовна', 'Wool'], ['Зерно', 'Зерно', 'Grain'], ['Руда', 'Руда', 'Ore']];
  const земли = [['леса', 'ліси', 'forests'], ['глиняные холмы', 'глиняні пагорби', 'clay hills'], ['пастбища', 'пасовища', 'pastures'], ['поля', 'поля', 'fields'], ['горы', 'гори', 'mountains']];
  const карты = [['Рыцарь', 'Лицар', 'Knight'], ['Строительство дорог', 'Будівництво доріг', 'Road Building'], ['Изобилие', 'Достаток', 'Year of Plenty'], ['Монополия', 'Монополія', 'Monopoly'], ['Победное очко', 'Переможне очко', 'Victory point']];
  const постройки = [['дорога', 'дорога', 'road'], ['поселение', 'поселення', 'settlement'], ['город', 'місто', 'city']];
  const действия = [['Дорога', 'Дорога', 'Road'], ['Поселение', 'Поселення', 'Settlement'], ['Город', 'Місто', 'City'], ['Рыцарь', 'Лицар', 'Knight'], ['Строительство дорог', 'Будівництво доріг', 'Road Building'], ['Изобилие', 'Достаток', 'Year of Plenty'], ['Монополия', 'Монополія', 'Monopoly']];
  const причины = [['все отказались', 'усі відмовилися', 'everyone declined'], ['предложение отменено', 'пропозицію скасовано', 'the offer was cancelled'], ['ход завершён', 'хід завершено', 'the turn ended'], ['партия завершена', 'партію завершено', 'the game ended'], ['условия изменены', 'умови змінено', 'the terms changed'], ['выполнено другое действие', 'виконано іншу дію', 'another action was taken'], ['предложение закрыто', 'пропозицію закрито', 'the offer was closed']];
  const события = [['ход завершён', 'хід завершено', 'turn ended'], ['предложен обмен', 'запропоновано обмін', 'trade offered'], ['предложил вариант обмена', 'запропонував варіант обміну', 'suggested a trade option'], ['согласен на обмен — ждёт подтверждения', 'погодився на обмін — чекає підтвердження', 'agreed to the trade — waiting for confirmation'], ['отозвано согласие на обмен', 'згоду на обмін відкликано', 'trade agreement withdrawn'], ['предложение обмена отменено', 'пропозицію обміну скасовано', 'trade offer cancelled'], ['партия завершена досрочно', 'партію завершено достроково', 'game ended early'], ['разбойник перемещён', 'розбійника переміщено', 'robber moved'], ['игровое действие', 'ігрова дія', 'game action']];
  // Глаголы после имени: «Оля играет карту».
  const глаголы = [['получает +2 ПО', 'отримує +2 ПО', 'gets +2 VP'], ['теряет 2 победных очка.', 'втрачає 2 переможні очки.', 'loses 2 victory points.'], ['играет карту', 'грає карту', 'plays a card'], ['ищет ресурс', 'шукає ресурс', 'is looking for a resource'], ['предлагает обмен', 'пропонує обмін', 'offers a trade'], ['выбирает, с кем обменяться.', 'обирає, з ким обмінятися.', 'is choosing who to trade with.'], ['отменяет предложение.', 'скасовує пропозицію.', 'cancels the offer.'], ['бросает кубики', 'кидає кубики', 'rolls the dice'], ['перемещает разбойника', 'переміщує розбійника', 'moves the robber'], ['забрал у вас 1 ресурс. Карта уже убрана из вашей руки.', 'забрав у вас 1 ресурс. Карту вже прибрано з вашої руки.', 'took 1 resource from you. The card has already been removed from your hand.'], ['переместил разбойника. Ресурс не украден: на этой соте нет доступной жертвы.', 'перемістив розбійника. Ресурс не вкрадено: на цьому гексі немає доступної жертви.', 'moved the robber. Nothing was stolen: there is no available victim on this hex.'], ['забирает у остальных игроков все карты этого ресурса.', 'забирає в решти гравців усі карти цього ресурсу.', 'takes all cards of this resource from the other players.'], ['завершили партию досрочно.', 'завершили партію достроково.', 'ended the game early.']];
  // Начала фраз с двоеточием: после них идёт список или имя — переводим только начало.
  const начала = [['Не хватает', 'Не вистачає', 'Missing'], ['Не хватает ресурсов', 'Не вистачає ресурсів', 'Missing resources'], ['Стоимость', 'Вартість', 'Cost'], ['Порт', 'Порт', 'Port'], ['Атака', 'Атака', 'Attack'], ['Отдали', 'Віддали', 'Gave'], ['Получили', 'Отримали', 'Received'], ['Вернуть', 'Повернути', 'Return'], ['Вернуть последнее действие', 'Скасувати останню дію', 'Undo the last action'], ['Выбран ресурс', 'Обрано ресурс', 'Chosen resource'], ['Ресурс у', 'Ресурс у', 'Resource from'], ['Начинает', 'Починає', 'Starts'], ['Ошибка хода бота', 'Помилка ходу бота', 'Bot move error']];

  const шаблоны = [
    [/^(.+): выпало ([\d +]+)\. Ресурсы не получены\.$/, '$1: випало $2. Ресурси не отримано.', '$1: rolled $2. No resources received.'],
    [/^(.+): выпало ([\d +]+)\. Разбойник выходит на остров\.$/, '$1: випало $2. Розбійник виходить на острів.', '$1: rolled $2. The robber enters the island.'],
    [/^(.+): выпало (.+?)\.$/, '$1: випало $2.', '$1: rolled $2.'],
    [/^Расстановка (\d+)\/2$/, 'Розстановка $1/2', 'Setup $1/2'],
    [/^Ход (\d+)$/, 'Хід $1', 'Turn $1'],
    [/^(?:· )?до (\d+) ПО$/, 'до $1 ПО', 'to $1 VP'],
    [/^(\d+) с$/, '$1 с', '$1 s'],
    [/^круг (\d+)\/2$/, 'коло $1/2', 'round $1/2'],
    [/^Автобросок через (\d+) с\. Можно бросить раньше\.$/, 'Автокидок через $1 с. Можна кинути раніше.', 'Auto-roll in $1 s. You can roll sooner.'],
    [/^Фильтр: бросок$/, 'Фільтр: кидок', 'Filter: roll'],
    [/^Фильтр: мои земли$/, 'Фільтр: мої землі', 'Filter: my lands'],
    [/^Кубик: (\d+)$/, 'Кубик: $1', 'Die: $1'],
    [/^Бот (\d+)$/, 'Бот $1', 'Bot $1'],
    [/^Игрок (\d+)$/, 'Гравець $1', 'Player $1'],
    [/^(?:· )?бросок (\d+)$/, '· кидок $1', '· roll $1'],
    [/^Разбойник: гекс (.+)$/, 'Розбійник: гекс $1', 'Robber: hex $1'],
    [/^(\d+) открытых \+ (\d+) скрытых ПО, всего (\d+)$/, '$1 відкритих + $2 прихованих ПО, разом $3', '$1 open + $2 hidden VP, $3 in total'],
    [/^Бросок: (.+)$/, 'Кидок: $1', 'Roll: $1'],
    [/^Дорога: от 5 участков$/, 'Дорога: від 5 ділянок', 'Road: from 5 segments'],
    [/^Армия: от 3 рыцарей$/, 'Військо: від 3 лицарів', 'Army: from 3 knights'],
    [/^Дорога: (.+)$/, 'Дорога: $1', 'Road: $1'],
    [/^Армия: (.+)$/, 'Військо: $1', 'Army: $1'],
    [/^Ходит (.+)$/, 'Ходить $1', '$1 is moving'],
    [/^(.+) начинает: наибольший бросок кубиков$/, '$1 починає: найбільший кидок кубиків', '$1 starts: highest dice roll'],
    [/^Сбросить (\d+)$/, 'Скинути $1', 'Discard $1'],
    [/^Сбросить (\d+) карт$/, 'Скинути карт: $1', 'Discard $1 cards'],
    [/^Выбрано (\d+) из (\d+)$/, 'Обрано $1 з $2', 'Chosen $1 of $2'],
    [/^(?:· )?ещё (\d+)$/, '· ще $1', '· $1 more'],
    [/^Останется (\d+)$/, 'Залишиться $1', '$1 will remain'],
    [/^Будет (\d+)$/, 'Буде $1', 'You will have $1'],
    [/^Победные очки: (\d+) из (\d+)$/, 'Переможні очки: $1 з $2', 'Victory points: $1 of $2'],
    [/^В руке: (\d+) ресурсов$/, 'У руці ресурсів: $1', 'In hand: $1 resources'],
    [/^(\d+) карт развития$/, 'карт розвитку: $1', '$1 development cards'],
    [/^Непрерывная дорога: (\d+)$/, 'Безперервна дорога: $1', 'Continuous road: $1'],
    [/^Разыграно рыцарей: (\d+)$/, 'Зіграно лицарів: $1', 'Knights played: $1'],
    [/^Фигуры в запасе: (\d+) дорог, (\d+) поселений, (\d+) городов\.$/, 'Фігури в запасі: доріг — $1, поселень — $2, міст — $3.', 'Pieces left: $1 roads, $2 settlements, $3 cities.'],
    [/^У вас: (\d+)$/, 'У вас: $1', 'You have: $1'],
    [/^В банке: (\d+)$/, 'У банку: $1', 'In the bank: $1'],
    [/^Ваш курс: (\d+) к 1$/, 'Ваш курс: $1 до 1', 'Your rate: $1 to 1'],
    [/^Цена: 1 шерсть \+ 1 зерно \+ 1 руда\. В колоде: (\d+)\. Купленная карта скрыта от соперников\.$/, 'Ціна: 1 вовна + 1 зерно + 1 руда. У колоді: $1. Куплена карта прихована від суперників.', 'Price: 1 wool + 1 grain + 1 ore. In the deck: $1. A bought card is hidden from opponents.'],
    [/^У вас (\d+)$/, 'У вас $1', 'You have $1'],
    [/^(.+): сброшено (\d+) ресурсов$/, '$1: скинуто ресурсів: $2', '$1: discarded $2 resources'],
    [/^(.+) забирает случайный ресурс у (.+)$/, '$1 забирає випадковий ресурс у $2', '$1 takes a random resource from $2'],
    [/^(.+): отклонено предложение обмена$/, '$1: відхилено пропозицію обміну', '$1: trade offer declined'],
    [/^(.+): отклонено предложение обмена от «(.+)»$/, '$1: відхилено пропозицію обміну від «$2»', '$1: declined the trade offer from "$2"'],
    [/^(.+): отменено — обмен с банком$/, '$1: скасовано — обмін із банком', '$1: undone — bank trade'],
    [/^Бросок (\d+):$/, 'Кидок $1:', 'Roll $1:'],
    [/^Победитель: (.+)$/, 'Переможець: $1', 'Winner: $1'],
    [/^Поселения: (\d+)$/, 'Поселення: $1', 'Settlements: $1'],
    [/^Города: (\d+) очк\.$/, 'Міста: $1 очок', 'Cities: $1 pts'],
    [/^Победные карты: (\d+)$/, 'Переможні карти: $1', 'Victory cards: $1'],
    [/^До (\d+) победных очков$/, 'До $1 переможних очок', 'Up to $1 victory points'],
    [/^Место (\d+): пригласить игрока$/, 'Місце $1: запросити гравця', 'Seat $1: invite a player']
  ];
  for (const [ru, uk, en] of ресурсы) {
    шаблоны.push([new RegExp('^Фильтр: ' + ru + '$'), 'Фільтр: ' + uk, 'Filter: ' + en]);
    шаблоны.push([new RegExp('^(.+): ' + ru + ' \\+(\\d+)$'), '$1: ' + uk + ' +$2', '$1: ' + en + ' +$2']);
    шаблоны.push([new RegExp('^' + ru + ' × (\\d+)$'), uk + ' × $1', en + ' × $1']);
    шаблоны.push([new RegExp('^' + ru + ': (\\d+)$'), uk + ': $1', en + ': $1']);
    шаблоны.push([new RegExp('^' + ru + ': у вас (\\d+), в банке (\\d+)$'), uk + ': у вас $1, у банку $2', en + ': you have $1, bank has $2']);
    шаблоны.push([new RegExp('^' + ru + ': выбрано (\\d+), в руке (\\d+)$'), uk + ': обрано $1, у руці $2', en + ': chosen $1, in hand $2']);
    шаблоны.push([new RegExp('^Убрать один: ' + ru + '$'), 'Прибрати один: ' + uk, 'Remove one: ' + en]);
    шаблоны.push([new RegExp('^Отдать ' + ru + '$'), 'Віддати: ' + uk, 'Give ' + en]);
    шаблоны.push([new RegExp('^Получить ' + ru + '$'), 'Отримати: ' + uk, 'Get ' + en]);
    шаблоны.push([new RegExp('^Добавить отдаю: ' + ru + '$'), 'Додати: віддаю — ' + uk, 'Add: I give — ' + en]);
    шаблоны.push([new RegExp('^Добавить получаю: ' + ru + '$'), 'Додати: отримую — ' + uk, 'Add: I get — ' + en]);
    шаблоны.push([new RegExp('^(.+) забирает ' + ru + ' × 1 у (.+)$'), '$1 забирає: ' + uk + ' × 1 у $2', '$1 takes ' + en + ' × 1 from $2']);
    for (const [ру2, ук2, ен2] of ресурсы) {
      шаблоны.push([new RegExp('^(.+): ' + ru + ' × (\\d+) → ' + ру2 + ' × 1$'), '$1: ' + uk + ' × $2 → ' + ук2 + ' × 1', '$1: ' + en + ' × $2 → ' + ен2 + ' × 1']);
    }
  }
  for (const [ru, uk, en] of [['Лёгкий', 'Легкий', 'Easy'], ['Обычный', 'Звичайний', 'Normal'], ['Сложный', 'Складний', 'Hard']]) {
    шаблоны.push([new RegExp('^Бот (\\d+): ' + ru + '\\. Изменить сложность$'), 'Бот $1: ' + uk + '. Змінити складність', 'Bot $1: ' + en + '. Change difficulty']);
  }
  for (const [ru, uk, en] of земли) {
    шаблоны.push([new RegExp('^Ресурс приносят ' + ru + ' при броске: (.+)\\.$'), 'Ресурс приносять ' + uk + ' при кидку: $1.', 'Resource comes from ' + en + ' on a roll of: $1.']);
  }
  for (const [ru, uk, en] of карты) {
    шаблоны.push([new RegExp('^' + ru + ' × (\\d+)$'), uk + ' × $1', en + ' × $1']);
    шаблоны.push([new RegExp('^(.+): ' + ru + '$'), '$1: ' + uk, '$1: ' + en]);
  }
  for (const [ru, uk, en] of постройки) {
    шаблоны.push([new RegExp('^Выберите место: ' + ru + '$'), 'Оберіть місце: ' + uk, 'Choose a spot: ' + en]);
  }
  for (const [ru, uk, en] of действия) {
    шаблоны.push([new RegExp('^(.+): отменено — ' + ru + '$'), '$1: скасовано — ' + uk, '$1: undone — ' + en]);
  }
  for (const [ru, uk, en] of причины) {
    шаблоны.push([new RegExp('^(.+): обмен не состоялся — ' + ru + '$'), '$1: обмін не відбувся — ' + uk, '$1: trade failed — ' + en]);
  }
  for (const [ru, uk, en] of события) {
    шаблоны.push([new RegExp('^(.+): ' + ru + '$'), '$1: ' + uk, '$1: ' + en]);
  }
  for (const [ru, uk, en] of глаголы) {
    шаблоны.push([new RegExp('^(.+) ' + ru.replace(/[.+]/g, '\\$&') + '$'), '$1 ' + uk, '$1 ' + en]);
  }
  for (const [ru, uk, en] of [['поселение', 'поселення', 'a settlement'], ['город', 'місто', 'a city']]) {
    шаблоны.push([new RegExp('^Разбойник атакует ' + ru + ' игрока (.+)\\. Украдена одна карта\\.$'), 'Розбійник атакує ' + uk + ' гравця $1. Вкрадено одну карту.', 'The robber attacks ' + en + ' of player $1. One card was stolen.']);
  }
  // Раздача ресурсов и обмен: список из нескольких видов остаётся с русскими названиями, один вид — переводится.
  for (const [ru, uk, en] of ресурсы) {
    шаблоны.push([new RegExp('^(.+) получает ' + ru + ' × (\\d+)$'), '$1 отримує ' + uk + ' × $2', '$1 gets ' + en + ' × $2']);
    for (const [ру2, ук2, ен2] of ресурсы) {
      шаблоны.push([new RegExp('^(.+) и (.+): ' + ru + ' × (\\d+) ↔ ' + ру2 + ' × (\\d+)$'), '$1 і $2: ' + uk + ' × $3 ↔ ' + ук2 + ' × $4', '$1 and $2: ' + en + ' × $3 ↔ ' + ен2 + ' × $4']);
    }
  }
  for (const [ru, uk, en] of начала) {
    шаблоны.push([new RegExp('^' + ru + ': (.+)$'), uk + ': $1', en + ': $1']);
  }

  Языки.добавить(строки);
  Языки.добавитьШаблоны(шаблоны);
  if (typeof module !== 'undefined' && module.exports) module.exports = { строки, шаблоны };
})(typeof window === 'undefined' ? globalThis : window);
