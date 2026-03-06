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

  const normalizeWidth = (value) => {
    const s = String(value || '').toUpperCase().replace(/[^A-Z]/g, '');
    return s.length ? s : 'C';
  };

  const normalizeHeight = (value) => {
    const n = parseInt(value, 10);
    if (!Number.isFinite(n) || n < 1) return 3;
    return n;
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

  
  const gridEl = document.getElementById('grid');
  const widthEl = document.getElementById('width');
  const heightEl = document.getElementById('height');
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

  const changeThemeEl = document.getElementById('change-theme');

  const themeBtn = document.getElementById('theme-btn');
  const themeMenu = document.getElementById('theme-menu');
  const themeLabel = document.getElementById('theme-label');
  const hiddenThemeInput = document.getElementById('theme');

  const paletteEl = document.getElementById('palette');

  const modal = document.getElementById('modal');
  const modalTitle = document.getElementById('modal-title');
  const modalText = document.getElementById('modal-text');
  const modalHint = document.getElementById('modal-hint');
  const modalClose = document.getElementById('modal-close');
  const modalPrimary = document.getElementById('modal-primary');
  const modalSecondary = document.getElementById('modal-secondary');

  
  let selectedTheme = localStorage.getItem('theme') || 'grass';
  let activeTiles = getActiveTiles(selectedTheme);
  if (!activeTiles.length) {
    selectedTheme = 'grass';
    localStorage.setItem('theme', selectedTheme);
    activeTiles = getActiveTiles(selectedTheme);
  }

  const gridColors = JSON.parse(localStorage.getItem('hexMap')) || {};

  const localWidth = normalizeWidth(localStorage.getItem('width') || (widthEl ? widthEl.value : 'AO') || 'AO');
  const localHeight = normalizeHeight(localStorage.getItem('height') || (heightEl ? heightEl.value : 42) || 42);

  let endWidth = fromAlpha(localWidth);
  let endHeight = parseInt(localHeight, 10);

  let selectedIndex = clampIndex(localStorage.getItem('selectedTile'), activeTiles.length);

  const legacyFill = localStorage.getItem('fillColor');
  if (legacyFill !== null && legacyFill !== undefined) {
    selectedIndex = clampIndex(legacyFill, activeTiles.length);
    localStorage.setItem('selectedTile', String(selectedIndex));
    localStorage.removeItem('fillColor');
  }

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

      const idx = clampIndex(gridColors[cell], activeTiles.length);
      gridColors[cell] = idx;

      const t = activeTiles[idx];
      if (!t) continue;

      counters.buildable += t.buildable ? 1 : 0;
      counters.points += Number(t.points) || 0;
    }

    updateStatsUI();
  };

  const setThemeUI = (themeValue) => {
    if (hiddenThemeInput) hiddenThemeInput.value = themeValue;

    const labelMap = { grass: 'Grass', sand: 'Sand', halloween: 'Halloween', easter: 'Easter', winter: 'Winter' };
    if (themeLabel) themeLabel.textContent = labelMap[themeValue] || themeValue;

    if (themeMenu) {
      for (const btn of themeMenu.querySelectorAll('.dropdown-item')) {
        btn.classList.toggle('active', btn.dataset.value === themeValue);
      }
    }
  };

  const toggleThemeMenu = (forceOpen = null) => {
    if (!themeBtn || !themeMenu) return;
    const isOpen = themeBtn.getAttribute('aria-expanded') === 'true';
    const next = forceOpen === null ? !isOpen : !!forceOpen;
    themeBtn.setAttribute('aria-expanded', next ? 'true' : 'false');
    themeMenu.classList.toggle('open', next);
  };

  const shouldSkipFromPalette = (tileObj) => {
    if (!tileObj) return true;

    if (selectedTheme === 'easter') {
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

    let idx = gridColors[text];
    if (idx === undefined || idx === null) {
      idx = selectedIndex;
      gridColors[text] = idx;
    }

    idx = clampIndex(idx, activeTiles.length);
    gridColors[text] = idx;

    const currentTile = activeTiles[idx] || activeTiles[0];
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

  const repaintEntireGrid = () => {
    const hexes = document.querySelectorAll('#grid .hexagon');
    for (const hex of hexes) {
      const cell = hex.dataset.cell;
      if (!cell) continue;
      const idx = clampIndex(gridColors[cell], activeTiles.length);
      gridColors[cell] = idx;
      const nextTile = activeTiles[idx];
      if (!nextTile) continue;
      updateTile(nextTile, cell);
    }
    localStorage.setItem('hexMap', JSON.stringify(gridColors));
    recalcCountersFromDOM();
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

      const beforeIdx = clampIndex(gridColors[cell], activeTiles.length);
      const oldTile = activeTiles[beforeIdx];

      if (oldTile) {
        counters.buildable -= oldTile.buildable ? 1 : 0;
        counters.points -= Number(oldTile.points) || 0;
      }

      gridColors[cell] = selectedIndex;

      const afterIdx = clampIndex(gridColors[cell], activeTiles.length);
      gridColors[cell] = afterIdx;

      const nextTile = activeTiles[afterIdx];
      if (!nextTile) return;

      updateTile(nextTile, cell);

      counters.buildable += nextTile.buildable ? 1 : 0;
      counters.points += Number(nextTile.points) || 0;

      recordStrokeChange(cell, beforeIdx, afterIdx);
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

      const idx = clampIndex(stateObj[cell], activeTiles.length);
      gridColors[cell] = idx;

      const tile = activeTiles[idx];
      if (tile) updateTile(tile, cell);
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

  
  const buildExportPayload = () => {
    const applyThemeToMap = changeThemeEl ? !!changeThemeEl.checked : true;
    const wLive = normalizeWidth(widthEl?.value || localStorage.getItem('width') || 'AO');
    const hLive = normalizeHeight(heightEl?.value || localStorage.getItem('height') || 42);

    return {
      v: 1,
      width: wLive,
      height: hLive,
      theme: selectedTheme,
      selectedTile: selectedIndex,
      applyThemeToMap,
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
      s: payload.selectedTile,
      a: payload.applyThemeToMap ? 1 : 0,
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
        width: compact.w,
        height: compact.h,
        theme: compact.t,
        selectedTile: compact.s,
        applyThemeToMap: !!compact.a,
        gridColors: compact.g
      };
    }

    
    return JSON.parse(trimmed);
  };

  const applyImportPayload = (obj) => {
    if (!obj || typeof obj !== 'object') return false;
    if (!obj.gridColors || typeof obj.gridColors !== 'object') return false;

    const w = normalizeWidth(obj.width);
    const h = normalizeHeight(obj.height);
    const t = String(obj.theme || '').trim() || 'grass';

    localStorage.setItem('width', w);
    localStorage.setItem('height', String(h));
    localStorage.setItem('theme', t);

    if (obj.selectedTile !== undefined) localStorage.setItem('selectedTile', String(obj.selectedTile));
    if (obj.applyThemeToMap !== undefined) localStorage.setItem('change-theme', String(!!obj.applyThemeToMap));

    
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
        img.crossOrigin = 'anonymous';
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

      
      const idx = clampIndex(gridColors[cell], activeTiles.length);
      const tile = activeTiles[idx];
      drawHexFallback(x, y, w, h, tile?.color || '#444');
    }

    const filename = `hex_map_${normalizeWidth(widthEl?.value || 'C')}_${normalizeHeight(heightEl?.value || 3)}.png`;

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

  
  const changeTheme = (nextTheme) => {
    selectedTheme = nextTheme;
    localStorage.setItem('theme', selectedTheme);

    activeTiles = getActiveTiles(selectedTheme);
    if (!activeTiles.length) {
      selectedTheme = 'grass';
      localStorage.setItem('theme', selectedTheme);
      activeTiles = getActiveTiles(selectedTheme);
    }

    selectedIndex = clampIndex(selectedIndex, activeTiles.length);
    localStorage.setItem('selectedTile', String(selectedIndex));

    setThemeUI(selectedTheme);
    buildPalette();

    const applyThemeToMap = changeThemeEl ? !!changeThemeEl.checked : true;
    if (applyThemeToMap) repaintEntireGrid();
    else recalcCountersFromDOM();
  };

  const applyNewSize = () => {
    const w = normalizeWidth(widthEl?.value || 'C');
    const h = normalizeHeight(heightEl?.value || 3);

    localStorage.setItem('width', w);
    localStorage.setItem('height', String(h));

    endWidth = fromAlpha(w);
    endHeight = parseInt(h, 10);

    if (centerEl) centerEl.textContent = findCenter(endWidth, endHeight);

    
    undoStack.length = 0;
    redoStack.length = 0;
    updateUndoRedoUI();

    rebuildGridDOM();
  };

  
  if (widthEl) widthEl.value = localWidth;
  if (heightEl) heightEl.value = String(localHeight);

  if (changeThemeEl) {
    const savedCT = localStorage.getItem('change-theme');
    if (savedCT !== null) changeThemeEl.checked = (savedCT === 'true');
  }

  setThemeUI(selectedTheme);
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

  if (widthEl) {
    widthEl.addEventListener('input', () => {
      widthEl.value = normalizeWidth(widthEl.value);
    });
    widthEl.addEventListener('change', applyNewSize);
    widthEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') applyNewSize();
    });
    widthEl.addEventListener('blur', applyNewSize);
  }

  if (heightEl) {
    heightEl.addEventListener('change', applyNewSize);
    heightEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') applyNewSize();
    });
    heightEl.addEventListener('blur', applyNewSize);
  }

  if (changeThemeEl) {
    changeThemeEl.addEventListener('change', () => {
      localStorage.setItem('change-theme', String(!!changeThemeEl.checked));
    });
  }

  if (themeBtn && themeMenu) {
    themeBtn.addEventListener('click', () => toggleThemeMenu());

    themeMenu.addEventListener('click', (e) => {
      const btn = e.target.closest?.('.dropdown-item');
      if (!btn) return;
      const value = btn.dataset.value;
      if (!value) return;
      toggleThemeMenu(false);
      changeTheme(value);
    });

    document.addEventListener('click', (e) => {
      const wrap = document.getElementById('theme-dropdown');
      if (!wrap) return;
      if (!wrap.contains(e.target)) toggleThemeMenu(false);
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') toggleThemeMenu(false);
    });
  }

  if (exportJsonBtn) exportJsonBtn.addEventListener('click', () => openModal('export-json'));
  if (exportCodeBtn) exportCodeBtn.addEventListener('click', () => openModal('export-code'));
  if (importBtn) importBtn.addEventListener('click', () => openModal('import'));

  if (exportPngBtn) exportPngBtn.addEventListener('click', exportPNG);

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

        
        const w = normalizeWidth(localStorage.getItem('width') || 'C');
        const h = normalizeHeight(localStorage.getItem('height') || 3);

        if (widthEl) widthEl.value = w;
        if (heightEl) heightEl.value = String(h);

        selectedTheme = localStorage.getItem('theme') || 'grass';
        activeTiles = getActiveTiles(selectedTheme);
        if (!activeTiles.length) activeTiles = getActiveTiles('grass');

        selectedIndex = clampIndex(localStorage.getItem('selectedTile'), activeTiles.length);

        endWidth = fromAlpha(w);
        endHeight = parseInt(h, 10);

        setThemeUI(selectedTheme);
        buildPalette();

        if (centerEl) centerEl.textContent = findCenter(endWidth, endHeight);

        undoStack.length = 0;
        redoStack.length = 0;
        updateUndoRedoUI();

        rebuildGridDOM();

        const applyThemeToMap = changeThemeEl ? !!changeThemeEl.checked : true;
        if (applyThemeToMap) repaintEntireGrid();
        else recalcCountersFromDOM();

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
