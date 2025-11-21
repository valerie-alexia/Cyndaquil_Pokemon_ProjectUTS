import { mat4, vec3 } from "https://cdn.jsdelivr.net/npm/gl-matrix@3.4.3/esm/index.js";
import { HeadShape } from "./cyndaquil_head.js";
import { BodyShape } from "./cyndaquil_body.js";
import { LegsShape } from "./cyndaquil_legs.js";
import { FlameShape } from "./cyndaquil_flame.js";
import { ArmsShape } from "./cyndaquil_arms.js";


const LIBS = {
   translateY: (matrix, amount) => {
       mat4.translate(matrix, matrix, [0, amount, 0]);
   },
   translateX: (matrix, amount) => {
       mat4.translate(matrix, matrix, [amount, 0, 0]);
   },
   translateZ: (matrix, amount) => {
       mat4.translate(matrix, matrix, [0, 0, amount]);
   },
   get_I4: () => mat4.create(),
   multiply: (A, B) => {
       const temp = mat4.clone(A);
       mat4.multiply(A, temp, B);
   },
   lerp: (start, end, t) => start * (1 - t) + end * t,
};




function main() {
   /** @type {HTMLCanvasElement} */
   var CANVAS = document.getElementById("mycanvas");


   const DPR = window.devicePixelRatio || 1;
   CANVAS.width = Math.floor(window.innerWidth * DPR);
   CANVAS.height = Math.floor(window.innerHeight * DPR);
   CANVAS.style.width = window.innerWidth + "px";
   CANVAS.style.height = window.innerHeight + "px";


   let GL = CANVAS.getContext("webgl", { antialias: true });
   if (!GL) {
       alert("WebGL not supported");
       return;
   }


   /*========================= SHADERS =========================*/
   const vertexShaderSrc = `
       attribute vec3 position;
       attribute vec3 color;
       varying vec3 vColor;


       uniform mat4 Pmatrix;
       uniform mat4 Vmatrix;
       uniform mat4 Mmatrix;


       void main(void) {
           gl_Position = Pmatrix * Vmatrix * Mmatrix * vec4(position, 1.0);
           vColor = color;
       }`;


   const fragmentShaderSrc = `
       precision mediump float;
       varying vec3 vColor;
       void main(void) {
           gl_FragColor = vec4(vColor, 1.0);
       }`;


   function compileShader(src, type) {
       const shader = GL.createShader(type);
       GL.shaderSource(shader, src);
       GL.compileShader(shader);
       if (!GL.getShaderParameter(shader, GL.COMPILE_STATUS)) {
           console.error(GL.getInfoLog(shader));
       }
       return shader;
   }


   const vs = compileShader(vertexShaderSrc, GL.VERTEX_SHADER);
   const fs = compileShader(fragmentShaderSrc, GL.FRAGMENT_SHADER);
   const SHADER_PROGRAM = GL.createProgram();
   GL.attachShader(SHADER_PROGRAM, vs);
   GL.attachShader(SHADER_PROGRAM, fs);
   GL.linkProgram(SHADER_PROGRAM);
   GL.useProgram(SHADER_PROGRAM);


   const _position = GL.getAttribLocation(SHADER_PROGRAM, "position");
   const _color = GL.getAttribLocation(SHADER_PROGRAM, "color");
   const _Pmatrix = GL.getUniformLocation(SHADER_PROGRAM, "Pmatrix");
   const _Vmatrix = GL.getUniformLocation(SHADER_PROGRAM, "Vmatrix");
   const _Mmatrix = GL.getUniformLocation(SHADER_PROGRAM, "Mmatrix");


   GL.enableVertexAttribArray(_position);
   GL.enableVertexAttribArray(_color);


   /*======================== CREATE SHAPES ========================*/
  
   const body = new BodyShape(GL, SHADER_PROGRAM, _position, _color, _Mmatrix);
   const head = new HeadShape(GL, SHADER_PROGRAM, _position, _color, _Mmatrix);


   LIBS.translateY(head.POSITION_MATRIX, -0.8);
   LIBS.translateX(head.POSITION_MATRIX, 7.0);


   const rightLeg = new LegsShape(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, 1);
   const leftLeg = new LegsShape(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, -1);


   const flame = new FlameShape(GL, SHADER_PROGRAM, _position, _color, _Mmatrix);
  
   const FLAME_STATIC_Z = -0.4;
  
   LIBS.translateY(flame.POSITION_MATRIX, -1.2);
   LIBS.translateX(flame.POSITION_MATRIX, 3.2);
   LIBS.translateZ(flame.POSITION_MATRIX, FLAME_STATIC_Z);


   const FLAME_TILT_RIGHT = 30 * Math.PI / 180;
   mat4.rotateY(flame.POSITION_MATRIX, flame.POSITION_MATRIX, FLAME_TILT_RIGHT);




   const rightArm = new ArmsShape(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, 1);
   const leftArm = new ArmsShape(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, -1);


   const ARM_LIFT = 2.0;
   const ARM_FORWARD = 4.0;


   LIBS.translateY(rightArm.POSITION_MATRIX, ARM_LIFT);
   LIBS.translateY(leftArm.POSITION_MATRIX, ARM_LIFT);


   LIBS.translateX(rightArm.POSITION_MATRIX, ARM_FORWARD);
   LIBS.translateX(leftArm.POSITION_MATRIX, ARM_FORWARD);


   body.childs.push(head);
   body.childs.push(rightLeg);
   body.childs.push(leftLeg);
   body.childs.push(flame);
   body.childs.push(rightArm);
   body.childs.push(leftArm);
  
   if (typeof body.setup === 'function') {
       body.setup();
   }




   /*====================== MATRIX UTILITIES ======================*/
   function identityMatrix() {
       return new Float32Array([
           1,0,0,0,
           0,1,0,0,
           0,0,1,0,
           0,0,0,1
       ]);
   }


   function multiplyMatrix(a, b) {
       const r = new Float32Array(16);
       for (let i = 0; i < 4; i++) {
           for (let j = 0; j < 4; j++) {
               r[i * 4 + j] =
                   a[i * 4 + 0] * b[0 * 4 + j] +
                   a[i * 4 + 1] * b[1 * 4 + j] +
                   a[i * 4 + 2] * b[2 * 4 + j] +
                   a[i * 4 + 3] * b[3 * 4 + j];
           }
       }
       return r;
   }


   function rotateXMatrix(angle) {
       const c = Math.cos(angle), s = Math.sin(angle);
       return new Float32Array([
           1,0,0,0,
           0,c,-s,0,
           0,s,c,0,
           0,0,0,1
       ]);
   }


   function rotateYMatrix(angle) {
       const c = Math.cos(angle), s = Math.sin(angle);
       return new Float32Array([
           c,0,s,0,
           0,1,0,0,
           -s,0,c,0,
           0,0,0,1
       ]);
   }


   function translateMatrix(x, y, z) {
       return new Float32Array([
           1,0,0,0,
           0,1,0,0,
           0,0,1,0,
           x,y,z,1
       ]);
   }


   /*====================== MATRICES ======================*/
   const aspect = window.innerWidth / window.innerHeight;
   const fov = 40 * Math.PI / 180;
   const near = 1;
   const far = 100;
   const f = 1 / Math.tan(fov / 2);
   const rangeInv = 1 / (near - far);
   const PROJMATRIX = new Float32Array([
       f / aspect, 0, 0, 0,
       0, f, 0, 0,
       0, 0, (near + far) * rangeInv, -1,
       0, 0, near * far * rangeInv * 2, 0
   ]);
   let VIEWMATRIX = translateMatrix(0, 0, -30);


   /*====================== MOUSE CONTROL ======================*/
   let THETA = 0, PHI = 0;
   let dragging = false;
   let x_prev = 0, y_prev = 0;


   CANVAS.addEventListener("mousedown", e => {
       dragging = true;
       x_prev = e.pageX;
       y_prev = e.pageY;
   });
   CANVAS.addEventListener("mouseup", () => dragging = false);
   CANVAS.addEventListener("mouseout", () => dragging = false);
   CANVAS.addEventListener("mousemove", e => {
       if (!dragging) return;
       const dx = (e.pageX - x_prev) * 0.01;
       const dy = (e.pageY - y_prev) * 0.01;
       THETA += dx;
       PHI += dy;
       x_prev = e.pageX;
       y_prev = e.pageY;
   });


   /*=================== ANIMATION PARAMETERS ===================*/
   const BREATHING_SPEED = 4.0;        
   const SUBTLE_BOB_AMPLITUDE = 0.1;   


   const ZERO_ROTATION = identityMatrix();
  
   /*================== MANUAL HEAD CONTROL (ANIMASI) ==================*/
   let currentHeadRotationY = 0;
   let targetHeadRotationY = 0;
   const MAX_HEAD_TURN = Math.PI / 6.0;
   const LERP_SPEED = 0.1;
   const EPSILON = 0.005;


   /*================== JUMP CONTROL ==================*/
   let isJumping = false;
   let jumpTime = 0;
   const JUMP_DURATION = 30;
   const JUMP_HEIGHT = 5.0;
  
   /*================== FLAME SCALING CONTROL ==================*/
   const FLAME_SCALE_NORMAL = 1.0;
   const FLAME_SCALE_MIN = 0.0;
   const FLAME_SCALE_MAX = 1.5;
   let currentFlameScale = FLAME_SCALE_NORMAL;
   let flameScaleTarget = FLAME_SCALE_NORMAL;
   const FLAME_LERP_SPEED = 0.15;


   let manualScaleTarget = FLAME_SCALE_NORMAL;


   window.addEventListener("keydown", e => {
       const key = (e.key || "").toLowerCase();


       // 1. Logic Head Turn
       if (key === 'a' || key === 'arrowleft') {
           targetHeadRotationY = -MAX_HEAD_TURN;
           e.preventDefault();
       } else if (key === 'd' || key === 'arrowright') {
           targetHeadRotationY = MAX_HEAD_TURN;
           e.preventDefault();
       } else if (key === 's') {
           targetHeadRotationY = 0;
           e.preventDefault();
      
       // 2. Logic Jump
       } else if (e.code === 'Space' && !isJumping) {
           isJumping = true;
           jumpTime = 0;

           flameScaleTarget = FLAME_SCALE_MIN;
           e.preventDefault();
      
       } else if (!isJumping) {
           if (key === 'e') {
               manualScaleTarget = FLAME_SCALE_MAX;
           } else if (key === 'q') {
               manualScaleTarget = FLAME_SCALE_MIN;
           } else if (key === 't') {
               manualScaleTarget = FLAME_SCALE_NORMAL;
           }
           flameScaleTarget = manualScaleTarget;
          
           if (key === 'e' || key === 'q' || key === 't') {
                e.preventDefault();
           }
       }
   });
  
   /*========================= RENDER LOOP =========================*/
   GL.enable(GL.DEPTH_TEST);
   GL.depthFunc(GL.LEQUAL);
   GL.clearColor(0.0, 0.0, 0.0, 1.0);


   let time = 0;


   function animate() {
       GL.clear(GL.COLOR_BUFFER_BIT | GL.DEPTH_BUFFER_BIT);


       let rotY = rotateYMatrix(THETA);
       let rotX = rotateXMatrix(PHI);
       let viewRot = multiplyMatrix(rotY, rotX);
       let finalView = multiplyMatrix(viewRot, VIEWMATRIX);


       GL.uniformMatrix4fv(_Pmatrix, false, PROJMATRIX);
       GL.uniformMatrix4fv(_Vmatrix, false, finalView);


       time += 0.03;
      
       currentHeadRotationY = LIBS.lerp(currentHeadRotationY, targetHeadRotationY, LERP_SPEED);


       if (Math.abs(currentHeadRotationY - targetHeadRotationY) < EPSILON && targetHeadRotationY !== 0) {
            targetHeadRotationY = 0;
       }
      
       mat4.copy(head.MOVE_MATRIX, rotateYMatrix(currentHeadRotationY));


       let jumpOffset = 0;
       if (isJumping) {
           jumpTime++;
           const t_norm = jumpTime / JUMP_DURATION;
          
           jumpOffset = (-4 * t_norm * t_norm + 4 * t_norm) * JUMP_HEIGHT;
          
           if (jumpTime >= JUMP_DURATION) {
               isJumping = false;
               jumpTime = 0;
               jumpOffset = 0;
               flameScaleTarget = manualScaleTarget;
           }
       }
  
       currentFlameScale = LIBS.lerp(currentFlameScale, flameScaleTarget, FLAME_LERP_SPEED);
      
       const flameScaleMatrix = mat4.create();
       mat4.scale(flameScaleMatrix, flameScaleMatrix, [currentFlameScale, currentFlameScale, currentFlameScale]);
       mat4.copy(flame.MOVE_MATRIX, flameScaleMatrix);


       const bobY = isJumping ? 0 : Math.sin(time * BREATHING_SPEED) * SUBTLE_BOB_AMPLITUDE;
       const bodyTranslationY = bobY + jumpOffset;
       let baseMatrix = translateMatrix(0, bodyTranslationY, 0);


       const walkSpeed = 3.0;
       const walkAmplitude = 0.7;
       const limbAngle = isJumping ? 0 : Math.sin(time * walkSpeed) * walkAmplitude;


       if (rightLeg && rightLeg.setRotation) rightLeg.setRotation(limbAngle);
       if (leftLeg && leftLeg.setRotation) leftLeg.setRotation(-limbAngle);
       if (rightArm && rightArm.setRotation) rightArm.setRotation(-limbAngle * 0.6);
       if (leftArm && leftArm.setRotation) leftArm.setRotation(limbAngle * 0.6);
      
       // === Render ===
       body.render(baseMatrix);


       requestAnimationFrame(animate);
   }


   animate();


   window.addEventListener("resize", () => {
       const DPR = window.devicePixelRatio || 1;
       CANVAS.width = Math.floor(window.innerWidth * DPR);
       CANVAS.height = Math.floor(window.innerHeight * DPR);
       CANVAS.style.width = window.innerWidth + "px";
       CANVAS.style.height = window.innerHeight + "px";
       GL.viewport(0, 0, CANVAS.width, CANVAS.height);
   });
}
window.addEventListener("load", main);