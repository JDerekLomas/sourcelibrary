export type VideoExt = "webm" | "mp4" | "ogg";

export interface VideoSource {
  src: string;
  type?: `video/${VideoExt}` | string; // allow full MIME with codecs
  // Optional hints if you want smarter selection later:
  width?: number;
  height?: number;
  bitrate?: number; // in kbps
}

export interface VideoAsset {
  poster: string;                // required poster
  sources: VideoSource[];        // at least one source
  // Optional extras:
  alt?: string;                  // poster alt text (for <img> fallback)
  captions?: { src: string; srclang: string; label?: string; default?: boolean }[];
}
