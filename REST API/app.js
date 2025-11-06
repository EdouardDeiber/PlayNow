const express = require("express");
const { connecter, db, isConnected } = require("./bd/connect");

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const routerUsers = require("./route/user");
app.use("/api/v1", routerUsers);

const routerTournois = require("./route/tournoi");
app.use("/api/v1", routerTournois);

app.get("/health", (req, res) => {
  const status = isConnected() ? "Connecté" : "Déconnecté";
  res.json({ database: status });
});

connecter()
  .then(() => {
    app.listen(process.env.EXPRESS_PORT, () => {
      console.log(`API lancée sur le port ${process.env.EXPRESS_PORT}`);
    });
  })
  .catch((err) => {
    console.error("Erreur connexion MongoDB :", err);
    process.exit(1);
  });
