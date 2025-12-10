import React from "react";

import { usePaths } from "../../../hooks/usePaths";
import BackToButton from "./BackToButton";
import type { ButtonStyleProps } from "./BackToButton";

const HomeButton: React.FC<ButtonStyleProps> = ({
  className,
  style,
  useBaseButton = true,
}) => {
  const paths = usePaths();

  return (
    <BackToButton
      buttonText="Back to Library"
      targetPath={paths.home}
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

export default HomeButton;
