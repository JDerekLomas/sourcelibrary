import React from "react";

import { usePaths } from "../../../hooks/usePaths";
import BackToButton from "./BackToButton";
import type { ButtonStyleProps } from "./BackToButton";

const DashboardButton: React.FC<ButtonStyleProps> = ({
    className,
    style,
    useBaseButton = true,
}) => {
    const paths = usePaths();

    return (
        <BackToButton
            buttonText="Back to Dashboard"
            targetPath={paths.admin.dashboard}
            className={className}
            styleProps={
                {
                    className: className,
                    style: style,
                    useBaseButton: useBaseButton
                }
            }
        />
    );
};

export default DashboardButton;
