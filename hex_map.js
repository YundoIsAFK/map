'use strict';

window.onload = () => {
  const fromAlpha = (s) => s.split('').reduce((r, a) => r * 26 + parseInt(a, 36) - 9, 0) - 1;

  const toAlpha = (n) => {
    let result = '';
    do {
      result = (n % 26 + 10).toString(36) + result;
      n = Math.floor(n / 26) - 1;
    } while (n >= 0);
    return result.toUpperCase();
  };

  const clampIndex = (idx, len) => {
    if (!len) return 0;
    const n = Number(idx) || 0;
    return ((n % len) + len) % len;
  };

  const getCoords = (compoundValue) => {
    for (let i = 0; i < compoundValue.length; i++) {
      if (/[A-Z]/.test(compoundValue[i])) continue;
      const x = compoundValue.substr(0, i);
      const y = compoundValue.substr(-(compoundValue.length - i));
      return [x, y];
    }
  };

  const findCenter = (endWidth, endHeight) => `${toAlpha(Math.floor(endWidth / 2))}${Math.floor(endHeight / 2)}`;

  const getActiveTiles = (theme) => {
    const tilesets = ['standard', 'resource', 'special'];
    const activeTiles = [];
    tilesets.forEach((tileset) => {
      const arr = (TILES?.[tileset]?.[theme]) || [];
      for (let i = 0; i < arr.length; i++) activeTiles.push(arr[i]);
    });
    return activeTiles;
  };

  // Every theme/palette (grass, sand, halloween, easter, winter, ...) is
  // read straight from data.js rather than hardcoded, so new palettes
  // just need an entry in TILES to show up here. Themes are NOT required
  // to share tile counts or ordering with each other.
  const THEME_KEYS = Object.keys(TILES?.standard || {});

  const themeTilesCache = new Map();
  const tilesForTheme = (theme) => {
    if (!themeTilesCache.has(theme)) themeTilesCache.set(theme, getActiveTiles(theme));
    return themeTilesCache.get(theme);
  };

  // Each painted cell remembers which theme/palette it was painted from,
  // not just a bare index. That way switching the active palette (to pick
  // a different set of tiles to paint with) never reinterprets tiles that
  // are already on the map under the old palette's numbering.
  const encodeCell = (theme, idx) => `${theme}:${idx}`;

  const decodeCell = (raw) => {
    if (raw === undefined || raw === null) return null;

    if (typeof raw === 'number') return { theme: FIXED_THEME, idx: raw };

    const s = String(raw);
    const sep = s.lastIndexOf(':');
    if (sep === -1) {
      const n = Number(s);
      return Number.isFinite(n) ? { theme: FIXED_THEME, idx: n } : null;
    }

    const theme = s.slice(0, sep);
    const idx = Number(s.slice(sep + 1));
    return { theme, idx: Number.isFinite(idx) ? idx : 0 };
  };

  // Resolves a stored cell value to a concrete { theme, idx, tiles, tile }
  // regardless of which palette is currently active, falling back to the
  // default ground tile if the value is missing/invalid or its theme no
  // longer exists in data.js.
  const resolveCell = (raw) => {
    let data = decodeCell(raw);
    let tiles = data ? tilesForTheme(data.theme) : [];

    if (!data || !tiles.length) {
      data = { theme: FIXED_THEME, idx: DEFAULT_TILE_INDEX };
      tiles = tilesForTheme(FIXED_THEME);
    }

    const idx = clampIndex(data.idx, tiles.length);
    return { theme: data.theme, idx, tiles, tile: tiles[idx] };
  };

  const makeTitleText = (data) => {
    return (
      `Name: ${data.name}\n` +
      `Energy Cost: ${data.cost}\n` +
      `Points: ${data.points}\n` +
      `Buildable: ${data.buildable}\n` +
      `Passable: ${data.passable}\n` +
      `Defense modifier: ${data.defense_modifier}\n` +
      `Attack modifier: ${data.attack_modifier}`
    );
  };

  const updateTile = (nextTile, cellIndex) => {
    const target = document.querySelector(`[data-cell='${cellIndex}']`);
    if (!target) return;

    const nextColor = nextTile.color;
    target.title = makeTitleText(nextTile);

    if (nextTile.src && nextTile.src.length) {
      for (const child of target.children) {
        if (child.classList.contains('left')) child.style.opacity = 0;
        else if (child.classList.contains('middle')) child.style.background = 'transparent';
        else if (child.classList.contains('right')) child.style.opacity = 0;
      }
      target.style.backgroundImage = `url(${nextTile.src})`;
    } else {
      target.style.backgroundImage = 'none';
      for (const child of target.children) {
        if (child.classList.contains('left')) {
          child.style.opacity = 1;
          child.style.borderRightColor = nextColor;
        } else if (child.classList.contains('middle')) {
          child.style.background = nextColor;
        } else if (child.classList.contains('right')) {
          child.style.opacity = 1;
          child.style.borderLeftColor = nextColor;
        }
      }
    }
  };

  const base64UrlEncode = (str) => {
    const bytes = new TextEncoder().encode(str);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
  };

  const base64UrlDecode = (b64url) => {
    let b64 = b64url.replace(/-/g, '+').replace(/_/g, '/');
    while (b64.length % 4) b64 += '=';
    const binary = atob(b64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return new TextDecoder().decode(bytes);
  };

  
  // Every map is generated at a fixed size and theme. There is no
  // per-map width/height/theme control anymore.
  const FIXED_WIDTH = 'AS';
  const FIXED_HEIGHT = 46;
  const FIXED_THEME = 'grass';
  const DEFAULT_TILE_INDEX = 0; // brand-new cells always start as the first palette tile

  const gridEl = document.getElementById('grid');
  const centerEl = document.getElementById('center');

  const buildableEl = document.getElementById('buildable');
  const pointsEl = document.getElementById('points');

  const undoBtn = document.getElementById('undo');
  const redoBtn = document.getElementById('redo');
  const resetBtn = document.getElementById('reset');

  const exportJsonBtn = document.getElementById('export-json');
  const exportCodeBtn = document.getElementById('export-code');
  const exportPngBtn = document.getElementById('export-png');
  const importBtn = document.getElementById('import');

  const paletteEl = document.getElementById('palette');
  const paletteThemeBtn = document.getElementById('palette-theme-btn');
  const paletteThemeMenu = document.getElementById('palette-theme-menu');
  const paletteThemeLabel = document.getElementById('palette-theme-label');

  const modal = document.getElementById('modal');
  const modalTitle = document.getElementById('modal-title');
  const modalText = document.getElementById('modal-text');
  const modalHint = document.getElementById('modal-hint');
  const modalClose = document.getElementById('modal-close');
  const modalPrimary = document.getElementById('modal-primary');
  const modalSecondary = document.getElementById('modal-secondary');

  
  const gridColors = JSON.parse(localStorage.getItem('hexMap')) || {};

  const endWidth = fromAlpha(FIXED_WIDTH);
  const endHeight = FIXED_HEIGHT;

  // "paletteTheme" is which palette (grass/sand/halloween/etc) the brush is
  // currently painting from. It only decides what's offered in the Palette
  // panel and what gets stamped onto newly-painted cells — it has no effect
  // on the map's fixed base theme, and switching it never touches tiles
  // already on the map (each of those remembers its own theme, see above).
  let paletteTheme = String(localStorage.getItem('paletteTheme') || '').trim();
  if (!THEME_KEYS.includes(paletteTheme)) paletteTheme = THEME_KEYS.includes(FIXED_THEME) ? FIXED_THEME : (THEME_KEYS[0] || FIXED_THEME);

  let activeTiles = tilesForTheme(paletteTheme);

  // "selectedIndex" is the paint tool (which tile within the active
  // palette the brush currently places), independent from
  // DEFAULT_TILE_INDEX which is what a brand new, never-painted cell
  // starts out as (always the map's fixed base theme).
  let selectedIndex = clampIndex(localStorage.getItem('selectedTile'), activeTiles.length);

  const legacyFill = localStorage.getItem('fillColor');
  if (legacyFill !== null && legacyFill !== undefined) {
    selectedIndex = clampIndex(legacyFill, activeTiles.length);
    localStorage.setItem('selectedTile', String(selectedIndex));
    localStorage.removeItem('fillColor');
  }

  // Clean up now-unused legacy keys from earlier versions of the app
  // that had per-map width/height/theme controls.
  localStorage.removeItem('width');
  localStorage.removeItem('height');
  localStorage.removeItem('theme');
  localStorage.removeItem('change-theme');

  const counters = { buildable: 0, points: 0 };

  
  const undoStack = [];
  const redoStack = [];
  const MAX_HISTORY = 200;

  let strokeBefore = null; 
  let strokeAfter = null;  
  let isPainting = false;
  let lastCell = null;

  
  const updateUndoRedoUI = () => {
    if (undoBtn) undoBtn.disabled = undoStack.length === 0;
    if (redoBtn) redoBtn.disabled = redoStack.length === 0;
  };

  const updateStatsUI = () => {
    if (buildableEl) buildableEl.textContent = `${Math.round(counters.buildable / 4)} / ${counters.buildable}`;
    if (pointsEl) pointsEl.textContent = `${Math.round(counters.points / 4)} / ${counters.points}`;
  };

  const recalcCountersFromDOM = () => {
    counters.buildable = 0;
    counters.points = 0;

    const hexes = document.querySelectorAll('#grid .hexagon');
    for (const hex of hexes) {
      const cell = hex.dataset.cell;
      if (!cell) continue;

      const resolved = resolveCell(gridColors[cell]);
      gridColors[cell] = encodeCell(resolved.theme, resolved.idx);

      const t = resolved.tile;
      if (!t) continue;

      counters.buildable += t.buildable ? 1 : 0;
      counters.points += Number(t.points) || 0;
    }

    updateStatsUI();
  };

  const shouldSkipFromPalette = (tileObj) => {
    if (!tileObj) return true;

    if (paletteTheme === 'easter') {
      const n = String(tileObj.name || '').toLowerCase();
      const isBaseResource = n === 'mine' || n === 'library' || n === 'remote village' || n === 'village';
      const src = String(tileObj.src || '');
      const isEasterBaseResourceSrc =
        src.includes('./img/resource/easter/Mine.png') ||
        src.includes('./img/resource/easter/Library.png') ||
        src.includes('./img/resource/easter/Village.png');

      if (isBaseResource && isEasterBaseResourceSrc) return true;
    }

    return false;
  };

  const highlightPaletteSelection = () => {
    if (!paletteEl) return;
    for (const el of paletteEl.querySelectorAll('.palette-item')) {
      const elIdx = Number(el.dataset.index);
      el.classList.toggle('selected', elIdx === selectedIndex);
    }
  };

  const setSelectedIndex = (idx) => {
    selectedIndex = clampIndex(idx, activeTiles.length);
    localStorage.setItem('selectedTile', String(selectedIndex));
    highlightPaletteSelection();
  };

  const buildPalette = () => {
    if (!paletteEl) return;
    paletteEl.innerHTML = '';

    for (let idx = 0; idx < activeTiles.length; idx++) {
      const t = activeTiles[idx];
      if (shouldSkipFromPalette(t)) continue;

      const item = document.createElement('button');
      item.type = 'button';
      item.className = 'palette-item';
      item.dataset.index = String(idx);
      item.title = makeTitleText(t);

      if (t.src && t.src.length) {
        item.style.backgroundImage = `url(${t.src})`;
      } else {
        item.classList.add('color-fallback');
        const swatch = document.createElement('div');
        swatch.classList.add('swatch');
        swatch.style.background = t.color;
        item.appendChild(swatch);
      }

      item.addEventListener('click', () => setSelectedIndex(idx));
      paletteEl.appendChild(item);
    }

    highlightPaletteSelection();
  };

  const titleCase = (s) => String(s || '').replace(/\b\w/g, (c) => c.toUpperCase());

  const buildPaletteThemeMenu = () => {
    if (!paletteThemeMenu) return;
    paletteThemeMenu.innerHTML = '';

    for (const theme of THEME_KEYS) {
      const item = document.createElement('button');
      item.type = 'button';
      item.className = 'dropdown-item';
      item.dataset.value = theme;
      item.textContent = titleCase(theme);
      paletteThemeMenu.appendChild(item);
    }
  };

  const updatePaletteThemeUI = () => {
    if (paletteThemeLabel) paletteThemeLabel.textContent = titleCase(paletteTheme);

    if (paletteThemeMenu) {
      for (const btn of paletteThemeMenu.querySelectorAll('.dropdown-item')) {
        btn.classList.toggle('active', btn.dataset.value === paletteTheme);
      }
    }
  };

  const togglePaletteThemeMenu = (forceOpen = null) => {
    if (!paletteThemeBtn || !paletteThemeMenu) return;
    const isOpen = paletteThemeBtn.getAttribute('aria-expanded') === 'true';
    const next = forceOpen === null ? !isOpen : !!forceOpen;
    paletteThemeBtn.setAttribute('aria-expanded', next ? 'true' : 'false');
    paletteThemeMenu.classList.toggle('open', next);
  };

  // Switching the active palette only changes what's available to paint
  // WITH from here on — it never touches tiles already placed on the map.
  const setPaletteTheme = (theme) => {
    if (!THEME_KEYS.includes(theme) || theme === paletteTheme) return;

    paletteTheme = theme;
    localStorage.setItem('paletteTheme', paletteTheme);

    activeTiles = tilesForTheme(paletteTheme);
    selectedIndex = 0;
    localStorage.setItem('selectedTile', String(selectedIndex));

    updatePaletteThemeUI();
    buildPalette();
  };

  const isValidCell = (cell) => {
    const parts = getCoords(cell);
    if (!parts) return false;
    const [x, yStr] = parts;
    const xN = fromAlpha(x);
    const yN = parseInt(yStr, 10);
    if (!Number.isFinite(xN) || !Number.isFinite(yN)) return false;
    if (xN < 0 || xN > endWidth) return false;
    if (yN < 1 || yN > endHeight) return false;
    return true;
  };

  const pruneGridColorsToCurrentSize = () => {
    for (const key of Object.keys(gridColors)) {
      if (!isValidCell(key)) delete gridColors[key];
    }
  };

  const makeHexagon = (text = '', even = false, hidden = false) => {
    const hexagon = document.createElement('div');
    const left = document.createElement('div');
    const middle = document.createElement('div');
    const right = document.createElement('div');

    hexagon.classList.add('hexagon');
    left.classList.add('left');
    middle.classList.add('middle');
    right.classList.add('right');

    middle.innerText = text;
    hexagon.setAttribute('data-cell', text);

    if (even) hexagon.classList.add('even');
    if (hidden) hexagon.style.visibility = 'hidden';

    const resolved = resolveCell(gridColors[text]);
    gridColors[text] = encodeCell(resolved.theme, resolved.idx);

    const currentTile = resolved.tile || resolved.tiles[0];
    hexagon.title = makeTitleText(currentTile);

    if (currentTile?.src && currentTile.src.length) {
      hexagon.style.backgroundImage = `url(${currentTile.src})`;
    } else {
      left.style.opacity = 1;
      left.style.borderRightColor = currentTile.color;
      middle.style.background = currentTile.color;
      right.style.opacity = 1;
      right.style.borderLeftColor = currentTile.color;
    }

    counters.buildable += currentTile.buildable ? 1 : 0;
    counters.points += Number(currentTile.points) || 0;

    hexagon.appendChild(left);
    hexagon.appendChild(middle);
    hexagon.appendChild(right);

    return hexagon;
  };

  const makeHexagonRow = (rowIndex, staggered = false) => {
    const hexagonRow = document.createElement('div');
    hexagonRow.classList.add('hexagon-row');

    for (let w = fromAlpha('A'); w <= endWidth; w++) {
      const hideHexagon = staggered && w % 2 === 0;
      hexagonRow.appendChild(makeHexagon(toAlpha(w) + rowIndex, !(w % 2), hideHexagon));
    }
    return hexagonRow;
  };

  const rebuildGridDOM = () => {
    if (!gridEl) return;

    counters.buildable = 0;
    counters.points = 0;

    pruneGridColorsToCurrentSize();

    gridEl.innerHTML = '';
    const fragment = document.createDocumentFragment();

    for (let h = 1; h <= endHeight; h++) {
      fragment.appendChild(makeHexagonRow(h, h >= endHeight));
    }

    const columns = endWidth + 1;
    gridEl.style.width = columns * 95 + 100 + 'px';

    gridEl.appendChild(fragment);

    localStorage.setItem('hexMap', JSON.stringify(gridColors));
    updateStatsUI();
  };

  const getMirrors = (cellIndex) => {
    const [xAlpha, yStr] = getCoords(cellIndex);
    const y = Number(yStr);
    const x = fromAlpha(xAlpha);

    return [
      xAlpha + y,
      xAlpha + (x % 2 ? 1 + endHeight - y : endHeight - y),
      toAlpha(endWidth - x) + y,
      toAlpha(endWidth - x) + (x % 2 ? 1 + endHeight - y : endHeight - y)
    ];
  };

  const recordStrokeChange = (cell, beforeIdx, afterIdx) => {
    if (!strokeBefore || !strokeAfter) return;

    if (!strokeBefore.has(cell)) strokeBefore.set(cell, beforeIdx);
    strokeAfter.set(cell, afterIdx);
  };

  const applyPaintToCell = (cellIndex) => {
    const mirrors = getMirrors(cellIndex);

    mirrors.forEach((cell) => {
      if (!isValidCell(cell)) return;

      const beforeRaw = gridColors[cell];
      const before = resolveCell(beforeRaw);
      const oldTile = before.tile;

      if (oldTile) {
        counters.buildable -= oldTile.buildable ? 1 : 0;
        counters.points -= Number(oldTile.points) || 0;
      }

      const afterIdx = clampIndex(selectedIndex, activeTiles.length);
      gridColors[cell] = encodeCell(paletteTheme, afterIdx);

      const nextTile = activeTiles[afterIdx];
      if (!nextTile) return;

      updateTile(nextTile, cell);

      counters.buildable += nextTile.buildable ? 1 : 0;
      counters.points += Number(nextTile.points) || 0;

      recordStrokeChange(cell, encodeCell(before.theme, before.idx), gridColors[cell]);
    });

    localStorage.setItem('hexMap', JSON.stringify(gridColors));
    updateStatsUI();
  };

  const pushHistory = (beforeMap, afterMap) => {
    const beforeObj = {};
    const afterObj = {};

    for (const [k, v] of beforeMap.entries()) beforeObj[k] = v;
    for (const [k, v] of afterMap.entries()) afterObj[k] = v;

    const keys = Object.keys(afterObj);
    if (!keys.length) return;

    undoStack.push({ before: beforeObj, after: afterObj });
    if (undoStack.length > MAX_HISTORY) undoStack.shift();

    redoStack.length = 0;
    updateUndoRedoUI();
  };

  const applyHistoryState = (stateObj) => {
    for (const cell of Object.keys(stateObj)) {
      if (!isValidCell(cell)) continue;

      const resolved = resolveCell(stateObj[cell]);
      gridColors[cell] = encodeCell(resolved.theme, resolved.idx);

      if (resolved.tile) updateTile(resolved.tile, cell);
    }

    localStorage.setItem('hexMap', JSON.stringify(gridColors));
    recalcCountersFromDOM();
  };

  const undo = () => {
    if (!undoStack.length) return;
    const entry = undoStack.pop();
    redoStack.push(entry);
    applyHistoryState(entry.before);
    updateUndoRedoUI();
  };

  const redo = () => {
    if (!redoStack.length) return;
    const entry = redoStack.pop();
    undoStack.push(entry);
    applyHistoryState(entry.after);
    updateUndoRedoUI();
  };

  
  // The map's size and base theme are fixed for every map, so exports
  // mainly carry the tile layout (each cell already remembers its own
  // theme+tile) plus which palette/tile the brush currently has selected.
  const buildExportPayload = () => {
    return {
      v: 1,
      width: FIXED_WIDTH,
      height: FIXED_HEIGHT,
      theme: FIXED_THEME,
      paletteTheme,
      selectedTile: selectedIndex,
      gridColors
    };
  };

  const buildCompressedCode = () => {
    
    const payload = buildExportPayload();
    const compact = {
      v: payload.v,
      w: payload.width,
      h: payload.height,
      t: payload.theme,
      pt: payload.paletteTheme,
      s: payload.selectedTile,
      g: payload.gridColors
    };
    const json = JSON.stringify(compact);
    return `HM1:${base64UrlEncode(json)}`;
  };

  const parseImportText = (text) => {
    const trimmed = String(text || '').trim();

    if (trimmed.startsWith('HM1:')) {
      const raw = trimmed.slice(4);
      const json = base64UrlDecode(raw);
      const compact = JSON.parse(json);

      if (!compact || typeof compact !== 'object' || !compact.g) return null;

      return {
        v: compact.v || 1,
        paletteTheme: compact.pt,
        selectedTile: compact.s,
        gridColors: compact.g
      };
    }

    
    return JSON.parse(trimmed);
  };

  const applyImportPayload = (obj) => {
    if (!obj || typeof obj !== 'object') return false;
    if (!obj.gridColors || typeof obj.gridColors !== 'object') return false;

    if (obj.paletteTheme && THEME_KEYS.includes(obj.paletteTheme)) {
      paletteTheme = obj.paletteTheme;
      localStorage.setItem('paletteTheme', paletteTheme);
      activeTiles = tilesForTheme(paletteTheme);
    }

    if (obj.selectedTile !== undefined) {
      selectedIndex = clampIndex(obj.selectedTile, activeTiles.length);
      localStorage.setItem('selectedTile', String(selectedIndex));
    }

    
    for (const k of Object.keys(gridColors)) delete gridColors[k];
    for (const k of Object.keys(obj.gridColors)) gridColors[k] = obj.gridColors[k];

    return true;
  };

  
  const exportPNG = async () => {
  try {
    const grid = document.getElementById('grid');
    if (!grid) return;

    const hexes = Array.from(grid.querySelectorAll('.hexagon'));
    if (!hexes.length) return;

    
    const gridRect = grid.getBoundingClientRect();

    
    const padding = 20;
    const canvas = document.createElement('canvas');
    canvas.width = Math.ceil(grid.scrollWidth + padding * 2);
    canvas.height = Math.ceil(grid.scrollHeight + padding * 2);

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    
    ctx.fillStyle = '#282828';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    
    const imgCache = new Map();
    const loadImage = (src) =>
      new Promise((resolve) => {
        if (imgCache.has(src)) return resolve(imgCache.get(src));

        const img = new Image();
        img.onload = () => {
          imgCache.set(src, img);
          resolve(img);
        };
        img.onerror = () => resolve(null);
        img.src = src;
      });

    
    const extractUrl = (bg) => {
      if (!bg || bg === 'none') return null;
      const m = bg.match(/url\(["']?(.*?)["']?\)/i);
      return m ? m[1] : null;
    };

    
    const drawHexFallback = (x, y, w, h, color) => {
      const cx = x + w / 2;
      const cy = y + h / 2;
      const rx = w / 2;
      const ry = h / 2;

      ctx.fillStyle = color || '#444';
      ctx.beginPath();
      ctx.moveTo(cx - rx, cy);
      ctx.lineTo(cx - rx / 2, cy - ry);
      ctx.lineTo(cx + rx / 2, cy - ry);
      ctx.lineTo(cx + rx, cy);
      ctx.lineTo(cx + rx / 2, cy + ry);
      ctx.lineTo(cx - rx / 2, cy + ry);
      ctx.closePath();
      ctx.fill();
    };

    
    for (const hex of hexes) {
      const cell = hex.dataset.cell;
      if (!cell) continue;

      const r = hex.getBoundingClientRect();

      
      const x = Math.round((r.left - gridRect.left) + padding + grid.scrollLeft);
      const y = Math.round((r.top - gridRect.top) + padding + grid.scrollTop);
      const w = Math.round(r.width);
      const h = Math.round(r.height);

      const bg = getComputedStyle(hex).backgroundImage;
      const url = extractUrl(bg);

      if (url) {
        const img = await loadImage(url);
        if (img) {
          ctx.drawImage(img, x, y, w, h);
          continue;
        }
      }

      
      const tile = resolveCell(gridColors[cell]).tile;
      drawHexFallback(x, y, w, h, tile?.color || '#444');
    }

    const filename = `hex_map_${FIXED_WIDTH}_${FIXED_HEIGHT}.png`;

    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
    if (!blob) throw new Error('toBlob failed');

    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.rel = 'noopener';

    document.body.appendChild(a);
    a.click();
    a.remove();

    setTimeout(() => URL.revokeObjectURL(url), 1500);
  } catch (err) {
    console.error(err);
    alert('PNG export failed. Open DevTools Console to see the error.');
  }
};

  
  let modalMode = 'export-json';

  const openModal = (mode) => {
    modalMode = mode;
    if (!modal || !modalTitle || !modalText || !modalHint || !modalPrimary) return;

    if (mode === 'export-json') {
      modalTitle.textContent = 'Export JSON';
      modalPrimary.textContent = 'Copy';
      modalHint.textContent = 'Readable JSON export.';
      modalText.value = JSON.stringify(buildExportPayload(), null, 2);
      modalText.readOnly = true;
    } else if (mode === 'export-code') {
      modalTitle.textContent = 'Export Code';
      modalPrimary.textContent = 'Copy';
      modalHint.textContent = 'Shorter share code (paste into Import).';
      modalText.value = buildCompressedCode();
      modalText.readOnly = true;
    } else {
      modalTitle.textContent = 'Import';
      modalPrimary.textContent = 'Import';
      modalHint.textContent = 'Paste JSON export or HM1: share code.';
      modalText.value = '';
      modalText.readOnly = false;
    }

    modal.setAttribute('aria-hidden', 'false');
    modal.classList.add('open');

    modalText.focus();
    modalText.select();
  };

  const closeModal = () => {
    if (!modal) return;
    modal.setAttribute('aria-hidden', 'true');
    modal.classList.remove('open');
  };

  
  buildPaletteThemeMenu();
  updatePaletteThemeUI();
  buildPalette();

  if (centerEl) centerEl.textContent = findCenter(endWidth, endHeight);

  rebuildGridDOM();

  updateUndoRedoUI();

  
  const getCellFromEvent = (e) => {
    const hex = e.target.closest?.('.hexagon');
    if (!hex || !hex.dataset || !hex.dataset.cell) return null;
    return hex.dataset.cell;
  };

  if (gridEl) {
    gridEl.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;
      const cellIndex = getCellFromEvent(e);
      if (!cellIndex) return;

      isPainting = true;
      lastCell = cellIndex;

      strokeBefore = new Map();
      strokeAfter = new Map();

      gridEl.setPointerCapture?.(e.pointerId);
      applyPaintToCell(cellIndex);
    });

    gridEl.addEventListener('pointermove', (e) => {
      if (!isPainting) return;
      const cellIndex = getCellFromEvent(e);
      if (!cellIndex || cellIndex === lastCell) return;
      lastCell = cellIndex;
      applyPaintToCell(cellIndex);
    });

    const endStroke = () => {
      if (!isPainting) return;
      isPainting = false;
      lastCell = null;

      if (strokeBefore && strokeAfter) pushHistory(strokeBefore, strokeAfter);
      strokeBefore = null;
      strokeAfter = null;
    };

    gridEl.addEventListener('pointerup', endStroke);
    gridEl.addEventListener('pointercancel', endStroke);
  }
  if (gridEl) {
    const touchToCell = (touch) => {
      const el = document.elementFromPoint(touch.clientX, touch.clientY);
      const hex = el?.closest?.('.hexagon');
      return hex?.dataset?.cell || null;
    };

    let touchPainting = false;

    gridEl.addEventListener('touchstart', (e) => {
      if (!e.touches || !e.touches.length) return;

      // 2 fingers = let the browser handle pan/zoom
      if (e.touches.length >= 2) {
        touchPainting = false;
        lastCell = null;
        strokeBefore = null;
        strokeAfter = null;
        return;
      }

      const cell = touchToCell(e.touches[0]);
      if (!cell) return;

      e.preventDefault();

      touchPainting = true;
      lastCell = cell;

      strokeBefore = new Map();
      strokeAfter = new Map();

      applyPaintToCell(cell);
    }, { passive: false });

    gridEl.addEventListener('touchmove', (e) => {
      // 2 fingers = stop painting and let browser pan/zoom
      if (e.touches && e.touches.length >= 2) {
        if (touchPainting) {
          touchPainting = false;

          if (strokeBefore && strokeAfter) pushHistory(strokeBefore, strokeAfter);
          strokeBefore = null;
          strokeAfter = null;
          lastCell = null;
        }
        return;
      }

      if (!touchPainting) return;
      if (!e.touches || !e.touches.length) return;

      const cell = touchToCell(e.touches[0]);
      if (!cell || cell === lastCell) return;

      e.preventDefault();

      lastCell = cell;
      applyPaintToCell(cell);
    }, { passive: false });

    const endTouchStroke = () => {
      if (!touchPainting) return;

      touchPainting = false;
      lastCell = null;

      if (strokeBefore && strokeAfter) pushHistory(strokeBefore, strokeAfter);
      strokeBefore = null;
      strokeAfter = null;
    };

    gridEl.addEventListener('touchend', endTouchStroke, { passive: true });
    gridEl.addEventListener('touchcancel', endTouchStroke, { passive: true });
  }
  
  document.addEventListener('keydown', (e) => {
    const isMac = navigator.platform.toUpperCase().includes('MAC');
    const ctrl = isMac ? e.metaKey : e.ctrlKey;

    if (!ctrl) return;

    if (e.key.toLowerCase() === 'z' && !e.shiftKey) {
      e.preventDefault();
      undo();
    } else if (e.key.toLowerCase() === 'y' || (e.key.toLowerCase() === 'z' && e.shiftKey)) {
      e.preventDefault();
      redo();
    }
  });

  
  if (undoBtn) undoBtn.addEventListener('click', undo);
  if (redoBtn) redoBtn.addEventListener('click', redo);

  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      for (const k of Object.keys(gridColors)) delete gridColors[k];
      localStorage.removeItem('hexMap');
      localStorage.removeItem('selectedTile');
      localStorage.removeItem('fillColor');

      undoStack.length = 0;
      redoStack.length = 0;
      updateUndoRedoUI();

      rebuildGridDOM();
    });
  }

  if (exportJsonBtn) exportJsonBtn.addEventListener('click', () => openModal('export-json'));
  if (exportCodeBtn) exportCodeBtn.addEventListener('click', () => openModal('export-code'));
  if (importBtn) importBtn.addEventListener('click', () => openModal('import'));

  if (exportPngBtn) exportPngBtn.addEventListener('click', exportPNG);

  if (paletteThemeBtn && paletteThemeMenu) {
    paletteThemeBtn.addEventListener('click', () => togglePaletteThemeMenu());

    paletteThemeMenu.addEventListener('click', (e) => {
      const btn = e.target.closest?.('.dropdown-item');
      if (!btn) return;
      const value = btn.dataset.value;
      if (!value) return;
      togglePaletteThemeMenu(false);
      setPaletteTheme(value);
    });

    document.addEventListener('click', (e) => {
      const wrap = document.getElementById('palette-theme-dropdown');
      if (!wrap) return;
      if (!wrap.contains(e.target)) togglePaletteThemeMenu(false);
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') togglePaletteThemeMenu(false);
    });
  }

  const closeTargets = [modalClose, modalSecondary, modal?.querySelector?.('.modal-backdrop')].filter(Boolean);
  closeTargets.forEach((el) => el.addEventListener('click', closeModal));

  if (modalPrimary) {
    modalPrimary.addEventListener('click', async () => {
      if (!modalText) return;

      if (modalMode === 'import') {
        let obj = null;
        try {
          obj = parseImportText(modalText.value);
        } catch {
          if (modalHint) modalHint.textContent = 'Invalid import format.';
          return;
        }

        const ok = applyImportPayload(obj);
        if (!ok) {
          if (modalHint) modalHint.textContent = 'Invalid import data.';
          return;
        }

        
        updatePaletteThemeUI();
        buildPalette();

        undoStack.length = 0;
        redoStack.length = 0;
        updateUndoRedoUI();

        rebuildGridDOM();

        localStorage.setItem('hexMap', JSON.stringify(gridColors));
        closeModal();
        return;
      }

      
      try {
        await navigator.clipboard.writeText(modalText.value);
        if (modalHint) modalHint.textContent = 'Copied.';
        setTimeout(() => closeModal(), 350);
      } catch {
        modalText.focus();
        modalText.select();
        if (modalHint) modalHint.textContent = 'Copy failed. Copy manually.';
      }
    });
  }

};
