window.onload = main;

function main() {
  const canvas = document.querySelector("#glCanvas");
  const gl = canvas.getContext("webgl");

  if (gl === null) {
    alert(
      "WebGL tidak dapat diinisialisasi. Browser Anda mungkin tidak mendukungnya."
    );
    return;
  }

  // Vertex shader
  const vsSource = `
        attribute vec4 aVertexPosition;
        uniform mat4 uModelViewMatrix;
        uniform mat4 uProjectionMatrix;
        void main(void) {
            gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
        }
    `;

  // Fragment shader
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
      vertexPosition: gl.getAttribLocation(shaderProgram, "aVertexPosition"),
    },
    uniformLocations: {
      projectionMatrix: gl.getUniformLocation(
        shaderProgram,
        "uProjectionMatrix"
      ),
      modelViewMatrix: gl.getUniformLocation(shaderProgram, "uModelViewMatrix"),
      color: gl.getUniformLocation(shaderProgram, "uColor"),
    },
  };

  // --- Geometri Bentuk Dasar (Bola & Kerucut) ---
  const sphere = createSphere(1.0, 30, 30);
  const sphereBuffers = initBuffers(gl, sphere.vertices, sphere.indices);

  const cone = createCone(1.0, 2.0, 30); // Radius, Height, Sides
  const coneBuffers = initBuffers(gl, cone.vertices, cone.indices);

  // --- Variabel untuk Rotasi ---
  let modelYRotation = 0.0;
  let modelXRotation = 0.0;
  let isDragging = false;
  let lastMouseX = -1;
  let lastMouseY = -1;

  // --- Event Listener untuk Mouse ---
  canvas.addEventListener("mousedown", (event) => {
    isDragging = true;
    lastMouseX = event.clientX;
    lastMouseY = event.clientY;
  });
  canvas.addEventListener("mouseup", () => {
    isDragging = false;
  });
  canvas.addEventListener("mouseout", () => {
    isDragging = false;
  });
  canvas.addEventListener("mousemove", (event) => {
    if (!isDragging) return;
    const deltaX = event.clientX - lastMouseX;
    const deltaY = event.clientY - lastMouseY;
    modelYRotation += deltaX * 0.01;
    modelXRotation += deltaY * 0.01;
    lastMouseX = event.clientX;
    lastMouseY = event.clientY;
  });

  function render() {
    gl.clearColor(0.2, 0.1, 0.3, 1.0); // Latar belakang malam hari
    gl.clearDepth(1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    const fieldOfView = (45 * Math.PI) / 180;
    const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    const projectionMatrix = mat4.create();
    mat4.perspective(projectionMatrix, fieldOfView, aspect, 0.1, 100.0);

    gl.useProgram(programInfo.program);
    gl.uniformMatrix4fv(
      programInfo.uniformLocations.projectionMatrix,
      false,
      projectionMatrix
    );

    let worldMatrix = mat4.create();
    mat4.translate(worldMatrix, worldMatrix, [0.0, -0.5, -8.0]);
    mat4.rotate(worldMatrix, worldMatrix, modelXRotation, [1, 0, 0]);
    mat4.rotate(worldMatrix, worldMatrix, modelYRotation, [0, 1, 0]);

    // Warna
    const creamColor = [1.0, 0.96, 0.75, 1.0];
    const blueColor = [0.2, 0.4, 0.6, 1.0];
    const redColor = [1.0, 0.2, 0.1, 1.0];
    const orangeColor = [1.0, 0.6, 0.1, 1.0];
    const yellowColor = [1.0, 0.8, 0.0, 1.0];
    const eyeColor = [0.1, 0.1, 0.1, 1.0]; // Warna mata hitam
    const redEarColor = [0.8, 0.2, 0.2, 1.0]; // Warna telinga merah

    // --- Menggambar Api (Kerucut) ---
    function drawFlame(baseMatrix, translation, scale, rotation, color) {
      let modelViewMatrix = mat4.clone(baseMatrix);
      mat4.translate(modelViewMatrix, modelViewMatrix, translation);
      mat4.rotate(
        modelViewMatrix,
        modelViewMatrix,
        (rotation[0] * Math.PI) / 180,
        [1, 0, 0]
      );
      mat4.rotate(
        modelViewMatrix,
        modelViewMatrix,
        (rotation[1] * Math.PI) / 180,
        [0, 1, 0]
      );
      mat4.rotate(
        modelViewMatrix,
        modelViewMatrix,
        (rotation[2] * Math.PI) / 180,
        [0, 0, 1]
      );
      mat4.scale(modelViewMatrix, modelViewMatrix, scale);

      gl.uniformMatrix4fv(
        programInfo.uniformLocations.modelViewMatrix,
        false,
        modelViewMatrix
      );
      gl.uniform4fv(programInfo.uniformLocations.color, color);
      gl.drawElements(gl.TRIANGLES, cone.indices.length, gl.UNSIGNED_SHORT, 0);
    }

    bindBuffers(gl, programInfo, coneBuffers);
    const headFireBaseScale = [0.4, 0.6, 0.4];
    drawFlame(
      worldMatrix,
      [0.0, 1.6, 0.4],
      headFireBaseScale,
      [-30, 0, 0],
      orangeColor
    );
    drawFlame(
      worldMatrix,
      [0.2, 1.6, 0.3],
      [
        headFireBaseScale[0] * 0.8,
        headFireBaseScale[1] * 0.8,
        headFireBaseScale[2] * 0.8,
      ],
      [-25, 15, 0],
      redColor
    );
    drawFlame(
      worldMatrix,
      [-0.2, 1.6, 0.3],
      [
        headFireBaseScale[0] * 0.9,
        headFireBaseScale[1] * 0.9,
        headFireBaseScale[2] * 0.9,
      ],
      [-35, -10, 0],
      yellowColor
    );
    const backFireBaseScale = [0.5, 0.8, 0.5];
    drawFlame(
      worldMatrix,
      [0.0, 0.8, -0.4],
      backFireBaseScale,
      [-40, 0, 0],
      redColor
    );
    drawFlame(
      worldMatrix,
      [0.3, 0.7, -0.6],
      [
        backFireBaseScale[0] * 0.9,
        backFireBaseScale[1] * 0.9,
        backFireBaseScale[2] * 0.9,
      ],
      [-45, 20, 0],
      orangeColor
    );
    drawFlame(
      worldMatrix,
      [-0.3, 0.7, -0.6],
      [
        backFireBaseScale[0] * 0.8,
        backFireBaseScale[1] * 0.8,
        backFireBaseScale[2] * 0.8,
      ],
      [-35, -20, 0],
      yellowColor
    );
    drawFlame(
      worldMatrix,
      [0.0, 0.2, -0.8],
      [
        backFireBaseScale[0] * 0.7,
        backFireBaseScale[1] * 0.7,
        backFireBaseScale[2] * 0.7,
      ],
      [-50, 0, 0],
      redColor
    );
    drawFlame(
      worldMatrix,
      [0.2, 0.1, -0.9],
      [
        backFireBaseScale[0] * 0.6,
        backFireBaseScale[1] * 0.6,
        backFireBaseScale[2] * 0.6,
      ],
      [-55, 10, 0],
      orangeColor
    );
    drawFlame(
      worldMatrix,
      [-0.2, 0.1, -0.9],
      [
        backFireBaseScale[0] * 0.5,
        backFireBaseScale[1] * 0.5,
        backFireBaseScale[2] * 0.5,
      ],
      [-60, -15, 0],
      yellowColor
    );

    // --- Menggambar Bagian Tubuh (Bola) ---
    function drawBodyPart(baseMatrix, translation, scale, color) {
      let modelViewMatrix = mat4.clone(baseMatrix);
      mat4.translate(modelViewMatrix, modelViewMatrix, translation);
      mat4.scale(modelViewMatrix, modelViewMatrix, scale);

      gl.uniformMatrix4fv(
        programInfo.uniformLocations.modelViewMatrix,
        false,
        modelViewMatrix
      );
      gl.uniform4fv(programInfo.uniformLocations.color, color);
      gl.drawElements(
        gl.TRIANGLES,
        sphere.indices.length,
        gl.UNSIGNED_SHORT,
        0
      );
    }

    bindBuffers(gl, programInfo, sphereBuffers);
    drawBodyPart(worldMatrix, [0.0, 0.0, 0.0], [1.01, 1.31, 1.01], blueColor);
    drawBodyPart(worldMatrix, [0.0, 0.0, 0.0], [1.0, 1.3, 1.0], creamColor);
    drawBodyPart(worldMatrix, [0.0, 1.3, 0.5], [0.81, 0.81, 0.81], blueColor);
    drawBodyPart(worldMatrix, [0.0, 1.3, 0.5], [0.8, 0.8, 0.8], creamColor);
    drawBodyPart(worldMatrix, [-0.5, -1.3, 0.2], [0.4, 0.4, 0.4], creamColor);
    drawBodyPart(worldMatrix, [0.5, -1.3, 0.2], [0.4, 0.4, 0.4], creamColor);
    drawBodyPart(worldMatrix, [-0.9, 0.3, 0.9], [0.2, 0.2, 0.2], creamColor);
    drawBodyPart(worldMatrix, [0.9, 0.3, 0.9], [0.2, 0.2, 0.2], creamColor);

    // --- Menggambar Detail Wajah ---
    // Moncong - Sedikit lebih ke depan dan pipih
    drawBodyPart(worldMatrix, [0.0, 1.0, 1.35], [0.4, 0.3, 0.45], creamColor);

    // Telinga (merah) - diposisikan lebih tinggi dan ke samping, sedikit lebih besar
    drawBodyPart(worldMatrix, [0.45, 1.8, 0.6], [0.2, 0.2, 0.05], redEarColor);
    drawBodyPart(worldMatrix, [-0.45, 1.8, 0.6], [0.2, 0.2, 0.05], redEarColor);

    // Mata (bola pipih) - diposisikan lebih ke depan di moncong, sedikit lebih besar
    drawBodyPart(worldMatrix, [0.2, 1.3, 1.4], [0.12, 0.18, 0.1], eyeColor);
    drawBodyPart(worldMatrix, [-0.2, 1.3, 1.4], [0.12, 0.18, 0.1], eyeColor);

    requestAnimationFrame(render);
  }
  requestAnimationFrame(render);
}

// --- FUNGSI-FUNGSI HELPER (Tidak berubah) ---

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
  const vertices = [0, height / 2, 0]; // Puncak kerucut
  const indices = [];

  // Titik-titik di sekeliling alas
  for (let i = 0; i <= sides; i++) {
    const angle = (i / sides) * 2 * Math.PI;
    vertices.push(
      radius * Math.cos(angle),
      -height / 2,
      radius * Math.sin(angle)
    );
  }

  // Segitiga untuk badan kerucut
  for (let i = 1; i <= sides; i++) {
    indices.push(0, i, i + 1);
  }

  // Titik tengah alas (untuk menutup alas kerucut)
  const baseCenterIndex = vertices.length / 3;
  vertices.push(0, -height / 2, 0); // Titik tengah alas
  for (let i = 1; i <= sides; i++) {
    indices.push(baseCenterIndex, i + 1, i); // Segitiga untuk alas
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