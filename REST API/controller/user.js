const { User } = require("../model/user");
const { db } = require("../bd/connect");
const { ObjectId } = require("mongodb");
const jwt = require("jsonwebtoken");

const ajouterUser = async (req, res) => {
  try {
    // Log pour debug
    console.log("Body reçu :", req.body);

    // Crée l'objet user
    let user = new User(
      req.body.nom,
      req.body.prenom,
      req.body.email,
      req.body.telephone,
      req.body.tournois_id,
      req.body.role,
      req.body.password
    );

    // Insertion dans MongoDB
    let result = await db().collection("user").insertOne(user);

    // Log du résultat
    console.log("User inséré :", result);

    // On renvoie une réponse HTTP 201 Created
    res.status(201).json(result);
  } catch (error) {
    // Log détaillé pour debug
    console.error("Erreur dans ajouterUser :", error);

    // Réponse JSON sécurisée pour éviter fuite d'informations sensibles
    res.status(500).json({ error: "Erreur serveur lors de l'ajout du User" });
  }
};

const getUsers = async (req, res) => {
  try {
    let cursor = db().collection("user").find();
    let result = await cursor.toArray();
    res.status(200).json(result);
  } catch (error) {
    console.error("Erreur dans getUser:", error);
    res.status(500).json(error);
  }
};

const getUser = async (req, res) => {
  try {
    const id = req.params.id;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: "ID invalide" });
    }
    const user = await db()
      .collection("user")
      .findOne({ _id: new ObjectId(id) });

    if (!user) {
      return res.status(404).json({ error: "User non trouvé" });
    }
    res.status(200).json(user);
  } catch (error) {
    console.error("Erreur dans getUser:", error);
    res.status(500).json(error);
  }
};

const modifierUser = async (req, res) => {
  try {
    let id = new ObjectId(req.params.id);
    let nNoms = req.body.nom;

    let result = await db()
      .collection("user")
      .updateOne({ _id: id }, { $set: { noms: nNoms } });

    if (result.modifiedCount > 0) {
      res.status(200).json({ msg: "User modifié avec succès" });
    } else {
      res.status(404).json({ msg: "User non trouvé" });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json(error);
  }
};

const inscrireTournoi = async (req, res) => {
  try {
    const userId = new ObjectId(req.params.id);
    const tournoiId = new ObjectId(req.params.tournois_id);

    // 1. Vérifie que l'utilisateur existe
    const user = await db().collection("user").findOne({ _id: userId });
    if (!user) return res.status(404).json({ msg: "Utilisateur non trouvé" });

    // 2. Vérifie si déjà inscrit (sécurisé pour tournois_id null)
    const userTournois = Array.isArray(user.tournois_id)
      ? user.tournois_id
      : [];
    const dejaInscrit = userTournois.some((id) => id.equals(tournoiId));
    if (dejaInscrit) {
      return res.status(400).json({ msg: "Utilisateur déjà inscrit" });
    }

    // 3. Récupère le tournoi
    const tournoi = await db()
      .collection("tournoi")
      .findOne({ _id: tournoiId });
    if (!tournoi) return res.status(404).json({ msg: "Tournoi non trouvé" });

    // 4. Vérifie conflit de date (sécurisé si user.tournois_id null)
    const conflit = await db()
      .collection("tournoi")
      .findOne({
        _id: { $in: userTournois },
        date: tournoi.date,
        _id: { $ne: tournoi._id },
      });
    if (conflit) {
      return res
        .status(400)
        .json({ msg: "Conflit de date avec un autre tournoi" });
    }

    // 5. Vérifie la disponibilité
    const nbInscrits = Array.isArray(tournoi.users_id)
      ? tournoi.users_id.length
      : 0;
    const capacite = tournoi.nbrParticipant ?? 0;
    if (nbInscrits >= capacite) {
      return res.status(400).json({ msg: "Tournoi complet" });
    }

    // 6. S'assurer que fields users_id et user.tournois_id sont des tableaux (si null)
    if (!Array.isArray(tournoi.users_id)) {
      await db()
        .collection("tournoi")
        .updateOne({ _id: tournoiId }, { $set: { users_id: [] } });
    }
    if (!Array.isArray(user.tournois_id)) {
      await db()
        .collection("user")
        .updateOne({ _id: userId }, { $set: { tournois_id: [] } });
    }

    // 7. Ajoute l'utilisateur aux deux tableaux (idempotent grâce à $addToSet)
    await db()
      .collection("user")
      .updateOne({ _id: userId }, { $addToSet: { tournois_id: tournoiId } });

    await db()
      .collection("tournoi")
      .updateOne({ _id: tournoiId }, { $addToSet: { users_id: userId } });

    return res.status(200).json({ msg: "Tournoi ajouté avec succès" });
  } catch (error) {
    console.error("Erreur dans inscrireTournoi :", error);
    return res.status(500).json({ error: "Erreur serveur" });
  }
};

const verifierInscription = async (req, res) => {
  try {
    let userId = new ObjectId(req.params.userId);
    let tournoiId = new ObjectId(req.params.tournoiId);

    // Vérifie que les IDs sont valides
    if (!ObjectId.isValid(userId) || !ObjectId.isValid(tournoiId)) {
      return res.status(400).json({ error: "ID invalide" });
    }

    // Recherche du user qui contient ce tournoiId dans son tableau
    const user =
      (await db().collection("user").findOne(
        {
          _id: userId,
          tournois_id: tournoiId,
        },
        { _id: 0 }
      )) !== null;

    // Retourne uniquement un booléen
    const inscrit = !!user; // true si trouvé, false sinon

    return res.status(200).json({ inscrit });
  } catch (error) {
    console.error("Erreur dans verifierInscription:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

const verifierConflitTournoi = async (req, res) => {
  try {
    const { userId, tournoiId } = req.params;

    if (!ObjectId.isValid(userId) || !ObjectId.isValid(tournoiId)) {
      return res.status(400).json({ error: "ID invalide" });
    }

    // 1. Récupère la date du tournoi actuel
    const tournoi = await db()
      .collection("tournoi")
      .findOne({
        _id: new ObjectId(tournoiId),
      });

    if (!tournoi) {
      return res.status(404).json({ error: "Tournoi non trouvé" });
    }

    // 2. Récupère le user
    const user = await db()
      .collection("user")
      .findOne({
        _id: new ObjectId(userId),
      });

    if (!user) {
      return res.status(404).json({ error: "Utilisateur non trouvé" });
    }

    // 3. Vérifie s’il a un autre tournoi à la même date
    const conflit = await db()
      .collection("tournoi")
      .findOne({
        _id: { $in: user.tournois_id },
        date: tournoi.date,
        _id: { $ne: tournoi._id }, // exclure le tournoi actuel
      });

    const dejaInscritMemeDate = !!conflit;

    res.status(200).json({ memeDate: dejaInscritMemeDate });
  } catch (error) {
    console.error("Erreur dans verifierConflitTournoi:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await db().collection("user").findOne({ email });
    if (!user) return res.status(400).json({ message: "Email incorrect" });

    if (user.password !== password)
      return res.status(400).json({ message: "Mot de passe incorrect" });

    // Générer un token
    const token = jwt.sign(
      {
        userId: user._id,
        role: user.role,
      },
      "SECRET_KEY_À_CHANGER", // clé secrète
      { expiresIn: "7d" }
    );

    res.status(200).json({
      message: "Connexion réussie",
      token,
      userId: user._id,
      email: user.email,
      role: user.role,
    });
  } catch (error) {
    console.error("Erreur loginUser :", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

const getUserTournaments = async (req, res) => {
  try {
    const userId = req.params.id;

    if (!ObjectId.isValid(userId))
      return res.status(400).json({ message: "ID utilisateur invalide" });

    const user = await db()
      .collection("user")
      .findOne({ _id: new ObjectId(userId) });

    if (!user)
      return res.status(404).json({ message: "Utilisateur non trouvé" });

    const tournois = await db()
      .collection("tournoi")
      .find({ _id: { $in: user.tournois_id || [] } })
      .toArray();

    res.status(200).json(tournois);
  } catch (err) {
    console.error("Erreur dans getUserTournaments :", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

module.exports = {
  ajouterUser,
  getUsers,
  getUser,
  modifierUser,
  inscrireTournoi,
  verifierInscription,
  verifierConflitTournoi,
  loginUser,
  getUserTournaments,
};
