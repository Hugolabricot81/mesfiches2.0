import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
  TextInput,
  SafeAreaView,
  Image,
  Dimensions,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, CreditCard as Edit3, Trash2, FileText, Image as ImageIcon, MoveVertical as MoreVertical, X, ZoomIn } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WebView } from 'react-native-webview';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface RevisionFile {
  id: string;
  name: string;
  type: 'image' | 'pdf';
  uri: string;
  folderId: string;
  createdAt: number;
}

export default function FolderScreen() {
  const { id, name } = useLocalSearchParams<{ id: string; name: string }>();
  const [files, setFiles] = useState<RevisionFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingFile, setEditingFile] = useState<RevisionFile | null>(null);
  const [newFileName, setNewFileName] = useState('');
  const [viewingFile, setViewingFile] = useState<RevisionFile | null>(null);

  useEffect(() => {
    loadFiles();
  }, [id]);

  const loadFiles = async () => {
    try {
      const filesData = await AsyncStorage.getItem('files');
      if (filesData) {
        const allFiles = JSON.parse(filesData);
        const folderFiles = allFiles.filter((file: RevisionFile) => file.folderId === id);
        setFiles(folderFiles.sort((a: RevisionFile, b: RevisionFile) => b.createdAt - a.createdAt));
      }
    } catch (error) {
      console.error('Erreur lors du chargement des fichiers:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteFile = async (fileId: string) => {
    Alert.alert(
      'Supprimer la fiche',
      'Êtes-vous sûr de vouloir supprimer cette fiche ? Cette action est irréversible.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              const filesData = await AsyncStorage.getItem('files');
              if (filesData) {
                const allFiles = JSON.parse(filesData);
                const updatedFiles = allFiles.filter((file: RevisionFile) => file.id !== fileId);
                await AsyncStorage.setItem('files', JSON.stringify(updatedFiles));
                setFiles(files.filter(file => file.id !== fileId));
              }
            } catch (error) {
              console.error('Erreur lors de la suppression:', error);
              Alert.alert('Erreur', 'Une erreur est survenue lors de la suppression.');
            }
          },
        },
      ]
    );
  };

  const renameFile = async () => {
    if (!editingFile || !newFileName.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer un nom valide');
      return;
    }

    try {
      const filesData = await AsyncStorage.getItem('files');
      if (filesData) {
        const allFiles = JSON.parse(filesData);
        const updatedFiles = allFiles.map((file: RevisionFile) => 
          file.id === editingFile.id 
            ? { ...file, name: newFileName.trim() }
            : file
        );
        
        await AsyncStorage.setItem('files', JSON.stringify(updatedFiles));
        
        setFiles(files.map(file => 
          file.id === editingFile.id 
            ? { ...file, name: newFileName.trim() }
            : file
        ));
      }
    } catch (error) {
      console.error('Erreur lors du renommage:', error);
      Alert.alert('Erreur', 'Une erreur est survenue lors du renommage.');
    }

    setEditingFile(null);
    setNewFileName('');
  };

  const openEditModal = (file: RevisionFile) => {
    setEditingFile(file);
    setNewFileName(file.name);
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const getFileIcon = (type: string) => {
    return type === 'pdf' ? (
      <FileText size={24} color="#F59E0B" />
    ) : (
      <ImageIcon size={24} color="#10B981" />
    );
  };

  const showFileOptions = (file: RevisionFile) => {
    Alert.alert(
      file.name,
      'Que voulez-vous faire avec cette fiche ?',
      [
        {
          text: 'Renommer',
          onPress: () => openEditModal(file),
        },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => deleteFile(file.id),
        },
        {
          text: 'Annuler',
          style: 'cancel',
        },
      ]
    );
  };

  const openFileViewer = (file: RevisionFile) => {
    setViewingFile(file);
  };

  const closeFileViewer = () => {
    setViewingFile(null);
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
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={1}>
          {decodeURIComponent(name || 'Dossier')}
        </Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {files.length === 0 ? (
          <View style={styles.emptyState}>
            <FileText size={64} color="#9CA3AF" />
            <Text style={styles.emptyTitle}>Aucune fiche</Text>
            <Text style={styles.emptyDescription}>
              Ce dossier est vide. Utilisez l'onglet "Importer" pour ajouter vos premières fiches.
            </Text>
          </View>
        ) : (
          <View style={styles.filesList}>
            <Text style={styles.filesCount}>
              {files.length} fiche{files.length > 1 ? 's' : ''}
            </Text>
            
            {files.map((file) => (
              <TouchableOpacity
                key={file.id}
                style={styles.fileCard}
                onPress={() => openFileViewer(file)}
                onLongPress={() => showFileOptions(file)}
              >
                <View style={styles.fileIcon}>
                  {getFileIcon(file.type)}
                </View>
                
                <View style={styles.fileInfo}>
                  <Text style={styles.fileName} numberOfLines={2}>
                    {file.name}
                  </Text>
                  <Text style={styles.fileDate}>
                    Ajouté le {formatDate(file.createdAt)}
                  </Text>
                  <Text style={styles.fileType}>
                    {file.type === 'pdf' ? 'Document PDF' : 'Image'}
                  </Text>
                </View>

                <View style={styles.fileActions}>
                  {file.type === 'image' && (
                    <View style={styles.thumbnailContainer}>
                      <Image source={{ uri: file.uri }} style={styles.thumbnail} />
                      <View style={styles.zoomIcon}>
                        <ZoomIn size={16} color="#FFFFFF" />
                      </View>
                    </View>
                  )}
                  <TouchableOpacity
                    style={styles.menuButton}
                    onPress={() => showFileOptions(file)}
                  >
                    <MoreVertical size={20} color="#6B7280" />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Modal de visualisation des fichiers */}
      <Modal
        visible={viewingFile !== null}
        transparent={false}
        animationType="fade"
        onRequestClose={closeFileViewer}
      >
        {viewingFile && (
          <SafeAreaView style={styles.viewerContainer}>
            <View style={styles.viewerHeader}>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={closeFileViewer}
              >
                <X size={24} color="#FFFFFF" />
              </TouchableOpacity>
              <Text style={styles.viewerTitle} numberOfLines={1}>
                {viewingFile.name}
              </Text>
              <View style={styles.viewerPlaceholder} />
            </View>
            
            <View style={styles.viewerContent}>
              {viewingFile.type === 'image' ? (
                <ScrollView
                  style={styles.imageScrollView}
                  contentContainerStyle={styles.imageScrollContent}
                  maximumZoomScale={3}
                  minimumZoomScale={1}
                  showsHorizontalScrollIndicator={false}
                  showsVerticalScrollIndicator={false}
                >
                  <Image
                    source={{ uri: viewingFile.uri }}
                    style={styles.fullImage}
                    resizeMode="contain"
                  />
                </ScrollView>
              ) : (
                <WebView
                  source={{ uri: viewingFile.uri }}
                  style={styles.pdfViewer}
                  startInLoadingState={true}
                  renderLoading={() => (
                    <View style={styles.loadingPdf}>
                      <Text style={styles.loadingPdfText}>Chargement du PDF...</Text>
                    </View>
                  )}
                />
              )}
            </View>
          </SafeAreaView>
        )}
      </Modal>

      <Modal
        visible={editingFile !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setEditingFile(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Renommer la fiche</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Nom de la fiche"
              value={newFileName}
              onChangeText={setNewFileName}
              autoFocus
              maxLength={100}
              multiline
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => {
                  setEditingFile(null);
                  setNewFileName('');
                }}
              >
                <Text style={styles.modalCancelText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSaveButton}
                onPress={renameFile}
              >
                <Text style={styles.modalSaveText}>Enregistrer</Text>
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
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  title: {
    flex: 1,
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
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
  filesList: {
    flex: 1,
  },
  filesCount: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
    fontWeight: '500',
  },
  fileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
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
  fileIcon: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  fileInfo: {
    flex: 1,
    marginRight: 12,
  },
  fileName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  fileDate: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  fileType: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  fileActions: {
    alignItems: 'center',
  },
  thumbnailContainer: {
    position: 'relative',
    marginBottom: 8,
  },
  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  zoomIcon: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 12,
    padding: 4,
  },
  menuButton: {
    padding: 8,
  },
  viewerContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  viewerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
  },
  closeButton: {
    padding: 8,
    marginRight: 16,
  },
  viewerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  viewerPlaceholder: {
    width: 40,
  },
  viewerContent: {
    flex: 1,
  },
  imageScrollView: {
    flex: 1,
  },
  imageScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullImage: {
    width: screenWidth,
    height: screenHeight - 100,
  },
  pdfViewer: {
    flex: 1,
  },
  loadingPdf: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingPdfText: {
    fontSize: 16,
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
    width: '85%',
    maxWidth: 400,
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
    maxHeight: 80,
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
  modalSaveButton: {
    flex: 1,
    padding: 12,
    marginLeft: 8,
    borderRadius: 12,
    backgroundColor: '#3B82F6',
  },
  modalSaveText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});