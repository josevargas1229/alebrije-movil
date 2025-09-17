//ejemplo del login, se puede usar react-native-paper o cualquier otra librería de UI
// hay que hacer componentes como TextInput, Button, etc para que sean reutilizables con tema claro/oscuro,
// como el ThemedText y ThemedView
import React, { useState } from "react";
import { View, TextInput, Button, Text } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { login } from "../store/slices/authSlice";

export default function LoginScreen() {
    const dispatch = useDispatch<any>();
    const { loading, error } = useSelector((state: any) => state.auth);

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const handleLogin = () => {
        dispatch(login({ email, password }));
    };

    return (
        <View style={{ padding: 20 }}>
            <TextInput placeholder="Email" value={email} onChangeText={setEmail} />
            <TextInput
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
            />
            <Button onPress={handleLogin} title="Iniciar sesión"/>
            {error && <Text style={{ color: "red" }}>{error}</Text>}
        </View>
    );
}
