import { useLocalSearchParams, useRouter } from "expo-router";
import { inscrireTournoiOfflineSafe } from "@/app/services/apiUser";
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from "react-native";
import React, { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function TournamentDetails() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [tournament, setTournament] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const showAlert = (title: string, message: string) => {
    if (typeof window !== "undefined" && window.alert) {
      window.alert(`${title}\n\n${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  useEffect(() => {
    const fetchTournament = async () => {
      try {
        const res = await fetch(`http://localhost:3000/api/v1/tournoi/${id}`);
        if (!res.ok) throw new Error("Impossible de récupérer le tournoi");
        const data = await res.json();
        setTournament(data);
      } catch (err) {
        console.error(err);
        showAlert("Erreur", "Impossible de récupérer les détails du tournoi.");
      } finally {
        setLoading(false);
      }
    };

    fetchTournament();
  }, [id]);

  const decodeTokenPayload = (token: string) => {
    try {
      const payload = token.split(".")[1];
      const json = JSON.parse(decodeURIComponent(escape(atob(payload))));
      return json;
    } catch {
      return null;
    }
  };

  const handleInscription = async () => {
    try {
      setSubmitting(true);

      const token = await AsyncStorage.getItem("token");
      if (!token) {
        showAlert("Erreur", "Vous devez vous connecter pour vous inscrire.");
        router.push("/login");
        return;
      }

      const payload = decodeTokenPayload(token);
      if (!payload || !payload.userId) {
        showAlert("Erreur", "Token invalide. Veuillez vous reconnecter.");
        router.push("/login");
        return;
      }

      const userId = payload.userId;

      // 👉 utilisation de la fonction OFFLINE SAFE
      const result = await inscrireTournoiOfflineSafe(
        userId,
        id as string,
        token
      );

      if (result.offline) {
        showAlert(
          "Mode hors-ligne",
          "Vous êtes hors ligne. L'inscription sera synchronisée automatiquement lorsque vous aurez Internet."
        );
      } else {
        showAlert("Succès", "Inscription réussie !");
      }

      // Refresh local
      const refreshed = await fetch(
        `http://localhost:3000/api/v1/tournoi/${id}`
      );
      if (refreshed.ok) setTournament(await refreshed.json());
    } catch (err) {
      console.error("Erreur inscription :", err);
      showAlert("Erreur", "Une erreur est survenue.");
    } finally {
      setSubmitting(false);
    }
  };

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
        Participants : {(tournament.users_id || []).length} /{" "}
        {tournament.nbrParticipant}
      </Text>

      <TouchableOpacity
        style={[styles.button, submitting && { opacity: 0.6 }]}
        onPress={handleInscription}
        disabled={submitting}
      >
        <Text style={styles.buttonText}>
          {submitting ? "Inscription..." : "S'inscrire"}
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
    fontSize: 30,
    fontWeight: "bold",
    color: "#ffffff",
    textAlign: "center",
    marginBottom: 25,
  },
  info: {
    backgroundColor: "#d1f0c5",
    padding: 14,
    borderRadius: 14,
    marginBottom: 12,
    fontSize: 18,
    color: "#1b3d2f",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  button: {
    marginTop: 25,
    backgroundColor: "#000000",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  buttonText: {
    color: "#ffffff",
    fontWeight: "bold",
    fontSize: 18,
  },
});
