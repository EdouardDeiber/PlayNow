import React from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  StyleSheet,
  Button,
  Alert,
} from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

const App = () => {
  //const [login, setLogin] = useState("");
  //const [password, setPassword] = useState("");

  const handleLogin = () => {
    //Alert.alert("Connexion", `Login: ${login}\nMot de passe: ${password}`);
  };

  return (
    <ScrollView>
      <SafeAreaProvider style={styles.container}>
        <Text style={styles.title}>PlayNow!</Text>
        <TextInput
          style={styles.txtBox}
          placeholder="Login"
          //value={login}
          //onChangeText={setLogin}
        />

        <TextInput
          style={styles.txtBox}
          placeholder="Mot de passe"
          //value={password}
          //onChangeText={setPassword}
          secureTextEntry={true} //masque le mot de passe
        />
        <Button title="Se connecter" onPress={handleLogin} />
      </SafeAreaProvider>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    margin: 10,
  },
  txtBox: {
    height: 40,
    borderColor: "gray",
    borderWidth: 1,
    borderRadius: 20,
    padding: 10,
    margin: 10,
  },
  title: {
    padding: 50,
  },
});

export default App;
