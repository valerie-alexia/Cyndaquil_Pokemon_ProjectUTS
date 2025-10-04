window.onload = main;

function main() {
  // 1. Setup
  const canvas = document.querySelector("#glCanvas");
  const gl = canvas.getContext("webgl");

  if (gl === null) {
    alert("Unable to initialize WebGL. Your browser may not support it.");
    return;
  }
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  // 2. Shaders
  const vsSource = `
        attribute vec4 aVertexPosition;
        attribute vec3 aVertexColor;
        uniform mat4 uModelViewMatrix;
        uniform mat4 uProjectionMatrix;
        varying lowp vec3 vColor;
        void main(void) {
            gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
            vColor = aVertexColor;
        }
    `;
  const fsSource = `
        precision mediump float;
        varying lowp vec3 vColor;
        void main(void) {
            gl_FragColor = vec4(vColor, 1.0);
        }
    `;
  const shaderProgram = initShaderProgram(gl, vsSource, fsSource);
  const programInfo = {
    program: shaderProgram,
    attribLocations: {
      vertexPosition: gl.getAttribLocation(shaderProgram, "aVertexPosition"),
      vertexColor: gl.getAttribLocation(shaderProgram, "aVertexColor"),
    },
    uniformLocations: {
      projectionMatrix: gl.getUniformLocation(
        shaderProgram,
        "uProjectionMatrix"
      ),
      modelViewMatrix: gl.getUniformLocation(shaderProgram, "uModelViewMatrix"),
    },
  };

  // 3. Geometry & Buffers
  // Head (Ellipsoid), Snout (Elliptic Paraboloid), Eyes (Semicircles)
  const head = createEllipsoid(0.9, 0.8, 0.8, 60, 60);
  const headBuffers = initBuffers(gl, head.vertices, head.indices, head.colors);
  const snout = createEllipticParaboloid(0.6, 0.4, 1.0, 20);
  const snoutBuffers = initBuffers(
    gl,
    snout.vertices,
    snout.indices,
    snout.colors
  );
  const scleraColor = [1.0, 1.0, 0.95];
  const eye = createSemicircle(1.0, 20, scleraColor);
  const eyeBuffers = initBuffers(gl, eye.vertices, eye.indices, eye.colors);

  // Eye Components
  // Iris (Red Part)
  const irisColor = [0.8, 0.1, 0.1]; // Dark red color
  const eyeIris = createSemicircle(1.0, 20, irisColor);
  const eyeIrisBuffers = initBuffers(
    gl,
    eyeIris.vertices,
    eyeIris.indices,
    eyeIris.colors
  );

  // Pupil (Black Part)
  const pupilColor = [0.0, 0.0, 0.0]; // Black color
  const eyePupil = createSemicircle(1.0, 20, pupilColor);
  const eyePupilBuffers = initBuffers(
    gl,
    eyePupil.vertices,
    eyePupil.indices,
    eyePupil.colors
  );

  // Highlight (White Part)
  const highlightColor = [1.0, 1.0, 1.0]; // Pure white
  const eyeHighlight = createSemicircle(1.0, 20, highlightColor);
  const eyeHighlightBuffers = initBuffers(
    gl,
    eyeHighlight.vertices,
    eyeHighlight.indices,
    eyeHighlight.colors
  );

  // NEW: Ear geometry
  const earColor = [0.22, 0.36, 0.49]; // Same as top of head
  const ear = createHalfEllipticCone(0.5, 0.2, 1.0, 20, earColor); // radiusX, radiusZ, height, segments, color
  const earBuffers = initBuffers(gl, ear.vertices, ear.indices, ear.colors);
  // NEW: Inner ear geometry
  const innerEarColor = [0.8, 0.1, 0.1]; // Red
  const innerEarTriangle = createTriangle(innerEarColor);
  const innerEarBuffers = initBuffers(
    gl,
    innerEarTriangle.vertices,
    innerEarTriangle.indices,
    innerEarTriangle.colors
  );

  // 4. Mouse Controls
  let modelYRotation = 0.0;
  let modelXRotation = 0.0;
  let isDragging = false;
  let lastMouseX = -1,
    lastMouseY = -1;

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

  // 5. Render Loop
  function render() {
    gl.clearColor(0.1, 0.1, 0.15, 1.0);
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

    const worldMatrix = mat4.create();
    mat4.translate(worldMatrix, worldMatrix, [0.0, 0.0, -5.0]);
    mat4.rotate(worldMatrix, worldMatrix, modelXRotation, [1, 0, 0]);
    mat4.rotate(worldMatrix, worldMatrix, modelYRotation, [0, 1, 0]);

    // --- DRAW THE PARTS ---
    // Draw the Head
    drawPart(gl, programInfo, worldMatrix, headBuffers, {
      translation: [0, 0, 0],
      rotation: [0, 1.5, 0],
      scale: [1, 1, 1],
    });

    // Draw the Snout
    drawPart(gl, programInfo, worldMatrix, snoutBuffers, {
      translation: [0, 0.01, 1.2],
      rotation: [Math.PI / 1, 0, 3.1],
      scale: [1.1, 1.7, 0.7],
    });

    // Define a base Z rotation to orient the semicircle with the flat edge up
    const baseEyeRotationZ = -Math.PI / 2;

    // Left Eye Transformations (Your perfected values)
    const leftEyeBaseTransform = {
      translation: [-0.57, 0.1, 0.7],
      rotation: [0.05, -1, -1.7 + baseEyeRotationZ],
      scale: [0.3, 0.3, 0.1],
    };

    // Right Eye Transformations (Mirrored from Left)
    const rightEyeBaseTransform = {
      translation: [0.57, 0.1, 0.7],
      rotation: [0.05, 1, 1.7 + baseEyeRotationZ],
      scale: [0.3, 0.3, 0.1],
    };

    // --- LEFT EYE  ---
    // Left Sclera
    drawPart(gl, programInfo, worldMatrix, eyeBuffers, {
      translation: leftEyeBaseTransform.translation,
      rotation: leftEyeBaseTransform.rotation,
      scale: leftEyeBaseTransform.scale,
    });
    // 2. Left Iris
    drawPart(gl, programInfo, worldMatrix, eyeIrisBuffers, {
      translation: [
        leftEyeBaseTransform.translation[0] + 0.05,
        leftEyeBaseTransform.translation[1] - 0.01,
        leftEyeBaseTransform.translation[2] + 0.08,
      ],
      rotation: [
        leftEyeBaseTransform.rotation[0],
        leftEyeBaseTransform.rotation[1],
        leftEyeBaseTransform.rotation[2] + 6.3,
      ],
      scale: [
        leftEyeBaseTransform.scale[0] * 0.7,
        leftEyeBaseTransform.scale[1] * 0.9,
        leftEyeBaseTransform.scale[2],
      ],
    });

    // 3. Left Pupil
    drawPart(gl, programInfo, worldMatrix, eyePupilBuffers, {
      translation: [
        leftEyeBaseTransform.translation[0] + 0.1,
        leftEyeBaseTransform.translation[1] - 0.03,
        leftEyeBaseTransform.translation[2] + 0.16,
      ],
      rotation: [
        leftEyeBaseTransform.rotation[0] + 0.02,
        leftEyeBaseTransform.rotation[1],
        leftEyeBaseTransform.rotation[2] + 6.33,
      ],
      scale: [
        leftEyeBaseTransform.scale[0] * 0.4,
        leftEyeBaseTransform.scale[1] * 0.4,
        leftEyeBaseTransform.scale[2],
      ],
    });

    // 4. Left Highlight
    drawPart(gl, programInfo, worldMatrix, eyeHighlightBuffers, {
      translation: [
        leftEyeBaseTransform.translation[0] + 0.05,
        leftEyeBaseTransform.translation[1] - 0.07,
        leftEyeBaseTransform.translation[2] + 0.08,
      ],
      rotation: [
        leftEyeBaseTransform.rotation[0],
        leftEyeBaseTransform.rotation[1],
        leftEyeBaseTransform.rotation[2],
      ],
      scale: [
        leftEyeBaseTransform.scale[0] * 0.2,
        leftEyeBaseTransform.scale[1] * 0.2,
        leftEyeBaseTransform.scale[2],
      ],
    });

    // --- RIGHT EYE (DONT CHANGE) ---
    // Right Sclera
    drawPart(gl, programInfo, worldMatrix, eyeBuffers, {
      translation: [0.57, 0.1, 0.7],
      rotation: [0.05, 1, 4.85 + baseEyeRotationZ],
      scale: [0.3, 0.3, 0.1],
    });
    // Right Iris
    drawPart(gl, programInfo, worldMatrix, eyeIrisBuffers, {
      translation: [
        rightEyeBaseTransform.translation[0] - 0.05,
        rightEyeBaseTransform.translation[1] - 0.01,
        rightEyeBaseTransform.translation[2] + 0.08,
      ],
      rotation: [
        rightEyeBaseTransform.rotation[0],
        rightEyeBaseTransform.rotation[1],
        rightEyeBaseTransform.rotation[2] + 3.1,
      ],
      scale: [
        rightEyeBaseTransform.scale[0] * 0.7,
        rightEyeBaseTransform.scale[1] * 0.9,
        rightEyeBaseTransform.scale[2],
      ],
    });

    // 3. Right Pupil
    drawPart(gl, programInfo, worldMatrix, eyePupilBuffers, {
      translation: [
        rightEyeBaseTransform.translation[0] - 0.1,
        rightEyeBaseTransform.translation[1] - 0.03,
        rightEyeBaseTransform.translation[2] + 0.16,
      ],
      rotation: [
        rightEyeBaseTransform.rotation[0] + 0.02,
        rightEyeBaseTransform.rotation[1],
        rightEyeBaseTransform.rotation[2] + 3.1,
      ],
      scale: [
        rightEyeBaseTransform.scale[0] * 0.4,
        rightEyeBaseTransform.scale[1] * 0.4,
        rightEyeBaseTransform.scale[2],
      ],
    });

    // 4. Right Highlight
    drawPart(gl, programInfo, worldMatrix, eyeHighlightBuffers, {
      translation: [
        rightEyeBaseTransform.translation[0] - 0.05,
        rightEyeBaseTransform.translation[1] - 0.07,
        rightEyeBaseTransform.translation[2] + 0.08,
      ],
      rotation: [
        rightEyeBaseTransform.rotation[0],
        rightEyeBaseTransform.rotation[1],
        rightEyeBaseTransform.rotation[2] + 3.2,
      ],
      scale: [
        rightEyeBaseTransform.scale[0] * 0.2,
        rightEyeBaseTransform.scale[1] * 0.2,
        rightEyeBaseTransform.scale[2],
      ],
    });

    // Your perfected transformations for the outer ears
    const leftEarTransform = {
      translation: [-0.6, 0.7, 0.1],
      rotation: [1, 2.3, -1],
      scale: [0.5, 0.4, 1.1],
    };
    const rightEarTransform = {
      translation: [0.6, 0.7, 0.1],
      rotation: [-1, 2.3, 1],
      scale: [0.5, 0.4, 1.1],
    };

    // Draw Left Ear (Outer)
    drawPart(gl, programInfo, worldMatrix, earBuffers, leftEarTransform);
    // NEW: Draw Left Ear (Inner Red Triangle)
    drawPart(gl, programInfo, worldMatrix, innerEarBuffers, {
      translation: [
        leftEarTransform.translation[0],
        leftEarTransform.translation[1],
        leftEarTransform.translation[2] + 0.01,
      ], // Same position + tiny Z offset
      rotation: [
        leftEarTransform.rotation[0] + 2,
        leftEarTransform.rotation[1] + 3.5,
        leftEarTransform.rotation[2] + 0.3,
      ], // Same rotation
      scale: [
        leftEarTransform.scale[0] * 0.3,
        leftEarTransform.scale[1] * 0.4,
        leftEarTransform.scale[2] * 2,
      ], // Scaled down
    });

    // Draw Right Ear (Outer)
    drawPart(gl, programInfo, worldMatrix, earBuffers, rightEarTransform);
    // NEW: Draw Right Ear (Inner Red Triangle)
    drawPart(gl, programInfo, worldMatrix, innerEarBuffers, {
      translation: [
        rightEarTransform.translation[0],
        rightEarTransform.translation[1],
        rightEarTransform.translation[2] + 0.01,
      ], // Same position + tiny Z offset
      rotation: [
        rightEarTransform.rotation[0] - 2,
        rightEarTransform.rotation[1] + 3.5,
        rightEarTransform.rotation[2] - 0.3,
      ], // Same rotation
      scale: [
        rightEarTransform.scale[0] * 0.3,
        rightEarTransform.scale[1] * 0.4,
        rightEarTransform.scale[2] * 2,
      ], // Scaled down
    });

    requestAnimationFrame(render);
  }
  requestAnimationFrame(render);
}

// =================================================================
// --- HELPER FUNCTIONS ---
// =================================================================
// NEW: Added the createTriangle function back
function createTriangle(color) {
  const vertices = [-1.0, 1.0, 0.0, 1.0, 1.0, 0.0, 0.0, -1.0, 0.0];
  const indices = [0, 1, 2];
  const colors = [...color, ...color, ...color];
  return { vertices, indices, colors };
}
// NEW: Function to create a half elliptic cone
function createHalfEllipticCone(radiusX, radiusZ, height, segments, color) {
  const vertices = [];
  const indices = [];
  const colors = [];

  // Tip vertex
  vertices.push(0, height / 2, 0);
  colors.push(...color);

  // Base vertices
  for (let i = 0; i <= segments; i++) {
    // Loop for half an ellipse, from -90 to +90 degrees
    const angle = (i / segments) * Math.PI - Math.PI / 2;
    const x = radiusX * Math.cos(angle);
    const z = radiusZ * Math.sin(angle);
    vertices.push(x, -height / 2, z);
    colors.push(...color);
  }

  // Indices for the curved side (a fan from the tip)
  for (let i = 1; i <= segments; i++) {
    indices.push(0, i, i + 1);
  }

  // Indices for the flat back face
  // Center of the flat back is the average of the first and last base points
  const backCenterIndex = vertices.length / 3;
  vertices.push(0, -height / 2, 0);
  colors.push(...color);
  for (let i = 1; i < segments; i++) {
    indices.push(backCenterIndex, i, i + 1);
  }

  return { vertices, indices, colors };
}

function createSemicircle(radius, segments, color) {
  const vertices = [];
  const indices = [];
  const colors = [];

  // Center vertex (origin)
  vertices.push(0, 0, 0);
  colors.push(...color);

  // Edge vertices for the arc
  for (let i = 0; i <= segments; i++) {
    // Loop from 0 to PI for a semicircle
    const angle = (i / segments) * Math.PI;
    vertices.push(radius * Math.cos(angle), radius * Math.sin(angle), 0);
    colors.push(...color);
  }

  // Indices to form triangles
  for (let i = 1; i <= segments; i++) {
    indices.push(0, i, i + 1);
  }

  return { vertices, indices, colors };
}
function drawPart(gl, programInfo, baseMatrix, buffers, T) {
  let modelViewMatrix = mat4.clone(baseMatrix);
  mat4.translate(modelViewMatrix, modelViewMatrix, T.translation);
  mat4.rotate(modelViewMatrix, modelViewMatrix, T.rotation[0], [1, 0, 0]);
  mat4.rotate(modelViewMatrix, modelViewMatrix, T.rotation[1], [0, 1, 0]);
  mat4.rotate(modelViewMatrix, modelViewMatrix, T.rotation[2], [0, 0, 1]);
  mat4.scale(modelViewMatrix, modelViewMatrix, T.scale);
  gl.uniformMatrix4fv(
    programInfo.uniformLocations.modelViewMatrix,
    false,
    modelViewMatrix
  );
  bindBuffers(gl, programInfo, buffers);
  gl.drawElements(gl.TRIANGLES, buffers.indices.numItems, gl.UNSIGNED_SHORT, 0);
}

function createEllipticParaboloid(a, b, height, segments) {
  const vertices = [];
  const indices = [];
  const colors = [];
  const topColor = [0.22, 0.36, 0.49]; // Quilava's dark blue/grey
  const bottomColor = [0.98, 0.94, 0.76]; // Quilava's cream color

  for (let i = 0; i <= segments; i++) {
    const u = i / segments;
    for (let j = 0; j <= segments; j++) {
      const v = (j / segments) * 2 * Math.PI;
      const x = a * u * Math.cos(v);
      const y = b * u * Math.sin(v); // 'y' is the vertical axis for the snout
      const z = height * u * u;
      vertices.push(x, y, z);

      if (y >= 0) {
        colors.push(...topColor);
      } else {
        colors.push(...bottomColor);
      }
    }
  }
  for (let i = 0; i < segments; i++) {
    for (let j = 0; j < segments; j++) {
      const first = i * (segments + 1) + j;
      const second = first + segments + 1;
      indices.push(first, second, first + 1);
      indices.push(second, second + 1, first + 1);
    }
  }
  return { vertices, indices, colors };
}

function createEllipsoid(radiusX, radiusY, radiusZ, lats, longs) {
  const vertices = [];
  const indices = [];
  const colors = [];
  const topColor = [0.22, 0.36, 0.49];
  const bottomColor = [0.98, 0.94, 0.76];
  for (let i = 0; i <= lats; i++) {
    const latAngle = (Math.PI / lats) * i - Math.PI / 2;
    for (let j = 0; j <= longs; j++) {
      const longAngle = (j / longs) * 2 * Math.PI;
      const x = radiusX * Math.cos(longAngle) * Math.cos(latAngle);
      const y = radiusY * Math.sin(latAngle);
      const z = radiusZ * Math.sin(longAngle) * Math.cos(latAngle);
      vertices.push(x, y, z);
      if (y >= 0) {
        colors.push(...topColor);
      } else {
        colors.push(...bottomColor);
      }
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
  return { vertices, indices, colors };
}

function initBuffers(gl, vertices, indices, colors) {
  const vertexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

  const colorBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);

  const indexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(
    gl.ELEMENT_ARRAY_BUFFER,
    new Uint16Array(indices),
    gl.STATIC_DRAW
  );

  indexBuffer.numItems = indices.length;

  return { position: vertexBuffer, color: colorBuffer, indices: indexBuffer };
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

  gl.bindBuffer(gl.ARRAY_BUFFER, buffers.color);
  gl.vertexAttribPointer(
    programInfo.attribLocations.vertexColor,
    3,
    gl.FLOAT,
    false,
    0,
    0
  );
  gl.enableVertexAttribArray(programInfo.attribLocations.vertexColor);

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indices);
}

function initShaderProgram(gl, vsSource, fsSource) {
  const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
  const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);
  const shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
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
