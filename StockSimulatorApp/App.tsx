import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons'; // Import icons

import MarketsScreen from './screens/MarketsScreen';
import PortfolioScreen from './screens/PortfolioScreen';
import SearchScreen from './screens/SearchScreen';
import StockDetailScreen from './screens/StockDetailScreen';

import { colors, typography } from './src/theme'; // Import theme

// Define Tab and Stack Navigators
const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Define param list for MarketsStack
export type MarketsStackParamList = {
  MarketsList: undefined; 
  StockDetail: { symbol: string; description: string };
};

// Create a Stack Navigator for the Markets Tab
function MarketsStackNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.primary, // Color of back button and title
        headerTitleStyle: { 
          fontFamily: typography.fontFamily,
          fontSize: typography.h3.fontSize, // Using h3 for header title size
          fontWeight: typography.h3.fontWeight as any, // Cast because fontWeight type is stricter
        },
      }}
    >
      <Stack.Screen 
        name="MarketsList" 
        component={MarketsScreen} 
        options={{ title: 'Markets' }} 
      />
      <Stack.Screen 
        name="StockDetail" 
        component={StockDetailScreen} 
        options={({ route }) => {
          const params = route.params as MarketsStackParamList['StockDetail'];
          return { 
            title: params?.symbol || 'Stock Details',
            headerBackTitle: 'Back', // Custom back button text for iOS
          };
        }}
      />
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName = 'help-outline'; // Default icon

            if (route.name === 'Markets') {
              iconName = focused ? 'show-chart' : 'show-chart';
            } else if (route.name === 'Portfolio') {
              iconName = focused ? 'account-balance-wallet' : 'account-balance-wallet-outline';
            } else if (route.name === 'Search') {
              iconName = focused ? 'search' : 'search';
            }
            // Use MaterialIcons for all icons
            return <MaterialIcons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textSecondary,
          tabBarStyle: { 
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
          },
          tabBarLabelStyle: {
            fontFamily: typography.fontFamily,
            fontSize: typography.caption.fontSize, // Using caption for tab label size
          },
          headerStyle: { backgroundColor: colors.surface }, // For tabs that show a header (Portfolio, Search)
          headerTintColor: colors.primary,
          headerTitleStyle: {
            fontFamily: typography.fontFamily,
            fontSize: typography.h2.fontSize, // Using h2 for main tab headers
            fontWeight: typography.h2.fontWeight as any,
          },
        })}
      >
        <Tab.Screen 
          name="Markets" 
          component={MarketsStackNavigator} 
          options={{ headerShown: false }} // Stack handles its own header
        />
        <Tab.Screen name="Portfolio" component={PortfolioScreen} options={{ title: 'My Portfolio' }} />
        <Tab.Screen name="Search" component={SearchScreen} options={{ title: 'Find Stocks' }} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
