class User {
  constructor(nom, prenom, email, telephone, tournois_id) {
    this.nom = nom;
    this.prenom = prenom;
    this.email = email;
    this.telephone = telephone;
    this.tournois_id = tournois_id;
  }
}

module.exports = { User };
