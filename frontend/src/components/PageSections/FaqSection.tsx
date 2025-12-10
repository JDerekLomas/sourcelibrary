import React, { useState } from 'react';
import Button from '../ui/Buttons/Button';
import { Link } from 'react-router-dom';

import { usePaths } from '../../hooks/usePaths';

interface FAQItem {
    question: string;
    answer: string;
}

interface FAQProps {
    description?: string;
    showContactCTA?: boolean;
    faqs: FAQItem[];
}

const FaqSection: React.FC<FAQProps> = ({
    description = "Answers to questions about navigating the Source Library and uncovering centuries of Hermetic, esoteric, and humanist knowledge.",
    showContactCTA = true,
    faqs
}) => {
    const [openIndices, setOpenIndices] = useState<Set<number>>(new Set());

    const toggleQuestion = (index: number) => {
        setOpenIndices(prev => {
            const newSet = new Set(prev);
            if (newSet.has(index)) {
                newSet.delete(index);
            } else {
                newSet.add(index);
            }
            return newSet;
        });
    };

    const paths = usePaths();

    return (
        <section className="min-h-screen bg-gradient-to-b from-[#f6f3ee] to-[#f3ede6] py-24">
            <div className="max-w-8xl mx-auto px-2 sm:px-6 lg:px-12">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-18">
                    {/* Left Sticky Text */}
                    <div className="lg:col-span-5">
                        <div className="lg:sticky lg:top-24">
                            <h2 className="text-3xl sm:text-4xl font-serif text-gray-900 mb-6">
                                FAQs
                            </h2>
                            <p className="text-lg text-gray-600 font-sans font-light leading-relaxed mb-8">
                                {description}
                            </p>

                            {showContactCTA && (
                                <>
                                    <p className="text-lg text-gray-900 font-serif mb-2">
                                        Do you have other questions?
                                    </p>
                                    <Link to={paths.contact}>
                                        <Button className="bg-black uppercase hover:bg-gray-800 text-white px-8 py-3">
                                            Contact Us
                                        </Button>
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Right Collapsible Questions */}
                    <div className="lg:col-start-7 lg:col-span-6">
                        <div className="space-y-0 border-t border-gray-900">
                            {faqs.map((faq, index) => (
                                <div key={index} className="border-b border-gray-900">
                                    <button
                                        onClick={() => toggleQuestion(index)}
                                        className="w-full py-8 flex items-center justify-between text-left px-4"
                                    >
                                        <h3 className="text-l sm:text-xl font-serif text-gray-900 pr-8">
                                            {faq.question}
                                        </h3>
                                        <span className="flex-shrink-0 text-2xl text-gray-900 transition-transform duration-300"
                                            style={{ transform: openIndices.has(index) ? 'rotate(0deg)' : 'rotate(180deg)' }}>
                                            ⌃
                                        </span>
                                    </button>

                                    <div
                                        className="overflow-hidden transition-all duration-300 ease-in-out"
                                        style={{
                                            maxHeight: openIndices.has(index) ? '500px' : '0',
                                            opacity: openIndices.has(index) ? 1 : 0
                                        }}
                                    >
                                        <div className="px-4 pb-8">
                                            <p className="text-base text-gray-700 font-sans font-light leading-relaxed">
                                                {faq.answer}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default FaqSection;
