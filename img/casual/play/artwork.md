# Материалы игровых полей

2026-09-26. Созданы встроенным imagegen. PNG — исходники, WebP — игровые версии, перекодированные без изменения композиции через `scripts/encode-casual-art.js`.

Используются непосредственно в `style-casual-premium.css`. Карточные лица используют существующую `КолодаРисунок`; знаки маджонга, флаг, мина и змейка рисуются точно через `js/casual-art.js`.

## felt.png / felt.webp

Production game asset: one seamless-looking square deep emerald billiard velvet fabric texture, directly overhead orthographic macro photograph. Finely woven real felt with subtle organic fibers, soft warm broad illumination at upper center, dark corners, restrained understated luxury. Uniform empty surface, NO objects, NO edges, NO frame, NO text, NO symbols, NO folds, NO seams, NO perspective. The texture must remain low contrast and dark enough for ivory playing cards and colored gemstones to be clearly readable on top. This will be the actual playing surface in a premium tabletop game, not a cover or illustration.

## gems.png / gems.webp

Production 2D game sprite atlas with a genuinely TRANSPARENT background. Exact layout: THREE equal columns by TWO equal rows, six equal square cells, overall aspect ratio 3:2. One isolated gemstone centered in each cell, each occupies 82% of its square cell, consistent scale and margins. Top row left to right: deep blue sapphire diamond/rhombus, luminous ivory spherical pearl, crimson ruby teardrop. Bottom row left to right: purple amethyst triangle, honey amber hexagonal gem, rich emerald square cushion-cut gem. Top-down orthographic view, realistic premium jewelry faceting and caustics, tiny contact shadow only, warm key light upper left, exceptional material detail at small sizes. NO letters, NO symbols printed on gems, NO text, NO frame, NO board, NO decorations, NO additional objects. Precisely align centers at 1/6, 1/2, 5/6 of image width and 1/4, 3/4 of image height. Actual usable sprites for match-three gameplay, not a mockup.

Примечание: генератор сохранил тёмный фон; в игре используются отдельные CSS-контуры шести камней. Альфа-прозрачность исходника не заявляется.

## tiles.png / tiles.webp

Production texture atlas for premium tabletop game pieces, 3 columns by 2 rows, six equal square cells, overall 3:2 aspect ratio. Each cell contains ONE square blank rounded ceramic/glass tile, directly overhead orthographic front face, centered exactly, occupying 88% of its cell width and height. Fine beveled edge, thick tactile rim, micro surface detail and realistic subtle upper-left studio reflection, no perspective skew. Top row: honey-gold polished enamel tile; deep jade-green glazed tile; slate sapphire-blue glazed tile. Bottom row: muted garnet burgundy tile; smoky amethyst purple tile; warm ivory porcelain tile. Absolutely NO numbers, symbols, letters, pips or objects on tile faces: the game will draw these separately. Plain nearly black backdrop, minimal shadow, no board or scene. Uniform exact dimensions and alignment across all six cells. Beautiful high-end materials, refined, not plastic buttons.
