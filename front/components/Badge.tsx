import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'accent' | 'success' | 'warning' | 'error';
  size?: 'small' | 'medium' | 'large';
  rounded?: boolean;
  animated?: boolean;
}

export function Badge({ 
  children, 
  variant = 'primary', 
  size = 'medium',
  rounded = false,
  animated = true
}: BadgeProps) {
  const { colors } = useTheme();
  
  // Animations
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const bounceAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (animated) {
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(bounceAnim, {
            toValue: 1.1,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.timing(bounceAnim, {
            toValue: 1,
            duration: 100,
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    } else {
      scaleAnim.setValue(1);
    }
  }, [children]);

  const variantColors = {
    primary: {
      background: colors.primary,
      text: colors.background,
    },
    secondary: {
      background: colors.secondary,
      text: colors.background,
    },
    accent: {
      background: colors.accent,
      text: colors.primary,
    },
    success: {
      background: colors.success,
      text: colors.background,
    },
    warning: {
      background: colors.warning,
      text: colors.background,
    },
    error: {
      background: colors.error,
      text: colors.background,
    },
  };

  const sizeMap = {
    small: { padding: 6, fontSize: 11, borderRadius: 8, minWidth: 20 },
    medium: { padding: 8, fontSize: 13, borderRadius: 10, minWidth: 24 },
    large: { padding: 10, fontSize: 15, borderRadius: 12, minWidth: 28 },
  };

  const currentSize = sizeMap[size];
  const currentColors = variantColors[variant];

  return (
    <Animated.View style={[
      styles.container, {
        backgroundColor: currentColors.background,
        paddingHorizontal: currentSize.padding,
        paddingVertical: currentSize.padding * 0.6,
        borderRadius: rounded ? 20 : currentSize.borderRadius,
        minWidth: currentSize.minWidth,
        shadowColor: colors.shadow,
        shadowOffset: {
          width: 0,
          height: 1,
        },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
        opacity: scaleAnim,
        transform: [
          { scale: scaleAnim },
          { scale: bounceAnim }
        ],
      }
    ]}>
      <Text style={[styles.text, {
        color: currentColors.text,
        fontSize: currentSize.fontSize,
        fontWeight: '700',
      }]}>
        {children}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    textAlign: 'center',
    letterSpacing: -0.2,
  },
}); 