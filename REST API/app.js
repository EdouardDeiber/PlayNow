const express = require("express");
const cors = require("cors");
const { connecter, db, isConnected } = require("./bd/connect");

const app = express();

// --- Middlewares ---
app.use(cors()); // Autorise Expo Go à accéder à l’API
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- Routes ---
const routerUsers = require("./route/user");
app.use("/api/v1", routerUsers);

const routerTournois = require("./route/tournoi");
app.use("/api/v1", routerTournois);

// --- Health Check ---
app.get("/health", (req, res) => {
  const status = isConnected() ? "Connecté" : "Déconnecté";
  res.json({ database: status });
});

// --- Lancement serveur ---
connecter()
  .then(() => {
    const port = process.env.EXPRESS_PORT || 3000;

    // Écoute sur toutes les interfaces → nécessaire pour Docker + Expo Go
    app.listen(port, "0.0.0.0", () => {
      console.log(`API lancée sur le port ${port}`);
    });
  })
  .catch((err) => {
    console.error("Erreur connexion MongoDB :", err);
    process.exit(1);
  });
