import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { MoonOutlined, SunOutlined } from '@ant-design/icons';

const getInitialTheme = () => {
    if (typeof window === 'undefined') return 'light';
    return localStorage.getItem('theme') || 'light';
};

const applyThemeToDom = (nextTheme) => {
    if (typeof document === 'undefined') return;
    if (nextTheme === 'dark') {
        document.documentElement.classList.add('dark');
        document.body.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
        document.body.classList.remove('dark');
    }
    localStorage.setItem('theme', nextTheme);
};

const ThemeToggle = () => {
    const [theme, setTheme] = useState(getInitialTheme);

    useEffect(() => {
        applyThemeToDom(theme);
    }, [theme]);

    const toggleTheme = (e) => {
        const isDark = theme === 'dark';
        const nextTheme = isDark ? 'light' : 'dark';

        if (typeof document !== 'undefined' && document.startViewTransition) {
            const x = e.clientX;
            const y = e.clientY;
            const endRadius = Math.hypot(
                Math.max(x, window.innerWidth - x),
                Math.max(y, window.innerHeight - y)
            );

            const transition = document.startViewTransition(() => {
                setTheme(nextTheme);
                applyThemeToDom(nextTheme);
            });

            transition.ready.then(() => {
                document.documentElement.animate(
                    {
                        clipPath: [
                            `circle(0px at ${x}px ${y}px)`,
                            `circle(${endRadius}px at ${x}px ${y}px)`,
                        ],
                    },
                    {
                        duration: 500,
                        easing: 'ease-in-out',
                        pseudoElement: '::view-transition-new(root)',
                    }
                );
            });
        } else {
            setTheme(nextTheme);
            applyThemeToDom(nextTheme);
        }
    };

    const MotionDiv = motion.div;

    return (
        <button
            type="button"
            onClick={toggleTheme}
            className="theme-toggle-btn btn-expand"
            aria-label="Toggle theme"
            style={{
                background: 'var(--white)',
                border: 'none',
                cursor: 'pointer',
                padding: '8px',
                height: '36px',
                width: '36px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'inherit',
                fontSize: '20px',
                transition: 'background 0.3s ease',
            }}
        >
            <AnimatePresence mode="wait" initial={false}>
                <MotionDiv
                    key={theme}
                    initial={{ y: -20, opacity: 0, rotate: -90 }}
                    animate={{ y: 0, opacity: 1, rotate: 0 }}
                    exit={{ y: 20, opacity: 0, rotate: 90 }}
                    transition={{ duration: 0.2 }}
                >
                    {theme === 'dark' ? <MoonOutlined /> : <SunOutlined />}
                </MotionDiv>
            </AnimatePresence>
        </button>
    );
};

export default ThemeToggle;
