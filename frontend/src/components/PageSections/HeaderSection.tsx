import React from 'react';
import { Link } from 'react-router-dom';
// import { useState } from 'react';

import { usePaths } from '../../hooks/usePaths';
import type { VideoAsset } from '../Videos/VideoAsset';
import HamburgerMenu from '../ui/HamburgerMenu';
import { SmartVideo } from '../Videos/SmartVideo';

interface HeaderProps {
    logoUrl?: string;
    videoAsset: VideoAsset;
    mainHeading: string;
    description: string;
    children?: React.ReactNode;
    videoHeight?: 'h-screen' | 'h-[70vh]';
}

const HeaderSection: React.FC<HeaderProps> = (headerProps: HeaderProps) => {
    // const [isBtnOnRightHovered, setIsBtnOnRightHovered] = useState(false);
    const paths = usePaths();

    return (
        <section className={`relative ${headerProps.videoHeight} w-full overflow-hidden`}>
            {/* Background Video */}
            <div className="absolute inset-0 z-0">
                <SmartVideo
                    asset={headerProps.videoAsset}
                    autoPlay
                    loop
                    lazy
                    preload="none"
                    className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                />
                {/* Dark overlay for better text readability */}
                <div className="absolute inset-0 bg-black/40" />
            </div>

            {/* Header Navigation */}
            <header className="relative z-[50] flex items-center justify-between px-6 py-3 md:px-12">
                {/* Logo */}
                <Link to={paths.home} className="text-white flex items-center gap-2 min-w-0">
                    {headerProps.logoUrl ? (
                        <img src={headerProps.logoUrl} alt="Library Logo" className="h-10 md:h-12 w-auto max-w-[10rem] md:max-w-[12rem] object-contain flex-shrink-0" />
                    ) : (
                        <>
                            <img src="/logo.svg" alt="Source Library Logo" className="w-10 h-10 md:w-12 md:h-12 flex-shrink-0" />

                            <h1 className="text-l md:text-2xl uppercase tracking-wider font-sans truncate max-w-[9rem] md:max-w-none">
                                <span className="font-bold">Source</span>
                                <span className="font-thin">Library</span>
                            </h1>
                        </>)}
                </Link>

                {/* Right Side - CTA Button + Hamburger Menu */}
                <div className="flex items-center gap-2 md:gap-4">
                    {/* CTA Button (hidden on very small screens) */}
                    {/* <Link to={paths.library} className="hidden sm:block">
                        <button
                            onMouseEnter={() => setIsBtnOnRightHovered(true)}
                            onMouseLeave={() => setIsBtnOnRightHovered(false)}
                            aria-label="Read books at Source Library"
                            className={
                                'relative inline-flex items-center justify-center z-[9999] w-[155px] h-[38px] border-[0.8px] border-white text-white rounded-full bg-transparent overflow-hidden cursor-pointer'
                            }
                        >
                            <div
                                className={
                                    'absolute left-0 top-0 w-full h-[200%] text-[10px] tracking-widest transition-transform duration-500 ease-[cubic-bezier(.2,.65,.2,1)] ' +
                                    (isBtnOnRightHovered ? '-translate-y-1/2' : 'translate-y-0')
                                }
                                aria-hidden={false}
                            >
                                <div className="w-full h-1/2 flex items-center justify-center uppercase">
                                    <span className="font-sans">Explore books</span>
                                </div>
                                <div className="w-full h-1/2 flex items-center justify-center uppercase">
                                    <span className="font-sans">in Source Library</span>
                                </div>
                            </div>
                        </button>
                    </Link> */}

                    {/* Hamburger Menu */}
                    <HamburgerMenu />
                </div>
            </header>

            {(() => {
                const hasChildren = React.Children.count(headerProps.children) > 0;
                const positioningClass = hasChildren
                    ? 'top-[45%] md:top-[50%]'
                    : 'top-[50%]';

                return (
                    <div className={`relative z-10 ${headerProps.videoHeight}`}>
                        <div className={`absolute left-0 w-full -translate-y-1/2 px-6 md:px-12 ${positioningClass}`}>
                            <div className="max-w-2xl">
                                <h2 className="text-4xl md:text-5xl lg:text-6xl font-serif text-white mb-6 leading-tighter tracking-wider">
                                    {headerProps.mainHeading}
                                </h2>
                                <p className="text-lg md:text-xl font-sans font-light text-white/90 mb-8 leading-relaxed max-w-2xl">
                                    {headerProps.description}
                                </p>
                                {headerProps.children && (
                                    <div className="pt-2">
                                        {headerProps.children}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })()}

            {/* Scroll Cue: show the chevron arrow only for full-screen header */}
            {headerProps.videoHeight === 'h-screen' && (
                <div
                    className="absolute left-1/2 -translate-x-1/2 bottom-6 md:bottom-2 z-[60] flex items-center justify-center pointer-events-none"
                    aria-hidden="true"
                >
                    <svg
                        width="28"
                        height="28"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="text-white opacity-95 animate-bounce"
                    >
                        <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </div>
            )}
        </section>
    );
};

export default HeaderSection;
