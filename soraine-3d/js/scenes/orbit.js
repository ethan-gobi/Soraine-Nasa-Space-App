/* Scene "orbit": free fall above the Earth. Not in the main flow right now (the
 * journey goes kitchen -> Moon), but kept as a ready-made stop: Soraine.goTo('orbit').
 * freeFall: true tells the engine to let the loose props drift and the flames go round.
 */
(function () {
  var T = THREE, K = SoraineKit, std = K.std, glow = K.glow, put = K.put, roundedGeo = K.roundedGeo, rbox = K.rbox, tube = K.tube, ball = K.ball,
      group = K.group, halo = K.halo, canvasTex = K.canvasTex, rand = K.rand, floater = K.floater, objects = K.objects, m = K.mat;
  var cream = m.cream, creamDark = m.creamDark, white = m.white, chrome = m.chrome, brass = m.brass, iron = m.iron, sage = m.sage, sageDark = m.sageDark, wood = m.wood, woodDark = m.woodDark, teal = m.teal, plaster = m.plaster, tile = m.tile, stone = m.stone, leaf = m.leaf;

  K.scenes.orbit = {
    background: 0x000000,
    freeFall: true,
    sun: [5.5, 6.5, -16],
    camera: function (aspect) { return K.scenes.earth.camera(aspect); },
    build: function (E, g) {
      K.starField(g, 420, 40);
      put(new T.SphereGeometry(14, 96, 64), std(0x2f76a8, 0.85), 0.3, -15.6, -4, g, 'earthBelow');
      var sunHalo = new T.Group(); sunHalo.position.set(5.5, 6.5, -16); g.add(sunHalo);
      halo(0xfff0c8, 7, 0, 0, 0, sunHalo, 0.9); halo(0xffffff, 1.6, 0, 0, 0, sunHalo, 1);
      var sun = new T.DirectionalLight(0xffffff, 1.3); sun.position.copy(sunHalo.position); g.add(sun);
      var fill = new T.DirectionalLight(0xbfd4ff, 0.9); fill.position.set(-2, 1.5, 6); g.add(fill);
    }
  };
})();
