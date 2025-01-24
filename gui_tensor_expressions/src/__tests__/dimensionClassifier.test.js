import { dimensionTypes } from '../components/utils/dimensionClassifier';

describe('DimensionClassifier', () => {
    test('classifies CB dimension correctly', () => {
        const node = ['i', 'j', 'k'];
        const left = ['i', 'j', 'k'];
        const right = ['i', 'j', 'k'];

        const result = dimensionTypes(node, left, right);

        expect(result.primitive.cb).toContain('k');
        expect(result.primitive.cb).toContain('j');
        expect(result.primitive.cb).toContain('i');
    });

    test('classifies MB dimension correctly', () => {
        const node = ['i', 'j', 'k', 'l', 'm'];
        const left = ['i', 'j', 'k'];
        const right = ['l', 'm'];

        const result = dimensionTypes(node, left, right);

        expect(result.loop.bm).toContain('j');
        expect(result.loop.bm).toContain('i');
        expect(result.loop.bm).toContain('k');
    });

    test('classifies NB dimension correctly', () => {
        const node = ['i', 'j', 'k', 'l', 'm'];
        const left = ['k', 'l'];
        const right = ['i', 'j', 'm'];

        const result = dimensionTypes(node, left, right);

        expect(result.loop.bn).toContain('j');
        expect(result.loop.bn).toContain('i');
    });

    test('classifies KB dimension correctly', () => {
        const node = ['k', 'm'];
        const left = ['k', 'm', 'n'];
        const right = ['k', 'm', 'n'];

        const result = dimensionTypes(node, left, right);

        expect(result.primitive.kb).toContain('n');
    });

    test('classifies loop dimensions correctly', () => {
        const node = ['i', 'j'];
        const left = ['i', 'k'];
        const right = ['k', 'j'];

        const result = dimensionTypes(node, left, right);

        expect(result.loop.bm).toContain('i');
        expect(result.primitive.nb).toContain('j');
        expect(result.loop.bk).toContain('k');
    });

    test('handles empty arrays', () => {
        const result = dimensionTypes([], [], []);

        expect(result.primitive.cb).toHaveLength(0);
        expect(result.primitive.mb).toHaveLength(0);
        expect(result.primitive.nb).toHaveLength(0);
        expect(result.primitive.kb).toHaveLength(0);
        expect(result.loop.bc).toHaveLength(0);
        expect(result.loop.bm).toHaveLength(0);
        expect(result.loop.bn).toHaveLength(0);
        expect(result.loop.bk).toHaveLength(0);
    });

    test('complex contraction pattern', () => {
        const node = ['m', 'n', 'o'];
        const left = ['m', 'k', 'l'];
        const right = ['k', 'l', 'n', 'o'];

        const result = dimensionTypes(node, left, right);

        expect(result.loop.bm).toContain('m');
        expect(result.primitive.nb).toContain('n');
        expect(result.primitive.nb).toContain('o');
        expect(result.primitive.kb).toContain('k');
        expect(result.loop.bk).toContain('l');
    });
});
