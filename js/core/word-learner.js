window.ILW = window.ILW || {};

(function (ILW) {
    const STORAGE_KEY = 'dotnote_learned_vocab_v1';
    const MAX_WORDS = 2000;
    const MAX_BIGRAMS = 1000;

    // Built-in starter bigrams for instant smart next-word predictions
    const STARTER_BIGRAMS = {
        dear: ['sir', 'madam', 'friend', 'team', 'all'],
        thank: ['you', 'you,', 'everyone'],
        thanks: ['for', 'a', 'again', 'and'],
        yours: ['sincerely', 'faithfully', 'truly'],
        best: ['regards', 'wishes', 'luck'],
        warm: ['regards', 'wishes', 'welcome'],
        kind: ['regards', 'attention', 'request'],
        please: ['find', 'let', 'note', 'confirm', 'check', 'share'],
        looking: ['forward', 'for', 'into', 'at'],
        forward: ['to', 'your'],
        with: ['regards', 'reference', 'respect', 'best'],
        would: ['like', 'love', 'appreciate', 'be'],
        hope: ['you', 'this', 'everything', 'to'],
        let: ['me', 'us', 'know'],
        i: ['am', 'have', 'would', 'will', 'hope', 'want']
    };

    let vocab = { freq: {}, bigrams: {} };

    function load() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return;
            const parsed = JSON.parse(raw);
            if (parsed && typeof parsed === 'object') {
                vocab.freq = parsed.freq && typeof parsed.freq === 'object' ? parsed.freq : {};
                vocab.bigrams = parsed.bigrams && typeof parsed.bigrams === 'object' ? parsed.bigrams : {};
            }
        } catch (err) {
            vocab = { freq: {}, bigrams: {} };
        }
    }

    function save() {
        try {
            prune();
            localStorage.setItem(STORAGE_KEY, JSON.stringify(vocab));
        } catch (err) {
            // Ignore quota issues
        }
    }

    function prune() {
        const keys = Object.keys(vocab.freq);
        if (keys.length > MAX_WORDS) {
            keys.sort((a, b) => (vocab.freq[b].c || 0) - (vocab.freq[a].c || 0));
            const nextFreq = {};
            for (let i = 0; i < MAX_WORDS; i++) nextFreq[keys[i]] = vocab.freq[keys[i]];
            vocab.freq = nextFreq;
        }
        const bKeys = Object.keys(vocab.bigrams);
        if (bKeys.length > MAX_BIGRAMS) {
            for (let i = MAX_BIGRAMS; i < bKeys.length; i++) delete vocab.bigrams[bKeys[i]];
        }
    }

    function learnFromText(text) {
        if (!text || typeof text !== 'string') return;
        const tokens = text.toLowerCase().match(/[a-z]{2,}/g);
        if (!tokens || tokens.length === 0) return;
        const now = Date.now();
        for (let i = 0; i < tokens.length; i++) {
            const w = tokens[i];
            if (w.length >= 3) {
                const entry = vocab.freq[w] || { c: 0, t: now };
                entry.c = Math.min(9999, entry.c + 1);
                entry.t = now;
                vocab.freq[w] = entry;
            }
            if (i > 0) {
                const prev = tokens[i - 1];
                if (!vocab.bigrams[prev]) vocab.bigrams[prev] = {};
                vocab.bigrams[prev][w] = Math.min(999, (vocab.bigrams[prev][w] || 0) + 1);
            }
        }
    }

    function learnFromLetters(letters) {
        if (!Array.isArray(letters)) return;
        for (let i = 0; i < letters.length; i++) {
            learnFromText(letters[i].leftText);
            learnFromText(letters[i].rightText);
        }
        save();
    }

    function recordChoice(word, prevWord) {
        const w = (word || '').toLowerCase().trim();
        if (w.length < 2) return;
        const now = Date.now();
        const entry = vocab.freq[w] || { c: 0, t: now };
        entry.c += 3;
        entry.t = now;
        vocab.freq[w] = entry;
        if (prevWord) {
            const p = prevWord.toLowerCase().trim();
            if (p.length >= 1) {
                if (!vocab.bigrams[p]) vocab.bigrams[p] = {};
                vocab.bigrams[p][w] = (vocab.bigrams[p][w] || 0) + 2;
            }
        }
        save();
    }

    // Fast bounded edit distance (returns 0, 1, 2, or 99 if > maxDist)
    function editDist(a, b, maxDist) {
        if (Math.abs(a.length - b.length) > maxDist) return 99;
        let prev = [];
        for (let j = 0; j <= b.length; j++) prev[j] = j;
        for (let i = 1; i <= a.length; i++) {
            const curr = [i];
            let rowMin = i;
            for (let j = 1; j <= b.length; j++) {
                const cost = a[i - 1] === b[j - 1] ? 0 : 1;
                const val = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
                curr[j] = val;
                if (val < rowMin) rowMin = val;
            }
            if (rowMin > maxDist) return 99;
            prev = curr;
        }
        return prev[b.length];
    }

    function predictNextWords(prevWord, limit) {
        const p = (prevWord || '').toLowerCase();
        if (!p) return [];
        const scored = new Map();
        const learned = vocab.bigrams[p];
        if (learned) {
            Object.keys(learned).forEach((w) => scored.set(w, learned[w] * 10));
        }
        const starters = STARTER_BIGRAMS[p];
        if (starters) {
            starters.forEach((w, idx) => {
                if (!scored.has(w)) scored.set(w, 5 - idx * 0.2);
            });
        }
        return Array.from(scored.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, limit)
            .map((e) => e[0]);
    }

    function rankCandidates(prefix, limit) {
        const lower = (prefix || '').toLowerCase();
        if (lower.length < 2) return [];
        const seen = new Set();
        const out = [];

        // 1. Personal learned vocabulary (ranked by frequency + recency)
        const learnedMatches = Object.keys(vocab.freq)
            .filter((w) => w !== lower && w.startsWith(lower))
            .sort((a, b) => (vocab.freq[b].c - vocab.freq[a].c) || (vocab.freq[b].t - vocab.freq[a].t));

        for (let i = 0; i < learnedMatches.length && out.length < limit; i++) {
            seen.add(learnedMatches[i]);
            out.push(learnedMatches[i]);
        }

        // 2. O(1) prefix-bucket dictionary matches
        const bucket = ILW.WORD_PREFIX_INDEX ? ILW.WORD_PREFIX_INDEX.get(lower.slice(0, 2)) : null;
        if (bucket) {
            for (let i = 0; i < bucket.length && out.length < limit; i++) {
                const w = bucket[i];
                if (w !== lower && w.startsWith(lower) && !seen.has(w)) {
                    seen.add(w);
                    out.push(w);
                }
            }
        }

        // 3. Lightweight typo / fuzzy correction if very few exact prefix matches
        if (out.length < 3 && lower.length >= 4 && ILW.ALL_WORDS) {
            const firstChar = lower[0];
            const maxD = lower.length >= 6 ? 2 : 1;
            const fuzzy = [];
            for (let i = 0; i < ILW.ALL_WORDS.length; i++) {
                const w = ILW.ALL_WORDS[i];
                if (w[0] !== firstChar || seen.has(w) || w === lower) continue;
                const d = editDist(lower, w, maxD);
                if (d <= maxD) fuzzy.push({ w, d });
            }
            fuzzy.sort((a, b) => a.d - b.d || a.w.length - b.w.length);
            for (let i = 0; i < fuzzy.length && out.length < limit; i++) {
                seen.add(fuzzy[i].w);
                out.push(fuzzy[i].w);
            }
        }
        return out;
    }

    ILW.learner = {
        load, save, learnFromText, learnFromLetters, recordChoice,
        predictNextWords, rankCandidates,
        exportData: () => vocab,
        importData: (data) => {
            if (!data || typeof data !== 'object') return;
            if (data.freq) Object.assign(vocab.freq, data.freq);
            if (data.bigrams) Object.assign(vocab.bigrams, data.bigrams);
            save();
        }
    };
})(window.ILW);
