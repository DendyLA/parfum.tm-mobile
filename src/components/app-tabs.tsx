import { Tabs } from 'expo-router';
import { Grid3X3, Heart, Home, ShoppingBag } from 'lucide-react-native';
import { ColorValue } from 'react-native';

const palette = {
  primary: '#212121',
  secondary: '#8c8c8c',
  border: '#e4e4e4',
  surface: '#ffffff',
};

type TabIconProps = {
  color: ColorValue;
  size: number;
};

function iconColor(color: ColorValue) {
  return String(color);
}

export default function AppTabs() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: palette.primary,
        tabBarInactiveTintColor: palette.secondary,
        tabBarStyle: {
          height: 68,
          borderTopColor: palette.border,
          backgroundColor: palette.surface,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Главная',
          tabBarIcon: ({ color, size }: TabIconProps) => (
            <Home color={iconColor(color)} size={size} strokeWidth={2.2} />
          ),
        }}
      />
      <Tabs.Screen
        name="categories"
        options={{
          title: 'Категории',
          tabBarIcon: ({ color, size }: TabIconProps) => (
            <Grid3X3 color={iconColor(color)} size={size} strokeWidth={2.2} />
          ),
        }}
      />
      <Tabs.Screen
        name="favorites"
        options={{
          title: 'Избранное',
          tabBarIcon: ({ color, size }: TabIconProps) => (
            <Heart color={iconColor(color)} size={size} strokeWidth={2.2} />
          ),
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: 'Корзина',
          tabBarIcon: ({ color, size }: TabIconProps) => (
            <ShoppingBag color={iconColor(color)} size={size} strokeWidth={2.2} />
          ),
        }}
      />
    </Tabs>
  );
}
