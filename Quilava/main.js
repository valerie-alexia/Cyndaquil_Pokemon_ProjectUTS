import { HeadShape } from "./kepala.js";
import { BodyShape } from "./body.js";
import { ArmShape } from "./arms.js";
import { LegsShape } from "./legs.js";

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

    // LEGS (left and right)
    var leftLeg = new LegsShape(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, +1);
    leftLeg.setup();
    var rightLeg = new LegsShape(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, -1);
    rightLeg.setup();

    body.childs.push(head);
    body.childs.push(rightArm);
    body.childs.push(leftArm);
    // body.childs.push(leftLeg);
    // body.childs.push(rightLeg);

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

    var SPEED = 0.05;

    var keyDown = function (e) {
        if (e.key === 'w') {
            dY -= SPEED;
        }
        else if (e.key === 'a') {
            dX -= SPEED;
        }
        else if (e.key === 's') {
            dY += SPEED;
        }
        else if (e.key === 'd') {
            dX += SPEED;
        }
    };

    window.addEventListener("keydown", keyDown, false);


    /*========================= DRAWING ========================= */
    GL.enable(GL.DEPTH_TEST);
    GL.depthFunc(GL.LEQUAL);
    GL.clearColor(0.0, 0.0, 0.0, 1.0);
    GL.clearDepth(1.0);


    var animate = function (time) {
        // Konversi waktu ke detik (best practice)
        const timeInSeconds = time * 0.001; 

        GL.viewport(0, 0, CANVAS.width, CANVAS.height);
        GL.clear(GL.COLOR_BUFFER_BIT | GL.DEPTH_BUFFER_BIT);

        // LIBS.rotateZ(MOVEMATRIX, dt*0.001);
        // LIBS.rotateY(MOVEMATRIX, dt*0.001);
        // LIBS.rotateX(MOVEMATRIX, dt*0.001);

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
            PHI += dY;
        }

        // ==================================================
        // Panggil animasi api SEBELUM menggambar
        head.animate(timeInSeconds);

        body.animate(timeInSeconds); // Panggil animasi untuk badan

        // Render body; head is attached as a child of body
        body.render(MOVEMATRIX);

        leftLeg.render(MOVEMATRIX);
        rightLeg.render(MOVEMATRIX);

        GL.flush();
        window.requestAnimationFrame(animate);
    };
    animate(0);
}
window.addEventListener('load', main);