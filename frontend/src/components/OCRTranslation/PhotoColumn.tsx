import React, { useState } from "react";
import { PlayCircleIcon, CogIcon } from "@heroicons/react/24/outline";
import { MAJOR_LANGUAGES } from "../../utils/languages";
import AIModelSelect from "../AiModels/AIModelSelect";
import { OCR_MODELS } from "../AiModels/aiModels";
import ToggleSwitch from "./ToggleSwitch";
import { RoleGuard, ResourceType, ActionType } from "../../auth/RoleGuard";

interface PhotoColumnProps {
  pageDetails: any;
  imageLoading: boolean;
  ocrApiRunning: boolean;
  bookDetails: any;
  onImageLoad: () => void;
  onOcrLanguageChange: (language: string) => void;
  onOcrPromptEdit: () => void;
  onOcrRun: () => void;
  onTranslationPromptEdit: () => void;
  onTranslationRun: () => void;
  translationApiRunning: boolean;
  onPageDetailsChange: (updates: any) => void;
}

const PhotoColumn: React.FC<PhotoColumnProps> = ({
  pageDetails,
  imageLoading,
  ocrApiRunning,
  bookDetails,
  onImageLoad,
  onOcrPromptEdit,
  onOcrRun,
  onPageDetailsChange,
}) => {
  const [useLowQuality, setUseLowQuality] = useState(true);

  const highQualityUrl = pageDetails?.photo || pageDetails?.compressed_photo || "";
  const lowQualityUrl = pageDetails?.compressed_photo || pageDetails?.photo || "";

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4 flex-col">
      <div className="flex items-center justify-between mb-3 flex-shrink-0">
        <h2 className="text-base sm:text-lg font-serif font-semibold text-gray-900">
          Page Image
        </h2>

        {/* Page image Low/High Quality toggle */}
        <ToggleSwitch
          value={useLowQuality}
          onToggle={setUseLowQuality}
          leftContent={<span className="text-xs font-sans px-2">SD</span>}
          rightContent={<span className="text-xs font-sans px-2">HD</span>}
          className="h-8"
          buttonClassName="px-2 py-1 text-xs"
        />
      </div>

      {/* Image Container */}
      <div className="relative mb-3 sm:mb-4 bg-gray-50 rounded border border-gray-200 flex items-center justify-center flex-1 overflow-hidden min-h-[250px]">
        {imageLoading && (
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
            <div
              className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"
              style={{ animationDelay: "0.1s" }}
            ></div>
            <div
              className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"
              style={{ animationDelay: "0.2s" }}
            ></div>
          </div>
        )}
        <img
          src={useLowQuality ? lowQualityUrl : highQualityUrl}
          className={`max-w-full max-h-full object-contain transition-opacity duration-200 ${imageLoading ? "opacity-0" : "opacity-100"
            }`}
          onLoad={onImageLoad}
          alt="Image Quality"
        />
      </div>

      {/* OCR Controls */}
      <RoleGuard resource={ResourceType.PAGE} action={ActionType.UPDATE}>
        <div className="flex flex-col gap-3 text-xs border-t border-gray-100 pt-3 flex-shrink-0">
          <h3 className="font-semibold font-sans text-gray-900 text-xs sm:text-sm">
            OCR Configuration
          </h3>

          <div className="flex flex-col sm:flex-row sm:items-end gap-2">
            <div className="flex-1 min-w-0">
              <label className="block text-xs font-medium text-gray-700 font-sans mb-1">
                Source Language
              </label>
              <input
                list="ocr-languages"
                value={pageDetails?.ocr.language || bookDetails?.language || ""}
                onChange={(e) =>
                  onPageDetailsChange({
                    ocr: { ...pageDetails.ocr, language: e.target.value },
                  })
                }
                placeholder="Language"
                className="w-full border border-gray-300 rounded bg-white px-2 py-1 text-xs sm:text-sm font-serif focus:outline-none focus:ring-2 focus:ring-gray-500 touch-manipulation"
              />
              <datalist id="ocr-languages">
                {MAJOR_LANGUAGES.map((lang) => (
                  <option key={lang.value} value={lang.value} />
                ))}
              </datalist>
            </div>

            <AIModelSelect
              value={pageDetails?.ocr.model || "mistral"}
              onChange={(model) =>
                onPageDetailsChange({
                  ocr: { ...pageDetails.ocr, model },
                })
              }
              models={OCR_MODELS}
              label="AI Model"
              className="flex-1 min-w-0"
              inputClassName="w-full border border-gray-300 rounded bg-white px-2 py-1 text-xs sm:text-sm font-serif focus:outline-none focus:ring-2 focus:ring-gray-500 touch-manipulation"
            />

            <div className="flex items-center gap-2">
              <button
                onClick={onOcrPromptEdit}
                className="p-2 border border-gray-300 rounded bg-white hover:bg-gray-50 transition-colors touch-manipulation min-h-[40px] min-w-[40px] flex items-center justify-center"
                title="Edit OCR Prompt"
              >
                <CogIcon className="h-5 w-5" />
              </button>
              <button
                onClick={onOcrRun}
                disabled={ocrApiRunning}
                className="flex items-center justify-center space-x-1 sm:space-x-2 bg-gray-900 hover:bg-gray-800 disabled:bg-gray-500 text-white px-4 sm:px-4 py-2 rounded text-xs sm:text-sm font-serif transition-colors touch-manipulation min-h-[40px] min-w-[80px]"
              >
                {ocrApiRunning ? (
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
    </div>
  );
};

export default PhotoColumn;
