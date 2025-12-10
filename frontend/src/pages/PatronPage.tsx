import HeaderSection from "../components/PageSections/HeaderSection";
import FooterSection from "../components/PageSections/FooterSection";
import VideoTextColumnSection from "../components/PageSections/VideoTextColumnSection";
import type { VideoAsset } from "../components/Videos/VideoAsset";

const AboutPage: React.FC = () => {
    const headerVideo: VideoAsset =
    {
        poster: "https://cdn.prod.website-files.com/68d800cb1402171531a597f4%2F68e105653e2a76afea950fab_montage-009-2500-poster-00001.jpg",
        sources: [
            { src: "https://cdn.prod.website-files.com/68d800cb1402171531a597f4%2F68e105653e2a76afea950fab_montage-009-2500-transcode.webm", type: "video/webm" },
            { src: "https://cdn.prod.website-files.com/68d800cb1402171531a597f4%2F68e105653e2a76afea950fab_montage-009-2500-transcode.mp4", type: "video/mp4" },
        ],
        alt: "Montage of reading a book.",
    }

    const patronSectionVideo: VideoAsset = {
        poster: "https://cdn.prod.website-files.com/68d800cb1402171531a597f4%2F68e1129e0fa91a57971a94e7_Embassy%20of%20the%20Free%20Mind%20-%20montage%20004-2000-poster-00001.jpg",
        sources: [
            { src: "https://cdn.prod.website-files.com/68d800cb1402171531a597f4%2F68e1129e0fa91a57971a94e7_Embassy%20of%20the%20Free%20Mind%20-%20montage%20004-2000-transcode.webm", type: "video/webm" },
            { src: "https://cdn.prod.website-files.com/68d800cb1402171531a597f4%2F68e1129e0fa91a57971a94e7_Embassy%20of%20the%20Free%20Mind%20-%20montage%20004-2000-transcode.mp4", type: "video/webm" },
        ],
        alt: "Tour of embassy and library."
    };


    return (
        <div className="min-h-screen">
            <HeaderSection
                mainHeading="Become a Partner"
                description="Join a community preserving and providing free access to hidden knowledge for all."
                videoAsset={headerVideo}
                videoHeight="h-[70vh]"
            />

            <VideoTextColumnSection
                heading={<>Support our mission.<br />Become a patron.</>}
                description="The Renaissance blossomed when patrons preserved hidden wisdom and made it available to seekers. Source Library continues that tradition, digitizing and illuminating thousands of texts on hermeticism, alchemy, and esotericism with modern tools of technology. Today, new advances in AI and machine learning allow us to remetabolize knowledge, transforming how research is conducted, connected, and shared across disciplines. If you believe wisdom should be free for all, become a patron of this new renaissance."
                cta={{ text: "Make a Donation", link: "" }}
                media={patronSectionVideo}
                mediaPosition="left"
            />

            <FooterSection />
        </div>
    )
};

export default AboutPage;