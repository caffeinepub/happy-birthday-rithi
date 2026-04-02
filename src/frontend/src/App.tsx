import { useCallback, useEffect, useRef, useState } from "react";

// ========== TYPES ==========
interface Balloon {
  id: number;
  x: number;
  color: string;
  size: number;
  duration: number;
  delay: number;
}

interface Confetti {
  id: number;
  x: number;
  color: string;
  size: number;
  duration: number;
  delay: number;
  shape: string;
}

interface Heart {
  id: number;
  x: number;
  size: number;
  duration: number;
  delay: number;
}

interface Sparkle {
  id: number;
  x: number;
  y: number;
  size: number;
  delay: number;
}

// ========== MUSIC ENGINE ==========
function useBirthdayMusic() {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const isPlayingRef = useRef(false);
  const gainRef = useRef<GainNode | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const noteFreq: Record<string, number> = {
    C4: 261.63,
    D4: 293.66,
    E4: 329.63,
    F4: 349.23,
    G4: 392.0,
    A4: 440.0,
    Bb4: 466.16,
    C5: 523.25,
  };

  const melody: [string, number][] = [
    ["C4", 0.3],
    ["C4", 0.1],
    ["D4", 0.4],
    ["C4", 0.4],
    ["F4", 0.4],
    ["E4", 0.8],
    ["C4", 0.3],
    ["C4", 0.1],
    ["D4", 0.4],
    ["C4", 0.4],
    ["G4", 0.4],
    ["F4", 0.8],
    ["C4", 0.3],
    ["C4", 0.1],
    ["C5", 0.4],
    ["A4", 0.4],
    ["F4", 0.4],
    ["E4", 0.4],
    ["D4", 0.8],
    ["Bb4", 0.3],
    ["Bb4", 0.1],
    ["A4", 0.4],
    ["F4", 0.4],
    ["G4", 0.4],
    ["F4", 0.8],
  ];

  const playMelody = useCallback(() => {
    if (!audioCtxRef.current) return;
    const ctx = audioCtxRef.current;
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.18, ctx.currentTime);
    masterGain.connect(ctx.destination);
    gainRef.current = masterGain;

    let t = ctx.currentTime + 0.1;

    for (const [note, duration] of melody) {
      const osc = ctx.createOscillator();
      const env = ctx.createGain();
      osc.connect(env);
      env.connect(masterGain);
      osc.type = "sine";
      osc.frequency.setValueAtTime(noteFreq[note] ?? 440, t);
      env.gain.setValueAtTime(0, t);
      env.gain.linearRampToValueAtTime(0.8, t + 0.02);
      env.gain.setValueAtTime(0.8, t + duration * 0.7);
      env.gain.linearRampToValueAtTime(0, t + duration);
      osc.start(t);
      osc.stop(t + duration + 0.05);
      t += duration + 0.05;
    }
  }, []);

  const startMusic = useCallback(() => {
    if (isPlayingRef.current) return;
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (
        window.AudioContext || (window as any).webkitAudioContext
      )();
    }
    const ctx = audioCtxRef.current;
    if (ctx.state === "suspended") ctx.resume();
    isPlayingRef.current = true;
    setIsPlaying(true);

    const loopDuration =
      melody.reduce((acc, [, dur]) => acc + dur + 0.05, 0) + 1.2;

    const loop = () => {
      if (!isPlayingRef.current) return;
      playMelody();
      setTimeout(() => {
        if (isPlayingRef.current) loop();
      }, loopDuration * 1000);
    };
    loop();
  }, [playMelody]);

  const stopMusic = useCallback(() => {
    isPlayingRef.current = false;
    setIsPlaying(false);
    if (gainRef.current) {
      gainRef.current.gain.linearRampToValueAtTime(
        0,
        (audioCtxRef.current?.currentTime ?? 0) + 0.5,
      );
    }
  }, []);

  const toggleMusic = useCallback(() => {
    if (isPlayingRef.current) stopMusic();
    else startMusic();
  }, [startMusic, stopMusic]);

  return { isPlaying, toggleMusic, startMusic };
}

// ========== RANDOM GENERATORS ==========
function genBalloons(count: number): Balloon[] {
  const colors = [
    "#C61A22",
    "#D51E2A",
    "#8B0000",
    "#1A1A1E",
    "#6F0D12",
    "#FF4455",
    "#2A0B0D",
  ];
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 90 + 5,
    color: colors[Math.floor(Math.random() * colors.length)],
    size: 40 + Math.random() * 40,
    duration: 6 + Math.random() * 8,
    delay: Math.random() * 5,
  }));
}

function genConfetti(count: number): Confetti[] {
  const colors = [
    "#C61A22",
    "#D51E2A",
    "#FF6B6B",
    "#FFD700",
    "#FF69B4",
    "#FFFFFF",
    "#FFA500",
  ];
  const shapes = ["square", "rect", "circle"];
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    color: colors[Math.floor(Math.random() * colors.length)],
    size: 6 + Math.random() * 10,
    duration: 3 + Math.random() * 4,
    delay: Math.random() * 3,
    shape: shapes[Math.floor(Math.random() * shapes.length)],
  }));
}

function genHearts(count: number): Heart[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 90 + 5,
    size: 12 + Math.random() * 20,
    duration: 7 + Math.random() * 8,
    delay: Math.random() * 6,
  }));
}

function genSparkles(count: number): Sparkle[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: 10 + Math.random() * 80,
    y: 10 + Math.random() * 80,
    size: 8 + Math.random() * 14,
    delay: Math.random() * 3,
  }));
}

// ========== PARTICLE COMPONENTS ==========
function BalloonSvg({
  color,
  width,
  height,
}: { color: string; width: string | number; height: string | number }) {
  return (
    <svg
      viewBox="0 0 60 80"
      width={width}
      height={height}
      aria-label="balloon"
      role="img"
    >
      <title>Balloon</title>
      <ellipse cx="30" cy="30" rx="28" ry="30" fill={color} />
      <ellipse cx="22" cy="20" rx="8" ry="6" fill="white" opacity="0.2" />
      <line x1="30" y1="60" x2="30" y2="80" stroke={color} strokeWidth="2" />
    </svg>
  );
}

function FloatingBalloons({
  count = 8,
  active,
}: { count?: number; active: boolean }) {
  const [balloons] = useState(() => genBalloons(count));
  if (!active) return null;
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        overflow: "hidden",
      }}
    >
      {balloons.map((b) => (
        <div
          key={b.id}
          style={{
            position: "absolute",
            left: `${b.x}%`,
            bottom: "-60px",
            width: `${b.size}px`,
            height: `${b.size * 1.3}px`,
            animation: `floatBalloon ${b.duration}s ${b.delay}s ease-in-out infinite`,
          }}
        >
          <BalloonSvg color={b.color} width="100%" height="100%" />
        </div>
      ))}
    </div>
  );
}

function SideBalloons() {
  const leftColors = ["#C61A22", "#D51E2A", "#8B0000"];
  const rightColors = ["#1A1A1E", "#6F0D12", "#2A0B0D"];
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      {leftColors.map((color, i) => (
        <div
          key={`left-${color}`}
          style={{
            position: "absolute",
            left: `${i * 5 + 1}%`,
            bottom: `${10 + i * 8}%`,
            animation: `floatBalloonSide ${2.5 + i * 0.5}s ease-in-out infinite`,
            animationDelay: `${i * 0.4}s`,
          }}
        >
          <BalloonSvg
            color={color}
            width={`${50 + i * 10}px`}
            height={`${65 + i * 13}px`}
          />
        </div>
      ))}
      {rightColors.map((color, i) => (
        <div
          key={`right-${color}`}
          style={{
            position: "absolute",
            right: `${i * 5 + 1}%`,
            bottom: `${12 + i * 9}%`,
            animation: `floatBalloonSide ${3 + i * 0.6}s ease-in-out infinite`,
            animationDelay: `${i * 0.5 + 0.3}s`,
          }}
        >
          <BalloonSvg
            color={color}
            width={`${55 + i * 8}px`}
            height={`${72 + i * 10}px`}
          />
        </div>
      ))}
    </div>
  );
}

function ConfettiBurst({ active }: { active: boolean }) {
  const [pieces] = useState(() => genConfetti(50));
  if (!active) return null;
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        overflow: "hidden",
      }}
    >
      {pieces.map((p) => (
        <div
          key={p.id}
          style={{
            position: "absolute",
            left: `${p.x}%`,
            top: "-20px",
            width: p.shape === "rect" ? `${p.size * 2}px` : `${p.size}px`,
            height: `${p.size}px`,
            background: p.color,
            borderRadius: p.shape === "circle" ? "50%" : "2px",
            animation: `confettiFall ${p.duration}s ${p.delay}s ease-in forwards`,
          }}
        />
      ))}
    </div>
  );
}

function FloatingHearts({ active }: { active: boolean }) {
  const [hearts] = useState(() => genHearts(12));
  if (!active) return null;
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        overflow: "hidden",
      }}
    >
      {hearts.map((h) => (
        <div
          key={h.id}
          style={{
            position: "absolute",
            left: `${h.x}%`,
            bottom: "-40px",
            fontSize: `${h.size}px`,
            color: "#D51E2A",
            animation: `floatHeart ${h.duration}s ${h.delay}s ease-in-out infinite`,
            opacity: 0.6,
          }}
        >
          ♥
        </div>
      ))}
    </div>
  );
}

function Sparkles({ active }: { active: boolean }) {
  const [sparkles] = useState(() => genSparkles(16));
  if (!active) return null;
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      {sparkles.map((s) => (
        <div
          key={s.id}
          style={{
            position: "absolute",
            left: `${s.x}%`,
            top: `${s.y}%`,
            fontSize: `${s.size}px`,
            color: "#FFD700",
            animation: `sparkle ${1.5 + s.delay}s ${s.delay}s ease-in-out infinite`,
          }}
        >
          ✦
        </div>
      ))}
    </div>
  );
}

// ========== SLIDE WRAPPER ==========
function SlideWrapper({
  children,
  visible,
}: { children: React.ReactNode; visible: boolean }) {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        animation: visible
          ? "slideTransitionIn 0.6s ease-out forwards"
          : "none",
        opacity: visible ? 1 : 0,
        transition: "opacity 0.6s ease",
        padding: "2rem",
      }}
    >
      {children}
    </div>
  );
}

function GlowName({ style }: { style?: React.CSSProperties }) {
  return (
    <span
      style={{
        fontFamily: "'Dancing Script', cursive",
        fontSize: "clamp(3rem, 10vw, 7rem)",
        fontWeight: 700,
        color: "#F4F2F2",
        animation: "glowPulse 2s ease-in-out infinite",
        display: "block",
        lineHeight: 1.1,
        ...style,
      }}
    >
      RITHI ✨
    </span>
  );
}

// ========== SLIDES ==========
function Slide1() {
  return (
    <>
      <SideBalloons />
      <ConfettiBurst active />
      <Sparkles active />
      <SlideWrapper visible>
        <div style={{ textAlign: "center", zIndex: 10, position: "relative" }}>
          <p
            style={{
              fontFamily: "'Poppins', sans-serif",
              fontSize: "clamp(0.9rem, 2.5vw, 1.3rem)",
              color: "#CFCFD4",
              letterSpacing: "0.3em",
              textTransform: "uppercase",
              animation: "fadeSlideUp 0.8s 0.2s ease-out both",
              marginBottom: "0.5rem",
            }}
          >
            A Special Day For
          </p>
          <h1
            style={{
              fontFamily: "'Dancing Script', cursive",
              fontSize: "clamp(2rem, 7vw, 5rem)",
              fontWeight: 600,
              color: "#C61A22",
              animation: "fadeSlideUp 0.8s 0.4s ease-out both",
              marginBottom: "0.3rem",
            }}
          >
            Happy Birthday
          </h1>
          <GlowName />
          <p
            style={{
              fontFamily: "'Poppins', sans-serif",
              fontSize: "clamp(1rem, 2.5vw, 1.4rem)",
              color: "#F4F2F2",
              fontWeight: 300,
              animation: "fadeSlideUp 0.8s 1s ease-out both",
              marginTop: "1.5rem",
            }}
          >
            You are my everything
          </p>
        </div>
      </SlideWrapper>
    </>
  );
}

function Slide2() {
  return (
    <>
      <FloatingBalloons count={10} active />
      <SlideWrapper visible>
        <div style={{ textAlign: "center", zIndex: 10, position: "relative" }}>
          <p
            style={{
              fontFamily: "'Poppins', sans-serif",
              fontSize: "clamp(0.8rem, 2vw, 1.1rem)",
              color: "#C61A22",
              letterSpacing: "0.4em",
              textTransform: "uppercase",
              animation: "fadeSlideUp 0.8s 0.2s ease-out both",
            }}
          >
            Born to Shine
          </p>
          <div
            style={{
              fontFamily: "'Dancing Script', cursive",
              fontSize: "clamp(2.5rem, 8vw, 5.5rem)",
              fontWeight: 700,
              color: "#F4F2F2",
              animation: "fadeSlideUp 0.8s 0.5s ease-out both",
              margin: "0.3rem 0",
              textShadow: "0 0 30px #C61A2280",
            }}
          >
            03 · 04 · 2007
          </div>
          <p
            style={{
              fontFamily: "'Poppins', sans-serif",
              fontSize: "clamp(0.9rem, 2.2vw, 1.2rem)",
              color: "#CFCFD4",
              fontWeight: 300,
              animation: "fadeSlideUp 0.8s 0.8s ease-out both",
              marginTop: "0.8rem",
            }}
          >
            The day the world got a little more beautiful
          </p>
          <p
            style={{
              fontFamily: "'Dancing Script', cursive",
              fontSize: "clamp(1.5rem, 4vw, 2.5rem)",
              color: "#C61A22",
              animation: "fadeSlideUp 0.8s 1.1s ease-out both",
              marginTop: "1rem",
            }}
          >
            You are 19 today, Rithi ♥
          </p>
        </div>
      </SlideWrapper>
    </>
  );
}

function Slide3() {
  const lines = [
    "My sunshine on dark days",
    "My reason to smile",
    "My calm in every storm",
    "My whole world",
  ];
  return (
    <>
      <FloatingHearts active />
      <Sparkles active />
      <SlideWrapper visible>
        <div
          style={{
            textAlign: "center",
            zIndex: 10,
            position: "relative",
            maxWidth: "600px",
          }}
        >
          <h2
            style={{
              fontFamily: "'Dancing Script', cursive",
              fontSize: "clamp(2rem, 7vw, 4.5rem)",
              fontWeight: 700,
              color: "#C61A22",
              animation: "fadeSlideUp 0.8s 0.2s ease-out both",
              marginBottom: "0.5rem",
            }}
          >
            My Rithi
          </h2>
          <div style={{ margin: "1.2rem 0" }}>
            {lines.map((line, i) => (
              <p
                key={line}
                style={{
                  fontFamily: "'Poppins', sans-serif",
                  fontSize: "clamp(0.95rem, 2.5vw, 1.3rem)",
                  color: "#F4F2F2",
                  fontWeight: 300,
                  animation: `fadeSlideUp 0.8s ${0.5 + i * 0.25}s ease-out both`,
                  margin: "0.6rem 0",
                  padding: "0.4rem 1.5rem",
                  borderLeft: "3px solid #C61A22",
                  textAlign: "left",
                  background: "rgba(198, 26, 34, 0.08)",
                  borderRadius: "0 8px 8px 0",
                }}
              >
                {line}
              </p>
            ))}
          </div>
          <p
            style={{
              fontFamily: "'Dancing Script', cursive",
              fontSize: "clamp(1rem, 3vw, 1.8rem)",
              color: "#CFCFD4",
              animation: "fadeSlideUp 0.8s 1.6s ease-out both",
              fontStyle: "italic",
            }}
          >
            — Lucky
          </p>
        </div>
      </SlideWrapper>
    </>
  );
}

function Slide4() {
  const lines = [
    { text: "Peace", emoji: "🕊️" },
    { text: "Joy", emoji: "❤️" },
    { text: "Home", emoji: "🏠" },
    { text: "Everything", emoji: "🌟" },
  ];
  return (
    <>
      <FloatingHearts active />
      <SlideWrapper visible>
        <div style={{ textAlign: "center", zIndex: 10, position: "relative" }}>
          <h2
            style={{
              fontFamily: "'Dancing Script', cursive",
              fontSize: "clamp(1.8rem, 6vw, 4rem)",
              fontWeight: 700,
              color: "#C61A22",
              animation: "fadeSlideUp 0.8s 0.2s ease-out both",
              marginBottom: "0.3rem",
            }}
          >
            You are my...
          </h2>
          <p
            style={{
              fontFamily: "'Poppins', sans-serif",
              fontSize: "clamp(0.75rem, 1.8vw, 1rem)",
              color: "#CFCFD4",
              letterSpacing: "0.2em",
              animation: "fadeSlideUp 0.8s 0.4s ease-out both",
              marginBottom: "1.5rem",
            }}
          >
            RITHI
          </p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: "1rem",
              maxWidth: "500px",
            }}
          >
            {lines.map((line, i) => (
              <div
                key={line.text}
                style={{
                  animation: `popIn 0.6s ${0.6 + i * 0.2}s ease-out both`,
                  background:
                    "linear-gradient(135deg, rgba(198,26,34,0.15), rgba(42,11,13,0.4))",
                  border: "1px solid rgba(198,26,34,0.4)",
                  borderRadius: "12px",
                  padding: "1rem",
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: "clamp(1.5rem, 4vw, 2.5rem)" }}>
                  {line.emoji}
                </div>
                <div
                  style={{
                    fontFamily: "'Poppins', sans-serif",
                    fontSize: "clamp(1rem, 2.5vw, 1.4rem)",
                    fontWeight: 600,
                    color: "#F4F2F2",
                    marginTop: "0.3rem",
                  }}
                >
                  {line.text}
                </div>
              </div>
            ))}
          </div>
        </div>
      </SlideWrapper>
    </>
  );
}

function Slide5() {
  return (
    <>
      <FloatingHearts active />
      <Sparkles active />
      <SlideWrapper visible>
        <div style={{ textAlign: "center", zIndex: 10, position: "relative" }}>
          <p
            style={{
              fontFamily: "'Poppins', sans-serif",
              fontSize: "clamp(0.75rem, 1.8vw, 1rem)",
              color: "#CFCFD4",
              letterSpacing: "0.4em",
              textTransform: "uppercase",
              animation: "fadeSlideUp 0.8s 0.2s ease-out both",
              marginBottom: "0.5rem",
            }}
          >
            Two Souls, One Heartbeat
          </p>
          <h2
            style={{
              fontFamily: "'Dancing Script', cursive",
              fontSize: "clamp(3rem, 12vw, 8rem)",
              fontWeight: 700,
              background: "linear-gradient(135deg, #C61A22, #FF4455, #C61A22)",
              backgroundSize: "200% auto",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              animation:
                "fadeSlideUp 0.8s 0.4s ease-out both, shimmer 3s linear infinite",
              lineHeight: 1,
              marginBottom: "0.5rem",
            }}
          >
            AmiRithi
          </h2>
          <div
            style={{
              animation:
                "heartPulse 1.5s ease-in-out infinite, fadeSlideUp 0.8s 0.8s ease-out both",
              fontSize: "clamp(1.5rem, 4vw, 2.5rem)",
              fontFamily: "'Poppins', sans-serif",
              fontWeight: 700,
              color: "#F4F2F2",
              marginTop: "0.5rem",
            }}
          >
            Lucky ♥ Rithi
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "0.5rem",
              marginTop: "1.5rem",
              animation: "fadeSlideUp 0.8s 1.1s ease-out both",
            }}
          >
            {[{ delay: 0 }, { delay: 0.3 }, { delay: 0.6 }].map(({ delay }) => (
              <span
                key={delay}
                style={{
                  color: "#D51E2A",
                  fontSize: "clamp(1.5rem, 3vw, 2rem)",
                  animation: `heartPulse 1.5s ${delay}s ease-in-out infinite`,
                }}
              >
                ♥
              </span>
            ))}
          </div>
        </div>
      </SlideWrapper>
    </>
  );
}

function Slide6() {
  const wishes = [
    "May every day feel like today",
    "May you always shine bright",
    "May you be loved endlessly",
    "Just like you are, by me",
  ];
  return (
    <>
      <FloatingBalloons count={12} active />
      <ConfettiBurst active />
      <SlideWrapper visible>
        <div
          style={{
            textAlign: "center",
            zIndex: 10,
            position: "relative",
            maxWidth: "600px",
          }}
        >
          <h2
            style={{
              fontFamily: "'Dancing Script', cursive",
              fontSize: "clamp(1.8rem, 6vw, 4rem)",
              fontWeight: 700,
              color: "#C61A22",
              animation: "fadeSlideUp 0.8s 0.2s ease-out both",
              marginBottom: "0.3rem",
            }}
          >
            My wish for you,
          </h2>
          <p
            style={{
              fontFamily: "'Dancing Script', cursive",
              fontSize: "clamp(2rem, 7vw, 5rem)",
              fontWeight: 700,
              color: "#F4F2F2",
              animation:
                "glowPulse 2s ease-in-out infinite, fadeSlideUp 0.8s 0.4s ease-out both",
              marginBottom: "1.5rem",
            }}
          >
            Rithi
          </p>
          {wishes.map((wish, i) => (
            <p
              key={wish}
              style={{
                fontFamily: "'Poppins', sans-serif",
                fontSize: "clamp(0.9rem, 2.2vw, 1.2rem)",
                color: i === 3 ? "#C61A22" : "#F4F2F2",
                fontWeight: i === 3 ? 600 : 300,
                animation: `fadeSlideUp 0.8s ${0.6 + i * 0.25}s ease-out both`,
                margin: "0.5rem 0",
                fontStyle: i === 3 ? "italic" : "normal",
              }}
            >
              {wish}
            </p>
          ))}
        </div>
      </SlideWrapper>
    </>
  );
}

function Slide7() {
  return (
    <>
      <SideBalloons />
      <ConfettiBurst active />
      <FloatingBalloons count={15} active />
      <Sparkles active />
      <FloatingHearts active />
      <SlideWrapper visible>
        <div style={{ textAlign: "center", zIndex: 10, position: "relative" }}>
          <div
            style={{
              fontFamily: "'Poppins', sans-serif",
              fontSize: "clamp(0.75rem, 1.8vw, 1rem)",
              color: "#CFCFD4",
              letterSpacing: "0.5em",
              textTransform: "uppercase",
              animation: "fadeSlideUp 0.8s 0.2s ease-out both",
              marginBottom: "0.5rem",
            }}
          >
            ✦ With All My Love ✦
          </div>
          <h1
            style={{
              fontFamily: "'Dancing Script', cursive",
              fontSize: "clamp(2.5rem, 9vw, 6rem)",
              fontWeight: 700,
              color: "#F4F2F2",
              animation:
                "glowPulse 2s ease-in-out infinite, fadeSlideUp 0.8s 0.4s ease-out both",
              lineHeight: 1.1,
              marginBottom: "0.3rem",
            }}
          >
            Happy Birthday
          </h1>
          <div
            style={{
              fontFamily: "'Dancing Script', cursive",
              fontSize: "clamp(4rem, 15vw, 10rem)",
              fontWeight: 700,
              background: "linear-gradient(135deg, #C61A22, #FF6B6B, #D51E2A)",
              backgroundSize: "200% auto",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              animation:
                "shimmer 2s linear infinite, fadeSlideUp 0.8s 0.6s ease-out both",
              lineHeight: 1,
              marginBottom: "0.5rem",
            }}
          >
            RITHI!
          </div>
          <p
            style={{
              fontFamily: "'Poppins', sans-serif",
              fontSize: "clamp(0.9rem, 2.5vw, 1.3rem)",
              color: "#F4F2F2",
              fontWeight: 400,
              animation: "fadeSlideUp 0.8s 0.9s ease-out both",
              marginBottom: "0.5rem",
            }}
          >
            From Lucky, with all my love
          </p>
          <p
            style={{
              fontFamily: "'Dancing Script', cursive",
              fontSize: "clamp(1rem, 3vw, 1.8rem)",
              color: "#C61A22",
              animation: "fadeSlideUp 0.8s 1.1s ease-out both",
            }}
          >
            03 · 04 · 2007 → Forever
          </p>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "0.8rem",
              marginTop: "1.2rem",
              animation: "fadeSlideUp 0.8s 1.3s ease-out both",
            }}
          >
            {["🎂", "🎉", "🎈", "💝", "🎊"].map((emoji, i) => (
              <span
                key={emoji}
                style={{
                  fontSize: "clamp(1.5rem, 4vw, 2.5rem)",
                  animation: `sparkle 1.5s ${i * 0.2}s ease-in-out infinite`,
                  display: "inline-block",
                }}
              >
                {emoji}
              </span>
            ))}
          </div>
        </div>
      </SlideWrapper>
    </>
  );
}

function Slide8() {
  const ambitions = [
    {
      icon: "⚖️",
      title: "The Lawyer",
      line: "Fight for truth. Win every battle.",
      delay: 0.7,
    },
    {
      icon: "🏛️",
      title: "The IAS Officer",
      line: "Serve the nation. Lead with grace.",
      delay: 0.95,
    },
  ];

  const inspoLines = [
    { text: "The courtroom will bow to you", delay: 1.2 },
    { text: "The nation will rise with you", delay: 1.4 },
    { text: "You are built to rule, Rithi", delay: 1.6 },
  ];

  return (
    <>
      <SideBalloons />
      <FloatingBalloons count={18} active />
      <ConfettiBurst active />
      <FloatingHearts active />
      <Sparkles active />
      <SlideWrapper visible>
        <div
          style={{
            textAlign: "center",
            zIndex: 10,
            position: "relative",
            maxWidth: "640px",
            width: "100%",
          }}
        >
          {/* Gold crown + stars top row */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "0.5rem",
              marginBottom: "0.4rem",
              animation: "fadeSlideUp 0.8s 0.1s ease-out both",
            }}
          >
            {[
              { e: "🌟", k: "star-left" },
              { e: "👑", k: "crown" },
              { e: "🌟", k: "star-right" },
            ].map(({ e, k }, i) => (
              <span
                key={k}
                style={{
                  fontSize: "clamp(1.4rem, 3.5vw, 2.2rem)",
                  animation: `sparkle 1.5s ${i * 0.3}s ease-in-out infinite`,
                }}
              >
                {e}
              </span>
            ))}
          </div>

          {/* Title */}
          <p
            style={{
              fontFamily: "'Poppins', sans-serif",
              fontSize: "clamp(0.65rem, 1.6vw, 0.9rem)",
              color: "#FFD700",
              letterSpacing: "0.5em",
              textTransform: "uppercase",
              animation: "fadeSlideUp 0.8s 0.2s ease-out both",
              marginBottom: "0.2rem",
            }}
          >
            ✦ Your Dreams Are Waiting ✦
          </p>

          {/* Big RITHI */}
          <div
            style={{
              fontFamily: "'Dancing Script', cursive",
              fontSize: "clamp(3.5rem, 12vw, 8rem)",
              fontWeight: 700,
              background:
                "linear-gradient(135deg, #C61A22 30%, #FFD700 60%, #C61A22 90%)",
              backgroundSize: "200% auto",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              animation:
                "shimmer 2.5s linear infinite, fadeSlideUp 0.8s 0.35s ease-out both",
              lineHeight: 1,
              marginBottom: "0.1rem",
              textShadow: "none",
            }}
          >
            RITHI
          </div>

          {/* Sub-header */}
          <p
            style={{
              fontFamily: "'Poppins', sans-serif",
              fontSize: "clamp(0.7rem, 1.8vw, 1rem)",
              color: "#FFD700",
              letterSpacing: "0.3em",
              textTransform: "uppercase",
              fontWeight: 600,
              animation: "fadeSlideUp 0.8s 0.5s ease-out both",
              marginBottom: "0.8rem",
            }}
          >
            Born to Lead · Future Star
          </p>

          {/* Ambition cards */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: "0.7rem",
              marginBottom: "0.9rem",
            }}
          >
            {ambitions.map((a) => (
              <div
                key={a.title}
                style={{
                  animation: `popIn 0.6s ${a.delay}s ease-out both`,
                  background:
                    "linear-gradient(135deg, rgba(255,215,0,0.08), rgba(198,26,34,0.15))",
                  border: "1px solid rgba(255,215,0,0.35)",
                  borderRadius: "14px",
                  padding: "0.8rem 0.7rem",
                  textAlign: "center",
                  boxShadow: "0 0 18px rgba(255,215,0,0.1)",
                }}
              >
                <div
                  style={{
                    fontSize: "clamp(1.5rem, 4vw, 2.2rem)",
                    marginBottom: "0.3rem",
                  }}
                >
                  {a.icon}
                </div>
                <div
                  style={{
                    fontFamily: "'Poppins', sans-serif",
                    fontSize: "clamp(0.75rem, 2vw, 1rem)",
                    fontWeight: 700,
                    color: "#FFD700",
                    marginBottom: "0.2rem",
                  }}
                >
                  {a.title}
                </div>
                <div
                  style={{
                    fontFamily: "'Poppins', sans-serif",
                    fontSize: "clamp(0.65rem, 1.5vw, 0.85rem)",
                    fontWeight: 300,
                    color: "#F4F2F2",
                    fontStyle: "italic",
                  }}
                >
                  {a.line}
                </div>
              </div>
            ))}
          </div>

          {/* Inspirational lines */}
          <div style={{ marginBottom: "0.7rem" }}>
            {inspoLines.map(({ text, delay }) => (
              <p
                key={text}
                style={{
                  fontFamily: "'Poppins', sans-serif",
                  fontSize: "clamp(0.8rem, 2vw, 1.05rem)",
                  color: "#F4F2F2",
                  fontWeight: 300,
                  animation: `fadeSlideUp 0.8s ${delay}s ease-out both`,
                  margin: "0.25rem 0",
                  letterSpacing: "0.01em",
                }}
              >
                {text}
              </p>
            ))}
          </div>

          {/* Signature */}
          <p
            style={{
              fontFamily: "'Dancing Script', cursive",
              fontSize: "clamp(1.1rem, 3vw, 1.9rem)",
              color: "#C61A22",
              animation: "fadeSlideUp 0.8s 1.8s ease-out both",
              marginBottom: "0.3rem",
            }}
          >
            — AmiRithi 💛
          </p>

          {/* Birthday date */}
          <p
            style={{
              fontFamily: "'Poppins', sans-serif",
              fontSize: "clamp(0.65rem, 1.5vw, 0.85rem)",
              color: "rgba(255,215,0,0.55)",
              letterSpacing: "0.3em",
              animation: "fadeSlideUp 0.8s 2s ease-out both",
              marginBottom: "0.6rem",
            }}
          >
            03 · 04 · 2007
          </p>

          {/* Bottom emoji row */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "0.7rem",
              animation: "fadeSlideUp 0.8s 2.2s ease-out both",
            }}
          >
            {["⚖️", "🏛️", "👑", "🌟", "💫"].map((emoji, i) => (
              <span
                key={emoji}
                style={{
                  fontSize: "clamp(1.2rem, 3vw, 1.8rem)",
                  animation: `sparkle 1.5s ${i * 0.2}s ease-in-out infinite`,
                  display: "inline-block",
                }}
              >
                {emoji}
              </span>
            ))}
          </div>
        </div>
      </SlideWrapper>
    </>
  );
}

// ========== NAV CONFIG ==========
const NAV_LABELS = [
  { back: null, forward: "Open Her Story →" },
  { back: "← Back to Love", forward: "Her Heart →" },
  { back: "← Her Day", forward: "Feel the Love →" },
  { back: "← Who She Is", forward: "Our Bond →" },
  { back: "← Her Role", forward: "Make a Wish →" },
  { back: "← AmiRithi", forward: "Grand Finale →" },
  { back: "← The Wish", forward: "Forever & Beyond →" },
  { back: "← The Finale", forward: "♥ Start Again" },
];

const SLIDES = [Slide1, Slide2, Slide3, Slide4, Slide5, Slide6, Slide7, Slide8];

// ========== MAIN APP ==========
export default function App() {
  const [current, setCurrent] = useState(0);
  const [transitioning, setTransitioning] = useState(false);
  const { isPlaying, toggleMusic, startMusic } = useBirthdayMusic();

  const goTo = useCallback(
    (index: number) => {
      if (transitioning) return;
      const next = index < 0 ? 0 : index >= SLIDES.length ? 0 : index;
      setTransitioning(true);
      setTimeout(() => {
        setCurrent(next);
        setTransitioning(false);
      }, 300);
      startMusic();
    },
    [transitioning, startMusic],
  );

  const handleForward = useCallback(() => goTo(current + 1), [goTo, current]);
  const handleBack = useCallback(() => goTo(current - 1), [goTo, current]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "ArrowDown") handleForward();
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") handleBack();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [handleForward, handleBack]);

  const nav = NAV_LABELS[current];
  const SlideComponent = SLIDES[current];

  return (
    <main
      data-ocid="app.page"
      style={{
        width: "100vw",
        height: "100vh",
        background:
          "radial-gradient(ellipse at center, #2A0B0D 0%, #0B0B0D 70%)",
        position: "relative",
        overflow: "hidden",
        fontFamily: "'Poppins', sans-serif",
      }}
    >
      {/* Ambient background hearts */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        {[
          { left: "10%", top: "20%", size: 60, dur: 4, delay: 0 },
          { left: "25%", top: "45%", size: 80, dur: 5, delay: 0.7 },
          { left: "40%", top: "70%", size: 100, dur: 6, delay: 1.4 },
          { left: "55%", top: "20%", size: 120, dur: 7, delay: 2.1 },
          { left: "70%", top: "45%", size: 140, dur: 8, delay: 2.8 },
          { left: "85%", top: "70%", size: 160, dur: 9, delay: 3.5 },
        ].map(({ left, top, size, dur, delay }) => (
          <div
            key={left}
            style={{
              position: "absolute",
              left,
              top,
              color: "rgba(198,26,34,0.08)",
              fontSize: `${size}px`,
              animation: `driftHeart ${dur}s ease-in-out infinite`,
              animationDelay: `${delay}s`,
            }}
          >
            ♥
          </div>
        ))}
      </div>

      {/* Slide content */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: transitioning ? 0 : 1,
          transition: "opacity 0.3s ease",
        }}
      >
        <SlideComponent />
      </div>

      {/* RITHI watermark on all slides */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          fontFamily: "'Dancing Script', cursive",
          fontSize: "clamp(8rem, 25vw, 18rem)",
          fontWeight: 700,
          color: "rgba(198, 26, 34, 0.04)",
          pointerEvents: "none",
          userSelect: "none",
          whiteSpace: "nowrap",
          zIndex: 1,
        }}
      >
        RITHI
      </div>

      {/* Music button */}
      <button
        type="button"
        data-ocid="music.toggle"
        onClick={toggleMusic}
        style={{
          position: "fixed",
          top: "1rem",
          right: "1rem",
          background: isPlaying ? "rgba(198,26,34,0.9)" : "rgba(26,26,30,0.9)",
          border: "1px solid rgba(198,26,34,0.6)",
          borderRadius: "2rem",
          padding: "0.5rem 1rem",
          color: "#F4F2F2",
          fontFamily: "'Poppins', sans-serif",
          fontSize: "0.75rem",
          fontWeight: 600,
          cursor: "pointer",
          zIndex: 100,
          display: "flex",
          alignItems: "center",
          gap: "0.4rem",
          letterSpacing: "0.05em",
          transition: "all 0.3s ease",
          backdropFilter: "blur(10px)",
        }}
      >
        <span style={{ fontSize: "1rem" }}>{isPlaying ? "🎵" : "🎶"}</span>
        {isPlaying ? "Music On" : "Play Music"}
      </button>

      {/* Slide indicators */}
      <div
        data-ocid="slides.nav"
        style={{
          position: "fixed",
          top: "1rem",
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          gap: "0.5rem",
          zIndex: 100,
        }}
      >
        {["s1", "s2", "s3", "s4", "s5", "s6", "s7", "s8"].map((name, i) => (
          <button
            type="button"
            key={name}
            data-ocid="slides.tab"
            onClick={() => goTo(i)}
            aria-label={`Go to slide ${i + 1}`}
            style={{
              width: i === current ? "2rem" : "0.6rem",
              height: "0.6rem",
              borderRadius: "1rem",
              background: i === current ? "#C61A22" : "rgba(244,242,242,0.3)",
              border: "none",
              cursor: "pointer",
              transition: "all 0.4s ease",
              padding: 0,
            }}
          />
        ))}
      </div>

      {/* Navigation buttons */}
      <div
        style={{
          position: "fixed",
          bottom: "2rem",
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: "1rem",
          zIndex: 100,
          padding: "0 1rem",
        }}
      >
        {nav.back && (
          <button
            type="button"
            data-ocid="nav.back_button"
            onClick={handleBack}
            style={{
              background: "rgba(26,26,30,0.5)",
              border: "2px solid rgba(198,26,34,0.7)",
              borderRadius: "2rem",
              padding: "0.7rem 1.5rem",
              color: "#F4F2F2",
              fontFamily: "'Poppins', sans-serif",
              fontSize: "clamp(0.7rem, 2vw, 0.9rem)",
              fontWeight: 600,
              cursor: "pointer",
              letterSpacing: "0.05em",
              transition: "all 0.3s ease",
              backdropFilter: "blur(10px)",
            }}
          >
            {nav.back}
          </button>
        )}

        <span
          style={{
            fontFamily: "'Dancing Script', cursive",
            color: "rgba(244,242,242,0.4)",
            fontSize: "1rem",
          }}
        >
          {current + 1} / {SLIDES.length}
        </span>

        {nav.forward && (
          <button
            type="button"
            data-ocid="nav.forward_button"
            onClick={handleForward}
            style={{
              background: "linear-gradient(135deg, #C61A22, #D51E2A)",
              border: "none",
              borderRadius: "2rem",
              padding: "0.7rem 1.5rem",
              color: "#F4F2F2",
              fontFamily: "'Poppins', sans-serif",
              fontSize: "clamp(0.7rem, 2vw, 0.9rem)",
              fontWeight: 600,
              cursor: "pointer",
              letterSpacing: "0.05em",
              transition: "all 0.3s ease",
              boxShadow: "0 4px 20px rgba(198,26,34,0.4)",
            }}
          >
            {nav.forward}
          </button>
        )}
      </div>

      {/* Footer */}
      <div
        style={{
          position: "fixed",
          bottom: "0.3rem",
          left: 0,
          right: 0,
          textAlign: "center",
          zIndex: 99,
        }}
      >
        <p
          style={{
            color: "rgba(207,207,212,0.3)",
            fontSize: "0.6rem",
            fontFamily: "'Poppins', sans-serif",
          }}
        >
          © {new Date().getFullYear()}. Built with ♥ using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            style={{ color: "rgba(198,26,34,0.5)", textDecoration: "none" }}
            target="_blank"
            rel="noreferrer"
          >
            caffeine.ai
          </a>
        </p>
      </div>
    </main>
  );
}
