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

class DimensionClassifier {
    constructor(node, left, right) {
        this.clonedNode = cloneDeep(node);
        this.node = cloneDeep(node);
        this.left = cloneDeep(left);
        this.right = cloneDeep(right);
        // for k dimension
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

    classify() {
        try {
            this.processLastIndices();

            // Second pass: Process remaining indices
            this.processK();

            // Reverse all arrays
            this.reverseAllArrays();
        } catch (error) {
            console.error(error.message);
            Toast.show(error.message);
            return null;
        }

        return this.dimTypes;
    }

    reverseAllArrays() {
        // Reverse primitive arrays
        Object.values(this.dimTypes.primitive).forEach(arr => arr.reverse());
        // Reverse loop arrays
        Object.values(this.dimTypes.loop).forEach(arr => arr.reverse());
    }

    processK() {

        // Process remaining left indices which are in K dimension
        this.dimType = DimType.CB;
        const primitive = []
        this.rightK?.reverse().forEach(element => {
            const inC = (this.dimTypes.primitive?.cb || []).includes(element) || (this.dimTypes.loop?.bc || []).includes(element);
            const inM = (this.dimTypes.primitive?.mb || []).includes(element) || (this.dimTypes.loop?.bm || []).includes(element);
            const inN = (this.dimTypes.primitive?.nb || []).includes(element) || (this.dimTypes.loop?.bn || []).includes(element);

            if (inC || inM || inN) {
                this.dimType = inC ? DimType.CB : inM ? DimType.MB : DimType.NB;
                return;
            }
            const occurrence = this.leftK.includes(element);
            if (occurrence) {
                if (this.acceptDimForPrimitive(DimType.KB)) {
                    primitive.push(element);
                }
                this.dimType = DimType.KB;
            }
            else {
                throw new Error(
                    `Node ${this.clonedNode} is faulty`
                );
            }
        });
        // Process remaining right indices
        this.dimType = DimType.CB;
        this.leftK?.reverse().forEach(element => {
            const inC = (this.dimTypes.primitive?.cb || []).includes(element) || (this.dimTypes.loop?.bc || []).includes(element);
            const inM = (this.dimTypes.primitive?.mb || []).includes(element) || (this.dimTypes.loop?.bm || []).includes(element);
            const inN = (this.dimTypes.primitive?.nb || []).includes(element) || (this.dimTypes.loop?.bn || []).includes(element);
            const inK = (this.dimTypes.primitive?.kb || []).includes(element) || (this.dimTypes.loop?.bk || []).includes(element);

            if (inC || inM || inN || inK) {
                this.dimType = inC ? DimType.CB : inM ? DimType.MB : inN ? DimType.NB : DimType.KB;
                return;
            }

            const occurrence = this.rightK.includes(element);
            if (occurrence) {
                if (this.acceptDimForPrimitive(DimType.KB) && primitive.includes(element) && primitive[0] === element) {
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
            else {
                throw new Error(
                    `Node ${this.clonedNode} is faulty`
                );
            }
        });
    }

    processLastIndices() {
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


    acceptDimForPrimitive(dimType) {
        const currentTypeIndex = PRIMITIVE_DIM_ORDER.indexOf(this.dimType);
        const newTypeIndex = PRIMITIVE_DIM_ORDER.indexOf(dimType);

        // Accept if it's the same type or comes after in the order
        return currentTypeIndex <= newTypeIndex;
    }

    // Helper methods for dimension management
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

}

export const dimensionTypes = (node, left, right) => {
    const classifier = new DimensionClassifier(node, left, right);
    return classifier.classify();
};
