import { useLocalSearchParams } from "expo-router";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import React, { useEffect, useState } from "react";

export default function TournamentDetails() {
  const { id } = useLocalSearchParams(); // récupère l’ID passé dans l’URL
  const [tournament, setTournament] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`http://10.29.251.176:3000/api/v1/tournoi/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setTournament(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!tournament) {
    return (
      <View style={styles.center}>
        <Text>Aucun tournoi trouvé.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{tournament.sport}</Text>

      <Text style={styles.info}>
        Date : {new Date(tournament.date).toLocaleDateString("fr-FR")}
      </Text>
      <Text style={styles.info}>Heure : {tournament.heure}</Text>
      <Text style={styles.info}>Lieu : {tournament.lieu}</Text>
      <Text style={styles.info}>Matériel : {tournament.materiel}</Text>
      <Text style={styles.info}>
        Participants : {tournament.nbrParticipant}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#fff" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 28, fontWeight: "bold", marginBottom: 20 },
  info: { fontSize: 18, marginBottom: 10 },
});
