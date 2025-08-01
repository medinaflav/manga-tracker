import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

interface LogoProps {
  size?: 'small' | 'medium' | 'large';
  showText?: boolean;
  variant?: 'default' | 'minimal';
}

export function Logo({ 
  size = 'medium', 
  showText = true, 
  variant = 'default' 
}: LogoProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const sizeMap = {
    small: { icon: 24, text: 14, container: 32 },
    medium: { icon: 32, text: 18, container: 40 },
    large: { icon: 48, text: 24, container: 60 },
  };

  const currentSize = sizeMap[size];

  if (variant === 'minimal') {
    return (
      <View style={[styles.minimalContainer, { width: currentSize.container, height: currentSize.container }]}>
        <View style={[styles.minimalIcon, { 
          backgroundColor: colors.primary,
          width: currentSize.icon,
          height: currentSize.icon,
        }]}>
          <Text style={[styles.minimalText, { 
            color: colors.background,
            fontSize: currentSize.text * 0.6,
          }]}>M</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.iconContainer, { 
        backgroundColor: colors.primary,
        width: currentSize.container,
        height: currentSize.container,
      }]}>
        <Text style={[styles.iconText, { 
          color: colors.background,
          fontSize: currentSize.text,
        }]}>📚</Text>
      </View>
      {showText && (
        <View style={styles.textContainer}>
          <Text style={[styles.brandName, { 
            color: colors.text,
            fontSize: currentSize.text,
          }]}>Manga</Text>
          <Text style={[styles.brandTagline, { 
            color: colors.primary,
            fontSize: currentSize.text * 0.7,
          }]}>Tracker</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  iconText: {
    fontWeight: '600',
  },
  textContainer: {
    flexDirection: 'column',
  },
  brandName: {
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  brandTagline: {
    fontWeight: '600',
    marginTop: -2,
  },
  minimalContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  minimalIcon: {
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  minimalText: {
    fontWeight: '800',
  },
}); 