import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Image,
  Modal,
  Dimensions,
} from 'react-native';
import { Search, Filter, FileText, Image as ImageIcon, ZoomIn, X } from 'lucide-react-native';
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

interface Folder {
  id: string;
  name: string;
  createdAt: number;
  fileCount: number;
}

export default function SearchScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [files, setFiles] = useState<RevisionFile[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [filteredFiles, setFilteredFiles] = useState<RevisionFile[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'image' | 'pdf'>('all');
  const [viewingFile, setViewingFile] = useState<RevisionFile | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterFiles();
  }, [searchQuery, files, selectedFilter]);

  const loadData = async () => {
    try {
      const filesData = await AsyncStorage.getItem('files');
      const foldersData = await AsyncStorage.getItem('folders');
      
      if (filesData) {
        setFiles(JSON.parse(filesData));
      }
      
      if (foldersData) {
        setFolders(JSON.parse(foldersData));
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
    }
  };

  const filterFiles = () => {
    let filtered = files;

    // Filtrer par type si nécessaire
    if (selectedFilter !== 'all') {
      filtered = filtered.filter(file => file.type === selectedFilter);
    }

    // Filtrer par recherche textuelle
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(file => 
        file.name.toLowerCase().includes(query) ||
        getFolderName(file.folderId).toLowerCase().includes(query)
      );
    }

    // Trier par date de création (le plus récent en premier)
    filtered.sort((a, b) => b.createdAt - a.createdAt);

    setFilteredFiles(filtered);
  };

  const getFolderName = (folderId: string) => {
    const folder = folders.find(f => f.id === folderId);
    return folder ? folder.name : 'Dossier inconnu';
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

  const openFileViewer = (file: RevisionFile) => {
    setViewingFile(file);
  };

  const closeFileViewer = () => {
    setViewingFile(null);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Rechercher</Text>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Search size={20} color="#6B7280" />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher dans vos fiches..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <View style={styles.filterContainer}>
          {[
            { key: 'all', label: 'Tout' },
            { key: 'image', label: 'Images' },
            { key: 'pdf', label: 'PDF' },
          ].map((filter) => (
            <TouchableOpacity
              key={filter.key}
              style={[
                styles.filterButton,
                selectedFilter === filter.key && styles.filterButtonActive,
              ]}
              onPress={() => setSelectedFilter(filter.key as 'all' | 'image' | 'pdf')}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  selectedFilter === filter.key && styles.filterButtonTextActive,
                ]}
              >
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {filteredFiles.length === 0 ? (
          <View style={styles.emptyState}>
            <Search size={64} color="#9CA3AF" />
            <Text style={styles.emptyTitle}>
              {searchQuery.trim() ? 'Aucun résultat' : 'Aucune fiche'}
            </Text>
            <Text style={styles.emptyDescription}>
              {searchQuery.trim() 
                ? 'Essayez avec d\'autres mots-clés'
                : 'Importez vos premières fiches pour commencer'
              }
            </Text>
          </View>
        ) : (
          <View style={styles.resultsList}>
            <Text style={styles.resultsCount}>
              {filteredFiles.length} résultat{filteredFiles.length > 1 ? 's' : ''}
            </Text>
            
            {filteredFiles.map((file) => (
              <TouchableOpacity 
                key={file.id} 
                style={styles.fileCard}
                onPress={() => openFileViewer(file)}
              >
                <View style={styles.fileIcon}>
                  {getFileIcon(file.type)}
                </View>
                
                <View style={styles.fileInfo}>
                  <Text style={styles.fileName} numberOfLines={2}>
                    {file.name}
                  </Text>
                  <Text style={styles.fileFolder}>
                    {getFolderName(file.folderId)}
                  </Text>
                  <Text style={styles.fileDate}>
                    {formatDate(file.createdAt)}
                  </Text>
                </View>
                
                {file.type === 'image' && (
                  <View style={styles.thumbnailContainer}>
                    <Image source={{ uri: file.uri }} style={styles.thumbnail} />
                    <View style={styles.zoomIcon}>
                      <ZoomIn size={12} color="#FFFFFF" />
                    </View>
                  </View>
                )}
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
  searchContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#111827',
  },
  filterContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  filterButtonActive: {
    backgroundColor: '#3B82F6',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    padding: 20,
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
  resultsList: {
    flex: 1,
  },
  resultsCount: {
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
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  fileIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
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
  fileFolder: {
    fontSize: 14,
    color: '#3B82F6',
    marginBottom: 2,
  },
  fileDate: {
    fontSize: 12,
    color: '#6B7280',
  },
  thumbnailContainer: {
    position: 'relative',
  },
  thumbnail: {
    width: 50,
    height: 50,
    borderRadius: 8,
  },
  zoomIcon: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 8,
    padding: 2,
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
});