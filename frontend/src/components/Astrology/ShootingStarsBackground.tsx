import React, { useEffect, useRef } from "react";

const NUM_STARS = 120; // Reduced for perf
const NUM_NEBULAS = 18; // Reduced for perf
const STAR_MAX_OFFSET = 32; // Slightly less for perf

type Star = { x: number; y: number; r: number; alpha: number };
type Nebula = { x: number; y: number; r: number; color: string; alpha: number };
type ShootingStar = {
  x: number;
  y: number;
  len: number;
  angle: number;
  speed: number;
  opacity: number;
  life: number;
  maxLife: number;
};

const ShootingStarsBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Store static stars and nebulas so they can be redrawn with parallax
  const starsRef = useRef<Star[]>([]);
  const nebulasRef = useRef<Nebula[]>([]);
  const shootingStarsRef = useRef<ShootingStar[]>([]);

  // Parallax state
  const parallax = useRef({ x: 0, y: 0 });

  // Helper to (re)generate static stars and nebulas
  function generateStaticObjects(width: number, height: number) {
    // Stars
    const stars: Star[] = [];
    for (let i = 0; i < NUM_STARS; i++) {
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        r: Math.random() * 1.1 + 0.3,
        alpha: Math.random() * 0.6 + 0.25,
      });
    }
    // Nebulas
    const nebulas: Nebula[] = [];
    for (let i = 0; i < NUM_NEBULAS; i++) {
      nebulas.push({
        x: Math.random() * width,
        y: Math.random() * height,
        r: Math.random() * 4.5 + 2.5,
        color: `rgba(${180 + Math.random() * 60},${80 + Math.random() * 80},${
          200 + Math.random() * 40
        },1)`,
        alpha: Math.random() * 0.14 + 0.07,
      });
    }
    starsRef.current = stars;
    nebulasRef.current = nebulas;
  }

  // Shooting star spawner
  function spawnShootingStar(width: number, height: number) {
    const edge = Math.floor(Math.random() * 4);
    let startX, startY, angle;
    if (edge === 0) {
      // top
      startX = Math.random() * width;
      startY = 0;
      angle = Math.random() * Math.PI + Math.PI / 2;
    } else if (edge === 1) {
      // right
      startX = width;
      startY = Math.random() * height;
      angle = Math.random() * Math.PI + Math.PI;
    } else if (edge === 2) {
      // bottom
      startX = Math.random() * width;
      startY = height;
      angle = Math.random() * Math.PI - Math.PI / 2;
    } else {
      // left
      startX = 0;
      startY = Math.random() * height;
      angle = Math.random() * Math.PI;
    }
    shootingStarsRef.current.push({
      x: startX,
      y: startY,
      len: Math.random() * 90 + 60, // Shorter for perf
      angle,
      speed: Math.random() * 1.5 + 2.2, // Slightly slower for less movement
      opacity: 0.8,
      life: 0,
      maxLife: Math.random() * 35 + 30, // Shorter life for perf
    });
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set initial size and generate objects
    function resizeAndGenerate() {
      if (canvas) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        generateStaticObjects(canvas.width, canvas.height);
      }
      shootingStarsRef.current = [];
    }
    resizeAndGenerate();

    // Parallax event
    function handlePointerMove(e: MouseEvent) {
      // Move background in the opposite direction of mouse, instantly
      const x = ((e.clientX - window.innerWidth / 2) / window.innerWidth) * 2;
      const y = ((e.clientY - window.innerHeight / 2) / window.innerHeight) * 2;
      parallax.current.x = -x * STAR_MAX_OFFSET;
      parallax.current.y = -y * STAR_MAX_OFFSET;
    }
    window.addEventListener("mousemove", handlePointerMove);

    // Responsive resize
    window.addEventListener("resize", resizeAndGenerate);

    // Shooting star interval
    const shootingStarInterval = setInterval(() => {
      if (shootingStarsRef.current.length < 2) {
        // Limit concurrent shooting stars
        spawnShootingStar(canvas.width, canvas.height);
      }
    }, 4000);

    // Animation loop
    let animationFrameId: number;
    function animate() {
      if (!ctx || !canvas) return;

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw static stars with parallax
      ctx.save();
      ctx.translate(parallax.current.x, parallax.current.y);

      // Stars
      for (const star of starsRef.current) {
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.r, 0, 2 * Math.PI);
        ctx.globalAlpha = star.alpha;
        ctx.fillStyle = "#fff";
        ctx.shadowColor = "#fff";
        ctx.shadowBlur = 3;
        ctx.fill();
      }

      // Nebulas
      for (const nebula of nebulasRef.current) {
        ctx.beginPath();
        ctx.arc(nebula.x, nebula.y, nebula.r, 0, 2 * Math.PI);
        ctx.globalAlpha = nebula.alpha;
        ctx.fillStyle = nebula.color;
        ctx.shadowColor = "#a8a8ff";
        ctx.shadowBlur = 10;
        ctx.fill();
      }

      // Shooting stars
      ctx.globalAlpha = 1;
      for (let i = shootingStarsRef.current.length - 1; i >= 0; i--) {
        const star = shootingStarsRef.current[i];
        ctx.save();
        ctx.globalAlpha = Math.max(0, star.opacity);
        ctx.strokeStyle = "white";
        ctx.shadowColor = "#fff";
        ctx.shadowBlur = 8;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(star.x, star.y);
        ctx.lineTo(
          star.x + Math.cos(star.angle) * star.len,
          star.y + Math.sin(star.angle) * star.len
        );
        ctx.stroke();
        ctx.restore();

        // Move shooting star
        star.x += Math.cos(star.angle) * star.speed;
        star.y += Math.sin(star.angle) * star.speed;
        star.opacity -= 0.035;
        star.life++;
        if (star.life > star.maxLife || star.opacity <= 0) {
          shootingStarsRef.current.splice(i, 1);
        }
      }

      ctx.restore();
      animationFrameId = requestAnimationFrame(animate);
    }
    animate();

    return () => {
      window.removeEventListener("mousemove", handlePointerMove);
      window.removeEventListener("resize", resizeAndGenerate);
      clearInterval(shootingStarInterval);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  // Render canvas and set galaxy gradient background
  return (
    <>
      <div
        style={{
          position: "fixed",
          inset: 0,
          width: "100vw",
          height: "100vh",
          zIndex: -2,
          pointerEvents: "none",
          background:
            "radial-gradient(ellipse at 60% 40%, #2b2250 0%, #1a1a2e 60%, #0d0d1a 100%)",
        }}
      />
      <canvas
        ref={canvasRef}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          zIndex: -1,
          pointerEvents: "none",
        }}
      />
    </>
  );
};
export default ShootingStarsBackground;
