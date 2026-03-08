'use client';

import { useState, useEffect } from 'react';

export function usePerformance() {
    const [isLowCapacity, setIsLowCapacity] = useState(false);

    useEffect(() => {
        const checkPerformance = () => {
            // Check for low hardware concurrency (CPU cores)
            const cores = navigator.hardwareConcurrency || 4;

            // Check for low device memory (if supported by browser)
            const memory = (navigator as any).deviceMemory || 4;

            // Definition of low-capacity: < 4 cores OR < 4GB RAM
            if (cores < 4 || memory < 4) {
                setIsLowCapacity(true);
            }
        };

        checkPerformance();
    }, []);

    return { isLowCapacity };
}
