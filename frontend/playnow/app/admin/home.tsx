import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { showAlert } from "../utils/offlineQueue";
import { fetchTournamentsIncremental } from "../services/apiTournoi";

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

function formatDateFr(dateString: string) {
  const d = new Date(dateString);
  return d.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function decodeToken(token: string) {
  try {
    const payload = token.split(".")[1];
    const decoded = JSON.parse(atob(payload));
    return decoded;
  } catch {
    return null;
  }
}

export default function UserHomeScreen() {
  const router = useRouter();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMyTournaments, setShowMyTournaments] = useState(false);

  useEffect(() => {
    const fetchTournaments = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        if (!token) {
          showAlert("Erreur", "Veuillez vous connecter.");
          router.replace("/login");
          return;
        }

        const payload = decodeToken(token);
        if (!payload || !payload.userId) {
          showAlert("Erreur", "Token invalide. Veuillez vous reconnecter.");
          router.replace("/login");
          return;
        }

        // Vérification du rôle admin
        if (payload.role !== "admin") {
          showAlert(
            "Accès refusé",
            "Vous n'êtes pas autorisé à accéder à cette page."
          );
          router.replace("/user/home");
          return;
        }

        // Pour "Mes tournois", utiliser l'endpoint utilisateur
        // Pour "Tous les tournois", utiliser la synchronisation incrémentale
        if (showMyTournaments) {
          const endpoint = `http://localhost:3000/api/v1/user/${payload.userId}/tournois`;
          const res = await fetch(endpoint, {
            headers: { Authorization: `Bearer ${token}` },
          });

          if (!res.ok) throw new Error("Impossible de récupérer les tournois");

          const data: Tournament[] = await res.json();
          setTournaments(data);
        } else {
          const data = await fetchTournamentsIncremental(token);
          setTournaments(data);
        }
      } catch (err) {
        console.error("Erreur API :", err);
        showAlert("Erreur", "Impossible de récupérer les tournois.");
      } finally {
        setLoading(false);
      }
    };

    fetchTournaments();
  }, [showMyTournaments]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Admin</Text>
      <Text style={styles.title}>
        {showMyTournaments ? "MES TOURNOIS" : "TOURNOIS DISPONIBLES"}
      </Text>

      <FlatList
        data={tournaments}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => router.push(`/user/tournoi/${item._id}`)}
          >
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

      <TouchableOpacity
        style={styles.button}
        onPress={() => setShowMyTournaments(!showMyTournaments)}
      >
        <Text style={styles.buttonText}>
          {showMyTournaments ? "Tous les tournois" : "Mes tournois"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#2cae4b",
    padding: 20,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#2cae4b",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
    color: "#ffffff",
  },
  card: {
    backgroundColor: "#d1f0c5",
    padding: 18,
    borderRadius: 16,
    marginBottom: 18,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#1b3d2f",
    marginBottom: 6,
  },
  cardSub: {
    fontSize: 16,
    color: "#2b573d",
    marginBottom: 2,
  },
  button: {
    backgroundColor: "#000",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 16,
  },
  buttonText: {
    color: "#ffffff",
    fontWeight: "bold",
    fontSize: 18,
  },
});
