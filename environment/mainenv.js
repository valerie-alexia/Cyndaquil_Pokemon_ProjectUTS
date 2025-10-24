// mainenv.js
import { LIBS } from "./libs.js";
import { PokeballShell } from "./pokeballshell.js";
import { Terrain } from "./terrain.js";
// Import Pokémon later when needed
// import { QuilavaShape } from './Quilava/quilava.js';

function main() {
  /** @type {HTMLCanvasElement} */
  var CANVAS = document.getElementById("thisCanvas");
  CANVAS.width = window.innerWidth;
  CANVAS.height = window.innerHeight; /* GET WEBGL CONTEXT */

  var GL;
  try {
    GL = CANVAS.getContext("webgl", { antialias: true });
  } catch (e) {
    alert("WebGL context cannot be initialized");
    return false;
  } /* SHADERS */

  var shader_vertex_source = `
        attribute vec3 position;
        uniform mat4 Pmatrix, Vmatrix, Mmatrix;
        attribute vec3 color;
        varying vec3 vColor;
        void main(void) {
            gl_Position = Pmatrix * Vmatrix * Mmatrix * vec4(position, 1.);
            vColor = color;
        }`;
  var shader_fragment_source = `
        precision mediump float;
        varying vec3 vColor;
        void main(void) {
            gl_FragColor = vec4(vColor, 1.);
        }`;

  var compile_shader = function (source, type, typeString) {
    source = source.replace(/^\uFEFF/, ""); // hapus BOM

    source = source.replace(/[^\x00-\x7F]/g, ""); // hapus karakter non-ASCII
    var shader = GL.createShader(type);
    GL.shaderSource(shader, source);
    GL.compileShader(shader);

    if (!GL.getShaderParameter(shader, GL.COMPILE_STATUS)) {
      console.error(
        "ERROR IN " + typeString + " SHADER:\n" + GL.getShaderInfoLog(shader)
      );
      return null;
    }
    return shader;
  };
  var shader_vertex = compile_shader(
    shader_vertex_source,
    GL.VERTEX_SHADER,
    "VERTEX"
  );
  var shader_fragment = compile_shader(
    shader_fragment_source,
    GL.FRAGMENT_SHADER,
    "FRAGMENT"
  );

  var SHADER_PROGRAM = GL.createProgram();
  GL.attachShader(SHADER_PROGRAM, shader_vertex);
  GL.attachShader(SHADER_PROGRAM, shader_fragment);
  GL.linkProgram(SHADER_PROGRAM);

  var _position = GL.getAttribLocation(SHADER_PROGRAM, "position");
  GL.enableVertexAttribArray(_position);
  var _color = GL.getAttribLocation(SHADER_PROGRAM, "color");
  GL.enableVertexAttribArray(_color);
  var _Pmatrix = GL.getUniformLocation(SHADER_PROGRAM, "Pmatrix");
  var _Vmatrix = GL.getUniformLocation(SHADER_PROGRAM, "Vmatrix");
  var _Mmatrix = GL.getUniformLocation(SHADER_PROGRAM, "Mmatrix");

  GL.useProgram(SHADER_PROGRAM); /* THE ENVIRONMENT */ // Shell radius sekarang diambil dari dalam kelas PokeballShell

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
    shell.radius // Gunakan radius dari shell
  );

  shell.setup();
  terrain.setup(); /* POKEMON (Add later) */ /* MATRICES & CAMERA */ // ...

  var PROJMATRIX = LIBS.get_projection(
    40,
    CANVAS.width / CANVAS.height,
    1,
    100
  );
  var MOVEMATRIX = LIBS.get_I4(); // World rotation
  var VIEWMATRIX = LIBS.get_I4(); /* MOVEMENT & ANIMATION STATE */ // Camera

  var THETA = 0,
    PHI = 0;
  var drag = false;
  var x_prev, y_prev;
  var FRICTION = 0.05;
  var dX = 0,
    dY = 0; // --- Variabel Baru untuk Animasi Pokeball ---

  var isOpening = false; // Target state (sedang membuka?)
  var isOpen = false; // Current state (sudah terbuka?)
  var animationProgress = 0.0; // 0.0 = tertutup, 1.0 = terbuka
  const animationSpeed = 0.05; // Kecepatan buka/tutup
  const maxOpenAngle = Math.PI / 1.5; // Sekitar 120°, positif agar membuka ke atas
  // Sudut bukaan (misal: 120 derajat)

  var mouseDown = function (e) {
    drag = true;
    (x_prev = e.pageX), (y_prev = e.pageY);
    e.preventDefault();
    return false;
  };
  var mouseUp = function (e) {
    drag = false;
  };
  var mouseMove = function (e) {
    if (!drag) return false;
    dX = ((-(e.pageX - x_prev) * 2 * Math.PI) / CANVAS.width) * 0.3; // Sensitivity
    dY = ((-(e.pageY - y_prev) * 2 * Math.PI) / CANVAS.height) * 0.3;
    THETA += dX;
    PHI += dY; // Clamp PHI
    PHI = Math.max(-Math.PI / 2 + 0.1, Math.min(Math.PI / 2 - 0.1, PHI));
    (x_prev = e.pageX), (y_prev = e.pageY);
    e.preventDefault();
  }; // --- Listener Baru untuk Keyboard ---

  var keyDown = function (e) {
    if (e.key === "o" || e.key === "O") {
      isOpening = !isOpening; // Toggle arah buka/tutup
    }
  };

  CANVAS.addEventListener("mousedown", mouseDown, false);
  CANVAS.addEventListener("mouseup", mouseUp, false);
  CANVAS.addEventListener("mouseout", mouseUp, false);
  CANVAS.addEventListener("mousemove", mouseMove, false);
  window.addEventListener("keydown", keyDown, false); /* DRAWING */ // Tambahkan listener keyboard

  GL.enable(GL.DEPTH_TEST);
  GL.depthFunc(GL.LEQUAL);
  GL.enable(GL.CULL_FACE); // <-- BARU: Aktifkan Culling
  GL.cullFace(GL.BACK); // <-- BARU: Sembunyikan sisi belakang (membuat hollow)
  GL.clearColor(0.1, 0.1, 0.2, 1.0); // Dark blue-grey background
  GL.clearDepth(1.0);

  var time_old = 0;
  var animate = function (time) {
    const dt = time - time_old;
    time_old = time;

    GL.viewport(0, 0, CANVAS.width, CANVAS.height);
    GL.clear(GL.COLOR_BUFFER_BIT | GL.DEPTH_BUFFER_BIT); // --- Update Animasi Pokeball ---

    if (isOpening && animationProgress < 1.0) {
      // Buka
      animationProgress = Math.min(1.0, animationProgress + animationSpeed);
      if (animationProgress === 1.0) isOpen = true;
    } else if (!isOpening && animationProgress > 0.0) {
      // Tutup
      animationProgress = Math.max(0.0, animationProgress - animationSpeed);
      if (animationProgress === 0.0) isOpen = false;
    } // Hitung sudut bukaan saat ini berdasarkan progress
    const currentOpenAngle = animationProgress * maxOpenAngle; // --- Akhir Update Animasi --- // Update Camera based on drag
    if (!drag) {
      dX *= 1 - FRICTION;
      dY *= 1 - FRICTION;
      THETA += dX;
      PHI += dY;
      PHI = Math.max(-Math.PI / 2 + 0.1, Math.min(Math.PI / 2 - 0.1, PHI));
    }

    LIBS.set_I4(MOVEMATRIX);
    LIBS.translateZ(MOVEMATRIX, 50);
    LIBS.rotateY(MOVEMATRIX, THETA);

    LIBS.set_I4(VIEWMATRIX);
    LIBS.translateZ(VIEWMATRIX, -70); // Zoom
    LIBS.rotateX(VIEWMATRIX, PHI); // Pitch // Kita tidak memutar Y di sini agar rotasi dunia (MOVEMATRIX) yang mengontrolnya
    GL.uniformMatrix4fv(_Pmatrix, false, PROJMATRIX);
    GL.uniformMatrix4fv(_Vmatrix, false, VIEWMATRIX); // Render Environment

    const environmentWorldMatrix = LIBS.get_I4();
    LIBS.multiply(environmentWorldMatrix, MOVEMATRIX, environmentWorldMatrix); // Terapkan rotasi dunia // --- Render Shell dengan Sudut Bukaan ---

    shell.render(environmentWorldMatrix, currentOpenAngle); // --- Render Terrain (di dalam shell bawah) ---

    const terrainWorldMatrix = LIBS.get_I4(); // Geser terrain ke posisi lantai shell bawah // (Setengah tinggi band, ditambah sedikit offset agar tidak z-fighting)
    LIBS.translateY(terrainWorldMatrix, -shell.bandHeight / 2 + 0.1); // Gabungkan dengan rotasi dunia
    LIBS.multiply(
      terrainWorldMatrix,
      environmentWorldMatrix,
      terrainWorldMatrix
    );
    terrain.render(terrainWorldMatrix); // Pass final matrix // Render Pokémon // ...

    GL.flush();
    window.requestAnimationFrame(animate);
  };
  animate(0);
}
window.addEventListener("load", main);
