import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import { useAppContext } from '../context/AppContext';
import { strings } from '../utils/i18n';
import TasksScreen    from '../screens/TasksScreen';
import ProfileScreen  from '../screens/ProfileScreen';
import TitlesScreen   from '../screens/TitlesScreen';
import SettingsScreen from '../screens/SettingsScreen';

const Tab = createBottomTabNavigator();

const TAB_CONFIG = [
  { name: 'Tasks',    component: TasksScreen,    key: 'tasks',    icon: 'list-outline',    iconActive: 'list' },
  { name: 'Profile',  component: ProfileScreen,  key: 'profile',  icon: 'person-outline',  iconActive: 'person' },
  { name: 'Titles',   component: TitlesScreen,   key: 'titles',   icon: 'trophy-outline',  iconActive: 'trophy' },
  { name: 'Settings', component: SettingsScreen, key: 'settings', icon: 'settings-outline',iconActive: 'settings' },
];

export default function AppNavigator() {
  const { language, theme } = useAppContext();
  const s = strings[language]?.tabs ?? strings.tr.tabs;
  const isDark = theme === 'dark';

  const colors = {
    background: isDark ? '#0d0d1a' : '#f5f5f5',
    card:       isDark ? '#16162a' : '#ffffff',
    border:     isDark ? '#2a2a4a' : '#e0e0e0',
    active:     '#7b61ff',
    inactive:   isDark ? '#555577' : '#999999',
    text:       isDark ? '#e0e0ff' : '#111122',
  };

  return (
    <NavigationContainer
      theme={{
        dark: isDark,
        colors: {
          primary:      colors.active,
          background:   colors.background,
          card:         colors.card,
          text:         colors.text,
          border:       colors.border,
          notification: colors.active,
        },
      }}
    >
      <Tab.Navigator
        screenOptions={({ route }) => {
          const tab = TAB_CONFIG.find((t) => t.name === route.name);
          return {
            headerShown: false,
            tabBarActiveTintColor:   colors.active,
            tabBarInactiveTintColor: colors.inactive,
            tabBarStyle: {
              backgroundColor: colors.card,
              borderTopColor:  colors.border,
              paddingBottom: 4,
              height: 60,
            },
            tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
            tabBarIcon: ({ focused, color, size }) => (
              <Ionicons name={focused ? tab.iconActive : tab.icon} size={size} color={color} />
            ),
          };
        }}
      >
        {TAB_CONFIG.map((tab) => (
          <Tab.Screen
            key={tab.name}
            name={tab.name}
            component={tab.component}
            options={{ tabBarLabel: s[tab.key] }}
          />
        ))}
      </Tab.Navigator>
    </NavigationContainer>
  );
}
