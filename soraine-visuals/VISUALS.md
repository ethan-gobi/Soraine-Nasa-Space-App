# Soraine visuals pack

Everything that makes the picture, with no physics, panels or scan wave. Double-click `viewer.html` to see it
(keys 1-4 switch world, drag to look, wheel to zoom). `preview.jpg` shows the four worlds from this viewer.

Built for three.js r147 (classic script build, global `THREE`). Tony's project uses ES modules: load these as plain
`<script>` tags before his module, or see "Using it in Tony's project" below.

## What is where

| What | File | Notes |
|---|---|---|
| Renderer settings, how a world is switched on | `host.js` | 60 lines. sRGB output, ACES tone mapping, soft shadows; then per world: background, fog, exposure, reflection map |
| Helpers: materials, rounded boxes, glow sprites, canvas textures, star field, reflection maps | `js/kit.js` | `K.makeEnv(renderer, {top, bottom, lights})` builds each world's reflection map in code |
| Stove, pan, egg, candles, loose props, the flame meshes | `js/props.js` | flame shader is `fireMat`; dark hob so the fire reads |
| Flame on its own (ES module) | `fire/flame.js` | same shader; `createFlame(THREE)`; see the header comment |
| Earth kitchen: room, tiles, fridge, counter, hood | `js/scenes/kitchen.js` | |
| Moon: curved ground, craters, rocks, Earth in the sky, stars, comet | `js/scenes/moon.js` | ground from `js/ground.js` + `js/terrain-data.js` |
| Mars: curved ground, dunes, mesas, twilight sky, sun, Earth dot, dust | `js/scenes/mars.js` | |
| ISS: hull, station, Earth below, clouds, atmosphere rim | `js/scenes/orbit.js` | loads `js/space-hd.js` (4096 x 2048 Earth) when built |
| Terrain builder: height field, craters, baked sun shadows, rocks, fine detail | `js/ground.js` | `K.ground(name, parent, at, opts)` |
| Height maps from the teammate's Blender landforms | `js/terrain-data.js` | |
| Outpost bits on Moon and Mars (plant, dome, dust motes) | `js/outpost.js` | |
| Earth and Moon pictures as data | `js/space-data.js`, `js/space-hd.js`, `assets/space/` | NASA origin not yet confirmed: check before citing |
| Glass panel styles | `css/panels-glass.css` | the last block ("clear glass") is the current look |
| Full engine for reference: cameras, scan wave, depth of field, automatic quality | `reference/engine.js` | not needed by the viewer |

## Lighting, world by world

Shared by all worlds: `HemisphereLight(0x2c3760, 0x24170c, 0.22)`; flame `PointLight` at the burner (warm `1, 0.63, 0.25` to blue `0.45, 0.6, 1`, range 3.2 m).

| World | Background | Exposure | Fog | Lights |
|---|---|---|---|---|
| Earth kitchen | `0x07080c` | 1.0 | none | ceiling lamp `PointLight(0xffac55, 2.4, 12)` with shadows; hood `SpotLight(0xffc27a, 2.6)`; fill `PointLight(0xff9d4a, 0.8, 8)`; night `DirectionalLight(0x6f86d0, 0.12)` |
| Moon | `0x04060b` | 1.04 | none | sun `DirectionalLight(0xfff3e2, 2.25)` from `[-0.49, 0.55, 0.67]` with shadows; earthshine `DirectionalLight(0x86aaff, 0.95)`; `HemisphereLight(0xfff0dc, 0xa39a8e, 0.19)`; front fill `DirectionalLight(0xffe6cc, 0.14)` |
| Mars | `0xe08a42` | 1.0 | `0xe08a42`, 18 to 210 m | sun `DirectionalLight(0xffc27a, 3.4)` from `[-0.8, 0.326, -0.503]` with shadows; `HemisphereLight(0xd89a6a, 0x8a3a1c, 0.4)` |
| ISS | `0x000000` | 1.0 | none | sun `DirectionalLight(0xffffff, 1.5)` at `[5.5, 6.5, -16]`; earthshine `DirectionalLight(0x9fc4ff, 0.75)` from below; rim `DirectionalLight(0xbfd4ff, 0.35)` |

Each world also sets `scene.environment` to a reflection map made by `K.makeEnv` (colours and light positions are in the
`this.envMap = ...` line of each scene file). Ground shadows on Moon and Mars are partly baked into vertex colours by
`K.ground` using the same sun direction, so if you move the sun light, change `sun:` in the `K.ground` call too.

## Using it in Tony's project

Each world is `SoraineKit.scenes.<id>` with `build(E, group)` and an optional `update(E, t, still)`; props are functions in
`SoraineKit.props`. `E` only needs `{ scene, renderer, objects, burner, onFrame, parts }`. So, after the script tags in
`viewer.html` (without `host.js`):

```js
const K = window.SoraineKit, group = new THREE.Group(); scene.add(group);
const E = { scene, renderer, objects: K.objects, burner: new THREE.Vector3(), onFrame() {}, parts: {} };
K.g = id => ({ earth: 9.81, moon: 1.62, mars: 3.71, orbit: 0 }[id]);
K.scenes.moon.build(E, group);                       // the Moon background, lights included, inside `group`
scene.background = new THREE.Color(K.scenes.moon.background);
renderer.toneMappingExposure = K.scenes.moon.exposure || 1;
scene.environment = K.scenes.moon.envMap;
// each frame: K.scenes.moon.update(E, timeSeconds, false);
```

This needs the same three.js version on the page as a global (`js/vendor/three.min.js`, r147). If Tony's module build is a
different version, textures and colour settings differ slightly (`outputEncoding` became `outputColorSpace` after r152).
The scenes are placed for a stove at `(0.3, 0, -2.02)` with its burner about 0.94 m up.

Not included: GLB files. The scenes are built in code; the GLB exports on the `models-only` branch are from an earlier
version and do not include today's changes.
