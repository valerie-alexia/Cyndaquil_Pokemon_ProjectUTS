import { HeadShape } from "./head.js";
import { BodyShape } from "./body.js";
import { ArmShape } from "./arms.js";
import { LegsShape } from "./legs.js";
import { FlameCollar } from "./flame.js";

function main() {
    /** @type {HTMLCanvasElement} */
    var CANVAS = document.getElementById("thisCanvas");
    CANVAS.width = window.innerWidth;
    CANVAS.height = window.innerHeight;


    /*===================== GET WEBGL CONTEXT ===================== */
    /** @type {WebGLRenderingContext} */
    var GL;
    try {
        GL = CANVAS.getContext("webgl", { antialias: true });
    } catch (e) {
        alert("WebGL context cannot be initialized");
        return false;
    }


    /*========================= SHADERS ========================= */
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
        var shader = GL.createShader(type);
        GL.shaderSource(shader, source);
        GL.compileShader(shader);
        if (!GL.getShaderParameter(shader, GL.COMPILE_STATUS)) {
            alert("ERROR IN " + typeString + " SHADER: " + GL.getShaderInfoLog(shader));
            return false;
        }
        return shader;
    };
    var shader_vertex = compile_shader(shader_vertex_source, GL.VERTEX_SHADER, "VERTEX");
    var shader_fragment = compile_shader(shader_fragment_source, GL.FRAGMENT_SHADER, "FRAGMENT");


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

    GL.useProgram(SHADER_PROGRAM);


    /*======================== THE SHAPES ======================== */

    // HEAD
    var head = new HeadShape(GL, SHADER_PROGRAM, _position, _color, _Mmatrix);
    head.setup();

    // BODY
    var body = new BodyShape(GL, SHADER_PROGRAM, _position, _color, _Mmatrix);
    body.setup();

    // ARMS (left and right)
    var rightArm = new ArmShape(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, +1);
    rightArm.setup();
    var leftArm = new ArmShape(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, -1);
    leftArm.setup();

    var leftLeg = new LegsShape(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, +1);
    leftLeg.setup();
    var rightLeg = new LegsShape(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, -1);
    rightLeg.setup();

    var flameCollar = new FlameCollar(GL, SHADER_PROGRAM, _position, _color, _Mmatrix);
    flameCollar.setup();
    body.childs.push(head);
    body.childs.push(rightArm);
    body.childs.push(leftArm);
    body.childs.push(leftLeg);
    body.childs.push(rightLeg);
    body.childs.push(flameCollar);

    var PROJMATRIX = LIBS.get_projection(40, CANVAS.width / CANVAS.height, 1, 100);
    var MOVEMATRIX = LIBS.get_I4();
    var VIEWMATRIX = LIBS.get_I4();

    LIBS.translateZ(VIEWMATRIX, -20);


    /*======================== MOVEMENT ======================== */
    var THETA = 0, PHI = 0;
    var drag = false;
    var x_prev, y_prev;
    var FRICTION = 0.05;
    var dX = 0, dY = 0;

    var mouseDown = function (e) {
        drag = true;
        x_prev = e.pageX, y_prev = e.pageY;
        e.preventDefault();
        return false;
    };

    var mouseUp = function (e) {
        drag = false;
    };

    let sensitivity = 0.3;
    var mouseMove = function (e) {
        if (!drag) return false;
        dX = -(e.pageX - x_prev) * 2 * Math.PI / CANVAS.width * sensitivity;
        dY = -(e.pageY - y_prev) * 2 * Math.PI / CANVAS.height * sensitivity;
        THETA += dX;
        PHI += dY;
        x_prev = e.pageX, y_prev = e.pageY;
        e.preventDefault();
    };

    CANVAS.addEventListener("mousedown", mouseDown, false);
    CANVAS.addEventListener("mouseup", mouseUp, false);
    CANVAS.addEventListener("mouseout", mouseUp, false);
    CANVAS.addEventListener("mousemove", mouseMove, false);

    /*================ DEFINE ANIMATION VARIABLES =============== */
    var SPEED = 0.05;

    var nod = false;
    let nodStartTime = 0;
    const nodDuration = 1000;

    var shakeHead = false;
    let shakeStartTime = 0;
    const shakeDuration = 1000;

    let isJumping = false;
    let jumpStartTime = 0;
    const jumpDuration = 800; // Durasi lompat (ms)
    const jumpHeight = 3.0;   // Ketinggian lompat
    let jumpProgress = 0; // 0 mulai, 1 selesai 


    const breathSpeed = 0.001;
    const breathScaleAmount = 0.001;


    let isRotatingArb = false;
    let rotateArbStartTime = 0;
    const rotateArbDuration = 1000;
    const rotateArbSpeed = 0.002;
    const rotateAxis = [0, 1, 1];
    const shoulderPivot = [0.0, 0.7, 0.0];

    // Fungsi Easing Sederhana
    function easeInOutQuad(t) {
        return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    }
    // Fungsi Interpolasi Linear (Lerp)
    function lerp(start, end, t) {
        return start * (1 - t) + end * t;
    }

    var isAnyAnimationRunning = () => nod || shakeHead || isJumping;

    var keyDown = function (e) {
        if (e.key === 'w') {
            dY -= SPEED;
        }
        else if (e.key === 'a') {
            dX -= SPEED;
        }
        else if (e.key === 's') {
            dY += SPEED;
            // Animasi Shake Head
        }
        else if (e.key === 'd') {
            dX += SPEED;
            // Animasi Dab
        }
        else if (e.key === 'n') {
            // Animasi Nod
            nod = true;
            nodStartTime = performance.now();
        }
        else if (e.key === 'm') {
            // Animasi Shake head
            shakeHead = true;
            shakeStartTime = performance.now();
        }
        else if (e.key === 'Space' || e.key === ' ') {
            // if (!isAnyAnimationRunning) {
            isJumping = true;
            jumpProgress = 0;
            jumpStartTime = performance.now();
            // }
        }
        else if (e.key === 'e') {
            isRotatingArb = true;
            rotateArbStartTime = performance.now();
        }

    };

    window.addEventListener("keydown", keyDown, false);


    /*========================= DRAWING ========================= */
    GL.enable(GL.DEPTH_TEST);
    GL.depthFunc(GL.LEQUAL);
    GL.clearColor(1.0, 1.0, 1.0, 1.0);
    GL.clearDepth(1.0);


    var animate = function (time) {
        GL.viewport(0, 0, CANVAS.width, CANVAS.height);
        GL.clear(GL.COLOR_BUFFER_BIT | GL.DEPTH_BUFFER_BIT);

        GL.uniformMatrix4fv(_Pmatrix, false, PROJMATRIX);
        GL.uniformMatrix4fv(_Vmatrix, false, VIEWMATRIX);

        LIBS.set_I4(MOVEMATRIX);
        // Apply accumulated rotation from mouse/keyboard
        LIBS.rotateY(MOVEMATRIX, THETA);
        LIBS.rotateX(MOVEMATRIX, PHI);

        if (!drag) {
            dX *= (1 - FRICTION);
            dY *= (1 - FRICTION);
            THETA += dX;
            PHI += dY;
        }


        const currentTime = performance.now();


        // Animasi Breathing-Idle 
        const breathPhase = time * breathSpeed; // Pakai 'time' agar kontinu
        const breathScaleFactor = 1.0 + Math.sin(breathPhase) * breathScaleAmount;
        // LIBS.scaleX(body.MOVE_MATRIX,breathScaleFactor);
        LIBS.scaleY(body.MOVE_MATRIX,breathScaleFactor);
        LIBS.translateY(head.MOVE_MATRIX, breathScaleFactor);
        // LIBS.scaleZ(body.MOVE_MATRIX,breathScaleFactor);

        // Animasi Lompat
        jumpProgress = 0;
        let armSwingAngle = 0;
        let legTuckAngle = 0;
        if (isJumping) {
            const elapsedTime = currentTime - jumpStartTime;
            if (elapsedTime < jumpDuration) {
                jumpProgress = elapsedTime / jumpDuration; // Progress 0 -> 1
                const t = jumpProgress;
                const jumpOffset = -4 * jumpHeight * t * (t - 1); // Parabola Y offset
                LIBS.translateY(MOVEMATRIX, jumpOffset); // Terapkan ke gerakan global
                const maxArmSwing = -0.8; // Ayunan tangan ke atas
                const maxLegTuck = 0.15;  // Tekukan kaki ke belakang
                armSwingAngle = Math.sin(t * Math.PI) * maxArmSwing;
                legTuckAngle = Math.sin(t * Math.PI) * maxLegTuck;

            } else {
                isJumping = false;
            }
        }

        // Terapkan animasi lompat ke TANGAN (jika ada)
        LIBS.set_I4(rightArm.MOVE_MATRIX); // Reset
        LIBS.set_I4(leftArm.MOVE_MATRIX);  // Reset
        if (isJumping) {
            LIBS.rotateX(rightArm.MOVE_MATRIX, armSwingAngle);
            LIBS.rotateX(leftArm.MOVE_MATRIX, armSwingAngle);
        }

        // Terapkan animasi lompat ke KAKI (jika ada)
        LIBS.set_I4(rightLeg.MOVE_MATRIX); // Reset
        LIBS.set_I4(leftLeg.MOVE_MATRIX);  // Reset
        if (isJumping) {
            LIBS.rotateX(rightLeg.MOVE_MATRIX, legTuckAngle);
            LIBS.rotateX(leftLeg.MOVE_MATRIX, legTuckAngle);
        }

        LIBS.set_I4(head.MOVE_MATRIX);


        // Animasi ngangguk
        if (nod) {
            const elapsedTime = time - nodStartTime;
            const nodSpeed = 0.002;
            if (elapsedTime < nodDuration) {
                const nodPhase = elapsedTime * nodSpeed;
                // Nods rotate up and down
                LIBS.rotateX(head.MOVE_MATRIX, Math.sin(nodPhase * Math.PI * 2) * 0.2);
            }
            else {
                nod = false; // Stop
            }
        };


        // Animasi shake head
        if (shakeHead) {
            const elapsedTime = time - shakeStartTime;
            const shakeSpeed = 0.002;
            if (elapsedTime < shakeDuration) {
                const shakePhase = elapsedTime * shakeSpeed;
                // Shake head rotate up and down
                LIBS.rotateY(head.MOVE_MATRIX, Math.sin(shakePhase * Math.PI * 2) * 0.2);
            }
            else {
                shakeHead = false; // Stop
            }
        };

        // Animasi Arbitrary Rotation
        if (isRotatingArb) {
            const elapsedTime = currentTime - rotateArbStartTime;
            if (elapsedTime < rotateArbDuration) {
                let rotate = elapsedTime / rotateArbDuration; // Progress 0 -> 1
                const t = rotate;
                const rotateAngle = elapsedTime * rotateArbSpeed * Math.PI * 2;
                const maxArmSwing = -0.8; 
                armSwingAngle = Math.sin(t * Math.PI) * maxArmSwing;

                LIBS.translate(rightArm.MOVE_MATRIX, -shoulderPivot[0], -shoulderPivot[1], -shoulderPivot[2]);
                LIBS.rotateX(rightArm.MOVE_MATRIX, armSwingAngle);
                LIBS.rotate(rightArm.MOVE_MATRIX, rotateAngle, rotateAxis);
                LIBS.translate(rightArm.MOVE_MATRIX, shoulderPivot[0], shoulderPivot[1], shoulderPivot[2]);
            } else { isRotatingArb = false; }
        }

        // Animasi Flame
        LIBS.set_I4(flameCollar.MOVE_MATRIX);
        const flameSpeed = 0.002; // How fast it animates
        const flameWobble = 0.2;  // How much it moves
        LIBS.rotateY(flameCollar.MOVE_MATRIX, Math.sin(time * flameSpeed) * flameWobble);
        LIBS.rotateX(flameCollar.MOVE_MATRIX, Math.cos(time * flameSpeed * 0.7) * flameWobble * 0.5);

        //  the main body (which will then render its children)
        body.render(MOVEMATRIX);

        GL.flush();
        window.requestAnimationFrame(animate);
    }; // End of animate function

    // Start the animation loop
    animate(0);
}
window.addEventListener('load', main);