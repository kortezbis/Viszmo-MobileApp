import { Folder, Deck, Flashcard, LectureNote } from '@/types/database';

// Mock storage for now - will be replaced by Supabase
class DatabaseService {
    private folders: Folder[] = [];
    private decks: Deck[] = [];
    private flashcards: Flashcard[] = [];
    private notes: LectureNote[] = [];

    constructor() {
        // Add one test deck and folder as requested
        this.folders = [
            {
                id: 'test-folder-1',
                userId: 'current-user',
                title: 'Cybersecurity',
                colorHex: '#10B981', // Hacker green
                createdAt: Date.now(),
                updatedAt: Date.now(),
            },
            {
                id: 'test-folder-2',
                userId: 'current-user',
                title: 'General Knowledge',
                colorHex: '#8B5CF6', // Purple
                createdAt: Date.now(),
                updatedAt: Date.now(),
            }
        ];

        this.decks = [
            {
                id: 'test-deck-1',
                userId: 'current-user',
                folderId: 'test-folder-1',
                title: 'Network Security Fundamentals',
                cardCount: 6,
                createdAt: Date.now(),
                updatedAt: Date.now(),
            },
            {
                id: 'test-deck-2',
                userId: 'current-user',
                folderId: 'test-folder-2',
                title: 'Universal Speaking Test',
                cardCount: 5,
                createdAt: Date.now(),
                updatedAt: Date.now(),
            }
        ];

        this.flashcards = [
            { id: '1', deckId: 'test-deck-1', front: 'Phishing', back: 'A cyber attack that uses disguised email as a weapon to trick an email recipient into believing that the message is something they want or need.', easeFactor: 2.5, interval: 0, nextReviewDate: Date.now(), repetitionCount: 0, createdAt: Date.now() },
            { id: '2', deckId: 'test-deck-1', front: 'Ransomware', back: 'A type of malicious software designed to block access to a computer system until a sum of money is paid.', easeFactor: 2.5, interval: 0, nextReviewDate: Date.now(), repetitionCount: 0, createdAt: Date.now() },
            { id: '3', deckId: 'test-deck-1', front: 'Man in the Middle', back: 'An attack where the attacker secretly relays and possibly alters the communications between two parties who believe they are directly communicating.', easeFactor: 2.5, interval: 0, nextReviewDate: Date.now(), repetitionCount: 0, createdAt: Date.now() },
            { id: '4', deckId: 'test-deck-1', front: 'SQL Injection', back: 'A code injection technique used to attack data-driven applications, in which malicious SQL statements are inserted into entry fields for execution.', easeFactor: 2.5, interval: 0, nextReviewDate: Date.now(), repetitionCount: 0, createdAt: Date.now() },
            { id: '5', deckId: 'test-deck-1', front: 'Zero Day Exploit', back: 'A cyber attack that occurs on the same day a weakness is discovered in software, before the vendor can patch it.', easeFactor: 2.5, interval: 0, nextReviewDate: Date.now(), repetitionCount: 0, createdAt: Date.now() },
            { id: '6', deckId: 'test-deck-1', front: 'Social Engineering', back: 'The psychological manipulation of people into performing actions or divulging confidential information.', easeFactor: 2.5, interval: 0, nextReviewDate: Date.now(), repetitionCount: 0, createdAt: Date.now() },

            // Universal Test Deck
            { id: '7', deckId: 'test-deck-2', front: 'Photosynthesis', back: 'The process used by plants, algae and certain bacteria to harness energy from sunlight and turn it into chemical energy.', easeFactor: 2.5, interval: 0, nextReviewDate: Date.now(), repetitionCount: 0, createdAt: Date.now() },
            { id: '8', deckId: 'test-deck-2', front: 'Magna Carta', back: 'A royal charter of rights agreed to by King John of England at Runnymede, near Windsor, on 15 June 1215.', easeFactor: 2.5, interval: 0, nextReviewDate: Date.now(), repetitionCount: 0, createdAt: Date.now() },
            { id: '9', deckId: 'test-deck-2', front: 'Supply Chain', back: 'A network between a company and its suppliers to produce and distribute a specific product to the final buyer.', easeFactor: 2.5, interval: 0, nextReviewDate: Date.now(), repetitionCount: 0, createdAt: Date.now() },
            { id: '10', deckId: 'test-deck-2', front: 'DNA', back: 'Deoxyribonucleic acid is a polymer composed of two polynucleotide chains that coil around each other.', easeFactor: 2.5, interval: 0, nextReviewDate: Date.now(), repetitionCount: 0, createdAt: Date.now() },
            { id: '11', deckId: 'test-deck-2', front: 'Machiavellian', back: 'Cunning, scheming, and unscrupulous, especially in politics or in advancing one\'s career.', easeFactor: 2.5, interval: 0, nextReviewDate: Date.now(), repetitionCount: 0, createdAt: Date.now() },
        ];

        this.notes = [
            {
                id: 'test-note-1',
                userId: 'current-user',
                title: 'Network Penetration Testing',
                content: 'A penetration test, colloquially known as a pen test, is an authorized simulated cyberattack...',
                date: new Date().toLocaleDateString(),
                createdAt: Date.now(),
                updatedAt: Date.now(),
            }
        ];
    }

    // --- FOLDER OPERATIONS ---
    async createFolder(title: string, colorHex?: string, iconName?: string): Promise<Folder> {
        const newFolder: Folder = {
            id: Math.random().toString(36).substr(2, 9),
            userId: 'current-user',
            title,
            colorHex,
            iconName,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        };
        this.folders.push(newFolder);
        return newFolder;
    }

    async getFolders(): Promise<Folder[]> {
        return this.folders;
    }

    async getFolderById(id: string): Promise<Folder | undefined> {
        return this.folders.find(f => f.id === id);
    }

    async updateFolder(folderId: string, updates: Partial<Folder>): Promise<void> {
        const folder = this.folders.find(f => f.id === folderId);
        if (folder) {
            Object.assign(folder, updates);
            folder.updatedAt = Date.now();
        }
    }

    async deleteFolder(folderId: string): Promise<void> {
        this.folders = this.folders.filter(f => f.id !== folderId);
        // Update orphaned decks and notes
        this.decks.forEach(d => {
            if (d.folderId === folderId) d.folderId = undefined;
        });
        this.notes.forEach(n => {
            if (n.folderId === folderId) n.folderId = undefined;
        });
    }

    async getDecksByFolder(folderId: string): Promise<Deck[]> {
        return this.decks.filter(d => d.folderId === folderId);
    }

    async getNotesByFolder(folderId: string): Promise<LectureNote[]> {
        return this.notes.filter(n => n.folderId === folderId);
    }

    // --- DECK OPERATIONS ---
    async getDecks(): Promise<Deck[]> {
        return this.decks;
    }

    async getDeckById(id: string): Promise<Deck | undefined> {
        return this.decks.find(d => d.id === id);
    }

    async createDeck(title: string, folderId?: string): Promise<Deck> {
        const newDeck: Deck = {
            id: Math.random().toString(36).substr(2, 9),
            userId: 'current-user',
            folderId,
            title,
            cardCount: 0,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        };
        this.decks.push(newDeck);
        return newDeck;
    }

    async updateDeck(deckId: string, updates: Partial<Deck>): Promise<void> {
        const deck = this.decks.find(d => d.id === deckId);
        if (deck) {
            Object.assign(deck, updates);
            deck.updatedAt = Date.now();
        }
    }

    async deleteDeck(deckId: string): Promise<void> {
        this.decks = this.decks.filter(d => d.id !== deckId);
        this.flashcards = this.flashcards.filter(c => c.deckId !== deckId);
    }

    async addFlashcards(deckId: string, cards: { front: string, back: string }[]): Promise<void> {
        const newCards: Flashcard[] = cards.map(c => ({
            id: Math.random().toString(36).substr(2, 9),
            deckId,
            front: c.front,
            back: c.back,
            easeFactor: 2.5,
            interval: 0,
            nextReviewDate: Date.now(),
            repetitionCount: 0,
            createdAt: Date.now(),
        }));
        this.flashcards.push(...newCards);

        // Update deck card count
        const deck = this.decks.find(d => d.id === deckId);
        if (deck) {
            deck.cardCount += newCards.length;
            deck.updatedAt = Date.now();
        }
    }

    async getFlashcardsByDeckId(deckId: string): Promise<Flashcard[]> {
        return this.flashcards.filter(c => c.deckId === deckId);
    }

    // --- LECTURE NOTE OPERATIONS ---
    async getLectureNotes(): Promise<LectureNote[]> {
        return this.notes;
    }

    async getLectureNoteById(id: string): Promise<LectureNote | undefined> {
        return this.notes.find(n => n.id === id);
    }

    async updateLectureNote(noteId: string, updates: Partial<LectureNote>): Promise<void> {
        const note = this.notes.find(n => n.id === noteId);
        if (note) {
            Object.assign(note, updates);
            note.updatedAt = Date.now();
        }
    }

    async deleteLectureNote(noteId: string): Promise<void> {
        this.notes = this.notes.filter(n => n.id !== noteId);
    }

    async createLectureNote(params: Partial<LectureNote>): Promise<LectureNote> {
        const newNote: LectureNote = {
            id: Math.random().toString(36).substr(2, 9),
            userId: 'current-user',
            title: params.title || 'Untitled Lecture',
            content: params.content || '',
            summary: params.summary,
            keyTakeaways: params.keyTakeaways,
            glossary: params.glossary,
            date: new Date().toLocaleDateString(),
            createdAt: Date.now(),
            updatedAt: Date.now(),
            folderId: params.folderId,
        };
        this.notes.push(newNote);
        return newNote;
    }
}

export const dbProvider = new DatabaseService();
