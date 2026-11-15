/* Soraine engine: the part that does not change when ideas change.
 * It owns the renderer, the camera, the frame loop, the scan snapshot, clicking
 * and the close shot. It knows nothing about kitchens or moons: it builds whatever
 * is registered in SoraineKit.props and SoraineKit.scenes, and shows one scene at a time.
 *
 * A scene definition (see js/scenes/*.js):
 *   build(E, group)        required. Add your objects to `group`.
 *   camera(aspect)         required. Returns { pos: [x,y,z], look: [x,y,z] }.
 *   background             hex colour behind everything.
 *   update(E, t, still)    optional, every frame while the scene is showing.
 *   place                  optional { propName: [x,y,z] }: where loose props sit in this scene.
 *   hide                   optional [propName]: loose props not shown in this scene.
 *   freeFall               optional true: loose props drift, flames go round.
 *   liveShadows            optional true: redraw shadows every frame.
 *   exposure               optional number: overall brightness of this scene (1 is normal).
 *   envMap                 optional texture (K.makeEnv): what shiny surfaces reflect in this scene.
 *   fog                    optional [hex, near, far]: distance haze.
 *   sun                    optional [x,y,z]: the scan ripple starts where this appears on screen.
 */
(function () {
  var T = THREE, K = SoraineKit, objects = K.objects, floaters = K.floaters;
  var renderer, scene, camera, state = null, still = false, k = 0, lastT = 0, freeStart = 0;
  var shadowDirty = 4, ratio = 1.5, frames = 0, slow = 0;
  var groups = {}, built = {}, hooks = [], lineMat, inspectKey, pickRoots = [];
  var view = 'intro', introUntil = 0, focus = null, saved = [], focusCenter = new T.Vector3(), tmp = new T.Vector3();
  var goalPos = new T.Vector3(), goalLook = new T.Vector3(), camPos = new T.Vector3(), camLook = new T.Vector3();
  var orb = { th: 0, ph: 0.1, d: 1, bd: 1, cth: 0, cph: 0.1, cd: 1 };

  /* E is what props and scenes are handed: the shared scene, the object registry, a place to hook into the frame loop */
  var E = {
    scene: null, renderer: null, objects: objects,
    burner: new T.Vector3(),                                   // world position of the lit burner (set by props.js)
    onFrame: function (fn) { hooks.push(fn); },                // fn(t, { free, still, focus, state })
    group: function (id) { return groups[id]; }
  };
  function def() { return K.scenes[state]; }

  function build(firstId) {
    scene = E.scene = new T.Scene(); scene.background = new T.Color(0x000000);
    Object.keys(K.scenes).forEach(function (id) { var g = new T.Group(); g.name = 'scene:' + id; g.visible = false; scene.add(g); groups[id] = g; });
    K.props.forEach(function (fn) { fn(E); });
    ensure(firstId);                                           // the opening scene; the others are built later (see ensure)
    scene.add(new T.HemisphereLight(0x2c3760, 0x24170c, 0.22));

    scene.traverse(function (o) { if (o.isMesh && o.material.isMeshStandardMaterial) { o.castShadow = !o.userData.noCast; o.receiveShadow = !o.userData.noReceive; } });
    floaters.forEach(function (o) { o.userData.home = o.position.clone(); o.userData.turn = o.rotation.clone(); });

    // edge lines for the scan: object outlines that light up as the ripple passes
    lineMat = new T.LineBasicMaterial({ color: 0xfff2c0, transparent: true, opacity: 0, depthTest: false }); lineMat.visible = false;
    K.outline.forEach(function (nm) {
      if (!objects[nm]) return; var list = [];
      objects[nm].traverse(function (o) { if (o.isMesh && !o.isInstancedMesh) list.push(o); });
      list.forEach(function (o) { var ln = new T.LineSegments(new T.EdgesGeometry(o.geometry, 40), lineMat); ln.raycast = function () {}; o.add(ln); });
    });
    K.pickable.forEach(function (nm) { if (objects[nm]) { objects[nm].userData.pick = nm; pickRoots.push(objects[nm]); } });

    inspectKey = new T.Group(); inspectKey.visible = false; scene.add(inspectKey);
    var ik = new T.DirectionalLight(0xffd9a8, 1.5); ik.position.set(2, 3, 4); inspectKey.add(ik);
    var ir = new T.DirectionalLight(0x7fa8ff, 0.5); ir.position.set(-3, 1, -2); inspectKey.add(ir);
    camera = E.camera = new T.PerspectiveCamera(46, 1, 0.1, 600);
  }

  function resize() {
    ratio = Math.min(window.devicePixelRatio || 1, ratio); renderer.setPixelRatio(ratio);
    renderer.setSize(window.innerWidth, window.innerHeight, false);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.fov = camera.aspect < 0.8 ? 62 : (camera.aspect < 1.4 ? 54 : 46);
    camera.updateProjectionMatrix(); shadowDirty = 4; draw(performance.now());
  }
  function overview() { var c = def().camera(camera.aspect); goalPos.fromArray(c.pos); goalLook.fromArray(c.look); }

  function draw(now) {
    var sc = def(), free = !!sc.freeFall, t = still ? 6 : now / 1000;
    var dt = Math.min(0.1, (now - lastT) / 1000) || 0.016; lastT = now;
    if (!still && ratio > 1) { frames++; if (dt > 0.03) slow++; if (frames === 120) { if (slow > 60) { ratio = 1; renderer.setPixelRatio(1); renderer.setSize(window.innerWidth, window.innerHeight, false); } frames = slow = 0; } }   // ease off on slow machines
    k += ((free ? 1 : 0) - k) * (still ? 1 : 1 - Math.exp(-dt * 1.8));

    // camera: opening close shot on the burner, then the scene's resting view, or a turnable close shot of one object
    var sway = still ? 0 : Math.sin(t * 0.22) * 0.05;
    if (view === 'intro' && (now > introUntil || still)) view = 'overview';
    if (view === 'intro') { goalPos.copy(E.burner).add(tmp.set(0.03, 0.6, 0.26)); goalLook.copy(E.burner); }
    else if (view === 'inspect' && focus) {
      var e2 = still ? 1 : 1 - Math.exp(-dt * 7);
      if (free) new T.Box3().setFromObject(focus[0]).getCenter(focusCenter);
      orb.cth += (orb.th - orb.cth) * e2; orb.cph += (orb.ph - orb.cph) * e2; orb.cd += (orb.d - orb.cd) * e2;
      goalLook.copy(focusCenter); sway = 0;
      goalPos.set(focusCenter.x + orb.cd * Math.sin(orb.cph) * Math.sin(orb.cth), focusCenter.y + orb.cd * Math.cos(orb.cph), focusCenter.z + orb.cd * Math.sin(orb.cph) * Math.cos(orb.cth));
      camPos.copy(goalPos);
    }
    else overview();
    var ease = still ? 1 : 1 - Math.exp(-dt * (view === 'inspect' ? 5 : 2.2));
    camPos.lerp(goalPos, ease); camLook.lerp(goalLook, ease);
    camera.position.copy(camPos); camera.position.x += sway; camera.lookAt(camLook);

    // loose props: at home, or where this scene places them; drifting when the scene is in free fall
    floaters.forEach(function (o) {
      var u = o.userData, pl = sc.place && sc.place[o.name];
      if (pl) o.position.fromArray(pl); else o.position.copy(u.home);
      o.position.addScaledVector(u.lift, k); o.position.y += Math.sin(t * 0.6 + u.spin.x * 20) * 0.04 * k;
      var to = (t - freeStart) * k; o.rotation.set(u.turn.x + u.spin.x * to, u.turn.y + u.spin.y * to, u.turn.z + u.spin.z * to);
    });

    var info = { free: free, still: still, focus: !!focus, state: state };
    for (var h = 0; h < hooks.length; h++) hooks[h](t, info);
    if (sc.update && !focus) sc.update(E, t, still);

    if (shadowDirty > 0 || (k > 0.002 && k < 0.998) || (sc.liveShadows && !focus)) { renderer.shadowMap.needsUpdate = true; shadowDirty--; }   // shadows only redraw when something moved
    renderer.render(scene, camera);
  }
  function loop(now) { draw(now); requestAnimationFrame(loop); }

  // Scenes are built the first time they are needed (and quietly ahead of time once the page is up),
  // so opening the page only has to build the first one.
  function ensure(id) {
    if (built[id] || !K.scenes[id]) return;
    built[id] = true; K.scenes[id].build(E, groups[id]);
    groups[id].traverse(function (o) { if (o.isMesh && o.material.isMeshStandardMaterial) { o.castShadow = !o.userData.noCast; o.receiveShadow = !o.userData.noReceive; } });    floaters.forEach(function (o) { if (!o.userData.home) { o.userData.home = o.position.clone(); o.userData.turn = o.rotation.clone(); } });
    shadowDirty = 4;
  }
  function prebuild() {
    var next = Object.keys(K.scenes).filter(function (id) { return !built[id] && id !== 'orbit'; })[0]; if (!next) return;
    try { ensure(next); } catch (e) { if (window.console) console.error(e); }
    setTimeout(prebuild, 1200);
  }

  function setState(next) {
    if (!K.scenes[next]) return false;
    ensure(next);
    state = next; var sc = def(), hide = sc.hide || [];
    Object.keys(groups).forEach(function (id) { groups[id].visible = id === next; });
    floaters.forEach(function (o) { o.visible = hide.indexOf(o.name) < 0; });
    scene.background = new T.Color(sc.background || 0x000000);
    scene.environment = sc.envMap || null; renderer.toneMappingExposure = sc.exposure || 1;
    scene.fog = sc.fog ? new T.Fog(sc.fog[0], sc.fog[1], sc.fog[2]) : null;
    if (sc.freeFall) freeStart = still ? 6 : performance.now() / 1000;
    shadowDirty = 4; return true;
  }

  window.SoraineScene = {
    init: function (canvas, first) {
      renderer = new T.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
      renderer.outputEncoding = T.sRGBEncoding; renderer.toneMapping = T.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.0;
      renderer.shadowMap.enabled = true; renderer.shadowMap.type = T.PCFSoftShadowMap; renderer.shadowMap.autoUpdate = false;
      E.renderer = renderer;
      build(first || Object.keys(K.scenes)[0]); setState(first || Object.keys(K.scenes)[0]);
      setTimeout(prebuild, 3500);
      canvas.addEventListener('webglcontextlost', function (ev) { ev.preventDefault(); window.dispatchEvent(new CustomEvent('soraine:error', { detail: 'The graphics card dropped the 3D view (out of graphics memory). Reload the page.' })); });
      camera.aspect = window.innerWidth / window.innerHeight; overview();
      if (still) { camPos.copy(goalPos); camLook.copy(goalLook); view = 'overview'; }
      else { camPos.copy(E.burner).add(tmp.set(0.03, 0.6, 0.26)); camLook.copy(E.burner); introUntil = performance.now() + 2200; }
      resize();
      window.addEventListener('resize', resize);
      requestAnimationFrame(loop);
    },
    setState: setState,
    scenes: function () { return Object.keys(K.scenes); },
    setStill: function (v) { still = !!v; },
    /* the current frame as an image, for the scan wipe and the blurred backdrop */
    snapshot: function () { draw(performance.now()); return renderer.domElement.toDataURL('image/jpeg', 0.82); },
    /* 0..1: how brightly object outlines glow during the scan */
    edges: function (a) { lineMat.opacity = a; lineMat.visible = a > 0.01; },
    /* where the scene's sun sits on screen, in CSS pixels: the centre of the ripple */
    sunPoint: function () {
      var sun = def().sun, cx = -1.1, cy = 0.9;
      if (sun) { var v = tmp.fromArray(sun).project(camera); if (v.z <= 1) { cx = Math.max(-1.1, Math.min(1.1, v.x)); cy = Math.max(-1.1, Math.min(1.1, v.y)); } }
      return { x: (cx * 0.5 + 0.5) * window.innerWidth, y: (-cy * 0.5 + 0.5) * window.innerHeight };
    },
    /* name of the clickable object under a screen point, or null */
    pick: function (x, y) {
      if (focus) return null;
      var ray = new T.Raycaster(); ray.setFromCamera(new T.Vector2(x / window.innerWidth * 2 - 1, -(y / window.innerHeight) * 2 + 1), camera);
      var hit = ray.intersectObjects(pickRoots.filter(function (o) { return o.visible; }), true)[0]; if (!hit) return null;
      for (var o = hit.object; o; o = o.parent) if (o.userData.pick) return o.userData.pick; return null;
    },
    /* close shot: keep only the chosen object, swing the camera above it. Call snapshot() first for the backdrop. */
    inspect: function (name) {
      var keep = name === 'pan' ? [objects.pan, objects.egg] : [objects[name]]; if (!keep[0]) return false;
      focus = keep; saved = [];
      scene.children.forEach(function (c) { if (keep.indexOf(c) < 0 && !c.isLight && c !== inspectKey) { saved.push([c, c.visible]); c.visible = false; } });
      inspectKey.visible = true; scene.background = null; renderer.setClearColor(0x000000, 0);
      var box = new T.Box3().setFromObject(keep[0]), size = box.getSize(new T.Vector3()); box.getCenter(focusCenter);
      var rel = camPos.clone().sub(focusCenter);
      orb.cd = rel.length(); orb.cph = Math.acos(Math.max(-1, Math.min(1, rel.y / orb.cd))); orb.cth = Math.atan2(rel.x, rel.z);
      orb.bd = Math.max(size.x, size.y, size.z) * 1.45 + 0.18; orb.d = orb.bd; orb.th = 0; orb.ph = 0.1;
      view = 'inspect'; return true;
    },
    /* close-shot controls: turn (radians), zoom (factor), snap to a named angle, read the angle */
    turn: function (dth, dph) { orb.th += dth; orb.ph = Math.max(0.06, Math.min(1.5, orb.ph + dph)); },
    zoom: function (f) { orb.d = Math.max(orb.bd * 0.5, Math.min(orb.bd * 2.5, orb.d * f)); },
    lookFrom: function (th, ph) { orb.th = th + Math.round((orb.th - th) / (Math.PI * 2)) * Math.PI * 2; orb.ph = ph; },
    angles: function () { return { th: orb.cth, ph: orb.cph }; },
    release: function () {
      if (!focus) return; focus = null; view = 'overview';
      saved.forEach(function (p) { p[0].visible = p[1]; }); saved = []; inspectKey.visible = false;
      setState(state);
    },
    objects: objects
  };
})();
