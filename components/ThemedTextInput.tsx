import React from "react";
import { TextInput, StyleSheet, TextInputProps, useColorScheme } from "react-native";

interface ThemedTextInputProps extends TextInputProps {
  style?: any;
}

export default function ThemedTextInput({ style, ...props }: ThemedTextInputProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const themedStyles = {
    backgroundColor: isDark ? "#2a2a2a" : "#fff",
    borderColor: isDark ? "#404040" : "#e1e1e1",
    color: isDark ? "#000000ff" : "#333",
  };

  return (
    <TextInput
      style={[styles.input, themedStyles, style]}
      placeholderTextColor={isDark ? "#888" : "#999"}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    height: 56,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
  },
});