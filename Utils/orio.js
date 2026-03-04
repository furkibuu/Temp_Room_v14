const fs = require("fs");
const path = require("path");



function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });
}

function safeReadJson(filePath) {
  try {
    if (!fs.existsSync(filePath)) return {};
    const raw = fs.readFileSync(filePath, "utf8");
    if (!raw.trim()) return {};
    return JSON.parse(raw);
  } catch (e) {
    return {};
  }
}

function safeWriteJson(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
}

function getByPath(obj, key) {
  if (!key) return obj;
  const parts = String(key).split(".");
  let cur = obj;
  for (const p of parts) {
    if (cur == null || typeof cur !== "object" || !(p in cur)) return undefined;
    cur = cur[p];
  }
  return cur;
}

function setByPath(obj, key, value) {
  const parts = String(key).split(".");
  let cur = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const p = parts[i];
    if (!cur[p] || typeof cur[p] !== "object") cur[p] = {};
    cur = cur[p];
  }
  cur[parts[parts.length - 1]] = value;
  return obj;
}

function deleteByPath(obj, key) {
  const parts = String(key).split(".");
  let cur = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const p = parts[i];
    if (!cur || typeof cur !== "object" || !(p in cur)) return false;
    cur = cur[p];
  }
  const last = parts[parts.length - 1];
  if (cur && typeof cur === "object" && last in cur) {
    delete cur[last];
    return true;
  }
  return false;
}

module.exports = function createOrioDB(options = {}) {
  const fileName = options.fileName || "orio.json";
  const baseDir = options.baseDir || path.join(process.cwd(), "database");
  ensureDir(baseDir);
  const filePath = path.join(baseDir, fileName);
  let writing = Promise.resolve();

  async function read() {
    return safeReadJson(filePath);
  }

  async function write(data) {
    writing = writing.then(() => safeWriteJson(filePath, data));
    return writing;
  }

  const db = {
    provider: "orio-json",
    filePath,

    async get(key) {
      const data = await read();
      return getByPath(data, key);
    },

    async has(key) {
      const data = await read();
      return typeof getByPath(data, key) !== "undefined";
    },

    async set(key, value) {
      const data = await read();
      setByPath(data, key, value);
      await write(data);
      return value;
    },

    async delete(key) {
      const data = await read();
      const ok = deleteByPath(data, key);
      if (ok) await write(data);
      return ok;
    },

    async push(key, value) {
      const data = await read();
      const arr = getByPath(data, key);
      const next = Array.isArray(arr) ? arr : [];
      next.push(value);
      setByPath(data, key, next);
      await write(data);
      return next;
    },

    async pull(key, predicateOrValue) {
      const data = await read();
      const arr = getByPath(data, key);
      if (!Array.isArray(arr)) return [];

      const next =
        typeof predicateOrValue === "function"
          ? arr.filter((x) => !predicateOrValue(x))
          : arr.filter((x) => x !== predicateOrValue);

      setByPath(data, key, next);
      await write(data);
      return next;
    },

    async add(key, amount = 1) {
      const data = await read();
      const cur = Number(getByPath(data, key) ?? 0);
      const next = cur + Number(amount);
      setByPath(data, key, next);
      await write(data);
      return next;
    },

    async sub(key, amount = 1) {
      return db.add(key, -Number(amount));
    },
  };

  return db;

};
