/* Soraine flame, on its own. Everything the fire needs is in this one file.
 *
 *   import * as THREE from 'three';
 *   import { createFlame, FLAME_BY_WORLD } from './flame.js';
 *   const flame = createFlame(THREE);            // { group, light, setWorld, setTarget, flare, blow, update }
 *   flame.group.position.set(x, yOfBurner, z);   // the flame sits on its base; 1 unit = 1 m, about 0.2 m tall on Earth
 *   scene.add(flame.group);
 *   flame.setWorld('moon');                      // 'earth' | 'mars' | 'moon' | 'iss'  (numbers below are Tony's, from data/scenarios.json)
 *   // every frame:
 *   flame.update(timeSeconds, dtSeconds, gravity);   // gravity in m/s2, only used for the blow recovery
 *
 * How it transforms (all driven by five numbers that ease toward the world's values):
 *   height   0..1   how tall the flame stands                       Earth 1.0 -> ISS 0.3
 *   width    1..2   how wide the base spreads                       Earth 1.0 -> ISS 1.9
 *   sphere   0..1   0 = teardrop cone, 1 = ball (vertices blend from the cone to a sphere sitting on the burner)
 *   blue     0..1   0 = yellow/orange, 1 = blue (two colour ramps are mixed)
 *   flicker  0..1   how much the turbulence moves it                Earth 1.0 -> ISS 0.08
 * These five are SCHEMATIC (an illustration of less buoyancy -> shorter, rounder, bluer, calmer). They are not measurements.
 *
 * No textures, no dependencies besides three. Works with the classic build too: SoraineFlame.createFlame(THREE).
 */
export const FLAME_BY_WORLD = {
  earth: { height: 1.0,  width: 1.0,  blue: 0.0,  sphere: 0.0,  flicker: 1.0 },
  mars:  { height: 0.68, width: 1.25, blue: 0.15, sphere: 0.12, flicker: 0.6 },
  moon:  { height: 0.48, width: 1.5,  blue: 0.35, sphere: 0.35, flicker: 0.35 },
  iss:   { height: 0.3,  width: 1.9,  blue: 0.85, sphere: 1.0,  flicker: 0.08 }
};

const NOISE = `
float hsh(vec3 p){ p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float vnoise(vec3 x){ vec3 i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(hsh(i), hsh(i + vec3(1,0,0)), f.x), mix(hsh(i + vec3(0,1,0)), hsh(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(hsh(i + vec3(0,0,1)), hsh(i + vec3(1,0,1)), f.x), mix(hsh(i + vec3(0,1,1)), hsh(i + vec3(1,1,1)), f.x), f.y), f.z); }
`;

/* THE SHAPE (vertex shader). The mesh is an open cone, base radius 0.075, height 0.2, base at y = 0. */
const VERT = `
uniform float uTime, uSphere, uFlicker;
varying float vH; varying float vF; varying vec3 vP;
${NOISE}
void main() {
  vec3 p = position;
  float h = clamp(p.y / 0.2, 0., 1.); vH = h;                                   // 0 at the base, 1 at the tip
  vec3 sN = normalize(vec3(p.x, p.y - 0.075, p.z) + 1e-4);
  vec3 ball = sN * 0.075 + vec3(0., 0.075, 0.);                                 // the same vertex on a sphere sitting on the burner
  p.xz *= 1.0 + 0.55 * sin(h * 3.1416) * (1. - h * 0.35);                       // belly: a teardrop, not a straight cone
  p = mix(p, ball, uSphere);                                                    // <-- THE TRANSFORM: cone -> sphere
  float turb = uFlicker * (1. - 0.75 * uSphere);                                // a round flame is nearly still
  float n1 = vnoise(vec3(position.xz * 22., h * 5. - uTime * 3.2)) - 0.5;       // turbulence scrolls upward
  float n2 = vnoise(vec3(position.xz * 48. + 7., h * 11. - uTime * 5.5)) - 0.5;
  p.xz *= 1.0 + (n1 * 0.7 + n2 * 0.3) * h * turb;                               // licks, stronger toward the tip
  p.x += (vnoise(vec3(uTime * 1.7, h * 2.2, 3.)) - 0.5) * 0.07 * h * h * turb;  // the tip wanders
  p.z += (vnoise(vec3(7., h * 2.2, uTime * 1.5)) - 0.5) * 0.07 * h * h * turb;
  p.y *= 1.0 + (vnoise(vec3(uTime * 4.3, 1., 5.)) - 0.5) * 0.3 * turb;          // it breathes
  vec3 n = normalize(mix(vec3(normal.x, 0.25, normal.z), sN, uSphere));
  vec4 mv = modelViewMatrix * vec4(p, 1.);
  vF = abs(dot(normalize(normalMatrix * n), normalize(-mv.xyz)));               // 1 facing the camera, 0 at the silhouette
  vP = position;
  gl_Position = projectionMatrix * mv;
}`;

/* THE COLOUR (fragment shader). */
const FRAG = `
uniform float uTime, uBlue, uSphere, uGain, uRound, uOpacity;
varying float vH; varying float vF; varying vec3 vP;
${NOISE}
void main() {
  float fn = vnoise(vec3(vP.xz * 30., vH * 7. - uTime * 3.6));
  float heat = clamp(pow(vF, 1.3) * (1.15 - vH * 0.7) + (fn - 0.5) * 0.25, 0., 1.);   // hottest in the middle and low down
  vec3 warm = mix(vec3(0.75, 0.08, 0.0), vec3(1.0, 0.42, 0.02), smoothstep(0.0, 0.4, heat));  // dark red edge -> orange
  warm = mix(warm, vec3(1.0, 0.8, 0.22), smoothstep(0.35, 0.75, heat));                       // -> yellow
  warm = mix(warm, vec3(1.0, 0.96, 0.78), smoothstep(0.75, 1.0, heat));                       // -> pale core
  warm = mix(warm, vec3(0.12, 0.38, 1.0), (1. - smoothstep(0.02, 0.2, vH)) * 0.85);           // blue at the base
  vec3 cool = mix(vec3(0.03, 0.14, 0.9), vec3(0.12, 0.45, 1.0), smoothstep(0.0, 0.5, heat));
  cool = mix(cool, vec3(0.6, 0.86, 1.0), smoothstep(0.6, 1.0, heat));
  float shell = pow(1. - vF, 1.6);                                                            // a round flame is brightest at its edge
  cool = mix(cool, vec3(0.02, 0.2, 0.95) + shell * vec3(0.08, 0.34, 0.05), uSphere);
  vec3 c = mix(warm, cool, smoothstep(0.05, 0.95, uBlue));                                    // <-- THE TRANSFORM: yellow -> blue
  c = clamp(mix(vec3(dot(c, vec3(0.33))), c, 1.5), 0., 1.);                                   // keep the in-between colours vivid
  float body = smoothstep(0.0, 0.4, vF) * (1. - smoothstep(0.5, 1.0, vH + (fn - 0.5) * 0.45)); // soft edges, ragged fading tip
  float a = mix(body, 0.34 + 0.6 * shell, uSphere) * uOpacity;                                // cone: solid body; sphere: thin shell
  gl_FragColor = vec4(c * uGain * mix(1., uRound, uSphere), a);
}`;

export function createFlame(THREE, opts = {}) {
  const U = { uTime: { value: 0 }, uBlue: { value: 0 }, uSphere: { value: 0 }, uFlicker: { value: 1 } };
  function layer(additive, gain, opacity, sx, sy, order) {
    const m = new THREE.ShaderMaterial({
      vertexShader: VERT, fragmentShader: FRAG, transparent: true, depthWrite: false, side: THREE.DoubleSide,
      blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending, toneMapped: false,
      uniforms: { uTime: U.uTime, uBlue: U.uBlue, uSphere: U.uSphere, uFlicker: U.uFlicker, uGain: { value: gain }, uRound: { value: additive ? 0.22 : 1 }, uOpacity: { value: opacity } }
    });
    const mesh = new THREE.Mesh(geo, m); mesh.scale.set(sx, sy, sx); mesh.renderOrder = order; return mesh;
  }
  const geo = new THREE.ConeGeometry(0.075, 0.2, 56, 28, true); geo.translate(0, 0.1, 0);
  const group = new THREE.Group(), inner = new THREE.Group(); group.add(inner);
  inner.add(layer(true, 0.35, 0.5, 1.3, 1.12, 2));     // soft outer glow
  inner.add(layer(false, 1.0, 0.92, 1, 1, 3));         // the body (normal blending, so it reads against bright backgrounds too)
  inner.add(layer(true, 0.6, 0.85, 0.5, 0.62, 4));     // hot core
  const light = new THREE.PointLight(0xffa040, 1.5, 3.2); light.position.set(0, 0.1, 0.15); group.add(light);
  const warmLight = new THREE.Color(1, 0.63, 0.25), blueLight = new THREE.Color(0.45, 0.6, 1);

  const now = { ...FLAME_BY_WORLD.earth }, goal = { ...FLAME_BY_WORLD.earth };
  let flare = 0, lean = 0, leanV = 0, valve = 1;
  const HEIGHT = opts.heightScale == null ? 1 : opts.heightScale;   // e.g. 0.74 if a pan sits 0.13 m above the burner

  return {
    group, light,
    setWorld(id) { Object.assign(goal, FLAME_BY_WORLD[id] || FLAME_BY_WORLD.earth); },   // the flame eases there by itself
    setTarget(p) { Object.assign(goal, p); },                                            // or give your own five numbers
    setValve(v) { valve = Math.max(0, Math.min(1, v)); },                                // 0..1, gas flow (drawn size only, no flow model)
    flare() { flare = 1; },                                                              // a short burst
    blow(strength = 5.5) { leanV += strength; },                                         // a puff of air leans it (schematic)
    update(t, dt = 1 / 60, g = 9.81) {
      const k = 1 - Math.exp(-dt * 2.2);                                                 // ease toward the world's numbers, about a second
      for (const key in goal) now[key] += (goal[key] - now[key]) * k;
      flare = Math.max(0, flare - dt * 1.6);
      const size = 0.35 + 0.65 * valve, burst = 1 + 0.5 * flare;
      const w = now.width * (0.7 + 0.3 * size) * (1 + 0.2 * flare);
      let h = now.height * size * burst * HEIGHT;
      h += (w * 0.78 - h) * now.sphere * now.sphere;                                     // a full sphere is as tall as it is wide
      inner.scale.set(w, Math.max(0.01, h), w); inner.visible = valve > 0.02;
      const stiff = 14 + 60 * Math.sqrt(Math.max(0, g) / 9.81);                          // stronger buoyant draught stands it up sooner
      leanV += (-stiff * lean - 5 * leanV) * dt; lean += leanV * dt; inner.rotation.z = -lean * 0.9;
      U.uTime.value = t; U.uSphere.value = now.sphere; U.uBlue.value = now.blue; U.uFlicker.value = now.flicker;
      light.color.copy(warmLight).lerp(blueLight, now.blue);
      light.intensity = (1.5 + 0.5 * Math.sin(t * 17) * now.flicker + 2 * flare) * (0.45 + 0.55 * now.height) * (valve > 0.02 ? 1 : 0);
    }
  };
}
if (typeof window !== 'undefined') window.SoraineFlame = { createFlame, FLAME_BY_WORLD };
