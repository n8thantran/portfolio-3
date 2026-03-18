"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./os.module.css";

type DoomGameProps = {
  active: boolean;
};

type Enemy = {
  x: number;
  y: number;
  alive: boolean;
};

type GameState = {
  x: number;
  y: number;
  angle: number;
  health: number;
  ammo: number;
  frags: number;
  cooldown: number;
  hurtCooldown: number;
  muzzleFlash: number;
  status: string;
  statusTimer: number;
  victory: boolean;
  gameOver: boolean;
};

const MAP = [
  "1111111111111",
  "1000000010001",
  "1011101010101",
  "1000100010101",
  "1110101110101",
  "1000101000001",
  "1011101011101",
  "1010000010001",
  "1010111110101",
  "1000000010001",
  "1011111011101",
  "1000000000001",
  "1111111111111",
] as const;

const SPAWNS: Enemy[] = [
  { x: 10.5, y: 2.6, alive: true },
  { x: 9.5, y: 5.5, alive: true },
  { x: 2.5, y: 7.5, alive: true },
  { x: 6.5, y: 9.5, alive: true },
  { x: 11.2, y: 11.1, alive: true },
];

const BASE_STATE: GameState = {
  x: 1.8,
  y: 1.7,
  angle: 0.2,
  health: 100,
  ammo: 32,
  frags: 0,
  cooldown: 0,
  hurtCooldown: 0,
  muzzleFlash: 0,
  status: "Find the targets and clear the room.",
  statusTimer: 3,
  victory: false,
  gameOver: false,
};

const FOV = Math.PI / 3;
const MOVE_SPEED = 2.35;
const STRAFE_SPEED = 1.95;
const TURN_SPEED = 2.2;
const ENEMY_SPEED = 0.55;
const MAX_VIEW_DISTANCE = 20;

const normalizeAngle = (angle: number) => {
  let value = angle;
  while (value < -Math.PI) {
    value += Math.PI * 2;
  }
  while (value > Math.PI) {
    value -= Math.PI * 2;
  }
  return value;
};

const isWall = (x: number, y: number) => {
  const column = Math.floor(x);
  const row = Math.floor(y);
  if (row < 0 || row >= MAP.length || column < 0 || column >= MAP[0].length) {
    return true;
  }

  return MAP[row][column] === "1";
};

const stepRay = (
  originX: number,
  originY: number,
  angle: number,
  limit = MAX_VIEW_DISTANCE,
) => {
  const increment = 0.03;
  let distance = 0;

  while (distance < limit) {
    distance += increment;
    const sampleX = originX + Math.cos(angle) * distance;
    const sampleY = originY + Math.sin(angle) * distance;

    if (isWall(sampleX, sampleY)) {
      return distance;
    }
  }

  return limit;
};

const cloneEnemies = () => SPAWNS.map((enemy) => ({ ...enemy }));

export default function DoomGame({ active }: DoomGameProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const canvasShellRef = useRef<HTMLDivElement | null>(null);
  const keysRef = useRef<Record<string, boolean>>({});
  const gameStateRef = useRef<GameState>({ ...BASE_STATE });
  const enemiesRef = useRef<Enemy[]>(cloneEnemies());
  const animationFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);
  const [bootId, setBootId] = useState(0);

  const resetRun = () => {
    gameStateRef.current = { ...BASE_STATE };
    enemiesRef.current = cloneEnemies();
    lastTimeRef.current = null;
    setBootId((value) => value + 1);
  };

  useEffect(() => {
    const shell = canvasShellRef.current;
    const canvas = canvasRef.current;
    if (!shell || !canvas) {
      return;
    }

    const updateCanvasSize = () => {
      const bounds = shell.getBoundingClientRect();
      const ratio = window.devicePixelRatio || 1;
      canvas.width = Math.max(320, Math.floor(bounds.width * ratio));
      canvas.height = Math.max(240, Math.floor(bounds.height * ratio));
    };

    updateCanvasSize();
    const observer = new ResizeObserver(updateCanvasSize);
    observer.observe(shell);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!active) {
        return;
      }

      if (
        [
          "KeyW",
          "KeyA",
          "KeyS",
          "KeyD",
          "ArrowLeft",
          "ArrowRight",
          "Space",
          "KeyR",
        ].includes(event.code)
      ) {
        event.preventDefault();
      }

      if (event.code === "Space") {
        keysRef.current.Space = true;
        return;
      }

      if (event.code === "KeyR") {
        resetRun();
        return;
      }

      keysRef.current[event.code] = true;
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      keysRef.current[event.code] = false;
      if (event.code === "Space") {
        keysRef.current.Space = false;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [active]);

  useEffect(() => {
    if (!active) {
      keysRef.current = {};
    }
  }, [active]);

  useEffect(() => {
    const render = (timestamp: number) => {
      if (!canvasRef.current) {
        return;
      }

      if (lastTimeRef.current === null) {
        lastTimeRef.current = timestamp;
      }

      const delta = Math.min(0.033, (timestamp - lastTimeRef.current) / 1000);
      lastTimeRef.current = timestamp;

      const state = gameStateRef.current;
      const enemies = enemiesRef.current;

      if (active && !state.gameOver && !state.victory) {
        let turn = 0;
        if (keysRef.current.ArrowLeft) {
          turn -= 1;
        }
        if (keysRef.current.ArrowRight) {
          turn += 1;
        }

        state.angle += turn * TURN_SPEED * delta;

        const forward =
          (keysRef.current.KeyW ? 1 : 0) - (keysRef.current.KeyS ? 1 : 0);
        const strafe =
          (keysRef.current.KeyD ? 1 : 0) - (keysRef.current.KeyA ? 1 : 0);

        const moveX =
          Math.cos(state.angle) * forward * MOVE_SPEED * delta +
          Math.cos(state.angle + Math.PI / 2) * strafe * STRAFE_SPEED * delta;
        const moveY =
          Math.sin(state.angle) * forward * MOVE_SPEED * delta +
          Math.sin(state.angle + Math.PI / 2) * strafe * STRAFE_SPEED * delta;

        const nextX = state.x + moveX;
        const nextY = state.y + moveY;

        if (!isWall(nextX, state.y)) {
          state.x = nextX;
        }
        if (!isWall(state.x, nextY)) {
          state.y = nextY;
        }

        if (state.cooldown > 0) {
          state.cooldown = Math.max(0, state.cooldown - delta);
        }
        if (state.hurtCooldown > 0) {
          state.hurtCooldown = Math.max(0, state.hurtCooldown - delta);
        }
        if (state.muzzleFlash > 0) {
          state.muzzleFlash = Math.max(0, state.muzzleFlash - delta * 4);
        }
        if (state.statusTimer > 0) {
          state.statusTimer = Math.max(0, state.statusTimer - delta);
        }

        if (keysRef.current.Space && state.cooldown === 0 && state.ammo > 0) {
          keysRef.current.Space = false;
          state.ammo -= 1;
          state.cooldown = 0.28;
          state.muzzleFlash = 1;

          let closestHitIndex = -1;
          let closestHitDistance = Number.POSITIVE_INFINITY;

          enemies.forEach((enemy, index) => {
            if (!enemy.alive) {
              return;
            }

            const dx = enemy.x - state.x;
            const dy = enemy.y - state.y;
            const distance = Math.hypot(dx, dy);
            const angleToEnemy = Math.atan2(dy, dx);
            const deltaAngle = normalizeAngle(angleToEnemy - state.angle);

            if (Math.abs(deltaAngle) > 0.12) {
              return;
            }

            const wallDistance = stepRay(state.x, state.y, angleToEnemy, distance);
            if (wallDistance + 0.14 < distance) {
              return;
            }

            if (distance < closestHitDistance) {
              closestHitIndex = index;
              closestHitDistance = distance;
            }
          });

          if (closestHitIndex !== -1) {
            enemies[closestHitIndex].alive = false;
            state.frags += 1;
            state.status = "Target eliminated.";
            state.statusTimer = 1.6;

            if (enemies.every((enemy) => !enemy.alive)) {
              state.victory = true;
              state.status = "Area clear. NathanOS wins.";
              state.statusTimer = 5;
            }
          } else {
            state.status = state.ammo === 0 ? "Magazine empty." : "Miss.";
            state.statusTimer = 1;
          }
        }

        enemies.forEach((enemy) => {
          if (!enemy.alive) {
            return;
          }

          const dx = state.x - enemy.x;
          const dy = state.y - enemy.y;
          const distance = Math.hypot(dx, dy);

          if (distance > 0.82) {
            const step = ENEMY_SPEED * delta;
            const nextEnemyX = enemy.x + (dx / distance) * step;
            const nextEnemyY = enemy.y + (dy / distance) * step;

            if (!isWall(nextEnemyX, enemy.y)) {
              enemy.x = nextEnemyX;
            }
            if (!isWall(enemy.x, nextEnemyY)) {
              enemy.y = nextEnemyY;
            }
          } else if (state.hurtCooldown === 0) {
            state.health = Math.max(0, state.health - 14);
            state.hurtCooldown = 0.8;
            state.status = "Taking damage.";
            state.statusTimer = 0.8;

            if (state.health === 0) {
              state.gameOver = true;
              state.status = "Run failed. Press R to restart.";
              state.statusTimer = 5;
            }
          }
        });
      }

      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");
      if (!context) {
        return;
      }

      context.imageSmoothingEnabled = false;
      const width = canvas.width;
      const height = canvas.height;
      const horizon = height * 0.48;

      context.clearRect(0, 0, width, height);
      context.fillStyle = "#1a1f38";
      context.fillRect(0, 0, width, horizon);
      context.fillStyle = "#2b1025";
      context.fillRect(0, horizon, width, height - horizon);

      const rayCount = Math.max(160, Math.floor(width / 5));
      const sliceWidth = width / rayCount;
      const depthBuffer = new Array(rayCount).fill(MAX_VIEW_DISTANCE);

      for (let rayIndex = 0; rayIndex < rayCount; rayIndex += 1) {
        const angle =
          state.angle - FOV / 2 + (rayIndex / rayCount) * FOV;
        const rawDistance = stepRay(state.x, state.y, angle);
        const correctedDistance =
          rawDistance * Math.cos(angle - state.angle);
        depthBuffer[rayIndex] = correctedDistance;

        const wallHeight = Math.min(
          height * 0.92,
          (height * 0.82) / Math.max(0.18, correctedDistance),
        );
        const wallTop = horizon - wallHeight / 2;
        const shade = Math.max(
          24,
          Math.floor(210 - correctedDistance * 15),
        );

        context.fillStyle = `rgb(${shade}, ${Math.floor(
          shade * 0.42,
        )}, ${Math.floor(shade * 0.22)})`;
        context.fillRect(
          rayIndex * sliceWidth,
          wallTop,
          sliceWidth + 1,
          wallHeight,
        );
      }

      const projectedEnemies = enemies
        .map((enemy) => {
          if (!enemy.alive) {
            return null;
          }

          const dx = enemy.x - state.x;
          const dy = enemy.y - state.y;
          const distance = Math.hypot(dx, dy);
          const relativeAngle = normalizeAngle(Math.atan2(dy, dx) - state.angle);

          if (Math.abs(relativeAngle) > FOV * 0.7) {
            return null;
          }

          return { enemy, distance, relativeAngle };
        })
        .filter(Boolean)
        .sort((a, b) => (b?.distance ?? 0) - (a?.distance ?? 0));

      projectedEnemies.forEach((entry) => {
        if (!entry) {
          return;
        }

        const screenX =
          width / 2 + (entry.relativeAngle / FOV) * width;
        const spriteSize = Math.min(
          height * 0.44,
          (height * 0.72) / Math.max(0.28, entry.distance),
        );
        const left = screenX - spriteSize / 2;
        const top = horizon - spriteSize * 0.58;
        const rayIndex = Math.max(
          0,
          Math.min(rayCount - 1, Math.floor((screenX / width) * rayCount)),
        );

        if (depthBuffer[rayIndex] + 0.08 < entry.distance) {
          return;
        }

        context.fillStyle = "#220000";
        context.fillRect(left, top, spriteSize, spriteSize);
        context.fillStyle = "#ad2222";
        context.fillRect(left + spriteSize * 0.08, top + spriteSize * 0.1, spriteSize * 0.84, spriteSize * 0.68);
        context.fillStyle = "#ffde59";
        context.fillRect(left + spriteSize * 0.22, top + spriteSize * 0.3, spriteSize * 0.13, spriteSize * 0.13);
        context.fillRect(left + spriteSize * 0.65, top + spriteSize * 0.3, spriteSize * 0.13, spriteSize * 0.13);
        context.fillStyle = "#ffffff";
        context.fillRect(left + spriteSize * 0.32, top + spriteSize * 0.62, spriteSize * 0.36, spriteSize * 0.08);
      });

      context.strokeStyle = state.hurtCooldown > 0 ? "#ff4d4d" : "#d9d9d9";
      context.lineWidth = Math.max(2, width * 0.0026);
      const crosshairX = width / 2;
      const crosshairY = height / 2;
      context.beginPath();
      context.moveTo(crosshairX - 10, crosshairY);
      context.lineTo(crosshairX + 10, crosshairY);
      context.moveTo(crosshairX, crosshairY - 10);
      context.lineTo(crosshairX, crosshairY + 10);
      context.stroke();

      if (state.muzzleFlash > 0) {
        context.fillStyle = `rgba(255, 214, 117, ${0.12 * state.muzzleFlash})`;
        context.fillRect(0, 0, width, height);
      }

      const miniMapSize = Math.min(130, width * 0.2);
      const cellSize = miniMapSize / MAP.length;
      const miniMapX = width - miniMapSize - 18;
      const miniMapY = 18;

      context.fillStyle = "rgba(0, 0, 0, 0.55)";
      context.fillRect(miniMapX - 6, miniMapY - 6, miniMapSize + 12, miniMapSize + 12);
      MAP.forEach((row, rowIndex) => {
        [...row].forEach((cell, columnIndex) => {
          context.fillStyle = cell === "1" ? "#7f1d1d" : "#2b2b2b";
          context.fillRect(
            miniMapX + columnIndex * cellSize,
            miniMapY + rowIndex * cellSize,
            cellSize - 1,
            cellSize - 1,
          );
        });
      });

      enemies.forEach((enemy) => {
        if (!enemy.alive) {
          return;
        }

        context.fillStyle = "#ff7a7a";
        context.fillRect(
          miniMapX + enemy.x * cellSize - 2,
          miniMapY + enemy.y * cellSize - 2,
          4,
          4,
        );
      });

      context.fillStyle = "#6ee7b7";
      context.fillRect(
        miniMapX + state.x * cellSize - 2,
        miniMapY + state.y * cellSize - 2,
        5,
        5,
      );
      context.strokeStyle = "#6ee7b7";
      context.beginPath();
      context.moveTo(
        miniMapX + state.x * cellSize,
        miniMapY + state.y * cellSize,
      );
      context.lineTo(
        miniMapX + state.x * cellSize + Math.cos(state.angle) * 12,
        miniMapY + state.y * cellSize + Math.sin(state.angle) * 12,
      );
      context.stroke();

      context.fillStyle = "#f3f4f6";
      context.font = `${Math.max(14, Math.floor(width * 0.02))}px monospace`;
      context.fillText(`HP ${state.health}`, 20, height - 54);
      context.fillText(`AMMO ${state.ammo}`, 20, height - 32);
      context.fillText(
        `FRAGS ${state.frags}/${SPAWNS.length}`,
        width - 180,
        height - 32,
      );

      context.fillStyle = state.victory
        ? "#6ee7b7"
        : state.gameOver
          ? "#fca5a5"
          : "#fef08a";
      context.fillText(state.status, 20, 28);

      if (!active) {
        context.fillStyle = "rgba(0, 0, 0, 0.55)";
        context.fillRect(0, 0, width, height);
        context.fillStyle = "#f3f4f6";
        context.font = `${Math.max(18, Math.floor(width * 0.028))}px monospace`;
        context.fillText("Bring DOOM.EXE to the front to control it.", 20, height / 2);
      }

      if (state.victory || state.gameOver) {
        context.fillStyle = "rgba(0, 0, 0, 0.58)";
        context.fillRect(0, 0, width, height);
        context.fillStyle = state.victory ? "#6ee7b7" : "#fca5a5";
        context.font = `${Math.max(24, Math.floor(width * 0.04))}px monospace`;
        context.fillText(
          state.victory ? "LEVEL CLEARED" : "RUN FAILED",
          24,
          height / 2 - 10,
        );
        context.fillStyle = "#f3f4f6";
        context.font = `${Math.max(15, Math.floor(width * 0.024))}px monospace`;
        context.fillText("Press R or use Restart to go again.", 24, height / 2 + 24);
      }

      animationFrameRef.current = window.requestAnimationFrame(render);
    };

    animationFrameRef.current = window.requestAnimationFrame(render);

    return () => {
      if (animationFrameRef.current) {
        window.cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [active, bootId]);

  return (
    <div className={styles.doomShell}>
      <div className={styles.doomViewport} ref={canvasShellRef}>
        <canvas
          ref={canvasRef}
          className={styles.doomCanvas}
          onMouseDown={() => {
            if (!active) {
              return;
            }

            keysRef.current.Space = true;
          }}
          onMouseUp={() => {
            keysRef.current.Space = false;
          }}
        />
      </div>
      <div className={styles.doomPanel}>
        <div>
          <h3 className={styles.doomPanelTitle}>Sector Notes</h3>
          <p className={styles.doomPanelText}>
            This is a tiny NathanOS corridor shooter inspired by old-school FPS games.
            Clear every target and stay alive.
          </p>
        </div>
        <div className={styles.doomControlGrid}>
          <span className={styles.gameBadge}>WASD move</span>
          <span className={styles.gameBadge}>Arrows turn</span>
          <span className={styles.gameBadge}>Space fire</span>
          <span className={styles.gameBadge}>R restart</span>
        </div>
        <div className={styles.doomButtonRow}>
          <button type="button" className={styles.toolbarButton} onClick={resetRun}>
            Restart Run
          </button>
          <span className={styles.doomHint}>
            {active ? "Controls armed." : "Bring the window to the front to play."}
          </span>
        </div>
      </div>
    </div>
  );
}
