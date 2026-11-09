# Rebuilds the Material shapes used by the M3 loading indicator (androidx MaterialShapes.kt)
# and samples each as N radii around its bounding-box centre.
# Usage: python3 scripts/loading-indicator-shapes.py src/components/LoadingIndicator/shapes.ts
import math, json, sys

N = 180

def rot(p, deg, c=(0, 0)):
    a = math.radians(deg)
    x, y = p[0] - c[0], p[1] - c[1]
    return (x * math.cos(a) - y * math.sin(a) + c[0], x * math.sin(a) + y * math.cos(a) + c[1])

def do_repeat(points, reps, center, mirroring):
    out = []
    if mirroring:
        ang = [math.degrees(math.atan2(p[0][1] - center[1], p[0][0] - center[0])) for p in points]
        dist = [math.hypot(p[0][0] - center[0], p[0][1] - center[1]) for p in points]
        actual = reps * 2
        sec = 360 / actual
        for it in range(actual):
            for index in range(len(points)):
                i = index if it % 2 == 0 else len(points) - 1 - index
                if i > 0 or it % 2 == 0:
                    a = math.radians(sec * it + (ang[i] if it % 2 == 0 else sec - ang[i] + 2 * ang[0]))
                    out.append(((math.cos(a) * dist[i] + center[0], math.sin(a) * dist[i] + center[1]), points[i][1]))
    else:
        np_ = len(points)
        for it in range(np_ * reps):
            out.append((rot(points[it % np_][0], (it // np_) * 360 / reps, center), points[it % np_][1]))
    return out

def custom(pnr, reps, center=(0.5, 0.5), mirroring=False):
    pts = do_repeat(pnr, reps, center, mirroring)
    return [p for p, _ in pts], [r for _, r in pts], center

def regular(n, radius, rounding):
    return [(radius * math.cos(2 * math.pi * i / n), radius * math.sin(2 * math.pi * i / n)) for i in range(n)], [rounding] * n, (0, 0)

def star(n, inner, rounding):
    v = []
    for i in range(n):
        v.append((math.cos(math.pi / n * 2 * i), math.sin(math.pi / n * 2 * i)))
        v.append((inner * math.cos(math.pi / n * (2 * i + 1)), inner * math.sin(math.pi / n * (2 * i + 1))))
    return v, [rounding] * (2 * n), (0, 0)

def transform(shape, f):
    """Applied after rounding, like RoundedPolygon.transformed()."""
    v, r, c = shape[:3]
    prev = shape[3] if len(shape) > 3 else (lambda p: p)
    return v, r, c, lambda p: f(prev(p))

def outline(shape, steps=64):
    """Dense outline with circular corner rounding (graphics-shapes, smoothing 0)."""
    v, R = shape[0], shape[1]
    n = len(v)
    info = []
    for i in range(n):
        P, A, B = v[i], v[i - 1], v[(i + 1) % n]
        u1 = norm((A[0] - P[0], A[1] - P[1]))
        u2 = norm((B[0] - P[0], B[1] - P[1]))
        th = math.acos(max(-1, min(1, u1[0] * u2[0] + u1[1] * u2[1])))
        cut = 0 if R[i] == 0 or th > math.pi - 1e-6 else R[i] / math.tan(th / 2)
        info.append([u1, u2, th, cut, R[i]])
    side_ratio = []
    for i in range(n):
        L = math.dist(v[i], v[(i + 1) % n])
        s = info[i][3] + info[(i + 1) % n][3]
        side_ratio.append(min(1, L / s) if s > 0 else 1)
    pts = []
    for i in range(n):
        u1, u2, th, cut, r = info[i]
        P = v[i]
        k = min(side_ratio[i - 1], side_ratio[i])
        cut, r = cut * k, r * k
        if cut <= 0:
            pts.append(P)
            continue
        T1 = (P[0] + u1[0] * cut, P[1] + u1[1] * cut)
        T2 = (P[0] + u2[0] * cut, P[1] + u2[1] * cut)
        b = norm((u1[0] + u2[0], u1[1] + u2[1]))
        d = r / math.sin(th / 2)
        C = (P[0] + b[0] * d, P[1] + b[1] * d)
        a1 = math.atan2(T1[1] - C[1], T1[0] - C[0])
        a2 = math.atan2(T2[1] - C[1], T2[0] - C[0])
        da = (a2 - a1 + math.pi) % (2 * math.pi) - math.pi  # short way round
        for s in range(steps + 1):
            a = a1 + da * s / steps
            pts.append((C[0] + r * math.cos(a), C[1] + r * math.sin(a)))
    # densify straight edges too
    dense = []
    for i in range(len(pts)):
        p, q = pts[i], pts[(i + 1) % len(pts)]
        m = max(1, int(math.dist(p, q) / 0.004))
        for s in range(m):
            dense.append((p[0] + (q[0] - p[0]) * s / m, p[1] + (q[1] - p[1]) * s / m))
    return dense

def norm(p):
    l = math.hypot(*p)
    return (p[0] / l, p[1] / l)

def sample(shape):
    """normalized() then radii around the bounds centre; also max distance from the polygon centre."""
    pts = outline(shape)
    post = shape[3] if len(shape) > 3 else (lambda p: p)
    pts = [post(p) for p in pts]
    shape = (shape[0], shape[1], post(shape[2]))
    xs, ys = [p[0] for p in pts], [p[1] for p in pts]
    w, h = max(xs) - min(xs), max(ys) - min(ys)
    side = max(w, h)
    cx, cy = (max(xs) + min(xs)) / 2, (max(ys) + min(ys)) / 2
    pts = [((x - cx) / side, (y - cy) / side) for x, y in pts]
    pc = ((shape[2][0] - cx) / side, (shape[2][1] - cy) / side)
    max_dist = max(math.dist(p, pc) for p in pts)
    # polar: sort by angle, interpolate on a uniform grid
    pol = sorted((math.atan2(y, x) % (2 * math.pi), math.hypot(x, y)) for x, y in pts)
    pol = [(a - 2 * math.pi, r) for a, r in pol[-3:]] + pol + [(a + 2 * math.pi, r) for a, r in pol[:3]]
    radii, j = [], 0
    for k in range(N):
        a = 2 * math.pi * k / N
        while pol[j + 1][0] < a:
            j += 1
        (a0, r0), (a1, r1) = pol[j], pol[j + 1]
        radii.append(r0 + (r1 - r0) * (a - a0) / (a1 - a0) if a1 > a0 else r0)
    return radii, max_dist

def circle(n=8):
    th = math.pi / n
    return regular(n, 1 / math.cos(th), 1)

S = {
    'circle': circle(10),
    'softBurst': custom([((0.193, 0.277), 0.053), ((0.176, 0.055), 0.053)], 10),
    'cookie9': transform(star(9, 0.8, 0.5), lambda p: rot(p, -90)),
    'pentagon': custom([((0.5, -0.009), 0.172), ((1.030, 0.365), 0.164), ((0.828, 0.970), 0.169)], 1, mirroring=True),
    'pill': custom([((0.961, 0.039), 0.426), ((1.001, 0.428), 0), ((1.000, 0.609), 1.0)], 2, mirroring=True),
    'sunny': star(8, 0.8, 0.15),
    'cookie4': custom([((1.237, 1.236), 0.258), ((0.500, 0.918), 0.233)], 4),
    'oval': transform(transform(circle(8), lambda p: (p[0], p[1] * 0.64)), lambda p: rot(p, -45)),
}

out = {}
for k, s in S.items():
    r, md = sample(s)
    out[k] = (r, md)

indet = ['softBurst', 'cookie9', 'pentagon', 'pill', 'sunny', 'cookie4', 'oval']
det = ['circle', 'softBurst']
scale = lambda names: min(1 / (2 * out[n][1]) for n in names)

fmt = lambda r: '[' + ','.join(f'{x:.3f}'.rstrip('0').rstrip('.') for x in r) + ']'
ts = ['// Generated by scripts/loading-indicator-shapes.py from androidx MaterialShapes.kt,',
      f'// sampling each shape as {N} radii around its centre (largest side = 1). Do not edit by hand.',
      '',
      f'export const SAMPLES = {N}',
      '']
for k in S:
    ts.append(f'const {k} = {fmt(out[k][0])}')
ts += ['',
       '/** Shapes the indeterminate indicator morphs through, in order (it loops). */',
       f'export const INDETERMINATE = [{", ".join(indet)}]',
       f'/** Keeps every shape inside the container while it rotates. */',
       f'export const INDETERMINATE_SCALE = {scale(indet):.4f}',
       '',
       '/** The determinate indicator morphs from a circle to a soft burst. */',
       f'export const DETERMINATE = [circle, softBurst]',
       f'export const DETERMINATE_SCALE = {scale(det):.4f}',
       '']
open(sys.argv[1], 'w').write('\n'.join(ts))
for k in S:
    print(k, 'min r %.3f max r %.3f maxDist %.3f' % (min(out[k][0]), max(out[k][0]), out[k][1]))
print('scales', scale(indet), scale(det))
