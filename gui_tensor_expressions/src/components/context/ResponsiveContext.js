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
    const getResponsiveDimensions = (width, height) => {
        let heightObj = {}
        if (height < 1050) {
            heightObj = {
                showMiniFlow: false,
                miniFlow: {
                    width: 0,
                    height: 0
                }
            };
        }

        if (width < 640) {
            return {
                panelWidth: 280,
                fontSize: 12,
                padding: 10,
                showMiniFlow: false,
                miniFlow: {
                    width: 0,
                    height: 0
                },
                ...heightObj
            };
        } else if (width < 768) {
            return {
                panelWidth: 320,
                fontSize: 13,
                padding: 12,
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
        } else if (width < 1920) {
            return {
                panelWidth: 360,
                fontSize: 14,
                padding: 14,
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
        } else { // Desktop
            return {
                panelWidth: 460,
                fontSize: 16,
                padding: 16,
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
        getResponsiveDimensions(window.innerWidth, window.innerHeight)
    );

    useEffect(() => {
        const handleResize = () => {
            const width = window.innerWidth;
            const height = window.innerHeight;
            setDimensions(prev => {
                const newDimensions = getResponsiveDimensions(width, height);
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