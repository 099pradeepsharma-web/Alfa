
export const getCachedData = <T>(key: string): T | null => {
    const cachedItem = sessionStorage.getItem(key);
    if (!cachedItem) return null;

    try {
        const { data, expiry } = JSON.parse(cachedItem);
        if (expiry && Date.now() > expiry) {
            sessionStorage.removeItem(key);
            return null;
        }
        return data as T;
    } catch (e) {
        console.error("Failed to parse cached data", e);
        return null;
    }
};

export const setCachedData = <T>(key: string, data: T, ttlMinutes: number = 60): void => {
    const expiry = Date.now() + ttlMinutes * 60 * 1000;
    const itemToCache = JSON.stringify({ data, expiry });
    try {
        sessionStorage.setItem(key, itemToCache);
    } catch (e) {
        console.error("Failed to set cached data", e);
    }
};
