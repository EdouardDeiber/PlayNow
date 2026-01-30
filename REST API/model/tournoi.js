class Tournoi {
  constructor(sport, date, heure, lieu, materiel, nbrParticipant, users_id) {
    this.sport = sport;
    this.date = date;
    this.heure = heure;
    this.lieu = lieu;
    this.materiel = materiel;
    this.nbrParticipant = nbrParticipant;
    this.users_id = users_id;
    this.createdAt = new Date(); // Timestamp pour synchronisation incrémentale
  }
}

module.exports = { Tournoi };
