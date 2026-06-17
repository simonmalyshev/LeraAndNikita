# План исправления свадебного сайта
## Сравнение локальной копии с оригиналом (inviteforwedd.ru)

**Дата:** 2026-06-15  
**Оригинал:** https://inviteforwedd.ru/danilandelizaveta/package1  
**Локальная копия:** E:\Storage\Personal\LeraAndNikita\wedding-site

---

## Решения пользователя

| Вопрос | Решение |
|--------|---------|
| Мобильная версия | Полные breakpoint-позиции (data-field-*-res-320-value для каждого элемента) |
| Форма RSVP | Визуальная (показывает «Спасибо», данные никуда не отправляются) |
| Шрифты «Saint» | Удалить всё лишнее (9 файлов ~185KB, нигде не используются) |
| OG-теги/favicon | Не нужны (сайт приватный, только прямая ссылка) |

---

## Этап 1. Критические исправления (блокируют корректное отображение)

### 1.1. Добавить пропущенную 7-ю секцию бумаги (top=4821)

**Проблема:** В локальной копии 6 секций бумаги, в оригинале — 7.  
Пропущен элемент `data-elem-id="1710312698224"` с top=4821px.  
В результате — видимый разрыв текстуры фона ~960px в районе RSVP.

**Файл:** `index.html`  
**Действие:** Вставить после Paper Section 5 (top=3859) и перед Paper Section 6 (top=5785):

```html
<!-- Paper Section 6: top=4821 (MISSING — add from original) -->
<div class="tn-elem" data-elem-id="1710312698224" data-elem-type="shape" data-field-top-value="4821" data-field-left-value="-176" data-field-height-value="965" data-field-width-value="1552" style="z-index:2; top:4821px; left:-176px; width:1552px; height:965px; pointer-events:none;">
    <div class="tn-atom t-bgimg" data-original="images/paper-texture.jpg" style="background-image:url('images/paper-texture.jpg'); background-size:cover; background-position:50% 50%; opacity:0.35; background-color:#ffffff;"></div>
</div>
```

**Переименовать нумерацию:** Текущую Paper Section 6 (top=5785) переименовать в Paper Section 7.

---

### 1.2. Добавить обёртки `t396__carrier` и `t396__filter` внутри артборда

**Проблема:** В оригинале внутри `.t396__artboard` есть два пустых контейнера:
```html
<div class="t396__carrier" id="t396__carrier_718911148" data-artboard-recid="718911148"></div>
<div class="t396__filter" id="t396__filter_718911148"></div>
```
В локальной копии они отсутствуют. Это нужно для:
- Фонового изображения артборда (carrier)
- CSS-фильтров (filter)
- Корректной работы Tilda-подобного масштабирования

**Файл:** `index.html`  
**Действие:** Вставить сразу после открывающего `<div class="t396__artboard" ...>`, перед первым `tn-elem`.

---

### 1.3. Исправить позиционирование `left` на `calc(50% - 600px + X)`

**Проблема:** Локальная версия использует `left: Xpx` (фиксированные пиксели).  
Оригинал использует `left: calc(50% - 600px + Xpx)` — это корректно центрирует элементы относительно 1200px артборда при любом viewport.

**Файл:** `index.html`  
**Действие:** Заменить ВСЕ `left: Xpx` в inline стилях на `left: calc(50% - 600px + Xpx)`.

Примеры замены:
| Было | Стало |
|------|-------|
| `left:-176px` | `left:calc(50% - 600px + -176px)` |
| `left:437px` | `left:calc(50% - 600px + 437px)` |
| `left:729px` | `left:calc(50% - 600px + 729px)` |

Это касается ВСЕХ элементов в артборде (~60+ элементов).

---

### 1.4. Исправить позиционирование сердца относительно даты «13»

**Проблема:** В оригинале сердце накладывается на «13» с перекрытием 7px (heart top=1405, «13» bottom=1412 при autoheight=47px).  
В локальной копии: «13» имеет `height:30px` вместо autoheight → «13» короче на 17px → сердце висит на 17px ниже относительно числа.

**Файл:** `index.html`  
**Действие:**  
1. У элемента «13» (data-elem-id `176120245322681380`): изменить `width:44px; height:30px` → `width:39px` (убрать height, оставить autoheight)  
2. Убрать фиксированную `height:30px` — пусть текст определяет высоту автоматически (оригинал: autoheight → 47px при font-size 30px)

---

### 1.5. Добавить полные breakpoint-позиции для мобильной версии (320px)

**Проблема:** Оригинал имеет для каждого элемента набор атрибутов с позициями для экранов 320/480/640/960px:
```
data-field-top-res-320-value="241"
data-field-left-res-320-value="15"
data-field-width-res-320-value="290"
data-field-fontsize-res-320-value="22"
```
Локальная копия не имеет ни одного из этих атрибутов. На мобильных элементы сохраняют desktop-позиции.

**Файл:** `index.html`  
**Действие:** Извлечь из оригинала все responsive-атрибуты и добавить к каждому элементу.  
Основные группы атрибутов для добавления:
- `data-field-top-res-320-value`
- `data-field-left-res-320-value`  
- `data-field-width-res-320-value`
- `data-field-height-res-320-value`
- `data-field-fontsize-res-320-value` (для текстовых элементов)
- `data-animate-delay-res-320` (для анимированных элементов)

**Файл:** `js/main.js`  
**Действие:** Реализовать логику чтения responsive-атрибутов и применения соответствующих позиций при масштабировании. При viewport < 320/480/640/960 — подставлять значения из `data-field-*-res-X-value`.

**Объём работы:** ~60 элементов × ~5 атрибутов = ~300 строк данных + JS-логика переключения breakpoint-ов.

---

## Этап 2. Средние исправления (влияет на визуальное качество)

### 2.1. Добавить background-color на обёртку `#rec718911148`

**Проблема:** В оригинале: `<div id="rec718911148" style="background-color:#efe9d6;">`  
В локальной: нет inline background-color.

**Файл:** `index.html`  
**Действие:** Добавить `style="background-color:#efe9d6;"` на div `#rec718911148`.

---

### 2.2. Исправить Title страницы

**Проблема:** Локальный: `<title>Даниил и Елизавета</title>`  
Оригинал: `<title>Даниил и Елизавета (1 пакет)</title>`

**Файл:** `index.html`  
**Действие:** Обновить title. **Вопрос пользователю:** — может лучше убрать «(1 пакет)»? Это техническая пометка Tilda, а не часть названия.

---

### 2.3. Добавить `<meta name="format-detection" content="telephone=no">`

**Проблема:** В оригинале есть, в локальной — нет. Без него мобильные браузеры могут превращать номера телефонов в ссылки.

**Файл:** `index.html`  
**Действие:** Добавить в `<head>`.

---

### 2.4. Исправить анимацию сердца (SBS → корректный pulse)

**Проблема:** Оригинал использует Tilda SBS (Step-By-Step) анимацию:
```json
data-animate-sbs-opts="[{'ti':'0','mx':'0','my':'0','sx':'1','sy':'1'},{'ti':1000,'mx':'0','my':'0','sx':'1.4','sy':'1.4'},{'ti':1000,'mx':'0','my':'0','sx':'1','sy':'1'}]"
data-animate-sbs-event="intoview"
data-animate-sbs-loop="loop"
```
Локальная: CSS keyframe `t-pulse` с другими easing-кривыми.

**Файл:** `js/main.js` + `css/style.css`  
**Действие:** Реализовать SBS-подобную анимацию через JS:
- 1000ms scale up (1→1.4) с `bounceFin` easing
- 1000ms scale down (1.4→1) с ease-out
- loop infinite
- Trigger на intoview (уже работает через IntersectionObserver)

---

### 2.5. Добавить class `t-animate` на анимированные элементы

**Проблема:** Оригинал добавляет `t-animate` как class на все animated-элементы.  
Локальная копия использует `t-animate_started` (добавляется JS).

**Файл:** `index.html`  
**Действие:** Добавить class `t-animate` на все элементы с `data-animate-style`.

---

### 2.6. Добавить data-original на изображения (lazy loading)

**Проблема:** Оригинал использует Tilda lazy loading: `data-original="URL"` + tiny `src`.  
Локальная копия загружает все картинки сразу.

**Файл:** `index.html` + `js/main.js`  
**Действие:** Добавить `data-original="images/X.png"` на все `<img>`, реализовать простой lazy-load в JS (IntersectionObserver, подставлять src при появлении в viewport).

---

### 2.7. Добавить недостающие Tilda-атрибуты данных

**Проблема:** Оригинал содержит ~11 дополнительных data-атрибутов на каждом элементе:
- `data-field-axisy-value="top"`
- `data-field-axisx-value="left"`
- `data-field-container-value="grid"`
- `data-field-topunits-value="px"`
- `data-field-leftunits-value="px"`
- `data-field-heightunits-value="px"`
- `data-field-widthunits-value="px"`
- `data-field-filewidth-value="974"`
- `data-field-fileheight-value="178"`
- `data-field-heightmode-value="hug"` / `"fixed"`
- `data-field-textfit-value="autoheight"` (для текстовых)

**Файл:** `index.html`  
**Действие:** Извлечь из оригинала и добавить к каждому элементу. Необходимо для корректной работы responsive-логики (этап 1.5).

---

## Этап 3. Очистка и доработка

### 3.1. Удалить неиспользуемые шрифты «Saint»

**Проблема:** 9 @font-face declarations в CSS + 9 .woff файлов в `/fonts/` — нигде не используются.

**Файлы для удаления:**
- `fonts/Acrom-Light.woff`
- `fonts/Acrom.woff`
- `fonts/centurygothic.woff`
- `fonts/CormorantGaramond-Re.woff`
- `fonts/CormorantInfant-Regu.woff`
- `fonts/Lithium_tf.woff`
- `fonts/Saint_-_ExtraBold.woff`
- `fonts/Saint-Black.woff`
- `fonts/Saint-Thin.woff`

**Файл:** `css/style.css`  
**Действие:** Удалить все 9 `@font-face` блоков (строки 12–73) и CSS-переменную `--t-headline-font`.

---

### 3.2. Исправить рендеринг декоративных цветов (стоят «боком»)

**Проблема:** Пользователь сообщает, что декоративные цветы слева и справа от календаря «стоят боком, а должны быть параллельны календарю». Речь об элементах:
- `floral-left.png` (data-elem-id `1709729261544`, top:1067, left:-155, 700×390)
- `floral-right.png` (data-elem-id `1709729931803`, top:1067, left:655, 700×390)

**Результаты анализа:**
- Позиционирование (top, left, width, height) **идентично** оригиналу
- CSS-трансформации (rotate, skew) **отсутствуют** на всех элементах
- Размеры файлов совпадают с оригиналом: оба 1680×935px, ratio=1.797
- Отображаемый контейнер 700×390 — ratio=1.795 ✅

**Вероятная причина:** CSS-правило `.tn-atom` использует `display: table-cell`, а `.tn-atom__img` — `height: auto`. В оригинале Tilda использует `display: block` для img-атома и `height: 100%` для изображения, что заставляет картинку заполнять контейнер точно. При `height: auto` изображение может рендериться иначе, если контейнер имеет `display: table-cell`.

**Действие:**
1. Изменить в `style.css` для `.tn-atom` для image-элементов: убрать `display: table-cell` и заменить на `display: block`
2. Изменить `.tn-atom__img`: добавить `height: 100%; object-fit: cover;` вместо `height: auto`
3. Если не поможет — проверить, не содержат ли PNG-файлы EXIF metadata с поворотом (Image.PropertyItems[0x0112] — Orientation), и при необходимости очистить EXIF
4. Визуальная проверка после исправления

---

### 3.3. Удалить console.log из production-кода

**Файл:** `js/main.js`  
**Действие:** Удалить или обернуть в debug-флаг все `console.log()` вызовы (строки 50, 66, 70, 100, 124, 129, 147, 153, 166, 176, 182).

---

## Порядок реализации

```
Этап 1.1 — Добавить Paper Section 7          → index.html
Этап 1.2 — Добавить carrier/filter обёртки   → index.html
Этап 1.3 — Исправить left на calc()          → index.html (массовая замена)
Этап 1.4 — Исправить сердце/«13» позиционирование → index.html
Этап 1.5 — Добавить breakpoint-позиции       → index.html + main.js (самый объёмный)
    ↓ зависит от 1.5
Этап 2.1 — Background-color на обёртку       → index.html
Этап 2.2 — Исправить title                   → index.html
Этап 2.3 — Meta format-detection             → index.html
Этап 2.4 — Исправить анимацию сердца         → main.js + style.css
Этап 2.5 — Добавить class t-animate          → index.html
Этап 2.6 — Lazy loading изображений          → index.html + main.js
Этап 2.7 — Добавить Tilda data-атрибуты      → index.html (зависит от 1.5 — данные из того же источника)
    ↓
Этап 3.1 — Удалить Saint шрифты              → style.css + fonts/
Этап 3.2 — Исправить рендеринг цветов         → style.css (tn-atom display + tn-atom__img height)
Этап 3.3 — Удалить console.log               → main.js
```

---

## Известные риски

| Риск | Вероятность | Влияние | Митигация |
|------|------------|---------|-----------|
| Responsive breakpoints из оригинала могут быть неполными (Tilda может генерировать их динамически) | Средняя | Элементы на мобильных будут немного смещены | После вставки — визуальная проверка на 320px/480px/640px |
| calc() позиционирование может конфликтовать с JS-масштабированием | Низкая | Артборд может дважды масштабироваться | Тестирование на разных viewport |
| Удаление Saint-шрифтов может сломать что-то, если они используются в inline-стилях | Низкая | Текст отобразится fallback-шрифтом | grep по проекту на 'Saint' перед удалением |
| EXIF-ориентация в PNG | Исключено | — | Не содержит EXIF orientation metadata (проверено) |

---

## Критерии приёмки

- [ ] 7 секций бумаги покрывают весь артборд без разрывов
- [ ] `t396__carrier` и `t396__filter` присутствуют в DOM
- [ ] Все элементы позиционируются через `calc(50% - 600px + X)`
- [ ] Сердце накладывается на «13» с перекрытием ~7px (как в оригинале)
- [ ] На viewport 320px элементы перестраиваются в мобильные позиции
- [ ] Saint-шрифты удалены
- [ ] Title корректный
- [ ] Декоративные цветы корректно параллельны календарю (не «боком»)
- [ ] Анимация сердца визуально совпадает с оригиналом
