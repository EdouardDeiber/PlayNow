const express = require("express");
const {
  ajouterTournoi,
  getTournois,
  getTournoi,
  modifierTournoi,
  placeTournoi,
} = require("../controller/tournoi");
const router = express.Router();

router.route("/tournoi").post(ajouterTournoi);
router.route("/tournoi").get(getTournois);
router.route("/tournoi/:id").get(getTournoi);
router.route("/tournoi/:id").put(modifierTournoi);
router.route("/tournoi/place/:id").get(placeTournoi);

module.exports = router;
