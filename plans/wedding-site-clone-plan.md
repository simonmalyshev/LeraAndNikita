# Wedding Site Clone Plan

## Source
https://inviteforwedd.ru/danilandelizaveta/package1

## Project Folder
`E:\Storage\Personal\LeraAndNikita\wedding-site\`

## Structure
```
wedding-site/
├── index.html          # Main page
├── css/
│   └── style.css       # All styles (fonts, layout, animations, responsive)
├── js/
│   └── main.js         # Scroll animations, form handling
├── images/             # 30 downloaded images
│   ├── paper-texture.jpg
│   ├── header-names.png
│   ├── ... (30 files total)
└── fonts/              # 9 WOFf font files
    ├── Saint-Thin.woff
    ├── centurygothic.woff
    ├── Acrom-Light.woff
    ├── Lithium_tf.woff
    ├── CormorantGaramond-Re.woff
    ├── Acrom.woff
    ├── CormorantInfant-Regu.woff
    ├── Saint_-_ExtraBold.woff
    └── Saint-Black.woff
```

## Approach
- Replicate Tilda's T396 Zero Block behavior: single artboard container (1200px wide, centered) with absolute-positioned elements
- Use CSS `transform: scale()` for responsive scaling (identical to Tilda's approach)
- Montserrat from Google Fonts + "Saint" custom font family (9 @font-face declarations)
- Scroll-based reveal animations via Intersection Observer (replacing Tilda's animation system)
- Heart pulse animation on date section (SBS loop)

## Page Sections (top to bottom, within 1200px artboard, 5943px total height)
1. **Header** (0-450px): Names "Даниил и Елизавета" + heart + decorative lines + corner florals
2. **Invitation text** (~944px): Welcome text paragraph
3. **Date** (~1243px): "13 СЕНТЯБРЯ" + heart icon with pulse
4. **Location** (~1930px): "ПРОГУЛКА / ФУРШЕТ" title + Royal Beach address
5. **Timeline** (~2480-3500px): "ТАЙМИНГ" title + 3 events (17:00, 17:30, 18:00) with vertical timeline
6. **Dress code** (~3744-4135px): Dress code image + decorative circles
7. **RSVP Form** (~4637-5168px): "ЖДЁМ ВАС!" title + form with inputs + submit button

## Color Palette
| Element | Color |
|---------|-------|
| Page background | #efe9d6 |
| Artboard background | #e5e5e5 |
| Section paper overlay | #ffffff at 35% opacity |
| Text (dark) | #142c0c |
| Accent (gold) | #a78309 |
| Button bg | #969a65 |
| Button text | #ffffff |

## Fonts
- **Montserrat** (Google Fonts): headings, body text
- **Saint** (custom): decorative text elements — assembled from 9 different WOFf files for weights 100-900

## Images to Download (30 total)
All from `https://static.tildacdn.com/` — to be downloaded and saved locally.

## Animations (scroll-triggered)
- `fadein` (opacity 0→1) — 18 elements
- `fadeinup` (translateY 100px→0 + opacity) — 10 elements
- `fadeinright` (translateX -100px→0 + opacity) — 1 element
- `fadeinleft` (translateX 100px→0 + opacity) — 1 element
- SBS pulse loop on date heart icon

## Responsive Strategy
- Desktop (>1200px): fixed 1200px container, centered
- Tablet (960-1200px): scale down proportionally
- Mobile (<960px): further scale down
- Use CSS `transform: scale()` with viewport-width-based calculation
- Font sizes scale with container

## Implementation Order
1. Create folder structure
2. Download all images (30) + fonts (9)
3. Write index.html with all 50 elements
4. Write style.css (fonts, layout, animations, responsive scaling)
5. Write main.js (scroll animations via Intersection Observer)
6. Test on localhost
7. Verify against original

## Form
- Visual only — looks identical but doesn't submit
- Fields: name, phone/telegram, guests count, message
- Same styling as original (gold borders, olive button)
