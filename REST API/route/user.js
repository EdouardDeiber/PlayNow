const express = require("express");
const {
  ajouterUser,
  getUsers,
  getUser,
  modifierUser,
  inscrireTournoi,
  verifierInscription,
  verifierConflitTournoi,
} = require("../controller/user");
const router = express.Router();

router.route("/user").post(ajouterUser);
router.route("/user").get(getUsers);
router.route("/user/:id").get(getUser);
router.route("/user/:id").put(modifierUser);
router.route("/user/tournoi/:id/:tournois_id").patch(inscrireTournoi);
router
  .route("/user/:userId/tournoi/:tournoiId/inscription")
  .get(verifierInscription);
router
  .route("/user/:userId/tournoi/:tournoiId/conflit")
  .get(verifierConflitTournoi);
module.exports = router;
