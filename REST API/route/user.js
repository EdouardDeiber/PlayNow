const express = require("express");
const auth = require("../middleware/auth");
const admin = require("../middleware/admin");
const {
  ajouterUser,
  getUsers,
  getUser,
  modifierUser,
  inscrireTournoi,
  verifierInscription,
  verifierConflitTournoi,
  loginUser,
  getUserTournaments,
} = require("../controller/user");
const router = express.Router();

router.route("/user").post(ajouterUser, auth, admin);
router.route("/user").get(getUsers, auth, admin);
router.route("/user/:id").get(getUser, auth);
router.route("/user/:id").put(modifierUser, auth);
router.route("/user/:id/tournoi/:tournois_id").patch(inscrireTournoi, auth);
router.route("/user/:id/tournois").get(auth, getUserTournaments);
router
  .route("/user/:userId/tournoi/:tournoiId/inscription")
  .get(verifierInscription);
router
  .route("/user/:userId/tournoi/:tournoiId/conflit")
  .get(verifierConflitTournoi);

router.route("/login").post(loginUser);

module.exports = router;
