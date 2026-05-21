// Selector de avatar: muestra foto o iniciales; abre galería al tocar

import React, { useCallback } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { getInitials, getColorForName } from '../utils/avatar';
import { COLORS } from '../config/theme';

/**
 * @param {{ name: string, avatarUri: string|null, onAvatarChange: (uri: string) => void }} props
 */
export default function AvatarPicker({ name, avatarUri, onAvatarChange }) {
  const initials = getInitials(name);
  const accentColor = getColorForName(name);

  const pickImage = useCallback(async () => {
    if (Platform.OS === 'web') {
      // En web usamos input type=file
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
          onAvatarChange?.(ev.target.result);
        };
        reader.readAsDataURL(file);
      };
      input.click();
      return;
    }

    // Nativo: pedir permiso y abrir galería
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled && result.assets?.[0]?.uri) {
      onAvatarChange?.(result.assets[0].uri);
    }
  }, [onAvatarChange]);

  return (
    <TouchableOpacity
      onPress={pickImage}
      style={[styles.container, { borderColor: accentColor }]}
      activeOpacity={0.8}
    >
      {avatarUri ? (
        <Image source={{ uri: avatarUri }} style={styles.image} />
      ) : (
        <Text style={[styles.initials, { color: accentColor }]}>{initials}</Text>
      )}
      {/* Ícono de cámara en esquina inferior derecha */}
      <View style={[styles.editBadge, { backgroundColor: accentColor }]}>
        <Text style={styles.editIcon}>📷</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(26, 16, 21, 0.9)',
    borderWidth: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
    position: 'relative',
  },
  image: {
    width: 76,
    height: 76,
    borderRadius: 38,
  },
  initials: {
    fontFamily: 'Fraunces_700Bold',
    fontSize: 28,
  },
  editBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.bg,
  },
  editIcon: {
    fontSize: 12,
  },
});
