"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface FlickeringGridProps {
  squareSize?: number;
  gridGap?: number;
  flickerChance?: number;
  color?: string;
  width?: number;
  height?: number;
  className?: string;
  maxOpacity?: number;
}

export function FlickeringGrid({
  squareSize = 4,
  gridGap = 6,
  flickerChance = 0.3,
  color = "rgb(124, 58, 237)",
  width,
  height,
  className,
  maxOpacity = 0.3,
}: FlickeringGridProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(false);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });

  const toRGBA = useCallback((colorStr: string) => {
    if (typeof window === "undefined") return "rgba(124, 58, 237,";
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 1;
    const ctx = canvas.getContext("2d");
    if (!ctx) return "rgba(124, 58, 237,";
    ctx.fillStyle = colorStr;
    ctx.fillRect(0, 0, 1, 1);
    const [r, g, b] = Array.from(ctx.getImageData(0, 0, 1, 1).data);
    return `rgba(${r}, ${g}, ${b},`;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rgba = toRGBA(color);
    let animationFrameId: number;
    let cols = 0;
    let rows = 0;
    let squares: Float32Array = new Float32Array(0);
    let dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;

    const setupCanvas = (w: number, h: number) => {
      dpr = window.devicePixelRatio || 1;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      cols = Math.floor(w / (squareSize + gridGap));
      rows = Math.floor(h / (squareSize + gridGap));
      squares = new Float32Array(cols * rows);
      for (let i = 0; i < squares.length; i++) {
        squares[i] = Math.random() * maxOpacity;
      }
    };

    const updateSquares = (deltaTime: number) => {
      for (let i = 0; i < squares.length; i++) {
        if (Math.random() < flickerChance * deltaTime) {
          squares[i] = Math.random() * maxOpacity;
        }
      }
    };

    const drawGrid = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          const opacity = squares[i * rows + j];
          ctx.fillStyle = `${rgba}${opacity})`;
          ctx.fillRect(
            i * (squareSize + gridGap) * dpr,
            j * (squareSize + gridGap) * dpr,
            squareSize * dpr,
            squareSize * dpr,
          );
        }
      }
    };

    let lastTime = 0;
    const animate = (time: number) => {
      if (!isInView) {
        animationFrameId = requestAnimationFrame(animate);
        return;
      }
      const deltaTime = (time - lastTime) / 1000;
      lastTime = time;
      updateSquares(deltaTime);
      drawGrid();
      animationFrameId = requestAnimationFrame(animate);
    };

    const resize = () => {
      const w = width ?? container.clientWidth;
      const h = height ?? container.clientHeight;
      setCanvasSize({ width: w, height: h });
      setupCanvas(w, h);
    };

    resize();
    animationFrameId = requestAnimationFrame(animate);

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);

    const intersectionObserver = new IntersectionObserver(
      ([entry]) => setIsInView(entry.isIntersecting),
      { threshold: 0 },
    );
    intersectionObserver.observe(canvas);

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
    };
  }, [color, squareSize, gridGap, flickerChance, maxOpacity, width, height, isInView, toRGBA]);

  return (
    <div
      ref={containerRef}
      className={cn("h-full w-full", className)}
    >
      <canvas
        ref={canvasRef}
        className="pointer-events-none"
        width={canvasSize.width}
        height={canvasSize.height}
      />
    </div>
  );
}
