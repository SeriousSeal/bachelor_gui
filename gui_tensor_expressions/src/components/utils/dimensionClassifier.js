import { cloneDeep } from "lodash";
import { Toast } from '../common/Toast';

const DimState = {
    INITIAL: 'INITIAL',
    PRIMITIVE: 'PRIMITIVE',
    LOOP: 'LOOP'
};

const DimType = {
    CB: 'cb',
    MB: 'mb',
    NB: 'nb',
    KB: 'kb',
    BC: 'bc',
    BM: 'bm',
    BN: 'bn',
    BK: 'bk'
};

const PrimitiveDimType = {
    CB: 'cb',
    MB: 'mb',
    KB: 'kb',
    NB: 'nb',
    RANDOM: 'random'
};

const PRIMITIVE_DIM_ORDER = Object.values(PrimitiveDimType);

class BaseDimensionClassifier {
    constructor(node, left, right) {
        this.clonedNode = cloneDeep(node);
        this.node = cloneDeep(node);
        this.left = cloneDeep(left);
        this.right = cloneDeep(right);
        this.rightK = cloneDeep(right);
        this.leftK = cloneDeep(left);
        this.state = DimState.INITIAL;
        this.dimTypes = this.initializeDimTypes();
        this.processedIndices = new Set();
        this.dimType = DimType.CB;
    }

    initializeDimTypes() {
        return {
            primitive: { cb: [], mb: [], nb: [], kb: [] },
            loop: { bc: [], bm: [], bn: [], bk: [] }
        };
    }

    reverseAllArrays() {
        Object.values(this.dimTypes.primitive).forEach(arr => arr.reverse());
        Object.values(this.dimTypes.loop).forEach(arr => arr.reverse());
    }

    acceptDimForPrimitive(dimType) {
        const currentTypeIndex = PRIMITIVE_DIM_ORDER.indexOf(this.dimType);
        const newTypeIndex = PRIMITIVE_DIM_ORDER.indexOf(dimType);
        return currentTypeIndex <= newTypeIndex;
    }

    addToPrimitive(type, element) {
        if (!element) {
            throw new Error('Contraction faulty');
        }
        if (this.processedIndices.has(element)) {
            const error = `Index ${element} already processed`
            throw new Error(
                error
            );
        }
        this.dimTypes.primitive[type].push(element);
        this.processedIndices.add(element);
    }

    addToLoop(type, element) {
        if (!element) {
            throw new Error('Contraction faulty 1');
        }
        if (this.processedIndices.has(element)) {
            const error = `Index ${element} already processed`
            throw new Error(
                error
            );
        }
        this.dimTypes.loop[type].push(element);
        this.processedIndices.add(element);
    }

    removeFromAll(element) {
        this.node = this.node.filter(e => e !== element);
        this.left = this.left.filter(e => e !== element);
        this.right = this.right.filter(e => e !== element);
    }

    removeFromNodeAndLeft(element) {
        this.node = this.node.filter(e => e !== element);
        this.left = this.left.filter(e => e !== element);
    }

    removeFromNodeAndRight(element) {
        this.node = this.node.filter(e => e !== element);
        this.right = this.right.filter(e => e !== element);
    }

    removeFromLeftAndRight(element) {
        this.left = this.left.filter(e => e !== element);
        this.right = this.right.filter(e => e !== element);
    }

    classify() {
        throw new Error('classify() must be implemented by subclass');
    }
}

class StandardDimensionClassifier extends BaseDimensionClassifier {
    classify() {
        try {
            this.processCMN();
            this.processK();
            this.reverseAllArrays();
        } catch (error) {
            console.error(error.message);
            Toast.show(error.message);
            return null;
        }
        return this.dimTypes;
    }

    processCMN() {
        for (let i = this.node.length - 1; i >= 0; i--) {
            const element = this.node[i];
            const occurrenceLast = this.checkOccurrenceLast(element);

            let retCode = this.handleInitialState(element, occurrenceLast);

            if (retCode === 2) {
                if (this.state === DimState.INITIAL) {
                    this.dimType = DimType.KB;
                } else if (this.state === DimState.PRIMITIVE) {
                    const currentIndex = PRIMITIVE_DIM_ORDER.indexOf(this.dimType);
                    if (currentIndex === -1 || currentIndex + 1 >= PRIMITIVE_DIM_ORDER.length) {
                        this.dimType = DimType.NB;
                    } else {
                        this.dimType = PRIMITIVE_DIM_ORDER[currentIndex + 1];
                    }
                }
                this.state = DimState.LOOP;
                retCode = this.handleLoopState(element);
            }

            if (retCode === 0) {
                continue;
            } else if (retCode === 1) {
                i++;
                continue;
            }
        }
    }

    processK() {
        const primitive = this.processRightKDimensions();
        this.processLeftKDimensions(primitive);
    }

    processRightKDimensions() {
        this.dimType = DimType.CB;
        const primitive = [];

        this.rightK?.reverse().forEach(element => {
            if (this.isElementInExistingDimension(element)) return;

            if (this.leftK.includes(element)) {
                this.handleRightKElement(element, primitive);
            } else {
                throw new Error(`Node ${this.clonedNode} is faulty`);
            }
        });

        return primitive;
    }

    processLeftKDimensions(primitive) {
        this.dimType = DimType.CB;

        this.leftK?.reverse().forEach(element => {
            if (this.isElementInExistingDimension(element)) return;

            if (this.rightK.includes(element)) {
                this.handleLeftKElement(element, primitive);
            } else {
                throw new Error(`Node ${this.clonedNode} is faulty`);
            }
        });
    }

    isElementInExistingDimension(element) {
        const inC = this.isInDimension(element, 'cb', 'bc');
        const inM = this.isInDimension(element, 'mb', 'bm');
        const inN = this.isInDimension(element, 'nb', 'bn');
        const inK = this.isInDimension(element, 'kb', 'bk');

        if (inC || inM || inN || inK) {
            this.dimType = this.getDimensionType(inC, inM, inN, inK);
            return true;
        }
        return false;
    }

    isInDimension(element, primitive, loop) {
        return this.dimTypes.primitive[primitive].includes(element) ||
            this.dimTypes.loop[loop].includes(element);
    }

    getDimensionType(inC, inM, inN, inK) {
        if (inC) return DimType.CB;
        if (inM) return DimType.MB;
        if (inN) return DimType.NB;
        return DimType.KB;
    }

    handleRightKElement(element, primitive) {
        if (this.acceptDimForPrimitive(DimType.KB)) {
            primitive.push(element);
        }
        this.dimType = DimType.KB;
    }

    handleLeftKElement(element, primitive) {
        const isPrimitiveK = this.acceptDimForPrimitive(DimType.KB) &&
            primitive.includes(element) &&
            primitive[0] === element;

        if (isPrimitiveK) {
            this.addToPrimitive(DimType.KB, element);
            const index = primitive.indexOf(element);
            if (index > -1) {
                primitive.splice(index, 1);
            }
        } else {
            this.addToLoop(DimType.BK, element);
        }
        this.dimType = DimType.KB;
    }

    handleInitialState(element, occurrence) {
        if (occurrence.inAll && this.acceptDimForPrimitive(DimType.CB)) {
            this.dimType = DimType.CB;
            this.state = DimState.PRIMITIVE;
            this.addToPrimitive(DimType.CB, element);
            this.removeFromAll(element);
            return 0;
        } else if (occurrence.inNodeAndLeft && this.acceptDimForPrimitive(DimType.MB) && !this.right.includes(element)) {
            this.dimType = DimType.MB;
            this.state = DimState.PRIMITIVE;
            this.addToPrimitive(DimType.MB, element);
            this.state = DimState.PRIMITIVE;
            this.removeFromNodeAndLeft(element);
            return 0;
        } else if (occurrence.leftEqualsRight && this.acceptDimForPrimitive(DimType.KB) && !this.node.includes(this.left[this.left.length - 1])) {
            this.dimType = DimType.KB;
            this.state = DimState.PRIMITIVE;
            const lastLeft = this.left[this.left.length - 1];
            this.addToPrimitive(DimType.KB, lastLeft);
            this.state = DimState.PRIMITIVE;
            this.removeFromLeftAndRight(lastLeft);
            return 1;
        } else if (occurrence.inNodeAndRight && this.acceptDimForPrimitive(DimType.NB) && !this.left.includes(element)) {
            this.dimType = DimType.NB;
            this.state = DimState.PRIMITIVE;
            this.addToPrimitive(DimType.NB, element);
            this.state = DimState.PRIMITIVE;
            this.removeFromNodeAndRight(element);
            return 0;
        }
        return 2;
    }

    handleLoopState(element) {
        const occurrence = this.checkOccurrence(element);
        if (occurrence.inAll) {
            this.addToLoop(DimType.BC, element);
            this.removeFromAll(element);
            return 0;
        } else if (occurrence.inNodeAndLeft && !this.right.includes(element)) {
            this.addToLoop(DimType.BM, element);
            this.removeFromNodeAndLeft(element);
            return 0;
        } else if (occurrence.leftInRight && !this.node.includes(this.left[this.left.length - 1])) {
            this.removeFromLeftAndRight(this.left[this.left.length - 1]);
            return 1;
        } else if (occurrence.rightInLeft && !this.node.includes(this.right[this.right.length - 1])) {
            this.removeFromLeftAndRight(this.right[this.right.length - 1]);
            return 1;
        } else if (occurrence.inNodeAndRight && !this.left.includes(element)) {
            this.addToLoop(DimType.BN, element);
            this.removeFromNodeAndRight(element);
            return 0;
        }
        else {
            throw new Error(
                `Contraction ${this.clonedNode} is faulty`
            );
        }
    }

    checkOccurrenceLast(element) {
        const inNode = this.node.at(-1) === element;
        const inLeft = this.left?.at(-1) === element || false;
        const inRight = this.right?.at(-1) === element || false;
        const leftEqualsRight = this.left.length > 0 && this.right.length > 0 && this.left[this.left.length - 1] === this.right[this.right.length - 1];

        return {
            inAll: inNode && inLeft && inRight,
            inNodeAndLeft: inNode && inLeft && !inRight,
            inNodeAndRight: inNode && !inLeft && inRight,
            leftEqualsRight: leftEqualsRight
        };
    };

    checkOccurrence(element) {
        const inNode = this.node.includes(element);
        const inLeft = this.left.includes(element);
        const inRight = this.right.includes(element);
        const leftInRight = this.left.length > 0 && this.right.length > 0 && this.right.includes(this.left[this.left.length - 1]);
        const rightInLeft = this.left.length > 0 && this.right.length > 0 && this.left.includes(this.right[this.right.length - 1]);

        return {
            inAll: inNode && inLeft && inRight,
            inNodeAndLeft: inNode && inLeft && !inRight,
            inNodeAndRight: inNode && !inLeft && inRight,
            leftInRight: leftInRight,
            rightInLeft: rightInLeft
        };
    }
}

class SimplifiedDimensionClassifier extends BaseDimensionClassifier {
    classify() {
        try {
            this.processSimpleClassification();
        } catch (error) {
            console.error(error.message);
            Toast.show(error.message);
            return null;
        }
        return this.dimTypes;
    }

    processSimpleClassification() {
        // Simplified classification logic
        // Implementation here
    }
}

export const createDimensionClassifier = (type, node, left, right) => {
    switch (type) {
        case 'standard':
            return new StandardDimensionClassifier(node, left, right);
        case 'simplified':
            return new SimplifiedDimensionClassifier(node, left, right);
        default:
            return new StandardDimensionClassifier(node, left, right);
    }
};

export const dimensionTypes = (node, left, right, type = 'standard') => {
    const classifier = createDimensionClassifier(type, node, left, right);
    return classifier.classify();
};
