# 🎛️ Guide d'utilisation du Sélecteur de Mode

## 📍 Où trouver le sélecteur

Le sélecteur de mode se trouve dans la page **"Compte"** de l'application :

1. Ouvrez l'application
2. Allez dans l'onglet **"Compte"** (icône personne)
3. Faites défiler jusqu'à la section **"Paramètres"**

## 🎯 Comment utiliser le sélecteur

### **Mode Manuel** (Premier interrupteur)
- **OFF** : L'application suit automatiquement les préférences de votre appareil
- **ON** : Vous pouvez choisir manuellement le mode clair/sombre

### **Mode Sombre** (Deuxième interrupteur)
- **OFF** : Mode clair (fond blanc, texte sombre)
- **ON** : Mode sombre (fond noir, texte blanc)
- **Note** : N'est actif que si le "Mode Manuel" est activé

## 🔄 Comportements

### **Mode Manuel DÉSACTIVÉ**
- L'application suit automatiquement les paramètres de votre appareil
- **iOS** : Réglages → Affichage et luminosité → Mode sombre
- **Android** : Paramètres → Affichage → Mode sombre
- Le deuxième interrupteur est désactivé

### **Mode Manuel ACTIVÉ**
- Vous contrôlez manuellement le mode
- Le deuxième interrupteur devient actif
- Vos préférences sont sauvegardées et persistent entre les sessions

## 💾 Sauvegarde automatique

Vos préférences sont automatiquement sauvegardées :
- ✅ **Mode Manuel** : Sauvegardé localement
- ✅ **Mode Sombre** : Sauvegardé localement
- ✅ **Persistance** : Vos choix sont conservés même après fermeture de l'app

## 🎨 Effets visuels

### **Mode Light (Clair)**
- Fond : Blanc (`#FFFFFF`)
- Texte : Noir profond (`#1A1A1A`)
- Idéal pour : Lecture en journée

### **Mode Dark (Sombre)**
- Fond : Noir profond (`#171717`)
- Texte : Blanc (`#FFFFFF`)
- Idéal pour : Lecture nocturne, économie de batterie

## 🔧 Dépannage

### **Le mode ne change pas**
1. Vérifiez que le "Mode Manuel" est activé
2. Redémarrez l'application
3. Vérifiez les paramètres système de votre appareil

### **Les préférences ne se sauvegardent pas**
1. Vérifiez que l'application a les permissions de stockage
2. Redémarrez l'application
3. Vérifiez l'espace de stockage disponible

### **L'interface semble cassée**
1. Redémarrez l'application
2. Vérifiez que vous avez la dernière version
3. Contactez le support si le problème persiste

## 📱 Compatibilité

- ✅ **iOS** : Compatible avec toutes les versions récentes
- ✅ **Android** : Compatible avec Android 6.0+
- ✅ **Expo** : Compatible avec les versions récentes
- ✅ **React Native** : Compatible avec les versions récentes

## 🎯 Conseils d'utilisation

### **Pour la lecture en journée**
- Utilisez le **Mode Light** ou laissez l'app suivre les préférences système

### **Pour la lecture nocturne**
- Activez le **Mode Manuel** puis le **Mode Sombre**
- Économise la batterie sur les écrans OLED

### **Pour l'accessibilité**
- Le **Mode Light** offre un meilleur contraste pour certains utilisateurs
- Le **Mode Dark** réduit la fatigue oculaire

---

*Guide créé le : ${new Date().toLocaleDateString('fr-FR')}* 