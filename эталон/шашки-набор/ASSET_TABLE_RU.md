# Таблица ассетов

| Имя файла | Что изображено | Где размещать | Размер | Прозрачность | Слой |
|---|---|---|---:|---|---:|
| `lobby/lobby_full_reference_941x1672.png` | Полный экран лобби | Только визуальная сверка | 941×1672 | нет | reference |
| `lobby/checkers_hero_banner_876x205.png` | Чистый hero: тёмная зона слева и доска с шашками справа, без текста | Фон hero-карточки лобби | 876×205 | да | 0 |
| `lobby/hero_board_art_native_562x205.png` | Нативный фрагмент доски из лобби | Резервный art/сверка | 562×205 | нет | 0 |
| `gameplay/gameplay_full_reference_941x1671.png` | Полный игровой экран | Только визуальная сверка | 941×1671 | нет | reference |
| `gameplay/board_reference_with_position_874x853.png` | Доска с позицией после c3–d4 | Только визуальная сверка | 874×853 | нет | reference |
| `gameplay/board_empty_preview_874x853.png` | Пустая доска, собранная из реальных текстур и рамки | Статичное превью/резерв | 874×853 | да | 0 |
| `gameplay/board_frame_overlay_874x853.png` | Деревянная рамка и координаты, центр прозрачный | Над сеткой при точном повторении reference | 874×853 | да | 40 |
| `gameplay/board_grid_preview_792x784.png` | Техническая сетка 8×8 без рамки | QA геометрии, не production UI | 792×784 | нет | reference |
| `gameplay/square_light_99x98.png` | Светлая деревянная клетка | Светлые клетки CSS-grid | 99×98 | нет | 0 |
| `gameplay/square_dark_99x98.png` | Тёмная деревянная клетка | Тёмные игровые клетки CSS-grid | 99×98 | нет | 0 |
| `gameplay/pieces/checker_black_384x384.png` | Объёмная чёрная шашка | Фигура соперника/чёрных | 384×384 | да | 20 |
| `gameplay/pieces/checker_ivory_384x384.png` | Объёмная светлая шашка | Фигура игрока/белых | 384×384 | да | 20 |
| `gameplay/highlight_last_move_99x98.png` | Полупрозрачная лаймовая заливка | Клетки последнего хода | 99×98 | да | 10 |
| `gameplay/highlight_selected_99x98.png` | Лаймовая рамка выбранной клетки | Текущий выбор | 99×98 | да | 30 |
| `gameplay/move_dot_99x98.png` | Лаймовая точка допустимого хода | Свободная допустимая клетка | 99×98 | да | 30 |
| `gameplay/capture_ring_99x98.png` | Лаймовое кольцо обязательного взятия | Цель взятия или шашка с обязательным ходом | 99×98 | да | 30 |
| `shared/dark_background_tile_256x256.png` | Тёмная фоновая текстура | Фон lobby и gameplay | 256×256 | да | -10 |
| `shared/layout_tokens.json` | Цвета, отступы, радиусы и reference-геометрия | Константы темы | JSON | — | — |
| `references/original_checkers_lobby_941x1672.png` | Неизменённый исходник лобби | Reference, не импортировать в bundle | 941×1672 | нет | reference |
| `references/original_checkers_gameplay_941x1671.png` | Неизменённый исходник gameplay | Reference, не импортировать в bundle | 941×1671 | нет | reference |
| `references/piece_sources/checker_black_source_1254x1254.png` | Полноразмерный источник чёрной шашки | Ретина-источник/повторная оптимизация | 1254×1254 | да | reference |
| `references/piece_sources/checker_ivory_source_1254x1254.png` | Полноразмерный источник светлой шашки | Ретина-источник/повторная оптимизация | 1254×1254 | да | reference |
| `references/qa_start_position_preview_874x853.png` | Стартовая позиция из отдельных PNG | Проверка масштаба и расстановки | 874×853 | да | reference |
| `references/qa_piece_contact_sheet_720x360.png` | Чёрная и светлая шашки рядом | Визуальная QA-проверка | 720×360 | да | reference |
| `references/source_checksums.sha256` | SHA-256 исходников | Проверка целостности | текст | — | reference |
| `references/qa_validation.json` | Машинный результат проверок | QA | JSON | — | reference |

Все надписи, кнопки, таймеры, рейтинги, аватары, иконки и интерактивные состояния создаются кодом. Подробности — в `CLAUDE_CODE_INSTRUCTIONS_RU.md`.

