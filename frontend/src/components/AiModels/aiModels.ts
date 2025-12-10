export interface AIModel {
  value: string;
  label: string;
}

export const OCR_MODELS: AIModel[] = [
  { value: "mistral", label: "Mistral" },
];

export const TRANSLATION_MODELS: AIModel[] = [
  { value: "gemini", label: "Gemini" },
  { value: "mistral", label: "Mistral" },
];
