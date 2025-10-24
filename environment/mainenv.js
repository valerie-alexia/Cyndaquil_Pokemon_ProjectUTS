// mainenv.js
import { LIBS } from "./libs.js";
import { PokeballShell } from "./pokeballshell.js";
import { Terrain } from "./terrain.js";

// Import komponen Quilava yang diperlukan (Pastikan nama filenya 'head.js', bukan 'kepala.js')
import { HeadShape } from "../Quilava/head.js";
import { BodyShape } from "../Quilava/body.js";
import { ArmShape } from "../Quilava/arms.js";
import { LegsShape } from "../Quilava/legs.js";

function main() {
  const CANVAS = document.getElementById("thisCanvas");
  CANVAS.width = window.innerWidth;
  CANVAS.height = window.innerHeight;

  const GL = CANVAS.getContext("webgl", { antialias: true });
  if (!GL) {
    alert("WebGL context cannot be initialized");
    return;
  } // === SHADERS ===

  const shader_vertex_source = `
attribute vec3 position;
uniform mat4 Pmatrix;
uniform mat4 Vmatrix;
uniform mat4 Mmatrix;
attribute vec3 color;
varying vec3 vColor;

void main(void) {
    gl_Position = Pmatrix * Vmatrix * Mmatrix * vec4(position, 1.0);
    vColor = color;
}
`;

  const shader_fragment_source = `
precision mediump float;
varying vec3 vColor;

void main(void) {
    gl_FragColor = vec4(vColor, 1.0);
}
`;

  const compile_shader = (src, type, typeString) => {
    const s = GL.createShader(type);
    GL.shaderSource(s, src);
    GL.compileShader(s);
    if (!GL.getShaderParameter(s, GL.COMPILE_STATUS)) {
      console.error(
        "ERROR IN " + typeString + " SHADER:\n" + GL.getShaderInfoLog(s)
      );
      return null;
    }
    return s;
  };

  const vert = compile_shader(shader_vertex_source, GL.VERTEX_SHADER, "VERTEX");
  const frag = compile_shader(
    shader_fragment_source,
    GL.FRAGMENT_SHADER,
    "FRAGMENT"
  );

  const SHADER_PROGRAM = GL.createProgram();
  GL.attachShader(SHADER_PROGRAM, vert);
  GL.attachShader(SHADER_PROGRAM, frag);
  GL.linkProgram(SHADER_PROGRAM);
  GL.useProgram(SHADER_PROGRAM);

  const _position = GL.getAttribLocation(SHADER_PROGRAM, "position");
  const _color = GL.getAttribLocation(SHADER_PROGRAM, "color");
  const _Pmatrix = GL.getUniformLocation(SHADER_PROGRAM, "Pmatrix");
  const _Vmatrix = GL.getUniformLocation(SHADER_PROGRAM, "Vmatrix");
  const _Mmatrix = GL.getUniformLocation(SHADER_PROGRAM, "Mmatrix");

  GL.enableVertexAttribArray(_position);
  GL.enableVertexAttribArray(_color); // === INISIALISASI POKEBALL DAN TERRAIN ===

  const shell = new PokeballShell(
    GL,
    SHADER_PROGRAM,
    _position,
    _color,
    _Mmatrix
  );
  const terrain = new Terrain(
    GL,
    SHADER_PROGRAM,
    _position,
    _color,
    _Mmatrix,
    shell.radius
  );
  shell.setup();
  terrain.setup(); // === BARU: INISIALISASI QUILAVA (LOGIKA DARI QUILAVA/main.js) === // HEAD

  const head = new HeadShape(GL, SHADER_PROGRAM, _position, _color, _Mmatrix);
  head.setup(); // BODY (Root)
  const body = new BodyShape(GL, SHADER_PROGRAM, _position, _color, _Mmatrix);
  body.setup(); // ARMS
  const rightArm = new ArmShape(
    GL,
    SHADER_PROGRAM,
    _position,
    _color,
    _Mmatrix,
    +1
  );
  rightArm.setup();
  const leftArm = new ArmShape(
    GL,
    SHADER_PROGRAM,
    _position,
    _color,
    _Mmatrix,
    -1
  );
  leftArm.setup(); // LEGS
  const leftLeg = new LegsShape(
    GL,
    SHADER_PROGRAM,
    _position,
    _color,
    _Mmatrix,
    +1
  );
  leftLeg.setup();
  const rightLeg = new LegsShape(
    GL,
    SHADER_PROGRAM,
    _position,
    _color,
    _Mmatrix,
    -1
  );
  rightLeg.setup(); // HIERARKI QUILAVA

  body.childs.push(head);
  body.childs.push(rightArm);
  body.childs.push(leftArm); // Legs dirender terpisah, jadi tidak dimasukkan ke body.childs // === MATRICES ===
  const PROJMATRIX = LIBS.get_projection(
    40,
    CANVAS.width / CANVAS.height,
    1,
    100
  );
  const VIEWMATRIX = LIBS.get_I4(); // === CAMERA/ROTATION STATE ===

  let THETA = 0.0;
  let PHI = 0.25;
  let cameraVelocity = 0;
  const rotateAccel = 0.002;
  const rotateFriction = 0.9;
  const maxSpeed = 0.03;
  const keys = { a: false, d: false }; // === ANIMASI POKEBALL ===

  let isOpening = false;
  let animationProgress = 0;
  const animationSpeed = 0.05;
  const maxOpenAngle = Math.PI / 3; // === KEYBOARD EVENTS ===

  window.addEventListener("keydown", (e) => {
    if (e.key === "a" || e.key === "A") keys.a = true;
    if (e.key === "d" || e.key === "D") keys.d = true;
    if (e.key === "r" || e.key === "R") {
      THETA = 0;
      PHI = 0.3;
      cameraVelocity = 0;
    } // Toggle buka/tutup
    if (e.key.toLowerCase() === "o") isOpening = !isOpening; // Toggle Crawl Quilava
    if (e.key === "c" || e.key === "C") {
      body.toggleCrawlState();
      body.childs.forEach((child) => {
        if (child.toggleCrawlState) {
          child.toggleCrawlState();
        }
      });
    }
  });
  window.addEventListener("keyup", (e) => {
    if (e.key === "a" || e.key === "A") keys.a = false;
    if (e.key === "d" || e.key === "D") keys.d = false;
  }); // === GL SETTINGS ===

  GL.enable(GL.DEPTH_TEST);
  GL.depthFunc(GL.LEQUAL);
  GL.enable(GL.CULL_FACE);
  GL.cullFace(GL.BACK);
  GL.clearColor(0.1, 0.1, 0.2, 1.0);
  GL.clearDepth(1.0); // === ANIMATE ===

  const animate = (time) => {
    const timeInSeconds = time * 0.001;
    GL.viewport(0, 0, CANVAS.width, CANVAS.height);
    GL.clear(GL.COLOR_BUFFER_BIT | GL.DEPTH_BUFFER_BIT); // Update Smooth horizontal rotation

    if (keys.a) cameraVelocity -= rotateAccel;
    if (keys.d) cameraVelocity += rotateAccel;
    cameraVelocity *= rotateFriction;
    cameraVelocity = Math.max(-maxSpeed, Math.min(maxSpeed, cameraVelocity));
    THETA += cameraVelocity; // Update Open/close animation

    if (isOpening && animationProgress < 1.0)
      animationProgress = Math.min(1.0, animationProgress + animationSpeed);
    else if (!isOpening && animationProgress > 0.0)
      animationProgress = Math.max(0.0, animationProgress - animationSpeed);

    const currentOpenAngle = animationProgress * maxOpenAngle; // --- VIEWMATRIX (CAMERA) ---

    LIBS.set_I4(VIEWMATRIX);
    LIBS.translateZ(VIEWMATRIX, -80); // Posisi kamera
    LIBS.rotateX(VIEWMATRIX, PHI); // Pitch

    GL.uniformMatrix4fv(_Pmatrix, false, PROJMATRIX);
    GL.uniformMatrix4fv(_Vmatrix, false, VIEWMATRIX); // === WORLD MATRIX (POKEBALL, TERRAIN, QUILAVA) ===

    const WORLD_MATRIX = LIBS.get_I4();
    LIBS.translateZ(WORLD_MATRIX, 40); // Majukan objek (Pokeball/Quilava)
    LIBS.rotateY(WORLD_MATRIX, THETA); // Rotasi Horizontal // Hitung offset Y untuk Terrain dan Quilava

    const terrainYOffset = -shell.bandHeight / 2 + 0.1; // 1. Render Pokeball Shell

    shell.render(WORLD_MATRIX, currentOpenAngle); // 2. Render Terrain

    const terrainMatrix = LIBS.get_I4();
    LIBS.translateY(terrainMatrix, terrainYOffset);
    LIBS.multiply(terrainMatrix, WORLD_MATRIX, terrainMatrix);
    terrain.render(terrainMatrix); // 3. Render Quilava

    const quilavaMatrix = LIBS.get_I4(); // Geser Quilava ke atas, di atas terrain
    LIBS.translateY(quilavaMatrix, terrainYOffset); // Gabungkan matriks dunia (rotasi)
    LIBS.multiply(quilavaMatrix, WORLD_MATRIX, quilavaMatrix); // Panggil ANImasi
    body.animate(timeInSeconds);
    body.childs.forEach((child) => {
      if (child.animate) child.animate(timeInSeconds);
    }); // Render body dan children-nya
    body.render(quilavaMatrix); // Render legs secara terpisah
    leftLeg.render(quilavaMatrix);
    rightLeg.render(quilavaMatrix);

    GL.flush();
    requestAnimationFrame(animate);
  };

  animate(0);
}

window.addEventListener("load", main);
