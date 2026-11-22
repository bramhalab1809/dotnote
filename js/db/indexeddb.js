window.ILW = window.ILW || {};

(function (ILW) {
    const DB_NAME = 'IconicLetterDB';
    const DB_VERSION = 2;
    const STORE_NAME = 'letters';
    const FALLBACK_KEY = 'ilw_letters_fallback';
    let db = null;

    function persistFallback(letters) {
        try {
            localStorage.setItem(FALLBACK_KEY, JSON.stringify(letters || []));
        } catch (err) {
            // In-memory only when storage is restricted
        }
    }

    function readFallback() {
        try {
            const raw = localStorage.getItem(FALLBACK_KEY);
            const parsed = raw ? JSON.parse(raw) : [];
            return Array.isArray(parsed)
                ? parsed.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
                : [];
        } catch (err) {
            return [];
        }
    }

    function initDB() {
        return new Promise((resolve) => {
            try {
                if (!('indexedDB' in window)) {
                    resolve(null);
                    return;
                }
                const request = indexedDB.open(DB_NAME, DB_VERSION);

                request.onupgradeneeded = (e) => {
                    const database = e.target.result;
                    let store;
                    if (!database.objectStoreNames.contains(STORE_NAME)) {
                        store = database.createObjectStore(STORE_NAME, { keyPath: 'id' });
                    } else {
                        store = e.target.transaction.objectStore(STORE_NAME);
                    }
                    if (!store.indexNames.contains('updatedAt')) {
                        store.createIndex('updatedAt', 'updatedAt', { unique: false });
                    }
                };

                request.onsuccess = (e) => {
                    db = e.target.result;
                    db.onversionchange = () => {
                        db.close();
                        db = null;
                    };
                    resolve(db);
                };

                request.onerror = () => resolve(null);
                request.onblocked = () => resolve(null);
            } catch (err) {
                resolve(null);
            }
        });
    }

    function saveLetter(letter, allLetters) {
        return new Promise((resolve) => {
            if (!db) {
                persistFallback(allLetters);
                resolve(true);
                return;
            }
            try {
                const tx = db.transaction(STORE_NAME, 'readwrite');
                tx.objectStore(STORE_NAME).put(letter);
                tx.oncomplete = () => resolve(true);
                tx.onerror = () => {
                    persistFallback(allLetters);
                    resolve(false);
                };
            } catch (err) {
                persistFallback(allLetters);
                resolve(false);
            }
        });
    }

    function getAllLetters() {
        return new Promise((resolve) => {
            if (!db) {
                resolve(readFallback());
                return;
            }
            try {
                const tx = db.transaction(STORE_NAME, 'readonly');
                const req = tx.objectStore(STORE_NAME).getAll();
                req.onsuccess = () => {
                    const list = (req.result || []).sort(
                        (a, b) => (b.updatedAt || 0) - (a.updatedAt || 0)
                    );
                    resolve(list);
                };
                req.onerror = () => resolve(readFallback());
            } catch (err) {
                resolve(readFallback());
            }
        });
    }

    function deleteLetter(id, remainingLetters) {
        return new Promise((resolve) => {
            if (!db) {
                persistFallback(remainingLetters);
                resolve(true);
                return;
            }
            try {
                const tx = db.transaction(STORE_NAME, 'readwrite');
                tx.objectStore(STORE_NAME).delete(id);
                tx.oncomplete = () => resolve(true);
                tx.onerror = () => {
                    persistFallback(remainingLetters);
                    resolve(false);
                };
            } catch (err) {
                persistFallback(remainingLetters);
                resolve(false);
            }
        });
    }

    ILW.db = {
        init: initDB,
        saveLetter,
        getAllLetters,
        deleteLetter,
        persistFallback
    };
})(window.ILW);
