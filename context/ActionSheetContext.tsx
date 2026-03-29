import React, { createContext, useContext, useState, useCallback } from 'react';

type ActionSheetMode = 'create' | 'study' | 'options';
type TargetType = 'deck' | 'lecture' | 'folder';

type ActionSheetContextType = {
    isOpen: boolean;
    mode: ActionSheetMode;
    title?: string;
    targetId?: string;
    targetType?: TargetType;
    onActionComplete?: () => void;
    openActionSheet: (
        mode?: ActionSheetMode,
        title?: string,
        targetId?: string,
        targetType?: TargetType,
        onActionComplete?: () => void
    ) => void;
    closeActionSheet: () => void;
};

const ActionSheetContext = createContext<ActionSheetContextType | undefined>(undefined);

export function ActionSheetProvider({ children }: { children: React.ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);
    const [mode, setMode] = useState<ActionSheetMode>('create');
    const [title, setTitle] = useState<string | undefined>();
    const [targetId, setTargetId] = useState<string | undefined>();
    const [targetType, setTargetType] = useState<TargetType | undefined>();
    const [onActionComplete, setOnActionComplete] = useState<(() => void) | undefined>();

    const openActionSheet = useCallback((
        newMode: ActionSheetMode = 'create',
        newTitle?: string,
        newTargetId?: string,
        newTargetType?: TargetType,
        newOnActionComplete?: () => void
    ) => {
        setMode(newMode);
        setTitle(newTitle);
        setTargetId(newTargetId);
        setTargetType(newTargetType);
        setOnActionComplete(() => newOnActionComplete);
        setIsOpen(true);
    }, []);

    const closeActionSheet = useCallback(() => {
        setIsOpen(false);
    }, []);

    return (
        <ActionSheetContext.Provider value={{
            isOpen, mode, title, targetId, targetType, onActionComplete, openActionSheet, closeActionSheet
        }}>
            {children}
        </ActionSheetContext.Provider>
    );
}

export function useActionSheet() {
    const context = useContext(ActionSheetContext);
    if (context === undefined) {
        throw new Error('useActionSheet must be used within an ActionSheetProvider');
    }
    return context;
}
