// SmartVideo.tsx
import React from "react";
import type { VideoAsset } from "./VideoAsset";

type Ext = "webm" | "mp4" | "ogg";
const preferDefault: Ext[] = ["webm", "mp4", "ogg"];

function canPlay(type?: string) {
  if (typeof document === "undefined") return true;
  const v = document.createElement("video");
  return !!(type && v.canPlayType(type));
}

export function SmartVideo({
  asset,
  prefer = preferDefault,
  lazy = false,
  preload = "metadata",
  className,
  autoPlay,
  loop,
  muted,
  playsInline,
  ...rest
}: {
  asset: VideoAsset;
  prefer?: Ext[];
  lazy?: boolean;
  preload?: "auto" | "metadata" | "none";
} & React.VideoHTMLAttributes<HTMLVideoElement>) {
  const [inView, setInView] = React.useState(!lazy);
  const ref = React.useRef<HTMLVideoElement | null>(null);

  React.useEffect(() => {
    if (!lazy || inView || typeof IntersectionObserver === "undefined") return;
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setInView(true);
          io.disconnect();
        }
      },
      { rootMargin: "200px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [lazy, inView]);

  // Order by preferred extension if available
  const ordered = React.useMemo(() => {
    return [...asset.sources].sort((a, b) => {
      const ax = a.type?.split("/")[1] as Ext | undefined;
      const bx = b.type?.split("/")[1] as Ext | undefined;
      const ai = ax ? prefer.indexOf(ax) : Number.MAX_SAFE_INTEGER;
      const bi = bx ? prefer.indexOf(bx) : Number.MAX_SAFE_INTEGER;
      return ai - bi;
    });
  }, [asset.sources, prefer]);

  const playable = React.useMemo(() => {
    if (typeof document === "undefined") return ordered;
    return ordered.filter((s) => canPlay(s.type));
  }, [ordered]);

  // If nothing is playable, show poster as <img>
  if (playable.length === 0) {
    return <img src={asset.poster} alt={asset.alt ?? ""} className={className} loading="lazy" />;
  }

  return (
    <video
      ref={ref}
      className={className}
      poster={asset.poster}
      preload={preload}
      autoPlay={autoPlay}
      loop={loop}
      muted={autoPlay ? true : muted}
      playsInline={autoPlay ? true : playsInline}
      {...rest}
    >
      {inView &&
        playable.map((s, i) => (
          <source key={`${s.src}-${i}`} src={s.src} type={s.type} />
        ))}

      {asset.captions?.map((c, i) => (
        <track
          key={i}
          kind="subtitles"
          srcLang={c.srclang}
          src={c.src}
          label={c.label}
          default={c.default}
        />
      ))}

      Your browser does not support the video tag.
    </video>
  );
}
