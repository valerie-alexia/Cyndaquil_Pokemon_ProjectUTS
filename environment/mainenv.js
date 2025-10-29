// mainenv.js
import { LIBS } from "./libs.js";
import { PokeballShell } from "./pokeballshell.js";
import { Terrain } from "./terrain.js";

// ADD THESE NEW IMPORTS
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
  const shell = new PokeballShell(GL, SHADER_PROGRAM, _position, _color, _Mmatrix);
  const terrain = new Terrain(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, shell.radius);
  shell.setup();
  terrain.setup();

  // Create Quilava Parts
  var quilava_body = new BodyShape(GL, SHADER_PROGRAM, _position, _color, _Mmatrix);
  var quilava_head = new HeadShape(GL, SHADER_PROGRAM, _position, _color, _Mmatrix);
  var quilava_rightArm = new ArmShape(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, +1);
  var quilava_leftArm = new ArmShape(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, -1);
  var quilava_leftLeg = new LegsShape(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, +1);
  var quilava_rightLeg = new LegsShape(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, -1);

  // Setup Quilava Parts
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
  // Note: Just like in your Quilava/main.js, the legs are NOT children of the body
  
  // === MATRICES ===
  const PROJMATRIX = LIBS.get_projection(40, CANVAS.width / CANVAS.height, 1, 100);
  const VIEWMATRIX = LIBS.get_I4();

  // === CAMERA STATE ===
  let THETA = 0.0;
  let PHI = 0.25;
  let cameraVelocity = 0;
  const rotateAccel = 0.002;
  const rotateFriction = 0.9;
  const maxSpeed = 0.03;
  const keys = { a: false, d: false };

  // === KEYBOARD EVENTS ===
  window.addEventListener("keydown", (e) => {
    if (e.key === "a" || e.key === "A") keys.a = true;
    if (e.key === "d" || e.key === "D") keys.d = true;
    if (e.key === "r" || e.key === "R") {
      THETA = 0;
      PHI = 0.3;
      cameraVelocity = 0;
    }
    if (e.key === 'c' || e.key === 'C') {
        quilava_body.toggleCrawlState(); 
        // Propagate to children (head and arms)
        quilava_body.childs.forEach(child => {
            if (child.toggleCrawlState) {
                child.toggleCrawlState(); 
            }
        });
        // Note: Quilava's legs don't have a crawl animation, so we don't call it for them
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
    GL.viewport(0, 0, CANVAS.width, CANVAS.height);
    GL.clear(GL.COLOR_BUFFER_BIT | GL.DEPTH_BUFFER_BIT);

    // Smooth horizontal rotation
    if (keys.a) cameraVelocity -= rotateAccel;
    if (keys.d) cameraVelocity += rotateAccel;
    cameraVelocity *= rotateFriction;
    cameraVelocity = Math.max(-maxSpeed, Math.min(maxSpeed, cameraVelocity));
    THETA += cameraVelocity;

    // Open/close animation
    if (isOpening && animationProgress < 1.0)
      animationProgress = Math.min(1.0, animationProgress + animationSpeed);
    else if (!isOpening && animationProgress > 0.0)
      animationProgress = Math.max(0.0, animationProgress - animationSpeed);

    const currentOpenAngle = animationProgress * maxOpenAngle;

    // CAMERA
    LIBS.set_I4(VIEWMATRIX);
    LIBS.translateZ(VIEWMATRIX, -80);
    LIBS.rotateX(VIEWMATRIX, PHI);
    LIBS.rotateY(VIEWMATRIX, THETA);

    GL.uniformMatrix4fv(_Pmatrix, false, PROJMATRIX);
    GL.uniformMatrix4fv(_Vmatrix, false, VIEWMATRIX);

    quilava_body.animate(timeInSeconds);
    // The body's animate call will call its children (head, arms)
    // We also need to animate the legs separately
    // quilava_leftLeg.animate(timeInSeconds); // (Legs don't have animation, but good practice)
    // quilava_rightLeg.animate(timeInSeconds); // (Legs don't have animation, but good practice)

    // === RENDER OBJECTS ===
    const WORLD = LIBS.get_I4();
    shell.render(WORLD, currentOpenAngle);

    const terrainMatrix = LIBS.get_I4();
    LIBS.translateY(terrainMatrix, -shell.bandHeight / 2 + 0.1);
    terrain.render(terrainMatrix);

    // 1. Create a model matrix for Quilava
    const QUILAVA_MODEL_MATRIX = LIBS.get_I4();

    // 2. Position Quilava
    // Based on my calculation, Quilava's feet are at y = -5.91 in its local space.
    // The terrain is at y = -1.025.
    // So we need to translate Quilava up by (5.91 - 1.025) = 4.885
    LIBS.translateY(QUILAVA_MODEL_MATRIX, 4.885);
    
    // Let's also move him forward a bit so he's not at the center
    LIBS.translateZ(QUILAVA_MODEL_MATRIX, 5);

    // And make him a bit smaller to fit
    LIBS.scaleX(QUILAVA_MODEL_MATRIX, 0.5);
    LIBS.scaleY(QUILAVA_MODEL_MATRIX, 0.5);
    LIBS.scaleZ(QUILAVA_MODEL_MATRIX, 0.5);


    // 3. Render Quilava (just like in Quilava/main.js)
    quilava_body.render(QUILAVA_MODEL_MATRIX);
    quilava_leftLeg.render(QUILAVA_MODEL_MATRIX);
    quilava_rightLeg.render(QUILAVA_MODEL_MATRIX)

    GL.flush();
    requestAnimationFrame(animate);
  };

  animate(0);
}

window.addEventListener("load", main);
