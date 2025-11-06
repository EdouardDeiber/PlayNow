const { Tournoi } = require("../model/tournoi");
const { db } = require("../bd/connect"); // on utilise db() directement
const { ObjectId } = require("mongodb");

const ajouterTournoi = async (req, res) => {
  try {
    // Log pour debug
    console.log("Body reçu :", req.body);

    // Crée l'objet Tournoi
    let tournoi = new Tournoi(
      req.body.sport,
      new Date(),
      req.body.heure,
      req.body.lieu,
      req.body.materiel,
      req.body.nbrParticipant,
      req.body.users_id
    );

    // Insertion dans MongoDB
    let result = await db().collection("tournoi").insertOne(tournoi);

    // Log du résultat
    console.log("Tournoi inséré :", result);

    // On renvoie une réponse HTTP 201 Created
    res.status(201).json(result);
  } catch (error) {
    // Log détaillé pour debug
    console.error("Erreur dans ajouterTournoi :", error);

    // Réponse JSON sécurisée pour éviter fuite d'informations sensibles
    res
      .status(500)
      .json({ error: "Erreur serveur lors de l'ajout du Tournoi" });
  }
};

const getTournois = async (req, res) => {
  try {
    let cursor = db().collection("tournoi").find();
    let result = await cursor.toArray();
    res.status(200).json(result);
  } catch (error) {
    console.error("Erreur dans getTournois:", error);
    res.status(500).json(error);
  }
};

const getTournoi = async (req, res) => {
  try {
    const id = req.params.id;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: "ID invalide" });
    }
    const user = await db()
      .collection("tournoi")
      .findOne({ _id: new ObjectId(id) });

    if (!user) {
      return res.status(404).json({ error: "Tournoi non trouvé" });
    }
    res.status(200).json(user);
  } catch (error) {
    console.error("Erreur dans getTournoi:", error);
    res.status(500).json(error);
  }
};

const placeTournoi = async (req, res) => {
  try {
    const id = req.params.id;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: "ID invalide" });
    }

    // On récupère uniquement le champ isAvailable calculé
    const result = await db()
      .collection("tournoi")
      .aggregate([
        { $match: { _id: new ObjectId(id) } },
        {
          $project: {
            _id: 0, // on ne renvoie pas l'ID
            isAvailable: {
              $cond: {
                if: { $gte: [{ $size: "$users_id" }, "$nbrParticipant"] },
                then: false,
                else: true,
              },
            },
          },
        },
      ])
      .toArray();

    if (!result || result.length === 0) {
      return res.status(404).json({ error: "Tournoi non trouvé" });
    }

    // On renvoie directement le booléen
    res.status(200).json({ isAvailable: result[0].isAvailable });
  } catch (error) {
    console.error("Erreur dans placeTournoi:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

const modifierTournoi = async (req, res) => {
  try {
    let id = new ObjectId(req.params.id);
    let nSport = req.body.sport;

    let result = await db()
      .collection("tournoi")
      .updateOne({ _id: id }, { $set: { sport: nSport } });

    if (result.modifiedCount > 0) {
      res.status(200).json({ msg: "Tournoi modifié avec succès" });
    } else {
      res.status(404).json({ msg: "Tournoi non trouvé" });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json(error);
  }
};

module.exports = {
  ajouterTournoi,
  getTournois,
  getTournoi,
  modifierTournoi,
  placeTournoi,
};
