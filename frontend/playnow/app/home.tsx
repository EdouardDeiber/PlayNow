import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";

interface Tournament {
  _id: string;
  sport: string | null;
  date: string;
  heure: string;
  lieu: string;
  materiel: string;
  nbrParticipant: number;
  users_id: string[];
}

// Fonction pour formater la date au format français (jj/mm/aaaa ou longue)
function formatDateFr(dateString: string): string {
  const d = new Date(dateString);
  // Format court : 01/10/2025
  return d.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  // Si tu préfères la version longue, remplace par :
  // return d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

export default function HomeScreen() {
  const router = useRouter();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://10.29.251.176:3000/api/v1/tournoi")
      .then((res) => res.json())
      .then((data: Tournament[]) => {
        setTournaments(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Erreur API :", err);
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

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tournois disponibles</Text>

      <FlatList
        data={tournaments}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => router.push(`/tournoi/${item._id}`)}>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>{item.sport ?? "Tournoi"}</Text>
              <Text style={styles.cardSub}>
                Date : {formatDateFr(item.date)}
              </Text>
              <Text style={styles.cardSub}>Heure : {item.heure}</Text>
              <Text style={styles.cardSub}>Lieu : {item.lieu}</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 20,
  },
  card: {
    padding: 15,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    marginBottom: 15,
    backgroundColor: "#f9f9f9",
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 5,
  },
  cardSub: {
    fontSize: 15,
    color: "#555",
  },
});
