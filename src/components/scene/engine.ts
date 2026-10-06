// 배경 복셀 씬. three.js는 이 파일과 함께 idle 이후에만 내려받는다.
import {
  AmbientLight, BoxGeometry, Color, DirectionalLight, Fog, Group, InstancedMesh, Matrix4, MeshBasicMaterial,
  MeshLambertMaterial, NearestFilter, PerspectiveCamera, RepeatWrapping, Scene, SRGBColorSpace, Texture,
  TextureLoader, Vector3, WebGLRenderer, type Material,
} from 'three'
import { TEXTURES } from '@/generated/textures'
import { RAW } from '@/generated/voxels'
import type { SceneKey } from '@/lib/nav'

type Add = (type: string, x: number, y: number, z: number, sx?: number, sy?: number, sz?: number) => void
type Def = {
  sky: string; fog: [number, number]; cam: [number, number, number]; look: [number, number, number]
  build: (add: Add, hero: (name: 'grass' | 'stone' | 'deepslate', x: number, y: number, z: number, size: number) => void) => void
  water?: { y: number; size: [number, number]; at: [number, number] }
}

// 고정 시드 난수: 씬 모양이 매번 같다
function rng(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function tree(add: Add, x: number, y: number, z: number, leaf = 'leaves', h = 4) {
  for (let i = 0; i < h; i++) add('log', x, y + i, z)
  for (let dx = -2; dx <= 2; dx++)
    for (let dz = -2; dz <= 2; dz++)
      for (let dy = 0; dy <= 2; dy++) {
        const r = Math.abs(dx) + Math.abs(dz) + dy
        if (r <= 3 && !(dx === 0 && dz === 0 && dy === 0)) add(leaf, x + dx, y + h - 1 + dy, z + dz)
      }
}

const DEFS: Record<SceneKey, Def> = {
  // 평원 마을: 홈, 공지, 가이드
  plains: {
    sky: '#1c2a36', fog: [18, 52], cam: [0, 8, 17], look: [0, 4, -8],
    build(add, hero) {
      const r = rng(7)
      const hAt = (x: number, z: number) => Math.round(1.6 * Math.sin(x * 0.19) + 1.4 * Math.cos(z * 0.23) + (z < -10 ? (-z - 10) * 0.42 : 0))
      for (let x = -24; x <= 24; x++)
        for (let z = -30; z <= 8; z++) {
          const h = hAt(x, z)
          const path = Math.abs(x - Math.round(3 * Math.sin(z * 0.2))) <= 1 && z > -14
          add(path ? 'gravel' : 'grass', x, h, z)
          add('dirt', x, h - 1, z)
          if (r() < 0.012 && !path && z < 2) tree(add, x, h + 1, z, r() < 0.35 ? 'cherry' : 'leaves', 3 + Math.floor(r() * 2))
        }
      // 집
      const bx = -9, bz = -6, by = hAt(bx, bz) + 1
      for (let x = 0; x < 6; x++)
        for (let z = 0; z < 5; z++)
          for (let y = 0; y < 4; y++) {
            const wall = x === 0 || x === 5 || z === 0 || z === 4
            if (!wall) continue
            const window = y === 2 && (x === 2 || x === 3) && z === 4
            add(y === 0 ? 'cobble' : window ? 'glow' : 'planks', bx + x, by + y, bz + z)
          }
      for (let i = 0; i < 4; i++)
        for (let x = -1 + i; x <= 6 - i; x++) for (let z = -1; z <= 5; z++) if (i < 3 || x === 2 || x === 3) add('dark_planks', bx + x, by + 4 + i, bz + z)
      hero('grass', 10, 9, -4, 6)
      hero('stone', -15, 12, -14, 3)
    },
  },
  // 광산: 아이템, 제작, 강화
  mine: {
    sky: '#0d0c0b', fog: [7, 34], cam: [0, 4.2, 11], look: [0, 3.6, -10],
    build(add, hero) {
      const r = rng(21)
      const ores = ['coal_ore', 'coal_ore', 'iron_ore', 'iron_ore', 'gold_ore', 'diamond_ore']
      for (let z = -24; z <= 8; z++)
        for (let x = -16; x <= 16; x++) {
          const half = 9 + Math.round(1.5 * Math.sin(z * 0.4) + r())
          const ceil = 8 + Math.round(Math.cos(z * 0.3)) - Math.floor(Math.abs(x) * 0.25)
          add(r() < 0.12 ? 'cobble' : 'deepslate', x, 0, z)
          if (Math.abs(x) >= half) {
            for (let y = 1; y <= ceil + 2; y++) if (Math.abs(x) === half || y > ceil) add(r() < 0.09 ? ores[Math.floor(r() * ores.length)] : y < 3 ? 'deepslate' : 'stone', x, y, z)
          } else add(r() < 0.06 ? ores[Math.floor(r() * 4)] : 'stone', x, ceil + 1, z)
          if (z === -24) for (let y = 1; y <= 10; y++) add('stone', x, y, z)
        }
      // 갱도 버팀목
      for (let z = -20; z <= -2; z += 6) {
        for (let y = 1; y <= 6; y++) { add('log', -6, y, z); add('log', 6, y, z) }
        for (let x = -6; x <= 6; x++) add('planks', x, 7, z)
        add('glow', -5, 6, z, 0.5, 0.5, 0.5)
        add('glow', 5, 6, z, 0.5, 0.5, 0.5)
      }
      for (let x = -3; x <= 2; x++) for (let z = -18; z <= -15; z++) add('lava', x, 0.3, z)
      hero('deepslate', 7.5, 3, 1, 3.2)
    },
  },
  // 강과 선착장: 낚시
  dock: {
    sky: '#1a2c44', fog: [16, 56], cam: [3, 5.2, 13], look: [2, 1.6, -6],
    water: { y: 0.42, size: [90, 70], at: [0, -14] },
    build(add, hero) {
      const r = rng(33)
      // 강기슭
      for (let x = -28; x <= -6; x++)
        for (let z = -30; z <= 8; z++) {
          const h = Math.round((-6 - x) * 0.3 + Math.sin(z * 0.3) * 0.8)
          if (h < 0) continue
          add(h <= 1 ? 'sand' : 'grass', x, h, z)
          add(h <= 1 ? 'sand' : 'dirt', x, h - 1, z)
          if (h > 2 && r() < 0.02) tree(add, x, h + 1, z, 'leaves', 4)
        }
      // 건너편 언덕
      for (let x = -6; x <= 30; x++)
        for (let z = -34; z <= -26; z++) {
          const h = Math.round((-26 - z) * 0.6 + Math.sin(x * 0.3))
          add('grass', x, h, z); add('dirt', x, h - 1, z)
        }
      // 선착장
      for (let x = -8; x <= 7; x++) for (let z = -5; z <= -3; z++) add('dark_planks', x, 1, z)
      for (let x = 5; x <= 7; x++) for (let z = -9; z <= -6; z++) add('dark_planks', x, 1, z)
      for (const [px, pz] of [[-4, -5], [-4, -3], [1, -5], [1, -3], [7, -3], [7, -9], [5, -9]] as const) {
        for (let y = -1; y <= 2; y++) add('log', px, y, pz, 0.7, 1, 0.7)
      }
      add('glow', 7, 3, -3, 0.5, 0.6, 0.5)
      // 낚싯대: 대는 계단처럼 올라가고, 줄은 끝에서 물까지
      for (let i = 0; i < 12; i++) add('planks', 3 + i * 0.32, 1.7 + i * 0.34, -2.4 + i * 0.1, 0.34, 0.2, 0.2)
      add('wool_white', 6.85, 3.2, -1.3, 0.05, 5.2, 0.05)
      add('wool_red', 6.85, 0.75, -1.3, 0.3, 0.3, 0.3)
      add('wool_white', 6.85, 0.5, -1.3, 0.3, 0.2, 0.3)
      // 수련잎, 통
      for (let i = 0; i < 9; i++) add('leaves', -2 + r() * 22, 0.5, 2 - r() * 20, 0.9, 0.06, 0.9)
      add('planks', 0, 2, -5); add('planks', -1, 2, -5, 0.8, 0.8, 0.8)
      hero('grass', -11, 6.5, 1, 3)
    },
  },
  // 부유섬: 섬, 진행
  island: {
    sky: '#21344c', fog: [22, 70], cam: [0, 6.5, 23], look: [0, -0.5, 0],
    build(add, hero) {
      const r = rng(44)
      const isle = (cx: number, cy: number, cz: number, rad: number) => {
        for (let x = -rad; x <= rad; x++)
          for (let z = -rad; z <= rad; z++) {
            const d = Math.hypot(x, z) + r() * 0.8
            if (d > rad) continue
            const depth = Math.max(1, Math.round((rad - d) * 1.15 + r()))
            add('grass', cx + x, cy, cz + z)
            for (let y = 1; y <= depth; y++) add(y <= 2 ? 'dirt' : r() < 0.08 ? 'iron_ore' : 'stone', cx + x, cy - y, cz + z)
          }
      }
      isle(0, 0, 0, 9)
      isle(-17, 3, -9, 4)
      isle(16, -3, -6, 3)
      isle(11, 6, -18, 3)
      tree(add, -4, 1, -3, 'leaves', 5)
      tree(add, -17, 4, -9, 'cherry', 3)
      // 조약돌 생성기
      for (const [x, z] of [[3, 2], [4, 2], [5, 2], [3, 3], [5, 3], [3, 4], [4, 4], [5, 4]] as const) add('cobble', x, 1, z)
      add('lava', 4, 0.9, 3, 1, 0.8, 1)
      add('cobble', 4, 1, 1)
      // 밭
      for (let x = -3; x <= 1; x++) for (let z = 3; z <= 5; z++) { add('dirt', x, 0.05, z); if ((x + z) % 2) add('leaves', x, 0.75, z, 0.5, 0.6, 0.5) }
      add('planks', 5, 1, -3); add('planks', 6, 1, -3)
      // 구름
      for (let i = 0; i < 6; i++) add('wool_white', -30 + r() * 60, -8 + r() * 22, -30 - r() * 14, 5 + r() * 5, 1, 3 + r() * 2)
      hero('grass', -12, -4, 6, 2.6)
    },
  },
  // 던전 입구: 도전, 몬스터, 마법
  dungeon: {
    sky: '#1a1422', fog: [14, 52], cam: [0, 5.5, 17], look: [0, 5, -12],
    build(add, hero) {
      const r = rng(55)
      for (let x = -20; x <= 20; x++)
        for (let z = -14; z <= 10; z++) {
          const lavaCh = Math.abs(x) >= 13 && Math.abs(x) <= 14 && z > -12
          add(lavaCh ? 'lava' : r() < 0.15 ? 'cobble' : r() < 0.1 ? 'netherrack' : 'deepslate', x, lavaCh ? -0.2 : 0, z)
        }
      // 정면 벽과 아치문
      for (let x = -16; x <= 16; x++)
        for (let y = 1; y <= 16; y++) {
          const ax = Math.abs(x)
          const open = (ax <= 3 && y <= 7) || (ax <= 2 && y === 8) || (ax <= 1 && y === 9)
          if (open) continue
          const frame = (ax === 4 && y <= 8) || (ax <= 4 && y >= 8 && y <= 10 && !open)
          add(frame ? 'stone_bricks' : r() < 0.06 ? 'cobble' : 'deep_bricks', x, y, -13)
        }
      for (let x = -3; x <= 3; x++) for (let y = 1; y <= 8; y++) add('obsidian', x, y, -16)
      // 기둥과 횃불
      for (const px of [-10, -6, 6, 10]) {
        for (let y = 1; y <= 9; y++) add('stone_bricks', px, y, -11)
        add('deep_bricks', px, 10, -11, 1.4, 0.6, 1.4)
        add('glow', px, 6, -10.3, 0.5, 0.7, 0.5)
        add('glow', px, 11, -11, 0.8, 0.8, 0.8)
      }
      // 내려가는 계단
      for (let i = 0; i < 4; i++) for (let x = -3; x <= 3; x++) add('stone_bricks', x, 0.25 * (i + 1) - 0.4, -9 + i * 1, 1, 0.5, 1)
      for (let i = 0; i < 14; i++) add('netherrack', -19 + r() * 38, 0.6, -10 + r() * 16, 0.6 + r(), 0.5 + r() * 0.8, 0.6 + r())
      hero('deepslate', -9, 2.6, 3, 3)
      hero('deepslate', 9.5, 2.2, 4.5, 2.2)
    },
  },
}

// 블록 종류 -> 면별 텍스처 [옆, 위, 아래]
const FACES: Record<string, [string, string, string]> = { grass: ['grass_side', 'grass_top', 'dirt'] }
const GLOWING = new Set(['glow', 'lava', 'water'])

export function createEngine(canvas: HTMLCanvasElement, opts: { animate: boolean }) {
  const renderer = new WebGLRenderer({ canvas, antialias: false, powerPreference: 'low-power', alpha: false })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.25))
  const camera = new PerspectiveCamera(52, 1, 0.1, 120)
  const scene = new Scene()
  scene.fog = new Fog('#000', 10, 50)
  scene.add(new AmbientLight('#cfd8ff', 1.5))
  const sun = new DirectionalLight('#fff1d6', 2.1)
  sun.position.set(-0.6, 1, 0.8)
  scene.add(sun)

  const loader = new TextureLoader()
  const texCache = new Map<string, Texture>()
  let pending = 0
  const tex = (name: string, repeat?: [number, number]) => {
    const key = name + (repeat ? repeat.join('x') : '')
    let t = texCache.get(key)
    if (!t) {
      pending++
      t = loader.load(TEXTURES[name] ?? TEXTURES.stone, () => { pending--; dirty = true })
      t.magFilter = NearestFilter
      t.colorSpace = SRGBColorSpace
      if (repeat) { t.wrapS = t.wrapT = RepeatWrapping; t.repeat.set(...repeat) }
      texCache.set(key, t)
    }
    return t
  }
  const matCache = new Map<string, Material | Material[]>()
  const matOf = (type: string) => {
    let m = matCache.get(type)
    if (!m) {
      const one = (n: string) => (GLOWING.has(n) ? new MeshBasicMaterial({ map: tex(n) }) : new MeshLambertMaterial({ map: tex(n) }))
      const f = FACES[type]
      // BoxGeometry 면 순서: +x, -x, +y, -y, +z, -z
      m = f ? [one(f[0]), one(f[0]), one(f[1]), one(f[2]), one(f[0]), one(f[0])] : one(type)
      matCache.set(type, m)
    }
    return m
  }

  const box = new BoxGeometry(1, 1, 1)
  const groups = new Map<SceneKey, Group>()
  const waters: Texture[] = []
  const spinners: Group[] = []
  const m4 = new Matrix4()

  function build(key: SceneKey): Group {
    const def = DEFS[key]
    const g = new Group()
    const buckets = new Map<string, number[]>()
    const add: Add = (type, x, y, z, sx = 1, sy = 1, sz = 1) => {
      let b = buckets.get(type)
      if (!b) buckets.set(type, (b = []))
      b.push(x, y, z, sx, sy, sz)
    }
    // 가까운 블록: 텍스처 칸마다 높이를 달리해 실제로 튀어나오게 쌓는다
    const hero: Parameters<Def['build']>[1] = (name, x, y, z, size) => {
      const faces = name === 'grass' ? ['grass_side', 'grass_top', 'dirt'] : [name, name, name]
      const r = rng(Math.round(x * 31 + z * 17 + size * 7))
      const u = size / 16
      const hg = new Group()
      hg.position.set(x, y, z)
      const count = 6 * 256
      const mesh = new InstancedMesh(box, new MeshLambertMaterial(), count)
      const col = new Color()
      let i = 0
      // 면: [법선축, 방향, 텍스처]
      const sides: [number, number, string][] = [[0, 1, faces[0]], [0, -1, faces[0]], [1, 1, faces[1]], [1, -1, faces[2]], [2, 1, faces[0]], [2, -1, faces[0]]]
      for (const [axis, dir, t] of sides) {
        const raw = RAW[t] ?? RAW.stone
        for (let a = 0; a < 16; a++)
          for (let b = 0; b < 16; b++) {
            const c = raw[axis === 1 ? a : 15 - b]?.[axis === 1 ? b : a] ?? 0x808080
            const lum = ((c >> 16) & 255) * 0.3 + ((c >> 8) & 255) * 0.59 + (c & 255) * 0.11
            // 밝은 칸일수록 더 튀어나온다
            const out = Math.max(0, Math.round((lum / 255) * 2.4 + r() * 1.6 - 1)) * 0.6
            const depth = 2 + out
            const p = [0, 0, 0], sc = [u, u, u]
            const o = [(a - 7.5) * u, (b - 7.5) * u]
            const [i1, i2] = axis === 0 ? [2, 1] : axis === 1 ? [0, 2] : [0, 1]
            p[i1] = o[0]; p[i2] = o[1]
            p[axis] = dir * (size / 2 - u + (depth * u) / 2 - u * 0.5)
            sc[axis] = depth * u
            m4.makeScale(sc[0], sc[1], sc[2]).setPosition(p[0], p[1], p[2])
            mesh.setMatrixAt(i, m4)
            mesh.setColorAt(i, col.setHex(c, SRGBColorSpace))
            i++
          }
      }
      hg.add(mesh)
      hg.userData.baseY = y
      hg.userData.phase = x
      spinners.push(hg)
      g.add(hg)
    }
    def.build(add, hero)
    for (const [type, arr] of buckets) {
      const n = arr.length / 6
      const mesh = new InstancedMesh(box, matOf(type), n)
      for (let i = 0; i < n; i++) {
        const o = i * 6
        m4.makeScale(arr[o + 3], arr[o + 4], arr[o + 5]).setPosition(arr[o], arr[o + 1], arr[o + 2])
        mesh.setMatrixAt(i, m4)
      }
      mesh.frustumCulled = false
      g.add(mesh)
    }
    if (def.water) {
      const [w, d] = def.water.size
      const t = tex('water', [w / 2, d / 2])
      waters.push(t)
      const mesh = new InstancedMesh(box, new MeshBasicMaterial({ map: t, transparent: true, opacity: 0.86 }), 1)
      m4.makeScale(w, 0.1, d).setPosition(def.water.at[0], def.water.y, def.water.at[1])
      mesh.setMatrixAt(0, m4)
      g.add(mesh)
    }
    scene.add(g)
    return g
  }

  let current: SceneKey | null = null
  let dirty = true
  const camPos = new Vector3(), camLook = new Vector3()
  const pointer = { x: 0, y: 0, tx: 0, ty: 0 }
  let arrive = 1 // 0 -> 1: 도착하며 살짝 다가간다

  function setScene(key: SceneKey) {
    if (key === current) return
    if (current) groups.get(current)!.visible = false
    let g = groups.get(key)
    if (!g) groups.set(key, (g = build(key)))
    g.visible = true
    current = key
    const def = DEFS[key]
    const fog = scene.fog as Fog
    fog.color.set(def.sky)
    fog.near = def.fog[0]
    fog.far = def.fog[1]
    renderer.setClearColor(def.sky)
    camPos.set(...def.cam)
    camLook.set(...def.look)
    arrive = opts.animate ? 0 : 1
    dirty = true
  }

  function resize() {
    const w = window.innerWidth, h = window.innerHeight
    renderer.setSize(w, h, false)
    camera.aspect = w / h
    // 세로 화면에서는 시야를 넓혀 씬이 잘리지 않게 한다
    camera.fov = w < h ? 68 : 52
    camera.updateProjectionMatrix()
    dirty = true
  }

  const look = new Vector3()
  function frame(t: number) {
    if (!current) return
    const s = t / 1000
    arrive = Math.min(1, arrive + 0.03)
    const ease = 1 - Math.pow(1 - arrive, 3)
    pointer.x += (pointer.tx - pointer.x) * 0.05
    pointer.y += (pointer.ty - pointer.y) * 0.05
    camera.position.set(
      camPos.x + pointer.x * 1.2 + Math.sin(s * 0.21) * 0.4,
      camPos.y - pointer.y * 0.6 + Math.sin(s * 0.33) * 0.15,
      camPos.z + (1 - ease) * 5,
    )
    look.copy(camLook)
    look.x += pointer.x * 0.4
    camera.lookAt(look)
    for (const w of waters) w.offset.set(s * 0.05, s * 0.025)
    for (const g of spinners) {
      g.rotation.y = s * 0.12 + g.userData.phase
      g.rotation.x = 0.18
      g.position.y = g.userData.baseY + Math.sin(s * 0.6 + g.userData.phase) * 0.25
    }
    renderer.render(scene, camera)
  }

  let raf = 0, tick = 0, stopped = false
  function loop(t: number) {
    if (stopped) return
    raf = requestAnimationFrame(loop)
    if (document.hidden) return
    if (opts.animate) {
      // 30fps로 제한
      if (tick++ % 2 === 0) frame(t)
    } else if (dirty || pending > 0) {
      // 정지 모드: 바뀐 때만 한 장 그린다
      dirty = false
      arrive = 1
      frame(4000)
    }
  }
  const onMove = (e: PointerEvent) => {
    pointer.tx = (e.clientX / window.innerWidth) * 2 - 1
    pointer.ty = (e.clientY / window.innerHeight) * 2 - 1
  }
  window.addEventListener('resize', resize)
  if (opts.animate) window.addEventListener('pointermove', onMove, { passive: true })
  resize()
  raf = requestAnimationFrame(loop)

  return {
    setScene,
    dispose() {
      stopped = true
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      window.removeEventListener('pointermove', onMove)
      renderer.dispose()
    },
  }
}
