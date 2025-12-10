import React, { useRef, useEffect, useState } from "react";
import HomeButton from "../components/ui/Buttons/HomeButton";

const PHASER_GAME_URL = "https://openworldweb.vercel.app/";

const PhaserGame: React.FC = () => {
  const iframeContainerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isGameLoaded, setIsGameLoaded] = useState(false);
  const [selectedPack, setSelectedPack] = useState<string>("experimental");

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      if (iframeContainerRef.current?.requestFullscreen) {
        iframeContainerRef.current.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
    setIsFullscreen(!isFullscreen);
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  return (
    <div className="fixed top-0 left-0 w-screen h-screen overflow-hidden font-sans bg-gradient-to-br from-[#f6f3ee] via-[#f3ede6] to-[#ebe5dd]">
      {/* Header */}
      <div className="py-4 px-8 flex items-center justify-between shadow-2xl relative z-10 bg-gradient-to-r from-black via-gray-900 to-black border-b-[3px] border-gray-700 font-sans backdrop-blur-sm">
        <div>
          <h1 className="mb-1 text-3xl font-regular text-white tracking-wide drop-shadow-[0_2px_8px_rgba(255,255,255,0.3)] font-serif bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            Lively Minds
          </h1>
        </div>
        <div className="hidden md:flex items-center space-x-4">
          <HomeButton
            className="bg-gradient-to-r from-gray-900 to-black hover:from-black hover:to-gray-800 px-4 py-2 rounded-full border border-gray-700 transition-all text-white text-sm font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
            useBaseButton={false}
          />
        </div>
      </div>

      <div className="h-[calc(100vh-76px)] flex overflow-hidden">
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col h-full overflow-y-auto">
          {/* Top Section: Game Area and Sidebar side by side */}
          <div className="flex">
            {/* Game Area */}
            <div className="flex-1 p-6 pr-3 flex justify-center">
              <div className="relative w-[1000px] max-w-[100%] aspect-[16/9]">
                <div className="absolute inset-0 rounded-2xl overflow-hidden shadow-2xl flex flex-col bg-gradient-to-br from-white via-[#f6f3ee] to-[#ebe5dd] border-[3px] border-gray-300 hover:border-gray-400 transition-all">
                  {/* Game Area */}
                  <div
                    ref={iframeContainerRef}
                    className="flex-1 relative group bg-gradient-to-br from-[#f6f3ee] via-white to-[#f3ede6]"
                    style={{ aspectRatio: "16/9" }}
                  >
                    {/* ...existing code for isGameLoaded... */}
                    {!isGameLoaded ? (
                      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#f6f3ee]/50 to-[#ebe5dd]/50 backdrop-blur-sm">
                        <div className="text-center animate-fade-in">
                          <p className="mb-6 max-w-md mx-auto text-gray-800 font-sans text-lg leading-relaxed">
                            Discover the wisdom of history's greatest minds
                            through AI-powered conversations
                          </p>
                          <button
                            onClick={() => setIsGameLoaded(true)}
                            className="bg-gradient-to-r from-black via-gray-900 to-black hover:from-gray-900 hover:to-black text-white px-8 py-4 rounded-xl text-lg font-semibold transition-all shadow-2xl hover:shadow-3xl transform hover:scale-105 border-2 border-gray-700 font-sans relative overflow-hidden group animate-pulse-subtle"
                          >
                            <span className="relative z-10">Begin the Journey</span>
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <iframe
                          src={PHASER_GAME_URL}
                          title="Source Library"
                          className="w-full h-full rounded-b-2xl bg-gradient-to-br from-[#f6f3ee] to-[#f3ede6] border-none"
                          style={{ aspectRatio: "16/9" }}
                        />
                        {!isFullscreen && (
                          <button
                            onClick={toggleFullscreen}
                            className="absolute top-[15px] right-[15px] z-10 flex h-10 w-10 items-center justify-center rounded-lg text-white transition-all duration-200 hover:scale-110 hover:shadow-2xl hover:border-gray-600"
                            aria-label={
                              isFullscreen
                                ? "Exit fullscreen"
                                : "Enter fullscreen"
                            }
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                              strokeWidth={2}
                              stroke="currentColor"
                              className="w-6 h-6"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15"
                              />
                            </svg>
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="w-[420px] p-4 pt-8 space-y-6 font-sans">
              {/* Premium Token CTA */}
              <div className="relative animate-fade-in">
                {/* Header Badge */}
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10 w-full flex justify-center">
                  <div className="min-w-[180px] px-10 py-1 rounded-full text-base font-bold shadow-xl text-center whitespace-nowrap bg-gradient-to-r from-black via-gray-900 to-black text-white border-2 border-gray-700 font-sans">
                    🪙 AI TOKENS
                  </div>
                </div>

                <div className="rounded-2xl p-4 pt-8 relative overflow-hidden bg-gradient-to-br from-white via-[#f6f3ee] to-[#ebe5dd] border-2 border-gray-400 shadow-2xl hover:shadow-3xl transition-all">
                  {/* Animated Glow Effect */}
                  <div className="absolute inset-0 rounded-2xl pointer-events-none bg-[radial-gradient(circle_at_70%_30%,#00000020_0%,transparent_70%)] z-0 animate-pulse-glow"></div>

                  <div className="relative z-10">
                    <div className="text-center mb-2">
                      <p className="text-sm text-gray-700 font-sans font-medium">
                        Unlock unlimited conversations with history's greatest
                        minds.
                      </p>
                    </div>

                    {/* Pricing Cards */}
                    <div className="space-y-2 mb-3">
                      {/* Experimental Pack */}
                      <div
                        className={`rounded-lg p-3 border cursor-pointer transition-all duration-300 transform hover:scale-[1.02] ${selectedPack === "experimental"
                          ? "border-black text-black ring-2 ring-black/40 bg-gradient-to-br from-gray-100 to-white shadow-lg"
                          : "border-gray-400 hover:border-black bg-gradient-to-br from-white to-[#f6f3ee] hover:shadow-lg"
                          }`}
                        onClick={() => setSelectedPack("experimental")}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-semibold font-serif text-base">
                              Experimental Pack
                            </h4>
                            <p className="text-xs font-sans mt-2 text-gray-600">
                              Try AI Conversations
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="text-xl font-bold font-serif bg-gradient-to-r from-black to-gray-700 bg-clip-text text-transparent">
                              $4.99
                            </div>
                          </div>
                        </div>
                        <div className="text-xs font-sans mt-2 text-gray-600">
                          • 25 AI Tokens
                          <br />
                          • ~12 Conversations
                          <br />• 3 Philosophers
                        </div>
                      </div>

                      {/* Starter Pack */}
                      <div
                        className={`rounded-lg p-3 border cursor-pointer transition-all duration-300 transform hover:scale-[1.02] ${selectedPack === "starter"
                          ? "border-black text-black ring-2 ring-black/40 bg-gradient-to-br from-gray-100 to-white shadow-lg"
                          : "border-gray-400 hover:border-black bg-gradient-to-br from-white to-[#f6f3ee] hover:shadow-lg"
                          }`}
                        onClick={() => setSelectedPack("starter")}
                      >
                        <div className="flex justify-between items-start mb-1">
                          <div>
                            <h4 className="font-semibold font-serif text-base">
                              Starter Pack
                            </h4>
                            <p className="text-xs font-sans mt-2 text-gray-600">
                              Perfect for Exploring
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="text-xl font-bold font-serif bg-gradient-to-r from-black to-gray-700 bg-clip-text text-transparent">
                              $9.99
                            </div>
                          </div>
                        </div>
                        <div className="text-xs font-sans text-gray-600">
                          • 100 AI Tokens
                          <br />
                          • ~50 Conversations
                          <br />• All Philosophers
                        </div>
                      </div>

                      {/* Scholar Pack - Featured */}
                      <div
                        className={`rounded-lg p-3 border relative cursor-pointer transition-all duration-300 transform hover:scale-[1.02] ${selectedPack === "scholar"
                          ? "border-black text-black ring-2 ring-black/40 bg-gradient-to-br from-gray-100 to-white shadow-xl"
                          : "border-gray-400 hover:border-black bg-gradient-to-br from-white to-[#f6f3ee] hover:shadow-xl"
                          }`}
                        onClick={() => setSelectedPack("scholar")}
                      >
                        <div className="absolute top-2 right-2">
                          <span className="text-xs uppercase px-2 py-0.5 rounded-full font-regular bg-gradient-to-r from-black to-gray-800 text-white font-sans border border-gray-700 animate-pulse-subtle shadow-lg">
                            Best Value
                          </span>
                        </div>
                        <div className="flex justify-between items-start mb-1">
                          <div>
                            <h4 className="font-semibold font-serif text-base">
                              Scholar Pack
                            </h4>
                            <p className="text-xs font-sans mt-2 text-gray-600">
                              Most Popular Choice
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="text-xs line-through font-sans text-gray-500">
                              $29.99
                            </div>
                            <div className="text-xl font-bold font-serif bg-gradient-to-r from-black to-gray-700 bg-clip-text text-transparent">
                              $19.99
                            </div>
                          </div>
                        </div>
                        <div className="text-xs font-sans text-gray-600">
                          • 300 AI Tokens
                          <br />
                          • ~150 Conversations
                          <br />• All Philosophers
                        </div>
                      </div>
                    </div>

                    {/* CTA Button */}
                    <button
                      className="w-full font-bold py-3 px-4 rounded-xl transition-all shadow-xl hover:shadow-2xl transform hover:scale-105 bg-gradient-to-r from-black via-gray-900 to-black hover:from-gray-900 hover:via-black hover:to-gray-900 text-white border-2 border-gray-700 font-sans relative overflow-hidden group"
                      onClick={() => alert(`Selected pack: ${selectedPack}`)}
                    >
                      <span className="relative z-10">Get Tokens Now</span>
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Instructions and Features - Below Game Area */}
          <div className="pl-6 pr-3 pb-12 mb-6">
            <div className="w-[1000px] max-w-[100%] flex flex-col gap-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Instruction Cards */}
                <div className="rounded-xl p-5 flex flex-col bg-gradient-to-br from-white via-[#f6f3ee] to-[#ebe5dd] border-2 border-gray-400 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02] hover:border-gray-500 group">
                  <div className="flex items-start">
                    <span className="text-2xl mr-3 transition-transform group-hover:scale-110">🤔</span>
                    <div>
                      <h4 className="font-medium text-sm text-black font-serif mb-1">
                        Meet Philosophers
                      </h4>
                      <p className="text-xs text-gray-700 font-sans">
                        Click on any philosopher to start AI conversations and
                        learn about their lives, works, and ideas. Each NPC is
                        powered by advanced AI and responds in character.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="rounded-xl p-5 flex flex-col bg-gradient-to-br from-white via-[#f6f3ee] to-[#ebe5dd] border-2 border-gray-400 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02] hover:border-gray-500 group">
                  <div className="flex items-start">
                    <span className="text-2xl mr-3 transition-transform group-hover:scale-110">📚</span>
                    <div>
                      <h4 className="font-medium text-sm text-black font-serif mb-1">
                        Ancient Texts
                      </h4>
                      <p className="text-xs text-gray-700 font-sans">
                        Browse a curated collection of ancient books and
                        manuscripts. Read excerpts and discuss their meaning
                        with philosophers or other users.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="rounded-xl p-5 flex flex-col bg-gradient-to-br from-white via-[#f6f3ee] to-[#ebe5dd] border-2 border-gray-400 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02] hover:border-gray-500 group">
                  <div className="flex items-start">
                    <span className="text-2xl mr-3 transition-transform group-hover:scale-110">💬</span>
                    <div>
                      <h4 className="font-medium text-sm text-black font-serif mb-1">
                        Join Debates
                      </h4>
                      <p className="text-xs text-gray-700 font-sans">
                        Watch philosophers debate timeless questions, join the
                        conversation, or ask your own questions. All
                        interactions are moderated for quality and safety.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="rounded-xl p-5 flex flex-col bg-gradient-to-br from-white via-[#f6f3ee] to-[#ebe5dd] border-2 border-gray-400 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02] hover:border-gray-500 group">
                  <div className="flex items-start">
                    <span className="text-2xl mr-3 transition-transform group-hover:scale-110">🧠</span>
                    <div>
                      <h4 className="font-medium text-sm text-black font-serif mb-1">
                        Explore Wisdom
                      </h4>
                      <p className="text-xs text-gray-700 font-sans">
                        Interact with philosophical ideas, ask questions, and
                        deepen your understanding through immersive AI
                        experiences.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PhaserGame;
