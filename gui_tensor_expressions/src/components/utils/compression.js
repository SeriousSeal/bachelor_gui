import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string';

export const compressData = (data) => {
    if (!data) return null;
    try {
        return compressToEncodedURIComponent(JSON.stringify(data));
    } catch (e) {
        console.error('Failed to compress data:', e);
        return null;
    }
};

export const decompressData = (compressed) => {
    if (!compressed) return null;
    try {
        const decompressed = decompressFromEncodedURIComponent(compressed);
        if (!decompressed) {
            throw new Error('Decompression resulted in null or empty string');
        }
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
