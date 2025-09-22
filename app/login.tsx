import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { login } from "../store/slices/authSlice";
import ThemedTextInput from "../components/ThemedTextInput";
import ThemedButton from "../components/ThemedButton";

export default function LoginScreen() {
  const dispatch = useDispatch<any>();
  const { loading, error } = useSelector((state: any) => state.auth);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Validaciones
  const emailValid = useMemo(() => /\S+@\S+\.\S+/.test(email), [email]);
  const passwordValid = useMemo(() => password.length >= 6, [password]);
  const formValid = emailValid && passwordValid;

  const handleLogin = () => {
    if (!formValid) return;
    dispatch(login({ email, password }));
  };

  return (
    <View style={styles.container}>
      {/* Logo */}
      <View style={styles.logoContainer}>
        <Image
          source={require("../assets/images/logoaleb.png")}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>

      {/* Bienvenida */}
      <View style={styles.welcomeContainer}>
        <Text style={styles.welcomeText}>Hola, Bienvenido de Nuevo! 👋</Text>
      </View>

      {/* Formulario */}
      <View style={styles.formContainer}>
        {/* Email */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Correo electrónico</Text>
          <ThemedTextInput
            placeholder="Introduce tu correo electrónico"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            style={[
              styles.input,
              email.length > 0 && !emailValid ? { borderColor: "red" } : null,
            ]}
          />
          {email.length > 0 && !emailValid && (
            <Text style={styles.hintError}>Formato de correo no válido.</Text>
          )}
        </View>

        {/* Password */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Contraseña</Text>
          <View style={styles.passwordContainer}>
            <ThemedTextInput
              placeholder="Por favor ingrese su contraseña"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              style={[
                styles.input,
                styles.passwordInput,
                password.length > 0 && !passwordValid ? { borderColor: "red" } : null,
              ]}
            />
            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => setShowPassword(!showPassword)}
            >
              <Text style={styles.eyeIcon}>{showPassword ? "👁️" : "👁️‍🗨️"}</Text>
            </TouchableOpacity>
          </View>
          {password.length > 0 && !passwordValid && (
            <Text style={styles.hintError}>La contraseña debe tener al menos 6 caracteres.</Text>
          )}
        </View>

        {/* Remember me */}
        <View style={styles.optionsContainer}>
          <TouchableOpacity
            style={styles.rememberContainer}
            onPress={() => setRememberMe(!rememberMe)}
          >
            <View style={[styles.checkbox, rememberMe && styles.checkedBox]}>
              {rememberMe && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={styles.rememberText}>Recuérdame</Text>
          </TouchableOpacity>
        </View>

        {/* Login Button */}
        <ThemedButton
          onPress={handleLogin}
          title={loading ? "Validando..." : "Iniciar Sesión"}
          loading={loading}
          disabled={!formValid || loading}
          style={[
            styles.loginButton,
            (!formValid || loading) ? { opacity: 0.6 } : null,
          ]}
        />

        {/* Error Message */}
        {Boolean(error) && <Text style={styles.errorText}>{String(error)}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
    paddingHorizontal: 24,
  },
  logoContainer: {
    alignItems: "center",
    marginTop: 60,
    marginBottom: 40,
  },
  logo: {
    width: 120,
    height: 120,
  },
  welcomeContainer: {
    marginBottom: 40,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: "600",
    color: "#1a1a1a",
    textAlign: "left",
  },
  formContainer: {
    flex: 1,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
    marginBottom: 8,
  },
  input: {
    height: 56,
    borderWidth: 1,
    borderColor: "#e1e1e1",
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: "#fff",
  },
  hintError: {
    color: "red",
    marginTop: 6,
    fontSize: 12,
  },
  passwordContainer: {
    position: "relative",
  },
  passwordInput: {
    paddingRight: 50,
  },
  eyeButton: {
    position: "absolute",
    right: 16,
    top: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    width: 24,
  },
  eyeIcon: {
    fontSize: 20,
    color: "#666",
  },
  optionsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 32,
  },
  rememberContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: "#007bff",
    borderRadius: 4,
    marginRight: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  checkedBox: {
    backgroundColor: "#007bff",
  },
  checkmark: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  rememberText: {
    fontSize: 14,
    color: "#333",
  },
  forgotText: {
    fontSize: 14,
    color: "#ff6b6b",
    fontWeight: "500",
  },
  loginButton: {
    height: 56,
    backgroundColor: "#1e3a8a",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  errorText: {
    color: "#ff6b6b",
    fontSize: 14,
    textAlign: "center",
    marginTop: 10,
  },
});