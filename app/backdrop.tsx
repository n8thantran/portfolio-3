"use client";

import { useEffect, useLayoutEffect, useRef } from "react";

/**
 * Domain warped fractal noise that drifts.
 *
 * The expensive half (five octaves, five fbm chains, full device resolution)
 * is drawn once into a texture and kept. Only the composite runs per frame,
 * and that is a single texture fetch plus a handful of sines, so the motion is
 * close to free. Resize redraws the field; a theme change only re-tints.
 *
 * The drift is masked to zero down the middle of the screen, so the reading
 * column sits still and the empty margins do all of the moving.
 */

// How far past the screen the field is rendered, in screen widths/heights.
// The composite samples inside this slack, so drift never reaches an edge.
const MARGIN = 0.06;

// Peak drift, in screen heights. Small on purpose: this should read as the
// texture breathing, never as the page sliding around.
const DRIFT = 0.022;

const FPS = 30;

// The field is smooth, low frequency cloud. It carries no pixel level detail,
// so it is rendered well below screen resolution and stretched back up by the
// texture sampler. The composite still runs at full resolution, and the grain
// it adds there is what actually keeps the gradient from banding.
//
// Budget rather than a plain ratio, so a 6K display does not quietly cost
// twenty times what a laptop does.
const FIELD_SCALE = 0.5;
const FIELD_BUDGET = 420_000;

const VERT = `#version 300 es
in vec2 a;
void main() { gl_Position = vec4(a, 0.0, 1.0); }
`;

// Pass one: the field itself, written to an offscreen texture. Position only,
// no colour and no time, so its output stays valid until the size changes.
const FIELD_FRAG = `#version 300 es
precision highp float;

uniform vec2 u_res;
uniform float u_aspect;
uniform vec2 u_seed;

out vec4 outColor;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
    u.y
  );
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 5; i++) {
    v += a * noise(p);
    p *= 2.02;
    a *= 0.5;
  }
  return v;
}

void main() {
  // this target is oversized by MARGIN on every side, so undo that to get back
  // to the screen space the composite will sample in
  vec2 uv = (gl_FragCoord.xy / u_res) * (1.0 + 2.0 * ${MARGIN.toFixed(3)}) - ${MARGIN.toFixed(3)};

  vec2 p = (uv - 0.5) * vec2(u_aspect, 1.0);
  p *= 1.35;

  // the seed walks and turns the sampling window, so every load lands on a
  // different part of the field rather than a variation of the same picture
  float a = u_seed.x * 0.017;
  p = mat2(cos(a), -sin(a), sin(a), cos(a)) * p;
  p += u_seed;

  vec2 q = vec2(fbm(p + vec2(0.0, 1.4)), fbm(p + vec2(5.2, 1.3)));
  vec2 r = vec2(
    fbm(p + 3.4 * q + vec2(1.7, 9.2)),
    fbm(p + 3.4 * q + vec2(8.3, 2.8))
  );
  float f = fbm(p + 3.2 * r);

  outColor = vec4(smoothstep(0.15, 1.05, f), 0.0, 0.0, 1.0);
}
`;

// Pass two: tint the stored field and nudge where it is sampled from. Cheap
// enough to run every frame.
const COMPOSITE_FRAG = `#version 300 es
precision highp float;

uniform sampler2D u_field;
uniform vec2 u_res;
uniform vec3 u_bg;
uniform float u_amp;
uniform float u_center;
uniform float u_time;
uniform float u_drift;

out vec4 outColor;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

// Two slow circulations at rates that do not divide into each other, so the
// motion never visibly loops, plus a long wavelength shear so the field
// breathes rather than sliding across as one slab.
vec2 driftAt(vec2 uv, float t) {
  float a = t * 0.045;
  float b = t * 0.031;

  vec2 global = 0.5 * vec2(
    sin(a) + 0.6 * sin(b * 1.7 + 1.3),
    cos(b) + 0.6 * cos(a * 1.4 + 2.1)
  );

  vec2 local = 0.45 * vec2(
    sin(uv.y * 2.3 + a * 2.0),
    sin(uv.x * 1.9 - b * 2.0)
  );

  return global + local;
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_res;
  float dx = abs(uv.x - 0.5);

  // the text is a narrow centre column, so both masks are horizontal rather
  // than radial. motion dies out first and a little tighter than the texture
  // does, so nothing is still moving by the time it reaches the words.
  float motion = smoothstep(0.17, 0.43, dx);
  float relief = mix(u_center, 1.0, smoothstep(0.24, 0.46, dx));

  // drift is expressed in screen heights, so undo the aspect on x to keep it
  // moving the same distance in both directions
  vec2 d = driftAt(uv, u_time) * u_drift * motion;
  d.x *= u_res.y / u_res.x;

  const float m = ${MARGIN.toFixed(3)};
  float f = texture(u_field, (uv + d + m) / (1.0 + 2.0 * m)).r;

  // purely additive: plumes lift out of the dark, and settle into the paper
  vec3 col = u_bg + f * u_amp * relief;

  // grain, mostly to keep the gradient from banding on wide flat screens. it
  // is pinned to the pixel, not to time, so it reads as paper and not as noise
  col += (hash(gl_FragCoord.xy) - 0.5) * 0.012;

  outColor = vec4(col, 1.0);
}
`;

function readPalette() {
  const style = getComputedStyle(document.documentElement);
  const raw = style.getPropertyValue("--background").trim();
  const m = /^#([0-9a-f]{6})$/i.exec(raw);

  const bg: [number, number, number] = m
    ? [
        ((parseInt(m[1], 16) >> 16) & 255) / 255,
        ((parseInt(m[1], 16) >> 8) & 255) / 255,
        (parseInt(m[1], 16) & 255) / 255,
      ]
    : [0.06, 0.06, 0.055];

  const dark = bg[0] + bg[1] + bg[2] < 1.5;

  return {
    bg,
    amp: dark ? 0.22 : -0.16,
    // how much of the texture survives behind the text
    center: 0.22,
  };
}

const dprOf = () => Math.min(window.devicePixelRatio || 1, 2);

// useLayoutEffect on the client so the backdrop is painted in the same frame
// as the text rather than popping in a beat later. useEffect on the server,
// where neither exists, to keep React quiet.
const useIsoLayoutEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect;

export function Backdrop() {
  const ref = useRef<HTMLCanvasElement>(null);

  useIsoLayoutEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl2", {
      antialias: false,
      alpha: true,
      premultipliedAlpha: true,
      powerPreference: "low-power",
    });
    // no webgl: the page keeps the flat background already on the canvas
    if (!gl) return;

    const compile = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        console.warn("[backdrop] shader compile failed", gl.getShaderInfoLog(s));
      }
      return s;
    };

    const build = (fragSrc: string) => {
      const program = gl.createProgram()!;
      gl.attachShader(program, compile(gl.VERTEX_SHADER, VERT));
      gl.attachShader(program, compile(gl.FRAGMENT_SHADER, fragSrc));
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.warn("[backdrop] link failed", gl.getProgramInfoLog(program));
        return null;
      }
      return program;
    };

    const fieldProgram = build(FIELD_FRAG);
    const compositeProgram = build(COMPOSITE_FRAG);
    if (!fieldProgram || !compositeProgram) return;

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 3, -1, -1, 3]),
      gl.STATIC_DRAW,
    );

    // one seed per page load, held for the life of the mount so that a theme
    // change or a resize redraws the same composition rather than reshuffling
    const seed: [number, number] = [Math.random() * 120, Math.random() * 120];
    // and one phase offset, so a reload does not always start mid-same-breath
    const phase = Math.random() * 500;

    const fieldU = {
      res: gl.getUniformLocation(fieldProgram, "u_res"),
      aspect: gl.getUniformLocation(fieldProgram, "u_aspect"),
      seed: gl.getUniformLocation(fieldProgram, "u_seed"),
    };
    const compU = {
      field: gl.getUniformLocation(compositeProgram, "u_field"),
      res: gl.getUniformLocation(compositeProgram, "u_res"),
      bg: gl.getUniformLocation(compositeProgram, "u_bg"),
      amp: gl.getUniformLocation(compositeProgram, "u_amp"),
      center: gl.getUniformLocation(compositeProgram, "u_center"),
      time: gl.getUniformLocation(compositeProgram, "u_time"),
      drift: gl.getUniformLocation(compositeProgram, "u_drift"),
    };

    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    const fbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D,
      texture,
      0,
    );
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    // looked up once each: querying the attribute location is a synchronous
    // call into the driver, and it answers the same thing every time
    const attrib = new Map<WebGLProgram, number>([
      [fieldProgram, gl.getAttribLocation(fieldProgram, "a")],
      [compositeProgram, gl.getAttribLocation(compositeProgram, "a")],
    ]);

    const bindQuad = (program: WebGLProgram) => {
      gl.useProgram(program);
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      const loc = attrib.get(program)!;
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    };

    // The costly pass. Only ever called when the canvas changes size.
    const drawField = () => {
      // note this is derived from CSS pixels, not device pixels: a retina
      // screen does not need twice the cloud, it needs the same cloud
      const cssW = canvas.width / dprOf();
      const cssH = canvas.height / dprOf();
      const span = 1 + 2 * MARGIN;
      let scale = FIELD_SCALE;
      const budgeted = Math.sqrt(FIELD_BUDGET / (cssW * span * cssH * span));
      if (budgeted < scale) scale = budgeted;

      const fw = Math.max(1, Math.round(cssW * span * scale));
      const fh = Math.max(1, Math.round(cssH * span * scale));

      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.R8,
        fw,
        fh,
        0,
        gl.RED,
        gl.UNSIGNED_BYTE,
        null,
      );

      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
      gl.viewport(0, 0, fw, fh);
      bindQuad(fieldProgram);
      gl.uniform2f(fieldU.res, fw, fh);
      gl.uniform1f(fieldU.aspect, canvas.width / canvas.height);
      gl.uniform2fv(fieldU.seed, seed);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    };

    const still = window.matchMedia("(prefers-reduced-motion: reduce)");

    // React runs effects twice in development, and both runs share this one
    // canvas and context. Rebinding per draw keeps a stale program or an unset
    // uniform from ever reaching the screen.
    let palette = readPalette();

    const composite = (t: number) => {
      gl.viewport(0, 0, canvas.width, canvas.height);

      bindQuad(compositeProgram);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.uniform1i(compU.field, 0);
      gl.uniform2f(compU.res, canvas.width, canvas.height);
      gl.uniform3fv(compU.bg, palette.bg);
      gl.uniform1f(compU.amp, palette.amp);
      gl.uniform1f(compU.center, palette.center);
      gl.uniform1f(compU.time, t);
      gl.uniform1f(compU.drift, still.matches ? 0 : DRIFT);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    let time = phase;

    const resize = () => {
      const dpr = dprOf();
      const w = Math.floor(window.innerWidth * dpr);
      const h = Math.floor(window.innerHeight * dpr);
      if (canvas.width === w && canvas.height === h) return false;
      canvas.width = w;
      canvas.height = h;
      return true;
    };

    // only a theme change moves the palette, so that is the only thing that
    // pays for reading it back out of the stylesheet
    const retint = () => {
      palette = readPalette();
      composite(time);
    };

    const redraw = () => {
      if (resize()) drawField();
      composite(time);
    };

    resize();
    drawField();
    composite(time);

    // Capped well under the display rate. The drift is slow enough that the
    // extra frames would buy nothing but heat.
    let raf = 0;
    let last = 0;
    const step = (now: number) => {
      raf = requestAnimationFrame(step);
      if (now - last < 1000 / FPS) return;
      last = now;
      time = phase + now / 1000;
      if (resize()) drawField();
      composite(time);
    };

    const play = () => {
      if (raf || still.matches || document.hidden) return;
      last = 0;
      raf = requestAnimationFrame(step);
    };
    const pause = () => {
      if (!raf) return;
      cancelAnimationFrame(raf);
      raf = 0;
    };

    // a hidden tab should cost nothing, and coming back should not jump
    const onVisibility = () => (document.hidden ? pause() : play());
    const onStill = () => {
      if (still.matches) {
        pause();
        redraw();
      } else {
        play();
      }
    };

    play();

    // the theme can change from the toggle or from the system preference
    const observer = new MutationObserver(retint);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    const scheme = window.matchMedia("(prefers-color-scheme: dark)");
    scheme.addEventListener("change", retint);
    still.addEventListener("change", onStill);
    window.addEventListener("resize", redraw);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      pause();
      observer.disconnect();
      scheme.removeEventListener("change", retint);
      still.removeEventListener("change", onStill);
      window.removeEventListener("resize", redraw);
      document.removeEventListener("visibilitychange", onVisibility);
      gl.deleteFramebuffer(fbo);
      gl.deleteTexture(texture);
      gl.deleteBuffer(buffer);
      gl.deleteProgram(fieldProgram);
      gl.deleteProgram(compositeProgram);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      aria-hidden
      className="pointer-events-none fixed inset-0 h-full w-full bg-background"
    />
  );
}
