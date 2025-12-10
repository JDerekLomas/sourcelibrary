import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../ui/Buttons/Button';
import { SmartVideo } from '../Videos/SmartVideo';
import type { VideoAsset } from '../Videos/VideoAsset';

interface CtaSectionProps {
    eyebrow: string;
    heading: string;
    description: string;
    videoAsset?: VideoAsset;
    buttons?: {
        text: string;
        link: string;
    }[];
}

const defaultVideo: VideoAsset = {
    poster: "https://cdn.prod.website-files.com/685c0c56e89c071408e1eeeb%2F68615ad9cd86a99fd739e0b0_Embassy%20of%20the%20Free%20Mind%20-%20montage%20004-2000-poster-00001.jpg",
    sources: [
        { src: "https://cdn.prod.website-files.com/685c0c56e89c071408e1eeeb%2F68615ad9cd86a99fd739e0b0_Embassy%20of%20the%20Free%20Mind%20-%20montage%20004-2000-transcode.webm", type: "video/webm" },
        { src: "https://cdn.prod.website-files.com/685c0c56e89c071408e1eeeb%2F68615ad9cd86a99fd739e0b0_Embassy%20of%20the%20Free%20Mind%20-%20montage%20004-2000-transcode.mp4", type: "video/mp4" },
    ],
    alt: "Woman leading inside the embassy."
}

const CtaSection: React.FC<CtaSectionProps> = ({
    eyebrow,
    heading,
    description,
    videoAsset = defaultVideo,
    buttons = []
}) => {
    return (
        <section className="relative min-h-screen flex flex-col items-center justify-center bg-black py-20">
            {/* Content Container */}
            <div className="relative z-10 max-w-8xl mx-auto px-6 text-center mb-12">
                <p className="uppercase text-xs md:text-sm uppercase font-light text-gray-300 mb-3">
                    {eyebrow}
                </p>

                <h2 className="max-w-4xl mx-auto text-5xl md:text-6xl lg:text-7xl font-serif mb-10 text-white leading-relaxed">
                    {heading}
                </h2>

                <p className="font-sans font-light md:text-lg text-gray-300 mb-5 leading-relaxed">
                    {description}
                </p>

                {buttons.length > 0 && (
                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                        {buttons.map((button, index) => (
                            <Link key={index} to={button.link}>
                                <Button
                                    variant='primary'
                                    size='xs'
                                    className="px-8 py-3 bg-transparent border-[1px] border-gray-400 text-white hover:bg-white hover:text-black transition-all duration-300 text-xs tracking-[0.2em] uppercase font-light"
                                >
                                    {button.text}
                                </Button>
                            </Link>
                        ))}
                    </div>
                )}
            </div>

            {/* Video Background - positioned at bottom half */}
            <div className="relative w-full max-w-6xl mx-auto px-6">
                <div className="aspect-[16/9] overflow-hidden rounded-sm shadow-2xl">
                    <SmartVideo
                        asset={videoAsset}
                        className="w-full h-full object-cover"
                        lazy={true}
                        autoPlay={true}
                        loop={true}
                        muted={true}
                        playsInline={true}
                    />
                </div>
            </div>
        </section>
    );
};

export default CtaSection;
