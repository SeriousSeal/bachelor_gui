import { useState, useEffect } from 'react';

const useDeviceSize = () => {
    const getEffectiveWidth = () => {
        const dpr = window.devicePixelRatio || 1;
        const effectiveWidth = window.innerWidth;
        // Scale breakpoints based on DPR for high-res devices
        const scaledBreakpoints = {
            mobile: 480 * dpr,
            tablet: 1024 * dpr
        };

        return {
            width: effectiveWidth,
            isMobile: effectiveWidth <= scaledBreakpoints.mobile,
            isTablet: effectiveWidth > scaledBreakpoints.mobile && effectiveWidth <= scaledBreakpoints.tablet,
            isDesktop: effectiveWidth > scaledBreakpoints.tablet
        };
    };

    const [dimensions, setDimensions] = useState(getEffectiveWidth());

    useEffect(() => {
        const handleResize = () => setDimensions(getEffectiveWidth());
        window.addEventListener('resize', handleResize);
        window.addEventListener('orientationchange', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('orientationchange', handleResize);
        };
    }, []);

    const getInfoPanelDimensions = () => {
        const { width } = dimensions;

        // Base sizes on effective viewport width
        const baseSize = Math.min(width, 1920); // Cap at 1920px
        const relativeFactor = baseSize / 1920; // 1920 as reference width

        if (dimensions.isMobile) {
            const panelWidth = Math.min(280, width * 0.95);
            return {
                panelWidth,
                fontSize: Math.max(12, 12 * relativeFactor),
                padding: Math.max(8, 10 * relativeFactor),
                showMiniFlow: true,
                miniFlow: {
                    width: Math.min(200, panelWidth * 0.9),
                    height: Math.max(100, 120 * relativeFactor),
                    nodeWidth: Math.min(100, 120 * relativeFactor),
                    nodeHeight: Math.max(20, 24 * relativeFactor),
                    fontSize: Math.max(11, 12 * relativeFactor),
                    letterSize: Math.max(12, 14 * relativeFactor)
                }
            };
        }

        if (dimensions.isTablet) {
            const panelWidth = Math.min(300, width * 0.5);
            return {
                panelWidth,
                fontSize: Math.max(12, 12 * relativeFactor),
                padding: Math.max(8, 10 * relativeFactor),
                showMiniFlow: true,
                miniFlow: {
                    width: 250,
                    height: 100,
                    nodeWidth: 100,
                    nodeHeight: Math.max(20, 24 * relativeFactor),
                    fontSize: Math.max(15, 12 * relativeFactor),
                    letterSize: Math.max(12, 14 * relativeFactor)
                }
            };
        }

        // Desktop
        const panelWidth = Math.min(360, width * 0.3);
        return {
            panelWidth,
            fontSize: Math.max(12, 14 * relativeFactor),
            padding: Math.max(8, 10 * relativeFactor),
            showMiniFlow: true,
            miniFlow: {
                width: Math.min(260, panelWidth * 0.8),
                height: Math.max(120, 140 * relativeFactor),
                nodeWidth: 120,
                nodeHeight: Math.max(30, 35 * relativeFactor),
                fontSize: 16,
                letterSize: Math.max(18, 20 * relativeFactor)
            }
        };
    };

    return { ...dimensions, getInfoPanelDimensions };
};

export default useDeviceSize;
