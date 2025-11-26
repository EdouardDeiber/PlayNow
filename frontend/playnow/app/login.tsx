import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function LoginScreen() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Erreur", "Veuillez saisir email et mot de passe.");
      return;
    }

    try {
      const response = await fetch(
        /*"http://10.29.251.176:3000/api/v1/login"*/ "http://localhost:3000/api/v1/login",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        Alert.alert("Erreur", data.message || "Connexion échouée");
        return;
      }

      // Stocker le token et le rôle
      await AsyncStorage.setItem("token", data.token);
      await AsyncStorage.setItem("role", data.role);

      // Connexion réussie → navigation en fonction du rôle
      if (data.role === "admin") {
        router.replace("/admin/home"); // page admin
      } else {
        router.replace("/user/home"); // page user
      }
    } catch (error) {
      console.error("Erreur API :", error);
      Alert.alert("Erreur", "Impossible de se connecter au serveur");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>PlayNow!</Text>

      <TextInput
        placeholder="Email"
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <TextInput
        placeholder="Mot de passe"
        style={styles.input}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Se connecter</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#2cae4b", // vert comme l'image
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 30,
    color: "#fff",
    textAlign: "center",
  },
  trophy: {
    width: 100,
    height: 100,
    marginBottom: 20,
  },
  input: {
    width: "100%",
    backgroundColor: "#d1f0c5", // input vert clair
    borderRadius: 12,
    padding: 14,
    marginBottom: 15,
    fontSize: 16,
  },
  button: {
    width: "100%",
    backgroundColor: "#000000", // bouton noir
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 18,
  },
});
