'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

      // Avoid hydration mismatch
        useEffect(() => setMounted(true), []);

          if (!mounted) {
              return (
                    <button
                            className="w-9 h-9 rounded-lg border border-gray-700 flex items-center justify-center opacity-0"
                                    aria-label="Toggle theme"
                                          />
                                              );
                                                }

                                                  const isDark = resolvedTheme === 'dark';

                                                    return (
                                                        <button
                                                              onClick={() => setTheme(isDark ? 'light' : 'dark')}
                                                                    className="w-9 h-9 rounded-lg border border-gray-700 dark:border-gray-700 light:border-gray-300 flex items-center justify-center transition-all duration-200 hover:border-orange-500/60 hover:bg-orange-500/10 text-gray-400 hover:text-orange-400"
                                                                          aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                                                                                title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                                                                                    >
                                                                                          {isDark ? (
                                                                                                  // Sun icon for switching to light
                                                                                                          <svg
                                                                                                                    xmlns="http://www.w3.org/2000/svg"
                                                                                                                              width="16"
                                                                                                                                        height="16"
                                                                                                                                                  viewBox="0 0 24 24"
                                                                                                                                                            fill="none"
                                                                                                                                                                      stroke="currentColor"
                                                                                                                                                                                strokeWidth="2"
                                                                                                                                                                                          strokeLinecap="round"
                                                                                                                                                                                                    strokeLinejoin="round"
                                                                                                                                                                                                            >
                                                                                                                                                                                                                      <circle cx="12" cy="12" r="4" />
                                                                                                                                                                                                                                <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
                                                                                                                                                                                                                                        </svg>
                                                                                                                                                                                                                                              ) : (
                                                                                                                                                                                                                                                      // Moon icon for switching to dark
                                                                                                                                                                                                                                                              <svg
                                                                                                                                                                                                                                                                        xmlns="http://www.w3.org/2000/svg"
                                                                                                                                                                                                                                                                                  width="16"
                                                                                                                                                                                                                                                                                            height="16"
                                                                                                                                                                                                                                                                                                      viewBox="0 0 24 24"
                                                                                                                                                                                                                                                                                                                fill="none"
                                                                                                                                                                                                                                                                                                                          stroke="currentColor"
                                                                                                                                                                                                                                                                                                                                    strokeWidth="2"
                                                                                                                                                                                                                                                                                                                                              strokeLinecap="round"
                                                                                                                                                                                                                                                                                                                                                        strokeLinejoin="round"
                                                                                                                                                                                                                                                                                                                                                                >
                                                                                                                                                                                                                                                                                                                                                                          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                                                                                                                                                                                                                                                                                                                                                                                  </svg>
                                                                                                                                                                                                                                                                                                                                                                                        )}
                                                                                                                                                                                                                                                                                                                                                                                            </button>
                                                                                                                                                                                                                                                                                                                                                                                              );
                                                                                                                                                                                                                                                                                                                                                                                              }