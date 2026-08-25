(() => {
  "use strict";

  const SITE_CONFIG = deepClone(window.DODREI_CONFIG || window.P5LAB_CONFIG || {});
  const SCHEMA = window.DODREI_CONFIG_SCHEMA || { groups: [], fields: {}, collections: {}, aliases: {} };
  let working = deepClone(SITE_CONFIG);
  let sourceLabel = "CURRENT SITE";
  let lastReport = null;

  const $ = (sel) => document.querySelector(sel);
  const editor = $("#editor");
  const sourceEl = $("#source-label");
  const changedEl = $("#changed-count");
  const reportEl = $("#import-report");
  const pasteEl = $("#paste-input");
  const fileEl = $("#file-input");
  const localKey = () => (SITE_CONFIG.control && SITE_CONFIG.control.localDraftKey) || "dodrei-control-draft";

  function deepClone(v) {
    return typeof structuredClone === "function" ? structuredClone(v) : JSON.parse(JSON.stringify(v));
  }

  function isObject(v) {
    return v !== null && typeof v === "object" && !Array.isArray(v);
  }

  function deepEqual(a, b) {
    return JSON.stringify(a) === JSON.stringify(b);
  }

  function humanize(key) {
    return String(key)
      .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
      .replace(/[_-]+/g, " ")
      .toUpperCase();
  }

  function getPath(obj, path) {
    if (!path) return obj;
    return path.split(".").reduce((acc, key) => (acc == null ? undefined : acc[key]), obj);
  }

  function setPath(obj, path, value) {
    const parts = path.split(".");
    let cur = obj;
    parts.slice(0, -1).forEach((key) => {
      if (!isObject(cur[key])) cur[key] = {};
      cur = cur[key];
    });
    cur[parts[parts.length - 1]] = value;
  }

  function deletePath(obj, path) {
    const parts = path.split(".");
    const key = parts.pop();
    const parent = parts.length ? getPath(obj, parts.join(".")) : obj;
    if (parent && Object.prototype.hasOwnProperty.call(parent, key)) delete parent[key];
  }

  function schemaFor(path, value) {
    const explicit = SCHEMA.fields && SCHEMA.fields[path];
    if (explicit) return explicit;
    if (typeof value === "boolean") return { type: "boolean" };
    if (typeof value === "number") return { type: Number.isInteger(value) ? "integer" : "number" };
    return { type: "string" };
  }

  function collectionFor(path) {
    return SCHEMA.collections && SCHEMA.collections[path];
  }

  function validateScalar(path, value, currentValue) {
    const meta = schemaFor(path, currentValue);
    if (meta.readOnly) {
      if (deepEqual(value, currentValue)) return { ok: true, value: currentValue };
      return { ok: false, reason: "read-only structural value" };
    }

    if (meta.type === "boolean") {
      if (typeof value !== "boolean") return { ok: false, reason: "expected boolean" };
      return { ok: true, value };
    }

    if (meta.type === "integer" || meta.type === "number") {
      if (typeof value !== "number" || !Number.isFinite(value)) return { ok: false, reason: "expected number" };
      if (meta.type === "integer" && !Number.isInteger(value)) return { ok: false, reason: "expected integer" };
      if (Number.isFinite(meta.min) && value < meta.min) return { ok: false, reason: `below minimum ${meta.min}` };
      if (Number.isFinite(meta.max) && value > meta.max) return { ok: false, reason: `above maximum ${meta.max}` };
      return { ok: true, value };
    }

    if (meta.type === "select") {
      if (!meta.options || !meta.options.includes(value)) return { ok: false, reason: `unsupported option ${String(value)}` };
      return { ok: true, value };
    }

    if (typeof value !== "string") return { ok: false, reason: "expected string" };
    return { ok: true, value };
  }

  function applyAliases(imported) {
    const out = deepClone(imported);
    Object.entries(SCHEMA.aliases || {}).forEach(([oldPath, newPath]) => {
      const oldValue = getPath(out, oldPath);
      if (oldValue === undefined || getPath(out, newPath) !== undefined) return;
      setPath(out, newPath, oldValue);
      deletePath(out, oldPath);
    });
    return out;
  }

  function makeStats() {
    return { compatible: 0, missing: 0, obsolete: 0, invalid: 0, added: 0, details: [] };
  }

  function note(stats, kind, path, message) {
    stats[kind] = (stats[kind] || 0) + 1;
    stats.details.push({ kind, path, message });
  }

  function mergeCollection(current, imported, path, def, stats) {
    if (!Array.isArray(imported)) {
      note(stats, "invalid", path, "expected array");
      return deepClone(current);
    }

    if (def.kind === "primitive-list" || def.kind === "json") {
      if (Number.isInteger(def.expectedLength) && imported.length !== def.expectedLength) {
        note(stats, "invalid", path, `expected ${def.expectedLength} items`);
        return deepClone(current);
      }
      if (def.itemType) {
        const bad = imported.find((x) => typeof x !== def.itemType);
        if (bad !== undefined) {
          note(stats, "invalid", path, `expected ${def.itemType} items`);
          return deepClone(current);
        }
      }
      note(stats, "compatible", path, "collection replaced");
      return deepClone(imported);
    }

    if (def.kind !== "id-list") {
      note(stats, "compatible", path, "collection replaced");
      return deepClone(imported);
    }

    const idKey = def.idKey || "id";
    const currentMap = new Map((current || []).filter(isObject).map((item) => [item[idKey], item]));
    const consumed = new Set();
    const result = [];

    for (const item of imported) {
      if (!isObject(item) || !item[idKey]) {
        note(stats, "invalid", path, `collection item missing ${idKey}`);
        continue;
      }
      const id = item[idKey];
      if (currentMap.has(id)) {
        consumed.add(id);
        result.push(mergeCompatible(currentMap.get(id), item, `${path}.${id}`, stats, Boolean(def.allowUnknownItemProperties)));
      } else if (def.allowUnknownItems) {
        result.push(deepClone(item));
        note(stats, "added", `${path}.${id}`, "new collection item accepted");
      } else {
        note(stats, "obsolete", `${path}.${id}`, "item not supported by current schema/runtime");
      }
    }

    for (const currentItem of current || []) {
      const id = currentItem && currentItem[idKey];
      if (id && !consumed.has(id)) {
        result.push(deepClone(currentItem));
        note(stats, "missing", `${path}.${id}`, "not present in imported config; current value kept");
      }
    }
    return result;
  }

  function mergeCompatible(current, imported, path, stats, allowUnknownObjectKeys = false) {
    const collection = collectionFor(path);
    if (collection) return mergeCollection(current, imported, path, collection, stats);

    if (Array.isArray(current)) {
      if (!Array.isArray(imported)) {
        note(stats, "invalid", path, "expected array");
        return deepClone(current);
      }
      note(stats, "compatible", path, "array replaced");
      return deepClone(imported);
    }

    if (isObject(current)) {
      if (!isObject(imported)) {
        note(stats, "invalid", path || "(root)", "expected object");
        return deepClone(current);
      }

      const out = {};
      for (const key of Object.keys(current)) {
        const childPath = path ? `${path}.${key}` : key;
        if (Object.prototype.hasOwnProperty.call(imported, key)) {
          out[key] = mergeCompatible(current[key], imported[key], childPath, stats, allowUnknownObjectKeys);
        } else {
          out[key] = deepClone(current[key]);
          note(stats, "missing", childPath, "not present in imported config; current value kept");
        }
      }

      for (const key of Object.keys(imported)) {
        if (Object.prototype.hasOwnProperty.call(current, key)) continue;
        const childPath = path ? `${path}.${key}` : key;
        if (allowUnknownObjectKeys) {
          out[key] = deepClone(imported[key]);
          note(stats, "added", childPath, "new item property accepted");
        } else {
          note(stats, "obsolete", childPath, "not present in current config");
        }
      }
      return out;
    }

    const checked = validateScalar(path, imported, current);
    if (!checked.ok) {
      note(stats, "invalid", path, checked.reason);
      return deepClone(current);
    }
    note(stats, "compatible", path, "value accepted");
    return checked.value;
  }

  function parseImportedText(text) {
    const raw = String(text || "").trim();
    if (!raw) throw new Error("No config text found.");
    if (!window.JSON5) throw new Error("JSON5 parser did not load.");

    if (raw[0] === "{" || raw[0] === "[") return window.JSON5.parse(raw);

    const marker = raw.search(/(?:window\.)?(?:DODREI_CONFIG|P5LAB_CONFIG)\s*=/);
    if (marker < 0) throw new Error("Expected JSON/JSON5 or a DODREI_CONFIG assignment.");

    const braceStart = raw.indexOf("{", marker);
    if (braceStart < 0) throw new Error("Config object opening brace not found.");
    const literal = extractBalancedObject(raw, braceStart);
    return window.JSON5.parse(literal);
  }

  function extractBalancedObject(text, start) {
    let depth = 0;
    let quote = null;
    let escaped = false;
    let lineComment = false;
    let blockComment = false;

    for (let i = start; i < text.length; i++) {
      const ch = text[i];
      const next = text[i + 1];

      if (lineComment) {
        if (ch === "\n") lineComment = false;
        continue;
      }
      if (blockComment) {
        if (ch === "*" && next === "/") { blockComment = false; i++; }
        continue;
      }
      if (quote) {
        if (escaped) { escaped = false; continue; }
        if (ch === "\\") { escaped = true; continue; }
        if (ch === quote) quote = null;
        continue;
      }

      if (ch === "/" && next === "/") { lineComment = true; i++; continue; }
      if (ch === "/" && next === "*") { blockComment = true; i++; continue; }
      if (ch === '"' || ch === "'" || ch === "`") { quote = ch; continue; }
      if (ch === "{") depth++;
      if (ch === "}") {
        depth--;
        if (depth === 0) return text.slice(start, i + 1);
      }
    }
    throw new Error("Config object closing brace not found.");
  }

  function importConfigObject(imported, label) {
    const normalized = applyAliases(imported);
    const stats = makeStats();

    if (normalized.meta && normalized.meta.project && normalized.meta.project !== SITE_CONFIG.meta.project) {
      note(stats, "invalid", "meta.project", `project ${normalized.meta.project} does not match ${SITE_CONFIG.meta.project}`);
    }
    if (normalized.meta && normalized.meta.schemaVersion !== undefined &&
        normalized.meta.schemaVersion !== SITE_CONFIG.meta.schemaVersion) {
      stats.details.push({
        kind: "warning",
        path: "meta.schemaVersion",
        message: `schema ${normalized.meta.schemaVersion} imported into schema ${SITE_CONFIG.meta.schemaVersion}; compatible fields were merged`
      });
    }

    working = mergeCompatible(SITE_CONFIG, normalized, "", stats);
    sourceLabel = label;
    lastReport = stats;
    autoSaveDraft();
    render();
  }

  function render() {
    sourceEl.textContent = sourceLabel;
    const changed = countDifferences(SITE_CONFIG, working);
    changedEl.textContent = `${changed} MODIFIED`;
    editor.innerHTML = "";

    const declared = SCHEMA.groups && SCHEMA.groups.length ? SCHEMA.groups : [];
    const declaredIds = new Set(declared.map((g) => g.id));
    const extras = Object.keys(working)
      .filter((id) => !declaredIds.has(id))
      .map((id) => ({ id, label: humanize(id), description: "No schema metadata yet; controls are inferred." }));
    const groups = declared.length ? [...declared, ...extras] : extras;

    groups.forEach((group) => {
      if (!Object.prototype.hasOwnProperty.call(working, group.id)) return;
      editor.appendChild(renderGroup(group));
    });

    renderReport();
  }

  function renderGroup(group) {
    const section = document.createElement("section");
    section.className = "config-section";
    const head = document.createElement("header");
    head.className = "section-head";
    head.innerHTML = `<div><h2>${escapeHtml(group.label || humanize(group.id))}</h2><p>${escapeHtml(group.description || "")}</p></div>`;
    const reset = button("RESET SECTION", () => {
      working[group.id] = deepClone(SITE_CONFIG[group.id]);
      sourceLabel = `${sourceLabel.split(" / EDITED")[0]} / EDITED`;
      lastReport = null;
      autoSaveDraft();
      render();
    });
    reset.className = "small-button";
    head.appendChild(reset);
    section.appendChild(head);

    const body = document.createElement("div");
    body.className = "section-body";
    renderObject(body, working[group.id], group.id);
    section.appendChild(body);
    return section;
  }

  function renderObject(parent, obj, path) {
    Object.keys(obj).forEach((key) => {
      const value = obj[key];
      const childPath = `${path}.${key}`;
      const collection = collectionFor(childPath);
      if (collection) {
        parent.appendChild(renderCollection(childPath, value, collection));
      } else if (isObject(value)) {
        const sub = document.createElement("div");
        sub.className = "subsection";
        const title = document.createElement("h3");
        title.textContent = humanize(key);
        sub.appendChild(title);
        renderObject(sub, value, childPath);
        parent.appendChild(sub);
      } else if (Array.isArray(value)) {
        parent.appendChild(renderCollection(childPath, value, { kind: "json", label: humanize(key) }));
      } else {
        parent.appendChild(renderField(childPath, value));
      }
    });
  }

  function renderField(path, value) {
    const meta = schemaFor(path, value);
    const row = document.createElement("div");
    row.className = "field-row";
    if (!deepEqual(getPath(SITE_CONFIG, path), value)) row.classList.add("is-modified");

    const info = document.createElement("div");
    info.className = "field-info";
    const key = path.split(".").pop();
    info.innerHTML = `<strong>${escapeHtml(humanize(key))}</strong><code>${escapeHtml(path)}</code>${meta.description ? `<p>${escapeHtml(meta.description)}</p>` : ""}`;

    const controls = document.createElement("div");
    controls.className = "field-controls";
    const control = makeScalarControl(path, value, meta);
    controls.appendChild(control);

    if (!meta.readOnly) {
      const reset = button("↺", () => {
        setPath(working, path, deepClone(getPath(SITE_CONFIG, path)));
        sourceLabel = `${sourceLabel.split(" / EDITED")[0]} / EDITED`;
        lastReport = null;
        autoSaveDraft();
        render();
      });
      reset.className = "icon-button";
      reset.title = "Reset to current-site value";
      controls.appendChild(reset);
    }

    row.append(info, controls);
    return row;
  }

  function makeScalarControl(path, value, meta) {
    if (meta.type === "boolean") {
      const label = document.createElement("label");
      label.className = "switch";
      const input = document.createElement("input");
      input.type = "checkbox";
      input.checked = Boolean(value);
      input.disabled = Boolean(meta.readOnly);
      const span = document.createElement("span");
      span.textContent = input.checked ? "ON" : "OFF";
      input.addEventListener("change", () => {
        span.textContent = input.checked ? "ON" : "OFF";
        commitField(path, input.checked, meta);
      });
      label.append(input, span);
      return label;
    }

    if (meta.type === "select") {
      const select = document.createElement("select");
      (meta.options || []).forEach((opt) => {
        const o = document.createElement("option");
        o.value = opt;
        o.textContent = opt;
        o.selected = opt === value;
        select.appendChild(o);
      });
      select.disabled = Boolean(meta.readOnly);
      select.addEventListener("change", () => commitField(path, select.value, meta));
      return select;
    }

    if (meta.type === "number" || meta.type === "integer") {
      const wrap = document.createElement("div");
      wrap.className = "number-wrap";
      if (Number.isFinite(meta.min) && Number.isFinite(meta.max)) {
        const range = document.createElement("input");
        range.type = "range";
        range.min = meta.min;
        range.max = meta.max;
        range.step = meta.step || (meta.type === "integer" ? 1 : 0.01);
        range.value = value;
        range.disabled = Boolean(meta.readOnly);
        wrap.appendChild(range);

        const number = document.createElement("input");
        number.type = "number";
        number.min = meta.min;
        number.max = meta.max;
        number.step = range.step;
        number.value = value;
        number.disabled = Boolean(meta.readOnly);
        range.addEventListener("input", () => { number.value = range.value; });
        range.addEventListener("change", () => commitNumber(path, range.value, meta));
        number.addEventListener("change", () => {
          const ok = commitNumber(path, number.value, meta);
          if (ok) range.value = number.value;
          else number.value = getPath(working, path);
        });
        wrap.appendChild(number);
      } else {
        const number = document.createElement("input");
        number.type = "number";
        number.step = meta.step || (meta.type === "integer" ? 1 : "any");
        number.value = value;
        number.disabled = Boolean(meta.readOnly);
        number.addEventListener("change", () => {
          if (!commitNumber(path, number.value, meta)) number.value = getPath(working, path);
        });
        wrap.appendChild(number);
      }
      if (meta.unit) {
        const unit = document.createElement("span");
        unit.className = "unit";
        unit.textContent = meta.unit;
        wrap.appendChild(unit);
      }
      return wrap;
    }

    const input = document.createElement("input");
    input.type = "text";
    input.value = value == null ? "" : String(value);
    input.disabled = Boolean(meta.readOnly);
    input.addEventListener("change", () => commitField(path, input.value, meta));
    return input;
  }

  function commitNumber(path, raw, meta) {
    const value = Number(raw);
    const checked = validateScalar(path, value, getPath(SITE_CONFIG, path));
    if (!checked.ok) {
      showTransient(`INVALID ${path}: ${checked.reason}`);
      return false;
    }
    commitField(path, meta.type === "integer" ? Math.trunc(value) : value, meta);
    return true;
  }

  function commitField(path, value) {
    setPath(working, path, value);
    sourceLabel = `${sourceLabel.split(" / EDITED")[0]} / EDITED`;
    lastReport = null;
    autoSaveDraft();
    render();
  }

  function renderCollection(path, value, def) {
    const box = document.createElement("div");
    box.className = "collection";
    if (!deepEqual(getPath(SITE_CONFIG, path), value)) box.classList.add("is-modified");

    const head = document.createElement("div");
    head.className = "collection-head";
    head.innerHTML = `<div><h3>${escapeHtml(def.label || humanize(path.split(".").pop()))}</h3><code>${escapeHtml(path)}</code></div>`;
    const reset = button("RESET", () => {
      setPath(working, path, deepClone(getPath(SITE_CONFIG, path)));
      sourceLabel = `${sourceLabel.split(" / EDITED")[0]} / EDITED`;
      lastReport = null;
      autoSaveDraft();
      render();
    });
    reset.className = "small-button";
    head.appendChild(reset);
    box.appendChild(head);

    if (def.kind === "id-list") renderIdList(box, path, value, def);
    else renderJsonCollection(box, path, value, def);
    return box;
  }

  function renderJsonCollection(box, path, value) {
    const textarea = document.createElement("textarea");
    textarea.className = "json-editor";
    textarea.value = JSON.stringify(value, null, 2);
    const actions = document.createElement("div");
    actions.className = "inline-actions";
    actions.appendChild(button("APPLY JSON", () => {
      try {
        const parsed = JSON.parse(textarea.value);
        if (!Array.isArray(parsed)) throw new Error("Expected an array.");
        const def = collectionFor(path) || {};
        if (Number.isInteger(def.expectedLength) && parsed.length !== def.expectedLength) {
          throw new Error(`Expected ${def.expectedLength} items.`);
        }
        setPath(working, path, parsed);
        sourceLabel = `${sourceLabel.split(" / EDITED")[0]} / EDITED`;
        lastReport = null;
        autoSaveDraft();
        render();
      } catch (e) {
        showTransient(`INVALID ${path}: ${e.message}`);
      }
    }));
    box.append(textarea, actions);
  }

  function renderIdList(box, path, list, def) {
    const wrap = document.createElement("div");
    wrap.className = "id-list";

    list.forEach((item, index) => {
      const card = document.createElement("div");
      card.className = "id-card";
      const title = document.createElement("div");
      title.className = "id-card-head";
      const label = item.name || item[def.idKey || "id"] || `ITEM ${index + 1}`;
      title.innerHTML = `<strong>${escapeHtml(String(index + 1).padStart(2, "0"))} / ${escapeHtml(label)}</strong><code>${escapeHtml(item[def.idKey || "id"] || "")}</code>`;

      const actions = document.createElement("div");
      actions.className = "id-actions";
      if (def.toggleKey && Object.prototype.hasOwnProperty.call(item, def.toggleKey)) {
        const toggle = document.createElement("label");
        toggle.className = "mini-switch";
        const cb = document.createElement("input");
        cb.type = "checkbox";
        cb.checked = item[def.toggleKey] !== false;
        cb.addEventListener("change", () => {
          item[def.toggleKey] = cb.checked;
          collectionChanged();
        });
        toggle.append(cb, document.createTextNode("ON"));
        actions.appendChild(toggle);
      }
      if (def.reorderable) {
        actions.appendChild(button("↑", () => moveItem(path, index, -1)));
        actions.appendChild(button("↓", () => moveItem(path, index, 1)));
      }
      if (def.addable) actions.appendChild(button("×", () => removeItem(path, index)));
      title.appendChild(actions);
      card.appendChild(title);

      const grid = document.createElement("div");
      grid.className = "item-grid";
      Object.keys(item).forEach((key) => {
        if (key === def.toggleKey) return;
        const field = document.createElement("label");
        field.className = "item-field";
        field.innerHTML = `<span>${escapeHtml(humanize(key))}</span>`;
        const val = item[key];
        let input;
        if (typeof val === "boolean") {
          input = document.createElement("input");
          input.type = "checkbox";
          input.checked = val;
          input.addEventListener("change", () => { item[key] = input.checked; collectionChanged(); });
        } else if (typeof val === "number") {
          input = document.createElement("input");
          input.type = "number";
          input.step = Number.isInteger(val) ? "1" : "0.01";
          input.value = val;
          input.addEventListener("change", () => {
            const n = Number(input.value);
            if (Number.isFinite(n)) { item[key] = n; collectionChanged(); }
          });
        } else {
          input = document.createElement("input");
          input.type = "text";
          input.value = val == null ? "" : String(val);
          if ((def.idKey || "id") === key && def.allowUnknownItems === false) input.readOnly = true;
          input.addEventListener("change", () => { item[key] = input.value; collectionChanged(); });
        }
        field.appendChild(input);
        grid.appendChild(field);
      });
      card.appendChild(grid);
      wrap.appendChild(card);
    });

    box.appendChild(wrap);
    if (def.addable) {
      const add = button("+ ADD IMAGE SET", () => {
        const arr = getPath(working, path);
        let n = 1;
        const ids = new Set(arr.map((x) => x.id));
        while (ids.has(`set-${n}`)) n++;
        arr.push({ id: `set-${n}`, subdir: "" });
        collectionChanged();
      });
      add.className = "small-button add-button";
      box.appendChild(add);
    }

    function collectionChanged() {
      sourceLabel = `${sourceLabel.split(" / EDITED")[0]} / EDITED`;
      lastReport = null;
      autoSaveDraft();
      render();
    }
  }

  function moveItem(path, index, delta) {
    const arr = getPath(working, path);
    const next = index + delta;
    if (!arr || next < 0 || next >= arr.length) return;
    [arr[index], arr[next]] = [arr[next], arr[index]];
    sourceLabel = `${sourceLabel.split(" / EDITED")[0]} / EDITED`;
    lastReport = null;
    autoSaveDraft();
    render();
  }

  function removeItem(path, index) {
    const arr = getPath(working, path);
    if (!arr || arr.length <= 1) {
      showTransient("At least one item must remain.");
      return;
    }
    arr.splice(index, 1);
    sourceLabel = `${sourceLabel.split(" / EDITED")[0]} / EDITED`;
    lastReport = null;
    autoSaveDraft();
    render();
  }

  function countDifferences(a, b) {
    if (deepEqual(a, b)) return 0;
    if (Array.isArray(a) || Array.isArray(b) || !isObject(a) || !isObject(b)) return 1;
    const keys = new Set([...Object.keys(a || {}), ...Object.keys(b || {})]);
    let count = 0;
    keys.forEach((key) => { count += countDifferences(a && a[key], b && b[key]); });
    return count;
  }

  function autoSaveDraft() {
    try {
      localStorage.setItem(localKey(), JSON.stringify({
        savedAt: new Date().toISOString(),
        source: sourceLabel,
        config: working
      }));
    } catch (_) {}
  }

  function loadLocalDraft() {
    try {
      const raw = localStorage.getItem(localKey());
      if (!raw) return showTransient("NO LOCAL DRAFT");
      const payload = JSON.parse(raw);
      importConfigObject(payload.config || payload, `LOCAL DRAFT ${payload.savedAt ? payload.savedAt.slice(0, 19) : ""}`.trim());
    } catch (e) {
      showTransient(`LOCAL DRAFT ERROR: ${e.message}`);
    }
  }

  function saveLocalDraft() {
    autoSaveDraft();
    showTransient("LOCAL DRAFT SAVED");
  }

  function clearLocalDraft() {
    localStorage.removeItem(localKey());
    showTransient("LOCAL DRAFT CLEARED");
  }

  function renderReport() {
    if (!lastReport) {
      reportEl.hidden = true;
      reportEl.innerHTML = "";
      return;
    }
    reportEl.hidden = false;
    reportEl.innerHTML = "";
    const s = lastReport;
    const summary = document.createElement("div");
    summary.className = "report-summary";
    summary.innerHTML =
      `<strong>IMPORT REPORT</strong>` +
      `<span class="ok">${s.compatible} compatible</span>` +
      `<span class="added">${s.added} added</span>` +
      `<span class="warn">${s.missing} missing</span>` +
      `<span class="bad">${s.obsolete + s.invalid} incompatible</span>`;
    reportEl.appendChild(summary);

    const details = document.createElement("div");
    details.className = "report-details";
    s.details.slice(0, 80).forEach((d) => {
      const line = document.createElement("div");
      line.className = `report-line ${d.kind}`;
      line.innerHTML = `<code>${escapeHtml(d.path || "(root)")}</code><span>${escapeHtml(d.message)}</span>`;
      details.appendChild(line);
    });
    if (s.details.length > 80) {
      const more = document.createElement("div");
      more.className = "report-line warning";
      more.textContent = `+ ${s.details.length - 80} more`;
      details.appendChild(more);
    }
    reportEl.appendChild(details);
  }

  function buildCanonicalConfigJs() {
    const lines = [
      "/**",
      " * DODREI — RUNTIME CONFIGURATION",
      " * Generated by DODREI CONTROL.",
      " * Edit values directly if desired; keep stable key/id names for compatibility.",
      " */",
      "",
      "window.DODREI_CONFIG = {"
    ];

    const groups = SCHEMA.groups || [];
    groups.forEach((group, groupIndex) => {
      if (!Object.prototype.hasOwnProperty.call(working, group.id)) return;
      lines.push(`  // ---------------------------------------------------------------------------`);
      lines.push(`  // ${group.label || humanize(group.id)}${group.description ? ` — ${group.description}` : ""}`);
      lines.push(`  // ---------------------------------------------------------------------------`);
      serializeObjectEntry(lines, group.id, working[group.id], group.id, 1, groupIndex === groups.length - 1);
      lines.push("");
    });

    lines.push("};", "", "// Compatibility bridge for existing engine modules.", "window.P5LAB_CONFIG = window.DODREI_CONFIG;", "");
    return lines.join("\n");
  }

  function serializeObjectEntry(lines, key, value, path, indentLevel, _isLast) {
    const indent = "  ".repeat(indentLevel);
    const meta = SCHEMA.fields && SCHEMA.fields[path];
    if (meta && meta.description) lines.push(`${indent}// ${meta.description}`);

    if (isObject(value)) {
      lines.push(`${indent}${JSON.stringify(key)}: {`);
      const keys = Object.keys(value);
      keys.forEach((childKey) => {
        const childPath = `${path}.${childKey}`;
        serializeObjectEntry(lines, childKey, value[childKey], childPath, indentLevel + 1, false);
      });
      lines.push(`${indent}},`);
      return;
    }

    if (Array.isArray(value)) {
      const collection = collectionFor(path);
      if (collection && collection.label) lines.push(`${indent}// ${collection.label}`);
      const json = JSON.stringify(value, null, 2);
      const shifted = json.split("\n").map((line, i) => i === 0 ? line : indent + line).join("\n");
      lines.push(`${indent}${JSON.stringify(key)}: ${shifted},`);
      return;
    }

    lines.push(`${indent}${JSON.stringify(key)}: ${JSON.stringify(value)},`);
  }

  function downloadText(filename, text, type) {
    const blob = new Blob([text], { type: type || "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
      showTransient("CONFIG COPIED");
    } catch (_) {
      pasteEl.value = text;
      pasteEl.focus();
      pasteEl.select();
      showTransient("CLIPBOARD BLOCKED — TEXT SELECTED BELOW");
    }
  }

  function button(label, handler) {
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = label;
    b.addEventListener("click", handler);
    return b;
  }

  function showTransient(message) {
    const el = $("#toast");
    el.textContent = message;
    el.classList.add("show");
    clearTimeout(showTransient.timer);
    showTransient.timer = setTimeout(() => el.classList.remove("show"), 2200);
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
  }

  $("#load-current").addEventListener("click", () => {
    working = deepClone(SITE_CONFIG);
    sourceLabel = "CURRENT SITE";
    lastReport = null;
    autoSaveDraft();
    render();
  });

  $("#load-local").addEventListener("click", loadLocalDraft);
  $("#save-local").addEventListener("click", saveLocalDraft);
  $("#clear-local").addEventListener("click", clearLocalDraft);

  $("#choose-file").addEventListener("click", () => fileEl.click());
  fileEl.addEventListener("change", async () => {
    const file = fileEl.files && fileEl.files[0];
    if (!file) return;
    try {
      const parsed = parseImportedText(await file.text());
      importConfigObject(parsed, `FILE / ${file.name}`);
    } catch (e) {
      showTransient(`IMPORT ERROR: ${e.message}`);
    } finally {
      fileEl.value = "";
    }
  });

  $("#import-paste").addEventListener("click", () => {
    try {
      importConfigObject(parseImportedText(pasteEl.value), "PASTED CONFIG");
    } catch (e) {
      showTransient(`IMPORT ERROR: ${e.message}`);
    }
  });

  $("#paste-current").addEventListener("click", () => {
    pasteEl.value = buildCanonicalConfigJs();
  });

  $("#download-js").addEventListener("click", () => {
    downloadText("config.js", buildCanonicalConfigJs(), "text/javascript;charset=utf-8");
  });

  $("#download-json").addEventListener("click", () => {
    downloadText("dodrei-config.json", JSON.stringify(working, null, 2) + "\n", "application/json;charset=utf-8");
  });

  $("#copy-js").addEventListener("click", () => copyText(buildCanonicalConfigJs()));

  $("#reset-all").addEventListener("click", () => {
    working = deepClone(SITE_CONFIG);
    sourceLabel = "CURRENT SITE";
    lastReport = null;
    autoSaveDraft();
    render();
  });

  render();
})();
