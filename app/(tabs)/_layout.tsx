import { Tabs } from "expo-router";
import React from "react";
import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          borderTopWidth: 0,
          elevation: 5,
          backgroundColor: Colors[colorScheme ?? "light"].background,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="house.fill" color={color} />
          ),
          animation: "shift",
        }}
      />

      <Tabs.Screen
        name="(scanner)"
        options={{
          title: "Escáner",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="qrcode" color={color} />
          ),
          animation: "shift",
        }}
      />

      <Tabs.Screen
        name="(sales)"
        options={{
          title: "Ventas",
          tabBarLabel: "Ventas",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="tag.fill" color={color} />
          ),
          animation: "shift",
        }}
      />
    

        <Tabs.Screen
  name="(history)"
  options={{
    title: "Historial",
    tabBarLabel: "Historial",
    tabBarIcon: ({ color }) => (
      <IconSymbol size={28} name="clock.fill" color={color} />
    ),
    animation: "shift",
  }}
/>

   <Tabs.Screen
        name="Perfil" 
        options={{
          title: "Perfil",
          tabBarLabel: "Perfil",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="person.crop.circle.fill" color={color} />
          ),
          animation: "shift",
        }}
      />

    </Tabs>
  );
}
