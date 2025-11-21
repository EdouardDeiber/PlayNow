const { User } = require("../model/user");
const { db } = require("../bd/connect"); // on utilise db() directement
const { ObjectId } = require("mongodb");

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
      req.body.tournois_id
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

    // 1️ Vérifie que l'utilisateur existe
    const user = await db().collection("user").findOne({ _id: userId });
    if (!user) return res.status(404).json({ msg: "Utilisateur non trouvé" });

    // 2️ Vérifie s'il est déjà inscrit à ce tournoi
    const dejaInscrit = (user.tournois_id || []).some((id) =>
      id.equals(tournoiId)
    );

    if (dejaInscrit) {
      return res.status(400).json({ msg: "Utilisateur déjà inscrit" });
    }

    // 3️ Récupère le tournoi
    const tournoi = await db()
      .collection("tournoi")
      .findOne({ _id: tournoiId });
    if (!tournoi) return res.status(404).json({ msg: "Tournoi non trouvé" });

    // 4️ Vérifie conflit de date
    const conflit = await db()
      .collection("tournoi")
      .findOne({
        _id: { $in: user.tournois_id || [] },
        date: tournoi.date,
        _id: { $ne: tournoi._id },
      });

    if (conflit) {
      return res
        .status(400)
        .json({ msg: "Conflit de date avec un autre tournoi" });
    }

    // 5️ Nouvelle logique "placeTournoi" → disponibilité par users_id & nbrParticipant
    const nbInscrits = Array.isArray(tournoi.users_id)
      ? tournoi.users_id.length
      : 0;

    const capacité = tournoi.nbrParticipant ?? 0;
    const isAvailable = nbInscrits < capacité;

    if (!isAvailable) {
      return res.status(400).json({ msg: "Tournoi complet" });
    }

    // 6️ Ajoute l'utilisateur au tableau `user.tournois_id`
    await db()
      .collection("user")
      .updateOne({ _id: userId }, { $addToSet: { tournois_id: tournoiId } });

    // 7️ Ajoute également l’utilisateur dans tournoi.users_id (optionnel mais logique)
    await db()
      .collection("tournoi")
      .updateOne({ _id: tournoiId }, { $addToSet: { users_id: userId } });

    res.status(200).json({ msg: "Tournoi ajouté avec succès" });
  } catch (error) {
    console.error("Erreur dans inscrireTournoi :", error);
    res.status(500).json({ error: "Erreur serveur" });
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

module.exports = {
  ajouterUser,
  getUsers,
  getUser,
  modifierUser,
  inscrireTournoi,
  verifierInscription,
  verifierConflitTournoi,
};
