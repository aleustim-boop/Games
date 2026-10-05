/* Словарь страницы «Бастион»: html, экран, острова, башни, враги, подсказки.
   Ключ — русская фраза как её видит игрок; строка «русский|українська|English».
   Общий переводчик режет фразу по « · » и переводит куски отдельно — шаблоны ниже работают на куски.
   Проверка: tests/языки-бастион.js. */
(function (корень) {
  'use strict';
  const Языки = typeof module !== 'undefined' && module.exports ? require('./языки') : корень.Языки;
  const строки = `
Ближайшие острова|Найближчі острови|Nearby islands
Сложность|Складність|Difficulty
Разделы игры|Розділи гри|Game sections
Правила игры|Правила гри|Game rules
Пауза|Пауза|Pause
Скорость игры|Швидкість гри|Game speed
Карта обороны. Выберите площадку для башни.|Мапа оборони. Виберіть майданчик для вежі.|Defense map. Choose a spot for a tower.
Строительство и улучшение|Будівництво та вдосконалення|Building and upgrades
Вернуться к полю|Повернутися до поля|Back to the field
Бастион прилива — оборона маяка|Бастіон припливу — оборона маяка|Tide Bastion — lighthouse defense
ИГРЫ С ДРУЗЬЯМИ|ІГРИ З ДРУЗЯМИ|GAMES WITH FRIENDS
Бастион|Бастіон|Bastion
Хранитель маяка|Охоронець маяка|Lighthouse keeper
Продолжить оборону|Продовжити оборону|Continue defense
ЛАЗУРНЫЙ БЕРЕГ · ОСТРОВ 1|ЛАЗУРНИЙ БЕРЕГ · ОСТРІВ 1|AZURE COAST · ISLAND 1
Тихая гавань|Тиха гавань|Quiet Harbor
Защитите маяк · 8 волн|Захистіть маяк · 8 хвиль|Defend the lighthouse · 8 waves
Спокойный|Спокійний|Calm
Тактический|Тактичний|Tactical
Штормовой|Штормовий|Stormy
Начать оборону|Почати оборону|Start defense
Выбрать остров|Обрати острів|Choose island
Арсенал|Арсенал|Arsenal
Результаты|Результати|Results
МАЯК|МАЯК|LIGHTHOUSE
ЗОЛОТО|ЗОЛОТО|GOLD
ВОЛНА|ХВИЛЯ|WAVE
ОБОРОНА ПРИОСТАНОВЛЕНА|ОБОРОНУ ПРИЗУПИНЕНО|DEFENSE PAUSED
Маяк подождёт|Маяк зачекає|The lighthouse can wait
Продолжить ▶|Продовжити ▶|Resume ▶
Сохранить и в лобби|Зберегти й до лобі|Save and go to lobby
Подготавливаем остров…|Готуємо острів…|Preparing the island…
Подготовка обороны|Підготовка оборони|Defense preparation
Снять выбор ×|Зняти вибір ×|Clear selection ×
Нажмите на площадку с «+» и выберите башню.|Натисніть на майданчик із «+» й виберіть вежу.|Tap a spot with «+» and choose a tower.
Скрыть|Сховати|Hide
СЛЕДУЮЩАЯ ВОЛНА|НАСТУПНА ХВИЛЯ|NEXT WAVE
Удар маяка|Удар маяка|Lighthouse strike
Выберите цель|Виберіть ціль|Choose a target
Прилив|Приплив|Tide
Замедлить всех|Уповільнити всіх|Slow everyone
Начать волну 1 →|Почати хвилю 1 →|Start wave 1 →
Партия сохраняется на этом устройстве|Партія зберігається на цьому пристрої|The game is saved on this device
Пока выбираете — бой приостановлен|Поки обираєте — бій призупинено|The battle is paused while you choose
Разведка берега|Розвідка берега|Coast scouting
Первый рубеж. Поставьте башню возле длинного участка дороги.|Перший рубіж. Поставте вежу біля довгої ділянки дороги.|First line. Place a tower near the long stretch of road.
Быстрые паруса|Швидкі вітрила|Fast sails
Разведчики бегут быстрее. Баллиста достаёт их на повороте.|Розвідники біжать швидше. Баліста дістає їх на повороті.|Scouts run faster. The ballista reaches them at the bend.
Броня с моря|Броня з моря|Armor from the sea
Бронекрабы выдерживают обычные стрелы. Взрыв и замедление работают вместе.|Бронекраби витримують звичайні стріли. Вибух і уповільнення працюють разом.|Armor crabs withstand ordinary arrows. Explosions and slowing work together.
Плотный строй|Щільний стрій|Tight formation
Группы идут близко друг к другу. Мортира поражает сразу несколько целей.|Групи йдуть близько одна до одної. Мортира вражає одразу кілька цілей.|Groups move close together. The mortar hits several targets at once.
Два темпа|Два темпи|Two paces
Быстрые разведчики догоняют тяжёлый авангард. Подготовьте второй рубеж.|Швидкі розвідники наздоганяють важкий авангард. Підготуйте другий рубіж.|Fast scouts catch up with the heavy vanguard. Prepare a second line.
Прорыв|Прорив|Breakthrough
Не отдавайте все способности первой группе: следом идёт ещё одна.|Не витрачайте всі здібності на першу групу: слідом іде ще одна.|Don't spend all your abilities on the first group: another one follows.
Последний рубеж|Останній рубіж|Last line
Усильте готовые башни и проверьте их приоритеты целей.|Посильте готові вежі та перевірте їхні пріоритети цілей.|Strengthen your towers and check their target priorities.
Оборона маяка|Оборона маяка|Lighthouse defense
Последняя волна. Сохраните удар маяка для самой опасной группы.|Остання хвиля. Збережіть удар маяка для найнебезпечнішої групи.|The last wave. Save the lighthouse strike for the most dangerous group.
Повелитель шторма|Володар шторму|Storm lord
Атака с морского настила.|Атака з морського настилу.|Attack from the sea deck.
Одновременная атака с двух причалов.|Одночасна атака з двох причалів.|Simultaneous attack from two piers.
Перед щитом адмирал останавливается и поднимает молот; золотое кольцо предупреждает об ударе. Щит гасит половину урона на 3 секунды — дождитесь его спада для удара маяка.|Перед щитом адмірал зупиняється й піднімає молот; золоте кільце попереджає про удар. Щит гасить половину шкоди на 3 секунди — дочекайтеся його спаду для удару маяка.|Before the shield the admiral stops and raises his hammer; a golden ring warns of the blow. The shield absorbs half the damage for 3 seconds — wait for it to drop before the lighthouse strike.
Прилив открывает причал|Приплив відкриває причал|The tide opens a pier
Новая группа выйдет по морскому настилу. Голубая линия показывает её путь до запуска волны.|Нова група вийде морським настилом. Блакитна лінія показує її шлях до запуску хвилі.|A new group will come along the sea deck. The blue line shows its path before the wave starts.
Западный причал|Західний причал|West pier
Главная дорога|Головна дорога|Main road
Враги выйдут с запада, минуя первый рубеж. Голубая линия показывает маршрут.|Вороги вийдуть із заходу, оминаючи перший рубіж. Блакитна лінія показує маршрут.|Enemies will come from the west, bypassing the first line. The blue line shows the route.
Вход снова на главной дороге. Проверьте охват башен перед запуском.|Вхід знову на головній дорозі. Перевірте охоплення веж перед запуском.|The entrance is back on the main road. Check your towers' coverage before starting.
Два фронта|Два фронти|Two fronts
Враги чередуют главный и восточный причалы. Защитите общий участок перед маяком; приоритет «Первый» выбирает ближайшего к выходу.|Вороги чергують головний і східний причали. Захистіть спільну ділянку перед маяком; пріоритет «Перший» обирає найближчого до виходу.|Enemies alternate between the main and east piers. Defend the shared stretch before the lighthouse; the «First» priority picks the one closest to the exit.
Разведчики прошли оборону. Добавьте баллисту ближе к выходу или замедление на длинном участке.|Розвідники пройшли оборону. Додайте баліст ближче до виходу або уповільнення на довгій ділянці.|Scouts got through. Add a ballista closer to the exit or slowing on the long stretch.
Бронекрабы выдержали обстрел. Попробуйте тяжёлую баллисту с пробитием или осадную мортиру.|Бронекраби витримали обстріл. Спробуйте важку баліст із пробиттям або облогову мортиру.|Armor crabs survived the barrage. Try a heavy ballista with piercing or a siege mortar.
Щитоносцы отвлекли огонь. Поставьте башне приоритет «Броня» и добавьте урон по площади.|Щитоносці відвернули вогонь. Поставте вежі пріоритет «Броня» й додайте шкоду по площі.|Shield-bearers drew the fire. Set a tower to the «Armor» priority and add area damage.
Хранители восстанавливают здоровье группе. Направляйте удар маяка в хранителя вместе с его спутниками; горение помогает компенсировать лечение.|Охоронці відновлюють здоров'я групі. Спрямовуйте удар маяка в охоронця разом з його супутниками; горіння допомагає компенсувати лікування.|Wardens heal the group. Aim the lighthouse strike at a warden together with its companions; burning helps offset the healing.
Адмирал дошёл до маяка. Держите тяжёлые башни на приоритете «Сильный» и берегите способность до спада щита.|Адмірал дійшов до маяка. Тримайте важкі вежі на пріоритеті «Сильний» і бережіть здібність до спаду щита.|The admiral reached the lighthouse. Keep heavy towers on the «Strong» priority and save your ability until the shield drops.
Обычная группа прорвалась. Разместите мортиру рядом с приливом и улучшите узел обороны.|Звичайна група прорвалася. Розмістіть мортиру поруч із припливом і вдосконаліть вузол оборони.|An ordinary group broke through. Place a mortar next to the tide tower and upgrade the defense point.
Баллиста|Баліста|Ballista
Точный дальний выстрел. Надёжна против быстрых целей.|Точний дальній постріл. Надійна проти швидких цілей.|Precise long-range shot. Reliable against fast targets.
Тяжёлый арбалет|Важкий арбалет|Heavy crossbow
Пробивает броню · урон ×1,9|Пробиває броню · шкода ×1,9|Pierces armor · damage ×1.9
Батарея|Батарея|Battery
Выстрелы вдвое чаще|Постріли вдвічі частіше|Shots twice as often
Мортира|Мортира|Mortar
Взрыв по группе. Поставьте рядом с замедлением.|Вибух по групі. Поставте поруч з уповільненням.|Explosion hits a group. Place it next to a slowing tower.
Осадное орудие|Облогова гармата|Siege cannon
Снимает броню на 4 с · урон ×1,5|Знімає броню на 4 с · шкода ×1,5|Strips armor for 4 s · damage ×1.5
Кассетный залп|Касетний залп|Cluster volley
Радиус взрыва ×1,6|Радіус вибуху ×1,6|Blast radius ×1.6
Замедляет и смачивает врагов. Вода усиливает молнию.|Уповільнює й змочує ворогів. Вода посилює блискавку.|Slows and soaks enemies. Water boosts lightning.
Глубина|Глибина|Depths
Замедление 65% вместо 45%|Уповільнення 65% замість 45%|Slowing 65% instead of 45%
Большой прилив|Великий приплив|High tide
Замедляет всю группу в радиусе 95|Уповільнює всю групу в радіусі 95|Slows the whole group within radius 95
Грозовая катушка|Грозова котушка|Storm coil
Молния по трём целям. Мокрые враги получают +50% урона.|Блискавка по трьох цілях. Мокрі вороги отримують +50% шкоди.|Lightning hits three targets. Wet enemies take +50% damage.
Цепная буря|Ланцюгова буря|Chain storm
Молния по пяти целям|Блискавка по п'яти цілях|Lightning hits five targets
Разряд|Розряд|Discharge
Урон ×2 против одиночной цели|Шкода ×2 проти одиночної цілі|Damage ×2 against a single target
Жаровня|Жаровня|Brazier
Поджигает группу на 3 секунды. Огонь обходит броню.|Підпалює групу на 3 секунди. Вогонь оминає броню.|Sets the group on fire for 3 seconds. Fire ignores armor.
Вечный огонь|Вічний вогонь|Eternal flame
Горение вдвое сильнее|Горіння вдвічі сильніше|Burning twice as strong
Вспышка|Спалах|Flash
Взрыв при попадании · урон ×2|Вибух при влучанні · шкода ×2|Explodes on hit · damage ×2
Сигнальная башня|Сигнальна вежа|Signal tower
Ускоряет соседние башни на 20%. Эффекты нескольких сигналов не складываются.|Прискорює сусідні вежі на 20%. Ефекти кількох сигналів не складаються.|Speeds up neighboring towers by 20%. Effects of several signals do not stack.
Боевой ритм|Бойовий ритм|Battle rhythm
Ускорение соседей до 40%|Прискорення сусідів до 40%|Neighbor speed-up up to 40%
Дальний дозор|Далекий дозор|Far watch
Дальность соседей +25%|Дальність сусідів +25%|Neighbor range +25%
Налётчик|Нальотчик|Raider
Разведчик|Розвідник|Scout
Бронекраб|Бронекраб|Armor crab
Щитоносец|Щитоносець|Shield-bearer
Хранитель|Охоронець|Warden
Адмирал|Адмірал|Admiral
Лазурный берег|Лазурний берег|Azure Coast
Одна дорога. Баллиста, мортира и прилив — ваше первое сочетание.|Одна дорога. Баліста, мортира й приплив — ваше перше поєднання.|One road. Ballista, mortar and tide are your first combination.
Каменная коса|Кам'яна коса|Stone Spit
Два длинных поворота. Мортира особенно сильна внутри изгиба.|Два довгих повороти. Мортира особливо сильна всередині вигину.|Two long bends. The mortar is especially strong inside a curve.
Мыс молний|Мис блискавок|Lightning Cape
Открыта грозовая катушка. Мокрые враги уязвимы к молнии.|Відкрито грозову котушку. Мокрі вороги вразливі до блискавки.|Storm coil unlocked. Wet enemies are vulnerable to lightning.
Врата архипелага|Брама архіпелагу|Archipelago Gate
Босс на восьмой волне. Сохраняйте удар маяка для тяжёлых целей.|Бос на восьмій хвилі. Зберігайте удар маяка для важких цілей.|A boss on the eighth wave. Save the lighthouse strike for heavy targets.
Янтарный залив|Бурштинова затока|Amber Bay
Штормовые воды|Штормові води|Stormy Waters
Открыта жаровня. Огонь проходит сквозь броню.|Відкрито жаровню. Вогонь проходить крізь броню.|Brazier unlocked. Fire passes through armor.
Расколотый риф|Розколотий риф|Split Reef
Быстрые разведчики на смену броне. Держите дальний рубеж.|Швидкі розвідники змінюють броню. Тримайте дальній рубіж.|Fast scouts replace the armor. Hold the far line.
Сигнальный мыс|Сигнальний мис|Signal Cape
Открыта сигнальная башня. Поддержка усиливает целый узел обороны.|Відкрито сигнальну вежу. Підтримка посилює цілий вузол оборони.|Signal tower unlocked. Support strengthens a whole defense point.
Око бури|Око бурі|Eye of the Storm
Хранители лечат союзников. Уничтожайте группу взрывами.|Охоронці лікують союзників. Знищуйте групу вибухами.|Wardens heal their allies. Destroy the group with explosions.
Чёрный причал|Чорний причал|Black Pier
Броня и скорость в одной волне. Комбинируйте роли башен.|Броня та швидкість в одній хвилі. Комбінуйте ролі веж.|Armor and speed in one wave. Combine the roles of your towers.
Утёс стражей|Скеля вартових|Guardians' Cliff
Длинная дорога даёт огню время раскрыться.|Довга дорога дає вогню час розгорітися.|A long road gives fire time to spread.
Последний пролив|Остання протока|Last Strait
С третьей волны вход чередуется. Западный причал открывает короткий путь к маяку — держите второй рубеж.|З третьої хвилі вхід чергується. Західний причал відкриває короткий шлях до маяка — тримайте другий рубіж.|From the third wave the entrance alternates. The west pier opens a short path to the lighthouse — hold the second line.
Сердце прилива|Серце припливу|Heart of the Tide
Финальная оборона с двух причалов одновременно. Перекрёстный огонь важнее обороны одного входа.|Фінальна оборона з двох причалів одночасно. Перехресний вогонь важливіший за оборону одного входу.|The final defense from two piers at once. Crossfire matters more than defending a single entrance.
Морской настил|Морський настил|Sea deck
Восточный причал|Східний причал|East pier
ПРИЧАЛ ОТКРЫТ|ПРИЧАЛ ВІДКРИТО|PIER OPEN
ПРИЧАЛ ЗАКРЫТ|ПРИЧАЛ ЗАКРИТО|PIER CLOSED
ЩИТ|ЩИТ|SHIELD
ЩИТ ЧЕРЕЗ|ЩИТ ЧЕРЕЗ|SHIELD IN
−БРОНЯ|−БРОНЯ|−ARMOR
Браузер не разрешил сохранение. Можно играть, но после закрытия эта партия и результаты могут потеряться.|Браузер не дозволив збереження. Можна грати, але після закриття ця партія й результати можуть загубитися.|The browser did not allow saving. You can play, but after closing this game and results may be lost.
Повторить загрузку|Повторити завантаження|Retry loading
Не удалось загрузить изображения острова.|Не вдалося завантажити зображення острова.|Could not load the island images.
Остров не загрузился. Партия сохранена.|Острів не завантажився. Партію збережено.|The island failed to load. The game is saved.
Защитите маяк. Сначала постройте башни, затем запустите волну.|Захистіть маяк. Спочатку збудуйте вежі, потім запустіть хвилю.|Defend the lighthouse. Build towers first, then start the wave.
Новая оборона|Нова оборона|New defense
Текущая партия на острове «|Поточна партія на острові «|The current game on the island «
» будет заменена. Результаты пройденных островов сохранятся.|» буде замінено. Результати пройдених островів збережуться.|» will be replaced. Results of completed islands will be kept.
Начать заново|Почати заново|Start over
Вернуться к текущей партии|Повернутися до поточної партії|Back to the current game
Продолжить|Продовжити|Continue
Волна|Хвиля|Wave
Оборона завершена|Оборону завершено|Defense complete
Начать волну|Почати хвилю|Start wave
Противники идут к маяку|Противники йдуть до маяка|Enemies are heading to the lighthouse
Волна отражена · подготовьте оборону|Хвилю відбито · підготуйте оборону|Wave repelled · prepare your defense
Нажмите на врага или участок дороги, куда направить удар. Повторное нажатие на «Удар маяка» отменит выбор.|Натисніть на ворога або ділянку дороги, куди спрямувати удар. Повторне натискання «Удар маяка» скасує вибір.|Tap an enemy or a stretch of road to aim the strike. Tapping «Lighthouse strike» again cancels the choice.
Партия открыта в другой вкладке. Нажмите «Продолжить», чтобы играть здесь.|Партію відкрито в іншій вкладці. Натисніть «Продовжити», щоб грати тут.|The game is open in another tab. Tap «Continue» to play here.
Нажмите на площадку с «+» и выберите башню. До первой волны продажа возвращает всё золото.|Натисніть на майданчик із «+» й виберіть вежу. До першої хвилі продаж повертає все золото.|Tap a spot with «+» and choose a tower. Before the first wave, selling returns all the gold.
Сочетайте баллисту с мортирой и приливом. Когда будете готовы — начните волну.|Поєднуйте баліст з мортирою та припливом. Коли будете готові — почніть хвилю.|Combine the ballista with the mortar and the tide. When you are ready, start the wave.
Нажмите на башню, чтобы улучшить её. Удар маяка поражает область; прилив замедляет всех.|Натисніть на вежу, щоб вдосконалити її. Удар маяка вражає область; приплив уповільнює всіх.|Tap a tower to upgrade it. The lighthouse strike hits an area; the tide slows everyone.
Есть время усилить оборону. Посмотрите состав следующей волны перед запуском.|Є час посилити оборону. Подивіться склад наступної хвилі перед запуском.|There is time to strengthen your defense. Check the next wave's makeup before starting.
Нажмите на поле|Натисніть на поле|Tap the field
Маяк защищён|Маяк захищено|Lighthouse defended
В ЭТОЙ ВОЛНЕ|У ЦІЙ ХВИЛІ|IN THIS WAVE
Вода + молния: урон усилен на 50%|Вода + блискавка: шкоду посилено на 50%|Water + lightning: damage boosted by 50%
Осадный удар: броня снята на 4 секунды|Облоговий удар: броню знято на 4 секунди|Siege strike: armor removed for 4 seconds
Щит адмирала · 3 секунды. Дождитесь спада для удара маяка.|Щит адмірала · 3 секунди. Дочекайтеся спаду для удару маяка.|Admiral's shield · 3 seconds. Wait for it to drop before the lighthouse strike.
Действие сейчас недоступно|Дія зараз недоступна|Action unavailable right now
Улучшить ↗|Вдосконалити ↗|Upgrade ↗
Подробнее ↗|Докладніше ↗|Details ↗
Ваша оборона|Ваша оборона|Your defense
Выберите площадку на острове. Башни атакуют автоматически — ваша задача найти правильное сочетание.|Виберіть майданчик на острові. Вежі атакують автоматично — ваше завдання знайти правильне поєднання.|Choose a spot on the island. Towers attack automatically — your job is to find the right combination.
Выберите башню · стоимость будет списана сразу|Виберіть вежу · вартість буде списано одразу|Choose a tower · the cost is charged at once
УРОВЕНЬ|РІВЕНЬ|LEVEL
урон|шкода|damage
перезарядка|перезарядка|reload
дальность|дальність|range
Радиус поддержки +12|Радіус підтримки +12|Support radius +12
Урон|Шкода|Damage
Выбор цели|Вибір цілі|Target priority
Первый|Перший|First
Сильный|Сильний|Strong
Броня|Броня|Armor
Улучшить до II|Вдосконалити до II|Upgrade to II
Продать башню?|Продати вежу?|Sell the tower?
Продать|Продати|Sell
Как защитить маяк|Як захистити маяк|How to defend the lighthouse
Нажмите «+» на острове и постройте башню. До первой волны можно продать её за полную стоимость.|Натисніть «+» на острові й збудуйте вежу. До першої хвилі її можна продати за повну вартість.|Tap «+» on the island and build a tower. Before the first wave you can sell it for its full cost.
Посмотрите состав волны и нажмите «Начать волну». Башни стреляют сами.|Подивіться склад хвилі та натисніть «Почати хвилю». Вежі стріляють самі.|Check the wave's makeup and tap «Start wave». Towers shoot on their own.
Нажмите на построенную башню для улучшения. После II уровня выберите одну из двух специализаций.|Натисніть на збудовану вежу для вдосконалення. Після II рівня виберіть одну з двох спеціалізацій.|Tap a built tower to upgrade it. After level II choose one of two specializations.
Баллиста ловит быстрых, мортира разбивает группы, прилив замедляет. Мокрые враги получают усиленный урон молнией.|Баліста ловить швидких, мортира розбиває групи, приплив уповільнює. Мокрі вороги отримують посилену шкоду від блискавки.|The ballista catches fast ones, the mortar breaks up groups, the tide slows. Wet enemies take boosted lightning damage.
«Удар маяка» затем касание поля — урон по области. «Прилив» — замедление всех врагов. Способности бесплатны и перезаряжаются во время боя.|«Удар маяка», потім дотик до поля — шкода по області. «Приплив» — уповільнення всіх ворогів. Здібності безкоштовні й перезаряджаються під час бою.|«Lighthouse strike», then tap the field — area damage. «Tide» — slows all enemies. Abilities are free and recharge during battle.
Переживите 8 волн. Победа даёт 1 звезду; 75% здоровья — 2; целый маяк — 3. Следующий остров открывается после любой победы.|Переживіть 8 хвиль. Перемога дає 1 зірку; 75% здоров'я — 2; цілий маяк — 3. Наступний острів відкривається після будь-якої перемоги.|Survive 8 waves. A win gives 1 star; 75% health — 2; an intact lighthouse — 3. The next island opens after any win.
Сохранение и результаты хранятся на этом устройстве. При сворачивании бой останавливается. Онлайн-кооператив в этой версии отсутствует.|Збереження та результати зберігаються на цьому пристрої. Під час згортання бій зупиняється. Онлайн-кооперативу в цій версії немає.|Saves and results are kept on this device. The battle stops when you minimize the app. This version has no online co-op.
Острова архипелага|Острови архіпелагу|Archipelago islands
Сначала остров|Спочатку острів|Island first
Обычный налётчик без брони. Опасен большой группой; мортира поражает несколько целей.|Звичайний нальотчик без броні. Небезпечний великою групою; мортира вражає кілька цілей.|An ordinary raider without armor. Dangerous in a large group; the mortar hits several targets.
Быстрый разведчик без брони. Баллиста и замедление помогают остановить его на повороте.|Швидкий розвідник без броні. Баліста й уповільнення допомагають зупинити його на повороті.|A fast scout without armor. The ballista and slowing help stop it at the bend.
Броня поглощает 50% обычного урона. Пробитие тяжёлой баллисты, огонь и осадный удар обходят защиту.|Броня поглинає 50% звичайної шкоди. Пробиття важкої баліст, вогонь і облоговий удар оминають захист.|Armor absorbs 50% of ordinary damage. Heavy ballista piercing, fire and siege strikes bypass the protection.
Броня поглощает 30% обычного урона. Потеря маяка при прорыве — 2 здоровья.|Броня поглинає 30% звичайної шкоди. Втрата маяка при прориві — 2 здоров'я.|Armor absorbs 30% of ordinary damage. A breakthrough costs the lighthouse 2 health.
Каждые 2 секунды восстанавливает 4,5% здоровья ближайших союзников. Удар по области поражает его вместе с группой.|Кожні 2 секунди відновлює 4,5% здоров'я найближчих союзників. Удар по області вражає його разом із групою.|Every 2 seconds restores 4.5% health of nearby allies. An area strike hits it together with the group.
Прорыв отнимает 8 здоровья. Адмирал останавливается и поднимает молот. Золотое кольцо предупреждает о щите: 3 секунды он поглощает половину урона. Дождитесь спада перед ударом маяка.|Прорив забирає 8 здоров'я. Адмірал зупиняється й піднімає молот. Золоте кільце попереджає про щит: 3 секунди він поглинає половину шкоди. Дочекайтеся спаду перед ударом маяка.|A breakthrough takes 8 health. The admiral stops and raises his hammer. A golden ring warns of the shield: for 3 seconds it absorbs half the damage. Wait for it to drop before the lighthouse strike.
Специализация выбирается в бою после улучшения башни до II уровня. При смене острова оборона строится заново.|Спеціалізація обирається в бою після вдосконалення вежі до II рівня. При зміні острова оборона будується заново.|Specialization is chosen in battle after upgrading a tower to level II. When you change island the defense is built anew.
Мастерская|Майстерня|Workshop
Выберите свой стиль обороны|Виберіть свій стиль оборони|Choose your defense style
Башни и специализации · покупаются за золото внутри боя|Вежі та спеціалізації · купуються за золото всередині бою|Towers and specializations · bought with gold during battle
Специализации доступны в бою после II уровня|Спеціалізації доступні в бою після II рівня|Specializations are available in battle after level II
Откроется на острове|Відкриється на острові|Unlocks on the island
Подготовка к следующему бою|Підготовка до наступного бою|Preparing for the next battle
Чистая тактика|Чиста тактика|Pure tactics
Без преимущества|Без переваги|No advantage
Прочность маяка|Міцність маяка|Lighthouse durability
24 здоровья|24 здоров'я|24 health
Запас припасов|Запас припасів|Supplies
+40 золота|+40 золота|+40 gold
Морская оптика|Морська оптика|Sea optics
Дальность +10%|Дальність +10%|Range +10%
Выбор бесплатный · действует со следующей партии|Вибір безкоштовний · діє з наступної партії|Free choice · applies from the next game
Откроется после первой победы|Відкриється після першої перемоги|Unlocks after the first win
Подготовка выбрана для следующей партии|Підготовку обрано для наступної партії|Preparation chosen for the next game
Мои результаты|Мої результати|My results
Лучший результат каждого острова и сложности. При равных звёздах сохраняется меньшее время боя.|Найкращий результат кожного острова та складності. За рівної кількості зірок зберігається менший час бою.|The best result for each island and difficulty. With equal stars the shorter battle time is kept.
Здесь появятся результаты завершённых победой оборон. Начните с Тихой гавани.|Тут з'являться результати оборон, завершених перемогою. Почніть із Тихої гавані.|Results of defenses won will appear here. Start with Quiet Harbor.
Звуки боя|Звуки бою|Battle sounds
Эффекты и движение|Ефекти та рух|Effects and motion
Настройки сохраняются на этом устройстве. Отключение эффектов не меняет правила и результат боя.|Налаштування зберігаються на цьому пристрої. Вимкнення ефектів не змінює правила й результат бою.|Settings are saved on this device. Turning effects off does not change the rules or the battle result.
Для этой сохранённой партии подробности прорывов не записаны.|Для цієї збереженої партії подробиці проривів не записано.|Breakthrough details were not recorded for this saved game.
Ни один противник не добрался до маяка.|Жоден противник не дістався до маяка.|No enemy reached the lighthouse.
Прорвались:|Прорвалися:|Broke through:
Открыто:|Відкрито:|Unlocked:
Открыта подготовка|Відкрито підготовку|Preparation unlocked
В мастерской можно бесплатно выбрать прочность маяка, припасы или дальность для следующего боя.|У майстерні можна безкоштовно обрати міцність маяка, припаси або дальність для наступного бою.|In the workshop you can choose lighthouse durability, supplies or range for the next battle for free.
Оборона прорвана|Оборону прорвано|Defense breached
здоровье маяка|здоров'я маяка|lighthouse health
врагов остановлено|ворогів зупинено|enemies stopped
время боя|час бою|battle time
Архипелаг защищён. Попробуйте другую сложность или улучшите звёзды.|Архіпелаг захищено. Спробуйте іншу складність або покращте зірки.|The archipelago is defended. Try another difficulty or improve your stars.
Следующий остров открыт. Попробуйте новый маршрут и новые сочетания.|Наступний острів відкрито. Спробуйте новий маршрут і нові поєднання.|The next island is open. Try a new route and new combinations.
Повторить с начальной расстановкой|Повторити з початковою розстановкою|Retry with the starting layout
Следующий остров →|Наступний острів →|Next island →
Повторить остров|Повторити острів|Retry island
В крепость|До фортеці|To the fortress
Сохранённая партия уже завершена|Збережена партія вже завершена|The saved game is already finished
Партия продолжена в другой вкладке|Партію продовжено в іншій вкладці|The game continued in another tab
Неверная карта или сложность|Неправильна мапа або складність|Invalid map or difficulty
`;

  const шаблоны = [
    [/^волна (\d+)$/, 'хвиля $1', 'wave $1'],
    [/^Волна (\d+)$/, 'Хвиля $1', 'Wave $1'],
    [/^Волна (\d+) отражена$/, 'Хвилю $1 відбито', 'Wave $1 repelled'],
    [/^\+(\d+) золота$/, '+$1 золота', '+$1 gold'],
    [/^осталось (\d+)$/, 'залишилось $1', '$1 left'],
    [/^Нужно ещё (\d+) золота$/, 'Потрібно ще $1 золота', 'Need $1 more gold'],
    [/^(.+) освободит площадку\. Вы получите (\d+) золота\.$/, '$1 звільнить майданчик. Ви отримаєте $2 золота.', '$1 will free the spot. You will get $2 gold.'],
    [/^Площадка (.+): построить башню$/, 'Майданчик $1: збудувати вежу', 'Spot $1: build a tower'],
    [/^Площадка (.+)$/, 'Майданчик $1', 'Spot $1'],
    [/^Скорость ×(.+)$/, 'Швидкість ×$1', 'Speed ×$1'],
    [/^Уровень (.+)$/, 'Рівень $1', 'Level $1'],
    [/^Улучшить до II · (.+)$/, 'Вдосконалити до II · $1', 'Upgrade to II · $1'],
    [/^вернуть (.+)$/, 'повернути $1', 'refund $1'],
    [/^ОСТРОВ (\d+)$/, 'ОСТРІВ $1', 'ISLAND $1'],
    [/^Остров (\d+)$/, 'Острів $1', 'Island $1'],
    [/^Прорвались: (.+) ×(\d+)\. (.+)$/, 'Прорвалися: $1 ×$2. $3', 'Broke through: $1 ×$2. $3'],
    [/^Прорвались: (.+) ×(\d+)$/, 'Прорвалися: $1 ×$2', 'Broke through: $1 ×$2'],
    [/^Постройка: (\d+) золота\. Доступна на островах начиная с №(\d+)\.?$/, 'Будівництво: $1 золота. Доступна на островах, починаючи з №$2.', 'Build: $1 gold. Available from island №$2.'],
    [/^Откроется на острове №(\d+)$/, 'Відкриється на острові №$1', 'Unlocks on island №$1'],
    [/^(\d+) островов$/, '$1 островів', '$1 islands'],
    [/^(\d+) из 36 звёзд$/, '$1 із 36 зірок', '$1 of 36 stars']
  ];

  Языки.добавить(строки);
  Языки.добавитьШаблоны(шаблоны);
  if (typeof module !== 'undefined' && module.exports) module.exports = { строки, шаблоны };
})(typeof window === 'undefined' ? globalThis : window);
