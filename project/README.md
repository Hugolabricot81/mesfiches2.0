# Application Fiches de Révisions

## 📱 Générer l'APK avec EAS Build

### Étape 1 : Installation des outils
```bash
# Installer EAS CLI globalement
npm install -g @expo/eas-cli
```

### Étape 2 : Créer un compte Expo
1. Allez sur [expo.dev](https://expo.dev)
2. Créez un compte gratuit
3. Confirmez votre email

### Étape 3 : Se connecter à EAS
```bash
# Dans le terminal, dans le dossier du projet
eas login
```
Entrez vos identifiants Expo.

### Étape 4 : Configurer le build
```bash
# Configurer EAS pour ce projet
eas build:configure
```
Choisissez "Yes" pour toutes les questions.

### Étape 5 : Générer l'APK
```bash
# Générer l'APK de test
eas build --platform android --profile preview
```

⏱️ **Le build prend environ 5-10 minutes**

### Étape 6 : Télécharger l'APK
1. Une fois terminé, vous recevrez un lien
2. Téléchargez l'APK sur votre téléphone
3. Activez "Sources inconnues" dans les paramètres Android
4. Installez l'APK

## 🔧 Commandes utiles

```bash
# Voir l'état des builds
eas build:list

# Build de production (pour Google Play Store)
eas build --platform android --profile production

# Mettre à jour l'app
# 1. Modifiez le versionCode dans app.json
# 2. Relancez le build
eas build --platform android --profile preview
```

## 📱 Installation sur Android

1. **Téléchargez l'APK** depuis le lien EAS
2. **Paramètres** → **Sécurité** → **Sources inconnues** → **Activer**
3. **Ouvrez l'APK** téléchargé
4. **Installez** l'application
5. **Lancez** "Fiches de Révisions"

## ✨ Fonctionnalités

- ✅ Import d'images JPEG et PDF
- ✅ Création de dossiers personnalisés
- ✅ Renommage des fiches
- ✅ Recherche et filtrage
- ✅ Fonctionnement 100% hors ligne
- ✅ Stockage local sécurisé

## 🚀 Prochaines étapes

Une fois l'APK installé :
1. Créez votre premier dossier
2. Importez vos fiches via l'onglet "Importer"
3. Organisez vos révisions !

## 🆘 Dépannage

**Erreur "Sources inconnues"** :
- Android 8+ : Paramètres → Apps → Navigateur → Installer des apps inconnues

**Build échoue** :
- Vérifiez votre connexion internet
- Relancez : `eas build --platform android --profile preview`

**APK ne s'installe pas** :
- Vérifiez l'espace de stockage disponible
- Redémarrez votre téléphone