import React, { useState } from 'react';

interface SubscriptionFormProps {
    title?: string;
    placeholder?: string;
    buttonText?: string;
    containerClassName?: string;
    titleClassName?: string;
    formClassName?: string;
    inputClassName?: string;
    buttonClassName?: string;
    onSubmit?: (email: string) => void;
}

const SubscriptionForm: React.FC<SubscriptionFormProps> = ({
    title = "Join our mailing list.",
    placeholder = "Enter your email",
    buttonText = "Submit",
    containerClassName = "",
    titleClassName = "",
    formClassName = "",
    inputClassName = "",
    buttonClassName = "",
    onSubmit
}) => {
    const [email, setEmail] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log('Email submitted:', email);

        if (onSubmit) {
            onSubmit(email);
        }

        setEmail('');
    };

    return (
        <div className={containerClassName}>
            {title && <h3 className={titleClassName}>{title}</h3>}
            <form onSubmit={handleSubmit} className={formClassName}>
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={placeholder}
                    required
                    className={inputClassName}
                />
                <button
                    type="submit"
                    className={buttonClassName}
                >
                    {buttonText}
                </button>
            </form>
        </div>
    );
};

export default SubscriptionForm;
