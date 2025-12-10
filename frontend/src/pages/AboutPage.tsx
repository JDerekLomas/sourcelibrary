import HeaderSection from "../components/PageSections/HeaderSection";
import FooterSection from "../components/PageSections/FooterSection";
import VideoTextColumnSection from "../components/PageSections/VideoTextColumnSection";
import CtaSection from "../components/PageSections/CtaSection";
import type { VideoAsset } from "../components/Videos/VideoAsset";

const AboutPage: React.FC = () => {
    const headerVideo: VideoAsset = {
        poster: "https://cdn.prod.website-files.com/68d800cb1402171531a597f4%2F68e10f5fcc92bc704f3e37fd_montage-010-2500-poster-00001.jpg",
        sources: [
            { src: "https://cdn.prod.website-files.com/68d800cb1402171531a597f4%2F68e10f5fcc92bc704f3e37fd_montage-010-2500-transcode.webm", type: "video/webm" },
            { src: "https://cdn.prod.website-files.com/68d800cb1402171531a597f4%2F68e10f5fcc92bc704f3e37fd_montage-010-2500-transcode.mp4", type: "video/mp4" },
        ],
        alt: "Embassy of the Free Mind - interior and exterior shots.",
    };

    const patronSectionVideo: VideoAsset = {
        poster: "https://cdn.prod.website-files.com/68d800cb1402171531a597f4%2F68e11368476249a2fbe4a6fd_montage-012-2500-poster-00001.jpg",
        sources: [
            { src: "https://cdn.prod.website-files.com/68d800cb1402171531a597f4%2F68e11368476249a2fbe4a6fd_montage-012-2500-transcode.webm", type: "video/webm" },
            { src: "https://cdn.prod.website-files.com/68d800cb1402171531a597f4%2F68e11368476249a2fbe4a6fd_montage-012-2500-transcode.mp4", type: "video/mp4" },
        ],
        alt: "Close-up turning pages of ancient book."
    };

    const visitEmbassyVideo: VideoAsset = {
        poster: "https://cdn.prod.website-files.com/68d800cb1402171531a597f4%2F68e0f7bc9caeb5a751077a00_montage-006-2500-poster-00001.jpg",
        sources: [
            { src: "https://cdn.prod.website-files.com/68d800cb1402171531a597f4%2F68e0f7bc9caeb5a751077a00_montage-006-2500-transcode.webm", type: "video/webm" },
            { src: "https://cdn.prod.website-files.com/68d800cb1402171531a597f4%2F68e0f7bc9caeb5a751077a00_montage-006-2500-transcode.mp4", type: "video/mp4" },
        ],
        alt: "Hero shots of Bibliotheca Philosophica Hermetica"
    };

    const sourceLibraryVideo: VideoAsset = {
        poster: "https://cdn.prod.website-files.com/68d800cb1402171531a597f4/68d800cb1402171531a598ff_blog-AI%20and%20the%20Preservation%20of%20Wisdom-inst-001.avif",
        sources: [],
    };

    return (
        <div className="min-h-screen">
            <HeaderSection
                mainHeading="Ancient Wisdom, Digitally Reborn"
                description="Source Library is an extension of the Ficino Society helping transform ancient philosophy into living knowledge for the digital age."
                videoAsset={headerVideo}
                videoHeight="h-[70vh]"
            />

            {/* Patron Section */}
            <VideoTextColumnSection
                heading="Source Library transforms 2000 years of wisdom into a living archive — preserving the past while enabling new research and interpretation through digital innovation."
                description="The Ficino Society is devoted to the recovery and renewal of ancient knowledge. In the fifteenth century, Marsilio Ficino, under the patronage of the Medici, translated Plato, the Hermetica, and other works that helped ignite the Renaissance. Yet many of Ficino's own writings, including his 1497 compendium De Mysteriis, remain untranslated. By digitizing and translating these texts, and feeding them into AI systems to expand future knowledge, Source Library seeks to spark a modern renaissance in the study of hermetic and free thought."
                // cta={{ text: "Become a Patron", link: "/patron" }} // TODO: Enable when service is ready
                media={patronSectionVideo}
                mediaPosition="right"
            />

            {/* Bibliotheca Philosophica Hermetica at Embassy */}
            <VideoTextColumnSection
                heading="The Bibliotheca Philosophica Hermetica at the Embassy of the Free Mind"
                description="At the center of the Society's work is the Bibliotheca Philosophica Hermetica, recognized by UNESCO's Memory of the World Register. This collection holds rare works on Hermetic philosophy, alchemy, Rosicrucianism, Freemasonry, Kabbalah, mysticism, magic, astrology, tarot, Sufism, Taoism, and more. It also preserves writings from Amsterdam's freethinkers, including Spinoza, Coornhert, Adriaan Koerbagh, and Jan Amos Comenius. The challenge and opportunity before us is to make this vast collection accessible and useful in the 21st century without compromising its depth or integrity."
                // cta={{ text: "Visit the Embassy", link: "" }} // TODO: Enable when service is ready
                media={visitEmbassyVideo}
                mediaPosition="left"
            />

            {/* Source Library Section */}
            <VideoTextColumnSection
                heading="The Source Library"
                description="Source Library is the digital extension of the Ficino Society’s mission, providing public access to these rare texts for scholars and AI systems alike. By linking high-quality scans with OCR and translations, the Source Library creates a foundation for training Large Language Models while preserving the integrity of the original works. Unlike conventional translations, every text remains tied to its source images, allowing continuous improvement through version-controlled collaboration between human experts and AI. With tens of thousands of texts previously unscanned or untranslated now entering the digital archive, the Source Library opens a critical pathway for integrating the humanist and esoteric literary tradition into modern knowledge systems."
                cta={{ text: "Explore our Collection", link: "/library" }}
                media={sourceLibraryVideo}
                mediaPosition="right"
            />

            <CtaSection
                eyebrow="Digital Preservation Project"
                heading="From Manuscript to Modern Consciousness"
                description="Join Source Library in making rare works accessible to scholars and seekers through careful digitization and translation."
            // TODO: Enable when service is ready
            // buttons={[
            //     { text: "Contact Us", link: "/contact" },
            //     { text: "Become a Patron", link: "/patron" }
            // ]}
            />

            <FooterSection />
        </div>
    );
}

export default AboutPage;