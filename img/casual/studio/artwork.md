# Игровые материалы Studio

Режим: встроенный `image_gen`, создание новых изображений. Исходные обложки использовались только как стилевые референсы. Новые PNG сохранены в этой папке; сайт использует одноимённые WebP. Экспорт: `scripts/encode-casual-art.js`, качество 0.84, ограничение размера для загрузки на телефоне. Прозрачность не заявляется: атласы обрезаются и размещаются игровым кодом.

`match3-concept.png` — ориентир композиции, **не скриншот приложения**. Все остальные материалы подключены к действующим полям через `style-casual-studio.css`, `js/casual-snake-scene.js` и карточный renderer. Правильные числа, буквы, масти и китайские знаки накладывает код.

Ниже — финальные запросы генерации.

## match3-concept.png

Use case: ui-mockup. Design one exceptional HIGH-END mobile match-three game ACTUAL IN-PLAY screen, portrait 9:16. Russian title «Три в ряд». Inspired by a collector's jewel cabinet: emerald velvet, aged warm brass, black lacquer, directional golden evening light. Show a compact elegant header with pause icon, large score «2 450», smaller goal «6 500», a fine progress arc, and a distinct remaining-moves medallion «18». The playable central board is a perfectly regular EIGHT by EIGHT grid of six kinds of realistic large cut gems (sapphire rhombus, red ruby teardrop, purple amethyst triangle, ivory pearl, amber hexagon, emerald square). Each gem sits in a soft recessed velvet socket, shadows and side facets give tangible depth. Board fills phone width with narrow margins. A tasteful brass tray surrounds it, with realistically bevelled layered edges. One small matched trio glows with a restrained golden particle trail and a «+150» score, do not obscure board. Bottom is a compact sculpted control dock with icons and Russian labels «Подсказка», «Отмена», «Новая игра». Overall composition reads like a real premium polished mobile game, not a web form or generic dashboard. Background only at perimeter: dark velvet drapery, cropped collector objects, cinematic but understated. Typography modern elegant and extremely readable, UI text crisp ivory. Rich but purposeful detail, meticulously aligned, no giant empty spaces, no repeated rectangular HTML panels, no cheap neon, no arbitrary extra gems beyond the grid. Deliver full screen design, no device frame, no mockup phone.

## tray.png / tray.webp

Референс: match3-concept.png.

Use reference for material/style only. Production game asset: a perfectly SQUARE premium collector's brass game tray viewed EXACTLY from overhead, orthographic. Isolate the tray, filling the entire square image edge to edge. A magnificent layered warm-gold frame occupies only the outermost 5 percent on each of the four sides, with fine engraved floral clasps at corners and subtle highlight along the inner bevel, realistic machining, deep dark side edge. The inner 90 percent is completely EMPTY very dark soft emerald velvet, evenly lit and quiet. No gems, no grid, no cards, no icons, NO TEXT, no numbers, no controls, no objects, no counters. Strict front-facing square, all four sides equally wide and straight, rounded inner corners only mildly. Outside frame very dark emerald. This will be a nine-slice frame texture around a live interactive game board, so NO decorative objects or imagery anywhere in the center. Full-resolution realistic luxe craft, restrained warm side light.

## jewels-room.png / jewels-room.webp

Референс: ../match3.png.

Use the reference as material and lighting reference. Create an EMPTY collector's tabletop environment for the background of a premium interactive jewel game, portrait 2:3. Camera directly overhead. The central 78 percent of width and central 80 percent of height must be completely unobstructed dark emerald velvet, soft and even, subtle broad light at upper left. Only at extreme perimeter: a cropped antique gold jewellery casket at upper left, part of a tiny brass bowl containing pearls at lower right, very subtle dark draped velvet corners and a small gold decorative edge at upper right. These props should feel photographic and exquisite but be mostly cropped outside the image, NEVER placed in central space. NO board, NO grid, NO text, NO letters, NO numbers, NO buttons, NO interface, NO loose gems in the center. Restrained cinematic golden light, rich deep shadows, realistic fabric and brass microtexture. This is the actual usable gameplay background, not a cover; keep a very large quiet empty playing area.

## mahjong-room.png / mahjong-room.webp

Референс: ../mahjong.png.

Use reference style and materials. Production gameplay backdrop, portrait 2:3, overhead view of an empty Japanese collector's table. CENTRAL 80% entirely EMPTY dark smooth muted jade-green woven mat, no pieces or board. Extreme upper-left corner has cropped bonsai branches with soft leaf shadows; extreme upper-right a cropped warm brass lantern glow; bottom edge a tiny partial lacquer tea saucer and dark walnut rim. Rich quiet atmosphere, authentic carved dark wood and finely woven mat, realistic light, a luminous but low-contrast center to place ivory mahjong tiles. Orthographic direct overhead camera. No mahjong tiles, no symbols, no lettering, no text, no UI, no grids. Edge props never intrude into central play area. Refined detailed game environment that makes the gameplay feel like touching a real luxury tabletop.

## mahjong-tile.png / mahjong-tile.webp

Production game sprite: ONE completely BLANK antique ivory mahjong tile, viewed exactly front-on orthographic from directly overhead. Portrait 2:3 image. Tile fills 98 percent of the image, nearly edge to edge with narrow black corners only. Rich warm ivory polished porcelain front face with subtle believable microtexture, broad gently rounded bevel, fine highlight on top and left, tiny age freckles, soft creamy center totally blank. Bottommost 8 percent reveals thick dark jade-green backing and cream sidewall, so this reads as a heavy mahjong tile with thickness, not a flat UI button. Camera does not tilt or skew the rectangular silhouette. NO lettering, NO engravings, NO symbols, NO decorative marks, NO pips, NO wood, NO board, NO scene, NO text. Premium collectible quality, beautiful restrained softbox reflections, cream material not yellow plastic. The game will render precise Chinese face marks over the blank face.

## card-room.png / card-room.webp

Референс: ../klondike.png.

Reference style only. Production background for a premium solitaire card game. Portrait 2:3 overhead photograph of a large EMPTY dark bottle-green felt card table with a finely stitched padded espresso leather rail along extreme edges. CENTER 82 percent completely empty quiet felt, no cards, no symbols, no text, no markings. Peripheral props only: a partly cropped cut-crystal tumbler with amber tea on brass coaster at very top left, a sliver of ornate green leather card box at bottom left, cropped polished walnut table corner at bottom right. Refined club atmosphere, warm directional evening light, deep shadows, real leather and felt. Strict overhead flat playable table; not perspective scene, not mockup. All playable objects will be rendered by the game separately.

## card-back.png / card-back.webp

Production playing-card BACK artwork, one portrait rectangle with exact aspect 5:7, fills entire canvas. Rich midnight bottle-green fine linen paper with elegant antique gold-foil symmetrical botanical engraving, four corner flourishes and a central large spade-shaped ornamental medallion, restrained intricate interlaced lines. Outer cream-gold hairline border inset 3 percent, the outermost edge remains green. Mirror symmetry top to bottom, engraved luxury collector's deck quality, realistic gold ink, no perspective, no shadows outside the card, no scene. NO words, NO letters, NO digits, NO casino brand. This is the actual usable reverse side of live playing cards, must remain recognizable when small.

## materials.png / materials.webp

Production game material atlas, 3 equal square cells arranged horizontally, exact aspect 3:1. Each entire square edge-to-edge is a DIFFERENT PLAIN flat material texture viewed straight overhead: LEFT polished deep jade-green marble with fine subtle pale cream veins; CENTER warm ivory porcelain with very subtle natural mottling and soft satin highlight; RIGHT dark honey walnut wood with finely figured grain. All surfaces calm low contrast, photorealistic materials at luxury collectible quality. NO frames, NO bevels, NO objects, NO tiles, NO grid lines, NO border, NO shadows dividing cells, NO text. This is a material texture strip to be sampled independently by a live board game renderer.

## mines-room.png / mines-room.webp

Референс: ../mines.png.

Reference style only. Actual game backdrop, overhead portrait 2:3. A collector explorer's dark emerald leather desk, empty center 80 percent. Only edges show cropped antique brass compass bottom-left, finely engraved pen at right edge, a tiny cropped corner of old green leather atlas at upper-left and warm brass lamp glow upper-right. NO playing board, no tiles, no mines, no flags, no numbers, no lettering, no text, no interface. Completely empty usable central space, subtle leather grain, quiet dark green illumination. Beautiful photographic brass, leather, walnut, warm evening atmosphere. Props remain in outer 10 percent, almost outside frame.

## word-room.png / word-room.webp

Референс: ../wordsearch.png.

Reference style only. Actual gameplay backdrop for a premium word puzzle, portrait 2:3, straight overhead. A warm walnut writing desk with a huge perfectly empty dark olive leather writing mat covering the entire center 82 percent. Peripheral objects ONLY: cropped antique magnifying-glass edge and gold pencil at extreme lower-right; dark green finely bound books at extreme upper-left; a tiny branch of eucalyptus at bottom-left. Soft afternoon lamplight, realistic patinated leather, warm polished wood, refined quiet literary atmosphere. No playing board, no tiles, no letters, no text, no words, no visible printed pages, no interface, no numbers. Central play area very large, calm and empty.

## snake-pieces.png / snake-pieces.webp

Референс: ../snake.png.

Reference style only. Production sprite atlas for actual game objects. Exact layout THREE equal square cells in ONE horizontal row, aspect ratio 3:1. Plain perfectly black background. LEFT cell: one rounded square polished jade green marble block, fine gold rim, thick rounded bevel, directly overhead, occupying 90% of square cell. CENTER cell: a friendly rounded square jade snake HEAD facing RIGHT, viewed directly overhead, two gold inset eyes at upper-right and lower-right corners, short tiny gold fork tongue projecting a little to right, same scale and materials as left body block. RIGHT cell: one round translucent amber-gold APPLE viewed overhead, small curved stem and golden leaf, glowing subtly, 80% of cell. Photoreal premium collectible objects, strong coherent top-left warm light, rich jade veins, beautiful depth. NO text, NO board, NO grid, NO extra objects, NO perspective tilt. Centers precisely at 1/6, 1/2, 5/6 width and 1/2 height. Objects never cross cell boundaries; isolated on pure black so each silhouette can be clipped in the game.

## blocks.png / blocks.webp

Референс: ../blocks.png.

Reference for material fidelity. Production atlas of six actual game block sprites: three equal square columns by two equal square rows, aspect ratio 3:2. Each cell has ONE thick rounded-square translucent enamel/glass block centered and filling 94% of its cell, all exactly same dimensions and direct overhead angle. Top row left to right: glowing amber gold, polished rich jade green, sapphire blue. Bottom row left to right: garnet ruby red, smoky purple amethyst, warm ivory. Beautiful thick beveled upper edges, strong but elegant specular reflection on top-left, deep luminous material within, realistic subtle internal veins, a slim gold edge near base. Bottom edge shows a little dark thickness. Consistent lighting and scale, super readable at 35 pixels. Black uniform background only in tiny margins. NO glyphs, no numbers, no pips, no logos, no scene, no grid, no letters. Each square MUST be orthographic and square, not a diamond or a perspective cuboid. Actual luxury tactile puzzle pieces, not generic flat colored buttons.

## brass-frame.png / brass-frame.webp

Production game asset, perfectly square overhead photograph of an EMPTY premium collector's game tray. Outer border is broad satin-brushed aged brass, machined stepped bevels with polished gold highlights, small subtly rounded corners, slim dark bronze thickness visible along lower edge. NO baroque decorations, no engravings, no ornaments. Border occupies exactly outer 6 percent of each side, same width on all four sides. Interior large central 88 percent completely empty dark green-black smooth leather, quiet almost black. Frame reaches image edges. Strict orthographic square, no perspective, no objects, no grid, no tiles, no text, no symbols. Exceptional real metal, believable weight and highlights, a handcrafted game board frame for nine-slice UI texturing.

## wood-frame.png / wood-frame.webp

Production game asset, perfectly square overhead photograph of an EMPTY luxury mechanical puzzle box. Outer frame is rich warm walnut wood with beautifully visible fine figured grain, mitered corner joints, chamfered rim and a single fine brass inlay line along the inner edge. Border occupies exactly outer 7 percent of each side. Entire central 86 percent is EMPTY matte dark olive green felt. Square straight borders all equally wide, gently rounded outer corners, frame fills image edge to edge. A little physical dark wooden thickness visible below lower edge. Strict orthographic directly overhead, no perspective tilt, no objects, no numbers, no puzzle pieces, no grid, no markings, no text. Real collector-grade cabinetmaking, soft warm top-left illumination, rich restrained material. For nine-slice live game board frame.
