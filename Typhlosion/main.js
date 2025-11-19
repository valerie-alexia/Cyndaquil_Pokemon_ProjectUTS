import { BodyShape } from "./body.js";
import { HeadShape } from "./head.js";
import { ArmShape } from "./arms.js";
import { LegsShape } from "./legs.js";
import { LIBS } from "./libs.js";
// import { LIBS } from "../environment/libs.js";

function main() {
  /** @type {HTMLCanvasElement} */
  const CANVAS = document.getElementById("thisCanvas");


  function resize() {
    CANVAS.width = window.innerWidth;
    CANVAS.height = window.innerHeight;
    if (GL) GL.viewport(0, 0, CANVAS.width, CANVAS.height);
  }
  window.addEventListener("resize", resize);

  /*===================== GET WEBGL CONTEXT =====================*/
  /** @type {WebGLRenderingContext} */
  let GL;
  try {
    GL = CANVAS.getContext("webgl", { antialias: true });
    if (!GL) throw new Error("WebGL not supported");
  } catch (e) {
    alert("WebGL context cannot be initialized: " + e.message);
    return;
  }
  resize();

  /*========================= SHADERS =========================*/
  const shader_vertex_source = `
    attribute vec3 position;
    attribute vec3 color;

    uniform mat4 Pmatrix, Vmatrix, Mmatrix;
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

  const compile_shader = (source, type, typeString) => {
    const sh = GL.createShader(type);
    GL.shaderSource(sh, source);
    GL.compileShader(sh);
    if (!GL.getShaderParameter(sh, GL.COMPILE_STATUS)) {
      alert("ERROR IN " + typeString + " SHADER:\n" + GL.getShaderInfoLog(sh));
      return null;
    }
    return sh;
  };

  const shader_vertex = compile_shader(shader_vertex_source, GL.VERTEX_SHADER, "VERTEX");
  const shader_fragment = compile_shader(shader_fragment_source, GL.FRAGMENT_SHADER, "FRAGMENT");
  const SHADER_PROGRAM = GL.createProgram();
  GL.attachShader(SHADER_PROGRAM, shader_vertex);
  GL.attachShader(SHADER_PROGRAM, shader_fragment);
  GL.linkProgram(SHADER_PROGRAM);
  if (!GL.getProgramParameter(SHADER_PROGRAM, GL.LINK_STATUS)) {
    alert("Could not link shaders:\n" + GL.getProgramInfoLog(SHADER_PROGRAM));
    return;
  }
  GL.useProgram(SHADER_PROGRAM);

  const _position = GL.getAttribLocation(SHADER_PROGRAM, "position");
  const _color    = GL.getAttribLocation(SHADER_PROGRAM, "color");
  GL.enableVertexAttribArray(_position);
  GL.enableVertexAttribArray(_color);

  const _Pmatrix = GL.getUniformLocation(SHADER_PROGRAM, "Pmatrix");
  const _Vmatrix = GL.getUniformLocation(SHADER_PROGRAM, "Vmatrix");
  const _Mmatrix = GL.getUniformLocation(SHADER_PROGRAM, "Mmatrix");

  /*======================== THE SHAPES ========================*/
  // === BODY (root)
  const body = new BodyShape(GL, SHADER_PROGRAM, _position, _color, _Mmatrix);
  body.setup();

  // === HEAD === (jadikan child body + posisikan di puncak torso)
  const head = new HeadShape(GL, SHADER_PROGRAM, _position, _color, _Mmatrix);
  head.setup();
  body.childs.push(head);

    // ====== MATRIX DASAR KEPALA (relatif ke body) ======
  const HEAD_SCALE = 1.2;   // sama seperti versi mat4
  const HEAD_TILT  = 0.4;  // nunduk dikit
  const HEAD_UP    = 2.6;   // naik ke atas badan
  const HEAD_FWD   = 1.2; // sedikit maju ke depan

  let HEAD_BASE = LIBS.get_I4();

  const HS  = LIBS.scale(HEAD_SCALE, HEAD_SCALE * 0.96, HEAD_SCALE);
  const HRx = LIBS.get_I4();  LIBS.rotateX(HRx, HEAD_TILT);
  const HT  = LIBS.translate(0, HEAD_UP, HEAD_FWD);

  HEAD_BASE = LIBS.multiply(HEAD_BASE, HS);   // scale dulu
  HEAD_BASE = LIBS.multiply(HEAD_BASE, HRx);  // lalu tilt
  HEAD_BASE = LIBS.multiply(HEAD_BASE, HT);   // lalu geser ke atas badan

  

  // === ARMS ===
  const rightArm = new ArmShape(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, +1);
  rightArm.setup();
  const leftArm  = new ArmShape(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, -1);
  leftArm.setup();
  body.childs.push(rightArm, leftArm);

  // === LEGS ===
  const { minY } = body.getBoundsY();      
  const legY = minY + 5.5;                
  const legZ = 0.5;                       
  const legX = 0.3;                       // misahkan kaki

  const rightLeg = new LegsShape(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, +1);
  rightLeg.setup();
  LIBS.set_position(rightLeg.MOVE_MATRIX, +legX, legY, legZ);

  const leftLeg  = new LegsShape(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, -1);
  leftLeg.setup();
  LIBS.set_position(leftLeg.MOVE_MATRIX, -legX, legY, legZ);

  body.childs.push(rightLeg, leftLeg);

  /*===================== CAMERA / MATRICES =====================*/
  const PROJMATRIX = LIBS.get_projection(40, CANVAS.width / CANVAS.height, 1, 100);
  const VIEWMATRIX = LIBS.get_I4();
  const MOVEMATRIX = LIBS.get_I4();

  LIBS.translateZ(VIEWMATRIX, -20); 
  LIBS.translateY(VIEWMATRIX, -0.5); 



  /*======================== CONTROLS ========================*/
  let THETA = 0, PHI = 0;
  let drag = false;
  let x_prev = 0, y_prev = 0;
  let dX = 0, dY = 0;
  const FRICTION = 0.08;
  const MOUSE_SENS = 0.30;
  const KEY_SPEED = 0.05;

  function mouseDown(e) {
    drag = true;
    x_prev = e.pageX;
    y_prev = e.pageY;
    e.preventDefault();
  }
  function mouseUp()  { drag = false; }
  function mouseMove(e) {
    if (!drag) return;
    dX = -(e.pageX - x_prev) * 2 * Math.PI / CANVAS.width  * MOUSE_SENS;
    dY = -(e.pageY - y_prev) * 2 * Math.PI / CANVAS.height * MOUSE_SENS;
    THETA += dX;
    PHI   += dY;
    x_prev = e.pageX;
    y_prev = e.pageY;
    e.preventDefault();
  }
  CANVAS.addEventListener("mousedown", mouseDown, false);
  CANVAS.addEventListener("mouseup", mouseUp, false);
  CANVAS.addEventListener("mouseout", mouseUp, false);
  CANVAS.addEventListener("mousemove", mouseMove, false);

  // WASD key
  function keyDown(e) {
    if (e.key === "w") dY -= KEY_SPEED;
    else if (e.key === "s") dY += KEY_SPEED;
    else if (e.key === "a") dX -= KEY_SPEED;
    else if (e.key === "d") dX += KEY_SPEED;

    
    else if (e.key === "1") ANIM_MODE = "idle";
    else if (e.key === "2") ANIM_MODE = "walk";
    else if (e.code === "Space") {  // lompattt
      e.preventDefault();          
      if (isGrounded) {
        vy = 1.5;                    
        ANIM_MODE = "jump";        
        isGrounded = false;
      
      }
    }

  }
  window.addEventListener("keydown", keyDown, false);



  /*========================= ANIMATION STATE =========================*/
  let ANIM_MODE = "idle"; // "idle" / "walk"
  // == buat lompat ==========
  let vy = 0;
  let yOffset = 0;
  const gravity = -9.8 * 0.3; //buat jarak lompat ke atas
  let isGrounded = true;
  let dampingLand = 0.05;
  let lastTime = performance.now();
  // ==========

  const TAU = Math.PI * 2;
  const S = (t, hz, phase = 0) => Math.sin(TAU * hz * t + phase);
  const tStart = performance.now();

  /*========================= DRAWING =========================*/
  GL.enable(GL.DEPTH_TEST);
  GL.depthFunc(GL.LEQUAL);
  GL.clearColor(0.0, 0.0, 0.0, 1.0);
  GL.clearDepth(1.0);

  function animate() {
  GL.viewport(0, 0, CANVAS.width, CANVAS.height);
  GL.clear(GL.COLOR_BUFFER_BIT | GL.DEPTH_BUFFER_BIT);

  // update matrices
  GL.uniformMatrix4fv(_Pmatrix, false, PROJMATRIX);
  GL.uniformMatrix4fv(_Vmatrix, false, VIEWMATRIX);
  GL.uniformMatrix4fv(_Mmatrix, false, MOVEMATRIX);

  LIBS.set_I4(MOVEMATRIX);
  LIBS.rotateY(MOVEMATRIX, THETA);
  LIBS.rotateX(MOVEMATRIX, PHI);

  if (!drag) {
    dX *= (1 - FRICTION);
    dY *= (1 - FRICTION);
    THETA += dX;
    PHI   += dY;
  }

  // === waktu realtime (dt) ===
  const now = performance.now();
  const dt = Math.min(0.02, (now - lastTime) * 1); // clamp dt biar stabil
  lastTime = now;
  const t = (now - tStart) * 0.001;

  // ====== RESET base pose per-frame ======
  LIBS.set_I4(body.MOVE_MATRIX);
  LIBS.translateZ(body.MOVE_MATRIX, 0.35);

  // LIBS.set_I4(head.MOVE_MATRIX);
  head.MOVE_MATRIX = LIBS.clone(HEAD_BASE);

  LIBS.set_I4(rightArm.MOVE_MATRIX);
  LIBS.set_I4(leftArm.MOVE_MATRIX);

  LIBS.set_I4(rightLeg.MOVE_MATRIX);
  LIBS.set_position(rightLeg.MOVE_MATRIX, +legX, legY, legZ);
  LIBS.set_I4(leftLeg.MOVE_MATRIX);
  LIBS.set_position(leftLeg.MOVE_MATRIX, -legX, legY, legZ);

  // ====== MODES ======
  if (ANIM_MODE === "idle") { //breath
    const breatheHz = 0.30;
    const bob = 0.10 * Math.sin(2*Math.PI*breatheHz*t);
    const bend = 0.03 * Math.sin(2*Math.PI*breatheHz*t + 0.5);

    LIBS.translateY(body.MOVE_MATRIX, bob);
    LIBS.rotateX(body.MOVE_MATRIX, bend);

    const nod = 0.06 * Math.sin(2*Math.PI*breatheHz*1.25*t + 0.6);
    LIBS.translateY(head.MOVE_MATRIX, bob * 0.6);
    LIBS.rotateX(head.MOVE_MATRIX, nod);

    const armSwing = 0.20 * Math.sin(2*Math.PI*0.45*t);
    LIBS.rotateZ(rightArm.MOVE_MATRIX,  armSwing);
    LIBS.rotateZ(leftArm .MOVE_MATRIX, -armSwing);

    const knee = 0.10 * Math.sin(2*Math.PI*0.45*t + Math.PI);
    LIBS.rotateX(rightLeg.MOVE_MATRIX,  knee * 0.3);
    LIBS.rotateX(leftLeg .MOVE_MATRIX, -knee * 0.3);

  }  else if (ANIM_MODE === "walk") {
  const walkHz = 1.4;

  const stride = 0.2;         
  const stepTrans = 0.15;      

  // body bob + lean ringan
  LIBS.translateY(body.MOVE_MATRIX, 0.08 * Math.abs(Math.sin(2*Math.PI*walkHz*0.5*t)) + 0.02);
  LIBS.rotateX(body.MOVE_MATRIX, -0.05 + 0.02 * Math.sin(2*Math.PI*walkHz*0.5*t));

  // head ikut sedikit stabilizer
  LIBS.rotateX(head.MOVE_MATRIX, 0.03 * Math.sin(2*Math.PI*walkHz*0.5*t + Math.PI));

  // ayunan tangan dan kaki
  LIBS.rotateX(rightArm.MOVE_MATRIX,  +stride * Math.sin(2*Math.PI*walkHz*t));
  LIBS.rotateX(leftArm .MOVE_MATRIX,  -stride * Math.sin(2*Math.PI*walkHz*t));

  LIBS.rotateX(rightLeg.MOVE_MATRIX,  -stride * Math.sin(2*Math.PI*walkHz*t));
  LIBS.rotateX(leftLeg .MOVE_MATRIX,  +stride * Math.sin(2*Math.PI*walkHz*t));

  // langkah kecil
  LIBS.translateZ(rightLeg.MOVE_MATRIX,  stepTrans * Math.sin(2*Math.PI*walkHz*t));
  LIBS.translateZ(leftLeg .MOVE_MATRIX, -stepTrans * Math.sin(2*Math.PI*walkHz*t));


  } else if (ANIM_MODE === "jump") {
    // integrasi fisika pakai dt
    vy += gravity * dt;
    yOffset += vy * dt;

    // tilt ringan berdasar kecepatan 
    const tilt = Math.max(-0.25, Math.min(0.1, -vy * 0.2));
    LIBS.rotateX(body.MOVE_MATRIX, tilt);

    // terapkan offset Y ke badan
    LIBS.translateY(body.MOVE_MATRIX, yOffset);

    // landing
    if (yOffset <= 0) {
      yOffset = 0;
      vy = 10;
      isGrounded = true;

      // efek "injak" kecil saat mendarat
      LIBS.rotateX(body.MOVE_MATRIX, -dampingLand);

      ANIM_MODE = "idle";
      // console.log("LAND");
    }
  }

  // update animasi api (FlameFan) di dalam body
if (typeof body.tick === "function") {
  body.tick(t);
}
// === Update posisi flame agar bisa diatur manual ===

    if (body.flames) {
            
      LIBS.set_I4(body.flames.MOVE_MATRIX);

      LIBS.rotateX(body.flames.MOVE_MATRIX, -4.7);
      LIBS.rotateY(body.flames.MOVE_MATRIX, 3)
  
      LIBS.translateX(body.flames.MOVE_MATRIX, 0)
      LIBS.translateY(body.flames.MOVE_MATRIX, 2)
      LIBS.translateZ(body.flames.MOVE_MATRIX, 0.3)
    }



  body.render(MOVEMATRIX);
  GL.flush();
  requestAnimationFrame(animate);
}

  animate();
}


window.addEventListener("load", main);
