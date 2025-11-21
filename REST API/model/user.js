class User {
  constructor(nom, prenom, email, telephone, tournois_id, role, password) {
    this.nom = nom;
    this.prenom = prenom;
    this.email = email;
    this.telephone = telephone;
    this.tournois_id = tournois_id;
    this.role = role;
    this.password = password;
  }
}

module.exports = { User };
