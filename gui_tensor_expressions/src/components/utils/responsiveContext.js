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
    const getScalingFactor = () => {
        const screenWidth = window.screen.width;
        if (screenWidth <= 768) {
            return 0.8;
        }
        return Math.min(window.devicePixelRatio || 1, 1.5);
    };

    const getResponsiveDimensions = (width, height, scale) => {
        const screenWidth = window.screen.width;
        let heightObj = { showMiniFlow: true };

        // Mobile first approach
        if (screenWidth <= 480) {  // Phone
            return {
                panelWidth: Math.min(280, screenWidth * 0.85),
                fontSize: 10,
                padding: 6,
                showMiniFlow: true,
                miniFlow: {
                    width: Math.min(200, screenWidth * 0.7),
                    height: 90,
                    nodeWidth: 50,
                    nodeHeight: 18,
                    fontSize: 8,
                    letterSize: 10
                }
            };
        } else if (screenWidth <= 768) {  // Tablet
            return {
                panelWidth: Math.min(320, screenWidth * 0.6),
                fontSize: 11,
                padding: 8,
                showMiniFlow: true,
                miniFlow: {
                    width: Math.min(240, screenWidth * 0.5),
                    height: 100,
                    nodeWidth: 60,
                    nodeHeight: 20,
                    fontSize: 9,
                    letterSize: 12
                }
            };
        }

        // Desktop sizes based on effective width
        const effectiveWidth = width / scale;

        if (effectiveWidth < 1024) {
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