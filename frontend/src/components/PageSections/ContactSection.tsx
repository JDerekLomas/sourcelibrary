import React, { useState } from 'react';

const ContactSection: React.FC = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        message: '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Handle form submission logic here
        console.log('Form submitted:', formData);
    };

    return (
        <section className="bg-gradient-to-b from-[#f6f3ee] to-[#f3ede6] py-16">
            <div className="max-w-8xl mx-auto px-2 sm:px-6 lg:px-12 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24">
                {/* Left Column - Text Content */}
                <div className="flex flex-col">
                    <h2 className="text-3xl md:text-4xl font-serif mb-6">
                        Connect with Source Library
                    </h2>
                    <p className="text-lg font-light text-gray-700">
                        From research and translation to patronage and partnership, there are many
                        ways to be part of our work. Share your thoughts or questions with us here, and
                        we'll be in touch.
                    </p>
                </div>

                {/* Right Column - Form */}
                <div className="flex flex-col justify-center">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium mb-2">
                                Name
                            </label>
                            <input
                                type="text"
                                id="name"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                className="w-full px-4 py-3 border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-gray-400"
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="email" className="block text-sm font-medium mb-2">
                                Email Address
                            </label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                className="w-full px-4 py-3 border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-gray-400"
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="phone" className="block text-sm font-medium mb-2">
                                Phone
                            </label>
                            <input
                                type="tel"
                                id="phone"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                className="w-full px-4 py-3 border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-gray-400"
                            />
                        </div>

                        <div>
                            <label htmlFor="message" className="block text-sm font-medium mb-2">
                                Message
                            </label>
                            <textarea
                                id="message"
                                name="message"
                                value={formData.message}
                                onChange={handleChange}
                                rows={5}
                                className="resize-y w-full px-4 py-3 border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-gray-400"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            className="bg-black text-white px-12 py-3 rounded-full font-medium hover:bg-gray-800 transition-colors duration-200"
                        >
                            SUBMIT
                        </button>
                    </form>
                </div>
            </div>
        </section>
    );
};

export default ContactSection;
