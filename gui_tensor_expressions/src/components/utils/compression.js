import pako from 'pako';

export const compressData = (data) => {
    if (!data) return null;
    try {
        const jsonString = JSON.stringify(data);
        const compressed = pako.gzip(jsonString);
        return btoa(String.fromCharCode.apply(null, compressed));
    } catch (e) {
        console.error('Failed to compress data:', e);
        return null;
    }
};

export const decompressData = (compressed) => {
    if (!compressed) return null;
    try {
        const binary = atob(compressed);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
        const decompressed = pako.ungzip(bytes, { to: 'string' });
        console.log(decompressed);
        return JSON.parse(decompressed);
    } catch (e) {
        console.error('Failed to decompress data:', e);
        return null;
    }
};

export const createShareableUrl = (expression, indexSizes) => {
    const compressedExpression = compressData(expression);
    const compressedSizes = compressData(indexSizes);

    if (!compressedExpression || !compressedSizes) {
        console.error('Failed to create shareable URL');
        return null;
    }

    const baseUrl = window.location.origin + window.location.pathname;
    const params = new URLSearchParams({
        e: compressedExpression,
        s: compressedSizes
    });

    return `${baseUrl}?${params.toString()}`;
};
