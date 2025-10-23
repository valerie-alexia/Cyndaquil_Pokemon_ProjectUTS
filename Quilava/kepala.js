export class HeadShape {
  GL = null;
  SHADER_PROGRAM = null;
  _position = null;
  _color = null;
  _MMatrix = null;
  OBJECTS = []; // { vertices, indices, localMatrix, vertexBuffer, indexBuffer }
  POSITION_MATRIX = LIBS.get_I4(); // Posisi kepala relatif thd parent (body)
  MOVE_MATRIX = LIBS.get_I4(); // Rotasi lokal kepala (jika ada)
  childs = []; 

  constructor(GL, SHADER_PROGRAM, _position, _color, _MMatrix) {
    this.GL = GL;
    this.SHADER_PROGRAM = SHADER_PROGRAM;
    this._position = _position;
    this._color = _color;
    this._MMatrix = _MMatrix;
    this.FLAME_OBJECTS = []; // Array baru untuk api kepala

    // ===== Colors =====
    const topColor = [0.22, 0.36, 0.49]; // dark blue
    const bottomColor = [0.98, 0.94, 0.76]; // cream
    const scleraColor = [1.0, 1.0, 0.95]; // off-white
    const irisColor = [0.8, 0.1, 0.1]; // red
    const pupilColor = [0.0, 0.0, 0.0]; // black
    const highlightColor = [1.0, 1.0, 1.0]; // white
    const flameOuterColor = [1.0, 0.6, 0.1]; // Orange
    const flameInnerColor = [1.0, 0.9, 0.2]; // Yellow

    // ===== Geometries =====
    const headGeo = this.createEllipsoid(
      0.9, 0.8, 0.8, 60, 60, 
      topColor,
      bottomColor
    );
    const snoutGeo = this.createEllipticParaboloid(
      0.6, 0.4, 1.0, 20,
      topColor,
      bottomColor
    );
    // const bodyGeo = this.createHyperboloidOneSheet(0.7, 0.9, 1.2, 30, 30, topColor, bottomColor);
    const earGeo = this.createHalfEllipticCone(0.5, 0.2, 1.0, 20, topColor);
    const innerEarGeo = this.createTriangle(irisColor);
    const scleraGeo = this.createSemicircle(1.0, 20, scleraColor);
    const irisGeo = this.createSemicircle(1.0, 20, irisColor);
    const pupilGeo = this.createSemicircle(1.0, 20, pupilColor);
    const highlightGeo = this.createSemicircle(1.0, 20, highlightColor);
    const baseEyeRotationZ = -Math.PI / 2;

    // ===== Transformation Matrices for each part =====
    // const bodyMatrix = this.createTransformMatrix({ translation: [0, -2, 0.01], rotation: [-Math.PI / 2, 0, 0], scale: [0.7, 0.55, 1.2] });
    const headMatrix = this.createTransformMatrixLIBS({
      translation: [0, 0, 0],
      rotation: [0, 1.5, 0],
      scale: [1, 1, 1],
    });
    const snoutMatrix = this.createTransformMatrixLIBS({
      translation: [0, 0.01, 1.2],
      rotation: [Math.PI, 0, 3.1],
      scale: [1.1, 1.7, 0.7],
    });
    const leftEarMatrix = this.createTransformMatrixLIBS({
      translation: [-0.6, 0.7, 0.1],
      rotation: [1, 2.3, -1],
      scale: [0.5, 0.4, 1.1],
    });
    const rightEarMatrix = this.createTransformMatrixLIBS({
      translation: [0.6, 0.7, 0.1],
      rotation: [-1, 2.3, 1],
      scale: [0.5, 0.4, 1.1],
    });
    const leftInnerEarMatrix = this.createTransformMatrixLIBS({
      translation: [-0.6, 0.7, 0.11],
      rotation: [3, 5.8, -0.7],
      scale: [0.15, 0.16, 2.2],
    });
    const rightInnerEarMatrix = this.createTransformMatrixLIBS({
      translation: [0.6, 0.7, 0.11],
      rotation: [-3, 5.8, 0.7],
      scale: [0.15, 0.16, 2.2],
    });
    const leftScleraMatrix = this.createTransformMatrixLIBS({
      translation: [-0.57, 0.1, 0.7],
      rotation: [0.05, -1, -1.7 + baseEyeRotationZ],
      scale: [0.3, 0.3, 0.1],
    });
    const leftIrisMatrix = this.createTransformMatrixLIBS({
      translation: [-0.52, 0.09, 0.78],
      rotation: [0.05, -1, -1.7 + baseEyeRotationZ + 6.3],
      scale: [0.21, 0.27, 0.1],
    });
    const leftPupilMatrix = this.createTransformMatrixLIBS({
      translation: [-0.47, 0.07, 0.86],
      rotation: [0.07, -1, -1.7 + baseEyeRotationZ + 6.33],
      scale: [0.12, 0.12, 0.1],
    });
    const leftHighlightMatrix = this.createTransformMatrixLIBS({
      translation: [-0.52, 0.03, 0.78],
      rotation: [0.05, -1, -1.7 + baseEyeRotationZ],
      scale: [0.06, 0.06, 0.1],
    });
    const rightScleraMatrix = this.createTransformMatrixLIBS({
      translation: [0.57, 0.1, 0.7],
      rotation: [0.05, 1, 4.85 + baseEyeRotationZ],
      scale: [0.3, 0.3, 0.1],
    });
    const rightIrisMatrix = this.createTransformMatrixLIBS({
      translation: [0.52, 0.09, 0.78],
      rotation: [0.05, 1, 1.7 + baseEyeRotationZ + 3.1],
      scale: [0.21, 0.27, 0.1],
    });
    const rightPupilMatrix = this.createTransformMatrixLIBS({
      translation: [0.47, 0.07, 0.86],
      rotation: [0.07, 1, 1.7 + baseEyeRotationZ + 3.1],
      scale: [0.12, 0.12, 0.1],
    });
    const rightHighlightMatrix = this.createTransformMatrixLIBS({
      translation: [0.52, 0.03, 0.78],
      rotation: [0.05, 1, 1.7 + baseEyeRotationZ + 3.2],
      scale: [0.06, 0.06, 0.1],
    });

    // ===== Add all parts as objects =====
    // this.addObject(bodyGeo.vertices, bodyGeo.indices, bodyMatrix);
    this.addObject(headGeo.vertices, headGeo.indices, headMatrix);
    this.addObject(snoutGeo.vertices, snoutGeo.indices, snoutMatrix);
    this.addObject(earGeo.vertices, earGeo.indices, leftEarMatrix);
    this.addObject(earGeo.vertices, earGeo.indices, rightEarMatrix);
    this.addObject(innerEarGeo.vertices, innerEarGeo.indices, leftInnerEarMatrix);
    this.addObject(innerEarGeo.vertices, innerEarGeo.indices, rightInnerEarMatrix);
    this.addObject(scleraGeo.vertices, scleraGeo.indices, leftScleraMatrix);
    this.addObject(irisGeo.vertices, irisGeo.indices, leftIrisMatrix);
    this.addObject(pupilGeo.vertices, pupilGeo.indices, leftPupilMatrix);
    this.addObject(highlightGeo.vertices, highlightGeo.indices, leftHighlightMatrix);
    this.addObject(scleraGeo.vertices, scleraGeo.indices, rightScleraMatrix);
    this.addObject(irisGeo.vertices, irisGeo.indices, rightIrisMatrix);
    this.addObject(pupilGeo.vertices, pupilGeo.indices, rightPupilMatrix);
    this.addObject(highlightGeo.vertices, highlightGeo.indices, rightHighlightMatrix); 
    // ** MODIFIKASI: API 2D "Mohawk" dari DEPAN ke BELAKANG ** // ===================================================================
    const baseRotationY = 1.5; // Rotasi Y dasar kepala
    const triangleGeoOuter = this.createTriangle(flameOuterColor);
    const triangleGeoInner = this.createTriangle(flameInnerColor); // Mendefinisikan paku api sebagai garis lurus dari depan (Z positif) ke belakang (Z negatif)

    // t = translation [x, y, z], r = rotation [x, y, z], s = scale [x, y, z]
    const rotationFlip = Math.PI; // 180 derajat untuk membalik segitiga

    const flameSpikes = [
      // Paku 1: Paling depan (di atas dahi)
      { t: [0.0, 0.75, 0.7], r: [0.15, baseRotationY, 0.1 + rotationFlip], s: [0.1, 0.3, 1] },
      // Paku 2: Agak ke belakang dan lebih tinggi
      { t: [0.0, 1.15, 0.43], r: [0, baseRotationY, -0.05 + rotationFlip], s: [0.25, 0.7, 1] },
      // Paku 3: Paling tinggi di tengah
      { t: [0.0, 1.3, 0.15], r: [-0.1, baseRotationY, 0 + rotationFlip], s: [0.4, 0.8, 1] },
      // Paku 4: Menurun ke belakang
      { t: [0.0, 1.2, -0.1], r: [-0.4, baseRotationY, 0.05 + rotationFlip], s: [0.15, 0.45, 1] },
      // Paku 5: Lebih ke belakang lagi
      { t: [0.0, 1.0, -0.3], r: [-0.6, baseRotationY, -0.1 + rotationFlip], s: [0.5, 1.1, 1] },
      // Paku 6: Paling belakang, lebih rendah
      { t: [0.0, 0.8, -0.4], r: [-1.1, baseRotationY, 0.15 + rotationFlip], s: [0.3, 0.8, 1] },
      // Paku 7: Paling belakang dan paling rendah
      { t: [0.0, 0.6, -0.6], r: [-1.2, baseRotationY, 0.15 + rotationFlip], s: [0.59, 1.3, 1] },
      // Paku 8: Paling belakang dan paling rendah
      { t: [0.0, 0.4, -0.6], r: [-1.5, baseRotationY, 0.2 + rotationFlip], s: [0.4, 0.7, 1] }
    ];

    flameSpikes.forEach((spike) => {
      // --- Outer flame part (orange) ---
      const outerTranslation = [spike.t[0], spike.t[1], spike.t[2] - 0.01];
      const outerScale = spike.s;
      const outerRotation = spike.r;

      this.FLAME_OBJECTS.push({
        vertices: triangleGeoOuter.vertices,
        indices: triangleGeoOuter.indices,
        localMatrix: this.createTransformMatrixLIBS({
          translation: outerTranslation,
          rotation: outerRotation,
          scale: outerScale,
        }),
        baseTranslation: outerTranslation, // <-- TAMBAHAN BARU
        baseRotation: outerRotation,   // <-- TAMBAHAN BARU
        baseScale: outerScale,
      });

      // --- Inner flame part (yellow right) ---
      const innerRightTranslation = [spike.t[0], spike.t[1], spike.t[2] + 0.01];
      const innerRightScale = [spike.s[0] * 0.7, spike.s[1] * 0.7, spike.s[2]];
      const innerRightRotation = spike.r;

      this.FLAME_OBJECTS.push({
        vertices: triangleGeoInner.vertices,
        indices: triangleGeoInner.indices,
        localMatrix: this.createTransformMatrixLIBS({
          translation: innerRightTranslation,
          rotation: innerRightRotation,
          scale: innerRightScale,
        }),
        baseTranslation: innerRightTranslation, // <-- TAMBAHAN BARU
        baseRotation: innerRightRotation,   // <-- TAMBAHAN BARU
        baseScale: innerRightScale,
      });

      // --- Inner flame part (yellow left) ---
      const innerLeftTranslation = [
        spike.t[0] - 0.01,
        spike.t[1],
        spike.t[2] + 0.01,
      ];
      const innerLeftScale = [spike.s[0] * 0.7, spike.s[1] * 0.7, spike.s[2]];
      const innerLeftRotation = spike.r;

      this.FLAME_OBJECTS.push({
        vertices: triangleGeoInner.vertices,
        indices: triangleGeoInner.indices,
        localMatrix: this.createTransformMatrixLIBS({
          translation: innerLeftTranslation,
          rotation: innerLeftRotation,
          scale: innerLeftScale,
        }),
        baseTranslation: innerLeftTranslation, // <-- TAMBAHAN BARU
        baseRotation: innerLeftRotation,   // <-- TAMBAHAN BARU
        baseScale: innerLeftScale,
      });
    });

    LIBS.translateY(this.POSITION_MATRIX, 1);
    // Skala global (diterapkan pada POSITION_MATRIX)
    const globalHeadScale = 1.4;
    LIBS.scaleX(this.POSITION_MATRIX, globalHeadScale);
    LIBS.scaleY(this.POSITION_MATRIX, globalHeadScale);
    LIBS.scaleZ(this.POSITION_MATRIX, globalHeadScale);
  }

  addObject(vertices, indices, localMatrix = null) {
    if (localMatrix === null) localMatrix = LIBS.get_I4();
    this.OBJECTS.push({ vertices, indices, localMatrix });
  }

  setup() {
    this.OBJECTS.forEach((obj) => {
      obj.vertexBuffer = this.GL.createBuffer();
      this.GL.bindBuffer(this.GL.ARRAY_BUFFER, obj.vertexBuffer);
      this.GL.bufferData(
        this.GL.ARRAY_BUFFER,
        new Float32Array(obj.vertices),
        this.GL.STATIC_DRAW
      );

      obj.indexBuffer = this.GL.createBuffer();
      this.GL.bindBuffer(this.GL.ELEMENT_ARRAY_BUFFER, obj.indexBuffer);
      this.GL.bufferData(
        this.GL.ELEMENT_ARRAY_BUFFER,
        new Uint16Array(obj.indices),
        this.GL.STATIC_DRAW
      );
    });
    this.FLAME_OBJECTS.forEach((child) => {
      child.vertexBuffer = this.GL.createBuffer();
      this.GL.bindBuffer(this.GL.ARRAY_BUFFER, child.vertexBuffer);
      this.GL.bufferData(
        this.GL.ARRAY_BUFFER,
        new Float32Array(child.vertices),
        this.GL.STATIC_DRAW
      );

      child.indexBuffer = this.GL.createBuffer();
      this.GL.bindBuffer(this.GL.ELEMENT_ARRAY_BUFFER, child.indexBuffer);
      this.GL.bufferData(
        this.GL.ELEMENT_ARRAY_BUFFER,
        new Uint16Array(child.indices),
        this.GL.STATIC_DRAW
      );
    });
    this.childs.forEach((child) => child.setup());
  }

  render(PARENT_MATRIX) {
    const MODEL_MATRIX = LIBS.multiply(
      PARENT_MATRIX,
      LIBS.multiply(this.POSITION_MATRIX, this.MOVE_MATRIX)
    );

    //tanpa yg dibawah ini klo dihilangin, dia kepalanya lepas jika di putar
    mat4.multiply(MODEL_MATRIX, this.POSITION_MATRIX, this.MOVE_MATRIX);
    mat4.multiply(MODEL_MATRIX, PARENT_MATRIX, MODEL_MATRIX);

    this.OBJECTS.forEach((obj) => {
      let M = MODEL_MATRIX;
      if (obj.localMatrix) M = LIBS.multiply(obj.localMatrix, MODEL_MATRIX);

      this.GL.useProgram(this.SHADER_PROGRAM);
      this.GL.uniformMatrix4fv(this._MMatrix, false, M);

      this.GL.bindBuffer(this.GL.ARRAY_BUFFER, obj.vertexBuffer);
      this.GL.vertexAttribPointer(
        this._position,
        3,
        this.GL.FLOAT,
        false,
        24,
        0
      );
      this.GL.vertexAttribPointer(this._color, 3, this.GL.FLOAT, false, 24, 12);

      this.GL.bindBuffer(this.GL.ELEMENT_ARRAY_BUFFER, obj.indexBuffer);
      this.GL.drawElements(
        this.GL.TRIANGLES,
        obj.indices.length,
        this.GL.UNSIGNED_SHORT,
        0
      );
    });

    this.FLAME_OBJECTS.forEach((obj) => {
      let M = LIBS.multiply(obj.localMatrix, MODEL_MATRIX); // Gunakan localMatrix api

      this.GL.useProgram(this.SHADER_PROGRAM);
      this.GL.uniformMatrix4fv(this._MMatrix, false, M);

      // ... (kode bindBuffer dan drawElements, sama seperti this.OBJECTS) ...
      this.GL.bindBuffer(this.GL.ARRAY_BUFFER, obj.vertexBuffer);
      this.GL.vertexAttribPointer(
        this._position,
        3,
        this.GL.FLOAT,
        false,
        24,
        0
      );
      this.GL.vertexAttribPointer(this._color, 3, this.GL.FLOAT, false, 24, 12);
      this.GL.bindBuffer(this.GL.ELEMENT_ARRAY_BUFFER, obj.indexBuffer);
      this.GL.drawElements(
        this.GL.TRIANGLES,
        obj.indices.length,
        this.GL.UNSIGNED_SHORT,
        0
      );
    });

    this.childs.forEach((child) => child.render(MODEL_MATRIX));
  }

  // --- All your geometry creation and helper functions are now methods of this class ---

  createTransformMatrixLIBS({ translation, rotation, scale }) {
    const matrix = LIBS.get_I4();
    LIBS.scaleX(matrix, scale[0]);
    LIBS.scaleY(matrix, scale[1]);
    LIBS.scaleZ(matrix, scale[2]);
    LIBS.rotateZ(matrix, rotation[2]);
    LIBS.rotateY(matrix, rotation[1]);
    LIBS.rotateX(matrix, rotation[0]);
    LIBS.translateX(matrix, translation[0]);
    LIBS.translateY(matrix, translation[1]);
    LIBS.translateZ(matrix, translation[2]);
    return matrix;
  }

  createHyperboloidOneSheet(
    a,
    b,
    c,
    segmentsU,
    segmentsV,
    topColor,
    bottomColor
  ) {
    const vertices = [],
      indices = [];
    for (let i = 0; i <= segmentsU; i++) {
      const u = -1.0 + (2.0 * i) / segmentsU;
      for (let j = 0; j <= segmentsV; j++) {
        const v = (j / segmentsV) * 2 * Math.PI;
        const x = a * Math.cosh(u) * Math.cos(v);
        const y = b * Math.cosh(u) * Math.sin(v);
        const z = c * Math.sinh(u);
        const color = y >= 0 ? topColor : bottomColor;
        vertices.push(x, y, z, ...color);
      }
    }
    for (let i = 0; i < segmentsU; i++) {
      for (let j = 0; j < segmentsV; j++) {
        const first = i * (segmentsV + 1) + j;
        const second = first + segmentsV + 1;
        indices.push(first, second, first + 1, second, second + 1, first + 1);
      }
    }
    return { vertices, indices };
  }

  createTriangle(color) {
    const v = [
      -1.0, 1.0, 0.0,
      ...color,
      1.0, 1.0, 0.0, 
      ...color,
      0.0, -1.0, 0.0,
      ...color,
    ];
    return { vertices: v, indices: [0, 1, 2] };
  }

  createHalfEllipticCone(radiusX, radiusZ, height, segments, color) {
    const vertices = [],
      indices = [];
    vertices.push(0, height / 2, 0, ...color);
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI - Math.PI / 2;
      const x = radiusX * Math.cos(angle);
      const z = radiusZ * Math.sin(angle);
      vertices.push(x, -height / 2, z, ...color);
    }
    for (let i = 1; i <= segments; i++) indices.push(0, i, i + 1);
    const backCenterIndex = vertices.length / 6;
    vertices.push(0, -height / 2, 0, ...color);
    for (let i = 1; i < segments; i++) indices.push(backCenterIndex, i, i + 1);
    return { vertices, indices };
  }

  createSemicircle(radius, segments, color) {
    const vertices = [],
      indices = [];
    vertices.push(0, 0, 0, ...color);
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI;
      vertices.push(
        radius * Math.cos(angle),
        radius * Math.sin(angle),
        0,
        ...color
      );
    }
    for (let i = 1; i <= segments; i++) indices.push(0, i, i + 1);
    return { vertices, indices };
  }

  createEllipticParaboloid(a, b, height, segments, topColor, bottomColor) {
    const vertices = [],
      indices = [];
    for (let i = 0; i <= segments; i++) {
      const u = i / segments;
      for (let j = 0; j <= segments; j++) {
        const v = (j / segments) * 2 * Math.PI;
        const x = a * u * Math.cos(v),
          y = b * u * Math.sin(v),
          z = height * u * u;
        const color = y >= 0 ? topColor : bottomColor;
        vertices.push(x, y, z, ...color);
      }
    }
    for (let i = 0; i < segments; i++) {
      for (let j = 0; j < segments; j++) {
        const first = i * (segments + 1) + j,
          second = first + segments + 1;
        indices.push(first, second, first + 1, second, second + 1, first + 1);
      }
    }
    return { vertices, indices };
  }

  createEllipsoid(
    radiusX,
    radiusY,
    radiusZ,
    lats,
    longs,
    topColor,
    bottomColor
  ) {
    const vertices = [],
      indices = [];
    for (let i = 0; i <= lats; i++) {
      const latAngle = (Math.PI / lats) * i - Math.PI / 2;
      for (let j = 0; j <= longs; j++) {
        const longAngle = (j / longs) * 2 * Math.PI;
        const x = radiusX * Math.cos(longAngle) * Math.cos(latAngle);
        const y = radiusY * Math.sin(latAngle);
        const z = radiusZ * Math.sin(longAngle) * Math.cos(latAngle);
        const color = y >= 0 ? topColor : bottomColor;
        vertices.push(x, y, z, ...color);
      }
    }
    for (let i = 0; i < lats; i++) {
      for (let j = 0; j < longs; j++) {
        const first = i * (longs + 1) + j,
          second = first + longs + 1;
        indices.push(first, second, first + 1, second, second + 1, first + 1);
      }
    }
    return { vertices, indices };
  }

  animate(time) {
    const flickerSpeed = 6.0;  // Kecepatan kedipan: Lebih kecil = lebih lambat
    const flickerAmount = 0.15; // seberapa besar kedipannya

    this.FLAME_OBJECTS.forEach((obj, i) => {
    // Pastikan flicker selalu positif atau nol untuk menghindari skala negatif
    // Atau bisa juga biar di tengah-tengah 1.0, jadi 1.0 +/- flicker
    const actualFlicker = 0.5 + 0.5 * Math.sin(time * flickerSpeed + i * 0.5); // Nilai 0 sampai 1
    const animatedScaleY = obj.baseScale[1] * (1.0 + actualFlicker * flickerAmount); 

    // Buat array skala baru
    const animatedScale = [obj.baseScale[0], animatedScaleY, obj.baseScale[2]];

    obj.localMatrix = this.createTransformMatrixLIBS({
      translation: obj.baseTranslation,
      rotation: obj.baseRotation,
      scale: animatedScale,
    });
  });
}
}