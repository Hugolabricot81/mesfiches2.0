import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  Alert,
  SafeAreaView,
} from 'react-native';
import { FolderPlus, Folder, FileText, Image as ImageIcon, MoveVertical as MoreVertical } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';

interface Folder {
  id: string;
  name: string;
  createdAt: number;
  fileCount: number;
}

interface RevisionFile {
  id: string;
  name: string;
  type: 'image' | 'pdf';
  uri: string;
  folderId: string;
  createdAt: number;
}

export default function FoldersScreen() {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [files, setFiles] = useState<RevisionFile[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const foldersData = await AsyncStorage.getItem('folders');
      const filesData = await AsyncStorage.getItem('files');
      
      if (foldersData) {
        const parsedFolders = JSON.parse(foldersData);
        setFolders(parsedFolders);
      }
      
      if (filesData) {
        const parsedFiles = JSON.parse(filesData);
        setFiles(parsedFiles);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
    } finally {
      setLoading(false);
    }
  };

  const createFolder = async () => {
    if (!newFolderName.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer un nom pour le dossier');
      return;
    }

    const newFolder: Folder = {
      id: Date.now().toString(),
      name: newFolderName.trim(),
      createdAt: Date.now(),
      fileCount: 0,
    };

    const updatedFolders = [...folders, newFolder];
    setFolders(updatedFolders);
    
    try {
      await AsyncStorage.setItem('folders', JSON.stringify(updatedFolders));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
    }

    setNewFolderName('');
    setShowCreateModal(false);
  };

  const getFolderFileCount = (folderId: string) => {
    return files.filter(file => file.folderId === folderId).length;
  };

  const openFolder = (folder: Folder) => {
    router.push(`/folder/${folder.id}?name=${encodeURIComponent(folder.name)}`);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Mes Fiches de Révisions</Text>
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => setShowCreateModal(true)}
        >
          <FolderPlus size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {folders.length === 0 ? (
          <View style={styles.emptyState}>
            <Folder size={64} color="#9CA3AF" />
            <Text style={styles.emptyTitle}>Aucun dossier</Text>
            <Text style={styles.emptyDescription}>
              Créez votre premier dossier pour organiser vos fiches de révisions
            </Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => setShowCreateModal(true)}
            >
              <Text style={styles.emptyButtonText}>Créer un dossier</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.foldersGrid}>
            {folders.map((folder) => (
              <TouchableOpacity
                key={folder.id}
                style={styles.folderCard}
                onPress={() => openFolder(folder)}
              >
                <View style={styles.folderHeader}>
                  <Folder size={32} color="#3B82F6" />
                  <TouchableOpacity style={styles.folderMenu}>
                    <MoreVertical size={16} color="#6B7280" />
                  </TouchableOpacity>
                </View>
                <Text style={styles.folderName} numberOfLines={2}>
                  {folder.name}
                </Text>
                <View style={styles.folderStats}>
                  <Text style={styles.fileCount}>
                    {getFolderFileCount(folder.id)} fichier{getFolderFileCount(folder.id) !== 1 ? 's' : ''}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      <Modal
        visible={showCreateModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Nouveau dossier</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Nom du dossier"
              value={newFolderName}
              onChangeText={setNewFolderName}
              autoFocus
              maxLength={50}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => {
                  setShowCreateModal(false);
                  setNewFolderName('');
                }}
              >
                <Text style={styles.modalCancelText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalCreateButton}
                onPress={createFolder}
              >
                <Text style={styles.modalCreateText}>Créer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  createButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    padding: 12,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 80,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
  },
  emptyDescription: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
    marginHorizontal: 32,
    lineHeight: 20,
  },
  emptyButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
    marginTop: 24,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  foldersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  folderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    width: '48%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  folderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  folderMenu: {
    padding: 4,
  },
  folderName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
    minHeight: 40,
  },
  folderStats: {
    marginTop: 'auto',
  },
  fileCount: {
    fontSize: 12,
    color: '#6B7280',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '80%',
    maxWidth: 300,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalCancelButton: {
    flex: 1,
    padding: 12,
    marginRight: 8,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
  },
  modalCancelText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  modalCreateButton: {
    flex: 1,
    padding: 12,
    marginLeft: 8,
    borderRadius: 12,
    backgroundColor: '#3B82F6',
  },
  modalCreateText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});