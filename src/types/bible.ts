/* Types pour BibleCast */

// Structure du fichier bible-fr.json
export interface BibleData {
  [bookName: string]: {
    [chapter: string]: {
      [verse: string]: string;
    };
  };
}

// Référence d'un verset sélectionné
export interface VerseReference {
  book: string;
  chapter: number;
  verse: number;
  text: string;
}

// Slide personnalisée
export interface CustomSlide {
  id: string;
  title: string;
  content: string;
  backgroundColor?: string;
  backgroundImage?: string; // base64 data URL
}

// Élément dans la file d'attente (verset ou slide)
export interface QueueItem {
  id: string;
  type: 'verse' | 'slide';
  verse?: VerseReference;
  slide?: CustomSlide;
}

// Message envoyé via BroadcastChannel
export interface DisplayMessage {
  type: 'show-verse' | 'show-slide' | 'clear' | 'theme-change';
  verse?: VerseReference;
  slide?: CustomSlide;
  theme?: DisplayTheme;
}

// Thème d'affichage
export interface DisplayTheme {
  name: string;
  className: string;
  fontSize: 'small' | 'medium' | 'large' | 'xlarge';
  fontFamily: 'serif' | 'sans-serif';
  bgOpacity: number;
}

// Résultat de recherche
export interface SearchResult {
  book: string;
  chapter: number;
  verse: number;
  text: string;
  highlight: string; // texte avec mise en évidence
}
