const express = require("express");
const auth = require("../middleware/auth");
const admin = require("../middleware/admin");
const {
  ajouterTournoi,
  getTournois,
  getTournoi,
  modifierTournoi,
  placeTournoi,
} = require("../controller/tournoi");
const router = express.Router();

router.route("/tournoi").post(ajouterTournoi, auth, admin);
router.route("/tournoi").get(getTournois, auth);
router.route("/tournoi/:id").get(getTournoi, auth);
router.route("/tournoi/:id").put(modifierTournoi, auth);
router.route("/tournoi/place/:id").get(placeTournoi, auth);

module.exports = router;
