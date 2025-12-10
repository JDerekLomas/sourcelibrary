import React, { useEffect, ReactNode } from "react";
import { useLocation } from "react-router-dom";

interface ScrollToTopProps {
    children?: ReactNode;
    behavior?: ScrollBehavior; // "auto" | "smooth"
}

const ScrollToTop: React.FC<ScrollToTopProps> = ({ children, behavior = "auto" }) => {
    const { pathname } = useLocation();

    useEffect(() => {
        window.scrollTo({ top: 0, left: 0, behavior });
    }, [pathname, behavior]);

    return <>{children}</>;
};

export default ScrollToTop;