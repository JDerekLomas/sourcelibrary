import React from "react";
import { VideoAsset } from "../components/Videos/VideoAsset";
import HeaderSection from "../components/PageSections/HeaderSection";
import FeaturedBooksSection from "../components/Library/FeaturedBooksSection";
import AllBooks from "../components/Library/AllBooks";
import FooterSection from "../components/PageSections/FooterSection";
// TODO: Enable when service is ready
// import ContactSection from "../components/PageSections/ContactSection";

import { useTenant } from "../contexts/TenantContext";

const LibraryPage: React.FC = () => {
    const tenantBranding = useTenant()?.tenantConfig;

    const headerVideo: VideoAsset = {
        poster: "https://cdn.prod.website-files.com/68d800cb1402171531a597f4%2F68e1062dbac9120c0c408088_montage-007-2500-poster-00001.jpg",
        sources: [
            { src: tenantBranding?.header_video_url || "https://cdn.prod.website-files.com/68d800cb1402171531a597f4%2F68e1062dbac9120c0c408088_montage-007-2500-transcode.webm", type: "video/webm" },
            { src: "https://cdn.prod.website-files.com/68d800cb1402171531a597f4%2F68e1062dbac9120c0c408088_montage-007-2500-transcode.mp4", type: "video/mp4" },
        ],
        alt: "Library full of books.",
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <HeaderSection
                logoUrl={tenantBranding?.logo_url || ""}
                videoAsset={headerVideo}
                videoHeight="h-[70vh]"
                mainHeading={tenantBranding?.heading_text || "Explore the Library"}
                description={tenantBranding?.subheading_text || "Rare texts are preserved and made accessible through high-quality scans, OCR, and translation."}
            />

            <FeaturedBooksSection />

            <AllBooks />

            {/* TODO: Enable when service is ready */}
            {/* <ContactSection /> */}

            <FooterSection />
        </div>
    );
};

export default LibraryPage;
