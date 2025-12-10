import React from 'react';
import { Helmet } from 'react-helmet';

import type { VideoAsset } from '../components/Videos/VideoAsset';
import HeaderSection from '../components/PageSections/HeaderSection';
import FaqSection from '../components/PageSections/FaqSection';
import FooterSection from '../components/PageSections/FooterSection';
// import BookCarousel from '../components/Library/BookCarousel';
import VideoTextColumnSection from '../components/PageSections/VideoTextColumnSection';
import CtaSection from '../components/PageSections/CtaSection';
// TODO: Enable when service is ready
// import SubscriptionForm from '../components/PageSections/SubscriptionForm';

const HomePage: React.FC = () => {
    const headerVideo: VideoAsset = {
        poster: "https://cdn.prod.website-files.com/68d1e7256c545fabb892fb96%2F68d1ec78531116e68d2f7049_embassy-of-the-free-mind-montage-002-poster-00001.jpg",
        sources: [
            { src: "https://cdn.prod.website-files.com/68d800cb1402171531a597f4/68d800cb1402171531a598cf_embassy-of-the-free-mind-montage-002-transcode.webm", type: "video/webm" },
            { src: "https://cdn.prod.website-files.com/68d800cb1402171531a597f4/68d800cb1402171531a598cf_embassy-of-the-free-mind-montage-002-transcode.mp4", type: "video/mp4" },
        ],
        alt: "Ancient book shots behind the hero headline.",
    };

    const aboutVideo: VideoAsset = {
        poster: "https://cdn.prod.website-files.com/68d800cb1402171531a597f4%2F68e10f5fcc92bc704f3e37fd_montage-010-2500-poster-00001.jpg",
        sources: [
            { src: "https://cdn.prod.website-files.com/68d800cb1402171531a597f4%2F68e10f5fcc92bc704f3e37fd_montage-010-2500-transcode.webm", type: "video/webm" },
            { src: "https://cdn.prod.website-files.com/68d800cb1402171531a597f4%2F68e10f5fcc92bc704f3e37fd_montage-010-2500-transcode.mp4", type: "video/mp4" },
        ],
        alt: "Turning pages of ancient book.",
    };

    const patronVideo: VideoAsset = {
        poster: "https://cdn.prod.website-files.com/68d800cb1402171531a597f4%2F68e112598a57a7b5bdb5dd13_montage-011-2500-poster-00001.jpg",
        sources: [
            { src: "https://cdn.prod.website-files.com/68d800cb1402171531a597f4%2F68e112598a57a7b5bdb5dd13_montage-011-2500-transcode.webm", type: "video/webm" },
            { src: "https://cdn.prod.website-files.com/68d800cb1402171531a597f4%2F68e112598a57a7b5bdb5dd13_montage-011-2500-transcode.mp4", type: "video/mp4" },
        ],
        alt: "Turning pages of ancient book.",
    };

    const faqData = [
        {
            question: "What is the Source Library?",
            answer: "The Source Library is a public digital archive of rare Hermetic, esoteric, and humanist texts. It combines high-quality scans, OCR, and translations to make these works accessible to scholars, researchers, and AI systems."
        },
        {
            question: "Why are these books important for AI?",
            answer: "Artificial intelligence is rapidly becoming a central part of how we live, work, and learn. Yet many tens of thousands of ancient books, including European works from 1450–1700 and millions of global manuscripts, have never been digitized or translated. Without these texts, AI systems are missing core components of humanist, Hermetic, and esoteric knowledge that are essential for understanding our intellectual and cultural heritage."
        },
        {
            question: "How can I explore the books?",
            answer: "Users can browse the Source Library online. Each book links to scans, OCR text, and translations, allowing detailed study or integration into AI research."
        },
        {
            question: "How are the translations produced?",
            answer: "Translations are generated using a combination of human expertise and AI tools. All translations are tied to the original scans and improved over time through version-controlled review and community collaboration, ensuring high-quality, citable editions."
        },
        {
            question: "How can I support or get involved?",
            answer: "You can become a patron, contribute to our digitization efforts, or help scan and preserve rare texts. Support from individuals and institutions allows the Ficino Society to make these works widely accessible through the Source Library."
        }
    ]

    return (
        <div className="min-h-screen">
            {/* Meta Tags for SEO */}
            <Helmet>
                <title>Source Library</title>
                <meta property="og:title" content="Source Library" />
                <meta
                    property="og:description"
                    content="Scanning and translating rare Hermetic and esoteric texts to make them accessible to scholars, seekers, and AI systems."
                />
                <meta property="og:image" content={headerVideo.poster} />
                <meta property="og:url" content={window.location.href} />
                <meta property="og:type" content="home" />
                <meta property="og:author" content="Playpower Labs" />
            </Helmet>

            <HeaderSection
                videoAsset={headerVideo}
                mainHeading="Unlock a New Renaissance of Ancient Knowledge"
                description="Source Library is scanning and translating rare Hermetic and esoteric texts to make them accessible to scholars, seekers, and AI systems."
                videoHeight="h-screen"
            >
                {/* Add an arrow to convey user to scroll down */}

                {/* TODO: Enable when service is ready */}
                {/* <SubscriptionForm
                    title="Join our mailing list."
                    placeholder="Enter your email..."
                    buttonText="Submit"
                    containerClassName="bg-white/10 backdrop-blur-sm border border-white/30 rounded-lg p-6 max-w-md"
                    titleClassName="text-xl font-sans font-thin text-white mb-4"
                    formClassName="space-y-4"
                    inputClassName="w-full px-4 py-3 bg-white/90 text-gray-900 placeholder-gray-500 border border-white/50 rounded-md focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent font-sans"
                    buttonClassName="w-full px-6 py-3 bg-white text-black font-sans font-medium rounded-md hover:bg-gray-100 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-transparent"
                />*/}
            </HeaderSection>

            {/* <BookCarousel /> */}

            {/* About Section */}
            <VideoTextColumnSection
                heading="Source Library continues the Ficino Society's mission to transform transform >2500 years of wisdom texts into a living archive. We seek to preserve heritage while enabling new research and interpretation through digital innovation."
                description={<>The Ficino Society is based at the Embassy of the Free Mind in Amsterdam, home to the Bibliotheca Philosophica Hermetica, recognized by UNESCO’s Memory of the World Register. This collection contains rare works on Hermetic philosophy, alchemy, Neoplatonist mystical literature and even magic. The library specializes in the source texts of Rosicrucianism, Freemasonry, and the Kabbalah. It's collections extend to Sufi poets and Taoist alchemists. It also contains writings of Amsterdam's freethinkers — including Spinoza and Comenius.
                    <br />Source Library seeks to answer a vital question: how can such a collection remain meaningful and accessible in the 21st century—without losing its depth or integrity? By digitizing, connecting, and reanimating these works through technology, we aim to spark a new renaissance in the study of philosophy, mysticism, and free thought.</>}
                cta={{ text: "Learn More", link: "/about" }}
                media={aboutVideo}
                mediaPosition="right"
            />

            {/* Patron Section */}
            <VideoTextColumnSection
                heading="Support our Mission."
                description={
                    <>
                        <p>
                            During the Renaissance, Latin translations of ancient texts, like Plato, helped inspire thousands of people across Europe. Source Library seeks to continue this tradition by digitizing and translating thousands of rare texts from 1450-1699.
                        </p>
                        <br />
                        <p>
                            We hope our translations can help inspire people across the world. And maybe—just maybe—we can help contribute to a new renaissance.
                        </p>
                        <br />
                        <p>
                            We invite you to contribute!
                        </p>
                    </>
                }
                media={patronVideo}
                mediaPosition="left"
            // TODO: Enable when service is ready
            // cta={{ text: "Make A Donation", link: "/patron" }}
            />

            <FaqSection
                description="Explore Source Library and our mission. Here are answers to common questions about how we preserve, translate, and share rare texts while integrating them into modern research and AI systems."
                showContactCTA={false}
                faqs={faqData}
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
};

export default HomePage;
