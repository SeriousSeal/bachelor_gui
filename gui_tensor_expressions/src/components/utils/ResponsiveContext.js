import React, { createContext, useState, useContext, useEffect } from 'react';

const ResponsiveContext = createContext();

export const useResponsive = () => {
    const context = useContext(ResponsiveContext);
    if (!context) {
        throw new Error('useResponsive must be used within a ResponsiveProvider');
    }
    return context;
};

export const ResponsiveProvider = ({ children }) => {
    const getScalingFactor = () => window.devicePixelRatio || 1;

    const getResponsiveDimensions = (width, height, scale) => {
        // Adjust width and height based on scaling
        const effectiveWidth = width / scale;
        const effectiveHeight = height / scale;

        let heightObj = {}
        if (effectiveHeight < 900) {
            heightObj = {
                showMiniFlow: false,
                miniFlow: {
                    width: 0,
                    height: 0
                }
            };
        }

        if (effectiveWidth < 500) {
            return {
                panelWidth: 260 * scale,
                fontSize: 11 * scale,
                padding: 8 * scale,
                showMiniFlow: false,
                miniFlow: { width: 0, height: 0 },
                ...heightObj
            };
        } else if (effectiveWidth < 640) {
            return {
                panelWidth: 280 * scale,
                fontSize: 12 * scale,
                padding: 10 * scale,
                showMiniFlow: false,
                miniFlow: { width: 0, height: 0 },
                ...heightObj
            };
        } else if (effectiveWidth < 700) {
            return {
                panelWidth: 300 * scale,
                fontSize: 12.5 * scale,
                padding: 11 * scale,
                showMiniFlow: true,
                miniFlow: {
                    width: 240,
                    height: 110,
                    nodeWidth: 70,
                    nodeHeight: 23,
                    fontSize: 10,
                    letterSize: 13
                },
                ...heightObj
            };
        } else if (effectiveWidth < 768) {
            return {
                panelWidth: 320 * scale,
                fontSize: 13 * scale,
                padding: 12 * scale,
                showMiniFlow: true,
                miniFlow: {
                    width: 260,
                    height: 120,
                    nodeWidth: 75,
                    nodeHeight: 25,
                    fontSize: 11,
                    letterSize: 14
                },
                ...heightObj
            };
        } else if (effectiveWidth < 1024) {
            return {
                panelWidth: 340 * scale,
                fontSize: 13.5 * scale,
                padding: 13 * scale,
                showMiniFlow: true,
                miniFlow: {
                    width: 280,
                    height: 130,
                    nodeWidth: 80,
                    nodeHeight: 27,
                    fontSize: 11.5,
                    letterSize: 15
                },
                ...heightObj
            };
        } else if (effectiveWidth < 1440) {
            return {
                panelWidth: 360 * scale,
                fontSize: 14 * scale,
                padding: 14 * scale,
                showMiniFlow: true,
                miniFlow: {
                    width: 300,
                    height: 140,
                    nodeWidth: 90,
                    nodeHeight: 30,
                    fontSize: 12,
                    letterSize: 16
                },
                ...heightObj
            };
        } else if (effectiveWidth < 1800) {
            return {
                panelWidth: 400 * scale,
                fontSize: 15 * scale,
                padding: 15 * scale,
                showMiniFlow: true,
                miniFlow: {
                    width: 340,
                    height: 150,
                    nodeWidth: 120,
                    nodeHeight: 32,
                    fontSize: 14,
                    letterSize: 17
                },
                ...heightObj
            };
        } else { // Desktop
            return {
                panelWidth: 460 * scale,
                fontSize: 16 * scale,
                padding: 16 * scale,
                showMiniFlow: true,
                miniFlow: {
                    width: 380,
                    height: 160,
                    nodeWidth: 150,
                    nodeHeight: 35,
                    fontSize: 16,
                    letterSize: 18
                },
                ...heightObj
            };
        }
    };

    const [dimensions, setDimensions] = useState(() =>
        getResponsiveDimensions(window.innerWidth, window.innerHeight, getScalingFactor())
    );

    useEffect(() => {
        const handleResize = () => {
            const width = window.innerWidth;
            const height = window.innerHeight;
            const scale = getScalingFactor();
            setDimensions(prev => {
                const newDimensions = getResponsiveDimensions(width, height, scale);
                if (JSON.stringify(prev) !== JSON.stringify(newDimensions)) {
                    return newDimensions;
                }
                return prev;
            });
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return (
        <ResponsiveContext.Provider value={dimensions}>
            {children}
        </ResponsiveContext.Provider>
    );
};