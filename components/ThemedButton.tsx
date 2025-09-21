import React from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  useColorScheme,
} from "react-native";

interface ThemedButtonProps {
  onPress: () => void;
  title: string;
  loading?: boolean;
  disabled?: boolean;
  style?: any;
  variant?: "primary" | "secondary";
}

export default function ThemedButton({
  onPress,
  title,
  loading = false,
  disabled = false,
  style,
  variant = "primary",
}: ThemedButtonProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const getButtonStyle = () => {
    if (variant === "primary") {
      return {
        backgroundColor: disabled ? "#ccc" : "#1e3a8a",
      };
    } else {
      return {
        backgroundColor: "transparent",
        borderWidth: 1,
        borderColor: isDark ? "#404040" : "#e1e1e1",
      };
    }
  };

  const getTextStyle = () => {
    if (variant === "primary") {
      return {
        color: "#fff",
      };
    } else {
      return {
        color: isDark ? "#fff" : "#333",
      };
    }
  };

  return (
    <TouchableOpacity
      style={[styles.button, getButtonStyle(), style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={variant === "primary" ? "#fff" : "#1e3a8a"} />
      ) : (
        <Text style={[styles.buttonText, getTextStyle()]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 56,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
  },
});