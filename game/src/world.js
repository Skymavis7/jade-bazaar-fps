// Jade Bazaar: an original night-market map, 48 x 36 m, built from boxes. Every box is a
// collider and a surface a bullet stops on. Two plant sites (A Lantern Court west, B Spice
// Row east), three lanes (A-long west, Canal Walk mid, B-short east), and a waypoint graph
// the bots walk. Textures are painted on canvases at runtime — no image files, no ripped art.
import * as THREE from 'three';
import { PALETTE } from './palette.js';

function canvasTexture(size, paint, repeatX = 1, repeatY = 1) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  paint(canvas.getContext('2d'), size);
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(repeatX, repeatY);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

function speckle(ctx, size, base, spots, alpha) {
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < spots; i += 1) {
    const v = Math.random();
    ctx.fillStyle = `rgba(${v > 0.5 ? '255,255,255' : '0,0,0'},${alpha * Math.random()})`;
    ctx.fillRect(Math.random() * size, Math.random() * size, 1 + Math.random() * 3, 1 + Math.random() * 3);
  }
}

function stripeTexture(colourA, colourB) {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  for (let x = 0; x < 256; x += 32) {
    ctx.fillStyle = (x / 32) % 2 === 0 ? colourA : colourB;
    ctx.fillRect(x, 0, 32, 256);
  }
  speckle(ctx, 256, 'rgba(0,0,0,0)', 220, 0.1);
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function letterTexture(letter, colour) {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, 256, 256);
  ctx.strokeStyle = colour;
  ctx.lineWidth = 10;
  ctx.strokeRect(14, 14, 228, 228);
  ctx.fillStyle = colour;
  ctx.font = 'bold 150px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(letter, 128, 138);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createWorld(scene) {
  const group = new THREE.Group();
  scene.add(group);

  const groundTex = canvasTexture(256, (ctx, s) => speckle(ctx, s, '#20242e', 2600, 0.18), 12, 9);
  const plasterTex = canvasTexture(256, (ctx, s) => speckle(ctx, s, '#2b3040', 1800, 0.12), 2, 1);
  const timberTex = canvasTexture(256, (ctx, s) => {
    ctx.fillStyle = '#4a3626';
    ctx.fillRect(0, 0, s, s);
    for (let y = 0; y < s; y += 32) {
      ctx.fillStyle = y % 64 === 0 ? 'rgba(0,0,0,0.28)' : 'rgba(255,255,255,0.05)';
      ctx.fillRect(0, y, s, 4);
    }
    speckle(ctx, s, 'rgba(0,0,0,0)', 300, 0.2);
  }, 2, 1);
  const redAwningTex = stripeTexture('#c23b2e', '#e8dcc8');
  const tealAwningTex = stripeTexture('#2e7f74', '#e8dcc8');
  const goldAwningTex = stripeTexture('#b98a2f', '#3a2c1c');
  const mosaicTex = canvasTexture(256, (ctx, s) => {
    ctx.fillStyle = '#1d3a3a';
    ctx.fillRect(0, 0, s, s);
    for (let i = 0; i < 12; i += 1) {
      ctx.strokeStyle = i % 2 ? '#3ddc97' : '#ffb84d';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(s / 2, s / 2, 12 + i * 9, 0, Math.PI * 2);
      ctx.stroke();
    }
  });

  function mat(map, rough = 0.9, metal = 0.05, extra = {}) {
    return new THREE.MeshStandardMaterial({ map, roughness: rough, metalness: metal, ...extra });
  }
  const groundMat = mat(groundTex, 0.95, 0.02);
  const wallMat = mat(plasterTex, 0.92, 0.02);
  const timberMat = mat(timberTex, 0.85, 0.05);
  const redAwningMat = mat(redAwningTex, 0.85, 0);
  const tealAwningMat = mat(tealAwningTex, 0.85, 0);
  const goldAwningMat = mat(goldAwningTex, 0.85, 0);
  const crateMat = mat(plasterTex, 0.9, 0.05, { color: new THREE.Color('#8a6a45') });
  const jadeMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(PALETTE.teamB), roughness: 0.4, metalness: 0.15 });
  const darkMat = new THREE.MeshStandardMaterial({ color: new THREE.Color('#14161a'), roughness: 0.85 });

  const colliders = [];
  const shootables = [];

  function box(w, h, d, x, y, z, material, collide = true) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    if (collide) {
      colliders.push(new THREE.Box3().setFromObject(mesh));
      shootables.push(mesh);
    }
    return mesh;
  }

  // Ground and outer walls (48 x 36 m, 4.2 m walls).
  const floor = new THREE.Mesh(new THREE.BoxGeometry(48.4, 0.4, 36.4), groundMat);
  floor.position.set(0, -0.2, 0);
  floor.receiveShadow = true;
  group.add(floor);
  shootables.push(floor);
  box(0.4, 4.2, 36.4, -24.2, 2.1, 0, wallMat);
  box(0.4, 4.2, 36.4, 24.2, 2.1, 0, wallMat);
  box(48.4, 4.2, 0.4, 0, 2.1, -18.2, wallMat);
  box(48.4, 4.2, 0.4, 0, 2.1, 18.2, wallMat);

  // South wall teeth: two plaster stubs that break the south sightline.
  box(4, 4.2, 0.4, -12, 2.1, 14.5, wallMat);
  box(4, 4.2, 0.4, 12, 2.1, 14.5, wallMat);

  // Tea house, north-east: timber hall with a sloped tile roof and paper windows.
  box(8, 4.5, 4, 10, 2.25, -15.5, timberMat);
  const roofL = box(4.6, 0.25, 4.6, 7.9, 5.1, -15.5, redAwningMat);
  roofL.rotation.z = 0.5;
  const roofR = box(4.6, 0.25, 4.6, 12.1, 5.1, -15.5, redAwningMat);
  roofR.rotation.z = -0.5;
  box(4.6, 0.3, 4.4, 10, 4.6, -15.5, timberMat);
  const windowMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(PALETTE.lamp), emissive: new THREE.Color(PALETTE.lamp), emissiveIntensity: 1.4 });
  for (const wx of [7.5, 10, 12.5]) {
    const win = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 1.8), windowMat);
    win.position.set(wx, 2.2, -13.45);
    group.add(win);
  }

  // Market stalls: counter, four posts, striped awning. Counters are cover; awnings
  // sit above head height, so bodies pass under them while bullets stop on them.
  function stall(x, z, awningMat) {
    box(2.2, 1.1, 1.4, x, 0.55, z, timberMat);
    box(0.12, 1.4, 0.12, x - 0.95, 1.8, z - 0.55, darkMat, false);
    box(0.12, 1.4, 0.12, x + 0.95, 1.8, z - 0.55, darkMat, false);
    box(0.12, 1.4, 0.12, x - 0.95, 1.8, z + 0.55, darkMat, false);
    box(0.12, 1.4, 0.12, x + 0.95, 1.8, z + 0.55, darkMat, false);
    const awning = box(2.7, 0.08, 1.9, x, 2.55, z, awningMat);
    awning.rotation.x = 0.28;
    // Produce crates on the counter.
    box(0.5, 0.4, 0.5, x - 0.5, 1.3, z, crateMat);
    box(0.45, 0.35, 0.45, x + 0.45, 1.28, z + 0.2, jadeMat);
  }
  stall(-13, 6, redAwningMat);
  stall(-13, 0, tealAwningMat);
  stall(-13, -9, goldAwningMat);
  stall(-21, 8, tealAwningMat);
  stall(-21, 2, redAwningMat);
  stall(13, 6, goldAwningMat);
  stall(13, 0, redAwningMat);
  stall(13, -9, tealAwningMat);
  stall(21, 8, redAwningMat);
  stall(21, 2, goldAwningMat);
  stall(-7, -1, redAwningMat);
  stall(7, -1, tealAwningMat);
  stall(-7, 8, goldAwningMat);
  stall(7, 8, redAwningMat);

  // Produce crates (crouch cover) and barrels.
  const crates = [
    [-16, 4], [-22, -4], [16, 4], [22, -4], [-16, -7], [16, -7],
    [-9, 12], [9, 12], [-11, -12], [11, -12], [5, 12], [-5, -13], [5, -13],
  ];
  for (const [x, z] of crates) box(1.2, 1.1, 1.2, x, 0.55, z, crateMat);
  for (const [x, z] of [[-10, 2], [-8.5, 2.6], [10, 2], [8.5, 2.6], [-19, 12], [19, 12]]) {
    box(0.8, 1.0, 0.8, x, 0.5, z, timberMat);
  }

  // Central fountain: a flat mosaic disc and water ring, no collider — the mid lane stays open.
  const fountain = new THREE.Mesh(
    new THREE.CircleGeometry(2.1, 28),
    new THREE.MeshBasicMaterial({ map: mosaicTex, transparent: false }),
  );
  fountain.rotation.x = -Math.PI / 2;
  fountain.position.set(0, 0.02, 0);
  group.add(fountain);
  const water = new THREE.Mesh(
    new THREE.CircleGeometry(1.5, 24),
    new THREE.MeshStandardMaterial({ color: new THREE.Color('#2e6f8a'), roughness: 0.15, metalness: 0.4 }),
  );
  water.rotation.x = -Math.PI / 2;
  water.position.set(0, 0.03, 0);
  group.add(water);

  // Site markers: glowing floor decal + light beam at each site centre.
  const sites = {
    A: { center: new THREE.Vector3(-18, 0, -10), radius: 4.5 },
    B: { center: new THREE.Vector3(18, 0, -10), radius: 4.5 },
  };
  for (const [name, site] of Object.entries(sites)) {
    const decal = new THREE.Mesh(
      new THREE.PlaneGeometry(7, 7),
      new THREE.MeshBasicMaterial({ map: letterTexture(name, name === 'A' ? PALETTE.accent : PALETTE.teamB), transparent: true, opacity: 0.85, depthWrite: false }),
    );
    decal.rotation.x = -Math.PI / 2;
    decal.position.set(site.center.x, 0.02, site.center.z);
    group.add(decal);
    const beam = new THREE.Mesh(
      new THREE.CylinderGeometry(0.35, 0.55, 9, 12, 1, true),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(name === 'A' ? PALETTE.accent : PALETTE.teamB), transparent: true, opacity: 0.1, side: THREE.DoubleSide, depthWrite: false }),
    );
    beam.position.set(site.center.x, 4.5, site.center.z);
    group.add(beam);
  }

  // Paper lanterns on posts: warm pools of light, emissive heads. Posts do not collide.
  const lanternMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(PALETTE.lamp), emissive: new THREE.Color(PALETTE.lamp), emissiveIntensity: 2.4 });
  const lanternGlass = new THREE.MeshStandardMaterial({ color: new THREE.Color('#ff5a3c'), emissive: new THREE.Color('#ff5a3c'), emissiveIntensity: 1.6 });
  for (const [x, z] of [[-13, 13], [13, 13], [-13, -13], [13, -13], [0, 16], [-8, 2], [8, 2], [-8, -8], [8, -8]]) {
    box(0.15, 3.6, 0.15, x, 1.8, z, darkMat, false);
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.42, 12, 10), x % 2 === 0 ? lanternMat : lanternGlass);
    lamp.position.set(x, 3.5, z);
    group.add(lamp);
    const light = new THREE.PointLight(new THREE.Color(PALETTE.lamp), 12, 14, 1.6);
    light.position.set(x, 3.2, z);
    scene.add(light);
  }
  // Strings of small lanterns across the plaza, high above the lanes.
  for (const [x0, z0, x1, z1] of [[-13, 13, 13, 13], [-13, -13, 13, -13], [-8, 2, 8, 2]]) {
    for (let i = 1; i <= 5; i += 1) {
      const t = i / 6;
      const sx = x0 + (x1 - x0) * t;
      const sz = z0 + (z1 - z0) * t;
      const small = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 6), i % 2 ? lanternMat : lanternGlass);
      small.position.set(sx, 4.4 - Math.sin(t * Math.PI) * 0.5, sz);
      group.add(small);
    }
  }

  // Distant rooftops outside the walls: depth without gameplay cost.
  const silhouetteMat = new THREE.MeshBasicMaterial({ color: new THREE.Color('#070a12') });
  for (const [x, z, w, h, d] of [[-36, -12, 10, 12, 4], [36, -8, 8, 10, 4], [-18, -30, 20, 8, 6], [22, -28, 14, 16, 5], [0, 30, 26, 7, 6]]) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), silhouetteMat);
    mesh.position.set(x, h / 2 - 0.2, z);
    group.add(mesh);
  }
  // The moon: a pale disc high over the east wall.
  const moon = new THREE.Mesh(
    new THREE.CircleGeometry(4, 24),
    new THREE.MeshBasicMaterial({ color: new THREE.Color('#e8eef7'), fog: false }),
  );
  moon.position.set(52, 22, -34);
  moon.lookAt(0, 4, 0);
  group.add(moon);

  // Light: cool moonlight from the east, warm lantern glow, indigo hemisphere.
  const sky = new THREE.HemisphereLight(new THREE.Color('#2a3550'), new THREE.Color('#14161a'), 0.9);
  scene.add(sky);
  const key = new THREE.DirectionalLight(new THREE.Color('#9db8e8'), 1.9);
  key.position.set(28, 20, -10);
  key.target.position.set(-6, 0, 2);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.left = -28;
  key.shadow.camera.right = 28;
  key.shadow.camera.top = 22;
  key.shadow.camera.bottom = -22;
  key.shadow.camera.far = 90;
  key.shadow.bias = -0.0006;
  scene.add(key, key.target);
  const fill = new THREE.DirectionalLight(new THREE.Color('#ffb84d'), 0.45);
  fill.position.set(-16, 10, 16);
  scene.add(fill);

  // Waypoint graph: nodes the bots walk, links they may take. BFS in pathBetween().
  const nodes = [
    { id: 'as0', x: -4, z: 14 }, { id: 'as1', x: 0, z: 14 }, { id: 'as2', x: 4, z: 14 },
    { id: 'al1', x: -13, z: 11 }, { id: 'al2', x: -19, z: 5 }, { id: 'al3', x: -19, z: -2 }, { id: 'al4', x: -18, z: -6 },
    { id: 'm1', x: 0, z: 9 }, { id: 'm2', x: 0, z: 3 }, { id: 'm3', x: 0, z: -3 }, { id: 'm4', x: 0, z: -9 },
    { id: 'bs1', x: 13, z: 11 }, { id: 'bs2', x: 19, z: 5 }, { id: 'bs3', x: 19, z: -2 }, { id: 'bs4', x: 18, z: -6 },
    { id: 'a1', x: -18, z: -10 }, { id: 'a2', x: -14, z: -12 }, { id: 'a3', x: -21, z: -12 },
    { id: 'b1', x: 18, z: -10 }, { id: 'b2', x: 14, z: -12 }, { id: 'b3', x: 21, z: -12 },
    { id: 'ds0', x: -4, z: -15 }, { id: 'ds1', x: 0, z: -15 }, { id: 'ds2', x: 4, z: -15 },
    { id: 'hA', x: -16, z: -5 }, { id: 'hB', x: 16, z: -5 }, { id: 'hM', x: 0, z: -12 }, { id: 'hA2', x: -11, z: -8 }, { id: 'hB2', x: 11, z: -8 },
  ];
  const links = {
    as0: ['as1', 'al1', 'm1'], as1: ['as0', 'as2', 'm1'], as2: ['as1', 'bs1', 'm1'],
    al1: ['as0', 'al2'], al2: ['al1', 'al3', 'm2'], al3: ['al2', 'al4', 'hA'], al4: ['al3', 'a1'],
    m1: ['as1', 'm2'], m2: ['m1', 'm3', 'al2', 'bs2'], m3: ['m2', 'm4', 'hM'], m4: ['m3', 'hA2', 'hB2'],
    bs1: ['as2', 'bs2'], bs2: ['bs1', 'bs3', 'm2'], bs3: ['bs2', 'bs4', 'hB'], bs4: ['bs3', 'b1'],
    a1: ['al4', 'a2', 'a3'], a2: ['a1', 'hA2'], a3: ['a1', 'hA'],
    b1: ['bs4', 'b2', 'b3'], b2: ['b1', 'hB2'], b3: ['b1', 'hB'],
    ds0: ['ds1', 'hA', 'hM'], ds1: ['ds0', 'ds2', 'hM'], ds2: ['ds1', 'hB', 'hM'],
    hA: ['ds0', 'al3', 'a3', 'hA2'], hB: ['ds2', 'bs3', 'b3', 'hB2'], hM: ['ds1', 'm3', 'hA2', 'hB2'],
    hA2: ['hA', 'a2', 'm4', 'hM'], hB2: ['hB', 'b2', 'm4', 'hM'],
  };
  const nodeById = new Map(nodes.map((n) => [n.id, n]));

  function pathBetween(fromId, toId) {
    if (fromId === toId) return [nodeById.get(toId)];
    const prev = new Map([[fromId, null]]);
    const queue = [fromId];
    while (queue.length) {
      const current = queue.shift();
      for (const next of links[current] || []) {
        if (prev.has(next)) continue;
        prev.set(next, current);
        if (next === toId) {
          const path = [];
          let at = toId;
          while (at) {
            path.unshift(nodeById.get(at));
            at = prev.get(at);
          }
          return path;
        }
        queue.push(next);
      }
    }
    return [nodeById.get(toId)];
  }

  function nearestNode(x, z) {
    let best = nodes[0];
    let bestD = Infinity;
    for (const node of nodes) {
      const d = (node.x - x) ** 2 + (node.z - z) ** 2;
      if (d < bestD) {
        bestD = d;
        best = node;
      }
    }
    return best;
  }

  return {
    colliders,
    shootables,
    sites,
    spawns: {
      attack: [
        { x: -4, z: 14.5, yaw: 0 }, { x: -1.5, z: 15.5, yaw: 0 }, { x: 1.5, z: 15.5, yaw: 0 },
        { x: 4, z: 14.5, yaw: 0 }, { x: 0, z: 16.5, yaw: 0 },
      ],
      defend: [
        { x: -4, z: -14.5, yaw: Math.PI }, { x: -1.5, z: -15.5, yaw: Math.PI }, { x: 1.5, z: -15.5, yaw: Math.PI },
        { x: 4, z: -14.5, yaw: Math.PI }, { x: 0, z: -16.5, yaw: Math.PI },
      ],
    },
    waypoints: { nodes, nodeById, pathBetween, nearestNode },
    bounds: { minX: -24, maxX: 24, minZ: -18, maxZ: 18 },
    group,
  };
}
