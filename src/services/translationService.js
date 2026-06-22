// Lightweight client-side translation using MyMemory API
// Falls back to original text if translation fails or quota is exceeded

const MY_MEMORY_API = 'https://api.mymemory.translated.net/get';

const LANGUAGE_CODES = {
  ta: 'ta',
  hi: 'hi',
  te: 'te',
  kn: 'kn',
  ml: 'ml'
};

const cache = new Map();

const getCacheKey = (text, targetLang) => `${targetLang}:${text}`;

export const translateText = async (text, targetLang) => {
  if (!text || !targetLang || targetLang === 'en' || !LANGUAGE_CODES[targetLang]) {
    return text;
  }

  const cacheKey = getCacheKey(text, targetLang);
  if (cache.has(cacheKey)) {
    return cache.get(cacheKey);
  }

  const apiLang = LANGUAGE_CODES[targetLang];
  const encodedText = encodeURIComponent(text);
  const url = `${MY_MEMORY_API}?q=${encodedText}&langpair=en|${apiLang}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Translation API error: ${response.status}`);
    }
    const data = await response.json();
    const translated = data?.responseData?.translatedText;
    if (translated && translated.toLowerCase() !== text.toLowerCase()) {
      cache.set(cacheKey, translated);
      return translated;
    }
    return text;
  } catch (error) {
    return text;
  }
};

export const translateBatch = async (texts, targetLang) => {
  if (!targetLang || targetLang === 'en') {
    return texts.map(t => t);
  }

  const results = await Promise.all(
    texts.map(text => translateText(text, targetLang))
  );
  return results;
};

export const clearTranslationCache = () => {
  cache.clear();
};
