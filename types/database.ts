export interface Folder {
    id: string;
    userId: string;
    title: string;
    colorHex?: string;
    iconName?: string;
    createdAt: number;
    updatedAt: number;
}

export interface Flashcard {
    id: string;
    deckId: string;
    front: string;
    back: string;
    // SRS metadata
    easeFactor: number;
    interval: number;
    nextReviewDate: number;
    repetitionCount: number;
    createdAt: number;
}

export interface Deck {
    id: string;
    userId: string;
    folderId?: string; // Optional parent folder
    title: string;
    description?: string;
    cardCount: number;
    createdAt: number;
    updatedAt: number;
    lastStudiedAt?: number;
}

export interface LectureNote {
    id: string;
    userId: string;
    folderId?: string; // Optional parent folder
    title: string;
    content: string; // Raw content or transcription
    summary?: string;
    keyTakeaways?: string[];
    glossary?: { term: string; definition: string }[];
    date: string;
    createdAt: number;
    updatedAt: number;
}

export type CreateSourceType = 'text' | 'document' | 'link' | 'audio';
