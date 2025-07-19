/**
 * Debounce utility function for performance optimization
 * 
 * This module provides debouncing functionality to limit the rate at which
 * functions can fire, particularly useful for search inputs and event handlers.
 */

/**
 * Creates a debounced version of the provided function that delays invoking
 * until after wait milliseconds have elapsed since the last time it was invoked.
 * 
 * @param func - The function to debounce
 * @param wait - The number of milliseconds to delay
 * @returns A debounced version of the function
 * 
 * @example
 * ```typescript
 * const debouncedSearch = debounce((query: string) => {
 *     performSearch(query);
 * }, 300);
 * 
 * // Will only execute after 300ms of no calls
 * debouncedSearch('search term');
 * ```
 */
export function debounce<T extends (...args: any[]) => any>(func: T, wait: number): T {
    let timeout: NodeJS.Timeout;
    
    return ((...args: any[]) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    }) as T;
}

/**
 * Creates a debounced version of an async function
 * 
 * @param func - The async function to debounce
 * @param wait - The number of milliseconds to delay
 * @returns A debounced version of the async function
 * 
 * @example
 * ```typescript
 * const debouncedAsyncSearch = debounceAsync(async (query: string) => {
 *     return await searchAPI(query);
 * }, 300);
 * ```
 */
export function debounceAsync<T extends (...args: any[]) => Promise<any>>(
    func: T, 
    wait: number
): (...args: Parameters<T>) => Promise<ReturnType<T>> {
    let timeout: NodeJS.Timeout;
    
    return (...args: Parameters<T>): Promise<ReturnType<T>> => {
        return new Promise((resolve, reject) => {
            clearTimeout(timeout);
            timeout = setTimeout(async () => {
                try {
                    const result = await func.apply(this, args);
                    resolve(result);
                } catch (error) {
                    reject(error);
                }
            }, wait);
        });
    };
}

/**
 * Creates a throttled version of the provided function that only invokes
 * at most once per every wait milliseconds.
 * 
 * @param func - The function to throttle
 * @param wait - The number of milliseconds to throttle invocations to
 * @returns A throttled version of the function
 * 
 * @example
 * ```typescript
 * const throttledScroll = throttle((event: Event) => {
 *     handleScroll(event);
 * }, 100);
 * ```
 */
export function throttle<T extends (...args: any[]) => any>(func: T, wait: number): T {
    let inThrottle: boolean;
    
    return ((...args: any[]) => {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, wait);
        }
    }) as T;
}

/**
 * Creates a function that will only execute once, regardless of how many times it's called
 * 
 * @param func - The function to execute only once
 * @returns A function that will only execute once
 * 
 * @example
 * ```typescript
 * const initializeOnce = once(() => {
 *     console.log('This will only run once');
 * });
 * 
 * initializeOnce(); // Logs message
 * initializeOnce(); // Does nothing
 * ```
 */
export function once<T extends (...args: any[]) => any>(func: T): T {
    let called = false;
    let result: ReturnType<T>;
    
    return ((...args: any[]) => {
        if (!called) {
            called = true;
            result = func.apply(this, args);
        }
        return result;
    }) as T;
}
