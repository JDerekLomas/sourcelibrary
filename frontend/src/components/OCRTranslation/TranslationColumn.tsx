import React from "react";
import { ResourceType, ActionType } from "../../auth/RoleGuard";
import TextColumn from "./TextColumn";

interface TranslationColumnProps {
  pageDetails: any;
  translationApiRunning: boolean;
  fontSize: number;
  onTranslationTextChange: (value: string) => void;
}

const TranslationColumn: React.FC<TranslationColumnProps> = ({
  pageDetails,
  translationApiRunning,
  fontSize,
  onTranslationTextChange,
}) => {
  return (
    <TextColumn
      title="Translation"
      language={pageDetails ? pageDetails.translation.language : "Language"}
      charCount={pageDetails?.translation?.data?.length || 0}
      data={pageDetails?.translation?.data || ""}
      onTextChange={onTranslationTextChange}
      fontSize={fontSize}
      apiRunning={translationApiRunning}
      apiRunningText="Running translation..."
      markdownTogglePermissions={{ resource: ResourceType.PAGE, action: ActionType.UPDATE }}
      footer={undefined}
    />
  );
};

export default TranslationColumn;