/* Словарь общих экранов: лист «⋯», нижние вкладки, сообщения сети, лобби, открытые столы, подбор,
   награды, профиль, друзья, названия режимов в реестре игр.
   Ключ — русская фраза как её видит игрок; строка «русский|українська|English».
   Обрывки длинных сообщений (в коде они склеиваются) переведены и по отдельности: целый узел
   совпадёт только с целой фразой, обрывок вреда не делает.
   Фразы с именами и числами — шаблонами ниже. Проверка: tests/языки-общие.js.
   Экран рейтинга (js/рейтинг-экран.js) и сообщения сервера (server/комнаты.js, server/партия-по-сети.js)
   разобраны; фразы с числами и падежами собраны циклами в конце файла. */
(function (корень) {
  'use strict';
  const Языки = typeof module !== 'undefined' && module.exports ? require('./языки') : корень.Языки;
  const строки = `
Фильтр по типу игр|Фільтр за типом ігор|Filter by game type
Разделы|Розділи|Sections
Соперник переподключается…|Суперник перепідключається…|Opponent is reconnecting…
Соперник пропал со связи — ждём, партия сохранена|Суперник зник зі зв'язку — чекаємо, партію збережено|Opponent lost connection — waiting, the game is saved
Остальные игроки переподключаются…|Решта гравців перепідключається…|The other players are reconnecting…
Остальные игроки пропали со связи — ждём, партия сохранена|Решта гравців зникла зі зв'язку — чекаємо, партію збережено|The other players lost connection — waiting, the game is saved
Остальные игроки вышли из игры|Решта гравців вийшла з гри|The other players left the game
Эта игра уже открыта в другой вкладке — играйте там.|Ця гра вже відкрита в іншій вкладці — грайте там.|This game is already open in another tab — play there.
Здесь можно создать новую игру или войти к другому другу.|Тут можна створити нову гру або зайти до іншого друга.|Here you can create a new game or join another friend.
Игрок|Гравець|Player
Связь с игрой потеряна. Пробуем восстановить…|Зв'язок із грою втрачено. Пробуємо відновити…|Connection to the game lost. Trying to restore it…
Соединяемся с игрой…|З'єднуємося з грою…|Connecting to the game…
Все за столом — играем!|Усі за столом — граємо!|Everyone is at the table — let's play!
Соперник пришёл — играем!|Суперник прийшов — граємо!|Opponent has arrived — let's play!
думает…|думає…|thinking…
Все на связи|Усі на зв'язку|Everyone is online
Соперник на связи|Суперник на зв'язку|Opponent is online
Предложить закончить|Запропонувати закінчити|Offer to end
подводим итог…|підбиваємо підсумок…|counting up…
можно снова через|можна знову через|can offer again in
Вы предложили закончить партию|Ви запропонували закінчити партію|You offered to end the game
предлагает закончить партию|пропонує закінчити партію|offers to end the game
Игрок предлагает закончить партию|Гравець пропонує закінчити партію|A player offers to end the game
Стол решает, закончить ли партию|Стіл вирішує, чи закінчувати партію|The table decides whether to end the game
Согласен|Згоден|Agree
Играть дальше|Грати далі|Keep playing
Вы согласны|Ви згодні|You agree
Вы за то, чтобы играть дальше|Ви за те, щоб грати далі|You voted to keep playing
Голосуют только те, кто сам сидит за столом|Голосують лише ті, хто сам сидить за столом|Only those seated at the table can vote
Вы сейчас не в игре с другом|Ви зараз не в грі з другом|You are not in a game with a friend right now
Связь с игрой потеряна — нажмите ещё раз, когда связь вернётся|Зв'язок із грою втрачено — натисніть ще раз, коли зв'язок повернеться|Connection lost — tap again when it returns
Эта партия уже позади|Ця партія вже позаду|This game is already over
Связь с сервером пропала — попробуйте нажать ещё раз|Зв'язок із сервером зник — спробуйте натиснути ще раз|Connection to the server lost — try tapping again
Игра уже закрылась|Гра вже закрилася|The game has already closed
Сервер не принял голос|Сервер не прийняв голос|The server did not accept the vote
Не получилось — попробуйте нажать ещё раз|Не вдалося — спробуйте натиснути ще раз|Didn't work — try tapping again
Вы долго не ходили — за вас играет бот|Ви довго не ходили — за вас грає бот|You were away too long — a bot is playing for you
Я здесь|Я тут|I'm here
Возвращаемся…|Повертаємося…|Coming back…
Не получилось — нажмите ещё раз|Не вдалося — натисніть ще раз|Didn't work — tap again
Ждём, когда друг войдёт по коду…|Чекаємо, поки друг зайде за кодом…|Waiting for your friend to join with the code…
Место|Місце|Seat
выбрано. Нажмите второе место — они поменяются.|обрано. Натисніть друге місце — вони поміняються.|selected. Tap a second seat — they will swap.
Обмен местами: нажмите на два места по очереди — они поменяются.|Обмін місцями: натисніть на два місця по черзі — вони поміняються.|Swap seats: tap two seats in turn — they will swap.
Скажите друзьям код. Все собрались — нажмите «Начать игру».|Скажіть друзям код. Усі зібралися — натисніть «Почати гру».|Tell your friends the code. When everyone is here, tap “Start game”.
Нажмите на игрока — он станет вашим напарником.|Натисніть на гравця — він стане вашим напарником.|Tap a player — they will become your partner.
Хотите пересадить игроков — нажмите на два места по очереди, они поменяются.|Хочете пересадити гравців — натисніть на два місця по черзі, вони поміняються.|To move players, tap two seats in turn — they will swap.
Ждём, когда хозяин начнёт игру. Нажмите на игрока — он станет вашим напарником.|Чекаємо, поки господар почне гру. Натисніть на гравця — він стане вашим напарником.|Waiting for the host to start. Tap a player — they will become your partner.
Ждём, когда хозяин начнёт игру.|Чекаємо, поки господар почне гру.|Waiting for the host to start the game.
Играют|Грають|Playing
парами, 2 на 2|парами, 2 на 2|in pairs, 2 on 2
каждый сам за себя|кожен сам за себе|every player for themselves
Ваш напарник — место|Ваш напарник — місце|Your partner — seat
, оно пока пустое.|, воно поки порожнє.|, it is empty for now.
Вы в паре с:|Ви в парі з:|You are paired with:
Готово, вернуться к выбору напарника|Готово, повернутися до вибору напарника|Done, back to choosing a partner
Поменять местами двоих|Поміняти місцями двох|Swap two players
— вы|— ви|— you
на связи|на зв'язку|online
Свободное место|Вільне місце|Free seat
Комната уже закрыта — создайте игру заново.|Кімнату вже закрито — створіть гру заново.|The room is already closed — create a new game.
Связь с сервером пропала — попробуйте нажать ещё раз.|Зв'язок із сервером зник — спробуйте натиснути ще раз.|Connection to the server lost — try tapping again.
Сервер не принял это действие.|Сервер не прийняв цю дію.|The server did not accept this action.
Так сейчас нельзя.|Так зараз не можна.|You can't do that right now.
Игра закрылась: сервер её больше не помнит. Создайте новую или войдите по коду.|Гра закрилася: сервер її більше не пам'ятає. Створіть нову або зайдіть за кодом.|The game closed: the server no longer remembers it. Create a new one or join with a code.
Пока вас не было, за столом начали новую партию —|Поки вас не було, за столом почали нову партію —|While you were away, a new game started at the table —
вернуться в неё нельзя.|повернутися до неї не можна.|you can't rejoin it.
Спросите у друга код и войдите заново: если за столом|Запитайте в друга код і зайдіть заново: якщо за столом|Ask your friend for the code and join again: if there is room at the table,
найдётся место, вас пустят.|знайдеться місце, вас пустять.|you will be let in.
Нажмите «Войти по коду» — код|Натисніть «Увійти за кодом» — код|Tap “Join by code” — the code
уже вписан. Если за столом найдётся место, вас пустят.|уже вписано. Якщо за столом знайдеться місце, вас пустять.|is already filled in. If there is room at the table, you will be let in.
Войдите заново по коду|Зайдіть заново за кодом|Join again with the code
: если за столом найдётся место, вас пустят.|: якщо за столом знайдеться місце, вас пустять.|: if there is room at the table, you will be let in.
Пока вас не было, за столом начали новую партию — вернуться в неё нельзя.|Поки вас не було, за столом почали нову партію — повернутися до неї не можна.|While you were away, a new game started at the table — you can't rejoin it.
Спросите у друга код и нажмите «Есть код?».|Запитайте в друга код і натисніть «Є код?».|Ask your friend for the code and tap “Have a code?”.
Код|Код|Code
сохранён: нажмите «Есть код?», он уже вписан.|збережено: натисніть «Є код?», його вже вписано.|saved: tap “Have a code?”, it is already filled in.
Играть с другом нельзя: игра живёт на компьютере того, кто её|З другом грати не можна: гра живе на комп'ютері того, хто її|You can't play with a friend: the game runs on the computer of whoever
запустил, а он не в сети. Это не поломка — игра против бота|запустив, а він не в мережі. Це не поломка — гра проти бота|started it, and it is offline. This is not a fault — the game against a bot
работает прямо сейчас.|працює просто зараз.|works right now.
Не удалось подключиться к онлайн-игре. Откройте приложение заново или воспользуйтесь свежим приглашением. Можно сыграть с ботом.|Не вдалося підключитися до онлайн-гри. Відкрийте застосунок заново або скористайтеся свіжим запрошенням. Можна зіграти з ботом.|Could not connect to the online game. Reopen the app or use a fresh invitation. You can play against a bot.
Не удалось определить подключение к игре.|Не вдалося визначити підключення до гри.|Could not determine the connection to the game.
Не удалось связаться с онлайн-игрой.|Не вдалося зв'язатися з онлайн-грою.|Could not reach the online game.
Проверьте подключение к интернету и откройте приложение заново. Если входите по приглашению, попросите новую ссылку.|Перевірте підключення до інтернету й відкрийте застосунок заново. Якщо заходите за запрошенням, попросіть нове посилання.|Check your internet connection and reopen the app. If you are joining by invitation, ask for a new link.
Пока соединение недоступно, можно играть с ботом.|Поки з'єднання недоступне, можна грати з ботом.|While the connection is unavailable, you can play against a bot.
Проверяем…|Перевіряємо…|Checking…
Нажмите «Назад» и создавайте игру.|Натисніть «Назад» і створюйте гру.|Tap “Back” and create a game.
Значит, адрес не тот.|Отже, адреса не та.|So the address is wrong.
Скорее всего, браузер показывает старую страницу — обновите её (Ctrl+F5).|Найімовірніше, браузер показує стару сторінку — оновіть її (Ctrl+F5).|The browser is probably showing an old page — refresh it (Ctrl+F5).
Комнату уже создаём|Кімнату вже створюємо|Already creating the room
Сейчас не получится|Зараз не вийде|Not possible right now
Создаём игру…|Створюємо гру…|Creating the game…
Ответ опоздал|Відповідь запізнилася|The reply came too late
Сервер не отвечает|Сервер не відповідає|The server is not responding
Сервер не смог создать игру.|Сервер не зміг створити гру.|The server could not create the game.
Стола больше нет — друг уже убрал его или время ожидания вышло.|Столу більше немає — друг уже прибрав його або час очікування вийшов.|The table is gone — your friend removed it or the waiting time ran out.
Партия уже началась — за этот стол сейчас не сесть.|Партія вже почалася — за цей стіл зараз не сісти.|The game has already started — you can't join this table now.
Мест нет — за столом уже сидят все игроки.|Місць немає — за столом уже сидять усі гравці.|No seats left — all players are already at the table.
Стола нет — возможно, сервер перезапускался. Попросите новую ссылку или создайте стол сами.|Столу немає — можливо, сервер перезапускався. Попросіть нове посилання або створіть стіл самі.|The table doesn't exist — the server may have restarted. Ask for a new link or create a table yourself.
Это стол другой игры. Откройте её и введите код там.|Це стіл іншої гри. Відкрийте її й введіть код там.|This is a table of another game. Open that game and enter the code there.
Играть здесь|Грати тут|Play here
Создать новый стол|Створити новий стіл|Create a new table
Открыть игру|Відкрити гру|Open the game
В лобби|До лобі|To the lobby
Вы вошли с другого устройства — партия продолжается там.|Ви зайшли з іншого пристрою — партія триває там.|You signed in from another device — the game continues there.
Можно забрать её сюда.|Можна забрати її сюди.|You can take it back here.
Кода не хватает|Коду не вистачає|The code is incomplete
Код состоит из четырёх знаков — наберите его целиком.|Код складається з чотирьох знаків — наберіть його повністю.|The code has four characters — enter all of them.
Войти не получилось. Проверьте код — возможно, игру уже начали без вас.|Зайти не вдалося. Перевірте код — можливо, гру вже почали без вас.|Couldn't join. Check the code — the game may have started without you.
Возвращаемся в вашу игру…|Повертаємося до вашої гри…|Returning to your game…
Прошлая игра с другом уже доиграна, и за столом|Попередню гру з другом уже завершено, і за столом|Your last game with a friend is over, and no one
никого не осталось. Создайте новую игру или войдите по коду.|нікого не лишилося. Створіть нову гру або зайдіть за кодом.|is left at the table. Create a new game or join with a code.
Нет связи с игрой — нажмите ещё раз|Немає зв'язку з грою — натисніть ще раз|No connection to the game — tap again
Не получилось вернуться — попробуйте ещё раз|Не вдалося повернутися — спробуйте ще раз|Couldn't return — try again
За столом начали новую партию|За столом почали нову партію|A new game started at the table
Партия уже доиграна|Партію вже завершено|The game is already finished
Вернуться к игре с|Повернутися до гри з|Back to the game with
Вернуться к игре с другом|Повернутися до гри з другом|Back to the game with a friend
Играть с другом|Грати з другом|Play with a friend
Возвращаемся за стол…|Повертаємося за стіл…|Going back to the table…
Партии больше нет|Партії більше немає|The game no longer exists
Сеть не отвечает|Мережа не відповідає|The network is not responding
Код ещё не пришёл — подождите секунду.|Код ще не прийшов — зачекайте секунду.|The code hasn't arrived yet — wait a second.
Код скопирован|Код скопійовано|Code copied
Код в буфере — вставьте его другу в переписку.|Код у буфері — вставте його другові в переписку.|The code is in the clipboard — paste it into a chat with your friend.
Скопировать не вышло|Скопіювати не вийшло|Couldn't copy
Скопировать не получилось — телефон не дал доступ к буферу обмена.|Скопіювати не вдалося — телефон не дав доступ до буфера обміну.|Couldn't copy — the phone didn't allow clipboard access.
Продиктуйте другу код:|Продиктуйте другові код:|Tell your friend the code:
Играем|Граємо|Let's play
? Стол уже собран — заходите по ссылке.|? Стіл уже зібрано — заходьте за посиланням.|? The table is ready — join by the link.
Но учтите: ссылка ведёт на ваш компьютер, и с чужого телефона|Але зважте: посилання веде на ваш комп'ютер, і з чужого телефона|But note: the link leads to your computer, and from someone else's phone
она не откроется. Нужен адрес из интернета — запустите туннель.|воно не відкриється. Потрібна адреса з інтернету — запустіть тунель.|it won't open. An internet address is needed — start the tunnel.
Готовим…|Готуємо…|Preparing…
Приглашение отправлено|Запрошення надіслано|Invitation sent
Друг получил ссылку — он нажмёт её и сразу сядет за ваш стол.|Друг отримав посилання — він натисне його й одразу сяде за ваш стіл.|Your friend got the link — they will tap it and sit at your table right away.
Ссылку не собрать|Посилання не скласти|Can't build the link
Игра открыта файлом с диска, и ссылки на неё не существует.|Гру відкрито файлом із диска, і посилання на неї не існує.|The game was opened from a file on disk, so it has no link.
Выберите друга в списке — ему уйдёт ссылка на этот стол.|Оберіть друга у списку — йому піде посилання на цей стіл.|Pick a friend from the list — they will get a link to this table.
Ссылка в буфере — отправьте её другу любым способом.|Посилання в буфері — надішліть його другові будь-яким способом.|The link is in the clipboard — send it to your friend any way you like.
Он нажмёт её и откроет игру прямо в Telegram, сразу за вашим столом.|Він натисне його й відкриє гру просто в Telegram, одразу за вашим столом.|They will tap it and open the game right in Telegram, at your table.
Он откроет её в браузере и сразу сядет за ваш стол.|Він відкриє його в браузері й одразу сяде за ваш стіл.|They will open it in a browser and sit at your table right away.
Скопировать не получилось — Telegram не дал доступ к буферу обмена.|Скопіювати не вдалося — Telegram не дав доступ до буфера обміну.|Couldn't copy — Telegram didn't allow clipboard access.
Вот ссылка, она уже выделена — скопируйте её (Ctrl+C) и отправьте другу:|Ось посилання, воно вже виділене — скопіюйте його (Ctrl+C) і надішліть другові:|Here is the link, already selected — copy it (Ctrl+C) and send it to your friend:
Пока вы выбираете чат, игра свернётся — это нормально.|Поки ви обираєте чат, гра згорнеться — це нормально.|While you pick a chat, the game will minimize — that's normal.
Вернуться за стол можно кнопкой «Вернуться к игре с другом» в главном меню.|Повернутися за стіл можна кнопкою «Повернутися до гри з другом» у головному меню.|You can return to the table with the “Back to the game with a friend” button in the main menu.
Не удалось открыть стол. Откройте ссылку ещё раз.|Не вдалося відкрити стіл. Відкрийте посилання ще раз.|Couldn't open the table. Open the link again.
Сажаем бота…|Саджаємо бота…|Adding a bot…
Убираем бота…|Прибираємо бота…|Removing the bot…
Раздаём карты…|Роздаємо карти…|Dealing the cards…
Собираем стол…|Збираємо стіл…|Setting up the table…
морской бой|морський бій|battleship
Игра открыта не в Telegram, поэтому узнать, с кем вы играли, не получится.|Гру відкрито не в Telegram, тому дізнатися, з ким ви грали, не вийде.|The game is not open in Telegram, so we can't tell who you played with.
и список знакомых вернётся.|і список знайомих повернеться.|and the list of people you know will come back.
Сервер игры сейчас не отвечает — спросить не у кого.|Сервер гри зараз не відповідає — спитати нікого.|The game server is not responding — there is no one to ask.
Сервер игры ещё не умеет показывать знакомых — его надо обновить.|Сервер гри ще не вміє показувати знайомих — його треба оновити.|The game server can't show acquaintances yet — it needs an update.
Сервер игры не ответил. Кто из знакомых сейчас за столом — неизвестно.|Сервер гри не відповів. Хто зі знайомих зараз за столом — невідомо.|The game server didn't reply. We don't know who of your acquaintances is at a table.
Сервер не смог проверить, кто вы, — список показан старый.|Сервер не зміг перевірити, хто ви, — показано старий список.|The server couldn't verify who you are — the old list is shown.
Стол создать не вышло.|Стіл створити не вийшло.|Couldn't create the table.
Сервер игры ещё не умеет звать письмом — его надо обновить.|Сервер гри ще не вміє кликати листом — його треба оновити.|The game server can't send invitations yet — it needs an update.
Сервер игры не ответил. Попробуйте ещё раз или отправьте ссылку сами.|Сервер гри не відповів. Спробуйте ще раз або надішліть посилання самі.|The game server didn't reply. Try again or send the link yourself.
Позвать письмом не вышло.|Покликати листом не вийшло.|Couldn't send the invitation.
Список устарел — откройте его заново.|Список застарів — відкрийте його заново.|The list is out of date — open it again.
Письмо знакомому отправляет бот, поэтому звать так можно только из Telegram.|Лист знайомому надсилає бот, тому кликати так можна лише з Telegram.|The bot sends the invitation, so this works only from Telegram.
Уже зовём — подождите.|Уже кличемо — зачекайте.|Already inviting — please wait.
Сервер игры сейчас не отвечает — позвать некому.|Сервер гри зараз не відповідає — кликати нікого.|The game server is not responding — nobody to invite.
Ссылку за стол собрать не вышло. Продиктуйте другу код:|Посилання за стіл скласти не вийшло. Продиктуйте другові код:|Couldn't build the table link. Tell your friend the code:
Результат раздачи дня записывается только в Telegram.|Результат роздачі дня записується лише в Telegram.|The deal of the day result is saved only in Telegram.
Сервер игры сейчас не отвечает — сравнить не с кем.|Сервер гри зараз не відповідає — порівнювати ні з ким.|The game server is not responding — nobody to compare with.
Сервер игры ещё не умеет раздачу дня — его надо обновить.|Сервер гри ще не вміє роздачу дня — його треба оновити.|The game server doesn't support the deal of the day yet — it needs an update.
Сервер игры не ответил — сравнить пока не с кем.|Сервер гри не відповів — порівнювати поки ні з ким.|The game server didn't reply — nobody to compare with yet.
Очки за партии с ботом начисляются только в Telegram|Очки за партії з ботом нараховуються лише в Telegram|Points for games against the bot are awarded only in Telegram
Сервер игры сейчас не отвечает|Сервер гри зараз не відповідає|The game server is not responding
Сервер игры ещё не умеет билеты на партию с ботом — его надо обновить.|Сервер гри ще не вміє квитки на партію з ботом — його треба оновити.|The game server doesn't support bot-game tickets yet — it needs an update.
Сервер игры не ответил|Сервер гри не відповів|The game server didn't reply
Найти игру можно только в Telegram — откройте игру через бота.|Знайти гру можна лише в Telegram — відкрийте гру через бота.|You can find a game only in Telegram — open the game through the bot.
Сервер игры сейчас не отвечает.|Сервер гри зараз не відповідає.|The game server is not responding.
Сервер игры не отвечает — список не обновился.|Сервер гри не відповідає — список не оновився.|The game server is not responding — the list was not updated.
В друзьях|У друзях|In friends
Позван|Запрошено|Invited
В друзья|У друзі|Add friend
Не вышло — ещё раз|Не вийшло — ще раз|Failed — try again
Сесть за стол можно только из Telegram.|Сісти за стіл можна лише з Telegram.|You can take a seat only from Telegram.
Уже входим в игру — подождите.|Уже входимо в гру — зачекайте.|Already joining the game — please wait.
Ответ опоздал — попробуйте ещё раз.|Відповідь запізнилася — спробуйте ще раз.|The reply came too late — try again.
Сервер игры не отвечает — сесть не вышло.|Сервер гри не відповідає — сісти не вийшло.|The game server is not responding — couldn't sit down.
Сесть за стол не вышло — попробуйте другой.|Сісти за стіл не вийшло — спробуйте інший.|Couldn't take a seat — try another table.
Создать открытый стол можно только в Telegram.|Створити відкритий стіл можна лише в Telegram.|You can create an open table only in Telegram.
Уже создаём стол — подождите.|Уже створюємо стіл — зачекайте.|Already creating a table — please wait.
Сервер игры не отвечает — стол не создан.|Сервер гри не відповідає — стіл не створено.|The game server is not responding — the table was not created.
Сервер не смог создать стол.|Сервер не зміг створити стіл.|The server could not create the table.
Играть онлайн можно только в Telegram — откройте игру через бота.|Грати онлайн можна лише в Telegram — відкрийте гру через бота.|You can play online only in Telegram — open the game through the bot.
Подбор отменён.|Підбір скасовано.|Matchmaking cancelled.
Сервер игры не отвечает — подбор не начался.|Сервер гри не відповідає — підбір не почався.|The game server is not responding — matchmaking didn't start.
Играть онлайн сейчас не вышло.|Грати онлайн зараз не вийшло.|Couldn't play online right now.
Сервер не ответил про подбор.|Сервер не відповів щодо підбору.|The server didn't reply about matchmaking.
Подбор не запущен.|Підбір не запущено.|Matchmaking is not running.
Ожидание закончилось — попробуйте ещё раз.|Очікування закінчилося — спробуйте ще раз.|The wait is over — try again.
Ещё встаём в очередь — нажмите «Играть с ботом» через пару секунд.|Ще стаємо в чергу — натисніть «Грати з ботом» за кілька секунд.|Still joining the queue — tap “Play with a bot” in a couple of seconds.
Сервер игры не отвечает — ищем соперника дальше.|Сервер гри не відповідає — шукаємо суперника далі.|The game server is not responding — still looking for an opponent.
Играть с ботом сейчас не вышло.|Грати з ботом зараз не вийшло.|Couldn't play with a bot right now.
Играть с ботом сейчас не вышло — ищем соперника дальше.|Грати з ботом зараз не вийшло — шукаємо суперника далі.|Couldn't play with a bot — still looking for an opponent.
В турнире можно участвовать только в Telegram — откройте игру через бота.|У турнірі можна брати участь лише в Telegram — відкрийте гру через бота.|You can join a tournament only in Telegram — open the game through the bot.
Сервер игры не отвечает — попробуйте ещё раз.|Сервер гри не відповідає — спробуйте ще раз.|The game server is not responding — try again.
Турнир сейчас не отвечает.|Турнір зараз не відповідає.|The tournament is not responding right now.
Сервер не узнал вас — откройте игру через бота.|Сервер не впізнав вас — відкрийте гру через бота.|The server didn't recognize you — open the game through the bot.
Не получилось войти в турнир|Не вдалося увійти в турнір|Couldn't join the tournament
Сервер игры не отвечает — вернитесь к турниру позже.|Сервер гри не відповідає — поверніться до турніру пізніше.|The game server is not responding — come back to the tournament later.
Сервер не ответил про турнир.|Сервер не відповів щодо турніру.|The server didn't reply about the tournament.
Связь с игрой потеряна — ход не отправлен.|Зв'язок із грою втрачено — хід не надіслано.|Connection lost — your move was not sent.
Как только связь вернётся, можно будет сходить снова.|Щойно зв'язок повернеться, можна буде піти знову.|Once the connection is back, you can move again.
Связь с игрой потеряна — черновик не сохранён на сервере.|Зв'язок із грою втрачено — чернетку не збережено на сервері.|Connection lost — the draft was not saved on the server.
Расстановка осталась у вас на экране.|Розстановка лишилася у вас на екрані.|The setup stayed on your screen.
Нет связи с игрой — черновик не сохранён на сервере.|Немає зв'язку з грою — чернетку не збережено на сервері.|No connection — the draft was not saved on the server.
Сервер не принял черновик|Сервер не прийняв чернетку|The server did not accept the draft
Этот сервер ещё не умеет эмоции — обновите его и перезапустите|Цей сервер ще не вміє емоції — оновіть його й перезапустіть|This server doesn't support emotes yet — update and restart it
Связь потеряна — смайлик не ушёл. Попробуйте ещё раз, когда связь вернётся|Зв'язок втрачено — смайлик не пішов. Спробуйте ще раз, коли зв'язок повернеться|Connection lost — the emoji wasn't sent. Try again when it returns
Связь потеряна — смайлик не ушёл|Зв'язок втрачено — смайлик не пішов|Connection lost — the emoji wasn't sent
Обычная игра вдвоём: карты раздадутся сами, как только друг войдёт по коду.|Звичайна гра вдвох: карти роздадуться самі, щойно друг зайде за кодом.|A regular game for two: the cards are dealt as soon as your friend joins with the code.
Парами: двое против двоих, напарник напротив.|Парами: двоє проти двох, напарник навпроти.|In pairs: two against two, your partner sits opposite.
Каждый сам за себя.|Кожен сам за себе.|Every player for themselves.
Переводной: положите такую же карту — и отбивается сосед.|З переведенням: покладіть таку саму карту — і відбивається сусід.|With passing: play a card of the same rank — and the next player defends.
Свободные места можно занять ботами. Игру начнёте вы — кнопкой.|Вільні місця можна зайняти ботами. Гру почнете ви — кнопкою.|Free seats can be filled with bots. You start the game with a button.
Завершить партию|Завершити партію|End the game
Завершить партию?|Завершити партію?|End the game?
Завершить|Завершити|End
Вернуться к игре|Повернутися до гри|Back to the game
Сдаться|Здатися|Resign
Не получилось — попробуйте ещё раз|Не вдалося — спробуйте ще раз|Didn't work — try again
Найти игру|Знайти гру|Find a game
ждёт меньше минуты|чекає менше хвилини|waiting less than a minute
за столом пока никого|за столом поки нікого|nobody at the table yet
Сесть|Сісти|Sit down
Найти игру можно только в Telegram.|Знайти гру можна лише в Telegram.|You can find a game only in Telegram.
Список сейчас не открывается — сервер не отвечает.|Список зараз не відкривається — сервер не відповідає.|The list can't be opened now — the server is not responding.
Пока никто не открыл стол.|Поки ніхто не відкрив стіл.|Nobody has opened a table yet.
Садимся…|Сідаємо…|Sitting down…
Сесть за стол не вышло.|Сісти за стіл не вийшло.|Couldn't take a seat.
Создаём…|Створюємо…|Creating…
Отменить|Скасувати|Cancel
Ищем соперника…|Шукаємо суперника…|Looking for an opponent…
Игра не знает, как искать соперника — обновите страницу.|Гра не знає, як шукати суперника — оновіть сторінку.|The game doesn't know how to find an opponent — refresh the page.
Сервер игры не ответил.|Сервер гри не відповів.|The game server didn't reply.
Игра не знает, как посадить с ботом — обновите страницу.|Гра не знає, як посадити з ботом — оновіть сторінку.|The game doesn't know how to seat you with a bot — refresh the page.
Отменяем…|Скасовуємо…|Cancelling…
Игра не подключена к онлайн-лобби.|Гру не підключено до онлайн-лобі.|The game is not connected to the online lobby.
Связь с сервером не загрузилась — обновите страницу.|Зв'язок із сервером не завантажився — оновіть сторінку.|The server connection didn't load — refresh the page.
Сервер не ответил.|Сервер не відповів.|The server didn't reply.
Стол создать не вышло:|Стіл створити не вийшло:|Couldn't create the table:
блиц 5+3|бліц 5+3|blitz 5+3
Очки пока не прочитались|Очки поки не прочиталися|Points haven't loaded yet
место из|місце з|place out of
Все награды получены|Усі нагороди отримано|All rewards claimed
место за сутки не изменилось|місце за добу не змінилося|rank unchanged over the day
Ваши очки по играм|Ваші очки за іграми|Your points by game
Всего|Усього|Total
Очки по играм появятся после обновления|Очки за іграми з'являться після оновлення|Points by game will appear after the update
Друзей пришло:|Друзів прийшло:|Friends joined:
Друг засчитывается, когда сыграет первую партию|Друга зараховано, коли він зіграє першу партію|A friend counts once they play their first game
Позвать друга|Покликати друга|Invite a friend
Вчера играли — сыграйте сегодня, чтобы не прервать серию из|Учора грали — зіграйте сьогодні, щоб не перервати серію з|You played yesterday — play today to keep your streak of
Игра не знает адреса сервера — список друзей недоступен.|Гра не знає адреси сервера — список друзів недоступний.|The game doesn't know the server address — the friends list is unavailable.
Адрес сервера настроен неверно — список друзей недоступен.|Адресу сервера налаштовано неправильно — список друзів недоступний.|The server address is set up incorrectly — the friends list is unavailable.
Сервер сейчас не отвечает. Попробуйте открыть список друзей позже.|Сервер зараз не відповідає. Спробуйте відкрити список друзів пізніше.|The server is not responding. Try opening the friends list later.
Игра открыта не в Telegram, поэтому список друзей недоступен.|Гру відкрито не в Telegram, тому список друзів недоступний.|The game is not open in Telegram, so the friends list is unavailable.
за столом|за столом|at a table
в сети|у мережі|online
Точно?|Точно?|Sure?
Удалить|Видалити|Remove
Удаляем…|Видаляємо…|Removing…
Удалить не вышло — попробуйте ещё раз.|Видалити не вийшло — спробуйте ще раз.|Couldn't remove — try again.
Принимаем…|Приймаємо…|Accepting…
Отклоняем…|Відхиляємо…|Declining…
Принять|Прийняти|Accept
Отклонить|Відхилити|Decline
Не вышло — попробуйте ещё раз.|Не вийшло — спробуйте ще раз.|Failed — try again.
Позвать не вышло — попробуйте ещё раз.|Покликати не вийшло — спробуйте ще раз.|Couldn't invite — try again.
Показывать, что я в сети|Показувати, що я в мережі|Show that I'm online
Видят друзья и те, с кем вы играли за 60 дней|Бачать друзі й ті, з ким ви грали за 60 днів|Seen by friends and people you played with in the last 60 days
Переключить не вышло — попробуйте ещё раз.|Перемкнути не вийшло — спробуйте ще раз.|Couldn't switch — try again.
Отправляем…|Надсилаємо…|Sending…
Добавить в друзья|Додати в друзі|Add to friends
Уже друзья|Уже друзі|Already friends
Заявка отправлена|Заявку надіслано|Request sent
Список «с кем играл» сейчас недоступен.|Список «з ким грав» зараз недоступний.|The “played with” list is unavailable right now.
Сервер не ответил — список «с кем играл» может быть неполным.|Сервер не відповів — список «з ким грав» може бути неповним.|The server didn't reply — the “played with” list may be incomplete.
Игра не знает, где сервер с рейтингом|Гра не знає, де сервер із рейтингом|The game doesn't know where the ratings server is
Сервер с рейтингом не отвечает|Сервер із рейтингом не відповідає|The ratings server is not responding
Повторить|Повторити|Retry
Классика|Класика|Classic
Падающие числа|Числа, що падають|Falling numbers
Средний|Середній|Medium
Эксперт|Експерт|Expert
Блоки 8×8|Блоки 8×8|Blocks 8×8
Свобода|Свобода|Freedom
Три в ряд|Три в ряд|Match three
Прогулка|Прогулянка|Stroll
Вызов|Виклик|Challenge
Поиск слов|Пошук слів|Word search
Пятнашки|П'ятнашки|Fifteen puzzle
Змейка|Змійка|Snake
Спокойно|Спокійно|Relaxed
Без границ|Без меж|Unlimited
Дурака|Дурня|Durak
Дураке|Дурні|Durak
Шахмат|Шахів|Chess
Шахматах|Шахах|Chess
Шашек|Шашок|Checkers
Шашках|Шашках|Checkers
Нард|Нард|Backgammon
Нардах|Нардах|Backgammon
Деберца|Деберца|Deberts
Деберце|Деберці|Deberts
Морского боя|Морського бою|Battleship
Морском бое|Морському бою|Battleship
Катана|Катана|Catan
Катане|Катані|Catan
Монополии|Монополії|Monopoly
Покера|Покера|Poker
Покере|Покері|Poker
Японского кроссворда|Японського кросворду|Nonogram
Японском кроссворде|Японському кросворді|Nonogram
Бастиона прилива|Бастіону припливу|Tide Bastion
Бастионе прилива|Бастіоні припливу|Tide Bastion
Захвата|Захоплення|Conquest
Захвате|Захопленні|Conquest
Все игры|Усі ігри|All games
Общий рейтинг|Загальний рейтинг|Overall leaderboard
Очки за все игры|Очки за всі ігри|Points across all games
Лучшее время|Найкращий час|Best time
Лучший счёт|Найкращий результат|Best score
Игра недоступна|Гра недоступна|Game unavailable
Браузер не даёт связаться с сервером|Браузер не дає зв'язатися із сервером|The browser won't let us reach the server
Рейтинг ведётся по учётной записи Telegram|Рейтинг ведеться за обліковим записом Telegram|The leaderboard uses your Telegram account
Сервер отказал в ответе|Сервер відмовив у відповіді|The server refused to answer
Сервер отказал в ответе, не назвав причину.|Сервер відмовив у відповіді, не назвавши причини.|The server refused to answer and gave no reason.
В друзьях пока никого нет|У друзях поки нікого немає|No friends yet
Добавьте кого-то в друзья — и здесь появится таблица только среди них.|Додайте когось у друзі — і тут з'явиться таблиця лише серед них.|Add someone as a friend — and a table of just your friends will appear here.
Здесь пока никто не играл|Тут поки ніхто не грав|Nobody has played here yet
Вас в таблице пока нет|Вас у таблиці поки немає|You're not in the table yet
Всего в таблице|Усього в таблиці|Total in the table
Сильнейшие|Найсильніші|Strongest
Вы в таблице|Ви в таблиці|You're in the table
лучшее время|найкращий час|best time
лучший счёт|найкращий результат|best score
Вашего результата среди показанных нет|Вашого результату серед показаних немає|Your result is not among those shown
Сила игры здесь пока не считается|Силу гри тут поки не рахують|Skill rating isn't counted here yet
Последняя партия:|Остання партія:|Last game:
Вы и соседи по силе|Ви та сусіди за силою|You and your skill neighbours
Сила ещё не измерена|Силу ще не виміряно|Skill not measured yet
Сила|Сила|Skill
очки ещё не посчитаны|очки ще не пораховано|points not counted yet
Место за сутки выросло на|Місце за добу зросло на|Rank up over the last day:
Место за сутки упало на|Місце за добу впало на|Rank down over the last day:
Место за сутки не изменилось|Місце за добу не змінилося|Rank unchanged over the last day
Нет данных о движении за сутки|Немає даних про рух за добу|No data on rank changes over the last day
Очки|Очки|Points
Партий|Партій|Games
Сыграйте первую рейтинговую партию|Зіграйте першу рейтингову партію|Play your first ranked game
играл сильнее вас|грав сильніше за вас|played stronger than you
играл слабее вас|грав слабше за вас|played weaker than you
играл вровень с вами|грав нарівні з вами|played on par with you
Лидеры|Лідери|Leaders
В начало списка|На початок списку|Back to the top
Не удалось догрузить список|Не вдалося довантажити список|Couldn't load more
Моё место среди друзей|Моє місце серед друзів|My rank among friends
Моё место|Моє місце|My rank
Выберите другую игру|Оберіть іншу гру|Choose another game
Пока нет результатов|Поки немає результатів|No results yet
Смотрим таблицу…|Дивимося таблицю…|Loading the table…
Круг игроков|Коло гравців|Circle of players
Правила дурака|Правила дурня|Durak rules
Режим игры|Режим гри|Game mode
Фильтры|Фільтри|Filters
Закрыть объяснение|Закрити пояснення|Close explanation
Выбрать игру|Обрати гру|Choose a game
Закрыть выбор игры|Закрити вибір гри|Close game picker
Поиск игры|Пошук гри|Search for a game
Такой игры пока нет|Такої гри поки немає|No such game yet
ИГРЫ|ІГРИ|GAMES
СКОРО|СКОРО|SOON
лучшая серия|найкраща серія|best streak
% побед|% перемог|% wins
Побед|Перемог|Wins
Счёт ведётся с|Рахунок ведеться з|Tally kept since
Счёт пока не ведётся|Рахунок поки не ведеться|No tally yet
Рейтинг всех игроков живёт на сервере, а ссылка, по которой открыли игру, адреса сервера не несёт — постучаться просто некуда. Это не поломка: откройте игру свежей кнопкой в боте, и таблица появится. Играть можно и без неё.|Рейтинг усіх гравців живе на сервері, а посилання, за яким відкрили гру, адреси сервера не містить — достукатися просто нікуди. Це не поломка: відкрийте гру свіжою кнопкою в боті, і таблиця з'явиться. Грати можна й без неї.|The leaderboard of all players lives on a server, and the link you opened the game with doesn't carry the server address — there is nowhere to connect. It's not a breakdown: open the game with a fresh button in the bot and the table will appear. You can play without it.
Адрес у игры есть, но по нему сейчас никто не отвечает: сервер держится на домашнем компьютере и, пока тот не в сети, таблицу взять неоткуда. Это не поломка — игра работает как обычно, а рейтинг покажется, когда сервер вернётся.|Адреса в гри є, але за ним зараз ніхто не відповідає: сервер працює на домашньому комп'ютері й, поки той не в мережі, таблицю взяти нізвідки. Це не поломка — гра працює як завжди, а рейтинг з'явиться, коли сервер повернеться.|The game has an address, but nobody answers there now: the server runs on a home computer and while it is offline there is no table to fetch. It's not a breakdown — the game works as usual, and the leaderboard will show up when the server is back.
Игра сейчас открыта не в Telegram, а узнать человека ей больше нечем: любое имя можно написать чужое. Откройте игру внутри Telegram — кнопкой в боте, — и ваше место появится в таблице. Партии, сыгранные здесь, в рейтинг не попадут.|Гру зараз відкрито не в Telegram, а впізнати людину їй більше нічим: будь-яке ім'я можна написати чуже. Відкрийте гру всередині Telegram — кнопкою в боті, — і ваше місце з'явиться в таблиці. Партії, зіграні тут, у рейтинг не потраплять.|The game is open outside Telegram, and it has no other way to recognise you: anyone can type someone else's name. Open the game inside Telegram — with the button in the bot — and your place will appear in the table. Games played here won't count towards the leaderboard.
Таблица этой игры ещё пуста. Сыграйте партию до конца — и вы окажетесь в ней первым.|Таблиця цієї гри ще порожня. Зіграйте партію до кінця — і ви опинитеся в ній першим.|This game's table is still empty. Play a game to the end — and you'll be first in it.
В рейтинг попадают после первой доигранной партии — доиграйте одну, и ваша строка появится здесь сама.|У рейтинг потрапляють після першої дограної партії — догрийте одну, і ваш рядок з'явиться тут сам.|You get into the leaderboard after your first finished game — finish one and your row will appear here by itself.
В этом режиме результатов ещё нет. Сыграйте — и ваш лучшее время окажется первым.|У цьому режимі результатів ще немає. Зіграйте — і ваш найкращий час стане першим.|There are no results in this mode yet. Play — and your best time will be first.
В этом режиме результатов ещё нет. Сыграйте — и ваш лучший счёт окажется первым.|У цьому режимі результатів ще немає. Зіграйте — і ваш найкращий результат стане першим.|There are no results in this mode yet. Play — and your best score will be first.
В таблице у каждого игрока один, его лучшее время в этом режиме.|У таблиці в кожного гравця один, його найкращий час у цьому режимі.|Each player has one in the table — their best time in this mode.
В таблице у каждого игрока один, его лучший счёт в этом режиме.|У таблиці в кожного гравця один, його найкращий результат у цьому режимі.|Each player has one in the table — their best score in this mode.
Сервер, к которому подключена игра, второй меры ещё не знает. Посмотрите «Очки за победы» — эта таблица работает.|Сервер, до якого підключена гра, другої міри ще не знає. Подивіться «Очки за перемоги» — ця таблиця працює.|The server the game is connected to doesn't know the second measure yet. Take a look at “Points for wins” — that table works.
В таблице силы пока никого нет: в неё попадают, когда сила измерена надёжно, а для этого нужно несколько партий.|У таблиці сили поки нікого немає: до неї потрапляють, коли силу виміряно надійно, а для цього потрібно кілька партій.|Nobody is in the skill table yet: you get in once your skill is measured reliably, and that takes several games.
Сила растёт за победы над сильными и почти не падает за поражение сильному.|Сила зростає за перемоги над сильними й майже не падає за поразку сильному.|Skill grows with wins over strong players and barely drops after a loss to a strong one.
Сила — это не «сколько сыграл», а «насколько сильно играешь».|Сила — це не «скільки зіграв», а «наскільки сильно граєш».|Skill is not “how much you played” but “how well you play”.
Она считается по силе соперников: обыграли сильного — прибавка большая, обыграли слабого — маленькая.|Вона рахується за силою суперників: переграли сильного — прибавка велика, переграли слабкого — маленька.|It depends on your opponents' strength: beat a strong one — a big gain, beat a weak one — a small one.
Проиграть сильному почти не страшно: потеря небольшая. Проиграть слабому — потеря заметная, и это честно.|Програти сильному майже не страшно: втрата невелика. Програти слабкому — втрата помітна, і це чесно.|Losing to a strong player hardly hurts: the loss is small. Losing to a weak one — a noticeable loss, and that's fair.
Игра парами считается вполовину: половину работы сделал напарник.|Гра парами рахується наполовину: половину роботи зробив напарник.|Pairs play counts for half: your partner did half the work.
Сначала сила приблизительная и пишется со знаком «≈» — игра ещё присматривается.|Спочатку сила приблизна й пишеться зі знаком «≈» — гра ще придивляється.|At first your skill is approximate and shown with “≈” — the game is still getting to know you.
В таблицу попадают только те, чья сила измерена надёжно: иначе одна везучая победа поднимала бы новичка на первое место.|До таблиці потрапляють лише ті, чию силу виміряно надійно: інакше одна щаслива перемога піднімала б новачка на перше місце.|Only players whose skill is measured reliably get into the table: otherwise one lucky win would lift a newcomer to first place.
Долго не играли — число снова становится приблизительным: за это время вы могли научиться играть и лучше, и хуже.|Довго не грали — число знову стає приблизним: за цей час ви могли навчитися грати і краще, і гірше.|Haven't played for a while — the number becomes approximate again: you may have got better or worse in the meantime.
Очки дают за победы, и чем сильнее соперник, тем их больше:|Очки дають за перемоги, і чим сильніший суперник, тим їх більше:|Points are given for wins, and the stronger the opponent, the more you get:
победа над живым человеком — 10 очков;|перемога над живою людиною — 10 очок;|a win over a live player — 10 points;
ничья с живым человеком — 5 очков;|нічия з живою людиною — 5 очок;|a draw with a live player — 5 points;
победа над сложным ботом — 2 очка;|перемога над складним ботом — 2 очки;|a win over a hard bot — 2 points;
победа над обычным ботом — 1 очко;|перемога над звичайним ботом — 1 очко;|a win over a standard bot — 1 point;
победа над лёгким ботом очков не даёт;|перемога над легким ботом очок не дає;|a win over an easy bot gives no points;
ничья с ботом очков не даёт.|нічия з ботом очок не дає.|a draw with a bot gives no points.
За столом на несколько человек очки дают за каждого, кто закончил хуже вас; за других победителей очков нет.|За столом на кілька людей очки дають за кожного, хто закінчив гірше за вас; за інших переможців очок немає.|At a multi-player table you get points for everyone who finished behind you; no points for other winners.
В игре пара на пару очки дают только за соперников, за напарника — нет.|У грі пара на пару очки дають лише за суперників, за напарника — ні.|In team play points are given only for opponents, not for your partner.
За поражение не отнимается ничего: играть и проигрывать не страшно.|За поразку не віднімається нічого: грати й програвати не страшно.|Nothing is taken away for a loss: playing and losing is nothing to fear.
С ботов можно набрать не больше 12 очков в сутки — во всех играх вместе. Иначе рейтинг выигрывал бы тот, кто дольше обыгрывает бота, а не тот, кто лучше играет с людьми.|З ботів можна набрати не більше 12 очок за добу — у всіх іграх разом. Інакше рейтинг вигравав би той, хто довше обігрує бота, а не той, хто краще грає з людьми.|You can earn at most 12 points a day from bots — across all games combined. Otherwise the leaderboard would go to whoever beats a bot the longest, not to whoever plays people best.
Здесь сравнивают лучшее время: чем быстрее решена головоломка, тем выше место.|Тут порівнюють найкращий час: чим швидше розв'язано головоломку, тим вище місце.|Best time is compared here: the faster the puzzle is solved, the higher the rank.
Здесь сравнивают лучший счёт: чем больше очков за одну игру, тем выше место.|Тут порівнюють найкращий результат: чим більше очок за одну гру, тим вище місце.|Best score is compared here: the more points in one game, the higher the rank.
У каждого игрока в таблице одна строка — его лучший результат.|У кожного гравця в таблиці один рядок — його найкращий результат.|Each player has one row in the table — their best result.
У каждого режима своя таблица: переключите режим сверху, чтобы увидеть другую.|У кожного режиму своя таблиця: перемкніть режим угорі, щоб побачити іншу.|Each mode has its own table: switch the mode at the top to see another one.
Стереть счёт партий? Рекорды останутся. Нажмите ещё раз, чтобы стереть, или «Назад», чтобы оставить.|Стерти рахунок партій? Рекорди залишаться. Натисніть ще раз, щоб стерти, або «Назад», щоб залишити.|Reset the game tally? Records will stay. Tap again to reset, or “Back” to keep it.
Доиграйте партию до конца — и здесь появится ваш счёт: сколько сыграно, сколько выиграно и с кем шло лучше.|Дограйте партію до кінця — і тут з'явиться ваш рахунок: скільки зіграно, скільки виграно і з ким ішло краще.|Finish a game — and your tally will appear here: how many played, how many won and who you did best against.
В счёт идут все законченные партии. Прерванные не считаются.|До рахунку йдуть усі закінчені партії. Перервані не рахуються.|All finished games count. Interrupted ones don't.
Сыграйте против другого соперника или за другим столом — здесь появится, где у вас выходит лучше.|Зіграйте проти іншого суперника або за іншим столом — тут з'явиться, де у вас виходить краще.|Play against another opponent or at another table — here you'll see where you do better.
Игра не смогла добраться до хранилища. Играть можно, но партии не запомнятся.|Гра не змогла дістатися до сховища. Грати можна, але партії не запам'ятаються.|The game couldn't reach the storage. You can play, but games won't be remembered.
рапид 10+0|рапід 10+0|rapid 10+0
классика 30+0|класика 30+0|classical 30+0
Сервер сейчас занят: слишком много начатых партий|Сервер зараз зайнятий: забагато розпочатих партій|The server is busy: too many games in progress
Сервер сейчас занят: слишком много начатых партий. Попробуйте через несколько минут|Сервер зараз зайнятий: забагато розпочатих партій. Спробуйте за кілька хвилин|The server is busy: too many games in progress. Try again in a few minutes
У вас уже открыто 2 стола для всех — закройте один, прежде чем открывать следующий|У вас уже відкрито 2 столи для всіх — закрийте один, перш ніж відкривати наступний|You already have 2 open tables — close one before opening another
Такую игру сервер пока не умеет. Обновите игру или выберите другую|Такої гри сервер поки не вміє. Оновіть гру або оберіть іншу|The server can't run this game yet. Update the game or pick another
Не получилось подобрать свободный код комнаты. Попробуйте создать партию ещё раз|Не вдалося підібрати вільний код кімнати. Спробуйте створити партію ще раз|Couldn't find a free room code. Try creating the game again
Сервер почти полон — места оставляем людям|Сервер майже заповнений — місця лишаємо людям|The server is almost full — we're keeping room for people
Такой игры сервер не знает|Такої гри сервер не знає|The server doesn't know this game
Парами играют только вчетвером|Парами грають лише вчотирьох|Pairs can only be played by four
Не указан код комнаты|Не вказано код кімнати|No room code given
Эта партия уже закрылась — слишком долго никто не входил. Попросите друга создать новую и продиктовать код заново|Ця партія вже закрилась — надто довго ніхто не заходив. Попросіть друга створити нову й продиктувати код заново|This game has already closed — nobody joined for too long. Ask your friend to create a new one and read out the code again
Комната с таким кодом не найдена|Кімнату з таким кодом не знайдено|No room with this code was found
Это стол другой игры — откройте её и введите код там|Це стіл іншої гри — відкрийте її та введіть код там|This is a table for another game — open it and enter the code there
Это стол турнира — за него сажает сам турнир|Це стіл турніру — за нього саджає сам турнір|This is a tournament table — the tournament seats players itself
В этой комнате партия уже началась — попросите создать новую|У цій кімнаті партія вже почалась — попросіть створити нову|The game in this room has already started — ask for a new one
В этой комнате уже играют двое|У цій кімнаті вже грають двоє|Two people are already playing in this room
За этим столом уже собрались все: свободных мест нет|За цим столом уже зібралися всі: вільних місць немає|Everyone has already gathered at this table: no free seats
Комната закрылась или пропуск не подходит — вернуться за этот стол нельзя|Кімната закрилася або перепустка не підходить — повернутися за цей стіл не можна|The room closed or the pass doesn't fit — you can't return to this table
Та партия уже закончилась — вернуться в неё нельзя|Та партія вже закінчилась — повернутися до неї не можна|That game has already ended — you can't return to it
Вернуться нельзя: партия за этим столом уже закончилась. За столом на двоих после ухода одного партия не продолжается|Повернутися не можна: партія за цим столом уже закінчилась. За столом на двох після виходу одного партія не продовжується|You can't return: the game at this table has ended. At a two-player table the game doesn't continue after one leaves
Вы не выходили из-за стола — возвращаться не нужно|Ви не виходили з-за столу — повертатися не потрібно|You haven't left the table — no need to return
За этим столом такого места нет|За цим столом такого місця немає|There is no such seat at this table
Это одно и то же место|Це те саме місце|That's the same seat
Оба места пустые — менять нечего|Обидва місця порожні — міняти нічого|Both seats are empty — nothing to swap
Карты уже розданы — стол теперь не поменять|Карти вже роздано — стіл тепер не змінити|The cards are dealt — the table can't be changed now
Эта партия закончена. Нажмите «Сыграть ещё» — стол останется прежним|Ця партія закінчена. Натисніть «Зіграти ще» — стіл залишиться тим самим|This game is over. Tap “Play again” — the table will stay the same
Напарники бывают только в игре парами, 2 на 2|Напарники бувають лише в грі парами, 2 на 2|Partners exist only in pairs play, 2 vs 2
Это вы сами|Це ви самі|That's you
Здесь пока никто не сидит|Тут поки ніхто не сидить|Nobody is sitting here yet
Пары ещё не сложились: играть парами можно, только когда за столом ровно четверо|Пари ще не склалися: грати парами можна, лише коли за столом рівно четверо|Pairs aren't formed yet: pairs play needs exactly four at the table
Этот игрок уже ваш напарник|Цей гравець уже ваш напарник|This player is already your partner
Слишком часто — подождите пару секунд|Надто часто — зачекайте кілька секунд|Too fast — wait a couple of seconds
Слишком много подряд — сделайте паузу|Надто багато поспіль — зробіть паузу|Too many in a row — take a break
Вы вышли из этой партии|Ви вийшли з цієї партії|You have left this game
Сервер пока не знает списка эмоций — обновите игру на сервере|Сервер поки не знає списку емоцій — оновіть гру на сервері|The server doesn't know the emote list yet — update the game on the server
Такого смайлика нет|Такого смайлика немає|There is no such emoji
Выберите, в кого бросить|Оберіть, у кого кинути|Choose who to throw at
Выберите, кому сказать|Оберіть, кому сказати|Choose who to talk to
За столом такого игрока нет|За столом такого гравця немає|There is no such player at the table
В себя бросать нельзя|У себе кидати не можна|You can't throw at yourself
Себе сказать нельзя|Собі казати не можна|You can't say it to yourself
Партия ещё не началась: ждём, когда хозяин комнаты нажмёт «Начать»|Партія ще не почалась: чекаємо, коли господар кімнати натисне «Почати»|The game hasn't started: waiting for the host to press “Start”
Соперник ещё не пришёл|Суперник ще не прийшов|The opponent hasn't arrived yet
Вы вышли из этой партии — ходить в ней больше нельзя|Ви вийшли з цієї партії — ходити в ній більше не можна|You have left this game — you can't move in it any more
Вас нет за этим столом|Вас немає за цим столом|You aren't at this table
В этой игре черновиков нет|У цій грі чернеток немає|This game has no drafts
Партия не идёт|Партія не триває|No game in progress
Вы вышли из партии|Ви вийшли з партії|You have left the game
Черновик не читается|Чернетку не вдається прочитати|The draft can't be read
Черновик не принят|Чернетку не прийнято|The draft was not accepted
В этой игре закончить партию по согласию пока нельзя|У цій грі завершити партію за згодою поки не можна|This game can't be ended by agreement yet
Партия сейчас не идёт — заканчивать нечего|Партія зараз не триває — закінчувати нічого|No game in progress — nothing to end
Закончить по согласию можно только за столом от трёх игроков. Вдвоём партию кончает сдача — она засчитывается как поражение.|Закінчити за згодою можна лише за столом від трьох гравців. Удвох партію закінчує здача — її зараховують як поразку.|Ending by agreement is possible only at a table of three or more. With two players, resigning ends the game — it counts as a loss.
Вы выбыли из партии — закончить её решают те, кто ещё играет|Ви вибули з партії — закінчити її вирішують ті, хто ще грає|You're out of the game — those still playing decide whether to end it
Вы уже вышли из игры — решают те, кто ещё играет|Ви вже вийшли з гри — вирішують ті, хто ще грає|You have already left — those still playing decide
Голосование о конце партии уже идёт|Голосування про кінець партії вже триває|A vote to end the game is already under way
Вы недавно предлагали закончить партию. Предложить снова можно через|Ви нещодавно пропонували закінчити партію. Запропонувати знову можна через|You proposed ending the game recently. You can propose again in
Не понял ответа: закончить партию или играть дальше|Не зрозумів відповіді: закінчити партію чи грати далі|Didn't get the answer: end the game or keep playing
Партия уже идёт — стол теперь не поменять|Партія вже триває — стіл тепер не змінити|The game is under way — the table can't be changed now
Стол собирает тот, кто создал комнату|Стіл збирає той, хто створив кімнату|Only the room's creator sets up the table
Не понял, что именно поменять за столом|Не зрозумів, що саме змінити за столом|Didn't get what to change at the table
Не понял, открыть стол для всех или закрыть|Не зрозумів, відкрити стіл для всіх чи закрити|Didn't get whether to open the table to everyone or close it
Игра парами бывает только вчетвером, и все четыре места уже заняты. Хотите играть большим кругом — сначала выключите игру парами|Гра парами буває лише вчотирьох, і всі чотири місця вже зайняті. Хочете грати більшим колом — спершу вимкніть гру парами|Pairs play needs exactly four, and all four seats are taken. To play in a bigger circle, turn pairs play off first
За столом нет свободных мест: больше шестерых не садится|За столом немає вільних місць: більше шести не сідає|No free seats: no more than six can sit at a table
Свободных мест нет: за столом их|Вільних місць немає: за столом їх|No free seats: the table has
поменяйте «Сколько игроков за столом»|змініть «Скільки гравців за столом»|change “How many players at the table”
Это место уже занято|Це місце вже зайняте|This seat is already taken
Соперник пока не найден — подождите ещё немного|Суперника поки не знайдено — зачекайте ще трохи|No opponent found yet — wait a little longer
На этом месте бота уже нет|На цьому місці бота вже немає|There is no bot at this seat any more
За столом нет ни одного бота|За столом немає жодного бота|There are no bots at the table
Игра парами бывает только вчетвером, а за столом|Гра парами буває лише вчотирьох, а за столом|Pairs play needs four, and at the table there are
Позовите друга по коду или посадите бота — или выключите игру парами|Покличте друга за кодом або посадіть бота — або вимкніть гру парами|Invite a friend by code or seat a bot — or turn pairs play off
Уберите лишнего бота или выключите игру парами|Приберіть зайвого бота або вимкніть гру парами|Remove the extra bot or turn pairs play off
Выключите игру парами — или пусть кто-то один выйдет из комнаты|Вимкніть гру парами — або нехай хтось один вийде з кімнати|Turn pairs play off — or let one person leave the room
Для выбранного режима нужны все|Для обраного режиму потрібні всі|The chosen mode needs all
игрока. Позовите друзей или посадите ботов.|гравців. Покличте друзів або посадіть ботів.|players. Invite friends or seat bots.
За столом пока только вы. Позовите друга по коду или посадите бота|За столом поки лише ви. Покличте друга за кодом або посадіть бота|Only you are at the table. Invite a friend by code or seat a bot
Партия ещё не закончена|Партія ще не закінчена|The game isn't over yet
Вы вышли из этой партии — чтобы сыграть ещё, начните новую|Ви вийшли з цієї партії — щоб зіграти ще, почніть нову|You have left this game — to play again, start a new one
Карты ещё не розданы — стол и так можно собирать|Карти ще не роздано — стіл і так можна збирати|Cards aren't dealt yet — the table can be set up anyway
Партия ещё идёт — стол пересоберём, когда она закончится|Партія ще триває — стіл перезберемо, коли вона закінчиться|The game is still on — we'll reset the table when it ends
Вы вышли из этой партии — чтобы играть дальше, начните новую|Ви вийшли з цієї партії — щоб грати далі, почніть нову|You have left this game — to keep playing, start a new one
Закреплённые гавани|Закріплені гавані|Fixed harbors
Случайные гавани|Випадкові гавані|Random harbors
Дружелюбный разбойник|Дружелюбний розбійник|Friendly robber
Обычный разбойник|Звичайний розбійник|Standard robber
Мягкий старт|М'який старт|Gentle start
Этот стол уже закрылся — выберите другой из списка|Цей стіл уже закрився — оберіть інший зі списку|This table has already closed — pick another from the list
Хозяин закрыл этот стол — выберите другой из списка|Господар закрив цей стіл — оберіть інший зі списку|The host closed this table — pick another from the list
За этим столом уже начали партию — выберите другой|За цим столом уже розпочали партію — оберіть інший|A game has already started at this table — pick another
За этот стол только что сели — свободных мест нет|За цей стіл щойно сіли — вільних місць немає|Someone just sat at this table — no free seats
Играйте в Telegram|Грайте в Telegram|Play in Telegram
Рейтинг, друзья и приглашения — всё сохранится|Рейтинг, друзі та запрошення — усе збережеться|Leaderboard, friends and invitations — everything is saved
Открыть в Telegram|Відкрити в Telegram|Open in Telegram
Партия с ботом засчитывается не чаще раза в сорок секунд|Партія з ботом зараховується не частіше ніж раз на сорок секунд|A game against a bot counts no more than once every forty seconds
На сегодня партий с ботом засчитано достаточно — снова завтра|На сьогодні партій з ботом зараховано достатньо — знову завтра|Enough games against bots have counted today — back tomorrow
На сегодня очки за ботов кончились — партии с ботом снова засчитаются завтра|На сьогодні очки за ботів скінчилися — партії з ботом знову зарахуються завтра|Today's points for bots are used up — games against bots count again tomorrow
Рейтинг по счёту ведётся только в Telegram|Рейтинг за рахунком ведеться лише в Telegram|The score leaderboard works only in Telegram
Бот|Бот|Bot
Вы походили|Ви пішли|You made a move
Вы подкинули карту|Ви підкинули карту|You added a card
Вы отбились|Ви відбилися|You defended
Вы перевели ход|Ви переказали хід|You passed the attack on
Вы бросили карту|Ви кинули карту|You threw in a card
Вы сказали «Беру»|Ви сказали «Беру»|You said “Take”
Вы больше не подкидываете|Ви більше не підкидаєте|You're done adding cards
Вы сказали «Бито»|Ви сказали «Бито»|You ended the attack
Время на ход вышло — ход сделан за вас|Час на хід вичерпано — хід зроблено за вас|Time's up — a move was made for you
Вы предложили сыграть ещё|Ви запропонували зіграти ще|You offered to play again
Вы вошли в комнату|Ви зайшли до кімнати|You joined the room
Вы снова за столом|Ви знову за столом|You are back at the table
Вы вышли из комнаты|Ви вийшли з кімнати|You left the room
Вы вышли из игры|Ви вийшли з гри|You left the game
Связь пропадала слишком долго — вас вывели из игры, друг не дождался|Зв'язок надто довго зникав — вас вивели з гри, друг не дочекався|Your connection was lost for too long — you were removed, your friend didn't wait
Связь пропадала слишком долго — вас вывели из игры, карты доигрывает бот|Зв'язок надто довго зникав — вас вивели з гри, карти доігрує бот|Your connection was lost for too long — you were removed, a bot is finishing your cards
Вы долго не ходили — пока за вас играет бот|Ви довго не ходили — поки за вас грає бот|You haven't moved for a while — a bot is playing for you for now
Вы снова играете сами|Ви знову граєте самі|You are playing on your own again
Вы завершили партию — засчитано поражение|Ви завершили партію — зараховано поразку|You ended the game — counted as a loss
Связь пропадала слишком долго — партия закончена, засчитано поражение|Зв'язок надто довго зникав — партію закінчено, зараховано поразку|Your connection was lost for too long — game over, counted as a loss
Два хода пропущены — поражение|Два ходи пропущено — поразка|Two moves missed — you lose
Вы посадили за стол бота|Ви посадили за стіл бота|You seated a bot at the table
Вы вернули всех в прихожую — стол собираем заново|Ви повернули всіх до передпокою — стіл збираємо заново|You sent everyone back to the lobby — setting up the table again
Вы убрали бота из-за стола|Ви прибрали бота зі столу|You removed the bot from the table
Вы поменяли игроков местами|Ви поміняли гравців місцями|You swapped the players' seats
Вы поменяли правила игры|Ви змінили правила гри|You changed the game rules
Вы открыли стол для подбора|Ви відкрили стіл для підбору|You opened the table for matchmaking
Вы закрыли стол для подбора|Ви закрили стіл для підбору|You closed the table for matchmaking
Вы сказали «Пас» — подкидывать до конца подхода больше нельзя|Ви сказали «Пас» — підкидати до кінця ходу більше не можна|You said “Pass” — no more adding cards this round
Играем ещё раз — карты розданы заново|Граємо ще раз — карти роздано заново|Playing again — cards dealt anew
Партия началась — карты розданы|Партія почалась — карти роздано|The game has started — cards dealt
Для игры 2 на 2 нужны четверо — ждём четвёртого игрока|Для гри 2 на 2 потрібні четверо — чекаємо четвертого гравця|2 vs 2 needs four players — waiting for the fourth
Согласия не набралось — играем дальше|Згоди не набралося — граємо далі|No agreement reached — playing on
На столе уже пять карт — больше подкидывать нельзя|На столі вже п'ять карт — більше підкидати не можна|Already five cards on the table — no more can be added
На столе уже шесть карт — больше подкидывать нельзя|На столі вже шість карт — більше підкидати не можна|Already six cards on the table — no more can be added
На столе уже пять карт — переводить некуда|На столі вже п'ять карт — переводити нікуди|Already five cards on the table — nowhere to pass the attack
На столе уже шесть карт — переводить некуда|На столі вже шість карт — переводити нікуди|Already six cards on the table — nowhere to pass the attack
У того, кто отбивается, меньше карт, чем неотбитых на столе — подкидывать нечего|У того, хто відбивається, менше карт, ніж невідбитих на столі — підкидати нічого|The defender has fewer cards than unbeaten ones on the table — nothing to add
Подкинуть можно только|Підкинути можна лише|You can only add
Перевести можно только|Перевести можна лише|You can only pass on with
Этой картой сейчас ходить нельзя|Цією картою зараз ходити не можна|You can't play this card now
Подкидывать может только соперник того, кто отбивается, — напарнику не подкидывают|Підкидати може лише суперник того, хто відбивається, — напарнику не підкидають|Only an opponent of the defender can add cards — not the defender's partner
Сейчас вы отбиваетесь, а не ходите|Зараз ви відбиваєтеся, а не ходите|You are defending now, not attacking
Такой карты у вас нет|Такої карти у вас немає|You don't have that card
Сейчас отбиваться нечего|Зараз відбиватися нічого|Nothing to defend against now
Такой карты на столе нет|Такої карти на столі немає|That card isn't on the table
Эта карта уже отбита|Ця карта вже відбита|That card is already beaten
Эта карта не бьёт: нужна старше той же масти или козырь|Ця карта не б'є: потрібна старша тієї ж масті або козир|This card doesn't beat it: you need a higher card of the same suit or a trump
Так отбиться нельзя|Так відбитися не можна|You can't defend that way
Переводить поздно: вы уже отбили карту в этом подходе|Переводити пізно: ви вже відбили карту в цьому ході|Too late to pass on: you've already beaten a card this round
У следующего игрока слишком мало карт — ему такой стол не отбить|У наступного гравця надто мало карт — йому такий стіл не відбити|The next player has too few cards — they can't beat such a table
В этой партии перевод не играется|У цій партії переведення не використовується|Passing the attack isn't allowed in this game
Переводить сейчас нечего|Переводити зараз нічого|Nothing to pass on now
Брать сейчас нечего|Брати зараз нічого|Nothing to take now
Брать сейчас нельзя|Брати зараз не можна|You can't take now
Сейчас подход закончить нельзя: на столе есть неотбитая карта|Зараз закінчити хід не можна: на столі є невідбита карта|You can't end the round now: there's an unbeaten card on the table
Подход уже закончен|Хід уже закінчено|The round is already over
Партия ещё не началась|Партія ще не почалась|The game hasn't started yet
Партия уже закончена|Партія вже закінчена|The game is already over
Непонятное действие|Незрозуміла дія|Unknown action
Вы вышли из этой партии — у вас кончились карты|Ви вийшли з цієї партії — у вас скінчилися карти|You are out of this game — you ran out of cards
Сейчас ход другого игрока|Зараз хід іншого гравця|It's another player's turn
Не понял, какой картой вы ходите|Не зрозумів, якою картою ви ходите|Didn't get which card you're playing
Не понял, какой картой вы отбиваетесь|Не зрозумів, якою картою ви відбиваєтеся|Didn't get which card you're defending with
Не понял, какую карту на столе вы бьёте|Не зрозумів, яку карту на столі ви б'єте|Didn't get which card on the table you're beating
Не понял, какой картой вы переводите|Не зрозумів, якою картою ви переказуєте|Didn't get which card you're passing with
Не понял, какую карту вы бросаете|Не зрозумів, яку карту ви кидаєте|Didn't get which card you're throwing in
Не понял, в каком подходе вы бросаете|Не зрозумів, у якому ході ви кидаєте|Didn't get which round you're throwing in
Стол уже уехал — тот подход закончился, карта осталась у вас|Стіл уже поїхав — той хід закінчився, карта залишилась у вас|The table has moved on — that round ended, the card stayed with you
`;
  const шаблоны = [
    [/^(.+) предлагает закончить партию$/, '$1 пропонує закінчити партію', '$1 offers to end the game'],
    [/^Вернуться к игре с (.+)$/, 'Повернутися до гри з $1', 'Back to the game with $1'],
    [/^Место (\d+) выбрано\. Нажмите второе место — они поменяются\.$/, 'Місце $1 обрано. Натисніть друге місце — вони поміняються.', 'Seat $1 selected. Tap a second seat — they will swap.'],
    [/^Ваш напарник — место (\d+), оно пока пустое\.$/, 'Ваш напарник — місце $1, воно поки порожнє.', 'Your partner — seat $1, it is empty for now.'],
    [/^Ваш напарник — место (\d+)$/, 'Ваш напарник — місце $1', 'Your partner — seat $1'],
    [/^Вы в паре с: (.+)$/, 'Ви в парі з: $1', 'You are paired with: $1'],
    [/^Это стол игры «(.+)», а сейчас открыт «(.+)»\.$/, 'Це стіл гри «$1», а зараз відкрито «$2».', 'This is a table of “$1”, but “$2” is open now.'],
    [/^Откройте «(.+)» и введите код там\.$/, 'Відкрийте «$1» і введіть код там.', 'Open “$1” and enter the code there.'],
    [/^Открыть «(.+)»$/, 'Відкрити «$1»', 'Open “$1”'],
    [/^Место (\d+)$/, 'Місце $1', 'Seat $1'],
    [/^(\d+) место$/, '$1 місце', 'Rank $1'],
    [/^\+(\d+) к рейтингу$/, '+$1 до рейтингу', '+$1 to your rating'],
    [/^До (\d+) очков$/, 'До $1 очок', 'Up to $1 points'],
    [/^(\d+) с на ход$/, '$1 с на хід', '$1 s per turn'],
    [/^Место за сутки выросло на (\d+)$/, 'Місце за добу зросло на $1', 'Rank up by $1 over the last day'],
    [/^Место за сутки упало на (\d+)$/, 'Місце за добу впало на $1', 'Rank down by $1 over the last day'],
    [/^Число может гулять примерно на ±(.+)\.$/, 'Число може коливатися приблизно на ±$1.', 'The number may swing by about ±$1.'],
    [/^Пока это прикидка: настоящая сила где-то в пределах ±(.+)\.$/, 'Поки це прикидка: справжня сила десь у межах ±$1.', 'This is a rough guess for now: your real skill is within about ±$1.'],
    [/^Последняя партия: (\S+) → (\S+)$/, 'Остання партія: $1 → $2', 'Last game: $1 → $2'],
    [/^Последняя партия: (\S+) → (\S+) \((.+)\)$/, 'Остання партія: $1 → $2 ($3)', 'Last game: $1 → $2 ($3)'],
    [/^Сила (≈?)(\S+)$/, 'Сила $1$2', 'Skill $1$2'],
    [/^Счёт ведётся с (.+)\.$/, 'Рахунок ведеться з $1.', 'Tally kept since $1.'],
    [/^последние (\d+)$/, 'останні $1', 'last $1'],
    [/^(\d+)% побед$/, '$1% перемог', '$1% wins'],
    [/^Побед (\d+)%$/, 'Перемог $1%', 'Wins $1%'],
    [/^лучшая серия (\d+)$/, 'найкраща серія $1', 'best streak $1'],
    [/^сейчас (\d+) подряд$/, 'зараз $1 поспіль', '$1 in a row now'],
    [/^Рейтинг «(.+)»$/, 'Рейтинг «$1»', 'Leaderboard “$1”'],
    [/^Результаты только в игре «(.+)»$/, 'Результати лише в грі «$1»', 'Results only in “$1”'],
    [/^Лучшее время в игре «(.+)»$/, 'Найкращий час у грі «$1»', 'Best time in “$1”'],
    [/^Лучший счёт в игре «(.+)»$/, 'Найкращий результат у грі «$1»', 'Best score in “$1”'],
    [/^Вы сходили (.+)$/, 'Ви пішли $1', 'You played $1'],
    [/^Вы подкинули (.+)$/, 'Ви підкинули $1', 'You added $1'],
    [/^Вы отбили (.+) картой (.+)$/, 'Ви відбили $1 картою $2', 'You beat $1 with $2'],
    [/^Вы перевели ход картой (.+)$/, 'Ви переказали хід картою $1', 'You passed the attack on with $1'],
    [/^Вы бросили (.+)$/, 'Ви кинули $1', 'You threw in $1'],
    [/^Свободных мест нет: за столом их (\d+), столько вы и выбрали\. Хотите играть большим кругом — поменяйте «Сколько игроков за столом»$/,
      'Вільних місць немає: за столом їх $1, стільки ви й обрали. Хочете грати більшим колом — змініть «Скільки гравців за столом»',
      'No free seats: the table has $1, as many as you chose. To play in a bigger circle, change “How many players at the table”'],
    [/^Игра парами бывает только вчетвером, а за столом (\d+)\. Позовите друга по коду или посадите бота — или выключите игру парами$/,
      'Гра парами буває лише вчотирьох, а за столом $1. Покличте друга за кодом або посадіть бота — або вимкніть гру парами',
      'Pairs play needs four, and the table has $1. Invite a friend by code or seat a bot — or turn pairs play off'],
    [/^Игра парами бывает только вчетвером, а за столом (\d+)\. Уберите лишнего бота или выключите игру парами$/,
      'Гра парами буває лише вчотирьох, а за столом $1. Приберіть зайвого бота або вимкніть гру парами',
      'Pairs play needs four, and the table has $1. Remove the extra bot or turn pairs play off'],
    [/^Игра парами бывает только вчетвером, а за столом (\d+)\. Выключите игру парами — или пусть кто-то один выйдет из комнаты$/,
      'Гра парами буває лише вчотирьох, а за столом $1. Вимкніть гру парами — або нехай хтось один вийде з кімнати',
      'Pairs play needs four, and the table has $1. Turn pairs play off — or let one person leave the room'],
    [/^Для выбранного режима нужны все (\d+) игрока\. Позовите друзей или посадите ботов\.$/,
      'Для обраного режиму потрібні всі $1 гравці. Покличте друзів або посадіть ботів.',
      'The chosen mode needs all $1 players. Invite friends or seat bots.']
  ];

  /* Дальше шаблоны собираются циклами: русские слова меняются по числу (1 / 2–4 / 5+), и у украинских
     слов те же три формы, поэтому на каждую русскую форму — свой шаблон. Выражение с «.+» тут
     не годится: переводить слово по найденной форме шаблон сам не умеет. */
  const ЧИСЛО = '([\\d\\s\\u00a0\\u202f]+)';
  const добавитьШаблон = (выражение, uk, en) => шаблоны.push([new RegExp(выражение), uk, en]);

  // «Всего в таблице 12 игроков.» и «… У вас 30 очков: 3 победы в 5 партиях.»
  const ИГРОКИ = [['игрок', 'гравець', 'player'], ['игрока', 'гравці', 'players'], ['игроков', 'гравців', 'players']];
  const ОЧКИ = [['очко', 'очко', 'point'], ['очка', 'очки', 'points'], ['очков', 'очок', 'points']];
  const ПОБЕДЫ = [['победа', 'перемога', 'win'], ['победы', 'перемоги', 'wins'], ['побед', 'перемог', 'wins']];
  const ПАРТИИ = [['партии', 'партії', 'game'], ['партиях', 'партіях', 'games']];
  for (const [игРу, игУк, игАнгл] of ИГРОКИ) {
    добавитьШаблон('^Всего в таблице ' + ЧИСЛО + ' ' + игРу + '\\.$',
      'Усього в таблиці $1 ' + игУк + '.', 'Total in the table: $1 ' + игАнгл + '.');
    добавитьШаблон('^В рейтинг попадают после первой доигранной партии — доиграйте одну, и ваша строка появится здесь сама\\. Всего в таблице ' + ЧИСЛО + ' ' + игРу + '\\.$',
      'У рейтинг потрапляють після першої дограної партії — догрийте одну, і ваш рядок з\'явиться тут сам. Усього в таблиці $1 ' + игУк + '.',
      'You get into the leaderboard after your first finished game — finish one and your row will appear here by itself. Total in the table: $1 ' + игАнгл + '.');
    добавитьШаблон('^(\\d+) место в таблице силы\\. Всего в ней ' + ЧИСЛО + ' ' + игРу + '\\.$',
      '$1 місце в таблиці сили. Усього в ній $2 ' + игУк + '.', 'Rank $1 in the skill table. $2 ' + игАнгл + ' in total.');
    for (const [очРу, очУк, очАнгл] of ОЧКИ) {
      for (const [побРу, побУк, побАнгл] of ПОБЕДЫ) {
        for (const [парРу, парУк, парАнгл] of ПАРТИИ) {
          добавитьШаблон('^Всего в таблице ' + ЧИСЛО + ' ' + игРу + '\\. У вас ' + ЧИСЛО + ' ' + очРу + ': ' + ЧИСЛО + ' ' + побРу + ' в ' + ЧИСЛО + ' ' + парРу + '\\.$',
            'Усього в таблиці $1 ' + игУк + '. У вас $2 ' + очУк + ': $3 ' + побУк + ' у $4 ' + парУк + '.',
            'Total in the table: $1 ' + игАнгл + '. You have $2 ' + очАнгл + ': $3 ' + побАнгл + ' in $4 ' + парАнгл + '.');
        }
      }
    }
  }
  // Счёт партий: «5 из 8 партий», «8 партий».
  for (const [ру, ук] of [['партия', 'партія'], ['партии', 'партії'], ['партий', 'партій']]) {
    добавитьШаблон('^(\\d+) из (\\d+) ' + ру + '$', '$1 з $2 ' + ук, '$1 of $2 games');
    добавитьШаблон('^(\\d+) ' + ру + '$', '$1 ' + ук, '$1 games');
  }
  добавитьШаблон('^1 партия$', '1 партія', '1 game');
  // Сравнение с соперником по последней партии (имя и число силы не переводятся).
  for (const [ру, ук, ан] of [['сильнее', 'грав сильніше за вас', 'played stronger than you'],
    ['слабее', 'грав слабше за вас', 'played weaker than you'], ['вровень с вами', 'грав нарівні з вами', 'played on par with you']]) {
    добавитьШаблон('^(.+) — играл ' + ру + '(?: вас)?$', '$1 — ' + ук, '$1 — ' + ан);
    добавитьШаблон('^(.+) — играл ' + ру + '(?: вас)? \\(сила (.+)\\)$', '$1 — ' + ук + ' (сила $2)', '$1 — ' + ан + ' (skill $2)');
  }
  // «Предложить снова можно через 2 минуты».
  const ПРИЧИНА_ПРЕДЛОЖЕНИЯ = 'Вы недавно предлагали закончить партию. Предложить снова можно через ';
  for (const [ру, ук, ан] of [['минуту', 'хвилину', 'minute'], ['минуты', 'хвилини', 'minutes'], ['минут', 'хвилин', 'minutes'],
    ['секунду', 'секунду', 'second'], ['секунды', 'секунди', 'seconds'], ['секунд', 'секунд', 'seconds']]) {
    добавитьШаблон('^' + ПРИЧИНА_ПРЕДЛОЖЕНИЯ + '(\\d+) ' + ру + '$',
      'Ви нещодавно пропонували закінчити партію. Запропонувати знову можна через $1 ' + ук,
      'You proposed ending the game recently. You can propose again in $1 ' + ан);
  }
  // Сообщения сервера о событиях за столом: «<имя> <действие>». Имя не переводится.
  const СОБЫТИЯ_ЗА_СТОЛОМ = [
    ['кладёт карту', 'кладе карту', 'plays a card'],
    ['подкидывает карту', 'підкидає карту', 'adds a card'],
    ['отбивает карту', 'відбиває карту', 'beats a card'],
    ['переводит ход', 'переказує хід', 'passes the attack on'],
    ['бросает карту', 'кидає карту', 'throws in a card'],
    ['говорит «Беру»', 'каже «Беру»', 'says “Take”'],
    ['больше не подкидывает', 'більше не підкидає', 'is done adding cards'],
    ['не подкидывает', 'не підкидає', 'is not adding cards'],
    ['говорит «Бито»', 'каже «Бито»', 'ends the attack'],
    ['забирает карты со стола', 'забирає карти зі столу', 'takes the cards from the table'],
    ['не успевает — ход сделан автоматически', 'не встигає — хід зроблено автоматично', 'ran out of time — a move was made automatically'],
    ['предлагает сыграть ещё', 'пропонує зіграти ще', 'offers to play again'],
    ['входит в комнату', 'заходить до кімнати', 'joins the room'],
    ['возвращается за стол — дальше играет вместо бота', 'повертається за стіл — далі грає замість бота', 'returns to the table — plays instead of the bot'],
    ['выходит из комнаты', 'виходить з кімнати', 'leaves the room'],
    ['выходит из игры — партия закончена', 'виходить з гри — партію закінчено', 'leaves the game — the game is over'],
    ['выходит из игры — партию доигрывает бот', 'виходить з гри — партію доігрує бот', 'leaves the game — a bot finishes it'],
    ['пропадает со связи слишком надолго — партия закончена, ждать дальше нельзя', 'зникає зі зв\'язку надто надовго — партію закінчено, чекати далі не можна', 'lost connection for too long — the game is over, no more waiting'],
    ['пропадает со связи слишком надолго — карты доигрывает бот', 'зникає зі зв\'язку надто надовго — карти доігрує бот', 'lost connection for too long — a bot finishes the cards'],
    ['снова играет — без бота', 'знову грає — без бота', 'is playing again — without the bot'],
    ['завершает партию — победа ваша', 'завершує партію — перемога ваша', 'ends the game — you win'],
    ['пропадает со связи — победа ваша', 'зникає зі зв\'язку — перемога ваша', 'lost connection — you win'],
    ['пропускает два хода подряд — победа ваша', 'пропускає два ходи поспіль — перемога ваша', 'missed two moves in a row — you win'],
    ['сажает за стол бота', 'саджає за стіл бота', 'seats a bot at the table'],
    ['возвращает всех в прихожую — стол собирают заново', 'повертає всіх до передпокою — стіл збирають заново', 'sends everyone back to the lobby — the table is set up again'],
    ['меняет игроков местами', 'міняє гравців місцями', 'swaps the players\' seats'],
    ['меняет правила игры', 'змінює правила гри', 'changes the game rules'],
    ['открывает стол для подбора', 'відкриває стіл для підбору', 'opens the table for matchmaking'],
    ['закрывает стол для подбора', 'закриває стіл для підбору', 'closes the table for matchmaking']
  ];
  for (const [ру, ук, ан] of СОБЫТИЯ_ЗА_СТОЛОМ) добавитьШаблон('^(.+) ' + ру + '$', '$1 ' + ук, '$1 ' + ан);
  // События с названием карты и числом карт.
  for (const [ру, ук] of [['карту', 'карту'], ['карты', 'карти'], ['карт', 'карт']]) {
    const англ = ру === 'карту' ? 'card' : 'cards';
    добавитьШаблон('^(.+) забирает карты со стола — (\\d+) ' + ру + '$', '$1 забирає карти зі столу — $2 ' + ук, '$1 takes the cards from the table — $2 ' + англ);
    добавитьШаблон('^(.+) говорит «Бито» — в отбой (\\d+) ' + ру + '$', '$1 каже «Бито» — у відбій $2 ' + ук, '$1 ends the attack — $2 ' + англ + ' discarded');
    добавитьШаблон('^Вы сказали «Бито» — в отбой (\\d+) ' + ру + '$', 'Ви сказали «Бито» — у відбій $1 ' + ук, 'You ended the attack — $1 ' + англ + ' discarded');
  }
  добавитьШаблон('^(.+) подкидывает (.+)$', '$1 підкидає $2', '$1 adds $2');
  добавитьШаблон('^(.+) отбивает (.+) картой (.+)$', '$1 відбиває $2 картою $3', '$1 beats $2 with $3');
  добавитьШаблон('^(.+) переводит ход картой (.+)$', '$1 переказує хід картою $2', '$1 passes the attack on with $2');
  добавитьШаблон('^(.+) бросает (.+)$', '$1 кидає $2', '$1 throws in $2');
  // «Подкинуть можно только шестёрку или короля»: названия достоинств в винительном падеже, до двух штук.
  const ДОСТОИНСТВА = [['двойку', 'двійку', 'a two'], ['тройку', 'трійку', 'a three'], ['четвёрку', 'четвірку', 'a four'],
    ['пятёрку', 'п\'ятірку', 'a five'], ['шестёрку', 'шістку', 'a six'], ['семёрку', 'сімку', 'a seven'],
    ['восьмёрку', 'вісімку', 'an eight'], ['девятку', 'дев\'ятку', 'a nine'], ['десятку', 'десятку', 'a ten'],
    ['валета', 'валета', 'a jack'], ['даму', 'даму', 'a queen'], ['короля', 'короля', 'a king'], ['туза', 'туза', 'an ace']];
  for (const [началоРу, началоУк, началоАнгл] of [['Подкинуть можно только ', 'Підкинути можна лише ', 'You can only add '],
    ['Перевести можно только ', 'Перевести можна лише ', 'You can only pass on with ']]) {
    for (const [а, аУк, аАнгл] of ДОСТОИНСТВА) {
      добавитьШаблон('^' + началоРу + а + '$', началоУк + аУк, началоАнгл + аАнгл);
      for (const [б, бУк, бАнгл] of ДОСТОИНСТВА) {
        if (а === б) continue;
        добавитьШаблон('^' + началоРу + а + ' или ' + б + '$', началоУк + аУк + ' або ' + бУк, началоАнгл + аАнгл + ' or ' + бАнгл);
      }
    }
  }
  // Названия игр и фразы рейтинга с падежами: «Рейтинг Дурака», «Результаты только в игре «Дурак»».
  const ИГРЫ_РЕЙТИНГА = [
    ['Дурак', 'Дурень', 'Durak', 'Дурака', 'Дурня'], ['Шахматы', 'Шахи', 'Chess', 'Шахмат', 'Шахів'],
    ['Шашки', 'Шашки', 'Checkers', 'Шашек', 'Шашок'], ['Нарды', 'Нарди', 'Backgammon', 'Нард', 'Нард'],
    ['Деберц', 'Деберц', 'Deberts', 'Деберца', 'Деберца'], ['Домино', 'Доміно', 'Dominoes', 'Домино', 'Доміно'],
    ['Морской бой', 'Морський бій', 'Battleship', 'Морского боя', 'Морського бою'],
    ['Катан', 'Катан', 'Catan', 'Катана', 'Катана'], ['Монополия', 'Монополія', 'Monopoly', 'Монополии', 'Монополії'],
    ['Покер', 'Покер', 'Poker', 'Покера', 'Покера'], ['Бастион прилива', 'Бастіон припливу', 'Tide Bastion', 'Бастиона прилива', 'Бастіону припливу'],
    ['Захват', 'Захоплення', 'Conquest', 'Захвата', 'Захоплення']
  ];
  const ИГРЫ_СО_СЧЁТОМ = [
    ['Судоку', 'Судоку', 'Sudoku'], ['2048', '2048', '2048'], ['Японский кроссворд', 'Японський кросворд', 'Nonogram'],
    ['Блоки 8×8', 'Блоки 8×8', 'Blocks 8×8'], ['Три в ряд', 'Три в ряд', 'Match three'], ['Поиск слов', 'Пошук слів', 'Word search'],
    ['Пятнашки', 'П\'ятнашки', 'Fifteen puzzle'], ['Змейка', 'Змійка', 'Snake'], ['Сапёр', 'Сапер', 'Minesweeper']
  ];
  const собранныеСтроки = [];
  for (const [ру, ук, ан, родРу, родУк] of ИГРЫ_РЕЙТИНГА) {
    собранныеСтроки.push('Рейтинг ' + родРу + '|Рейтинг ' + родУк + '|' + ан + ' leaderboard');
    собранныеСтроки.push('Результаты только в игре «' + ру + '»|Результати лише в грі «' + ук + '»|Results only in “' + ан + '”');
  }
  for (const [ру, ук, ан] of ИГРЫ_СО_СЧЁТОМ) {
    собранныеСтроки.push('Рейтинг «' + ру + '»|Рейтинг «' + ук + '»|' + ан + ' leaderboard');
    собранныеСтроки.push('Лучшее время в игре «' + ру + '»|Найкращий час у грі «' + ук + '»|Best time in “' + ан + '”');
    собранныеСтроки.push('Лучший счёт в игре «' + ру + '»|Найкращий результат у грі «' + ук + '»|Best score in “' + ан + '”');
  }
  Языки.добавить(собранныеСтроки.join('\n'));
  Языки.добавить(строки);
  Языки.добавитьШаблоны(шаблоны);
  if (typeof module !== 'undefined' && module.exports) module.exports = { строки, шаблоны };
})(typeof window === 'undefined' ? globalThis : window);
