import React, { useState, useRef, useEffect } from "react";
import {
  PuzzlePieceIcon,
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";

import HomeButton from "../components/ui/Buttons/HomeButton";

const UNITY_GAME_URL = "https://socratictutor.vercel.app/";

const screenshots = [
  {
    src: "/game/npchuman.png",
    alt: "Player talking to Pythagoras.",
    caption: "Converse with a great thinker.",
  },
  {
    src: "/game/npcnpc.png",
    alt: "Democritus talking to Zeno.",
    caption: "Engage in a philosophical debate.",
  },
  {
    src: "/game/book.png",
    alt: "Player reading one of the library books.",
    caption: "Delve into ancient books.",
  },
  {
    src: "/game/library.png",
    alt: "View of the library.",
    caption: "Explore the grand Source Library.",
  },
];

const UnityGame: React.FC = () => {
  const iframeContainerRef = useRef<HTMLDivElement>(null);
  const screenshotsContainerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [previousImage, setPreviousImage] = useState<string | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [transitionDirection, setTransitionDirection] = useState<
    "next" | "prev" | null
  >(null);

  useEffect(() => {
    if (selectedImage) {
      // Use a timeout to allow the modal to be added to the DOM before starting the animation
      setTimeout(() => setIsModalVisible(true), 10);
    } else {
      setIsModalVisible(false);
    }
  }, [selectedImage]);

  const handleCloseModal = () => {
    setIsModalVisible(false);
    // Wait for the fade-out animation to complete before removing the modal from the DOM
    setTimeout(() => {
      setSelectedImage(null);
    }, 300);
  };

  const cycleImage = (direction: "next" | "prev") => {
    if (!selectedImage || transitionDirection) return;

    const currentIndex = screenshots.findIndex((s) => s.src === selectedImage);
    const nextIndex =
      direction === "next"
        ? (currentIndex + 1) % screenshots.length
        : (currentIndex - 1 + screenshots.length) % screenshots.length;

    setTransitionDirection(direction);
    setPreviousImage(selectedImage);

    requestAnimationFrame(() => {
      setSelectedImage(screenshots[nextIndex].src);
    });

    setTimeout(() => {
      setTransitionDirection(null);
      setPreviousImage(null);
    }, 300); // Duration of the transition
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedImage) return;

      if (e.key === "Escape") {
        handleCloseModal();
      }

      if (e.key === "ArrowRight") {
        e.preventDefault();
        cycleImage("next");
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        cycleImage("prev");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedImage, transitionDirection]);

  const scrollScreenshots = (direction: "left" | "right") => {
    if (screenshotsContainerRef.current) {
      const scrollAmount = screenshotsContainerRef.current.offsetWidth * 0.8;
      screenshotsContainerRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  const toggleFullscreen = () => {
    if (!iframeContainerRef.current) return;

    if (!document.fullscreenElement) {
      const element = iframeContainerRef.current as any;
      if (element.requestFullscreen) {
        element.requestFullscreen();
      } else if (element.webkitRequestFullscreen) {
        /* Safari */
        element.webkitRequestFullscreen();
      } else if (element.msRequestFullscreen) {
        /* IE11 */
        element.msRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      const isInFullscreen = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).msFullscreenElement
      );
      setIsFullscreen(isInFullscreen);

      if (screen.orientation) {
        if (isInFullscreen) {
          if (
            screen.orientation &&
            typeof (screen.orientation as any).lock === "function"
          ) {
            (screen.orientation as any).lock("landscape").catch((e: any) => {
              console.log("Orientation lock failed:", e);
            });
          }
        } else {
          if (
            screen.orientation &&
            typeof (screen.orientation as any).unlock === "function"
          ) {
            (screen.orientation as any).unlock();
          }
        }
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    document.addEventListener("msfullscreenchange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener(
        "webkitfullscreenchange",
        handleFullscreenChange
      );
      document.removeEventListener(
        "msfullscreenchange",
        handleFullscreenChange
      );
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-white">
      {/* Header */}
      <header className="border-b border-amber-200 bg-white/80 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-amber-100 border border-amber-200">
                <PuzzlePieceIcon className="h-6 w-6 text-amber-700" />
              </div>
              <div>
                <h1 className="text-xl font-serif font-bold text-gray-900 leading-tight mb-0">
                  Source Library
                </h1>
                <p className="text-sm text-gray-600 font-serif mt-0.5 leading-snug">
                  An Interactive Learning Experience
                </p>
              </div>
            </div>
            <HomeButton />
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h2 className="text-3xl sm:text-4xl font-serif font-bold text-gray-900 mb-4">
            Embark on a Journey of Discovery
          </h2>
          <p className="text-lg text-gray-600 font-serif font-light max-w-2xl mx-auto leading-relaxed mb-8">
            Step into the Source Library, an immersive 2D adventure game where
            classical philosophers are brought to life through the power of
            Generative AI. Explore vast text collections, interact with
            historical figures, and uncover the wisdom of the ages in a fun and
            engaging way.
          </p>
        </div>

        <div className="mt-16">
          <div
            ref={iframeContainerRef}
            className={
              isFullscreen
                ? "relative flex h-full w-full items-center justify-center bg-black"
                : "relative bg-white border border-gray-200 shadow-sm overflow-hidden"
            }
          >
            <div className="aspect-video w-full">
              <iframe
                src={UNITY_GAME_URL}
                title="2D Library Adventure"
                width="100%"
                height="100%"
                className="border-[3px] w-full h-full bg-white"
                allowFullScreen
              />
            </div>
            <button
              onClick={toggleFullscreen}
              className="absolute bottom-[15px] right-[15px] z-10 flex h-10 w-10 items-center justify-center bg-transparent border-transparent text-white opacity-80 transition-all duration-200 ease-linear drop-shadow-[2px_2px_1px_rgba(0,0,0,0.7)]"
              aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            >
              {isFullscreen ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  fill="currentColor"
                  viewBox="0 0 16 16"
                >
                  <path d="M5.5 0a.5.5 0 0 1 .5.5v4A1.5 1.5 0 0 1 4.5 6h-4a.5.5 0 0 1 0-1h4a.5.5 0 0 0 .5-.5v-4a.5.5 0 0 1 .5-.5zm5 0a.5.5 0 0 1 .5.5v4a.5.5 0 0 0 .5.5h4a.5.5 0 0 1 0 1h-4A1.5 1.5 0 0 1 10 4.5v-4a.5.5 0 0 1 .5-.5zM0 10.5a.5.5 0 0 1 .5-.5h4A1.5 1.5 0 0 1 6 11.5v4a.5.5 0 0 1-1 0v-4a.5.5 0 0 0-.5-.5h-4a.5.5 0 0 1-.5-.5zm10 1a1.5 1.5 0 0 1 1.5-1.5h4a.5.5 0 0 1 0 1h-4a.5.5 0 0 0-.5.5v4a.5.5 0 0 1-1 0v-4z" />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  fill="currentColor"
                  viewBox="0 0 16 16"
                >
                  <path d="M1.5 1a.5.5 0 0 0-.5.5v4a.5.5 0 0 1-1 0v-4A1.5 1.5 0 0 1 1.5 0h4a.5.5 0 0 1 0 1h-4zM10 .5a.5.5 0 0 1 .5-.5h4A1.5 1.5 0 0 1 16 1.5v4a.5.5 0 0 1-1 0v-4a.5.5 0 0 0-.5-.5h-4a.5.5 0 0 1-.5-.5zM.5 10a.5.5 0 0 1 .5.5v4a.5.5 0 0 0 .5.5h4a.5.5 0 0 1 0 1h-4A1.5 1.5 0 0 1 0 14.5v-4a.5.5 0 0 1 .5-.5zm15 0a.5.5 0 0 1 .5.5v4a1.5 1.5 0 0 1-1.5 1.5h-4a.5.5 0 0 1 0-1h4a.5.5 0 0 0 .5-.5v-4a.5.5 0 0 1 .5-.5z" />
                </svg>
              )}
            </button>
          </div>
        </div>

        <div className="mt-16 text-gray-700 font-serif">
          <div className="max-w-2xl mx-auto space-y-4 text-lg font-light leading-relaxed">
            <h2 className="text-2xl font-bold text-gray-900 pt-4">
              Key Features:
            </h2>
            <ul className="list-disc list-inside space-y-2">
              <li>
                AI-powered philosophers that exhibit autonomous behaviors.
              </li>
              <li>
                Listen to philosophical conversations on fundamental questions.
              </li>
              <li>Read AI-generated writings by historical philosophers.</li>
              <li>
                Interact with philosophers and influence their discussions.
              </li>
              <li>Read ancient literature on various topics.</li>
              <li>
                Experience philosophy in an engaging, interactive environment.
              </li>
            </ul>

            <p>
              Immerse yourself in this fascinating intersection of classical
              philosophy and modern AI technology, all wrapped in nostalgic
              16-bit pixel art.
            </p>
          </div>
        </div>

        <div className="mt-16 rounded-xl bg-amber-100/50 py-12">
          <h2 className="text-3xl sm:text-4xl font-serif font-bold text-gray-900 mb-8 text-center">
            Glimpse of the Adventure
          </h2>
          <div className="relative w-full group px-16">
            <div
              ref={screenshotsContainerRef}
              className="flex overflow-x-auto snap-x snap-mandatory scroll-smooth scrollbar-thin scrollbar-thumb-amber-400 scrollbar-track-amber-100"
            >
              {screenshots.map((screenshot, index) => (
                <div
                  key={index}
                  className="flex-shrink-0 w-full sm:w-1/2 p-2 snap-center"
                  onClick={() => setSelectedImage(screenshot.src)}
                >
                  <div className="bg-white border border-gray-200 shadow-sm rounded-lg overflow-hidden cursor-pointer transform transition-transform hover:scale-105 h-full flex flex-col">
                    <img
                      src={screenshot.src}
                      alt={screenshot.alt}
                      className="w-full h-auto object-cover"
                      loading="lazy"
                    />
                    <div className="p-2 flex-grow flex items-center justify-center">
                      <p className="text-center text-sm font-serif text-gray-600 min-h-[2.5rem]">
                        {screenshot.caption}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={() => scrollScreenshots("left")}
              className="absolute top-1/2 left-3 -translate-y-1/2 bg-white rounded-lg px-2 py-2 shadow-md hover:bg-gray-100 transition-all"
              aria-label="Scroll left"
            >
              <ChevronLeftIcon className="h-6 w-6 text-gray-800" />
            </button>
            <button
              onClick={() => scrollScreenshots("right")}
              className="absolute top-1/2 right-3 -translate-y-1/2 bg-white rounded-lg px-2 py-2 shadow-md hover:bg-gray-100 transition-all"
              aria-label="Scroll right"
            >
              <ChevronRightIcon className="h-6 w-6 text-gray-800" />
            </button>
          </div>
        </div>
      </main>

      {selectedImage && (
        <div
          className={`fixed inset-0 flex items-center justify-center z-50 p-4 transition-opacity duration-300 ${isModalVisible ? "bg-black bg-opacity-90" : "bg-black bg-opacity-0"
            }`}
          onClick={handleCloseModal}
        >
          <div
            className={`relative transition-all duration-300 group ${isModalVisible ? "scale-100 opacity-100" : "scale-95 opacity-0"
              }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative overflow-hidden max-w-[90vw] max-h-[90vh]">
              {previousImage && (
                <img
                  key={previousImage}
                  src={previousImage}
                  alt="Previous view"
                  className={`absolute inset-0 w-full h-full object-contain transition-transform duration-300 ease-in-out rounded-lg p-1 bg-white shadow-2xl`}
                  style={{
                    transform:
                      transitionDirection === "next"
                        ? "translateX(-100%)"
                        : "translateX(100%)",
                  }}
                />
              )}
              <img
                key={selectedImage}
                src={selectedImage}
                alt="Enlarged view"
                className={`w-full h-full object-contain transition-transform duration-300 ease-in-out rounded-lg p-1 bg-white shadow-2xl`}
                style={{
                  transform: transitionDirection
                    ? "translateX(0)"
                    : selectedImage && !previousImage
                      ? "translateX(0)"
                      : transitionDirection === "next"
                        ? "translateX(100%)"
                        : "translateX(-100%)",
                }}
              />
            </div>
            <button
              onClick={handleCloseModal}
              className="absolute -top-4 -right-4 h-10 w-10 bg-white rounded-full flex items-center justify-center text-gray-800 shadow-lg hover:bg-gray-200 transition"
              aria-label="Close image viewer"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
            {/* Prev button */}
            <button
              onClick={() => cycleImage("prev")}
              className="absolute top-1/2 left-4 -translate-y-1/2 bg-white/50 hover:bg-white/80 rounded-lg px-2 py-2 transition-opacity opacity-0 group-hover:opacity-100"
              aria-label="Previous image"
            >
              <ChevronLeftIcon className="h-8 w-8 text-gray-800" />
            </button>
            {/* Next button */}
            <button
              onClick={() => cycleImage("next")}
              className="absolute top-1/2 right-4 -translate-y-1/2 bg-white/50 hover:bg-white/80 rounded-lg px-2 py-2 transition-opacity opacity-0 group-hover:opacity-100"
              aria-label="Next image"
            >
              <ChevronRightIcon className="h-8 w-8 text-gray-800" />
            </button>
          </div>
        </div>
      )}

      <footer className="mt-8 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="border-t border-amber-200 pt-8 text-center">
            <p className="text-base text-gray-500 font-serif">
              Preserving classical wisdom through digital transformation • AI
              for Good
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default UnityGame;
