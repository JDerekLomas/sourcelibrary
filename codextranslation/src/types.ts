export interface Page {
  id: string;
  pageNumber: number;
  imageUrl: string;
  ocrText: string;
  translationText: string;
}

export interface Version {
  id: string;
  name: string;
  timestamp: string;
}