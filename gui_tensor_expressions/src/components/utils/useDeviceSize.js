import { useState, useEffect } from 'react';

const useDeviceSize = () => {
    const [dimensions, setDimensions] = useState({
        width: window.innerWidth,
        height: window.innerHeight,
        isMobile: window.innerWidth <= 480,
        isTablet: window.innerWidth > 480 && window.innerWidth <= 1024,
        isDesktop: window.innerWidth > 1024
    });

    useEffect(() => {
        const handleResize = () => {
            const width = window.innerWidth;
            setDimensions({
                width,
                height: window.innerHeight,
                isMobile: width <= 480,
                isTablet: width > 480 && width <= 1024,
                isDesktop: width > 1024
            });
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const getInfoPanelDimensions = () => {
        const { width, isMobile, isTablet } = dimensions;

        if (isMobile) {
            const panelWidth = Math.min(280, width * 0.85);
            return {
                panelWidth,
                fontSize: 11,
                padding: 8,
                showMiniFlow: true,
                miniFlow: {
                    width: Math.min(160, panelWidth * 0.8), // Relative to panel width
                    height: 100,
                    nodeWidth: 100,
                    nodeHeight: 16,
                    fontSize: 10,
                    letterSize: 11
                }
            };
        }

        if (isTablet) {
            const panelWidth = Math.min(300, width * 0.4);
            return {
                panelWidth,
                fontSize: 12,
                padding: 6,
                showMiniFlow: true,
                miniFlow: {
                    width: Math.min(200, panelWidth * 0.8), // Relative to panel width
                    height: 100,
                    nodeWidth: 100,
                    nodeHeight: 18,
                    fontSize: 12,
                    letterSize: 12
                }
            };
        }

        // Desktop
        const panelWidth = 360;
        return {
            panelWidth,
            fontSize: 14,
            padding: 10,
            showMiniFlow: true,
            miniFlow: {
                width: Math.min(280, panelWidth * 0.8), // Relative to panel width
                height: 140,
                nodeWidth: 120,
                nodeHeight: 35,
                fontSize: 18,
                letterSize: 20
            }
        };
    };

    return { ...dimensions, getInfoPanelDimensions };
};

export default useDeviceSize;
