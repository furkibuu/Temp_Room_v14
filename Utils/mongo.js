const mongoose = require("mongoose");
let isConnected = false;

const KVSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true }, // key
    value: { type: mongoose.Schema.Types.Mixed, default: null },
  },
  { versionKey: false, timestamps: true }
);

const KV = mongoose.models.DevCodeKV || mongoose.model("DevCodeKV", KVSchema);

async function connectMongo() {
  const uri = process.env.MONGO_URI;
  if (!uri) throw new Error("MONGO_URI .env içinde yok!");

  if (isConnected && mongoose.connection.readyState === 1) return;

  await mongoose.connect(uri, {

  });

  isConnected = true;
  console.log("✅ MongoDB bağlandı!");
}

module.exports = async function createMongoDB() {
  await connectMongo();

  const db = {
    provider: "mongo-kv",

    async get(key) {
      const doc = await KV.findById(String(key)).lean();
      return doc ? doc.value : undefined;
    },

    async has(key) {
      const exists = await KV.exists({ _id: String(key) });
      return !!exists;
    },

    async set(key, value) {
      await KV.updateOne(
        { _id: String(key) },
        { $set: { value } },
        { upsert: true }
      );
      return value;
    },

    async delete(key) {
      const res = await KV.deleteOne({ _id: String(key) });
      return res.deletedCount > 0;
    },

    async push(key, value) {
      const cur = await this.get(key);
      const next = Array.isArray(cur) ? cur : [];
      next.push(value);
      await this.set(key, next);
      return next;
    },

    async pull(key, predicateOrValue) {
      const cur = await this.get(key);
      if (!Array.isArray(cur)) return [];

      const next =
        typeof predicateOrValue === "function"
          ? cur.filter((x) => !predicateOrValue(x))
          : cur.filter((x) => x !== predicateOrValue);

      await this.set(key, next);
      return next;
    },

    async add(key, amount = 1) {
      const cur = Number((await this.get(key)) ?? 0);
      const next = cur + Number(amount);
      await this.set(key, next);
      return next;
    },

    async sub(key, amount = 1) {
      return this.add(key, -Number(amount));
    },

    async disconnect() {
      if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
        isConnected = false;
      }
    },
  };

  return db;
};