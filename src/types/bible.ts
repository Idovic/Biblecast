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

export type SlideType = 'text-title' | 'title-only' | 'verse-title' | 'blank' | 'bullet-list' | 'image-full';

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
  fontSize?: 'small' | 'medium' | 'large' | 'xlarge';
  titleFontSize?: 'small' | 'medium' | 'large' | 'xlarge';
  textAlign?: 'left' | 'center' | 'right';
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
  type: 'show-verse' | 'show-slide' | 'clear' | 'theme-change' | 'request-next' | 'request-prev' | 'show-dual-verse' | 'queue-update';
  verse?: VerseReference;
  verse2?: VerseReference;
  slide?: CustomSlide;
  theme?: DisplayTheme;
  queueCount?: number;
}

export interface DisplayTheme {
  name: string;
  className: string;
  fontSize: 'small' | 'medium' | 'large' | 'xlarge';
  fontFamily: 'serif' | 'sans-serif';
  bgOpacity: number;
  verseBackgroundImage?: string;
  showChurchLogo?: boolean;
  splitLayout?: 'horizontal' | 'vertical';
  churchLogo?: string;
}

export interface SearchResult {
  book: string;
  chapter: number;
  verse: number;
  text: string;
  highlight: string;
}
