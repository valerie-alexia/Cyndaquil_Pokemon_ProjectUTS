// mainenv.js
import { LIBS } from "./libs.js";
import { PokeballShell } from "./pokeballshell.js";
import { Terrain } from "./terrain.js";

// QUILAVA IMPORTS
import { HeadShape } from "../Quilava/head.js";
import { BodyShape } from "../Quilava/body.js";
import { ArmShape } from "../Quilava/arms.js";
import { LegsShape } from "../Quilava/legs.js";

import { HisuianTyphlosion } from "../Hisuian-Typhlosion/HisuianTyphlosion.js";

// Typhlosion
import { BodyShape as TyBodyShape } from "../Typhlosion/body.js";
import { HeadShape as TyHeadShape } from "../Typhlosion/head.js";
import { ArmShape as TyArmShape } from "../Typhlosion/arms.js";
import { LegsShape as TyLegsShape } from "../Typhlosion/legs.js";

function main() {
  const CANVAS = document.getElementById("thisCanvas");
  CANVAS.width = window.innerWidth;
  CANVAS.height = window.innerHeight;

  const GL = CANVAS.getContext("webgl", { antialias: true });
  if (!GL) {
    alert("WebGL context cannot be initialized");
    return;
  }

  // === SHADERS ===
  const shader_vertex_source = `
    attribute vec3 position;
    uniform mat4 Pmatrix, Vmatrix, Mmatrix;
    attribute vec3 color;
    varying vec3 vColor;
    void main(void) {
        gl_Position = Pmatrix * Vmatrix * Mmatrix * vec4(position, 1.0);
        vColor = color;
    }`;

  const shader_fragment_source = `
    precision mediump float;
    varying vec3 vColor;
    void main(void) {
        gl_FragColor = vec4(vColor, 1.0);
    }`;

  const compile_shader = (src, type) => {
    const s = GL.createShader(type);
    GL.shaderSource(s, src);
    GL.compileShader(s);
    if (!GL.getShaderParameter(s, GL.COMPILE_STATUS)) {
      console.error(GL.getShaderInfoLog(s));
      return null;
    }
    return s;
  };

  const vert = compile_shader(shader_vertex_source, GL.VERTEX_SHADER);
  const frag = compile_shader(shader_fragment_source, GL.FRAGMENT_SHADER);

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
  GL.enableVertexAttribArray(_color);

  // === OBJECTS ===
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
  terrain.setup();

  // Create Quilava
  var quilava_body = new BodyShape(
    GL,
    SHADER_PROGRAM,
    _position,
    _color,
    _Mmatrix
  );
  var quilava_head = new HeadShape(
    GL,
    SHADER_PROGRAM,
    _position,
    _color,
    _Mmatrix
  );
  var quilava_rightArm = new ArmShape(
    GL,
    SHADER_PROGRAM,
    _position,
    _color,
    _Mmatrix,
    +1
  );
  var quilava_leftArm = new ArmShape(
    GL,
    SHADER_PROGRAM,
    _position,
    _color,
    _Mmatrix,
    -1
  );
  var quilava_leftLeg = new LegsShape(
    GL,
    SHADER_PROGRAM,
    _position,
    _color,
    _Mmatrix,
    +1
  );
  var quilava_rightLeg = new LegsShape(
    GL,
    SHADER_PROGRAM,
    _position,
    _color,
    _Mmatrix,
    -1
  );

  // Setup Quilava
  quilava_body.setup();
  quilava_head.setup();
  quilava_rightArm.setup();
  quilava_leftArm.setup();
  quilava_leftLeg.setup();
  quilava_rightLeg.setup();

  // Build Quilava Hierarchy
  quilava_body.childs.push(quilava_head);
  quilava_body.childs.push(quilava_rightArm);
  quilava_body.childs.push(quilava_leftArm);

  var htyphlosion = new HisuianTyphlosion(
    GL,
    SHADER_PROGRAM,
    _position,
    _color,
    _Mmatrix
  );
  htyphlosion.setup();

  // === CREATE TYPHLOSION ===
  const ty_body = new TyBodyShape(
    GL,
    SHADER_PROGRAM,
    _position,
    _color,
    _Mmatrix
  );
  const ty_head = new TyHeadShape(
    GL,
    SHADER_PROGRAM,
    _position,
    _color,
    _Mmatrix
  );
  const ty_rightArm = new TyArmShape(
    GL,
    SHADER_PROGRAM,
    _position,
    _color,
    _Mmatrix,
    +1
  );
  const ty_leftArm = new TyArmShape(
    GL,
    SHADER_PROGRAM,
    _position,
    _color,
    _Mmatrix,
    -1
  );
  const ty_leftLeg = new TyLegsShape(
    GL,
    SHADER_PROGRAM,
    _position,
    _color,
    _Mmatrix,
    +1
  );
  const ty_rightLeg = new TyLegsShape(
    GL,
    SHADER_PROGRAM,
    _position,
    _color,
    _Mmatrix,
    -1
  );

  // Setup Typhlosion
  ty_body.setup();
  ty_head.setup();
  ty_rightArm.setup();
  ty_leftArm.setup();
  ty_leftLeg.setup();
  ty_rightLeg.setup();

  ty_body.childs.push(ty_head);
  ty_body.childs.push(ty_rightArm);
  ty_body.childs.push(ty_leftArm);
  ty_body.childs.push(ty_rightLeg);
  ty_body.childs.push(ty_leftLeg);

  // === MATRICES ===
  const PROJMATRIX = LIBS.get_projection(
    40,
    CANVAS.width / CANVAS.height,
    1,
    100
  );
  const VIEWMATRIX = LIBS.get_I4();

  // === CAMERA STATE (Manual Control) ===
  let THETA = 0.0;
  let PHI = 0.25;
  let cameraVelocity = 0;
  const rotateAccel = 0.002;
  const rotateFriction = 0.9;
  const maxSpeed = 0.03;
  const keys = { a: false, d: false };

  // --- SHOWCASE TIMELINE STATE ---
  const showcaseDuration = 45.0; // Total durasi showcase
  let isShowcaseActive = true;
  let currentCameraZ = -120.0; // Untuk menyimpan Z kamera saat ini setelah intro

  // --- Animation Triggers ---
  let isQuilavaCrawling = false;
  let tyWalkTimeStart = -1; // -1 jika tidak berjalan
  let tyIsWalking = false;
  let tyWalkDirection = 1;
  let tyWalkStepDistance = 5.0;
  let tyWalkDuration = 2.0;

  // Typhlosion standard state (untuk animasi lompat/jalan)
  let tyPosX = -6.5;
  let tyPosY = 4.5;
  let tyPosZ = 3.0;
  let tyJumpTime = 0;
  let tyIsJumping = false;
  const tyJumpDuration = 0.8;
  const tyJumpHeight = 2.0;
  const tyBreathSpeed = 2.0;

  // === GLOBAL TIME STATE FIX ===
  let prevTimeSeconds = 0; // FIX: Inisialisasi ReferenceError

  // === ANIMATION UTILITIES ===

  const startQuilavaCrawl = () => {
    if (!isQuilavaCrawling) {
      quilava_body.toggleCrawlState();
      quilava_body.childs.forEach((child) => {
        if (child.toggleCrawlState) child.toggleCrawlState();
      });
      isQuilavaCrawling = true;
    }
  };

  const stopQuilavaCrawl = () => {
    if (isQuilavaCrawling) {
      quilava_body.toggleCrawlState();
      quilava_body.childs.forEach((child) => {
        if (child.toggleCrawlState) child.toggleCrawlState();
      });
      isQuilavaCrawling = false;
    }
  };

  const startTyphlosionWalk = (currentDirection) => {
    // Current direction digunakan untuk menentukan apakah perlu membalik arah.
    // Selama showcase, kita hanya perlu memicu langkah. Arah diatur oleh showcase logic.
    if (!tyIsWalking) {
      tyIsWalking = true;
      tyWalkTimeStart = prevTimeSeconds;
      tyWalkDirection = currentDirection;
      tyWalkStepDistance = 5.0 * currentDirection;
    }
  };

  const typhlosionJump = () => {
    if (!tyIsJumping) {
      tyIsJumping = true;
      tyJumpTime = 0;
    }
  };

  // === KEYBOARD EVENTS ===
  window.addEventListener("keydown", (e) => {
    if (e.key === "a" || e.key === "A") keys.a = true;
    if (e.key === "d" || e.key === "D") keys.d = true;
    if (e.key === "r" || e.key === "R") {
      THETA = 0;
      PHI = 0.3;
      cameraVelocity = 0;
      isShowcaseActive = false; // Matikan showcase
    }
    // Debug Controls (hanya aktif setelah showcase)
    if (!isShowcaseActive) {
      if (e.key === "c" || e.key === "C") startQuilavaCrawl();
      if (e.key === "C" || e.key === "X") stopQuilavaCrawl(); // Tambah tombol untuk stop
      if (e.key === "n" || e.key === "N") htyphlosion.startNod();
      if (e.key === "m" || e.key === "M") htyphlosion.startShake();
      if (e.key === " " || e.key === "Space") htyphlosion.startJump();
      if (e.key === "2") startTyphlosionWalk(-1); // Manual walk trigger
      if (e.key === "3") typhlosionJump(); // Manual jump trigger
    }
  });
  window.addEventListener("keyup", (e) => {
    if (e.key === "a" || e.key === "A") keys.a = false;
    if (e.key === "d" || e.key === "D") keys.d = false;
  });

  // === OPEN/CLOSE STATE ===
  let isOpening = false;
  let animationProgress = 0;
  const animationSpeed = 0.05;
  const maxOpenAngle = Math.PI / 3;
  window.addEventListener("keydown", (e) => {
    if (e.key.toLowerCase() === "o") isOpening = !isOpening;
  });

  // === GL SETTINGS ===
  GL.enable(GL.DEPTH_TEST);
  GL.depthFunc(GL.LEQUAL);
  GL.enable(GL.CULL_FACE);
  GL.cullFace(GL.BACK);
  GL.clearColor(0.1, 0.1, 0.2, 1.0);

  // === ANIMATE ===
  const animate = (time) => {
    const timeInSeconds = time * 0.001;

    const dt = timeInSeconds - prevTimeSeconds;
    prevTimeSeconds = timeInSeconds;

    GL.viewport(0, 0, CANVAS.width, CANVAS.height);
    GL.clear(GL.COLOR_BUFFER_BIT | GL.DEPTH_BUFFER_BIT);

    // Helper untuk interpolasi halus
    const smoothstep = (edge0, edge1, x) => {
      const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
      return t * t * (3 - 2 * t);
    };

    // Helper untuk fungsi interpolasi linear
    const lerp = (a, b, t) => a + (b - a) * t;

    // --- TIMELINE SHOWCASE ---
    if (isShowcaseActive) {
      const t = Math.min(timeInSeconds, showcaseDuration);

      let startT, endT, progress;

      // ====================================================================
      // PHASE 1: OPENING & ENVIRONMENT INTRO (0s - 10s)
      // Fokus ke tengah (z=0)
      // ====================================================================

      startT = 0.0;
      endT = 10.0;
      if (t < endT) {
        progress = (t - startT) / (endT - startT);
        console.log("start 360");
        // Kamerah: Zoom In & Orbit Penuh (agar menghadap tombol)
        currentCameraZ = lerp(-120.0, -30.0, smoothstep(0, 1, progress));
        THETA = lerp(0.0, Math.PI * 3.5, progress); // Rotasi 1.75 putaran
        PHI = lerp(0.1, 0.35, smoothstep(0, 1, progress));

        // Pokeball: Open (Mulai 2s, Penuh 5s)
        if (t > 2.0 && t < 5.0) {
          isOpening = true;
        } else if (t >= 5.0) {
          isOpening = true;
        } else {
          isOpening = false;
        }
      }

      // ====================================================================
      // PHASE 2: TYPHLOSION FOCUS & WALK/JUMP (10s - 20s)
      // ====================================================================

      startT = 10.0;
      endT = 20.0;
      if (t >= startT && t < endT) {
      console.log("start tp");

        progress = smoothstep(0, 1, (t - startT) / (endT - startT));

        // Kamera fokus ke Typhlosion (sudut pandang di sebelah kiri)
        currentCameraZ = lerp(-30.0, -20.0, progress);
        THETA = lerp(Math.PI * 3.5, Math.PI * 3.5 + Math.PI * 0.45, progress); // Orbit ke Typhlosion
        PHI = lerp(0.35, 0.4, progress);

        // Animasi: Typhlosion Walk (Start at 11s)
        if (t > 11.0 && t < 15.0) {
          if (!tyIsWalking) startTyphlosionWalk(-1); // Jalan ke belakang
        } else if (t >= 15.0 && t < 17.0) {
          tyIsWalking = false;
          tyWalkTimeStart = -1;
        }

        // Animasi: Typhlosion Jump (Start at 17s)
        if (t > 17.0 && t < 18.5) {
          typhlosionJump();
        }
      }

      // ====================================================================
      // PHASE 3: HISUIAN TYPHLOSION FOCUS & NOD/SHAKE/JUMP (20s - 30s)
      // ====================================================================

      startT = 20.0;
      endT = 30.0;
      if (t >= startT && t < endT) {
      console.log("start htp");

        progress = smoothstep(0, 1, (t - startT) / (endT - startT));

        // Kamera fokus ke Hisuian Typhlosion (posisi 6.5)
        currentCameraZ = lerp(-20.0, -23.0, progress);
        // THETA mengunci ke arah H-Typhlosion
        THETA = lerp(
          Math.PI * 3.5 + Math.PI * 0.45,
          Math.PI * 3.5 - Math.PI * 0.45,
          progress
        );
        PHI = lerp(0.4, 0.45, progress);

        // Animasi: H-Typhlosion Nod (Start at 22s)
        if (t > 22.0 && t < 24.0) htyphlosion.startNod();

        // Animasi: H-Typhlosion Shake (Start at 25s)
        if (t > 25.0 && t < 26.5) htyphlosion.startShake();

        // Animasi: H-Typhlosion Jump (Start at 27.5s)
        if (t > 27.5 && t < 29.0) htyphlosion.startJump();
      }

      // ====================================================================
      // PHASE 4: QUILAVA FOCUS & CRAWL (30s - 40s)
      // ====================================================================

      startT = 30.0;
      endT = 40.0;
      if (t >= startT && t < endT) {
      console.log("start q");

        progress = smoothstep(0, 1, (t - startT) / (endT - startT));

        // Kamera fokus ke Quilava (posisi 5, sudut pandang belakang)
        currentCameraZ = lerp(-23.0, -20.0, progress);
        // THETA mengunci ke arah Quilava
        THETA = lerp(
          Math.PI * 3.5 - Math.PI * 0.45,
          Math.PI * 3.5 + Math.PI * 0.15,
          progress
        );
        PHI = lerp(0.45, 0.5, progress);

        // Animasi: Quilava Crawl (Start at 32s)
        if (t > 32.0 && t < 38.0) {
          startQuilavaCrawl();
        } else {
          stopQuilavaCrawl(); // Stop crawl saat keluar dari fase
        }
      }

      // ====================================================================
      // PHASE 5: ENDING & MANUAL CONTROL (40s - 45s)
      // ====================================================================
      startT = 40.0;
      endT = 45.0;
      if (t >= startT && t < endT) {
      console.log("start end");

        progress = smoothstep(0, 1, (t - startT) / (endT - startT));
        // Transisi ke jarak manual dan sudut default
        currentCameraZ = lerp(-20.0, -50.0, progress); // Mundur Jauh
        THETA = lerp(Math.PI * 3.5 + Math.PI * 0.15, 4.0 * Math.PI, progress);
        PHI = lerp(0.5, 0.25, progress);

        // Pokeball: Close (Mulai 42s)
        if (t > 42.0) {
          isOpening = false;
        }
      }

      // --- Menerapkan Transformasi Kamera ---
      LIBS.set_I4(VIEWMATRIX);
      LIBS.translateZ(VIEWMATRIX, currentCameraZ);
      LIBS.rotateX(VIEWMATRIX, PHI);
      LIBS.rotateY(VIEWMATRIX, THETA);

      // Matikan showcase dan aktifkan kontrol manual
      if (timeInSeconds >= showcaseDuration) {
        isShowcaseActive = false;
        // Set posisi awal manual
        THETA = 4.0 * Math.PI;
        PHI = 0.25;
        currentCameraZ = -50.0;
      }
    } else {
      // Logika kontrol A/D manual (aktif setelah showcase selesai)
      if (keys.a) cameraVelocity -= rotateAccel;
      if (keys.d) cameraVelocity += rotateAccel;
      cameraVelocity *= rotateFriction;
      cameraVelocity = Math.max(-maxSpeed, Math.min(maxSpeed, cameraVelocity));
      THETA += cameraVelocity;

      LIBS.set_I4(VIEWMATRIX);
      LIBS.translateZ(VIEWMATRIX, currentCameraZ); // Gunakan Z terakhir
      LIBS.rotateX(VIEWMATRIX, PHI);
      LIBS.rotateY(VIEWMATRIX, THETA);
    }

    if (isOpening && animationProgress < 1.0)
      animationProgress = Math.min(1.0, animationProgress + animationSpeed);
    else if (!isOpening && animationProgress > 0.0)
      animationProgress = Math.max(0.0, animationProgress - animationSpeed);

    const currentOpenAngle = animationProgress * maxOpenAngle;

    terrain.animate(time * 0.001);

    // terrain.render(MOVEMATRIX);

    // === ANIMATE Typhlosion ===
    htyphlosion.animate(time);

    // animasi vertex api Typhlosion
    if (typeof ty_body.tick === "function") {
      ty_body.tick(timeInSeconds);
    }

    // --- POSISI & TILT API TYPHLOSION (BIAR MIRING KE ATAS) ---
    if (ty_body.flames) {
      LIBS.set_I4(ty_body.flames.MOVE_MATRIX);

      // sama seperti di main.js standalone kamu
      LIBS.rotateX(ty_body.flames.MOVE_MATRIX, -4.7);
      LIBS.rotateY(ty_body.flames.MOVE_MATRIX, 3);

      LIBS.translateX(ty_body.flames.MOVE_MATRIX, 0);
      LIBS.translateY(ty_body.flames.MOVE_MATRIX, 2);
      LIBS.translateZ(ty_body.flames.MOVE_MATRIX, 0.1);
    }
    // === UPDATE STATE ANIMASI TYPHLOSION ===
    // napas: selalu aktif
    const breath = Math.sin(timeInSeconds * tyBreathSpeed) * 0.4;

    // Logika Jalan Typhlosion
    let tyWalkSpeed = 5.0 / tyWalkDuration; // 5.0 adalah jarak langkah
    if (tyIsWalking && tyWalkTimeStart !== -1) {
      const walkTime = timeInSeconds - tyWalkTimeStart;

      // Hitung posisi saat ini
      const distanceMoved = walkTime * tyWalkSpeed;
      // Gunakan tyPosX asli untuk menentukan posisi awal, lalu tambahkan pergerakan
      tyPosX = -6.5 + tyWalkDirection * distanceMoved;

      // Kalau sudah mencapai langkah penuh, reset/stop
      if (walkTime >= tyWalkDuration) {
        tyPosX = -6.5 + tyWalkDirection * 5.0; // Pastikan posisi tepat di target
        tyIsWalking = false;
        tyWalkTimeStart = -1; // Reset trigger
        // Kembalikan ke posisi awal setelah showcase
        if (!isShowcaseActive) tyPosX = -6.5;
      }
    }

    // logika lompat
    let jumpOffset = 0;
    if (tyIsJumping) {
      tyJumpTime += dt;
      if (tyJumpTime >= tyJumpDuration) {
        tyIsJumping = false;
        tyJumpTime = 0;
      } else {
        const phase = (tyJumpTime / tyJumpDuration) * Math.PI;
        jumpOffset = Math.sin(phase) * tyJumpHeight;
      }
    }

    // swing kaki pas jalan
    const walkSwing = tyIsWalking ? Math.sin(timeInSeconds * 10.0) * 0.4 : 0.0;

    // HEAD (napas: naik turun dikit + sedikit nod)
    LIBS.set_I4(ty_head.MOVE_MATRIX);
    LIBS.translateY(ty_head.MOVE_MATRIX, 2.5 + breath * 0.5);
    LIBS.translateZ(ty_head.MOVE_MATRIX, 1.7);
    LIBS.rotateX(ty_head.MOVE_MATRIX, 0.1 + breath * 0.1);
    LIBS.scaleX(ty_head.MOVE_MATRIX, 1.3);
    LIBS.scaleY(ty_head.MOVE_MATRIX, 1.3);
    LIBS.scaleZ(ty_head.MOVE_MATRIX, 1.4);

    // RIGHT LEG
    LIBS.set_I4(ty_rightLeg.MOVE_MATRIX);
    LIBS.translateY(ty_rightLeg.MOVE_MATRIX, 3.0);
    LIBS.translateZ(ty_rightLeg.MOVE_MATRIX, 0.0);
    LIBS.rotateX(ty_rightLeg.MOVE_MATRIX, 0.1 + walkSwing); // ayunan kaki
    LIBS.scaleX(ty_rightLeg.MOVE_MATRIX, 1.3);
    LIBS.scaleY(ty_rightLeg.MOVE_MATRIX, 1.45);
    LIBS.scaleZ(ty_rightLeg.MOVE_MATRIX, 1.6);

    // LEFT LEG
    LIBS.set_I4(ty_leftLeg.MOVE_MATRIX);
    LIBS.translateY(ty_leftLeg.MOVE_MATRIX, 3.0);
    LIBS.translateZ(ty_leftLeg.MOVE_MATRIX, 0.0);
    LIBS.rotateX(ty_leftLeg.MOVE_MATRIX, 0.1 - walkSwing); // lawan phase kaki kanan
    LIBS.scaleX(ty_leftLeg.MOVE_MATRIX, 1.3);
    LIBS.scaleY(ty_leftLeg.MOVE_MATRIX, 1.45);
    LIBS.scaleZ(ty_leftLeg.MOVE_MATRIX, 1.6);

    // ----------------------------------------------------------

    // CAMERA

    GL.uniformMatrix4fv(_Pmatrix, false, PROJMATRIX);
    GL.uniformMatrix4fv(_Vmatrix, false, VIEWMATRIX);

    quilava_body.animate(timeInSeconds);
    quilava_body.childs.forEach((child) => {
      if (child.animate) {
        child.animate(timeInSeconds);
      }
    });

    if (typeof ty_body.tick === "function") {
      ty_body.tick(timeInSeconds);
    }

    // === RENDER OBJECTS ===
    const WORLD = LIBS.get_I4();
    shell.render(WORLD, currentOpenAngle);

    const terrainMatrix = LIBS.get_I4();
    LIBS.translateY(terrainMatrix, -shell.bandHeight / 2 + 0.1);
    terrain.render(terrainMatrix);

    // QUILAVA Model matrix
    const QUILAVA_MODEL_MATRIX = LIBS.get_I4();

    // QUILAVA Position
    LIBS.translateY(QUILAVA_MODEL_MATRIX, 6.5);
    LIBS.translateZ(QUILAVA_MODEL_MATRIX, 5);
    LIBS.scaleX(QUILAVA_MODEL_MATRIX, 1);
    LIBS.scaleY(QUILAVA_MODEL_MATRIX, 1);
    LIBS.scaleZ(QUILAVA_MODEL_MATRIX, 1);

    // QUILAVA Render
    GL.disable(GL.CULL_FACE);
    quilava_body.render(QUILAVA_MODEL_MATRIX);
    quilava_leftLeg.render(QUILAVA_MODEL_MATRIX);
    quilava_rightLeg.render(QUILAVA_MODEL_MATRIX);
    GL.enable(GL.CULL_FACE);

    const HTYPHLOSION_MODEL_MATRIX = LIBS.get_I4();
    LIBS.translateX(HTYPHLOSION_MODEL_MATRIX, 6.5);
    LIBS.translateY(HTYPHLOSION_MODEL_MATRIX, 6.5);
    LIBS.translateZ(HTYPHLOSION_MODEL_MATRIX, 5);
    LIBS.scaleX(HTYPHLOSION_MODEL_MATRIX, 1);
    LIBS.scaleY(HTYPHLOSION_MODEL_MATRIX, 1);
    LIBS.scaleZ(HTYPHLOSION_MODEL_MATRIX, 1);

    // Hisuian Typhlosion render
    GL.disable(GL.CULL_FACE);
    htyphlosion.render(HTYPHLOSION_MODEL_MATRIX);

    // === TYPHLOSION ====
    const TYPHLOSION_MODEL_MATRIX = LIBS.get_I4();

    LIBS.translateX(TYPHLOSION_MODEL_MATRIX, tyPosX);
    LIBS.translateY(
      TYPHLOSION_MODEL_MATRIX,
      tyPosY + breath * 0.3 + jumpOffset
    );
    LIBS.translateZ(TYPHLOSION_MODEL_MATRIX, tyPosZ);

    const SCALE = 0.8;
    LIBS.scaleX(TYPHLOSION_MODEL_MATRIX, SCALE);
    LIBS.scaleY(TYPHLOSION_MODEL_MATRIX, SCALE);
    LIBS.scaleZ(TYPHLOSION_MODEL_MATRIX, SCALE);

    // Render Typhlosion
    GL.disable(GL.CULL_FACE);
    ty_body.render(TYPHLOSION_MODEL_MATRIX);
    ty_head.render(TYPHLOSION_MODEL_MATRIX);
    ty_leftLeg.render(TYPHLOSION_MODEL_MATRIX);
    ty_rightLeg.render(TYPHLOSION_MODEL_MATRIX);
    GL.enable(GL.CULL_FACE);

    GL.flush();
    requestAnimationFrame(animate);
  };

  animate(0);
}

window.addEventListener("load", main);
