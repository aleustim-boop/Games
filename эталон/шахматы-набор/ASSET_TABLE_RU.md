# Таблица ассетов

| Имя файла | Что изображено | Где размещать | Размер | Прозрачность | Слой |
|---|---|---|---:|---|---:|
| `lobby/chess_hero_source_1536x1024.png` | Полная сцена с белым конём и чёрным королём | Резервный hero/ретина-источник | 1536×1024 | нет | фон |
| `lobby/chess_tile_source_1536x1024.jpg` | Шахматная плитка 3:2 | Каталог игр | 1536×1024 | нет | фон карточки |
| `lobby/chess_hero_banner_876x204.png` | Широкий баннер с затемнением слева | Hero-карточка lobby | 876×204 | есть | 0 |
| `gameplay/board_reference_with_position_875x875.png` | Доска с эталонной позицией | Только визуальная сверка | 875×875 | нет | reference |
| `gameplay/board_empty_preview_875x875.png` | Пустая доска, собранная из реальных текстур | Превью/запасной статичный фон | 875×875 | нет | 0 |
| `gameplay/board_frame_overlay_875x875.png` | Деревянная рамка и координаты, центр прозрачный | Поверх интерактивной сетки | 875×875 | да | 40 |
| `gameplay/board_grid_preview_810x808.png` | Пустая сетка 8×8 без рамки | Техническая сверка геометрии | 810×808 | нет | reference |
| `gameplay/square_light_101x101.png` | Светлая деревянная клетка | Чётные клетки сетки | 101×101 | нет | 0 |
| `gameplay/square_dark_101x101.png` | Тёмная деревянная клетка | Нечётные клетки сетки | 101×101 | нет | 0 |
| `gameplay/highlight_last_move_101x101.png` | Полупрозрачная подсветка последнего хода | Над клеткой, под фигурой | 101×101 | да | 10 |
| `gameplay/highlight_selected_101x101.png` | Яркая лаймовая выбранная клетка | Над выбранной клеткой | 101×101 | да | 30 |
| `gameplay/move_dot_101x101.png` | Лаймовая точка допустимого хода | В центре доступной клетки | 101×101 | да | 30 |
| `gameplay/pieces/black_rook.png` | Чёрная ладья | Клетка с ладьёй | 384×384 | да | 20 |
| `gameplay/pieces/black_knight.png` | Чёрный конь | Клетка с конём | 384×384 | да | 20 |
| `gameplay/pieces/black_bishop.png` | Чёрный слон | Клетка со слоном | 384×384 | да | 20 |
| `gameplay/pieces/black_queen.png` | Чёрная ферзь | Клетка с ферзём | 384×384 | да | 20 |
| `gameplay/pieces/black_king.png` | Чёрный король | Клетка с королём | 384×384 | да | 20 |
| `gameplay/pieces/black_pawn.png` | Чёрная пешка | Клетка с пешкой | 384×384 | да | 20 |
| `gameplay/pieces/white_rook.png` | Белая ладья | Клетка с ладьёй | 384×384 | да | 20 |
| `gameplay/pieces/white_knight.png` | Белый конь | Клетка с конём | 384×384 | да | 20 |
| `gameplay/pieces/white_bishop.png` | Белый слон | Клетка со слоном | 384×384 | да | 20 |
| `gameplay/pieces/white_queen.png` | Белая ферзь | Клетка с ферзём | 384×384 | да | 20 |
| `gameplay/pieces/white_king.png` | Белый король | Клетка с королём | 384×384 | да | 20 |
| `gameplay/pieces/white_pawn.png` | Белая пешка | Клетка с пешкой | 384×384 | да | 20 |
| `shared/dark_background_tile_256x256.png` | Бесшовно воспринимаемый тёмный фон | Фон экранов; можно заменить CSS | 256×256 | нет | -10 |
| `shared/layout_tokens.json` | Цвета и точная геометрия макета | Константы темы/верстки | JSON | — | — |
| `references/original_chess_gameplay_941x1672.png` | Неизменённый исходный gameplay | Только reference | 941×1672 | нет | reference |
| `references/original_chess_hero_1536x1024.png` | Неизменённый hero-исходник | Только reference | 1536×1024 | нет | reference |
| `references/original_chess_tile_1536x1024.jpg` | Неизменённая плитка | Только reference | 1536×1024 | нет | reference |
| `references/lobby_layout_reference_backgammon_941x1672.png` | Эталон структуры lobby | Только геометрия и стиль; не показывать пользователю | 941×1672 | нет | reference |
| `references/qa_piece_contact_sheet.png` | Контрольная раскладка всех 12 фигур | Визуальная QA-проверка | 756×252 | нет | reference |
| `references/qa_start_position_preview.png` | Стартовая позиция, собранная из отдельных PNG | Проверка краёв и масштаба на доске | 875×875 | нет | reference |
| `references/native_piece_crops/black_rook.png` | Нативная чёрная ладья | Точное сравнение; не production | 101×101 | да | reference |
| `references/native_piece_crops/black_knight.png` | Нативный чёрный конь | Точное сравнение; не production | 101×101 | да | reference |
| `references/native_piece_crops/black_bishop.png` | Нативный чёрный слон | Точное сравнение; не production | 101×101 | да | reference |
| `references/native_piece_crops/black_queen.png` | Нативная чёрная ферзь | Точное сравнение; не production | 101×101 | да | reference |
| `references/native_piece_crops/black_king.png` | Нативный чёрный король | Точное сравнение; не production | 102×101 | да | reference |
| `references/native_piece_crops/black_pawn.png` | Нативная чёрная пешка | Точное сравнение; не production | 101×101 | да | reference |
| `references/native_piece_crops/white_rook.png` | Нативная белая ладья | Точное сравнение; не production | 102×101 | да | reference |
| `references/native_piece_crops/white_knight.png` | Нативный белый конь | Точное сравнение; не production | 101×101 | да | reference |
| `references/native_piece_crops/white_bishop.png` | Нативный белый слон | Точное сравнение; не production | 101×101 | да | reference |
| `references/native_piece_crops/white_queen.png` | Нативная белая ферзь | Точное сравнение; не production | 101×101 | да | reference |
| `references/native_piece_crops/white_king.png` | Нативный белый король | Точное сравнение; не production | 102×101 | да | reference |
| `references/native_piece_crops/white_pawn.png` | Нативная белая пешка | Точное сравнение; не production | 101×101 | да | reference |
| `references/source_checksums.sha256` | Контрольные суммы неизменённых исходников | Проверка целостности | текст | — | reference |
| `references/qa_validation.json` | Машинный результат 21 проверки | QA | JSON | — | reference |

Надписи и интерактивные элементы в эту таблицу намеренно не включены как растровые файлы: их нужно создавать кодом согласно `CLAUDE_CODE_INSTRUCTIONS_RU.md`.
