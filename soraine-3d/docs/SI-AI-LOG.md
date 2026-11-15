# Soraine: super intelligence (AI) use log

Team Soraine, NASA Space Apps 2026, Flame in Freefall. Add new entries at the bottom.

## 2026-11-14, home page and Earth kitchen scene

| Prompt (summary) | Tool | What it made | Kept? Why |
|---|---|---|---|
| Team brief: opening kitchen scene and home page; later "strip it down", "like a DS game", "a bit more detailed, less pixelated" | Claude (Anthropic), Fable 5.2 | All files in this folder: `index.html`, `css/styles.css`, `js/scene.js` (the whole 3D kitchen, modelled in code), `js/app.js`, this log | Kept. The scene is code, not a generated picture, so objects can be clicked, moved and re-lit for orbit, Moon and Mars |
| Three kitchen compositions, then refinements (smooth low-poly, painterly, French restaurant kitchen, retro handheld style), two portrait versions | Higgsfield MCP, GPT Image 2.6 | 10 still images (job ids 47ebfa8e, 932ae183, 5b1aa207, 5632c3d8, ff644feb, bab80149, 49778bd1, 2bac9998, aed56b38, 48d7b7eb) | Not used in the page. Rejected by the team as looking AI-generated. The last one (aed56b38) guided the layout and colours of the coded scene |
| Ambient loops from those stills | Higgsfield MCP, Seedance 2.5 | 3 short silent videos (job ids b9865914, 74b80c77, d2a02347) | Not used |

All Higgsfield generations ran on the free-trial unlimited allowance; 0 credits spent. No 3D model was generated (the cheapest full image-to-3D option quoted 14 credits; the account had 10).

### What is in the shipped page
- No AI-generated image or video, and no downloaded 3D models. The kitchen (stove, hood, fridge, sink, table, stool, tiles, floor, pan, egg, flame, mug, rocket) is modelled in code in `js/scene.js` by Claude, following the team's written description and the concept image below.
- three.js r147 (MIT) and the Jost typeface (SIL Open Font License) are bundled locally.
- Tried and removed on 2026-11-14: a pixelated handheld-console version, and furniture from the Kenney Furniture Kit (CC0).
- Concept image: Higgsfield job 4262e275 (GPT Image 2.6, free allowance), made from the team's description. The team chose it as the look to match. It is a reference only and is not in the page; the 3D scene was modelled in code to follow it, with the sink removed and the stove moved to the centre at the team's request.

### Storyboard flow (team sketch, 2026-11-14)
Built from the hand-drawn storyboard: close shot of the pan and egg, pull back to the kitchen, a ripple scan spreading from the sun that outlines objects and wipes the kitchen into orbit, objects floating, then click an object for a close shot with a blurred background and text. All coded by Claude; no generated media.

### Added 2026-11-14 afternoon
Gas canister with hose beside the stove; candles on the stove ledge; close shots now open top-down and can be turned by dragging, zoomed by scroll or pinch, or snapped with a view cube. All coded by Claude.

### Scene 2 and modular split (2026-11-14, about 15:30)
- Higgsfield job aacd4592 (GPT Image 2.6, free allowance): concept image for the lunar surface galley, made from the team's Scene 2 description with the kitchen concept as a prop reference. Reference only; not in the page.
- Claude built Scene 2 in code (`js/scenes/moon.js`): regolith with craters, metal work-platform, the same stove, pan, egg and gas canister, a potted plant, tossed utensils, droplets and crumbs that fall back under lunar gravity, the Earth above the horizon, hard sunlight with sharp shadows. The journey now goes kitchen -> Moon; the orbit scene is kept as a spare.
- Open question for the team: the scene shows an open flame on the bare lunar surface, as in the concept image. The team's own acceptance check says the fire must sit inside a pressurised environment, and a flame would not burn in vacuum. A clear dome is built but switched off (`DOME` in `js/scenes/moon.js`). Decide before submission.
- Claude split the single scene file into kit, props, one file per scene, engine and content, so the team can work in parallel.

### Real imagery added (2026-11-14, about 16:00)
Not AI-generated. Used in the lunar scene; copies are in `assets/space/` and inlined in `js/space-data.js`.
- Earth: `earth-blue-marble.jpg`, taken from the examples folder of the `three-globe` npm package and used at its full 4096x2048. The file name and the picture match NASA's Blue Marble, but the package does not state its source. **Confirm against NASA Visible Earth before crediting it as NASA in the submission.**
- Moon ground: a 40-degree square (2048x2048) cut from `lunar_surface.jpg`, and heights from `lunar_bumpmap.jpg`, both from the examples folder of the `globe.gl` npm package. They look like global maps built from NASA Lunar Reconnaissance Orbiter data, but the package does not state its source. **Confirm, or swap in the maps from NASA's CGI Moon Kit (svs.gsfc.nasa.gov/4720, credit NASA's Scientific Visualization Studio), before crediting as NASA.**
- The picture is a view from orbit laid on the ground as a texture, so the crater sizes in it are not to scale with the stove.
- Craters with raised rims, rocks, about 900 pebbles and the floating debris are modelled in code by Claude.

### Lighting pass (2026-11-14, about 16:10)
Coded by Claude: reflection environments per scene, baked contact shadows under furniture and props, brighter Earth with an atmosphere glow, surface relief driven by the lunar picture, higher-resolution Earth and Moon pictures.

### To check before submission
- Close-shot texts for the pan, egg, gas canister, cooking oil, stove, mug and rocket are plain descriptions written by Claude with no numbers. Each shows "No NASA evidence record is linked to this object yet." Hogan to check the wording; evidence cards still need linking to the research data, and objects need matching to the research materials.
- Orbit caption ("Everything is falling together, so nothing rests on anything. The flame has no up to rise toward.") and the ball-shaped orbit flame are illustrative. Hogan to confirm wording against a source.
- Numbers shown: "Earth, 1 g" and "Moon, about 1/6 g" (the team plan gives the Moon as about 1/6 of Earth). The code uses 1.62 m/s2 for lunar gravity to time the falling objects; it is not displayed. Hogan to confirm both against a source.
- Moon caption ("The same stove, on the Moon. Things still fall here, only slowly.") is Claude's wording. The flame on the Moon is drawn the same as on Earth; no claim is made about its real shape.
- Mars is not built. The storyboard's stove close-up with a pressure gauge and fuel percentage is not built: those numbers need a source first.


## Terrain integration (Moon and Mars)

- Landforms come from a teammate's Blender terrains `moon.glb` and `mars.glb` (`generate_surfaces.py`). They are concept landforms, not measured elevation data.
- Super intelligence (Claude) wrote `tools/convert_terrain.py` (GLB to height map), `js/ground.js` (dense surface, small craters, ripples, rocks, pebbles, baked shadows), `js/outpost.js`, `js/scenes/moon.js` and `js/scenes/mars.js`. Prompts: "combine them together use the backgrounds and meshes here and improve it", then "make it look higher quality just use the ideas and overall design". Kept because it uses the team's landforms at a higher finish.
- Added in code, not from any data: the small craters, surface grain, ripples, rock and pebble positions, cliff banding, Mars ground texture and Mars sky gradient.
- Moon fine detail is a crop of `lunar_surface.jpg` from the globe.gl package examples, and the Earth is `earth-blue-marble.jpg` from three-globe. Neither is confirmed here as a NASA original; confirm before crediting NASA.
- For the team to check: gravity values 1.62 and 3.71 m/s2 need a linked source; Mars sky and ground colours follow the teammate's reference render, not a measurement; the Moon and Mars captions are draft wording; the flame is still in the open on both worlds (dome is available: `K.outpost(g, { dome: true })`).
- Earth in the Moon scene: the cloud layer and the blue atmosphere rim are drawn in code for looks; they are not weather or measured data. The land and ocean picture is the Blue Marble map noted above.
- Moon scene restyle (prompt: curved horizon, synced key light, stylised Earth, then "combine the textures of this look"): the ground is wrapped over a ball of 24 m radius so the horizon falls away. That radius is a look choice for the diorama, not the Moon's size. The Earth's coastlines come from the Blue Marble picture, recoloured in code to a flat blue-and-green palette; the earlier code-drawn clouds were removed. One key light direction lights both the galley and the Earth.
- Later change (prompt: "zoom in a little bit and improve the quality of the textures and use nasa images"): the Earth is the unaltered Blue Marble picture again (the recoloured version was dropped), the lunar picture was sharpened and a fine code-drawn grain is layered over it, and the camera sits closer. I could not download directly from NASA from this workspace and a web search did not confirm where the two package images come from, so confirm their origin (NASA Blue Marble; LRO lunar mosaic) before crediting NASA, or swap in files downloaded from nasa.gov (same names in `assets/space/`, then rebuild `js/space-data.js`).
- Follow-up on the same Moon prompt: planet radius set to 19 m (look choice), the fine grain now also drives a high-frequency bump, and the Earth's night side is left dark so its terminator comes only from the shared key light.
- Moon lighting lift (prompt: exposure lift, brighter Earth, sharper floor, moving stars): added a warm fill light and raised exposure; the Earth's self-glow and the star drift/twinkle are for looks, not physical. Ground picture tiles more densely with a finer grain.
- Platform removed from the Moon scene at the user's request ("let it stand on the moon"): the stove and props stand on a level patch of regolith. Mars still uses the platform.
- Ground texture rework (prompt: "make it lighter ... make them hd"): the lunar picture now only supplies broad light and dark patches; the sharp close-up grain, little craters and pebbles are drawn in code at 2048 px. Not from measured data.
- Moon polish: darker shading, larger Earth with thin code-drawn cloud (not weather data), and an original comet that crosses the sky every 46 s as a background detail. A requested reference to the game Sonic Unleashed was not added.
- Mars scene brought in line with the Moon scene (prompt: curved Martian planetoid, clean procedural regolith, tiny Earth dot, unified amber key light): the ground wraps over the same 19 m ball (a look choice, not Mars's size), the regolith grain, ripples, cliff banding and sky are drawn in code, and the pale-blue Earth dot is decorative (its position is not computed).
- Mars polish (prompt: cinematic sky gradient, dust haze, sharper regolith, golden key light): sky gradient, haze and colours are art direction drawn in code, not measured Mars sky values.
- Higgsfield job 15509187-267e-4045-add3-8349c1450f2e (GPT Image 2.6, free-trial allowance): AI-generated illustration of the Mars galley, used only as a colour and mood reference for the 3D scene (deeper red ground, darker rust sky, dust). Not shown on the site. Prompt asked for no people, logos or text. Mars dust added in code: drifting wisps, blowing motes and one dust devil; decorative, not simulated from data.
- Mars overhaul (prompt: large spherical planetoid, twilight sky with stars, sun upper-left, Earth dot upper-right, embedded platform legs): planet radius raised to 60 m (look choice), a visible sun was added and the one directional light now comes from it, stars and the Earth dot are decorative (not computed positions; stars in a Martian twilight sky are artistic licence).
- Mars: planet radius reduced to 30 m and relief and haze increased for a stronger curve and more depth (prompt: "add more depth and curve to the planet"). Look choice.
- Mars rebuild (prompt: remove the platform, layered depth to the horizon, lift background lighting): props stand in the sand; the team's landform is kept low near the props, with code-made rolling dunes in the midground and far mesas and low mountains (procedural noise, not elevation data); planet radius 150 m; stronger warm fill light. Look choices.
- Mars blend (prompt: "combine the detail and design of the old mars one with the landscape scale of the new one and make the shading darker"): the team's mesas are back at full height near the props with the earlier dark, high-contrast shading; the wide dune field and far mesas stay; radius 95 m. Platform stays removed.
- Start-up fix (user report: slow to open): scenes are built on demand instead of all at once; Earth picture shrunk to 2048x1024 and the lunar picture to 1024x1024 in `js/space-data.js` (full-size Earth stays in assets/space/); close-up ground textures 1024 px.

## Physics and interaction integration (Tony's repository)

- Source: github.com/TonySama-BoiledCabbage/Soraine_Nasa-Space-App at commit 7d8ea73. His `data/scenarios.json` is copied unchanged into `js/physics-data.js`. His rigid-body prop code (cannon-es) was read but not ported; this site uses a simple free-fall formula instead so it still opens from a double-click.
- Super intelligence (Claude) wrote `js/physics.js`, the world buttons and the readout card. Prompt: "Integrate Tony's core physics and interaction scripts ... gravity, burner heat transfer rates, flame diffusion, valve telemetry, verified NASA PSI bounds".
- Not built, because no sourced numbers exist in Tony's data or the team notes: heat-transfer rates, flame diffusion rates, fuel flow rate, fuel pressure (PSI) and any per-world egg cooking time. The card leaves fuel pressure blank; the egg setting is labelled an illustration and runs at the same speed in every world.
- Computed, not sourced: the g ratio (g / 9.81) and the drop time t = sqrt(2h/g) for h = 1 m with no air resistance (Earth 0.45 s, Mars 0.73 s, Moon 1.11 s). The heat shimmer's rise speed scales with sqrt(g / g_Earth); schematic.
- For the team to check: Tony marks the flame-shape numbers `schematic` and the buoyant-velocity facts `unverified`; they are shown with those labels.
- Tony's rigid-body props added (user: "this doesn't have anything that Tony has, add it"): `js/tony-props.js` is a port of his `kitchen/props.js` by super intelligence (Claude); the physics logic and numbers are his. In testing the scan kick sends stove-top props about 0.6 m up on the Moon; that comes from his kick and speed limit (visual heuristic, not measured). Not ported from his repo: the scan post-pass shader (`wave.js`), the Earth meadow, his terrain tiling and his page system; this site keeps its own scan and scenes.
- Top-down pan view and Tony's scan wave added (user: "look at Tony's stuff and add all the things I asked": top-down view with the pan, his transition). The wave's shape, speed (v0 4, accel 44, cubic 120, max 220 m), colours and camera shake are Tony's; the port to this engine and the old-world/new-world reveal are by super intelligence (Claude). It is a visual effect, not a physical model.
- Tony's page system added (user: "combine my 3D models with his interactive physics, transitions and everything, keep the look of mine"): observe / detail / about views, his detail-page depth-of-field and facts card, and his about text (two paragraphs are his wording, lightly edited to fit these scenes). Port by super intelligence (Claude). Kept from this site: all scenes, models, lighting and textures. Still not ported from Tony's repo because they would replace this site's look: his Earth meadow, low-poly terrain tiles and sky dome.
- Remaining Tony features ported (user: "I want ALL his features with my models"): flame cone-to-sphere morph and blue shift driven by his `blue` and `sphere` numbers (schematic), horizon-first sky change during the scan, scan-line spacing that grows with the front, a world picked mid-scan is queued, and `?lite` mode (no shadows, lower resolution). A demo video was recorded frame by frame on a virtual clock in a software renderer, so it plays at real speed but is not a measure of performance.
- UI polish (prompt: translucent non-obstructive cards, compact world bar, fewer clicks, better celestial backgrounds): panels are frosted glass in the margins; the valve, flare, drop and top-view controls are always visible; the star field has varied brightness and colour (drawn in code, not a star catalogue). No new imagery was added: nothing could be downloaded from NASA from this workspace, and there is still no sourced PSI or thermal data, so those stay blank.
