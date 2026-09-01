import { Project } from '../types/Project';

const DATABASE_NAME = 'adi-portfolio-studio';
const DATABASE_VERSION = 1;
const STORE_NAME = 'drafts';
const PROJECTS_KEY = 'projects';

const openDatabase = (): Promise<IDBDatabase> => new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !('indexedDB' in window)) {
        reject(new Error('This browser does not support local portfolio drafts.'));
        return;
    }

    const request = window.indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    request.onupgradeneeded = () => {
        if (!request.result.objectStoreNames.contains(STORE_NAME)) request.result.createObjectStore(STORE_NAME);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Unable to open the local draft store.'));
});

export const loadProjectDraft = async (): Promise<Project[] | null> => {
    const database = await openDatabase();
    return new Promise((resolve, reject) => {
        const transaction = database.transaction(STORE_NAME, 'readonly');
        const request = transaction.objectStore(STORE_NAME).get(PROJECTS_KEY);
        request.onsuccess = () => resolve((request.result as Project[] | undefined) ?? null);
        request.onerror = () => reject(request.error ?? new Error('Unable to read the local draft.'));
        transaction.oncomplete = () => database.close();
    });
};

export const saveProjectDraft = async (projects: Project[]): Promise<void> => {
    const database = await openDatabase();
    return new Promise((resolve, reject) => {
        const transaction = database.transaction(STORE_NAME, 'readwrite');
        transaction.objectStore(STORE_NAME).put(projects, PROJECTS_KEY);
        transaction.oncomplete = () => { database.close(); resolve(); };
        transaction.onerror = () => reject(transaction.error ?? new Error('Unable to save the local draft.'));
        transaction.onabort = () => reject(transaction.error ?? new Error('Saving the local draft was cancelled.'));
    });
};

export const clearProjectDraft = async (): Promise<void> => {
    const database = await openDatabase();
    return new Promise((resolve, reject) => {
        const transaction = database.transaction(STORE_NAME, 'readwrite');
        transaction.objectStore(STORE_NAME).delete(PROJECTS_KEY);
        transaction.oncomplete = () => { database.close(); resolve(); };
        transaction.onerror = () => reject(transaction.error ?? new Error('Unable to clear the local draft.'));
    });
};
