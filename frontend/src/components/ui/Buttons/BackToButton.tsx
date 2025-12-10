import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";

import Button from "./Button";

interface BackToButtonProps {
    buttonText: string;
    targetPath: string;
    className?: string;
    styleProps?: ButtonStyleProps;
}

export interface ButtonStyleProps {
    className?: string;
    style?: React.CSSProperties;
    useBaseButton?: boolean;
}

const BackToButton: React.FC<BackToButtonProps> = (props) => {
    const navigate = useNavigate();

    if (props.styleProps?.useBaseButton) {
        return (
            <Button
                onClick={() => navigate(props.targetPath)}
                variant="secondary"
                className={`flex items-center space-x-2 group ${props.styleProps?.className}`}
                style={props.styleProps?.style}
            >
                <ArrowLeftIcon className="h-4 w-4 transition-transform duration-200 ease-in-out group-hover:-translate-x-1" />
                <span>{props.buttonText}</span>
            </Button>
        );
    }

    return (
        <button
            onClick={() => navigate(props.targetPath)}
            className={`group flex items-center space-x-2 ${props.styleProps?.className}`}
            style={props.styleProps?.style}
        >
            <ArrowLeftIcon className="h-4 w-4 transition-transform duration-200 ease-in-out group-hover:-translate-x-1" />
            <span>{props.buttonText}</span>
        </button>
    );
};

export default BackToButton;
