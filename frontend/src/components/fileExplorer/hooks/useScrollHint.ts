import { useEffect, useState } from 'react';

export const useScrollHint = (breadcrumbsRef: React.RefObject<HTMLDivElement | null>, isEditingPath: boolean, currentPath: string) => {
    const [showScrollHintRight, setShowScrollHintRight] = useState(false);
    const [showScrollHintLeft, setShowScrollHintLeft] = useState(false);

    useEffect(() => {
        const updateScrollHint = () => {
            if (!breadcrumbsRef.current || isEditingPath) {
                setShowScrollHintRight(false);
                setShowScrollHintLeft(false);
                return;
            }

            const { scrollLeft, scrollWidth, clientWidth } = breadcrumbsRef.current;
            const canScrollLeft = scrollLeft > 1;
            const canScrollRight = scrollLeft + clientWidth < scrollWidth - 1;
            setShowScrollHintLeft(canScrollLeft);
            setShowScrollHintRight(canScrollRight);
        };

        updateScrollHint();

        const breadcrumbs = breadcrumbsRef.current;
        if (breadcrumbs) {
            breadcrumbs.addEventListener('scroll', updateScrollHint);
        }

        window.addEventListener('resize', updateScrollHint);

        return () => {
            if (breadcrumbs) {
                breadcrumbs.removeEventListener('scroll', updateScrollHint);
            }
            window.removeEventListener('resize', updateScrollHint);
        };
    }, [breadcrumbsRef, currentPath, isEditingPath]);

    useEffect(() => {
        if (!breadcrumbsRef.current || isEditingPath) return;

        // Auto-scroll to the right when path changes so the latest folder is always visible.
        const timeoutId = setTimeout(() => {
            if (breadcrumbsRef.current) {
                breadcrumbsRef.current.scrollLeft = breadcrumbsRef.current.scrollWidth;
            }
        }, 10);

        return () => clearTimeout(timeoutId);
    }, [breadcrumbsRef, currentPath, isEditingPath]);

    return { showScrollHintLeft, showScrollHintRight };
};
