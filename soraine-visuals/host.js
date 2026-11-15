/* The smallest thing that shows the Soraine visuals: no physics, no panels, no scan wave.
 * It does exactly what js/engine.js does to light and frame a scene, in about 60 lines, so it is the part to copy into
 * another project:
 *   1. renderer settings (sRGB output, ACES tone mapping, soft shadows)
 *   2. build the props (stove, pan, egg, flame) and one scene group per world
 *   3. when a world is shown: its background colour, fog, exposure and reflection map (scene.environment)
 *   4. every frame: the scene's own update (drifting stars, dust, turning Earth) and the flame
 * Keys 1-4 switch world. Drag to look around, wheel to zoom.
 */
(function () {
  var T = THREE, K = SoraineKit, canvas = document.getElementById('c'), hooks = [], groups = {}, built = {}, state = null, t0 = performance.now();
  var renderer = new T.WebGLRenderer({ canvas: canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.outputEncoding = T.sRGBEncoding; renderer.toneMapping = T.ACESFilmicToneMapping; renderer.shadowMap.enabled = true; renderer.shadowMap.type = T.PCFSoftShadowMap;
  var scene = new T.Scene(), camera = new T.PerspectiveCamera(38, 1, 0.05, 900);
  var E = { scene: scene, renderer: renderer, objects: K.objects, burner: new T.Vector3(), onFrame: function (fn) { hooks.push(fn); }, group: function (id) { return groups[id]; } };

  K.g = K.g || function (id) { return { earth: 9.81, moon: 1.62, mars: 3.71, orbit: 0 }[id]; };   // gravity per world (the full site reads it from js/physics-data.js)
  E.parts = E.parts || {};
  Object.keys(K.scenes).forEach(function (id) { var g = new T.Group(); g.visible = false; scene.add(g); groups[id] = g; });
  K.props.forEach(function (fn) { fn(E); });                                   // stove, pan, egg, flame, loose props
  scene.add(new T.HemisphereLight(0x2c3760, 0x24170c, 0.22));                  // the one light shared by every world
  function shadows(root) { root.traverse(function (o) { if (o.isMesh && o.material.isMeshStandardMaterial) { o.castShadow = !o.userData.noCast; o.receiveShadow = !o.userData.noReceive; } }); }

  // the flame's five numbers per world (Tony's, schematic): the same ones fire/flame.js uses
  var FLAME = { earth: [1, 1, 0, 0, 1], mars: [0.68, 1.25, 0.15, 0.12, 0.6], moon: [0.48, 1.5, 0.35, 0.35, 0.35], orbit: [0.3, 1.9, 0.85, 1, 0.08] }, fl = FLAME.earth.slice();

  function show(id) {
    if (!built[id]) { built[id] = true; K.scenes[id].build(E, groups[id]); shadows(scene); }
    state = id; var sc = K.scenes[id], hide = sc.hide || [];
    Object.keys(groups).forEach(function (k) { groups[k].visible = k === id; });
    K.floaters.forEach(function (o) { o.visible = hide.indexOf(o.name) < 0; if (sc.place && sc.place[o.name]) o.position.fromArray(sc.place[o.name]); });
    scene.background = new T.Color(sc.background || 0);                        // 3. background, fog, exposure, reflections
    scene.fog = sc.fog ? new T.Fog(sc.fog[0], sc.fog[1], sc.fog[2]) : null;
    renderer.toneMappingExposure = sc.exposure || 1; scene.environment = sc.envMap || null;
  }
  window.SoraineVisuals = { show: show, E: E, scenes: K.scenes };

  // a plain orbit camera around the burner
  var yaw = 0.35, pitch = 0.2, dist = 1.6, drag = null;
  canvas.addEventListener('pointerdown', function (e) { drag = [e.clientX, e.clientY]; });
  window.addEventListener('pointerup', function () { drag = null; });
  window.addEventListener('pointermove', function (e) { if (!drag) return; yaw -= (e.clientX - drag[0]) * 0.005; pitch = Math.max(-0.1, Math.min(1.2, pitch + (e.clientY - drag[1]) * 0.005)); drag = [e.clientX, e.clientY]; });
  canvas.addEventListener('wheel', function (e) { dist = Math.max(0.5, Math.min(12, dist * (e.deltaY > 0 ? 1.1 : 0.9))); e.preventDefault(); }, { passive: false });
  window.addEventListener('keydown', function (e) { var id = { 1: 'earth', 2: 'moon', 3: 'mars', 4: 'orbit' }[e.key]; if (id) show(id); });
  function size() { renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5)); renderer.setSize(window.innerWidth, window.innerHeight, false); camera.aspect = window.innerWidth / window.innerHeight; camera.updateProjectionMatrix(); }
  window.addEventListener('resize', size); size();

  show((location.search.match(/world=(\w+)/) || [])[1] || 'earth');
  renderer.setAnimationLoop(function () {
    var t = (performance.now() - t0) / 1000, sc = K.scenes[state], goal = FLAME[state], i, P = E.parts;
    for (i = 0; i < 5; i++) fl[i] += (goal[i] - fl[i]) * 0.04;
    hooks.forEach(function (fn) { fn(t, { free: !!sc.freeFall, still: false, focus: false, state: state }); });
    if (sc.update) sc.update(E, t, false);                                     // 4. the scene's own motion
    if (P && P.fire) {                                                         //    and the flame
      var U = P.fire.uniforms, w = fl[1], h = fl[0] * 0.74; h += (w * 0.78 - h) * fl[3] * fl[3];
      U.uTime.value = t; U.uBlue.value = fl[2]; U.uSphere.value = fl[3]; U.uFlicker.value = fl[4]; P.fire.group.visible = true; P.fire.group.scale.set(w, h, w);
      if (P.ball) P.ball.visible = false;
      if (P.light) { P.light.color.setRGB(1 + (0.45 - 1) * fl[2], 0.63 + (0.6 - 0.63) * fl[2], 0.25 + (1 - 0.25) * fl[2]); P.light.intensity = 1.5 * (0.45 + 0.55 * fl[0]); P.light.distance = 3.2; }
    }
    camera.position.set(E.burner.x + Math.sin(yaw) * Math.cos(pitch) * dist, E.burner.y + 0.1 + Math.sin(pitch) * dist, E.burner.z + Math.cos(yaw) * Math.cos(pitch) * dist);
    camera.lookAt(E.burner.x, E.burner.y + 0.1, E.burner.z);
    renderer.render(scene, camera);
  });
})();
