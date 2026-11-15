# Soraine: Flame in Freefall

Static site, no build step. Open `index.html` (works from a double-click) or serve the folder.

## How it is put together

Each idea lives in its own file, so two people can work at once without touching the same code.

| File | What it holds | Who is likely to edit it |
|---|---|---|
| `js/content.js` | Every word on screen: stops, captions, close-shot texts | Story and science |
| `js/scenes/kitchen.js` | Scene `earth`: the kitchen room | Design |
| `js/scenes/moon.js` | Scene `moon`: the lunar surface galley | Design |
| `js/scenes/orbit.js` | Scene `orbit`: free fall, kept as a spare stop | Design |
| `js/props.js` | Things that travel between scenes: stove, pan, egg, flame, canister, bottle, mug, rocket | Design |
| `js/kit.js` | Shared toolbox: bevelled boxes, tubes, the colour palette, glows, stars | Rarely |
| `js/engine.js` | Renderer, camera, scan snapshot, clicking, close shot | Rarely |
| `js/app.js` | Buttons, the scan wipe, the view cube | Build |
| `css/styles.css` | The interface | Build |

## Adding to the project

**Change a caption or add close-shot text.** Edit `js/content.js`. The key in `INFO` is the object's name.

**Add a stop (for example Mars).**
1. Copy `js/scenes/moon.js` to `js/scenes/mars.js`, change `K.scenes.moon` to `K.scenes.mars`, and build your objects inside `build(E, group)`.
2. Add `<script src="js/scenes/mars.js"></script>` to `index.html`, next to the other scenes.
3. Add a `mars` entry to `STOPS` in `js/content.js`, and point another stop's `next` at it.

A scene can set: `camera(aspect)`, `background`, `update(E, t, still)`, `place` (where loose props sit), `hide` (props left behind), `freeFall`, `liveShadows`, `sun`. The list with meanings is at the top of `js/engine.js`.

**Add a prop that appears in every scene.** In `js/props.js`, build it with `group(x, y, z, scene, 'name')`, then add its name to the `pickable` list to make it clickable and give it text in `content.js`. Call `floater(obj, lift, spin)` if it should drift in free fall or be placed per scene.

**Build shapes.** Use the kit so everything matches: `rbox(w, h, d, radius, material, x, y, z, parent)`, `tube(rTop, rBottom, h, material, ...)`, `ball(r, material, ...)`, and the palette `K.mat` (cream, sage, wood, chrome, iron, ...).

**Use it from other code (React, a dashboard, a test).**
- `Soraine.goTo('moon')`, `Soraine.inspect('canister')`, `Soraine.release()`
- Events on `window`: `soraine:scene` (detail `{ to }`), `soraine:inspect` (detail `{ object }`)
- `Soraine.objects` holds every named 3D object
- In React, mount once: `useEffect(() => { SoraineScene.init(canvasRef.current, 'earth') }, [])`. The scene files are plain three.js, not React Three Fiber components.

## Notes
- `docs/SI-AI-LOG.md` is the AI use record.
- three.js r147 (MIT) and the Jost typeface (SIL OFL) are bundled.


## Moon and Mars ground

- `assets/terrain/moon.glb`, `mars.glb`: the team's Blender terrains (see `assets/terrain/README-handoff.md`). They set the big shapes: crater layout, mesas.
- `js/terrain-data.js`: those shapes as height maps, so the page works from a double-click. Rebuild after changing a GLB:
  `python3 tools/convert_terrain.py assets/terrain js/terrain-data.js` (needs numpy)
- `js/ground.js`: `K.ground(name, group, at, opts)` builds the surface from a height map: dense and smooth near the platform, small craters, grain, baked long shadows, rocks and pebbles. Options are listed at the top of the file.
- `js/outpost.js`: `K.outpost(group, { gravity, rock, dust, dome })` builds the platform, plant and falling debris shared by both worlds.
- `js/scenes/moon.js`, `js/scenes/mars.js`: sky, sun direction and gravity for each world. Flow: kitchen, Moon, Mars, kitchen (`js/content.js`).
- Gravity used for the falling debris: Moon 1.62 m/s2, Mars 3.71 m/s2. Source still to be linked by the team.

## Start-up speed

Only the kitchen is built when the page opens. The Moon and Mars are built quietly a few seconds later (or on demand if someone clicks first), in `ensure()` and `prebuild()` in `js/engine.js`. If the 3D view fails, the reason is shown under the title.

## Physics and interactions (with Tony's data)

- `js/physics-data.js`: the worlds from Tony's `data/scenarios.json`, copied unchanged (gravity, flame-shape numbers, facts with sources).
- `js/physics.js`: uses that data. Gravity drives the drop test and the falling debris (`K.g('moon')`). The flame takes Tony's shape numbers per world. The valve slider scales the drawn flame and turns the stove dial and canister wheel. Clicking the pan or egg flares the burner.
- The readout card shows each fact with its source label. Anything without a source stays blank (fuel pressure) or is labelled `schematic`, `unverified` or `illustration`.
- World buttons at the top call `Soraine.goTo('earth' | 'moon' | 'mars')`.

## Tony's loose props (rigid-body sim)

- `js/tony-props.js`: Tony's `kitchen/props.js` ported to a plain script. Same props, sizes, masses, solver settings, per-body gravity, scan kick, microgravity drift and pointer dragging; positions and fixed collision shapes are set for this stove.
- `js/vendor/cannon.js`: his bundled cannon-es 0.20 with the module export swapped for `window.CANNON`.
- The ISS button goes to the `orbit` stop, which uses Tony's `iss` world (g about 0).
