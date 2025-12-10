import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../ui/Buttons/Button';
import { SmartVideo } from '../Videos/SmartVideo';
import type { VideoAsset } from '../Videos/VideoAsset';

interface CTAButton {
    text: string;
    link: string;
}

interface VideoTextColumnSectionProps {
    heading: string | React.ReactNode;
    description: string | React.ReactNode;
    cta?: CTAButton;
    media: VideoAsset;
    mediaPosition?: 'left' | 'right';
}

const VideoTextColumnSection: React.FC<VideoTextColumnSectionProps> = ({
    heading,
    description,
    cta,
    media,
    mediaPosition = 'right'
}) => {
    const textColumn = (
        <div className="lg:col-span-6">
            <div>
                <h2 className="text-3xl sm:text-4xl font-serif text-gray-900 mb-6">
                    {heading}
                </h2>
                <div className="text-lg text-gray-600 font-sans font-light leading-relaxed mb-8">
                    {description}
                </div>

                {cta && (
                    <Link to={cta.link}>
                        <Button variant='primary' size='xs' className='uppercase'>
                            {cta.text}
                        </Button>
                    </Link>
                )}
            </div>
        </div>
    );

    const mediaColumn = (
        <div className="lg:col-span-6">
            <div className="w-full h-full">
                <SmartVideo
                    asset={media}
                    className="w-full min-h-[500px] object-cover"
                    lazy={true}
                    autoPlay={true}
                    loop={true}
                    muted={true}
                    playsInline={true}
                />
            </div>
        </div>
    );

    return (
        <section
            className="min-h-screen py-24 bg-gradient-to-b from-[#f6f3ee] to-[#f3ede6]"
        >
            <div className="max-w-8xl mx-auto px-2 sm:px-6 lg:px-12">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
                    {mediaPosition === 'left' ? (
                        <>
                            {mediaColumn}
                            {textColumn}
                        </>
                    ) : (
                        <>
                            {textColumn}
                            {mediaColumn}
                        </>
                    )}
                </div>
            </div>
        </section>
    );
};

export default VideoTextColumnSection;
