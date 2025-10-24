export class HeadShape {
  GL = null;
  SHADER_PROGRAM = null;
  _position = null;
  _color = null;
  _MMatrix = null;
  OBJECTS = []; 
  POSITION_MATRIX = LIBS.get_I4(); 
  MOVE_MATRIX = LIBS.get_I4(); 
  childs = []; 

  // STATE ANIMASI 
    animationState = "STANDING";
    animationProgress = 0.0;
    animationDuration = 1.5; 
    animationStartTime = 0.0;
    isAnimating = false;
    needsToToggleState = false;
    initialPosY = 4.0; 
    standRotX = 0.0;
    crawlRotX = -Math.PI / 2;
    standOuterColor = [1.0, 0.6, 0.1]; // Orange
    crawlOuterColor = [1.0, 0.3, 0.0]; // Merah
    standInnerColor = [1.0, 0.9, 0.2]; // Kuning
    crawlInnerColor = [1.0, 0.6, 0.1]; // Orange
    _tempFlameVertices = [];

  constructor(GL, SHADER_PROGRAM, _position, _color, _MMatrix) {
    this.GL = GL;
    this.SHADER_PROGRAM = SHADER_PROGRAM;
    this._position = _position;
    this._color = _color;
    this._MMatrix = _MMatrix;
    this.FLAME_OBJECTS = []; 

    // Colors
    const topColor = [0.22, 0.36, 0.49]; // biruw
    const bottomColor = [0.98, 0.94, 0.76]; // cream
    const scleraColor = [1.0, 1.0, 0.95]; // putiih
    const irisColor = [0.8, 0.1, 0.1]; // red
    const pupilColor = [0.0, 0.0, 0.0]; // black
    const highlightColor = [1.0, 1.0, 1.0]; // white

    // GEOMETRIES -------------------------------------------------------------------
    const headGeo = this.createEllipsoid(0.9, 0.8, 0.8, 60, 60, topColor, bottomColor);
    const snoutGeo = this.createEllipticParaboloid(0.6, 0.4, 1.0, 20, topColor, bottomColor);
    const earGeo = this.createHalfEllipticCone(0.5, 0.2, 1.0, 20, topColor);
    const innerEarGeo = this.createTriangle(irisColor);
    const scleraGeo = this.createSemicircle(1.0, 20, scleraColor);
    const irisGeo = this.createSemicircle(1.0, 20, irisColor);
    const pupilGeo = this.createSemicircle(1.0, 20, pupilColor);
    const highlightGeo = this.createSemicircle(1.0, 20, highlightColor);
    const baseEyeRotationZ = -Math.PI / 2;

    //TRANSFORM MATRICES
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

    // ADD OBJECTS TO ARRAY
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

    // HEAD FLAMES -------------------------------------------------------------------
    const baseRotationY = 1.5; // Rotasi Y dasar kepala
    const triangleGeo = this.createTrianglePositions();
    const rotationFlip = Math.PI; // 180 derajat untuk membalik segitiga
    const flameSpikes = [
      // Paku 1: Paling depan, deket muka, paling keclil
      { t: [0.0, 0.75, 0.7], r: [0.15, baseRotationY, 0.1 + rotationFlip], s: [0.1, 0.3, 1] },
      // Paku 2: Agak belakang, tinggi
      { t: [0.0, 1.15, 0.43], r: [0, baseRotationY, -0.05 + rotationFlip], s: [0.25, 0.7, 1] },
      // Paku 3: Paling tinggi di tengah
      { t: [0.0, 1.3, 0.15], r: [-0.1, baseRotationY, 0 + rotationFlip], s: [0.4, 0.8, 1] },
      // Paku 4: turun ke belakang, kecil
      { t: [0.0, 1.2, -0.1], r: [-0.4, baseRotationY, 0.05 + rotationFlip], s: [0.15, 0.45, 1] },
      // Paku 5: belakang lagi, tinggi
      { t: [0.0, 1.0, -0.3], r: [-0.6, baseRotationY, -0.1 + rotationFlip], s: [0.5, 1.1, 1] },
      // Paku 6: belakang, kecil
      { t: [0.0, 0.8, -0.4], r: [-1.1, baseRotationY, 0.15 + rotationFlip], s: [0.3, 0.8, 1] },
      // Paku 7: Paling belakang, tinggi
      { t: [0.0, 0.6, -0.6], r: [-1.2, baseRotationY, 0.15 + rotationFlip], s: [0.59, 1.3, 1] },
      // Paku 8: Paling belakang dan kecil
      { t: [0.0, 0.4, -0.6], r: [-1.5, baseRotationY, 0.2 + rotationFlip], s: [0.4, 0.7, 1] }
    ];

    flameSpikes.forEach((spike) => {
      // outer flame part (orange)
      const outerTranslation = [spike.t[0], spike.t[1], spike.t[2] - 0.01];
      const outerScale = spike.s;
      const outerRotation = spike.r;
      this.FLAME_OBJECTS.push({
        positions: triangleGeo.positions, 
        indices: triangleGeo.indices,
        colorType: 'outer',
        localMatrix: this.createTransformMatrixLIBS({
          translation: outerTranslation,
          rotation: outerRotation,
          scale: outerScale,
        }),
        baseTranslation: outerTranslation, 
        baseRotation: outerRotation,   
        baseScale: outerScale,
      });

      // inner flame part (yellow kanan)
      const innerRightTranslation = [spike.t[0], spike.t[1], spike.t[2] + 0.01];
      const innerRightScale = [spike.s[0] * 0.7, spike.s[1] * 0.7, spike.s[2]];
      const innerRightRotation = spike.r;
      this.FLAME_OBJECTS.push({
        positions: triangleGeo.positions, 
        indices: triangleGeo.indices,
        colorType: 'inner',
        localMatrix: this.createTransformMatrixLIBS({
          translation: innerRightTranslation,
          rotation: innerRightRotation,
          scale: innerRightScale,
        }),
        baseTranslation: innerRightTranslation, 
        baseRotation: innerRightRotation,  
        baseScale: innerRightScale,
      });

      // inner flame part (yellow kiri)
      const innerLeftTranslation = [
        spike.t[0] - 0.01,
        spike.t[1],
        spike.t[2] + 0.01,
      ];
      const innerLeftScale = [spike.s[0] * 0.7, spike.s[1] * 0.7, spike.s[2]];
      const innerLeftRotation = spike.r;
      this.FLAME_OBJECTS.push({
        positions: triangleGeo.positions, 
        indices: triangleGeo.indices,
        colorType: 'inner',
        localMatrix: this.createTransformMatrixLIBS({
          translation: innerLeftTranslation,
          rotation: innerLeftRotation,
          scale: innerLeftScale,
        }),
        baseTranslation: innerLeftTranslation, 
        baseRotation: innerLeftRotation,  
        baseScale: innerLeftScale,
      });
    });

    // POSISI KEPALA GLOBAL
    LIBS.translateY(this.POSITION_MATRIX, 1);
    const globalHeadScale = 1.4;
    LIBS.scaleX(this.POSITION_MATRIX, globalHeadScale);
    LIBS.scaleY(this.POSITION_MATRIX, globalHeadScale);
    LIBS.scaleZ(this.POSITION_MATRIX, globalHeadScale);
  }

  // SETUP -----------------------------------------------------------------------
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
    this.FLAME_OBJECTS.forEach((obj) => {
      obj.vertexBuffer = this.GL.createBuffer();
      this.GL.bindBuffer(this.GL.ARRAY_BUFFER, obj.vertexBuffer);
      
      const initialColor = (obj.colorType === 'outer') ? this.standOuterColor : this.standInnerColor;
      const initialVertices = [];
      for (let i = 0; i < obj.positions.length; i += 3) {
          initialVertices.push(obj.positions[i], obj.positions[i+1], obj.positions[i+2]);
          initialVertices.push(...initialColor);
      }

      this.GL.bufferData(
        this.GL.ARRAY_BUFFER,
        new Float32Array(initialVertices),
        this.GL.DYNAMIC_DRAW
      );

      obj.indexBuffer = this.GL.createBuffer();
      this.GL.bindBuffer(this.GL.ELEMENT_ARRAY_BUFFER, obj.indexBuffer);
      this.GL.bufferData(
        this.GL.ELEMENT_ARRAY_BUFFER,
        new Uint16Array(obj.indices),
        this.GL.STATIC_DRAW
      );
     });
     this.childs.forEach((child) => child.setup());
    }
  
    // RENDER -----------------------------------------------------------------------
  render(PARENT_MATRIX) {
    const MODEL_MATRIX = LIBS.multiply(
      PARENT_MATRIX,
      LIBS.multiply(this.POSITION_MATRIX, this.MOVE_MATRIX)
    );
    mat4.multiply(MODEL_MATRIX, this.POSITION_MATRIX, this.MOVE_MATRIX);
    mat4.multiply(MODEL_MATRIX, PARENT_MATRIX, MODEL_MATRIX);
    this.OBJECTS.forEach((obj) => {
      let M = MODEL_MATRIX;
      if (obj.localMatrix) M = LIBS.multiply(obj.localMatrix, MODEL_MATRIX);
      this.GL.useProgram(this.SHADER_PROGRAM);
      this.GL.uniformMatrix4fv(this._MMatrix, false, M);
      this.GL.bindBuffer(this.GL.ARRAY_BUFFER, obj.vertexBuffer);
      this.GL.vertexAttribPointer(
        this._position, 3, this.GL.FLOAT, false, 24, 0
      );
      this.GL.vertexAttribPointer(this._color, 3, this.GL.FLOAT, false, 24, 12);
      this.GL.bindBuffer(this.GL.ELEMENT_ARRAY_BUFFER, obj.indexBuffer);
      this.GL.drawElements(
        this.GL.TRIANGLES, obj.indices.length, this.GL.UNSIGNED_SHORT, 0
      );
    });
    this.FLAME_OBJECTS.forEach((obj) => {
      let M = LIBS.multiply(obj.localMatrix, MODEL_MATRIX); 
      this.GL.useProgram(this.SHADER_PROGRAM);
      this.GL.uniformMatrix4fv(this._MMatrix, false, M);
      this.GL.bindBuffer(this.GL.ARRAY_BUFFER, obj.vertexBuffer);
      this.GL.vertexAttribPointer(
        this._position, 3, this.GL.FLOAT, false, 24, 0
      );
      this.GL.vertexAttribPointer(this._color, 3, this.GL.FLOAT, false, 24, 12);
      this.GL.bindBuffer(this.GL.ELEMENT_ARRAY_BUFFER, obj.indexBuffer);
      this.GL.drawElements(
        this.GL.TRIANGLES, obj.indices.length, this.GL.UNSIGNED_SHORT, 0
      );
    });
    this.childs.forEach((child) => child.render(MODEL_MATRIX));
  }

  // FUNCTIONS -----------------------------------------------------------------------
 
  // ANIMATION HELPERS, Linear Interpolation
    _lerp(a, b, t) { 
      return a + (b - a) * t;
    }
    _lerpColor(colorA, colorB, t) {
        const r = this._lerp(colorA[0], colorB[0], t);
        const g = this._lerp(colorA[1], colorB[1], t);
        const b = this._lerp(colorA[2], colorB[2], t);
        return [r, g, b];
    }
    toggleCrawlState() {
        if (this.isAnimating) return;
        this.needsToToggleState = true;
    }

  addObject(vertices, indices, localMatrix = null) {
    if (localMatrix === null) localMatrix = LIBS.get_I4();
    this.OBJECTS.push({ vertices, indices, localMatrix });
  }

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

  createTriangle(color) { // dipakai di inner ear 
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

  createTrianglePositions() { // dipakai di flames
      const v = [
          -1.0, 1.0, 0.0,
           1.0, 1.0, 0.0,
           0.0, -1.0, 0.0
      ];
      return { positions: v, indices: [0, 1, 2] };
  }

  createHalfEllipticCone(radiusX, radiusZ, height, segments, color) { // dipakai di ear
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

  createSemicircle(radius, segments, color) { // dipakai di mata
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

  createEllipticParaboloid(a, b, height, segments, topColor, bottomColor) {// dipakai di snout
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

  createEllipsoid(radiusX, radiusY, radiusZ, lats, longs, topColor, bottomColor) { // dipakai di head
    const vertices = [],
      indices = [];
    for (let i = 0; i <= lats; i++) {
      const latAngle = (Math.PI / lats) * i - Math.PI / 2;
      for (let j = 0; j <= longs; j++) {
        const longAngle = (j / longs) * 2 * Math.PI;
        const x = radiusX * Math.cos(longAngle) * Math.cos(latAngle);
        const y = radiusY * Math.sin(latAngle);
        const z = radiusZ * Math.sin(longAngle) * Math.cos(latAngle);
        // let color;
        // const y_offset = -0.3 * radiusY; 
        //     const z_influence_factor = -0; 
        //     const separation_y = y_offset - (z * z_influence_factor);
        //     if (y >= separation_y) {
        //         color = topColor; // biru
        //     } else {
        //         color = bottomColor; // cream
        //     }
        const color = y >= 0 || x >=0 ? topColor : bottomColor;
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

// ANIMATE
  animate(time) {
    const flickerSpeed = 6.0;  // Kecepatan kedipan: Lebih kecil = lebih lambat
    const flickerAmount = 0.15; // seberapa besar kedipannya
    
  if (this.needsToToggleState) { // Mulai animasi transisi
            this.isAnimating = true;
            this.animationStartTime = time;
            this.animationProgress = 0.0;
            if (this.animationState === "STANDING") {
                this.animationState = "TO_CRAWL";
            } else if (this.animationState === "CRAWLING") {
                this.animationState = "TO_STAND";
            }
            this.needsToToggleState = false;
        }
        let crawlAmount = 0.0;
        if (this.isAnimating) {// Sedang dalam animasi transisi
            const elapsedTime = time - this.animationStartTime;
            this.animationProgress = Math.min(elapsedTime / this.animationDuration, 1.0);
            // Selesai animasi
            if (this.animationProgress >= 1.0) {//0 untuk berdiri, 1 untuk merangkak
                this.isAnimating = false;
                if (this.animationState === "TO_CRAWL") this.animationState = "CRAWLING";
                else if (this.animationState === "TO_STAND") this.animationState = "STANDING";
            }
            // Tentukan crawlAmount berdasarkan state animasi
            if (this.animationState === "TO_CRAWL") crawlAmount = this.animationProgress;
            else if (this.animationState === "TO_STAND") crawlAmount = 1.0 - this.animationProgress;
            
        } else {// Tidak sedang animasi
            if (this.animationState === "CRAWLING") crawlAmount = 1.0;
            else crawlAmount = 0.0;
        }
        // Interpolasi
        const t = crawlAmount * crawlAmount * (3 - 2 * crawlAmount);
        const currentRotationX = this._lerp(this.standRotX, this.crawlRotX, t);

        // Flicker Parameters
        const standFlickerSpeed = 6.0;
        const crawlFlickerSpeed = 20.0; 
        const standFlickerAmount = 0.15; 
        const crawlFlickerAmount = 0.24; 
        const currentFlickerSpeed = this._lerp(standFlickerSpeed, crawlFlickerSpeed, crawlAmount);
        const currentFlickerAmount = this._lerp(standFlickerAmount, crawlFlickerAmount, crawlAmount);

        // Interpolasi Warna
        const currentOuterColor = this._lerpColor(this.standOuterColor, this.crawlOuterColor, crawlAmount);
        const currentInnerColor = this._lerpColor(this.standInnerColor, this.crawlInnerColor, crawlAmount);

        this.FLAME_OBJECTS.forEach((obj, i) => {
            // A. Update Skala (Flicker)
            const actualFlicker = 0.5 + 0.5 * Math.sin(time * currentFlickerSpeed + i * 0.5); 
            const animatedScaleY = obj.baseScale[1] * (1.0 + actualFlicker * currentFlickerAmount);
            const animatedScale = [obj.baseScale[0], animatedScaleY, obj.baseScale[2]];
            obj.localMatrix = this.createTransformMatrixLIBS({
                translation: obj.baseTranslation,
                rotation: obj.baseRotation,
                scale: animatedScale,
            });

            // B. Update Warna (Buffer)
            this._tempFlameVertices.length = 0; // Kosongkan array
            const colorToUse = (obj.colorType === 'outer') ? currentOuterColor : currentInnerColor;
            
            for (let v = 0; v < obj.positions.length; v += 3) {
                this._tempFlameVertices.push(obj.positions[v], obj.positions[v+1], obj.positions[v+2]);
                this._tempFlameVertices.push(...colorToUse);
            }
            this.GL.bindBuffer(this.GL.ARRAY_BUFFER, obj.vertexBuffer);
            this.GL.bufferSubData(this.GL.ARRAY_BUFFER, 0, new Float32Array(this._tempFlameVertices));
        });
        LIBS.set_I4(this.MOVE_MATRIX);
        LIBS.rotateX(this.MOVE_MATRIX, currentRotationX);
        this.childs.forEach(child => {
            if (child.animate) {
                child.animate(time);
            }
        });
    }
}
