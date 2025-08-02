import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { Upload, Image as ImageIcon, FileText, Camera } from 'lucide-react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface RevisionFile {
  id: string;
  name: string;
  type: 'image' | 'pdf';
  uri: string;
  folderId: string;
  createdAt: number;
}

interface Folder {
  id: string;
  name: string;
  createdAt: number;
  fileCount: number;
}

export default function ImportScreen() {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [importing, setImporting] = useState(false);

  React.useEffect(() => {
    loadFolders();
  }, []);

  const loadFolders = async () => {
    try {
      const foldersData = await AsyncStorage.getItem('folders');
      if (foldersData) {
        setFolders(JSON.parse(foldersData));
      }
    } catch (error) {
      console.error('Erreur lors du chargement des dossiers:', error);
    }
  };

  const selectFolder = (): Promise<string | null> => {
    return new Promise((resolve) => {
      if (folders.length === 0) {
        Alert.alert(
          'Aucun dossier',
          'Créez d\'abord un dossier dans l\'onglet "Mes Dossiers"',
          [{ text: 'OK', onPress: () => resolve(null) }]
        );
        return;
      }

      // Créer les options avec limitation pour éviter le problème d'affichage
      const folderOptions = folders.map(folder => ({
        text: folder.name.length > 30 ? folder.name.substring(0, 30) + '...' : folder.name,
        onPress: () => resolve(folder.id),
      }));

      // Ajouter l'option Annuler
      folderOptions.push({
        text: 'Annuler',
        style: 'cancel',
        onPress: () => resolve(null),
      });

      // Utiliser Alert avec un style qui affiche mieux tous les dossiers
      Alert.alert(
        'Choisir un dossier', 
        'Dans quel dossier voulez-vous enregistrer cette fiche ?', 
        folderOptions,
        { 
          cancelable: true,
          onDismiss: () => resolve(null)
        }
      );
    });
  };

  const saveFile = async (file: Omit<RevisionFile, 'id' | 'createdAt'>) => {
    try {
      const filesData = await AsyncStorage.getItem('files');
      const files = filesData ? JSON.parse(filesData) : [];
      
      const newFile: RevisionFile = {
        ...file,
        id: Date.now().toString(),
        createdAt: Date.now(),
      };

      files.push(newFile);
      await AsyncStorage.setItem('files', JSON.stringify(files));
      
      Alert.alert('Succès', 'Votre fiche a été importée avec succès !');
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      Alert.alert('Erreur', 'Une erreur est survenue lors de l\'importation.');
    }
  };

  const importFromGallery = async () => {
    if (importing) return;
    setImporting(true);

    try {
      const folderId = await selectFolder();
      if (!folderId) {
        setImporting(false);
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const fileName = asset.fileName || `Image_${Date.now()}.jpg`;
        
        await saveFile({
          name: fileName,
          type: 'image',
          uri: asset.uri,
          folderId,
        });
      }
    } catch (error) {
      console.error('Erreur lors de l\'import depuis la galerie:', error);
      Alert.alert('Erreur', 'Une erreur est survenue lors de l\'import.');
    } finally {
      setImporting(false);
    }
  };

  const takePhoto = async () => {
    if (importing) return;
    setImporting(true);

    try {
      const folderId = await selectFolder();
      if (!folderId) {
        setImporting(false);
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const fileName = `Photo_${Date.now()}.jpg`;
        
        await saveFile({
          name: fileName,
          type: 'image',
          uri: asset.uri,
          folderId,
        });
      }
    } catch (error) {
      console.error('Erreur lors de la prise de photo:', error);
      Alert.alert('Erreur', 'Une erreur est survenue lors de la prise de photo.');
    } finally {
      setImporting(false);
    }
  };

  const importDocument = async () => {
    if (importing) return;
    setImporting(true);

    try {
      const folderId = await selectFolder();
      if (!folderId) {
        setImporting(false);
        return;
      }

      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/jpeg', 'image/png'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const fileType = asset.mimeType?.includes('pdf') ? 'pdf' : 'image';
        
        await saveFile({
          name: asset.name,
          type: fileType,
          uri: asset.uri,
          folderId,
        });
      }
    } catch (error) {
      console.error('Erreur lors de l\'import de document:', error);
      Alert.alert('Erreur', 'Une erreur est survenue lors de l\'import.');
    } finally {
      setImporting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Importer des Fiches</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.importOptions}>
          <TouchableOpacity
            style={[styles.importCard, importing && styles.disabled]}
            onPress={takePhoto}
            disabled={importing}
          >
            <View style={styles.iconContainer}>
              <Camera size={32} color="#3B82F6" />
            </View>
            <Text style={styles.cardTitle}>Prendre une photo</Text>
            <Text style={styles.cardDescription}>
              Photographiez directement vos fiches de révisions
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.importCard, importing && styles.disabled]}
            onPress={importFromGallery}
            disabled={importing}
          >
            <View style={styles.iconContainer}>
              <ImageIcon size={32} color="#10B981" />
            </View>
            <Text style={styles.cardTitle}>Depuis la galerie</Text>
            <Text style={styles.cardDescription}>
              Importez des images depuis votre galerie photo
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.importCard, importing && styles.disabled]}
            onPress={importDocument}
            disabled={importing}
          >
            <View style={styles.iconContainer}>
              <FileText size={32} color="#F59E0B" />
            </View>
            <Text style={styles.cardTitle}>Fichiers PDF</Text>
            <Text style={styles.cardDescription}>
              Importez des documents PDF depuis votre appareil
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.infoSection}>
          <View style={styles.infoCard}>
            <Upload size={24} color="#6B7280" />
            <Text style={styles.infoTitle}>Formats supportés</Text>
            <Text style={styles.infoText}>
              • Images JPEG et PNG{'\n'}
              • Documents PDF{'\n'}
              • Qualité optimale conservée
            </Text>
          </View>
        </View>

        {importing && (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Import en cours...</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  importOptions: {
    marginBottom: 32,
  },
  importCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  disabled: {
    opacity: 0.6,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  infoSection: {
    marginTop: 20,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginTop: 12,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
});