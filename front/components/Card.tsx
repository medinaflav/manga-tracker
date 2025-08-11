import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';

interface CardProps {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'outlined';
  padding?: 'none' | 'small' | 'medium' | 'large';
  style?: ViewStyle;
}

export function Card({ 
  children, 
  variant = 'default',
  padding = 'small',
  style 
}: CardProps) {
  const { colors } = useTheme();

  const paddingMap = {
    none: 0,
    small: 12,
    medium: 16,
    large: 24,
  };

  const variantStyles = {
    // default: {
    //   backgroundColor: colors.card,
    //   borderWidth: 0,
    //   borderColor: 'transparent',
    //   shadowColor: colors.shadow,
    //   shadowOffset: { width: 0, height: 1 },
    //   shadowOpacity: 0.05,
    //   shadowRadius: 2,
    //   elevation: 1,
    // },
    // elevated: {
    //   backgroundColor: colors.card,
    //   borderWidth: 0,
    //   borderColor: 'transparent',
    //   shadowColor: colors.shadow,
    //   shadowOffset: { width: 0, height: 4 },
    //   shadowOpacity: 0.1,
    //   shadowRadius: 8,
    //   elevation: 4,
    // },
    default: {
      backgroundColor: colors.card,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    }
  };

  return (
    <View style={[
      styles.container,
      variantStyles['default'],
      // variantStyles[variant],
      {
        padding: paddingMap[padding],
      },
      style
    ]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
}); 