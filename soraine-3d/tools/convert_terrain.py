"""Turn the team's terrain GLBs into height maps the site can use.
usage: python3 -I convert_terrain.py <dir with moon.glb, mars.glb> <out js>
Each world: w x h grid of 16-bit heights (ymin..ymax) covering x0..x1, z0..z1 metres, a small colour grid,
and site = [x, y, z] of the flattest spot near the front, where the platform stands."""
import sys, json, struct, base64, math
import numpy as np
W, H, CW, CH = 512, 320, 128, 80
SITE = {'moon': [1.6, 10.4], 'mars': [10.4, 8.0]}
def blur(a, n):
    for _ in range(n):
        p = np.pad(a, [(1, 1), (1, 1)] + [(0, 0)] * (a.ndim - 2), mode='edge')
        a = (p[:-2, 1:-1] + p[2:, 1:-1] + p[1:-1, :-2] + p[1:-1, 2:] + 4 * p[1:-1, 1:-1]) / 8.0
    return a
def conv(fn, name):
    b = open(fn, 'rb').read(); l = struct.unpack('<I', b[12:16])[0]; j = json.loads(b[20:20 + l]); bin0 = 20 + l + 8
    def acc(i):
        a = j['accessors'][i]; bv = j['bufferViews'][a['bufferView']]; off = bin0 + bv.get('byteOffset', 0) + a.get('byteOffset', 0)
        nc = {'SCALAR': 1, 'VEC2': 2, 'VEC3': 3, 'VEC4': 4}[a['type']]; dt = {5126: '<f4', 5123: '<u2', 5125: '<u4', 5121: 'u1'}[a['componentType']]
        assert bv.get('byteStride', np.dtype(dt).itemsize * nc) == np.dtype(dt).itemsize * nc
        return np.frombuffer(b, dt, a['count'] * nc, off).reshape(-1, nc).astype(np.float64)
    p = j['meshes'][0]['primitives'][0]
    pos = acc(p['attributes']['POSITION']); col = acc(p['attributes']['COLOR_0'])[:, :3] / 65535.0; idx = acc(p['indices']).astype(int).reshape(-1, 3)
    x0, x1, z0, z1 = pos[:, 0].min(), pos[:, 0].max(), pos[:, 2].min(), pos[:, 2].max()
    hgt = np.full((H, W), -1e9); rgb = np.zeros((H, W, 3)); gx = (pos[:, 0] - x0) / (x1 - x0) * (W - 1); gz = (pos[:, 2] - z0) / (z1 - z0) * (H - 1)
    for t in idx:
        ax, bx, cx = gx[t]; az, bz, cz = gz[t]; den = (bz - cz) * (ax - cx) + (cx - bx) * (az - cz)
        if abs(den) < 1e-12: continue
        u0, u1 = max(0, int(math.floor(min(ax, bx, cx)))), min(W - 1, int(math.ceil(max(ax, bx, cx)))); v0, v1 = max(0, int(math.floor(min(az, bz, cz)))), min(H - 1, int(math.ceil(max(az, bz, cz))))
        uu, vv = np.meshgrid(np.arange(u0, u1 + 1), np.arange(v0, v1 + 1))
        w0 = ((bz - cz) * (uu - cx) + (cx - bx) * (vv - cz)) / den; w1 = ((cz - az) * (uu - cx) + (ax - cx) * (vv - cz)) / den; w2 = 1 - w0 - w1
        m = (w0 >= -1e-6) & (w1 >= -1e-6) & (w2 >= -1e-6)
        y = w0 * pos[t[0], 1] + w1 * pos[t[1], 1] + w2 * pos[t[2], 1]; sub = hgt[v0:v1 + 1, u0:u1 + 1]; m &= y > sub
        sub[m] = y[m]; rgb[v0:v1 + 1, u0:u1 + 1][m] = col[t[0]]
    assert (hgt > -1e8).all(), 'holes in the height map'
    hgt = blur(hgt, 3); rgb = blur(rgb, 6)                       # round off the facets, keep the landforms
    small = rgb.reshape(CH, H // CH, CW, W // CW, 3).mean((1, 3))
    ymin, ymax = float(hgt.min()), float(hgt.max()); q = np.round((hgt - ymin) / (ymax - ymin) * 65535).astype('<u2')
    sx, sz = SITE[name]; u = int(round((sx - x0) / (x1 - x0) * (W - 1))); v = int(round((sz - z0) / (z1 - z0) * (H - 1)))
    sy = float(hgt[v - 12:v + 13, u - 19:u + 20].max())
    print(name, 'x', x0, x1, 'z', z0, z1, 'y', round(ymin, 2), round(ymax, 2), 'site y', round(sy, 3), 'mean colour (linear)', small.mean((0, 1)).round(3))
    return {'w': W, 'h': H, 'x0': float(x0), 'x1': float(x1), 'z0': float(z0), 'z1': float(z1), 'ymin': round(ymin, 4), 'ymax': round(ymax, 4), 'site': [sx, round(sy, 3), sz],
            'hgt': base64.b64encode(q.tobytes()).decode(), 'cw': CW, 'ch': CH, 'col': base64.b64encode(np.round(np.clip(small, 0, 1) * 255).astype('u1').tobytes()).decode()}
out = {n: conv(sys.argv[1] + '/' + n + '.glb', n) for n in ('moon', 'mars')}
open(sys.argv[2], 'w').write("/* Landforms from the team's Blender terrains (assets/terrain/moon.glb, mars.glb) as height maps, so the page\n"
    " * also works from a double-click. Per world: w x h 16-bit heights between ymin and ymax (metres) over x0..x1, z0..z1;\n"
    " * a cw x ch grid of the team's ground colours (linear RGB); site = where the platform stands.\n"
    " * Rebuild after re-exporting a GLB: python3 tools/convert_terrain.py assets/terrain js/terrain-data.js\n */\n"
    "window.SORAINE_TERRAIN = " + json.dumps(out) + ";\n")
