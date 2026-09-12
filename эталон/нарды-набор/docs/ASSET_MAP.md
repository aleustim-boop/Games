# Полный каталог файлов

`runtime` — применять в интерфейсе. `reference` — только визуальный образец. Координаты — в исходном макете 941 × 1672, формат L,T,R,B.

| Файл | Размер, px | Экран | Исходный прямоугольник | Слой | Применение | Описание |
|---|---|---|---|---|---|---|
| `references/lobby-original.png` | 941 × 1672 | lobby | — | 0 | reference | Полный исходный макет; эталон дизайна, не фон приложения |
| `references/gameplay-original.png` | 941 × 1672 | gameplay | — | 0 | reference | Полный исходный макет; эталон дизайна, не фон приложения |
| `lobby/hero-board-scene.png` | 528 × 206 | lobby | [381, 239, 909, 445] | 2 | runtime | Фото доски справа в баннере рейтинга. Фрагмент с фоном и обрезанным нижним краем как в макете; ставить справа, не растягивать. |
| `lobby/trophy-large.png` | 80 × 83 | lobby | [64, 300, 144, 383] | 3 | runtime | Кубок слева от личного рейтинга. Отделён от тёмного фона. |
| `lobby/trophy-small.png` | 43 × 44 | lobby | [64, 1144, 107, 1188] | 3 | runtime | Кубок перед заголовком «Рейтинг игроков». |
| `lobby/medal-1.png` | 46 × 46 | lobby | [63, 1219, 109, 1265] | 3 | runtime | Медаль 1-го места. Цифра уже внутри; только для этого места. |
| `lobby/medal-2.png` | 46 × 46 | lobby | [63, 1285, 109, 1331] | 3 | runtime | Медаль 2-го места. Цифра уже внутри; только для этого места. |
| `lobby/medal-3.png` | 46 × 46 | lobby | [63, 1353, 109, 1399] | 3 | runtime | Медаль 3-го места. Цифра уже внутри; только для этого места. |
| `gameplay/checker-black.png` | 60 × 60 | gameplay | [52, 404, 112, 464] | 4 | runtime | Чёрная фишка сверху. Повторять для каждой фишки; тень добавлять CSS. |
| `gameplay/checker-ivory.png` | 59 × 59 | gameplay | [375, 403, 434, 462] | 4 | runtime | Светлая фишка сверху. Повторять для каждой фишки; тень добавлять CSS. |
| `gameplay/die-photo-3.png` | 64 × 66 | gameplay | [575, 731, 639, 797] | 5 | reference | Точный фотосрез кубика 3; для сверки стиля. В игре применять единый набор SVG из shared/dice. |
| `gameplay/die-photo-2.png` | 65 × 67 | gameplay | [680, 738, 745, 805] | 5 | reference | Точный фотосрез кубика 2; для сверки стиля. В игре применять единый набор SVG из shared/dice. |
| `shared/icons/back.png` | 25 × 35 | lobby | [41, 30, 66, 65] | 4 | runtime | Назад |
| `shared/icons/more.png` | 50 × 20 | lobby | [855, 37, 905, 57] | 4 | runtime | Меню, три точки |
| `shared/icons/book.png` | 42 × 39 | lobby | [712, 128, 754, 167] | 4 | runtime | Правила |
| `shared/icons/bot.png` | 83 × 80 | lobby | [80, 540, 163, 620] | 3 | runtime | Режим с ботом |
| `shared/icons/online.png` | 85 × 83 | lobby | [521, 538, 606, 621] | 3 | runtime | Режим онлайн |
| `shared/icons/nav-games.png` | 72 × 54 | lobby | [119, 1547, 191, 1601] | 3 | runtime | Навигация: игры |
| `shared/icons/nav-friends.png` | 59 × 54 | lobby | [442, 1547, 501, 1601] | 3 | runtime | Навигация: друзья |
| `shared/icons/nav-profile.png` | 53 × 55 | lobby | [760, 1546, 813, 1601] | 3 | runtime | Навигация: профиль |
| `shared/icons/undo.png` | 48 × 45 | gameplay | [86, 1483, 134, 1528] | 3 | runtime | Отмена хода |
| `shared/icons/chat.png` | 52 × 43 | gameplay | [823, 1467, 875, 1510] | 3 | runtime | Чат |
| `shared/icons/avatar-neutral.png` | 45 × 52 | gameplay | [62, 280, 107, 332] | 3 | runtime | Силуэт соперника, поверх круглого фона |
| `shared/icons/avatar-active.png` | 45 × 51 | gameplay | [62, 1197, 107, 1248] | 3 | runtime | Силуэт своего игрока, поверх круглого фона |
| `gameplay/board-empty.png` | 913 × 793 | gameplay | [14, 365, 927, 1158] | 1 | runtime | Пустая доска: рамка оригинальная, поле собрано из чистых полос исходного макета. 24 пункта. Текстура местами повторяется; не извлечённый скрытый слой. |
| `gameplay/board-with-pieces-reference.png` | 913 × 793 | gameplay | [14, 365, 927, 1158] | 1 | reference | Исходная доска с фишками, кубиками и подсветкой. Только эталон композиции. |
| `shared/wood-texture.png` | 66 × 89 | gameplay | [247, 721, 313, 810] | 0 | runtime | Чистый фрагмент дерева из середины поля; небольшой образец, не HD-текстура. |
| `shared/dark-texture.png` | 452 × 93 | gameplay | [245, 1579, 697, 1672] | 0 | runtime | Чистый фрагмент тёмного фона; использовать с CSS-градиентом, при повторении возможны швы. |
| `references/crops/lobby-header.png` | 880 × 57 | lobby | [32, 24, 912, 81] | 2 | reference | Верхняя панель — образец для вёрстки; текст и состояния реализовать кодом. |
| `references/crops/lobby-title.png` | 588 × 112 | lobby | [31, 107, 619, 219] | 2 | reference | Название и подзаголовок — образец для вёрстки; текст и состояния реализовать кодом. |
| `references/crops/lobby-rules.png` | 235 × 76 | lobby | [677, 110, 912, 186] | 2 | reference | Кнопка правил — образец для вёрстки; текст и состояния реализовать кодом. |
| `references/crops/lobby-rating-banner.png` | 879 × 208 | lobby | [32, 238, 911, 446] | 2 | reference | Баннер личного рейтинга — образец для вёрстки; текст и состояния реализовать кодом. |
| `references/crops/lobby-mode-bot.png` | 435 × 137 | lobby | [31, 513, 466, 650] | 2 | reference | Выбранный режим: бот — образец для вёрстки; текст и состояния реализовать кодом. |
| `references/crops/lobby-mode-online.png` | 436 × 137 | lobby | [476, 513, 912, 650] | 2 | reference | Режим: онлайн — образец для вёрстки; текст и состояния реализовать кодом. |
| `references/crops/lobby-variant-tabs.png` | 880 × 78 | lobby | [32, 717, 912, 795] | 2 | reference | Переключатель варианта нард — образец для вёрстки; текст и состояния реализовать кодом. |
| `references/crops/lobby-difficulty-easy.png` | 289 × 84 | lobby | [32, 857, 321, 941] | 2 | reference | Лёгкая сложность — образец для вёрстки; текст и состояния реализовать кодом. |
| `references/crops/lobby-difficulty-medium.png` | 282 × 84 | lobby | [330, 857, 612, 941] | 2 | reference | Средняя сложность — образец для вёрстки; текст и состояния реализовать кодом. |
| `references/crops/lobby-difficulty-hard.png` | 290 × 84 | lobby | [622, 857, 912, 941] | 2 | reference | Сложная сложность — образец для вёрстки; текст и состояния реализовать кодом. |
| `references/crops/lobby-play-button.png` | 880 × 101 | lobby | [32, 961, 912, 1062] | 2 | reference | Главная кнопка — образец для вёрстки; текст и состояния реализовать кодом. |
| `references/crops/lobby-leaderboard.png` | 880 × 379 | lobby | [32, 1123, 912, 1502] | 2 | reference | Таблица рейтинга — образец для вёрстки; текст и состояния реализовать кодом. |
| `references/crops/lobby-bottom-navigation.png` | 941 × 148 | lobby | [0, 1524, 941, 1672] | 2 | reference | Нижняя навигация — образец для вёрстки; текст и состояния реализовать кодом. |
| `references/crops/gameplay-header.png` | 880 × 57 | gameplay | [32, 24, 912, 81] | 2 | reference | Верхняя панель — образец для вёрстки; текст и состояния реализовать кодом. |
| `references/crops/gameplay-title.png` | 543 × 120 | gameplay | [31, 110, 574, 230] | 2 | reference | Название и тип партии — образец для вёрстки; текст и состояния реализовать кодом. |
| `references/crops/gameplay-opponent.png` | 879 × 104 | gameplay | [33, 252, 912, 356] | 2 | reference | Панель соперника — образец для вёрстки; текст и состояния реализовать кодом. |
| `references/crops/gameplay-opponent-timer.png` | 221 × 81 | gameplay | [690, 267, 911, 348] | 2 | reference | Таймер соперника — образец для вёрстки; текст и состояния реализовать кодом. |
| `references/crops/gameplay-player.png` | 879 × 105 | gameplay | [33, 1174, 912, 1279] | 2 | reference | Панель игрока — образец для вёрстки; текст и состояния реализовать кодом. |
| `references/crops/gameplay-player-timer.png` | 221 × 81 | gameplay | [690, 1183, 911, 1264] | 2 | reference | Таймер игрока — образец для вёрстки; текст и состояния реализовать кодом. |
| `references/crops/gameplay-turn-badge.png` | 266 × 74 | gameplay | [338, 1295, 604, 1369] | 2 | reference | Плашка: ваш ход — образец для вёрстки; текст и состояния реализовать кодом. |
| `references/crops/gameplay-turn-hint.png` | 252 × 38 | gameplay | [349, 1381, 601, 1419] | 2 | reference | Подсказка выбора фишки — образец для вёрстки; текст и состояния реализовать кодом. |
| `references/crops/gameplay-undo-button.png` | 376 × 125 | gameplay | [32, 1444, 408, 1569] | 2 | reference | Отменить ход — образец для вёрстки; текст и состояния реализовать кодом. |
| `references/crops/gameplay-confirm-button.png` | 352 × 125 | gameplay | [419, 1444, 771, 1569] | 2 | reference | Подтвердить — образец для вёрстки; текст и состояния реализовать кодом. |
| `references/crops/gameplay-chat-button.png` | 126 × 125 | gameplay | [785, 1444, 911, 1569] | 2 | reference | Чат — образец для вёрстки; текст и состояния реализовать кодом. |
| `references/crops/gameplay-selected-checker.png` | 78 × 77 | gameplay | [501, 1041, 579, 1118] | 2 | reference | Подсвеченная фишка — образец для вёрстки; текст и состояния реализовать кодом. |
| `references/crops/gameplay-target-marker.png` | 52 × 54 | gameplay | [643, 1054, 695, 1108] | 2 | reference | Маркер допустимого хода — образец для вёрстки; текст и состояния реализовать кодом. |
| `shared/icons/play.svg` | 64 × 64 | shared | — | 3 | runtime | Векторная кнопка play без потери качества при масштабировании |
| `shared/icons/check.svg` | 64 × 64 | shared | — | 3 | runtime | Галочка кнопки подтверждения |
| `shared/icons/lightning.svg` | 64 × 64 | shared | — | 3 | runtime | Молния статуса хода |
| `shared/icons/arrow-right.svg` | 64 × 64 | shared | — | 3 | runtime | Стрелка «Все» |
| `shared/icons/difficulty-easy.svg` | 64 × 64 | shared | — | 3 | runtime | Индикатор сложности easy; подпись отдельно текстом |
| `shared/icons/difficulty-medium.svg` | 64 × 64 | shared | — | 3 | runtime | Индикатор сложности medium; подпись отдельно текстом |
| `shared/icons/difficulty-hard.svg` | 64 × 64 | shared | — | 3 | runtime | Индикатор сложности hard; подпись отдельно текстом |
| `gameplay/target-ring.svg` | 64 × 64 | shared | — | 2 | runtime | Кольцо допустимого хода |
| `gameplay/selection-ring.svg` | 80 × 80 | shared | — | 5 | runtime | Кольцо выбранной фишки |
| `shared/dice/die-1.svg` | 100 × 100 | shared | — | 5 | runtime | Кубик 1; геометрически правильные точки. Воссозданный вектор в цветах макета, не фотосрез. |
| `shared/dice/die-2.svg` | 100 × 100 | shared | — | 5 | runtime | Кубик 2; геометрически правильные точки. Воссозданный вектор в цветах макета, не фотосрез. |
| `shared/dice/die-3.svg` | 100 × 100 | shared | — | 5 | runtime | Кубик 3; геометрически правильные точки. Воссозданный вектор в цветах макета, не фотосрез. |
| `shared/dice/die-4.svg` | 100 × 100 | shared | — | 5 | runtime | Кубик 4; геометрически правильные точки. Воссозданный вектор в цветах макета, не фотосрез. |
| `shared/dice/die-5.svg` | 100 × 100 | shared | — | 5 | runtime | Кубик 5; геометрически правильные точки. Воссозданный вектор в цветах макета, не фотосрез. |
| `shared/dice/die-6.svg` | 100 × 100 | shared | — | 5 | runtime | Кубик 6; геометрически правильные точки. Воссозданный вектор в цветах макета, не фотосрез. |
