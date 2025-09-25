window.onload = main;

function main() {
    const canvas = document.querySelector("#glCanvas");
    const gl = canvas.getContext("webgl");

    if (gl === null) {
        alert("WebGL tidak dapat diinisialisasi. Browser Anda mungkin tidak mendukungnya.");
        return;
    }

    const vsSource = `
        attribute vec4 aVertexPosition;
        uniform mat4 uModelViewMatrix;
        uniform mat4 uProjectionMatrix;
        void main(void) {
            gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
        }
    `;
    const fsSource = `
        precision mediump float;
        uniform vec4 uColor;
        void main(void) {
            gl_FragColor = uColor;
        }
    `;

    const shaderProgram = initShaderProgram(gl, vsSource, fsSource);

    const programInfo = {
        program: shaderProgram,
        attribLocations: {
            vertexPosition: gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
        },
        uniformLocations: {
            projectionMatrix: gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
            modelViewMatrix: gl.getUniformLocation(shaderProgram, 'uModelViewMatrix'),
            color: gl.getUniformLocation(shaderProgram, 'uColor'),
        },
    };

    // Geometri standar
    const sphere = createSphere(1.0, 30, 30);
    const sphereBuffers = initBuffers(gl, sphere.vertices, sphere.indices);
    const cone = createCone(1.0, 2.0, 30);
    const coneBuffers = initBuffers(gl, cone.vertices, cone.indices);

    // --- GEOMETRI KUSTOM BARU UNTUK MATA ---
    const triangle = createTriangle();
    const triangleBuffers = initBuffers(gl, triangle.vertices, triangle.indices);
    const quad = createQuad();
    const quadBuffers = initBuffers(gl, quad.vertices, quad.indices);

    let modelYRotation = 0.0;
    let modelXRotation = 0.0;
    let isDragging = false;
    let lastMouseX = -1;
    let lastMouseY = -1;

    canvas.addEventListener('mousedown', (event) => {
        isDragging = true;
        lastMouseX = event.clientX;
        lastMouseY = event.clientY;
    });
    canvas.addEventListener('mouseup', () => { isDragging = false; });
    canvas.addEventListener('mouseout', () => { isDragging = false; });
    canvas.addEventListener('mousemove', (event) => {
        if (!isDragging) return;
        const deltaX = event.clientX - lastMouseX;
        const deltaY = event.clientY - lastMouseY;
        modelYRotation += deltaX * 0.01;
        modelXRotation += deltaY * 0.01;
        lastMouseX = event.clientX;
        lastMouseY = event.clientY;
    });

    function render() {
        gl.clearColor(0.2, 0.1, 0.3, 1.0);
        gl.clearDepth(1.0);
        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LEQUAL);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        const fieldOfView = 45 * Math.PI / 180;
        const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
        const projectionMatrix = mat4.create();
        mat4.perspective(projectionMatrix, fieldOfView, aspect, 0.1, 100.0);

        gl.useProgram(programInfo.program);
        gl.uniformMatrix4fv(programInfo.uniformLocations.projectionMatrix, false, projectionMatrix);

        let worldMatrix = mat4.create();
        mat4.translate(worldMatrix, worldMatrix, [0.0, -0.5, -8.0]);
        mat4.rotate(worldMatrix, worldMatrix, modelXRotation, [1, 0, 0]);
        mat4.rotate(worldMatrix, worldMatrix, modelYRotation, [0, 1, 0]);

        const creamColor = [1.0, 0.96, 0.75, 1.0];
        const blueColor = [0.22, 0.36, 0.49, 1.0];
        const redColor = [1.0, 0.2, 0.1, 1.0];
        const orangeColor = [1.0, 0.6, 0.1, 1.0];
        const yellowColor = [1.0, 0.8, 0.0, 1.0];
        const earColor = [0.22, 0.36, 0.49, 1.0];
        const whiteScleraColor = [1.0, 1.0, 1.0, 1.0];
        const redIrisColor = [0.85, 0.14, 0.14, 1.0];
        const blackPupilColor = [0.1, 0.1, 0.1, 1.0];

        // --- HIERARKI GAMBAR ---
        let bodyMatrix = mat4.clone(worldMatrix);
        drawPart(bodyMatrix, [0.0, 0.0, 0.0], [0.8, 1.5, 0.6], blueColor, sphereBuffers, sphere.indices.length);
        drawPart(bodyMatrix, [0.0, -0.1, 0.2], [0.78, 1.48, 0.6], creamColor, sphereBuffers, sphere.indices.length);
        
        let headMatrix = mat4.create();
        mat4.translate(headMatrix, worldMatrix, [0.0, 1.3, 0.4]);
        mat4.scale(headMatrix, headMatrix, [0.65, 0.5, 1.0]);
        drawPart(headMatrix, [0, 0.05, 0], [1.01, 1.01, 1.01], blueColor, sphereBuffers, sphere.indices.length);
        drawPart(headMatrix, [0, 0, 0], [1.0, 1.0, 1.0], creamColor, sphereBuffers, sphere.indices.length);

        // --- DETAIL WAJAH MENGGUNAKAN BENTUK KUSTOM ---
        // ----- Mata Kiri -----
        let leftEyeMatrix = mat4.create();
        // Posisinya sedikit lebih maju di sumbu Z (0.85 dari sebelumnya 0.75)
        mat4.translate(leftEyeMatrix, headMatrix, [-0.5, 0.2, 0.85]); 
        mat4.rotateY(leftEyeMatrix, leftEyeMatrix, -Math.PI / 8);

        drawPart(leftEyeMatrix, [0, 0, 0], [0.3, 0.2, 1], whiteScleraColor, triangleBuffers, triangle.indices.length);
        drawPart(leftEyeMatrix, [0, 0.04, 0.01], [0.12, 0.08, 1], redIrisColor, quadBuffers, quad.indices.length);
        drawPart(leftEyeMatrix, [0, 0.04, 0.02], [0.05, 0.05, 0.01], blackPupilColor, sphereBuffers, sphere.indices.length);

        // ----- Mata Kanan -----
        let rightEyeMatrix = mat4.create();
        // Posisinya sedikit lebih maju di sumbu Z (0.85 dari sebelumnya 0.75)
        mat4.translate(rightEyeMatrix, headMatrix, [0.5, 0.2, 0.85]);
        mat4.rotateY(rightEyeMatrix, rightEyeMatrix, Math.PI / 8);

        drawPart(rightEyeMatrix, [0, 0, 0], [0.3, 0.2, 1], whiteScleraColor, triangleBuffers, triangle.indices.length);
        drawPart(rightEyeMatrix, [0, 0.04, 0.01], [0.12, 0.08, 1], redIrisColor, quadBuffers, quad.indices.length);
        drawPart(rightEyeMatrix, [0, 0.04, 0.02], [0.05, 0.05, 0.01], blackPupilColor, sphereBuffers, sphere.indices.length);

        // ----- Telinga -----
        let leftEarMatrix = mat4.clone(headMatrix);
        // Posisinya sedikit digeser ke luar sumbu X (-0.45 dari -0.4) dan Z (0 dari -0.05)
        mat4.translate(leftEarMatrix, leftEarMatrix, [-0.45, 0.65, 0]); 
        mat4.scale(leftEarMatrix, leftEarMatrix, [0.1, 0.2, 0.05]);
        mat4.rotateY(leftEarMatrix, leftEarMatrix, -Math.PI/4);
        drawPart(leftEarMatrix, [0,0,0], [1,1,1], earColor, coneBuffers, cone.indices.length);
        
        let rightEarMatrix = mat4.clone(headMatrix);
        // Posisinya sedikit digeser ke luar sumbu X (0.45 dari 0.4) dan Z (0 dari -0.05)
        mat4.translate(rightEarMatrix, rightEarMatrix, [0.45, 0.65, 0]);
        mat4.scale(rightEarMatrix, rightEarMatrix, [0.1, 0.2, 0.05]);
        mat4.rotateY(rightEarMatrix, rightEarMatrix, Math.PI/4);
        drawPart(rightEarMatrix, [0,0,0], [1,1,1], earColor, coneBuffers, cone.indices.length);
        // Kaki & Tangan (posisi dan bentuk disesuaikan)
        // Kaki Belakang (tetap sama)
        drawPart(worldMatrix, [-0.6, -1.2, 0.0], [0.3, 0.5, 0.3], creamColor, sphereBuffers, sphere.indices.length);
        drawPart(worldMatrix, [0.6, -1.2, 0.0], [0.3, 0.5, 0.3], creamColor, sphereBuffers, sphere.indices.length);
        
        // Tangan Depan (DIPERBAIKI)
        // Posisi Z lebih maju (0.7 dari 0.5), posisi Y lebih turun (-0.4 dari 0.0), skala Y lebih panjang (0.5 dari 0.4)
        drawPart(worldMatrix, [-0.7, -0.4, 0.7], [0.2, 0.5, 0.2], creamColor, sphereBuffers, sphere.indices.length);
        drawPart(worldMatrix, [0.7, -0.4, 0.7], [0.2, 0.5, 0.2], creamColor, sphereBuffers, sphere.indices.length);
        // Api
        const headFireBaseScale = [0.4, 0.6, 0.4];
        drawFlame(headMatrix, [-40, 0, 0], [0, 0.4, -0.8], headFireBaseScale, orangeColor);
        drawFlame(headMatrix, [-35, 15, 0], [0.2, 0.4, -0.9], [headFireBaseScale[0] * 0.8, headFireBaseScale[1] * 0.8, headFireBaseScale[2] * 0.8], redColor);
        drawFlame(headMatrix, [-45, -10, 0], [-0.2, 0.4, -0.9], [headFireBaseScale[0] * 0.9, headFireBaseScale[1] * 0.9, headFireBaseScale[2] * 0.9], yellowColor);
        const backFireBaseScale = [0.5, 0.8, 0.5];
        drawFlame(worldMatrix, [-40, 0, 0], [0.0, 0.8, -0.4], backFireBaseScale, redColor);
        drawFlame(worldMatrix, [-45, 20, 0], [0.3, 0.7, -0.6], [backFireBaseScale[0] * 0.9, backFireBaseScale[1] * 0.9, backFireBaseScale[2] * 0.9], orangeColor);
        drawFlame(worldMatrix, [-35, -20, 0], [-0.3, 0.7, -0.6], [backFireBaseScale[0] * 0.8, backFireBaseScale[1] * 0.8, backFireBaseScale[2] * 0.8], yellowColor);

        requestAnimationFrame(render);
    }
    
    function drawPart(baseMatrix, translation, scale, color, bufferInfo, vertexCount) {
        let modelViewMatrix = mat4.clone(baseMatrix);
        mat4.translate(modelViewMatrix, modelViewMatrix, translation);
        mat4.scale(modelViewMatrix, modelViewMatrix, scale);
        bindBuffers(gl, programInfo, bufferInfo);
        gl.uniformMatrix4fv(programInfo.uniformLocations.modelViewMatrix, false, modelViewMatrix);
        gl.uniform4fv(programInfo.uniformLocations.color, color);
        gl.drawElements(gl.TRIANGLES, vertexCount, gl.UNSIGNED_SHORT, 0);
    }

    function drawFlame(baseMatrix, rotation, translation, scale, color) {
        let modelViewMatrix = mat4.clone(baseMatrix);
        mat4.translate(modelViewMatrix, modelViewMatrix, translation);
        mat4.rotate(modelViewMatrix, modelViewMatrix, (rotation[0] * Math.PI) / 180, [1, 0, 0]);
        mat4.rotate(modelViewMatrix, modelViewMatrix, (rotation[1] * Math.PI) / 180, [0, 1, 0]);
        mat4.rotate(modelViewMatrix, modelViewMatrix, (rotation[2] * Math.PI) / 180, [0, 0, 1]);
        mat4.scale(modelViewMatrix, modelViewMatrix, scale);
        bindBuffers(gl, programInfo, coneBuffers);
        gl.uniformMatrix4fv(programInfo.uniformLocations.modelViewMatrix, false, modelViewMatrix);
        gl.uniform4fv(programInfo.uniformLocations.color, color);
        gl.drawElements(gl.TRIANGLES, cone.indices.length, gl.UNSIGNED_SHORT, 0);
    }

    requestAnimationFrame(render);
}
// --- GEOMETRI KUSTOM UNTUK MATA ---
function createTriangle() {
    const vertices = [
        0.0, 1.0, 0.0,  // Top vertex
       -1.0, -1.0, 0.0, // Bottom left vertex
        1.0, -1.0, 0.0   // Bottom right vertex
    ];
    const indices = [0, 1, 2];
    return { vertices, indices };
}

function createQuad() {
    const vertices = [
       -1.0,  1.0, 0.0, // Top left
        1.0,  1.0, 0.0, // Top right
        1.0, -1.0, 0.0, // Bottom right
       -1.0, -1.0, 0.0  // Bottom left
    ];
    const indices = [0, 1, 2, 0, 2, 3];
    return { vertices, indices };
}

// --- FUNGSI-FUNGSI HELPER ---
function createSphere(radius, lats, longs) {
    const vertices = [];
    const indices = [];
    for (let i = 0; i <= lats; i++) {
        const latAngle = (Math.PI / lats) * i;
        for (let j = 0; j <= longs; j++) {
            const longAngle = (j / longs) * 2 * Math.PI;
            const x = radius * Math.cos(longAngle) * Math.sin(latAngle);
            const y = radius * Math.cos(latAngle);
            const z = radius * Math.sin(longAngle) * Math.sin(latAngle);
            vertices.push(x, y, z);
        }
    }
    for (let i = 0; i < lats; i++) {
        for (let j = 0; j < longs; j++) {
            const first = i * (longs + 1) + j;
            const second = first + longs + 1;
            indices.push(first, second, first + 1);
            indices.push(second, second + 1, first + 1);
        }
    }
    return { vertices, indices };
}

function createCone(radius, height, sides) {
    const vertices = [0, height / 2, 0];
    const indices = [];
    for (let i = 0; i <= sides; i++) {
        const angle = (i / sides) * 2 * Math.PI;
        vertices.push(
            radius * Math.cos(angle),
            -height / 2,
            radius * Math.sin(angle)
        );
    }
    for (let i = 1; i <= sides; i++) {
        indices.push(0, i, i + 1);
    }
    const baseCenterIndex = vertices.length / 3;
    vertices.push(0, -height / 2, 0);
    for (let i = 1; i <= sides; i++) {
        indices.push(baseCenterIndex, i + 1, i);
    }
    return { vertices, indices };
}

function initBuffers(gl, vertices, indices) {
    const vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(
        gl.ELEMENT_ARRAY_BUFFER,
        new Uint16Array(indices),
        gl.STATIC_DRAW
    );
    return { position: vertexBuffer, indices: indexBuffer };
}

function bindBuffers(gl, programInfo, buffers) {
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
    gl.vertexAttribPointer(
        programInfo.attribLocations.vertexPosition,
        3,
        gl.FLOAT,
        false,
        0,
        0
    );
    gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indices);
}

function initShaderProgram(gl, vsSource, fsSource) {
    const shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, loadShader(gl, gl.VERTEX_SHADER, vsSource));
    gl.attachShader(shaderProgram, loadShader(gl, gl.FRAGMENT_SHADER, fsSource));
    gl.linkProgram(shaderProgram);
    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        console.error(
            "Shader program error: " + gl.getProgramInfoLog(shaderProgram)
        );
        return null;
    }
    return shaderProgram;
}

function loadShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error("Shader compile error: " + gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }
    return shader;
}