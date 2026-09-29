# Катан: поле, разбойник и сенсорная торговля

Дата: 29 сентября 2026.

## Изменения

- На игровом экране убран H1 «КАТАН». Строка раунда прокручивается со страницей; цель подписана «до 12 ПО» (ПО — победные очки). Лобби сохраняет название игры.
- Пастбища перерисованы: светлая короткая трава, крупные овцы, без деревьев. Лес темнее. Геометрия дорог и построек сохранена; рисунки сот уменьшены с 95% до 91%, между ними виден общий песчаный слой. Размер цифр не изменён. Значки и названия ресурсов на сотах удалены; доступные названия остаются в SVG title для подсказок.
- Новая крупная фигурка разбойника. Предварительный выбор показывает призрачную фигурку, маршрут и затронутые постройки. Подтверждение запускает движение поверх всех сот; поле прокручивается в видимую область, если оно за экраном. При нескольких жертвах после движения появляется выбор игрока. При одном сопернике правила автоматически забирают карту; её показ откладывается до конца движения. При выключенных анимациях перестановка мгновенная.
- Торговля с игроками: касание карты добавляет ресурс; касание выбранной карты убирает один. Отдельные наборы «Отдаю» и «Получаю», очистка каждого набора, собственные запасы, блокировка одинакового ресурса с обеих сторон, проверка доступных количеств. Банк показывает карточки и актуальный курс порта.
- Адресованные игроку и общие входящие предложения открываются автоматически один раз. Другое открытое окно не прерывается — предложение показывается после его закрытия. После сворачивания предложение доступно через строку на столе, без повторного принудительного открытия.
- Окна предложений и завершённых обменов показывают имена и карточки с количеством; последние три обмена доступны в торговле, все обмены — в журнале. Встречное предложение, отказ и отмена сохранены. Устаревшее встречное предложение нельзя отправить.
- Локальный бот ждёт, пока игрок рассматривает адресованное ему предложение в открытом окне. Онлайн-таймеры и серверные правила не изменялись.

## Основания для управления

- [Colonist: Improving the Trade System](https://blog.colonist.io/improving-the-colonist-trade-system/) — разделение отдаваемого/получаемого, видимая рука, курс у отдаваемого ресурса, ответы и встречные предложения.
- [CATAN Universe 2.1.0, сообщение разработчика](https://store.steampowered.com/news/posts/?appids=544730&enddate=1606431612&feed=steam_community_announcements) — выбор количества карточками и отдельный индикатор входящего обмена.

Изучены опубликованные описания разработчиков. Не заявляется, что проводилось тестирование авторизованных партий в этих приложениях.

## Проверки

- `tests/катан-сенсорный-обмен.js`: цели ПО, отсутствие плавающего заголовка и значков сот; выбор карт, отмена, встречное предложение, завершённый обмен; автоматическое открытие, отложенное открытие поверх другого окна, запрет устаревшего предложения; выбор и движение разбойника, жертва и добыча; размеры 320/390/768/1440.
- `tests/катан-торговля-два-браузера.js`: настоящий локальный HTTP-сервер, две независимые сессии браузера, реальные запасы игроков, предложение/контрпредложение/принятие, списание и получение обеими сторонами, защита от повторного принятия.
- `tests/катан-телеграм-размеры.js`: девять размеров, safe area Telegram, поворот, прокрутка, доступность элементов и отсутствие перекрытий.
- `tests/катан-бросок-и-торговля.js`, `tests/катан-новый-интерфейс.js`, `tests/катан-отмена-интерфейс.js`, `tests/катан-исправления.js`: банк, боты, производство, покупка развития, сохранение, отмена, всплывающие окна и управление.
- `tests/катан-торговля-и-общение.js`: правила обменов, устаревшие запросы и приватность украденной карты, HTTP-общение.

Границы: Chromium с подделкой Telegram API; физический телефон и два настоящих Telegram-аккаунта отдельно не проверялись. Данные тестовых комнат синтетические. Правила и сервер Катана в этой правке не менялись.

## Новая графика

Режим: встроенный imagegen; преобразование PNG → WebP сохраняет изображение и альфа-канал.

- `img/катан/пастбище-варианты-v2.webp`, 1254 × 1254: редактирование атласа `пастбище-варианты-v1.webp`, четыре варианта.
- `img/катан/разбойник-v2.webp`, 1254 × 1254 RGBA: новая фигурка на прозрачном фоне.

### Промпты

Use case: precise-object-edit. Asset type: terrain texture atlas for premium Catan-like board game. Edit this exact 2 by 2 square atlas. Keep precisely four equal square variants, no gutters and no labels, edge-to-edge painted terrain. Maintain the realistic miniature diorama art and oblique top-down camera. Make pastures unmistakably different from dark green forest: pale fresh celadon / yellow-green SHORT open grass, large clearly visible ivory-white sheep with charcoal heads, 3 sheep per quadrant, positioned in the central area for a hexagonal crop. Remove ALL trees, shrubs, forests, dense flowers and large rocks. Only soft low grass, a few tiny meadow flowers and a subtle light sandy footpath. All four variants have different arrangements, same palette. Avoid dark green masses, text, tokens, numbers, hex borders, gradients or vignettes. The sheep must remain clearly readable when each quadrant is displayed at 90 pixels wide.

Use case: stylized-concept. Asset type: transparent PNG sprite of a single premium sculpted board game robber miniature, shown at three-quarter front view, seen slightly from above. Make a simple bold readable silhouette at 50 pixels high: broad hooded head, short sturdy body with broad shoulders, charcoal black cloak, obvious ivory face inset in hood, large tan loot sack at the left hip, broad round bronze-gold base. Hand-painted resin miniature realism, subtle polished material, warm rim lighting on both sides. Occupy 85 percent of square image height, entirely visible including base. No sword, no tiny intricate accessories, no extra figures, no text, no scene, no floor, no checkerboard. Genuine transparent background with alpha. The silhouette should be chunky, imposing and readable against varied forests and rocky board tiles.
