const { MongoClient } = require("mongodb");

const url = process.env.MONGO_URL || "mongodb://mongo:27017/playnow";
let client;

async function connecter() {
  client = new MongoClient(url);
  await client.connect();
  console.log("MongoDB connecté !");
  return client;
}

function db() {
  if (!client) throw new Error("MongoDB non connecté !");
  return client.db(); // récupère la DB définie dans l'URL
}

function isConnected() {
  if (!client) return false;
  return client.topology?.isConnected() || false;
}

module.exports = { connecter, db, isConnected };
