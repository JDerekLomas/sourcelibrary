import React from 'react';
import { Link } from 'react-router-dom';

import { usePaths } from '../../hooks/usePaths';
// TODO: Enable when service is ready
// import SubscriptionForm from './SubscriptionForm';

const FooterSection: React.FC = () => {
    const paths = usePaths();

    return (
        // make footer a vertical flex container so content stays top and links sit at bottom
        <footer className="min-h-screen flex flex-col justify-between bg-gradient-to-b from-[#f6f3ee] to-[#f3ede6] py-[40px]">
            {/* Content aligned with hero section */}
            <div className="px-6 md:px-12">
                {/* Main Heading */}
                <h2 className="text-5xl md:text-6xl lg:text-7xl font-serif text-gray-900 mb-8 leading-tight max-w-4xl">
                    Initiation is to be open for information.
                </h2>

                {/* Description */}
                <p className="text-lg md:text-xl font-sans text-gray-700 leading-relaxed max-w-3xl mb-12">
                    The Renaissance was born because patrons stepped forward to preserve and share hidden wisdom. Source Library is an extension of the Ficino Society that's continuing the tradition — illuminating 1000's of texts on hermeticism, alchemy, and esotericism to the world. If you believe knowledge should be free for all, consider becoming a modern patron of wisdom.
                </p>

                {/* TODO: Enable when service is ready */}
                {/* Email Signup */}
                {/* <SubscriptionForm
                    title="Join our list for project news, digital releases, and opportunities."
                    placeholder="Sign up with email"
                    buttonText="Submit"
                    containerClassName="mb-16"
                    titleClassName="text-2xl font-serif text-gray-900 mb-6"
                    formClassName="flex gap-4 max-w-xl"
                    inputClassName="flex-1 px-6 py-3 bg-white text-gray-900 placeholder-gray-400 border border-gray-300 rounded-none focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent font-sans"
                    buttonClassName="px-8 py-3 bg-black text-white font-sans font-medium rounded-full hover:bg-gray-800 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 uppercase text-sm tracking-wider"
                /> */}

                {/* Logos - Equal height maintained */}
                <div className="flex items-center gap-8 mb-16">
                    <img
                        src="https://cdn.prod.website-files.com/68d800cb1402171531a5981e/68e1613213023b8399f2c4c0_embassy%20of%20the%20free%20mind%20logo2.png"
                        loading='lazy'
                        alt="Embassy of the Free Mind Logo"
                        className="h-[80px] w-auto object-contain"
                    />
                    <img
                        src="https://cdn.prod.website-files.com/68d800cb1402171531a5981e/68d800cb1402171531a599ea_partners-unesco.avif"
                        loading='lazy'
                        alt="UNESCO Memory of the World Logo"
                        className="h-[100px] w-auto object-contain"
                    />
                </div>
            </div>

            {/* Footer Links - Full width with equal margins */}
            {/* push this section to the bottom */}
            <div className="px-6 md:px-12 mt-auto">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center pt-8 border-t border-gray-400">
                    <div className="mb-4 md:mb-0 text-gray-700 hover:text-gray-900 transition-colors font-sans">
                        &copy;{new Date().getFullYear()} Source Library
                        {/* TODO: Enable when service is ready */}
                        {/* <a href="mailto:hello@ficinosociety.com">
                            hello@sourcelibrary.org
                        </a> */}
                    </div>
                    <nav className="flex flex-wrap gap-6">
                        <Link to={paths.home} className="text-gray-700 hover:text-gray-900 transition-colors font-sans">
                            Home
                        </Link>
                        {/* <Link to={paths.library} className="text-gray-700 hover:text-gray-900 transition-colors font-sans">
                            Library
                        </Link> */}
                        <Link to={paths.about} className="text-gray-700 hover:text-gray-900 transition-colors font-sans">
                            About
                        </Link>

                        {/* TODO: Enable when service is ready */}
                        {/*
                        <Link to={paths.contact} className="text-gray-700 hover:text-gray-900 transition-colors font-sans">
                        Contact
                        </Link>
                        <Link to={paths.patron} className="text-gray-700 hover:text-gray-900 transition-colors font-sans">
                        Become a Patron
                        </Link> */}
                    </nav>
                </div>
            </div>
        </footer>
    );
};

export default FooterSection;
