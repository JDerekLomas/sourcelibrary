import React from 'react';
import HeaderSection from '../components/PageSections/HeaderSection';
import ContactSection from '../components/PageSections/ContactSection';
import FooterSection from '../components/PageSections/FooterSection';
import { VideoAsset } from '../components/Videos/VideoAsset';

const ContactPage: React.FC = () => {
    const headerVideo: VideoAsset =
    {
        poster: "https://cdn.prod.website-files.com/68d800cb1402171531a597f4%2F68e105653e2a76afea950fab_montage-009-2500-poster-00001.jpg",
        sources: [
            { src: "https://cdn.prod.website-files.com/68d800cb1402171531a597f4%2F68e105653e2a76afea950fab_montage-009-2500-transcode.webm", type: "video/webm" },
            { src: "https://cdn.prod.website-files.com/68d800cb1402171531a597f4%2F68e105653e2a76afea950fab_montage-009-2500-transcode.mp4", type: "video/mp4" },
        ],
        alt: "Montage of reading a book.",
    }
    return (
        <div>
            <HeaderSection
                videoAsset={headerVideo}
                videoHeight="h-[70vh]"
                mainHeading="Contact Us"
                description="From research and translation to patronage and partnership, there are many ways to be part of our work."
            />
            <ContactSection />
            <FooterSection />
        </div>
    );
};

export default ContactPage;
