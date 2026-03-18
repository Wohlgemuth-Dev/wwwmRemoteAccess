import { useEffect, useState } from 'react';

export const useScrollHint = (breadcrumbsRef: React.RefObject<HTMLDivElement | null>, isEditingPath: boolean, currentPath: string) => {
    const [showScrollHint, setShowScrollHint] = useState(false);

    useEffect(() => {
        const updateScrollHint = () => {
            if (!breadcrumbsRef.current || isEditingPath) {
                setShowScrollHint(false);
                return;
            }

            const { scrollLeft, scrollWidth, clientWidth } = breadcrumbsRef.current;
            const canScrollRight = scrollLeft + clientWidth < scrollWidth - 1;
            setShowScrollHint(canScrollRight);
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

    return { showScrollHint };
};
