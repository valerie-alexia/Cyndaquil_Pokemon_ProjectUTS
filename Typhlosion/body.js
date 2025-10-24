// body.js — Generator - warna - Helper - 

/* ===================== QUADRIC GENERATORS ===================== */

function generateCape({ //jubah/cloak nya
  wTop = 1.2, wBottom = 2.0, len = 4.0,
  thickness = 0.06, stacks = 36, steps = 24,
  curveDown = 1.2, flare = 0.3,
  teeth = 9, toothDepth = 0.35,
  colorFn = (x,y,z)=>({ r:0.12,g:0.20,b:0.36 })}) 
{
  const vertices = [];
  const faces = [];

  function bottomZigZag(vIndex, vCount) {
    const period = vCount / teeth;
    const pos = vIndex / period;
    const triPhase = pos - Math.floor(pos);
    const tri = triPhase < 0.5 ? (triPhase*2) : (2 - triPhase*2);
    return tri * toothDepth;
  }

  const halfT = thickness * 0.5;
  for (let side=0; side<2; side++){
    const offsetZ = side===0 ? -halfT : +halfT;
    for (let i=0; i<=stacks; i++){
      const t = i / stacks;
      const width = (1-t)*wTop + t*wBottom;
      const back = -t * len;           // menuju dorsal (−Z)
      const drop = -(t*t) * curveDown; // turun ke −Y
      const spread = flare * t;

      for (let j=0; j<=steps; j++){
        const s = (j/steps)*2 - 1;     // -1..1 (kiri..kanan)
        const x = s * width * (1 + spread * Math.abs(s));
        let y = drop;
        let z = back + offsetZ;

        if (i === stacks) z -= bottomZigZag(j, steps);
        const c = colorFn(x,y,z);
        vertices.push(x,y,z, c.r,c.g,c.b);
      }
    }
  }

  const row = steps+1;
  const sideVerts = (stacks+1)*(steps+1);

  for (let side=0; side<2; side++){
    const base = side*sideVerts;
    for (let i=0; i<stacks; i++){
      for (let j=0; j<steps; j++){
        const a = base + i*row + j, b = a+1, c = a+row, d = c+1;
        if (side===0) faces.push(a,b,d, a,d,c);
        else          faces.push(a,d,b, a,c,d);
      }
    }
  }
  // end caps pangkal & ujung
  for (let j=0; j<steps; j++){
    const a = 0*row + j,     b = a+1;
    const c = sideVerts+a,   d = sideVerts+b;
    faces.push(a,c,b, b,c,d);
  }
  for (let j=0; j<steps; j++){
    const a = stacks*row + j, b = a+1;
    const c = sideVerts+a,    d = sideVerts+b;
    faces.push(a,b,c, b,d,c);
  }

  return { vertices, faces, meta:{ stacks, steps } };
}

function stickCapeBase(cape, {
  rowsLock = 3,     // berapa banyak baris pangkal yang dikunci ke punggung
  backInset = 0.22, // seberapa “masuk” ke −Z (biar nempel)
  lift = 0.06,      // sedikit angkat +Y di pangkal
  rollX = -0.18     // rotasi seluruh cape sekitar sumbu X (negatif = nunduk)
}){
  const { stacks, steps } = cape.meta;
  const row = steps + 1;
  const sideVerts = (stacks+1) * row;

  // Kunci pangkal kedua sisi
  for (let side=0; side<2; side++){
    const base = side*sideVerts;
    for (let i=0; i<rowsLock; i++){
      for (let j=0; j<=steps; j++){
        const idx = (base + i*row + j) * 6;
        // x tetap, y & z kita paksa ke nilai pangkal yang nempel
        cape.vertices[idx+1] += lift * (1 - i/rowsLock); // lebih dekat pangkal → lebih terangkat
        cape.vertices[idx+2] = -backInset + (side===0 ? -0.5 : +0.5)*1e-3; // kecilkan offsetZ agar dua sisi tak z-fight
      }
    }
  }

  // Rotasi global cape sekitar sumbu X agar melandai di punggung (apply ke SEMUA vertex)
  const cx = Math.cos(rollX), sx = Math.sin(rollX);
  for (let k=0; k<cape.vertices.length; k+=6){
    const y = cape.vertices[k+1], z = cape.vertices[k+2];
    cape.vertices[k+1] =  y*cx - z*sx;
    cape.vertices[k+2] =  y*sx + z*cx;
  }
}

function generateEllipsoid(a, b, c, stacks, steps, colorFn) { 
    const vertices = [];
    const faces = [];
    for (let i = 0; i <= stacks; i++) {
        // u ∈ [-π/2, π/2] (latitude)
        const u = (i / stacks) * Math.PI - Math.PI / 2;
        const cu = Math.cos(u), su = Math.sin(u);
        for (let j = 0; j <= steps; j++) {
            // v ∈ [-π, π] (longitude)
            const v = (j / steps) * 2 * Math.PI - Math.PI;
            const cv = Math.cos(v), sv = Math.sin(v);

            const x = a * cv * cu;
            const y = b * su;
            const z = c * sv * cu;

            const col = colorFn ? colorFn(x, y, z) : { r: 1, g: 1, b: 1 };
            vertices.push(x, y, z, col.r, col.g, col.b);
        }
    }
    for (let i = 0; i < stacks; i++) {
        for (let j = 0; j < steps; j++) {
            const first = i * (steps + 1) + j;
            const second = first + 1;
            const third = first + (steps + 1);
            const fourth = third + 1;
            faces.push(first, second, fourth, first, fourth, third);
        }
    }
    
    return { vertices, faces };
}

function generateEllipticCylinder(rx, rz, h, stacks, steps, colorFn, capTop = false, capBottom = false) {
    const vertices = [];
    const faces = [];

    // side
    for (let i = 0; i <= stacks; i++) {
        const u = i / stacks;
        const y = (u - 0.5) * h; // center at 0
        for (let j = 0; j <= steps; j++) {
            const v = (j / steps) * 2 * Math.PI - Math.PI;
            const cv = Math.cos(v), sv = Math.sin(v);
            const x = rx * cv;
            const z = rz * sv;
            const col = colorFn ? colorFn(x, y, z) : { r: 1, g: 1, b: 1 };
            vertices.push(x, y, z, col.r, col.g, col.b);
        }
    }
    for (let i = 0; i < stacks; i++) {
        for (let j = 0; j < steps; j++) {
            const first = i * (steps + 1) + j;
            const second = first + 1;
            const third = first + (steps + 1);
            const fourth = third + 1;
            faces.push(first, second, fourth, first, fourth, third);
        }
    }

    const addCap = (isTop) => {
        const baseIndex = vertices.length / 6;
        const y = (isTop ? +0.5 : -0.5) * h;
        const cCol = colorFn ? colorFn(0, y, 0) : { r: 1, g: 1, b: 1 };
        vertices.push(0, y, 0, cCol.r, cCol.g, cCol.b);
        for (let j = 0; j <= steps; j++) {
            const v = (j / steps) * 2 * Math.PI - Math.PI;
            const cv = Math.cos(v), sv = Math.sin(v);
            const x = rx * cv, z = rz * sv;
            const col = colorFn ? colorFn(x, y, z) : { r: 1, g: 1, b: 1 };
            vertices.push(x, y, z, col.r, col.g, col.b);
        }
        for (let j = 1; j <= steps; j++) {
            // fan triangles
            if (isTop) {
                faces.push(baseIndex, baseIndex + j, baseIndex + j + 1);
            } else {
                faces.push(baseIndex, baseIndex + j + 1, baseIndex + j);
            }
        }
    };
    if (capTop) addCap(true);
    if (capBottom) addCap(false);

    return { vertices, faces };
}

function generateEllipticConeFrustum(rbx, rbz, rtx, rtz, h, stacks, steps, colorFn, capBase = false, capTop = false) {
    const vertices = [];
    const faces = [];
    const R = (u) => ({
        rx: (1 - u) * rbx + u * rtx,
        rz: (1 - u) * rbz + u * rtz
    });

    // side
    for (let i = 0; i <= stacks; i++) {
        const u = i / stacks;
        const y = (u - 0.5) * h;
        const { rx, rz } = R(u);
        for (let j = 0; j <= steps; j++) {
            const v = (j / steps) * 2 * Math.PI - Math.PI;
            const cv = Math.cos(v), sv = Math.sin(v);
            const x = rx * cv;
            const z = rz * sv;
            const col = colorFn ? colorFn(x, y, z) : { r: 1, g: 1, b: 1 };
            vertices.push(x, y, z, col.r, col.g, col.b);
        }
    }
    for (let i = 0; i < stacks; i++) {
        for (let j = 0; j < steps; j++) {
            const first = i * (steps + 1) + j;
            const second = first + 1;
            const third = first + (steps + 1);
            const fourth = third + 1;
            faces.push(first, second, fourth, first, fourth, third);
        }
    }

    // optional caps (approx. discs)
    const addCap = (isTop) => {
        const baseIndex = vertices.length / 6;
        const u = isTop ? 1 : 0;
        const y = (u - 0.5) * h;
        const { rx, rz } = R(u);
        const cCol = colorFn ? colorFn(0, y, 0) : { r: 1, g: 1, b: 1 };
        vertices.push(0, y, 0, cCol.r, cCol.g, cCol.b);
        for (let j = 0; j <= steps; j++) {
            const v = (j / steps) * 2 * Math.PI - Math.PI;
            const cv = Math.cos(v), sv = Math.sin(v);
            const x = rx * cv, z = rz * sv;
            const col = colorFn ? colorFn(x, y, z) : { r: 1, g: 1, b: 1 };
            vertices.push(x, y, z, col.r, col.g, col.b);
        }
        for (let j = 1; j <= steps; j++) {
            if (isTop) faces.push(baseIndex, baseIndex + j, baseIndex + j + 1);
            else faces.push(baseIndex, baseIndex + j + 1, baseIndex + j);
        }
    };
    if (capBase) addCap(false);
    if (capTop) addCap(true);

    return { vertices, faces };
}

// radius elips torso sebagai fungsi u∈[0..1] dari bawah→atas
function torsoRadiusAt(u, torsoParams){
  // frustum elips kamu: rbx,rbz (bottom), rtx,rtz (top), height
  const { rbx, rbz, rtx, rtz } = torsoParams;
  const rx = (1-u)*rbx + u*rtx;  // sumbu-X (lebar)
  const rz = (1-u)*rbz + u*rtz;  // sumbu-Z (dalam)
  return { rx, rz };
}


// Melengkungkan cape agar memeluk torso (punggung di sekitar θ=-π/2)
function wrapCapeAroundTorso(cape, {
  stacks, steps,
  cover = 2,        // 0.5..0.8 makin melilit
  gap = 0.04,          // jarak kecil dari kulit
  widthGain = 1.0,     // multiplier lebar efektif (opsional)
  torso = { rbx:2.0, rbz:1.8, rtx:1.0, rtz:1.0, height:6.5 }
}){
  const row = steps + 1;
  const sideVerts = (stacks + 1) * row;

  // cari y-min/y-max cape untuk normalisasi tinggi (u)
  let ymin = +Infinity, ymax = -Infinity;
  for (let i = 1; i < cape.vertices.length; i += 6) {
    const y = cape.vertices[i];
    if (y < ymin) ymin = y;
    if (y > ymax) ymax = y;
  }
  const dy = Math.max(1e-6, ymax - ymin);

  for (let side = 0; side < 2; side++) {
    const base = side * sideVerts;

    // minX/maxX per-baris (agar wTop/wBottom benar-benar berpengaruh)
    const minX = new Array(stacks + 1).fill(+Infinity);
    const maxX = new Array(stacks + 1).fill(-Infinity);
    for (let i = 0; i <= stacks; i++) {
      for (let j = 0; j <= steps; j++) {
        const idx = (base + i*row + j) * 6;
        const x = cape.vertices[idx + 0];
        if (x < minX[i]) minX[i] = x;
        if (x > maxX[i]) maxX[i] = x;
      }
    }

    // bungkus tiap baris
    for (let i = 0; i <= stacks; i++) {
      const xMid  = 0.5 * (minX[i] + maxX[i]);
      const xHalf = Math.max(1e-6, 0.5 * (maxX[i] - minX[i])) * widthGain;

      const anyIdx = (base + i*row) * 6;
      const yRow   = cape.vertices[anyIdx + 1];
      const u      = Math.min(1, Math.max(0, (yRow - ymin) / dy));
      const { rx, rz } = torsoRadiusAt(u, torso);

      for (let j = 0; j <= steps; j++) {
        const idx   = (base + i*row + j) * 6;
        const xOrig = cape.vertices[idx + 0];

        const sRow  = Math.max(-1, Math.min(1, (xOrig - xMid) / xHalf));
        const theta0 = -Math.PI / 2;
        const thetaSpan = cover * widthGain * (Math.PI / 2); // ← span sudut diperbesar
        const theta  = theta0 + sRow * thetaSpan;

        const nx = Math.cos(theta), nz = Math.sin(theta);
        cape.vertices[idx + 0] = rx * nx + nx * gap;
        // y tetap
        cape.vertices[idx + 2] = rz * nz + nz * gap;
      }
    }
  }
}


/* ===================== COLORING (Typhlosion-ish) ===================== */
// Front (z >= 0): cream; Back (z < 0): dark blue; small y-based light

function bodyColorVentralDorsal(x, y, z) {
    // y bias for subtle lighting
    const yBias = Math.max(-1, Math.min(1, y)) * 0.08;

    // if (z >= 0.25) { ]
    //     // ventral cream
        let r = 0.98 + yBias * 0.4;
        let g = 0.94 + yBias * 0.5;
        let b = 0.7 + yBias * 0.5;
        return { r: Math.min(1, r), g: Math.min(1, g), b: Math.min(1, b) };
    // } else {
    //     // dorsal deep blue
    //     let r = 0.10 + yBias * 0.2;
    //     let g = 0.18 + yBias * 0.25;
    //     let b = 0.34 + yBias * 0.25;
    //     return { r: Math.max(0, r), g: Math.max(0, g), b: Math.max(0, b) };
    // }
}

/* ===================== GEOMETRY MERGE HELPER ===================== */
function appendGeometry(targetVerts, targetFaces, srcVerts, srcFaces, tx = 0, ty = 0, tz = 0, overrideColorFn = null) {
    const baseIndex = targetVerts.length / 6;
    for (let i = 0; i < srcVerts.length; i += 6) {
        const x = srcVerts[i] + tx;
        const y = srcVerts[i + 1] + ty;
        const z = srcVerts[i + 2] + tz;
        let r = srcVerts[i + 3], g = srcVerts[i + 4], b = srcVerts[i + 5];
        if (overrideColorFn) {
            const col = overrideColorFn(x, y, z);
            r = col.r; g = col.g; b = col.b;
        }
        targetVerts.push(x, y, z, r, g, b);
    }
    for (let i = 0; i < srcFaces.length; i++) {
        targetFaces.push(srcFaces[i] + baseIndex);
    }
}

function bendForwardInPlace(vertices, k) { //buat bend badan
  let ymin = Infinity, ymax = -Infinity;
  for (let i = 1; i < vertices.length; i += 6) {
    const y = vertices[i];
    if (y < ymin) ymin = y;
    if (y > ymax) ymax = y;
  }
  const dy = Math.max(1e-6, ymax - ymin);

  for (let i = 0; i < vertices.length; i += 6) {
    const x = vertices[i], y = vertices[i + 1], z = vertices[i + 2];
    const t = (y - ymin) / dy;        
    const ang = k * t;                   
    const cx = Math.cos(ang), sx = Math.sin(ang);
    const y2 =  y * cx - z * sx;
    const z2 =  y * sx + z * cx;        
    vertices[i]     = x;
    vertices[i + 1] = y2;
    vertices[i + 2] = z2;
  }
}

/* ======= FLAME ===========*/

// warna gradasi kuning -> merah (t=0 di pangkal, t=1 di ujung)
function flameColor(t) {
  // inner yellow
  const c1 = { r: 1.00, g: 0.95, b: 0.25 };
  // outer red/orange
  const c2 = { r: 0.95, g: 0.20, b: 0.05 };
  return {
    r: c1.r + (c2.r - c1.r) * t,
    g: c1.g + (c2.g - c1.g) * t,
    b: c1.b + (c2.b - c1.b) * t,
  };
}

function generateFlameFan({
  count = 22,
  innerR = 1.2,
  length = 3.6,
  baseWidth = 0.55,
  span = Math.PI * 1,
  thickness = 0.08,
  jitter = 0.18,
  tipNoise = 0.25,
}) {
  const vertices = [];
  const faces = [];

  // sudut tengah kipas 
  const theta0 = -Math.PI / 2;
  const thetaStart = theta0 - span * 0.5;
  const dθ = span / (count - 1);

  function pushTriDouble(v0, v1, v2, c) {
    const base = vertices.length / 6;
    // depan
    vertices.push(v0.x, v0.y, v0.z, c.r, c.g, c.b);
    vertices.push(v1.x, v1.y, v1.z, c.r, c.g, c.b);
    vertices.push(v2.x, v2.y, v2.z, c.r, c.g, c.b);
    faces.push(base + 0, base + 1, base + 2);
    // belakang 
    faces.push(base + 2, base + 1, base + 0);
  }

  for (let i = 0; i < count; i++) {
    const θ = thetaStart + dθ * i;

    const dir = { x: Math.cos(θ), z: Math.sin(θ) };
    const n = { x:  Math.sin(θ), z: -Math.cos(θ) }; 

    const w   = baseWidth * (1 + (Math.random() * 2 - 1) * jitter);
    const ext = length    * (1 + (Math.random() * 2 - 1) * tipNoise);

    const halfT = thickness * 0.5;

    function mkPoint(rAlong, tOff) {
      const x = (rAlong * dir.x) + (tOff * n.x);
      const z = (rAlong * dir.z) + (tOff * n.z);
      return { x, y: 0, z };
    }
    const L0 = mkPoint(innerR, -w * 0.5);
    const R0 = mkPoint(innerR, +w * 0.5);
    const tip = mkPoint(innerR + ext, 0);

    // offset ketebalan
    const L0a = { x: L0.x + n.x * halfT, y: 0, z: L0.z + n.z * halfT };
    const R0a = { x: R0.x + n.x * halfT, y: 0, z: R0.z + n.z * halfT };
    const tipA = { x: tip.x + n.x * halfT, y: 0, z: tip.z + n.z * halfT };

    const L0b = { x: L0.x - n.x * halfT, y: 0, z: L0.z - n.z * halfT };
    const R0b = { x: R0.x - n.x * halfT, y: 0, z: R0.z - n.z * halfT };
    const tipB = { x: tip.x - n.x * halfT, y: 0, z: tip.z - n.z * halfT };

    // gradasi warna
    const cBase = flameColor(0.0);
    const cTip  = flameColor(1.0);

    pushTriDouble(L0a, R0a, tipA, cTip);   // segitiga utama
    pushTriDouble(R0b, L0b, tipB, cTip);

    const core = mkPoint(innerR + ext * 0.35, 0);
    const coreA = { x: core.x + n.x * (halfT * 0.6), y: 0, z: core.z + n.z * (halfT * 0.6) };
    const coreB = { x: core.x - n.x * (halfT * 0.6), y: 0, z: core.z - n.z * (halfT * 0.6) };
    const cCore = flameColor(0.25);
    pushTriDouble(L0a, coreA, R0a, cCore);
    pushTriDouble(R0b, coreB, L0b, cCore);
  }
  return { vertices, faces };
}

// Buat animasi flame nya
class FlameFan {
  constructor(GL, SHADER_PROGRAM, _position, _color, _MMatrix, params) {
    this.GL = GL; this.SHADER_PROGRAM = SHADER_PROGRAM;
    this._position = _position; this._color = _color; this._MMatrix = _MMatrix;

    this.params = Object.assign({
      count: 24, innerR: 1.0, length: 4.0, baseWidth: 0.6,
      span: Math.PI * 1.1, thickness: 0.3, jitter: 0.2, tipNoise: 0.2
    }, params || {});

    const flame = generateFlameFan(this.params);

    this.baseVerts = new Float32Array(flame.vertices);   
    this.verts     = new Float32Array(flame.vertices);
    this.faces     = new Uint16Array(flame.faces);

    const N = this.baseVerts.length / 6;
    this._angle  = new Float32Array(N);
    this._radius = new Float32Array(N);
    for (let i = 0; i < this.baseVerts.length; i += 6) {
      const x = this.baseVerts[i], z = this.baseVerts[i+2];
      const k = i/6;
      this._angle[k]  = Math.atan2(z, x);
      this._radius[k] = Math.hypot(x, z);
    }

    this.VBO = GL.createBuffer();
    GL.bindBuffer(GL.ARRAY_BUFFER, this.VBO);
    GL.bufferData(GL.ARRAY_BUFFER, this.verts, GL.DYNAMIC_DRAW);

    this.EBO = GL.createBuffer();
    GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, this.EBO);
    GL.bufferData(GL.ELEMENT_ARRAY_BUFFER, this.faces, GL.STATIC_DRAW);

    this.MOVE_MATRIX = LIBS.get_I4();
    this.POSITION_MATRIX = LIBS.get_I4();
  }

  setup() {  }

  update(t) {
    const { innerR, length } = this.params;

    const ampSway   = 0.22;
    const ampLift   = 0.18;
    const ampBreath = 0.07;
    const w1 = 3.2, w2 = 1.5;

    const N = this.baseVerts.length / 6;
    for (let i = 0; i < N; i++) {
      const bi = i*6;

      const bx=this.baseVerts[bi], by=this.baseVerts[bi+1], bz=this.baseVerts[bi+2];
      const br=this.baseVerts[bi+3], bg=this.baseVerts[bi+4], bb=this.baseVerts[bi+5];

      const ang = this._angle[i];
      const r   = this._radius[i];

      let tv = Math.min(1, Math.max(0, (r - innerR) / Math.max(1e-5, length)));
      tv = Math.pow(tv, 1.35);

      const breath = 1.0 + ampBreath * Math.sin(w2*t + 2.7*Math.sin(1.3*ang));
      const rx = bx * (1 + (breath-1)*tv);
      const rz = bz * (1 + (breath-1)*tv);

      const sway = ampSway * tv * Math.sin(w1*t + 3.0*ang);
      const tx =  Math.sin(ang) * sway;
      const tz = -Math.cos(ang) * sway;

      const lift = ampLift * tv * (0.5 + 0.5*Math.sin(2.1*t + 2.2*ang));

      this.verts[bi  ] = rx + tx;
      this.verts[bi+1] = by + lift;
      this.verts[bi+2] = rz + tz;

      const flick = 0.12 * tv * (0.5 + 0.5*Math.sin(5.0*t + 4.0*ang));
      this.verts[bi+3] = Math.min(1, br + flick*0.8);
      this.verts[bi+4] = Math.min(1, bg + flick*0.4);
      this.verts[bi+5] = Math.max(0, bb - flick*0.3);
    }

    const gl = this.GL;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.VBO);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.verts);
  }

  render(PARENT_MATRIX) {
    const gl = this.GL;
    const M = LIBS.multiply(this.MOVE_MATRIX, PARENT_MATRIX);

    gl.useProgram(this.SHADER_PROGRAM);
    gl.uniformMatrix4fv(this._MMatrix, false, M);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.VBO);
    gl.vertexAttribPointer(this._position, 3, gl.FLOAT, false, 24, 0);
    gl.vertexAttribPointer(this._color,    3, gl.FLOAT, false, 24, 12);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.EBO);
    gl.drawElements(gl.TRIANGLES, this.faces.length, gl.UNSIGNED_SHORT, 0);
  }
}


/* ===================== BODY SHAPE (ASSEMBLY) ===================== */

export class BodyShape {
    GL = null;
    SHADER_PROGRAM = null;

    _position = null;
    _color = null;
    _MMatrix = null;

    OBJECT_VERTEX = null;
    OBJECT_FACES = null;

    vertex = [];
    faces = [];

    POSITION_MATRIX = LIBS.get_I4();
    MOVE_MATRIX = LIBS.get_I4();

    childs = [];

    constructor(GL, SHADER_PROGRAM, _position, _color, _Mmatrix) {
        this.GL = GL;
        this.SHADER_PROGRAM = SHADER_PROGRAM;
        this._position = _position;
        this._color = _color;
        this._MMatrix = _Mmatrix;

        // ===== 1) TORSO (ellipsoid utama) =====
        const torso = generateEllipticConeFrustum(
          2.3, 1.8,   // radius bawah (rx, rz)
          1, 1,   // radius atas (rx, rz)
          7,        // tinggi 
          96, 96,
          bodyColorVentralDorsal
        );
        appendGeometry(this.vertex, this.faces, torso.vertices, torso.faces, 0, 0, 0, null);


        // 2) BELLY / penutup bawah -> ellipsoid pipih
        let torsoMinY =  Infinity;
        for (let vi = 1; vi < this.vertex.length; vi += 6) {
        if (this.vertex[vi] < torsoMinY) torsoMinY = this.vertex[vi];
        }
  
        const bellyCap = generateEllipsoid(
        2.2, 0.5, 1.9,   
        40, 56,
        bodyColorVentralDorsal 
        );
        appendGeometry(
        this.vertex, this.faces,
        bellyCap.vertices, bellyCap.faces,
        0, torsoMinY - 0.1, 0,
        bodyColorVentralDorsal 
        );

        // 3) CAPE (jubah dorsal) 
        const cape = generateCape({
        wTop: 70, wBottom: 100, len: 20,
        thickness: 5, stacks: 30, steps: 28,
        curveDown: 1.3, flare: 2,
        teeth: 10, toothDepth: 2.5,
        colorFn: (x,y,z)=>({ r:0.12,g:0.20,b:0.36 })
        });
    
        stickCapeBase(cape, {
        rowsLock: 4,
        backInset: 0.35,   
        lift: 1.8, //tinggi cap nya
        rollX: -0.17
        });
        // BUNGKUS cape MENGIKUTI torso badan
        wrapCapeAroundTorso(cape, {
        stacks: cape.meta.stacks,
        steps : cape.meta.steps,
        cover : 1.1,      
        widthGain: 1.6,    
        gap   : 0,      
        torso : { rbx:2.5, rbz:2, rtx:1, rtz:1, height:7.5 }
        });
        
        appendGeometry(this.vertex, this.faces, cape.vertices, cape.faces, 0.0, 1.7, -0.1);

        // ==== 3.5) BEND BODY DULU (jika mau), baru nanti tempel flame
        bendForwardInPlace(this.vertex, 0.5); // 0.35–0.55
        
        // 4) FLAME FAN (mahkota api) =====
        this.flames = new FlameFan(this.GL, this.SHADER_PROGRAM, this._position, this._color, this._MMatrix, {
          count: 24,
          innerR: 1.0,
          length: 4.0,
          baseWidth: 0.6,
          span: Math.PI * 1.15,
          thickness: 0.3,
          jitter: 0.2,
          tipNoise: 0.2
        });


        this.childs.push(this.flames);

        this.MOVE_MATRIX = LIBS.get_I4();
  

    }

    setup() {
        this.OBJECT_VERTEX = this.GL.createBuffer();
        this.GL.bindBuffer(this.GL.ARRAY_BUFFER, this.OBJECT_VERTEX);
        this.GL.bufferData(this.GL.ARRAY_BUFFER, new Float32Array(this.vertex), this.GL.STATIC_DRAW);

        this.OBJECT_FACES = this.GL.createBuffer();
        this.GL.bindBuffer(this.GL.ELEMENT_ARRAY_BUFFER, this.OBJECT_FACES);
        this.GL.bufferData(this.GL.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.faces), this.GL.STATIC_DRAW);

        this.childs.forEach(child => child.setup());
    }

    render(PARENT_MATRIX) {
        this.MODEL_MATRIX = LIBS.multiply(this.MOVE_MATRIX, this.POSITION_MATRIX);
        this.MODEL_MATRIX = LIBS.multiply(this.MODEL_MATRIX, PARENT_MATRIX);

        this.GL.useProgram(this.SHADER_PROGRAM);
        this.GL.uniformMatrix4fv(this._MMatrix, false, this.MODEL_MATRIX);

        this.GL.bindBuffer(this.GL.ARRAY_BUFFER, this.OBJECT_VERTEX);
        this.GL.vertexAttribPointer(this._position, 3, this.GL.FLOAT, false, 24, 0);
        this.GL.vertexAttribPointer(this._color, 3, this.GL.FLOAT, false, 24, 12);

        this.GL.bindBuffer(this.GL.ELEMENT_ARRAY_BUFFER, this.OBJECT_FACES);
        this.GL.drawElements(this.GL.TRIANGLES, this.faces.length, this.GL.UNSIGNED_SHORT, 0);

        this.childs.forEach(child => child.render(this.MODEL_MATRIX));
    }

  

    getBoundsY() {
      let minY =  Infinity, maxY = -Infinity;
      for (let i = 1; i < this.vertex.length; i += 6) {
        const y = this.vertex[i];
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
      return { minY, maxY };
    }

    
}
// dipanggil tiap frame dari main.js
BodyShape.prototype.tick = function(t) {
  if (this.flames && typeof this.flames.update === "function") {
    this.flames.update(t);
  }
};

