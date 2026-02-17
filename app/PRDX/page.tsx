"use client";

import { AnimatePresence, motion } from "framer-motion";
import { VT323 } from "next/font/google";
import { useRouter } from "next/navigation";
import Link from "next/link";
import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { useEffect, useRef, useState, type MouseEvent } from "react";

const vhsFont = VT323({ weight: "400", subsets: ["latin"], display: "swap" });

function VhsStamp({ lowPowerMode }: { lowPowerMode: boolean }) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const vhsDate = now.toLocaleDateString(undefined, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const vhsTime = now.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  return (
    <motion.div
      className={`pointer-events-none absolute bottom-6 right-8 z-[17] hidden text-[#ffc0c0] md:block ${vhsFont.className}`}
      animate={lowPowerMode ? { opacity: 0.92 } : { opacity: [0.72, 1, 0.78, 1], x: [0, 0.5, -0.5, 0] }}
      transition={lowPowerMode ? { duration: 0.2 } : { duration: 1.9, repeat: Infinity, ease: "linear" }}
      style={{
        filter: "url(#crtGlassWarp)",
        transform: "perspective(900px) rotateX(2deg) rotateZ(-1deg) scaleX(1.02)",
        transformOrigin: "100% 100%",
        letterSpacing: "0.1em",
        textShadow: "0 0 8px rgba(255, 132, 132, 0.5), 0 0 2px rgba(255, 208, 208, 0.9)",
      }}
    >
      <div className="text-[26px] uppercase leading-none">REC {vhsDate}</div>
      <div className="text-[38px] leading-none">{vhsTime}</div>
    </motion.div>
  );
}

export const PRDX_FX = {
  INTRO_DURATION_MS: 2500,
  WING_HOLD_S: 1.0,
  WING_SPLIT_S: 2,
  WING_BASE_GAP: 1.55,
  WING_IDLE_SWAY_X: 0.1,
  WING_IDLE_SWAY_Y: 0.07,
  WING_IDLE_SPEED: 1.85,
  WING_IDLE_BREATH: 0.03,
  BLOOM_STRENGTH: 0.25,
  BLOOM_RADIUS: 0.3,
  BLOOM_THRESHOLD: 0.1,
  CRT_WARP: 0.64,
  CRT_SCAN_INTENSITY: 0.16,
  CRT_RGB_SPLIT: 0.019,
  AMBIENT_ALPHA: 0.00,
} as const;

export const PRDX_THEME = {
  FLASH_RGB: "255,66,66",
  FLASH_MAX_OPACITY: 0.28,
  FLASH_FALLOFF: "62%",
  PLAYER_ACCENT: "#cf4f4f",
  PLAYER_TEXT: "#ffd7d7",
  PLAYER_PANEL_BG: "#12090a",
  PLAYER_BTN_BG: "#1b0d0f",
  PLAYER_BTN_BG_ALT: "#15090a",
  PLAYER_RANGE_ACCENT: "#cf4f4f",
  PLAYER_FRAME_BG: "#090506cc",
  PLAYER_FRAME_BORDER: "#cf4f4f66",
  PLAYER_GLOW: "rgba(235, 86, 86, 0.29)",
  PLAYER_DROP_SHADOW: "0 34px 88px rgba(0,0,0,0.7)",
  PLAYER_FOCUS_SCALE: 1.11,
  PLAYER_FOCUS_Y: -20,
} as const;

export const PRDX_SIGNAL = {
  FLASH_GAIN: 0.34,
  BASS_WEIGHT: 1.45,
  VOCAL_WEIGHT: 0.2,
  TEXTURE_IDLE: 0.34,
  TEXTURE_PLAYING: 0.12,
  CRT_PULSE_GAIN: 0.55,
} as const;

function createWingMaterial(texture: unknown) {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    uniforms: {
      uMap: { value: texture },
      uTint: { value: new THREE.Color("#ffe5e5") },
      uOpacity: { value: 0.98 },
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      precision highp float;
      varying vec2 vUv;
      uniform sampler2D uMap;
      uniform vec3 uTint;
      uniform float uOpacity;

      void main() {
        vec4 tex = texture2D(uMap, vUv);
        float alpha = tex.a * uOpacity;
        if (alpha < 0.01) discard;
        gl_FragColor = vec4(uTint * 1.35, alpha);
      }
    `,
  });
}

function AmbientCrtLayer({ lowPowerMode }: { lowPowerMode: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, lowPowerMode ? 1.1 : 1.8));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0);

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    const uniforms = {
      uTime: { value: 0 },
      uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
    };

    const material = new THREE.ShaderMaterial({
      transparent: true,
      uniforms,
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        precision highp float;
        varying vec2 vUv;
        uniform float uTime;
        uniform vec2 uResolution;

        float hash(vec2 p) {
          p = fract(p * vec2(123.34, 456.21));
          p += dot(p, p + 45.32);
          return fract(p.x * p.y);
        }

        void main() {
          vec2 p = vUv * 2.0 - 1.0;
          p *= 1.0 + dot(p, p) * 0.08;
          vec2 uv = p * 0.5 + 0.5;

          float inside = step(0.0, uv.x) * step(0.0, uv.y) * step(uv.x, 1.0) * step(uv.y, 1.0);
          float scan = sin((uv.y + uTime * 0.25) * uResolution.y * 0.7) * 0.035;
          float grain = (hash(uv * uResolution.xy + uTime * 40.0) - 0.5) * 0.07;
          float vignette = smoothstep(1.0, 0.26, distance(uv, vec2(0.5)));

          vec3 color = vec3(0.29, 0.08, 0.1);
          color += vec3(scan + grain, scan * 0.45, scan * 0.4);
          color *= vignette;

          gl_FragColor = vec4(color, ${PRDX_FX.AMBIENT_ALPHA.toFixed(2)} * inside);
        }
      `,
    });

    const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
    scene.add(quad);

    let raf = 0;
    const start = performance.now();

    let lastFrameTime = 0;
    const tick = () => {
      const now = performance.now();
      if (lowPowerMode && now - lastFrameTime < 33) {
        raf = window.requestAnimationFrame(tick);
        return;
      }
      lastFrameTime = now;
      uniforms.uTime.value = (performance.now() - start) / 1000;
      renderer.render(scene, camera);
      raf = window.requestAnimationFrame(tick);
    };

    const onResize = () => {
      renderer.setSize(window.innerWidth, window.innerHeight);
      uniforms.uResolution.value.set(window.innerWidth, window.innerHeight);
    };

    window.addEventListener("resize", onResize);
    tick();

    return () => {
      window.removeEventListener("resize", onResize);
      window.cancelAnimationFrame(raf);
      quad.geometry.dispose();
      material.dispose();
      renderer.dispose();
    };
  }, [lowPowerMode]);

  return <canvas ref={canvasRef} className="absolute inset-0" />;
}

function IntroWingsPostFx({ lowPowerMode }: { lowPowerMode: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, lowPowerMode ? 1.1 : 1.8));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#050304");

    const aspect = window.innerWidth / window.innerHeight;
    const camera = new THREE.PerspectiveCamera(32, aspect, 0.1, 100);
    camera.position.set(0, 0, 8.5);

    const wingGeometry = new THREE.PlaneGeometry(3.0, 3.0);
    const wingTexture = new THREE.TextureLoader().load("/PRDXwing.svg");
    wingTexture.colorSpace = THREE.SRGBColorSpace;
    wingTexture.minFilter = THREE.LinearFilter;
    wingTexture.magFilter = THREE.LinearFilter;
    wingTexture.generateMipmaps = false;
    wingTexture.needsUpdate = true;

    const leftMaterial = createWingMaterial(wingTexture);
    const rightMaterial = leftMaterial.clone();

    const leftWing = new THREE.Mesh(wingGeometry, leftMaterial);
    const rightWing = new THREE.Mesh(wingGeometry, rightMaterial);
    rightWing.scale.x = -1;
    scene.add(leftWing, rightWing);

    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));

    const bloom = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      PRDX_FX.BLOOM_STRENGTH,
      PRDX_FX.BLOOM_RADIUS,
      PRDX_FX.BLOOM_THRESHOLD,
    );
    composer.addPass(bloom);

    const crtPass = new ShaderPass({
      uniforms: {
        tDiffuse: { value: null },
        uTime: { value: 0 },
        uProgress: { value: 0 },
        uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        precision highp float;
        varying vec2 vUv;
        uniform sampler2D tDiffuse;
        uniform float uTime;
        uniform float uProgress;
        uniform vec2 uResolution;

        void main() {
          float crtPower = 1.0 - uProgress;

          vec2 p = vUv * 2.0 - 1.0;
          p *= 1.0 + dot(p, p) * (${PRDX_FX.CRT_WARP.toFixed(2)} * crtPower);
          vec2 uv = p * 0.5 + 0.5;

          float inside = step(0.0, uv.x) * step(0.0, uv.y) * step(uv.x, 1.0) * step(uv.y, 1.0);
          vec3 base = texture2D(tDiffuse, uv).rgb;

          float split = ${PRDX_FX.CRT_RGB_SPLIT.toFixed(4)} * crtPower;
          float rr = texture2D(tDiffuse, uv + vec2(split, 0.0)).r;
          float gg = texture2D(tDiffuse, uv).g;
          float bb = texture2D(tDiffuse, uv - vec2(split, 0.0)).b;

          vec3 color = vec3(rr, gg, bb);
          color = mix(base, color, 0.72 * crtPower);

          float scan = sin((uv.y + uTime * 0.28) * uResolution.y * 0.8) * ${PRDX_FX.CRT_SCAN_INTENSITY.toFixed(2)} * crtPower;
          color += vec3(scan, scan * 0.55, scan * 0.45);

          float vignette = smoothstep(1.0, 0.22, distance(uv, vec2(0.5)));
          color *= vignette;

          gl_FragColor = vec4(color, inside);
        }
      `,
    });
    composer.addPass(crtPass);

    let raf = 0;
    const start = performance.now();

    let lastFrameTime = 0;
    const tick = () => {
      const now = performance.now();
      if (lowPowerMode && now - lastFrameTime < 33) {
        raf = window.requestAnimationFrame(tick);
        return;
      }
      lastFrameTime = now;
      const t = (performance.now() - start) / 1000;
      const splitProgress = THREE.MathUtils.clamp((t - PRDX_FX.WING_HOLD_S) / PRDX_FX.WING_SPLIT_S, 0, 1);
      const idleWeight = 1 - splitProgress;
      const idleX = Math.sin(t * PRDX_FX.WING_IDLE_SPEED) * PRDX_FX.WING_IDLE_SWAY_X * idleWeight;
      const idleY = Math.cos(t * (PRDX_FX.WING_IDLE_SPEED * 0.85)) * PRDX_FX.WING_IDLE_SWAY_Y * idleWeight;
      const idleScale = 1 + Math.sin(t * 1.22) * PRDX_FX.WING_IDLE_BREATH * idleWeight;

      const offset = PRDX_FX.WING_BASE_GAP + splitProgress * 5.35 + idleX;
      leftWing.position.set(-offset, idleY, 0);
      rightWing.position.set(offset, -idleY * 0.6, 0);
      leftWing.scale.set(idleScale, idleScale, 1);
      rightWing.scale.set(-idleScale, idleScale, 1);

      leftWing.rotation.set(0, THREE.MathUtils.degToRad(8 + splitProgress * 24), THREE.MathUtils.degToRad(-1.2 - splitProgress * 4.5));
      rightWing.rotation.set(0, THREE.MathUtils.degToRad(-8 - splitProgress * 24), THREE.MathUtils.degToRad(1.2 + splitProgress * 4.5));

      const opacity =
        splitProgress < 0.82
          ? 0.96
          : Math.max(0, 0.96 * (1 - (splitProgress - 0.82) / 0.18));
      leftMaterial.uniforms.uOpacity.value = Math.max(0, opacity);
      rightMaterial.uniforms.uOpacity.value = Math.max(0, opacity);

      crtPass.uniforms.uTime.value = t;
      crtPass.uniforms.uProgress.value = THREE.MathUtils.clamp(t / (PRDX_FX.INTRO_DURATION_MS / 1000), 0, 1);
      composer.render();
      raf = window.requestAnimationFrame(tick);
    };

    const onResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      renderer.setSize(w, h);
      composer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      bloom.setSize(w, h);
      crtPass.uniforms.uResolution.value.set(w, h);
    };

    window.addEventListener("resize", onResize);
    tick();

    return () => {
      window.removeEventListener("resize", onResize);
      window.cancelAnimationFrame(raf);
      wingGeometry.dispose();
      wingTexture.dispose();
      leftMaterial.dispose();
      rightMaterial.dispose();
      bloom.dispose();
      composer.dispose();
      renderer.dispose();
    };
  }, [lowPowerMode]);

  return <canvas ref={canvasRef} className="absolute inset-0" />;
}

function StaticNoiseBurst() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let raf = 0;
    let width = 0;
    let height = 0;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      width = Math.max(1, Math.floor(window.innerWidth * 0.45));
      height = Math.max(1, Math.floor(window.innerHeight * 0.45));
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const draw = () => {
      const image = ctx.createImageData(width, height);
      const data = image.data;
      for (let i = 0; i < data.length; i += 4) {
        const n = Math.random() * 255;
        data[i] = Math.min(255, n * 1.06);
        data[i + 1] = n * 0.58;
        data[i + 2] = n * 0.6;
        data[i + 3] = 160;
      }
      ctx.putImageData(image, 0, 0);

      if (Math.random() < 0.45) {
        const y = Math.floor(Math.random() * height);
        ctx.fillStyle = "rgba(255,170,170,0.22)";
        ctx.fillRect(0, y, width, 1);
      }

      raf = window.requestAnimationFrame(draw);
    };

    resize();
    draw();
    window.addEventListener("resize", resize);
    return () => {
      window.removeEventListener("resize", resize);
      window.cancelAnimationFrame(raf);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 h-full w-full [image-rendering:pixelated]" />;
}

export default function PrdxPage() {
  const router = useRouter();
  const [introDone, setIntroDone] = useState(false);
  const [cursorVisible, setCursorVisible] = useState(false);
  const [cursorPos, setCursorPos] = useState({ x: -120, y: -120 });
  const [panelScroll, setPanelScroll] = useState(0);
  const [flashLevel, setFlashLevel] = useState(0);
  const [scanPulse, setScanPulse] = useState(0);
  const [videoPlaying, setVideoPlaying] = useState(false);
  const [videoTime, setVideoTime] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const [videoMuted, setVideoMuted] = useState(false);
  const [videoVolume, setVideoVolume] = useState(0.82);
  const [cleanMode, setCleanMode] = useState(false);
  const [isModeSwitching, setIsModeSwitching] = useState(false);
  const [screenBreakActive, setScreenBreakActive] = useState(false);
  const [lowPowerMode] = useState(() => {
    if (typeof window === "undefined") return false;
    const nav = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const weakCpu = (nav.hardwareConcurrency ?? 8) <= 4;
    const lowMemory = (nav.deviceMemory ?? 8) <= 4;
    const saveData = nav.connection?.saveData === true;
    return prefersReducedMotion || saveData || (weakCpu && lowMemory);
  });
  const [isFirefox] = useState(() => {
    if (typeof window === "undefined") return false;
    const ua = navigator.userAgent.toLowerCase();
    return ua.includes("firefox") && !ua.includes("seamonkey");
  });
  const performanceMode = lowPowerMode || isFirefox;
  const [isShuttingDown, setIsShuttingDown] = useState(false);
  const cursorTarget = useRef({ x: -120, y: -120 });
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const dataRef = useRef<Uint8Array<ArrayBuffer> | null>(null);
  const flashRafRef = useRef<number | null>(null);
  const breakTimeoutRef = useRef<number | null>(null);
  const bassEnvelopeRef = useRef(0);
  const [flashGain, setFlashGain] = useState<number>(PRDX_SIGNAL.FLASH_GAIN);
  const [bassWeight, setBassWeight] = useState<number>(PRDX_SIGNAL.BASS_WEIGHT);
  const [vocalWeight, setVocalWeight] = useState<number>(PRDX_SIGNAL.VOCAL_WEIGHT);
  const [textureIdleOpacity, setTextureIdleOpacity] = useState<number>(PRDX_SIGNAL.TEXTURE_IDLE);
  const [texturePlayingOpacity, setTexturePlayingOpacity] = useState<number>(PRDX_SIGNAL.TEXTURE_PLAYING);
  const [crtPulseGain, setCrtPulseGain] = useState<number>(PRDX_SIGNAL.CRT_PULSE_GAIN);
  const [viewport, setViewport] = useState({ w: 1, h: 1 });

  useEffect(() => {
    const timeout = window.setTimeout(() => setIntroDone(true), PRDX_FX.INTRO_DURATION_MS);
    return () => window.clearTimeout(timeout);
  }, []);


  useEffect(() => {
    const syncViewport = () => {
      setViewport({ w: window.innerWidth, h: window.innerHeight });
    };
    syncViewport();
    window.addEventListener("resize", syncViewport);
    return () => window.removeEventListener("resize", syncViewport);
  }, []);

  useEffect(() => {
    if (performanceMode) {
      return;
    }
    let raf = 0;
    const tick = () => {
      setCursorPos((prev) => ({
        x: prev.x + (cursorTarget.current.x - prev.x) * 0.12,
        y: prev.y + (cursorTarget.current.y - prev.y) * 0.12,
      }));
      raf = window.requestAnimationFrame(tick);
    };
    tick();
    return () => window.cancelAnimationFrame(raf);
  }, [performanceMode]);

  useEffect(() => {
    return () => {
      if (flashRafRef.current !== null) {
        window.cancelAnimationFrame(flashRafRef.current);
      }
      if (breakTimeoutRef.current !== null) {
        window.clearTimeout(breakTimeoutRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => undefined);
      }
    };
  }, []);

  const ensureAudioAnalyser = async () => {
    const video = videoRef.current;
    if (!video) return;

    if (!audioContextRef.current) {
      const context = new window.AudioContext();
      const analyser = context.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.68;
      const source = context.createMediaElementSource(video);
      source.connect(analyser);
      analyser.connect(context.destination);

      audioContextRef.current = context;
      analyserRef.current = analyser;
      sourceRef.current = source;
      dataRef.current = new Uint8Array(analyser.frequencyBinCount) as Uint8Array<ArrayBuffer>;
    }

    if (audioContextRef.current.state !== "running") {
      await audioContextRef.current.resume();
    }
  };

  const stopFlashLoop = () => {
    if (flashRafRef.current !== null) {
      window.cancelAnimationFrame(flashRafRef.current);
      flashRafRef.current = null;
    }
    bassEnvelopeRef.current = 0;
    setFlashLevel(0);
    setScanPulse(0);
  };

  const startFlashLoop = () => {
    if (flashRafRef.current !== null) {
      return;
    }

    const loop = () => {
      const analyser = analyserRef.current;
      const data = dataRef.current;
      const video = videoRef.current;

      if (!video || video.paused || video.ended || !analyser || !data) {
        setFlashLevel((prev) => (prev > 0.01 ? prev * 0.8 : 0));
        setScanPulse((prev) => (prev > 0.01 ? prev * 0.76 : 0));
        if (!videoPlaying) {
          flashRafRef.current = null;
          return;
        }
      } else {
        analyser.getByteFrequencyData(data as unknown as Uint8Array<ArrayBuffer>);
        let bass = 0;
        let lowMids = 0;
        let vocal = 0;
        const bassCount = Math.max(1, Math.floor(data.length * 0.12));
        const lowMidStart = bassCount;
        const lowMidEnd = Math.max(lowMidStart + 1, Math.floor(data.length * 0.26));
        const vocalStart = lowMidEnd;
        const vocalEnd = Math.max(vocalStart + 1, Math.floor(data.length * 0.56));

        for (let index = 0; index < bassCount; index += 1) bass += data[index];
        for (let index = lowMidStart; index < lowMidEnd; index += 1) lowMids += data[index];
        for (let index = vocalStart; index < vocalEnd; index += 1) vocal += data[index];

        bass /= bassCount * 255;
        lowMids /= (lowMidEnd - lowMidStart) * 255;
        vocal /= (vocalEnd - vocalStart) * 255;

        const envelope = bassEnvelopeRef.current * 0.72 + bass * 0.28;
        const bassPunch = Math.max(0, bass - envelope) * 1.95;
        bassEnvelopeRef.current = envelope;

        const target = Math.min(1, bass * bassWeight + lowMids * 0.42 + vocal * vocalWeight + bassPunch);
        setFlashLevel((prev) => prev * 0.62 + target * 0.38);
        const pulseTarget = Math.min(1, bassPunch * 1.3 + bass * 0.36);
        setScanPulse((prev) => prev * 0.58 + pulseTarget * 0.42);
      }

      flashRafRef.current = window.requestAnimationFrame(loop);
    };

    flashRafRef.current = window.requestAnimationFrame(loop);
  };

  const togglePlayback = async () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      await ensureAudioAnalyser();
      await video.play();
    } else {
      video.pause();
    }
  };

  const resolveVideoDuration = (video: HTMLVideoElement) => {
    const rawDuration = video.duration;
    if (Number.isFinite(rawDuration) && rawDuration > 0) {
      return rawDuration;
    }
    if (video.seekable && video.seekable.length > 0) {
      const end = video.seekable.end(video.seekable.length - 1);
      if (Number.isFinite(end) && end > 0) {
        return end;
      }
    }
    return 0;
  };

  const syncDuration = (video: HTMLVideoElement) => {
    const nextDuration = resolveVideoDuration(video);
    if (nextDuration > 0) {
      setVideoDuration(nextDuration);
    }
  };

  const safeDuration = Number.isFinite(videoDuration) && videoDuration > 0 ? videoDuration : 0;
  const safeTime = Number.isFinite(videoTime) ? Math.min(videoTime, safeDuration || videoTime) : 0;
  const cursorForParallaxX = cursorVisible ? cursorPos.x : viewport.w * 0.5;
  const cursorForParallaxY = cursorVisible ? cursorPos.y : viewport.h * 0.5;
  const parallaxX = Math.max(-8, Math.min(8, ((cursorForParallaxX - viewport.w * 0.5) / Math.max(1, viewport.w)) * 16));
  const parallaxY = Math.max(-6, Math.min(6, ((cursorForParallaxY - viewport.h * 0.5) / Math.max(1, viewport.h)) * 12));
  const seekVideo = (nextValue: number) => {
    const video = videoRef.current;
    if (!video || !Number.isFinite(nextValue)) return;
    const clamped = Math.min(Math.max(nextValue, 0), safeDuration || nextValue);
    video.currentTime = clamped;
    setVideoTime(clamped);
  };

  const handleBackToPortfolio = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    if (isShuttingDown) return;
    setIsShuttingDown(true);
    window.setTimeout(() => {
      router.push("/");
    }, 1000);
  };

  const handleDownloadPrdx = () => {
    setScreenBreakActive(true);
    if (breakTimeoutRef.current !== null) {
      window.clearTimeout(breakTimeoutRef.current);
    }
    breakTimeoutRef.current = window.setTimeout(() => {
      setScreenBreakActive(false);
    }, 1050);
  };

  const handleToggleMode = () => {
    if (isModeSwitching) return;
    setIsModeSwitching(true);
    window.setTimeout(() => {
      setCleanMode((prev) => !prev);
    }, 140);
    window.setTimeout(() => {
      setIsModeSwitching(false);
    }, 620);
  };

  return (
    <div
      className={`relative h-screen overflow-hidden bg-[#020102] p-2 text-[#f8ebeb] md:p-4 ${
        cleanMode || performanceMode ? "" : "md:cursor-none md:[&_*]:cursor-none"
      }`}
      onMouseMove={(event) => {
        if (performanceMode) return;
        cursorTarget.current = { x: event.clientX, y: event.clientY };
        if (!cursorVisible) setCursorVisible(true);
      }}
      onMouseLeave={() => setCursorVisible(false)}
    >
      <svg className="pointer-events-none absolute h-0 w-0">
        <defs>
          <filter id="crtGlassWarp">
            <feTurbulence type="fractalNoise" baseFrequency="0.0035 0.012" numOctaves="1" seed="8" result="noise">
              <animate attributeName="baseFrequency" values="0.0035 0.012;0.0042 0.014;0.0035 0.012" dur="5.8s" repeatCount="indefinite" />
            </feTurbulence>
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="10" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
      </svg>
      <div className="relative h-[calc(100vh-1rem)] overflow-hidden rounded-[6%] border border-[#f4adad]/20 bg-[#090608] shadow-[0_0_0_1px_rgba(255,190,190,0.08),0_25px_70px_rgba(0,0,0,0.75)] md:h-[calc(100vh-2rem)]">
        <motion.button
          type="button"
          onClick={handleToggleMode}
          whileHover={{ y: -1, scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="absolute left-6 top-6 z-[85] border border-[#d85757]/35 bg-[#12090ac2] px-3 py-1.5 text-[10px] uppercase tracking-[0.15em] text-[#ffd8d8]/90 backdrop-blur-[2px] transition hover:border-[#d85757]/65 md:left-7 md:top-7"
        >
          {cleanMode ? "Aesthetic Mode" : "Clean Mode"}
        </motion.button>
        <AnimatePresence initial={false}>
          {isModeSwitching ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.14 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.26, ease: "easeOut" }}
              className="pointer-events-none absolute inset-0 z-[84] bg-[#050304]"
            />
          ) : null}
        </AnimatePresence>
        <AnimatePresence initial={false}>
        {introDone && !cleanMode && !performanceMode ? (
          <motion.div
            key="prdx-fx"
            className="pointer-events-none absolute inset-0"
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.55, ease: "easeOut" }}
          >
            <div className="pointer-events-none absolute inset-0 opacity-60 [background-image:radial-gradient(circle_at_12%_15%,rgba(194,47,47,0.25),transparent_44%),radial-gradient(circle_at_86%_78%,rgba(154,22,22,0.32),transparent_38%),linear-gradient(140deg,#0b0708_0%,#130709_45%,#090607_100%)]" />
            <div
              className="pointer-events-none absolute inset-0 mix-blend-soft-light opacity-30"
              style={{
                backgroundImage:
                  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E\")",
              }}
            />
            {!isFirefox ? (
              <div className="pointer-events-none absolute inset-0 z-[2] opacity-100">
                <AmbientCrtLayer lowPowerMode={performanceMode} />
              </div>
            ) : null}
            {!performanceMode ? (
              <>
                <motion.div
                  className="pointer-events-none absolute -left-[8%] top-[-12%] z-[6] h-[145%] w-[40%] bg-[linear-gradient(92deg,rgba(255,210,210,0.14)_0%,rgba(255,170,170,0.08)_36%,rgba(255,150,150,0.02)_62%,transparent_100%)] blur-[12px]"
                  animate={{ x: [-16, 24, -16], rotate: [-3.2, -1.2, -3.2], opacity: [0.22, 0.34, 0.22] }}
                  transition={{ duration: 13.5, repeat: Infinity, ease: "easeInOut" }}
                />
                <motion.div
                  className="pointer-events-none absolute right-[-11%] top-[-16%] z-[6] h-[155%] w-[36%] bg-[linear-gradient(268deg,rgba(255,196,196,0.12)_0%,rgba(255,145,145,0.07)_34%,rgba(255,125,125,0.02)_58%,transparent_100%)] blur-[14px]"
                  animate={{ x: [20, -22, 20], rotate: [3.6, 1.1, 3.6], opacity: [0.2, 0.32, 0.2] }}
                  transition={{ duration: 14.8, repeat: Infinity, ease: "easeInOut" }}
                />
              </>
            ) : null}
            <motion.div
              className="pointer-events-none absolute inset-0 z-[17]"
              animate={videoPlaying ? { opacity: texturePlayingOpacity } : { opacity: textureIdleOpacity }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              style={{
                backgroundImage: "url('/DirtyGlass.jpg')",
                backgroundSize: "cover",
                backgroundPosition: "center",
                mixBlendMode: "overlay",
              }}
            />
            {!performanceMode ? (
              <motion.div
                className="pointer-events-none absolute inset-0 z-[17]"
                animate={videoPlaying ? { opacity: texturePlayingOpacity * 0.33 } : { opacity: textureIdleOpacity * 0.41 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                style={{
                  filter: "saturate(1.12) contrast(1.05)",
                  backgroundImage: "url('/DirtyGlass.jpg')",
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  mixBlendMode: "screen",
                }}
              />
            ) : null}
            {!performanceMode ? (
              <motion.div
                className="pointer-events-none absolute inset-0 z-[20] bg-[linear-gradient(to_bottom,transparent_0%,rgba(255,190,190,0.05)_48%,transparent_100%)] mix-blend-screen"
                animate={{
                  y: ["-120%", "120%"],
                  opacity: [0.2, 0.28, 0.2],
                  x: [0, 1.2, 0],
                }}
                transition={{ duration: 5.4, repeat: Infinity, ease: "linear" }}
              />
            ) : null}
            <motion.div
              className="pointer-events-none absolute inset-0 z-[21] mix-blend-screen"
              animate={performanceMode ? { opacity: 0.14 } : { opacity: [0.16, 0.22, 0.16] }}
              transition={performanceMode ? { duration: 0.2 } : { duration: 1.9, repeat: Infinity, ease: "easeInOut" }}
              style={{
                backgroundImage:
                  "repeating-linear-gradient(to bottom, rgba(255,208,208,0.12) 0px, rgba(255,208,208,0.12) 1px, transparent 2px, transparent 4px)",
              }}
            />
            {!performanceMode ? (
              <motion.div
                className="pointer-events-none absolute inset-0 z-[19] bg-[linear-gradient(to_bottom,transparent_0%,rgba(255,152,152,0.08)_50%,transparent_100%)] blur-[1.5px] mix-blend-overlay"
                animate={{
                  y: ["-128%", "112%"],
                  opacity: [0.1, 0.16, 0.1],
                  x: [0, 1.6, 0],
                }}
                transition={{ duration: 6.1, repeat: Infinity, ease: "linear" }}
              />
            ) : null}
            <div
              className="pointer-events-none absolute inset-0 z-[17] rounded-[6%] border border-[#f3abab]/25"
              style={{
                opacity: 0.06 + scanPulse * 0.62,
                boxShadow: `inset 0 0 ${18 + scanPulse * 42}px rgba(241,122,122,${0.08 + scanPulse * 0.44}), 0 0 ${8 + scanPulse * 36}px rgba(229,84,84,${0.04 + scanPulse * 0.36})`,
              }}
            />
            {!performanceMode ? (
              <motion.div
                className="pointer-events-none absolute inset-[1px] z-[22] rounded-[6%] border border-[#ff9d9d]/25"
                animate={{ opacity: [0.16, 0.3, 0.16] }}
                transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
                style={{
                  boxShadow:
                    "inset 0 0 26px rgba(236,106,106,0.22), inset 0 0 86px rgba(132,26,26,0.2), 0 0 10px rgba(214,72,72,0.14)",
                }}
              />
            ) : null}
            <div
              className="pointer-events-none absolute inset-0 z-[19] mix-blend-screen"
              style={{
                background: `radial-gradient(circle at center, rgba(${PRDX_THEME.FLASH_RGB},0.52), rgba(80,18,18,0) ${PRDX_THEME.FLASH_FALLOFF})`,
                opacity: Math.min(PRDX_THEME.FLASH_MAX_OPACITY, flashLevel * flashGain),
              }}
            />
            <div className="pointer-events-none absolute inset-0 z-[18] shadow-[inset_0_0_130px_rgba(0,0,0,0.88)]" />
            <div className="pointer-events-none absolute inset-0 z-[18] bg-[radial-gradient(circle_at_center,transparent_55%,rgba(0,0,0,0.94)_100%)]" />
            <VhsStamp lowPowerMode={performanceMode} />
          </motion.div>
        ) : null}
        </AnimatePresence>
        <AnimatePresence>
          {screenBreakActive ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="pointer-events-none absolute inset-0 z-[95]"
            >
              <motion.div
                className="absolute inset-0 mix-blend-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.55, 0.3, 0] }}
                transition={{ duration: 0.95, ease: "easeOut" }}
              >
                <StaticNoiseBurst />
              </motion.div>
              <motion.div
                className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(235,104,104,0.6),rgba(198,72,72,0.22)_30%,rgba(0,0,0,0)_64%)]"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.62, 0.16, 0] }}
                transition={{ duration: 0.75, ease: "easeOut" }}
              />
              <motion.div
                className="absolute inset-0"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.2, 0.08, 0], x: [0, 2, -1, 0] }}
                transition={{ duration: 0.95, ease: "easeOut" }}
                style={{
                  backgroundImage:
                    "linear-gradient(to_bottom,transparent_0%,rgba(255,170,170,0.08)_49%,rgba(255,170,170,0.08)_51%,transparent_100%)",
                  mixBlendMode: "overlay",
                }}
              />
              <motion.div
                className="absolute inset-0"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.28, 0.1, 0] }}
                transition={{ duration: 0.62, ease: "easeOut" }}
                style={{
                  backgroundImage:
                    "repeating-linear-gradient(0deg,rgba(255,245,245,0.24)_0px,rgba(255,245,245,0.24)_1px,transparent_2px,transparent_6px)",
                  mixBlendMode: "screen",
                }}
              />
            </motion.div>
          ) : null}
        </AnimatePresence>

        <div
          className="prdx-scroll relative z-10 h-full overflow-y-auto"
          onScroll={(event) => {
            if (!performanceMode) {
              setPanelScroll(event.currentTarget.scrollTop);
            }
          }}
        >
        <main className="mx-auto flex min-h-full w-full max-w-6xl items-center px-6 py-20 md:px-10">
        <motion.div
          className="relative w-full"
          style={{
            transform: cleanMode || performanceMode ? "none" : "perspective(900px) rotateX(3deg) scaleX(1.028) scaleY(0.968)",
            transformOrigin: "50% 50%",
            filter: cleanMode || performanceMode ? "none" : "url(#crtGlassWarp)",
          }}
          animate={
            cleanMode || performanceMode
              ? { y: 0, rotateX: 0, scaleX: 1, scaleY: 1 }
              : { y: [0, -3, 0], rotateX: [3, 3.45, 3], scaleX: [1.028, 1.034, 1.028], scaleY: [0.968, 0.962, 0.968] }
          }
          transition={
            cleanMode || performanceMode
              ? { duration: 0.6, ease: "easeInOut" }
              : { duration: 8.4, repeat: Infinity, ease: "easeInOut" }
          }
        >
        <motion.section
          initial={{ opacity: 0, y: 24, scale: 0.985 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.75, delay: 0.16, ease: [0.2, 0.9, 0.2, 1] }}
          className="relative w-full border border-[#cb4c4c]/35 bg-[#0f0a0ccc] p-8 backdrop-blur-[2px] md:p-12"
          style={
            videoPlaying
              ? { clipPath: "none", boxShadow: "none", filter: "none" }
              : {
                  clipPath:
                    "polygon(0% 2%, 5% 0%, 95% 0%, 100% 4%, 100% 94%, 96% 100%, 7% 100%, 0% 97%)",
                  boxShadow: "0 0 80px rgba(168,32,32,0.22)",
                  filter: "drop-shadow(0 0 16px rgba(236,106,106,0.16))",
                }
          }
        >
          <div className="pointer-events-none absolute -top-[1px] left-[11%] h-2 w-7 bg-[#d95757]" />
          <div className="pointer-events-none absolute -top-[1px] right-[18%] h-2 w-11 bg-[#d95757]" />
          <div className="pointer-events-none absolute -right-[1px] top-[22%] h-6 w-2 bg-[#d95757]" />
          <div className="pointer-events-none absolute -left-[1px] bottom-[18%] h-9 w-2 bg-[#d95757]" />

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.28 }}
            className="text-xs uppercase tracking-[0.28em] text-[#e49393]"
          >
            ༒︎༒︎༒︎
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={
              performanceMode
                ? { opacity: 1, y: 0 }
                : {
                    opacity: 1,
                    y: 0,
                    textShadow: ["0 0 0px rgba(255,150,150,0)", "0 0 16px rgba(255,150,150,0.24)", "0 0 0px rgba(255,150,150,0)"],
                  }
            }
            transition={{
              opacity: { duration: 0.55, delay: 0.34, ease: "easeOut" },
              y: { duration: 0.55, delay: 0.34, ease: "easeOut" },
              ...(performanceMode ? {} : { textShadow: { duration: 2.6, repeat: Infinity, ease: "easeInOut", delay: 0.9 } }),
            }}
            className="mt-4 text-5xl font-semibold tracking-[0.02em] text-[#ffe2e2] md:text-7xl"
          >
            PRDX AMP
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.42 }}
            className="mt-6 max-w-2xl text-sm leading-relaxed text-[#f3d0d0]/85 md:text-base"
          >
            An immersive amp simulator built for spatial depth, ambient movement, and playable tone. PRDX explores the paradox of sound. Where reflections move outward, return inward, and reshape the signal in real time.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.48, delay: 0.5 }}
            className="mt-10 flex flex-wrap gap-3"
          >
            <a
              href="#sigil-core"
              onClick={handleDownloadPrdx}
              className="prdx-cta border border-[#d85757]/50 bg-[#bc37371a] px-5 py-2.5 text-xs uppercase tracking-[0.18em] text-[#ffd8d8] transition hover:bg-[#bc373736]"
            >
              <span data-text="Download PRDX">Download PRDX</span>
            </a>
            <Link
              href="/"
              onClick={handleBackToPortfolio}
              className="prdx-cta border border-[#d85757]/30 px-5 py-2.5 text-xs uppercase tracking-[0.18em] text-[#ffd8d8]/90 transition hover:border-[#d85757]/60"
            >
              <span data-text="Back to Portfolio">Back to Portfolio</span>
            </Link>
          </motion.div>

          <div id="sigil-core" className="mt-14 grid gap-4 md:grid-cols-3">
            {[
              {
                title: "TONE",
                text: "Dark clarity with harmonic bloom and controlled low-end weight. Designed to feel expansive without losing focus.",
              },
              {
                title: "FLOW",
                text: "Modular signal path with IR loading, gating, EQ, distortion, and stereo reverb shaping. Built for intuitive control and fast experimentation.",
              },
              {
                title: "SPACE",
                text: "Created as a standalone sonic experience. Not a replica, but a spatial instrument in its own right.",
              },
            ].map((item, index) => (
              <motion.article
                key={item.title}
                initial={{ opacity: 0, y: 18 }}
                animate={
                  performanceMode
                    ? { opacity: 1, y: 0, boxShadow: "0 0 0px rgba(255,120,120,0)" }
                    : {
                        opacity: [1, 0.94, 1],
                        y: [0, -1.5, 0],
                        boxShadow: ["0 0 0px rgba(255,120,120,0)", "0 0 20px rgba(255,120,120,0.11)", "0 0 0px rgba(255,120,120,0)"],
                      }
                }
                transition={
                  performanceMode
                    ? { duration: 0.35, delay: 0.2 + index * 0.05, ease: "easeOut" }
                    : { duration: 3.4 + index * 0.35, delay: 0.58 + index * 0.1, repeat: Infinity, ease: "easeInOut" }
                }
                whileHover={{ y: -3 }}
                className="relative border border-[#cf5959]/35 bg-[#180a0b]/80 p-4"
                style={{
                  clipPath:
                    index % 2 === 0
                      ? "polygon(0% 4%, 8% 0%, 100% 0%, 100% 90%, 94% 100%, 0% 100%)"
                      : "polygon(0% 0%, 92% 0%, 100% 7%, 100% 100%, 6% 100%, 0% 92%)",
                }}
              >
                <span className="pointer-events-none absolute -right-[1px] top-[30%] h-5 w-[2px] bg-[#d95757]" />
                <p className="text-[11px] uppercase tracking-[0.15em] text-[#e19797]">{item.title}</p>
                <p className="mt-2 text-sm text-[#f4d9d9]/90">{item.text}</p>
              </motion.article>
            ))}
          </div>

          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.48, delay: 0.9 }}
            className="relative mt-8 overflow-visible border border-[#cf5959]/30 bg-[#14090a]/75 p-5"
          >
            <motion.div
              className="pointer-events-none absolute inset-0 z-[1] bg-black/35 backdrop-blur-[2px]"
              animate={videoPlaying ? { opacity: 1 } : { opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
            />
            <div className="relative z-[2]">
            <p className="text-xs uppercase tracking-[0.18em] text-[#e19797]">༒︎DEMO༒︎</p>
            <p className="mt-2 text-sm text-[#f4d9d9]/82">A short playthrough exploring PRDX’s spatial reverb, stereo widening, and core tone controls.</p>
            <motion.div
              className="relative z-[6] mt-4 border p-2"
              style={{
                borderColor: PRDX_THEME.PLAYER_FRAME_BORDER,
                background: PRDX_THEME.PLAYER_FRAME_BG,
              }}
              animate={
                videoPlaying
                  ? {
                      scale: PRDX_THEME.PLAYER_FOCUS_SCALE,
                      y: PRDX_THEME.PLAYER_FOCUS_Y + parallaxY,
                      x: parallaxX,
                      boxShadow: "none",
                    }
                  : { scale: 1, y: 0, x: 0, boxShadow: "none" }
              }
              transition={{ duration: 0.35, ease: "easeOut" }}
            >
              <video
                ref={videoRef}
                src="/PRDX-DEMO.mp4"
                playsInline
                preload="metadata"
                onLoadedMetadata={(event) => {
                  syncDuration(event.currentTarget);
                }}
                onDurationChange={(event) => {
                  syncDuration(event.currentTarget);
                }}
                onLoadedData={(event) => syncDuration(event.currentTarget)}
                onCanPlay={(event) => syncDuration(event.currentTarget)}
                onTimeUpdate={(event) => {
                  const video = event.currentTarget;
                  setVideoTime(video.currentTime);
                  if (videoDuration <= 0) {
                    syncDuration(video);
                  }
                }}
                onPlay={() => {
                  setVideoPlaying(true);
                  startFlashLoop();
                }}
                onPause={() => {
                  setVideoPlaying(false);
                  stopFlashLoop();
                }}
                onEnded={() => {
                  setVideoPlaying(false);
                  stopFlashLoop();
                }}
                onClick={() => {
                  void togglePlayback();
                }}
                className="w-full rounded-sm border bg-black"
                style={{ borderColor: `${PRDX_THEME.PLAYER_ACCENT}55` }}
              />
              <div
                className={`mt-2 rounded border p-2 ${vhsFont.className}`}
                style={{
                  borderColor: `${PRDX_THEME.PLAYER_ACCENT}44`,
                  background: `${PRDX_THEME.PLAYER_PANEL_BG}d9`,
                }}
              >
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={togglePlayback}
                    className="rounded border px-2.5 py-1 text-xs uppercase tracking-[0.1em]"
                    style={{
                      borderColor: `${PRDX_THEME.PLAYER_ACCENT}73`,
                      background: PRDX_THEME.PLAYER_BTN_BG,
                      color: PRDX_THEME.PLAYER_TEXT,
                    }}
                  >
                    {videoPlaying ? "Pause" : "Play"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const video = videoRef.current;
                      if (!video) return;
                      video.muted = !video.muted;
                      setVideoMuted(video.muted);
                    }}
                    className="rounded border px-2 py-1 text-[11px] uppercase tracking-[0.08em]"
                    style={{
                      borderColor: `${PRDX_THEME.PLAYER_ACCENT}59`,
                      background: PRDX_THEME.PLAYER_BTN_BG_ALT,
                      color: PRDX_THEME.PLAYER_TEXT,
                    }}
                  >
                    {videoMuted ? "Unmute" : "Mute"}
                  </button>
                  <div className={`ml-auto text-[20px] ${vhsFont.className}`} style={{ color: `${PRDX_THEME.PLAYER_TEXT}BF` }}>
                    {Math.floor(videoTime)}s / {Math.floor(videoDuration || 0)}s
                  </div>
                </div>
                <input
                  type="range"
                  min={0}
                  max={safeDuration}
                  step={0.01}
                  value={safeTime}
                  onInput={(event) => seekVideo(Number((event.target as HTMLInputElement).value))}
                  onChange={(event) => seekVideo(Number(event.target.value))}
                  className="prdx-slider mt-2 w-full"
                  style={{ accentColor: PRDX_THEME.PLAYER_RANGE_ACCENT }}
                />
                <div className="mt-2 flex items-center gap-2">
                  <span className={`text-[14px] uppercase tracking-[0.08em] ${vhsFont.className}`} style={{ color: `${PRDX_THEME.PLAYER_TEXT}B0` }}>Vol</span>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.01}
                    value={videoMuted ? 0 : videoVolume}
                    onChange={(event) => {
                      const video = videoRef.current;
                      if (!video) return;
                      const next = Number(event.target.value);
                      video.volume = next;
                      video.muted = next === 0;
                      setVideoMuted(video.muted);
                      setVideoVolume(next);
                    }}
                    className="prdx-slider w-36"
                    style={{ accentColor: PRDX_THEME.PLAYER_RANGE_ACCENT }}
                  />
                </div>
                <div className={`mt-3 grid gap-2 border-t border-[#cf5a5a]/25 pt-3 ${vhsFont.className}`}>
                  <p className="text-[20px] uppercase tracking-[0.16em] text-[#e6acac]/90">Signal Quality</p>
                  <label className="flex items-center gap-3 text-[14px] uppercase tracking-[0.08em] text-[#e7bbbb]/85">
                    Flash
                    <input
                      type="range"
                      min={0.08}
                      max={0.65}
                      step={0.01}
                      value={flashGain}
                      onChange={(event) => setFlashGain(Number(event.target.value))}
                      className="prdx-slider ml-auto w-36"
                    />
                  </label>
                  <label className="flex items-center gap-3 text-[14px] uppercase tracking-[0.08em] text-[#e7bbbb]/85">
                    Bass
                    <input
                      type="range"
                      min={0.8}
                      max={2.2}
                      step={0.05}
                      value={bassWeight}
                      onChange={(event) => setBassWeight(Number(event.target.value))}
                      className="prdx-slider ml-auto w-36"
                    />
                  </label>
                  <label className="flex items-center gap-3 text-[14px] uppercase tracking-[0.08em] text-[#e7bbbb]/85">
                    Vocal
                    <input
                      type="range"
                      min={0}
                      max={0.65}
                      step={0.01}
                      value={vocalWeight}
                      onChange={(event) => setVocalWeight(Number(event.target.value))}
                      className="prdx-slider ml-auto w-36"
                    />
                  </label>
                  <label className="flex items-center gap-3 text-[14px] uppercase tracking-[0.08em] text-[#e7bbbb]/85">
                    Texture
                    <input
                      type="range"
                      min={0.1}
                      max={0.55}
                      step={0.01}
                      value={textureIdleOpacity}
                      onChange={(event) => setTextureIdleOpacity(Number(event.target.value))}
                      className="prdx-slider ml-auto w-36"
                    />
                  </label>
                  <label className="flex items-center gap-3 text-[14px] uppercase tracking-[0.08em] text-[#e7bbbb]/85">
                    Texture Play
                    <input
                      type="range"
                      min={0}
                      max={0.25}
                      step={0.01}
                      value={texturePlayingOpacity}
                      onChange={(event) => setTexturePlayingOpacity(Number(event.target.value))}
                      className="prdx-slider ml-auto w-36"
                    />
                  </label>
                  <label className="flex items-center gap-3 text-[14px] uppercase tracking-[0.08em] text-[#e7bbbb]/85">
                    Pulse
                    <input
                      type="range"
                      min={0.18}
                      max={1}
                      step={0.01}
                      value={crtPulseGain}
                      onChange={(event) => setCrtPulseGain(Number(event.target.value))}
                      className="prdx-slider ml-auto w-36"
                    />
                  </label>
                </div>
              </div>
            </motion.div>
            </div>
          </motion.section>
        </motion.section>
        </motion.div>
        </main>
        </div>

        <AnimatePresence initial={false}>
        {introDone && !cleanMode ? (
        <>
        <motion.div
          className="pointer-events-none absolute right-[-8%] top-1/2 z-[9] block -translate-y-1/2 px-6 md:px-10 will-change-transform"
          animate={
            performanceMode
              ? {
                  x: [-3, 1.2, -2.4, 0.9, -3],
                  y: [-0.8, 0.6, -0.5, 0.35, -0.8],
                  opacity: [0.09, 0.14, 0.08, 0.12, 0.09],
                  scale: [1, 1.005, 0.998, 1.003, 1],
                  rotateZ: [-0.08, 0.05, -0.04, 0.03, -0.08],
                }
              : {
                  x: [-9, 4, -7, 3, -9],
                  y: [-2, 1.6, -1.2, 1, -2],
                  opacity: [0.11, 0.19, 0.09, 0.17, 0.11],
                  scale: [1, 1.012, 0.997, 1.008, 1],
                  rotateZ: [-0.2, 0.14, -0.1, 0.08, -0.2],
                }
          }
          transition={{ duration: performanceMode ? 4.6 : 3.6, repeat: Infinity, ease: "easeInOut" }}
          style={{ marginTop: `${-(panelScroll * 0.09)}px` }}
        >
          <section
            className={`mx-auto w-full max-w-6xl border border-[#cf5a5a]/8 bg-[#0a070844] p-8 ${performanceMode ? "blur-[12px]" : "blur-[22px]"} saturate-50 md:p-12 [filter:drop-shadow(0_0_16px_rgba(246,112,112,0.12))]`}
            style={{
              clipPath:
                "polygon(0% 2%, 5% 0%, 95% 0%, 100% 4%, 100% 94%, 96% 100%, 7% 100%, 0% 97%)",
              transform: "translateX(4%) scale(1.04) skewY(-0.45deg) skewX(-1.2deg)",
            }}
          >
            <motion.div
              className="absolute inset-0"
              animate={{ x: [0, 0.8, -0.6, 0], opacity: [0, 0.09, 0.03, 0] }}
              transition={{ duration: 1.9, repeat: Infinity, ease: "linear" }}
              style={{
                backgroundImage:
                  "repeating-linear-gradient(90deg,rgba(255,170,170,0.1)_0px,rgba(255,170,170,0.1)_1px,transparent_2px,transparent_5px)",
              }}
            />
            <h2 className="text-5xl font-semibold tracking-[0.02em] text-[#c98181]/18 md:text-7xl">PRDX AMP</h2>
            <p className="mt-6 max-w-2xl text-sm leading-relaxed text-[#b47373]/16 md:text-base">
              A feral amp simulator built for violent tone sculpting, tight control, and real-time response.
            </p>
            <div className="mt-10 flex gap-3">
              <div className="h-9 w-28 rounded-sm border border-[#cf5a5a]/16 bg-[#150809]/40" />
              <div className="h-9 w-36 rounded-sm border border-[#cf5a5a]/16 bg-[#150809]/36" />
            </div>
            <div className="mt-12 grid gap-4 md:grid-cols-3">
              <div className="h-24 border border-[#cf5959]/12 bg-[#180a0b]/26 p-4" />
              <div className="h-24 border border-[#cf5959]/12 bg-[#180a0b]/26 p-4" />
              <div className="h-24 border border-[#cf5959]/12 bg-[#180a0b]/26 p-4" />
            </div>
            <div className="mt-8 h-36 border border-[#cf5959]/12 bg-[#16090a]/24" />
          </section>
        </motion.div>
        <motion.div
          className="pointer-events-none absolute left-[-10%] top-1/2 z-[9] block -translate-y-1/2 px-6 md:px-10 will-change-transform"
          animate={
            performanceMode
              ? {
                  x: [-2.6, 1, -3.1, 0.7, -2.6],
                  y: [0.7, -0.8, 0.5, -0.45, 0.7],
                  opacity: [0.05, 0.09, 0.04, 0.08, 0.05],
                  scale: [1, 1.004, 0.998, 1.003, 1],
                  rotateZ: [0.06, -0.07, 0.05, -0.04, 0.06],
                }
              : {
                  x: [-7, 3.5, -8.5, 2.5, -7],
                  y: [1.8, -2.1, 1.3, -1.1, 1.8],
                  opacity: [0.06, 0.12, 0.05, 0.1, 0.06],
                  scale: [1, 1.01, 0.996, 1.007, 1],
                  rotateZ: [0.16, -0.18, 0.12, -0.09, 0.16],
                }
          }
          transition={{ duration: performanceMode ? 4.9 : 4, repeat: Infinity, ease: "easeInOut" }}
          style={{ marginTop: `${-(panelScroll * 0.14)}px` }}
        >
          <section
            className={`mx-auto w-full max-w-6xl border border-[#cf5a5a]/8 bg-[#1308093d] p-8 ${performanceMode ? "blur-[14px]" : "blur-[24px]"} saturate-35 md:p-12 [filter:drop-shadow(0_0_20px_rgba(240,90,90,0.1))]`}
            style={{
              clipPath:
                "polygon(0% 2%, 5% 0%, 95% 0%, 100% 4%, 100% 94%, 96% 100%, 7% 100%, 0% 97%)",
              transform: "translateX(-5%) scale(1.05) skewY(0.35deg) skewX(1.4deg)",
            }}
          >
            <motion.div
              className="absolute inset-0"
              animate={{ x: [0, -0.8, 0.7, 0], opacity: [0, 0.08, 0.03, 0] }}
              transition={{ duration: 2.1, repeat: Infinity, ease: "linear", delay: 0.35 }}
              style={{
                backgroundImage:
                  "repeating-linear-gradient(90deg,rgba(255,160,160,0.08)_0px,rgba(255,160,160,0.08)_1px,transparent_2px,transparent_6px)",
              }}
            />
            <h2 className="text-5xl font-semibold tracking-[0.02em] text-[#c98181]/14 md:text-7xl">PRDX AMP</h2>
            <div className="mt-12 grid gap-4 md:grid-cols-3">
              <div className="h-24 border border-[#cf5959]/10 bg-[#180a0b]/22 p-4" />
              <div className="h-24 border border-[#cf5959]/10 bg-[#180a0b]/22 p-4" />
              <div className="h-24 border border-[#cf5959]/10 bg-[#180a0b]/22 p-4" />
            </div>
            <div className="mt-8 h-36 border border-[#cf5959]/10 bg-[#16090a]/20" />
          </section>
        </motion.div>
        </>
        ) : null}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {isShuttingDown ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.08, ease: "easeOut" }}
            className="pointer-events-none fixed inset-0 z-[120] bg-[#040203]"
          >
            <motion.div
              className="absolute inset-0"
              initial={{ opacity: 0.26 }}
              animate={{ opacity: [0.26, 0.62, 0.44, 0.1] }}
              transition={{ duration: 1, ease: "easeInOut" }}
              style={{
                backgroundImage: "url('/DirtyGlass.jpg')",
                backgroundSize: "cover",
                backgroundPosition: "center",
                filter: "contrast(1.08) brightness(1.02)",
              }}
            />
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.95, 0.2, 0] }}
              transition={{ duration: 0.55, ease: "easeOut" }}
              className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.85),rgba(255,255,255,0.16)_24%,rgba(0,0,0,0)_52%)]"
            />
            <motion.div
              initial={{ scaleY: 1, opacity: 0.9 }}
              animate={{ scaleY: [1, 0.15, 0.02], opacity: [0.9, 1, 0.5] }}
              transition={{ duration: 0.7, ease: [0.17, 0.84, 0.44, 1] }}
              className="absolute inset-0 origin-center bg-[linear-gradient(to_bottom,transparent_36%,rgba(255,255,255,0.92)_49%,rgba(255,255,255,0.92)_51%,transparent_64%)]"
            />
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.35, 0.94] }}
              transition={{ duration: 0.72, ease: "easeInOut" }}
              className="absolute inset-0 shadow-[inset_0_0_180px_rgba(0,0,0,0.95)]"
            />
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.22, 0.96] }}
              transition={{ duration: 0.72, ease: "easeInOut" }}
              className="absolute inset-0 bg-[#020101]"
            />
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {!introDone && !cleanMode ? (
          <motion.div
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.9, ease: "easeOut" }}
            className="pointer-events-none fixed inset-0 z-50 bg-[#060304]"
          >
            <div className="absolute inset-0 m-2 overflow-hidden rounded-[6%] border border-[#f1a0a0]/20 md:m-4">
              {!isFirefox ? <IntroWingsPostFx lowPowerMode={performanceMode} /> : null}
            </div>
            <motion.div
              className="pointer-events-none absolute inset-0 z-[36] m-2 rounded-[6%] md:m-4"
              animate={{ opacity: [0.34, 0.48, 0.3] }}
              transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
              style={{
                backgroundImage: "url('/DirtyGlass.jpg')",
                backgroundSize: "cover",
                backgroundPosition: "center",
                mixBlendMode: "overlay",
                filter: "contrast(1.08) brightness(1.03)",
              }}
            />
            <div className="pointer-events-none absolute inset-0 z-30 bg-[radial-gradient(circle_at_center,rgba(215,100,100,0.12),rgba(5,3,3,0.8)_74%)]" />
            <div className="pointer-events-none absolute inset-0 z-40 m-2 rounded-[6%] border border-[#f4adad]/20 shadow-[inset_0_0_130px_rgba(0,0,0,0.88)] md:m-4" />
            <div className="pointer-events-none absolute inset-0 z-40 m-2 rounded-[6%] bg-[radial-gradient(circle_at_center,transparent_54%,rgba(0,0,0,0.94)_100%)] md:m-4" />
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {cursorVisible && !cleanMode && !performanceMode ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pointer-events-none fixed left-0 top-0 z-[90] hidden md:block"
            style={{ transform: `translate3d(${cursorPos.x}px, ${cursorPos.y}px, 0)` }}
          >
            <motion.div
              className="absolute -left-4 -top-4 h-8 w-8 rounded-full border border-[#ffd4d4]/70"
              animate={{ scale: [1, 1.08, 1], opacity: [0.55, 0.95, 0.55] }}
              transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              className="absolute -left-6 -top-6 h-12 w-12 rounded-full bg-[#ff9e9e]/20 blur-md"
              animate={{ opacity: [0.18, 0.45, 0.18], scale: [0.9, 1.2, 0.9] }}
              transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              className="absolute -left-4 -top-4 h-8 w-8 rounded-full border border-[#ff9c9c]/55"
              animate={{ x: [-1.4, 1.4, -1.4] }}
              transition={{ duration: 0.42, repeat: Infinity, ease: "linear" }}
            />
            <motion.div
              className="absolute -left-1.5 -top-1.5 h-3 w-3 rounded-full bg-[#ffc1c1]/90 shadow-[0_0_18px_rgba(255,120,120,0.75)]"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut" }}
            />
          </motion.div>
        ) : null}
      </AnimatePresence>
      <style jsx global>{`
        .prdx-cta {
          position: relative;
          overflow: hidden;
          transform: translateZ(0);
        }
        .prdx-cta > span {
          position: relative;
          display: inline-block;
          transition: transform 140ms ease, text-shadow 140ms ease, filter 140ms ease;
        }
        .prdx-cta > span::before,
        .prdx-cta > span::after {
          content: attr(data-text);
          position: absolute;
          inset: 0;
          opacity: 0;
          pointer-events: none;
          transition: opacity 120ms ease, transform 120ms ease;
        }
        .prdx-cta > span::before {
          color: rgba(255, 120, 120, 0.8);
          transform: translateX(-1px);
        }
        .prdx-cta > span::after {
          color: rgba(190, 225, 255, 0.62);
          transform: translateX(1px);
        }
        .prdx-cta:hover > span {
          transform: translateX(0.6px) skewX(-2.8deg);
          text-shadow: -1px 0 rgba(255, 120, 120, 0.85), 1px 0 rgba(190, 225, 255, 0.62), 0 0 10px rgba(255, 120, 120, 0.25);
          filter: saturate(1.08);
        }
        .prdx-cta:hover > span::before {
          opacity: 0.8;
          transform: translateX(-1.6px);
        }
        .prdx-cta:hover > span::after {
          opacity: 0.75;
          transform: translateX(1.5px);
        }
        .prdx-scroll {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .prdx-scroll::-webkit-scrollbar {
          width: 0;
          height: 0;
          display: none;
        }
        .prdx-slider {
          appearance: none;
          height: 16px;
          background: transparent;
        }
        .prdx-slider:focus {
          outline: none;
        }
        .prdx-slider::-webkit-slider-runnable-track {
          height: 5px;
          border: 1px solid rgba(211, 90, 90, 0.55);
          background: linear-gradient(90deg, rgba(42, 10, 12, 0.98) 0%, rgba(107, 30, 32, 0.72) 60%, rgba(32, 9, 10, 0.98) 100%);
          box-shadow: inset 0 0 9px rgba(218, 92, 92, 0.28);
        }
        .prdx-slider::-webkit-slider-thumb {
          appearance: none;
          margin-top: -7px;
          height: 17px;
          width: 8px;
          border: 1px solid rgba(255, 200, 200, 0.86);
          background: linear-gradient(180deg, rgba(246, 129, 129, 0.95) 0%, rgba(156, 45, 45, 1) 100%);
          clip-path: polygon(50% 0%, 100% 48%, 50% 100%, 0% 48%);
          box-shadow: 0 0 12px rgba(224, 88, 88, 0.55);
        }
        .prdx-slider::-moz-range-track {
          height: 5px;
          border: 1px solid rgba(211, 90, 90, 0.55);
          background: linear-gradient(90deg, rgba(42, 10, 12, 0.98) 0%, rgba(107, 30, 32, 0.72) 60%, rgba(32, 9, 10, 0.98) 100%);
          box-shadow: inset 0 0 9px rgba(218, 92, 92, 0.28);
        }
        .prdx-slider::-moz-range-thumb {
          height: 17px;
          width: 8px;
          border: 1px solid rgba(255, 200, 200, 0.86);
          background: linear-gradient(180deg, rgba(246, 129, 129, 0.95) 0%, rgba(156, 45, 45, 1) 100%);
          clip-path: polygon(50% 0%, 100% 48%, 50% 100%, 0% 48%);
          box-shadow: 0 0 12px rgba(224, 88, 88, 0.55);
        }
      `}</style>
    </div>
  );
}

