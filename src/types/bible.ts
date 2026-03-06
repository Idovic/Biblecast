/* Types pour BibleCast */

export interface BibleData {
  [bookName: string]: {
    [chapter: string]: {
      [verse: string]: string;
    };
  };
}

export interface VerseReference {
  book: string;
  chapter: number;
  verse: number;
  text: string;
}

export type SlideType = 'text-title' | 'title-only' | 'verse-title' | 'blank' | 'bullet-list';

export interface CustomSlide {
  id: string;
  title: string;
  content: string;
  slideType: SlideType;
  bullets?: string[];
  textColor?: string;
  backgroundColor?: string;
  backgroundGradient?: string;
  backgroundImage?: string;
  textShadow?: boolean;
  showLogo?: boolean;
}

export interface QueueItem {
  id: string;
  type: 'verse' | 'slide' | 'section';
  verse?: VerseReference;
  slide?: CustomSlide;
  sectionName?: string;
  sectionColor?: string;
}

export interface DisplayMessage {
  type: 'show-verse' | 'show-slide' | 'clear' | 'theme-change';
  verse?: VerseReference;
  slide?: CustomSlide;
  theme?: DisplayTheme;
}

export interface DisplayTheme {
  name: string;
  className: string;
  fontSize: 'small' | 'medium' | 'large' | 'xlarge';
  fontFamily: 'serif' | 'sans-serif';
  bgOpacity: number;
  verseBackgroundImage?: string;
  showChurchLogo?: boolean;
}

export interface SearchResult {
  book: string;
  chapter: number;
  verse: number;
  text: string;
  highlight: string;
}
