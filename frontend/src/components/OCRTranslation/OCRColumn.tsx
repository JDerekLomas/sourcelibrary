import { PlayCircleIcon, CogIcon } from "@heroicons/react/24/outline";
import { TRANSLATION_LANGUAGES } from "../../utils/languages";
import AIModelSelect from "../AiModels/AIModelSelect";
import { TRANSLATION_MODELS } from "../AiModels/aiModels";
import { RoleGuard, ResourceType, ActionType } from "../../auth/RoleGuard";
import TextColumn from "./TextColumn";

interface OCRColumnProps {
  pageDetails: any;
  ocrApiRunning: boolean;
  translationApiRunning: boolean;
  fontSize: number;
  onOcrTextChange: (value: string) => void;
  onTranslationLanguageChange: (language: string) => void;
  onTranslationPromptEdit: () => void;
  onTranslationRun: () => void;
  onPageDetailsChange: (updates: any) => void;
}

const OCRColumn: React.FC<OCRColumnProps> = ({
  pageDetails,
  ocrApiRunning,
  translationApiRunning,
  fontSize,
  onOcrTextChange,
  onTranslationPromptEdit,
  onTranslationRun,
  onPageDetailsChange,
}) => {
  const footer = (
    <RoleGuard resource={ResourceType.PAGE} action={ActionType.UPDATE}>
      <div className="flex flex-col gap-3 text-xs border-t border-gray-100 pt-3 flex-shrink-0">
        <h3 className="font-semibold font-sans text-gray-900 text-xs sm:text-sm">
          Translation Configuration
        </h3>
        <div className="flex flex-col sm:flex-row sm:items-end gap-2">
          <div className="flex-1 min-w-0">
            <label className="block text-xs font-medium text-gray-700 font-sans mb-1">
              Target Language
            </label>
            <input
              list="translation-languages"
              value={pageDetails?.translation.language || ""}
              onChange={(e) =>
                onPageDetailsChange({
                  translation: {
                    ...pageDetails.translation,
                    language: e.target.value,
                  },
                })
              }
              placeholder="Language"
              className="w-full border border-gray-300 rounded bg-white px-2 py-1 text-xs sm:text-sm font-serif focus:outline-none focus:ring-2 focus:ring-gray-500 touch-manipulation"
            />
            <datalist id="translation-languages">
              {TRANSLATION_LANGUAGES.map((lang) => (
                <option key={lang.value} value={lang.value} />
              ))}
            </datalist>
          </div>
          <AIModelSelect
            value={pageDetails?.translation.model || "gemini"}
            onChange={(model) =>
              onPageDetailsChange({
                translation: { ...pageDetails.translation, model },
              })
            }
            models={TRANSLATION_MODELS}
            label="AI Model"
            className="flex-1 min-w-0"
            inputClassName="w-full border border-gray-300 rounded bg-white px-2 py-1 text-xs sm:text-sm font-serif focus:outline-none focus:ring-2 focus:ring-gray-500 touch-manipulation"
          />
          <div className="flex items-center gap-2">
            <button
              onClick={onTranslationPromptEdit}
              className="p-2 border border-gray-300 rounded bg-white hover:bg-gray-50 transition-colors touch-manipulation min-h-[40px] min-w-[40px] flex items-center justify-center"
              title="Edit Translation Prompt"
            >
              <CogIcon className="h-5 w-5" />
            </button>
            <button
              onClick={onTranslationRun}
              disabled={translationApiRunning || !pageDetails?.ocr.data}
              className="flex items-center justify-center space-x-1 sm:space-x-2 bg-gray-900 hover:bg-gray-800 disabled:bg-gray-500 text-white px-4 sm:px-4 py-2 rounded text-xs sm:text-sm font-serif transition-colors touch-manipulation min-h-[40px] min-w-[80px]"
            >
              {translationApiRunning ? (
                <div className="flex space-x-1">
                  <div className="w-1 h-1 bg-white rounded-full animate-pulse"></div>
                  <div
                    className="w-1 h-1 bg-white rounded-full animate-pulse"
                    style={{ animationDelay: "0.1s" }}
                  ></div>
                  <div
                    className="w-1 h-1 bg-white rounded-full animate-pulse"
                    style={{ animationDelay: "0.2s" }}
                  ></div>
                </div>
              ) : (
                <PlayCircleIcon className="h-4 w-4" />
              )}
              <span>Run</span>
            </button>
          </div>
        </div>
      </div>
    </RoleGuard>
  );

  return (
    <TextColumn
      title="OCR Text"
      language={pageDetails ? pageDetails.ocr.language : "—"}
      charCount={pageDetails?.ocr?.data?.length || 0}
      data={pageDetails?.ocr?.data || ""}
      onTextChange={onOcrTextChange}
      fontSize={fontSize}
      apiRunning={ocrApiRunning}
      apiRunningText="Running OCR..."
      markdownTogglePermissions={{ resource: ResourceType.PAGE, action: ActionType.UPDATE }}
      footer={footer}
    />
  );
};

export default OCRColumn;
