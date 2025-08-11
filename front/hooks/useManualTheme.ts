import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from './useColorScheme';

export function useManualTheme() {
  const systemColorScheme = useColorScheme();
  const [isManualMode, setIsManualMode] = useState(false);
  const [manualDarkMode, setManualDarkMode] = useState(false);

  // Charger les préférences au démarrage
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const manualMode = await AsyncStorage.getItem('manualMode');
        const darkMode = await AsyncStorage.getItem('darkMode');
        
        if (manualMode === 'true') {
          setIsManualMode(true);
          setManualDarkMode(darkMode === 'true');
        } else {
          setIsManualMode(false);
          setManualDarkMode(systemColorScheme === 'dark');
        }
      } catch (error) {
        console.log('Erreur lors du chargement des préférences de thème:', error);
      }
    };
    
    loadPreferences();
  }, [systemColorScheme]);

  // Sauvegarder les préférences
  const savePreferences = async (manual: boolean, dark: boolean) => {
    try {
      await AsyncStorage.setItem('manualMode', manual.toString());
      await AsyncStorage.setItem('darkMode', dark.toString());
    } catch (error) {
      console.log('Erreur lors de la sauvegarde des préférences de thème:', error);
    }
  };

  // Changer le mode manuel
  const toggleManualMode = async () => {
    const newManualMode = !isManualMode;
    setIsManualMode(newManualMode);
    await savePreferences(newManualMode, manualDarkMode);
  };

  // Changer le mode sombre/clair
  const toggleDarkMode = async () => {
    const newDarkMode = !manualDarkMode;
    setManualDarkMode(newDarkMode);
    await savePreferences(isManualMode, newDarkMode);
  };

  // Obtenir le thème actuel
  const getCurrentTheme = () => {
    if (isManualMode) {
      return manualDarkMode ? 'dark' : 'light';
    }
    return systemColorScheme;
  };

  return {
    isManualMode,
    manualDarkMode,
    currentTheme: getCurrentTheme(),
    toggleManualMode,
    toggleDarkMode,
    systemColorScheme,
  };
} 