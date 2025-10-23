// body.js
export class BodyShape {
    GL = null;
    SHADER_PROGRAM = null;
    _position = null;
    _color = null;
    _MMatrix = null;
    OBJECTS = []; // { vertices, indices, localMatrix, vertexBuffer, indexBuffer }
    FLAME_OBJECTS = [];
    
    POSITION_MATRIX = LIBS.get_I4();
    MOVE_MATRIX = LIBS.get_I4();
    childs = [];

    constructor(GL, SHADER_PROGRAM, _position, _color, _MMatrix) {
        this.GL = GL;
        this.SHADER_PROGRAM = SHADER_PROGRAM;
        this._position = _position;
        this._color = _color;
        this._MMatrix = _MMatrix;

        const generated = this.generateHyper1d(1, 4, 1, 200, 200, 0.14);
        this.addObject(generated.vertices, generated.faces, LIBS.get_I4());

            var minY = Infinity;
        for (var vi = 1; vi < generated.vertices.length; vi += 6) {
        if (generated.vertices[vi] < minY) minY = generated.vertices[vi];
        }

        var sphereL = this.generateSphere(1.4, 1.2, 1.5, 24, 20);
        var sphereR = this.generateSphere(1.4, 1.2, 1.5, 24, 20);
        var yOffset = minY - 0.2;
        
        const sphereLMatrix = this.createTransformMatrixLIBS({
        translation: [-0.1, yOffset, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
        });
        this.addObject(sphereL.vertices, sphereL.faces, sphereLMatrix);

        const sphereRMatrix = this.createTransformMatrixLIBS({
        translation: [0.1, yOffset, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
        });
        this.addObject(sphereR.vertices, sphereR.faces, sphereRMatrix);

        // Body Flames
        const flameOuterColor = [1.0, 0.6, 0.1]; // Orange
        const flameInnerColor = [1.0, 0.9, 0.2]; // Yellow
        const triangleGeoOuter = this.createTriangle(flameOuterColor);
        const triangleGeoInner = this.createTriangle(flameInnerColor);
        const baseRotationY = 0.0;
        const rotationFlip = Math.PI; 

        const flameSpikes = [
            // Paku 1: tengah panjang
            //x,y,z       rotX,rotY,rotZ           scaleX,scaleY,scaleZ
            { t: [0.0, -2.3, -2], r: [-0.7, baseRotationY, rotationFlip], s: [1, 2, 1] },
            // Paku 2: kanan panjang
            { t: [1.5, -2.6, -1.7], r: [-0.7, baseRotationY, -0.6 + rotationFlip], s: [1, 1.5, 1] },
            // Paku 3: Kiri panjang
            { t: [-1.5, -2.6, -1.7], r: [-0.7, baseRotationY, 0.6 + rotationFlip], s: [1, 1.5, 1] },
            
            // Paku 4: kanan lebih ke depan medium
            { t: [2, -3.3, -1], r: [-0.7, baseRotationY, -0.8 + rotationFlip], s: [0.4, 1.2, 1] },
            // Paku 5: kiri lebih ke depan medium
            { t: [-2, -3.3, -1], r: [-0.7, baseRotationY, 0.8 + rotationFlip], s: [0.4, 1.2, 1] },
        
            // Paku 6: kanan paling belakang tipis
            { t: [0.7, -2.3, -2], r: [-0.7, baseRotationY, -0.3 + rotationFlip], s: [0.3, 1, 1] }, 
            // Paku 7: kiri paling belakang tipis
            { t: [-0.7, -2.3, -2], r: [-0.7, baseRotationY, 0.3 + rotationFlip], s: [0.3, 1, 1] }
        ];

        flameSpikes.forEach((spike) => {
            const outerTranslation = [spike.t[0], spike.t[1], spike.t[2] - 0.01];
            const outerRotation = spike.r;
            const outerScale = spike.s;

            this.FLAME_OBJECTS.push({
                vertices: triangleGeoOuter.vertices,
                indices: triangleGeoOuter.indices,
                localMatrix: this.createTransformMatrixLIBS({
                    translation: outerTranslation, rotation: outerRotation, scale: outerScale
                }),
                baseTranslation: outerTranslation,
                baseRotation: outerRotation,
                baseScale: outerScale
            });
            // Inner flame part (yellow right)
            const innerRightTranslation = [spike.t[0], spike.t[1], spike.t[2] + 0.01];
            const innerRightRotation = spike.r;
            const innerRightScale = [spike.s[0] * 0.7, spike.s[1] * 0.7, spike.s[2]];
            this.FLAME_OBJECTS.push({
                vertices: triangleGeoInner.vertices,
                indices: triangleGeoInner.indices,
                localMatrix: this.createTransformMatrixLIBS({
                    translation: innerRightTranslation, rotation: innerRightRotation, scale: innerRightScale
                }),
                baseTranslation: innerRightTranslation,
                baseRotation: innerRightRotation,
                baseScale: innerRightScale
            });

            // Inner flame part (yellow left)
            const innerLeftTranslation = [spike.t[0] - 0.01, spike.t[1], spike.t[2] + 0.01];
            const innerLeftRotation = spike.r;
            const innerLeftScale = [spike.s[0] * 0.7, spike.s[1] * 0.7, spike.s[2]];
            this.FLAME_OBJECTS.push({
                vertices: triangleGeoInner.vertices,
                indices: triangleGeoInner.indices,
                localMatrix: this.createTransformMatrixLIBS({
                translation: innerLeftTranslation, rotation: innerLeftRotation, scale: innerLeftScale
            }),
            baseTranslation: innerLeftTranslation,
            baseRotation: innerLeftRotation,
            baseScale: innerLeftScale
        });
    });

        this.MOVE_MATRIX = LIBS.get_I4();

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
        this.FLAME_OBJECTS.forEach((obj) => {
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
        this.childs.forEach((child) => child.setup());
    }

    render(PARENT_MATRIX) {
        const MODEL_MATRIX = LIBS.multiply(
        PARENT_MATRIX,
        LIBS.multiply(this.POSITION_MATRIX, this.MOVE_MATRIX)
        );

        // mat4.multiply(MODEL_MATRIX, this.POSITION_MATRIX, this.MOVE_MATRIX);
        // mat4.multiply(MODEL_MATRIX, PARENT_MATRIX, MODEL_MATRIX);

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
            let M = LIBS.multiply(obj.localMatrix, MODEL_MATRIX);

            this.GL.useProgram(this.SHADER_PROGRAM);
            this.GL.uniformMatrix4fv(this._MMatrix, false, M);

            this.GL.bindBuffer(this.GL.ARRAY_BUFFER, obj.vertexBuffer);
            this.GL.vertexAttribPointer(this._position, 3, this.GL.FLOAT, false, 24, 0);
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

    animate(time) {
        const flickerSpeed = 6.0;  // Kecepatan kedipan
        const flickerAmount = 0.2; // Intensitas kedipan

        this.FLAME_OBJECTS.forEach((obj, i) => {
        // Nilai 0 sampai 1
        const actualFlicker = 0.5 + 0.5 * Math.sin(time * flickerSpeed + i * 0.5);
        const animatedScaleY = obj.baseScale[1] * (1.0 + actualFlicker * flickerAmount); 

        const animatedScale = [obj.baseScale[0], animatedScaleY, obj.baseScale[2]];

        obj.localMatrix = this.createTransformMatrixLIBS({
            translation: obj.baseTranslation,
            rotation: obj.baseRotation,
            scale: animatedScale,  
        });    
    });
    const breathSpeed = 3; // Lebih kecil = napas lebih lambat dan tenang
    const moveAmount = 0.05; // 0.03 = mengembang/menyusut sebesar 3%

    // Hitung faktor gerakan menggunakan sinus (hasilnya antara -1 dan 1)
    const breathFactor = Math.sin(time * breathSpeed); 

    // Hitung pergerakan Y (naik/turun)
    const moveY = breathFactor * moveAmount;

    // Reset matriks gerakan internal badan (PENTING!)
    LIBS.set_I4(this.MOVE_MATRIX);
    
    // Terapkan pergerakan NAIK/TURUN ke matriks gerakan badan
    LIBS.translateY(this.MOVE_MATRIX, moveY);
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

    generateSphere(a, b, c, stack, step) {
        var vertices = [];
        var faces = [];

        // Generate vertices and colors
        for (var i = 0; i <= stack; i++) {
            var u = i / stack * Math.PI - (Math.PI / 2); // Latitude
            for (var j = 0; j <= step; j++) {
                var v = j / step * 2 * Math.PI - Math.PI; // Longitude

                var x = a * Math.cos(v) * Math.cos(u);
                var y = b * Math.sin(u);
                var z = c * Math.sin(v) * Math.cos(u);
                let r, g, bcol;
                if (z >= 0) {
                    r = 0.98 + y * 0.002;
                    g = 0.94 + y * 0.002;
                    bcol = 0.76 + y * 0.002; // cream
                } else {
                    // Belakang (darkblue-gray)
                    r = 0.22; g = 0.36; bcol = 0.49; 
                }
                // Push vertex position
                vertices.push(x, y, z);
                // Push color
                vertices.push(r, g, bcol);
            }
        }

        // Generate faces (indices)
        for (var i = 0; i < stack; i++) {
            for (var j = 0; j < step; j++) {
                var first = i * (step + 1) + j;
                var second = first + 1;
                var third = first + (step + 1);
                var fourth = third + 1;
                faces.push(first, second, fourth);
                faces.push(first, fourth, third);
            }
        }
        return { vertices, faces };
    }

    generateHyper1d(a, b, c, stack, step, uBottomTrimRatio = 0) {
        var vertices = [];
        var faces = [];

        var margin = 0.4;
        var uMax = (Math.PI / 2) - margin;
        var uMin = -uMax + (2 * uMax) * Math.max(0, Math.min(0.49, uBottomTrimRatio));

        function smoothstep(edge0, edge1, x) {
            var t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
            return t * t * (3 - 2 * t);
        }

        for (var i = 0; i <= stack / 2; i++) {
            var u = uMin + (uMax - uMin) * (i / stack);
            for (var j = 0; j <= step; j++) {
                var v = j / step * 2 * Math.PI - Math.PI;

                var x = a * Math.cos(v) * 1 / Math.cos(u);
                var y = b * Math.tan(u);
                var z = c * Math.sin(v) * 1 / Math.cos(u);

                // neck scaling
                var vertical01 = i / (stack / 2);
                var neckRegion = smoothstep(0.6, 1.0, vertical01);
                var neckScale = 1.0 - 0.09 * (neckRegion * neckRegion);
                x *= neckScale;
                z *= neckScale;

                let r, g, bcol;
                if (z >= 0) {
                    r = 0.98 + y * 0.002;
                    g = 0.94 + y * 0.002;
                    bcol = 0.76 + y * 0.002;
                } else {
                    // Belakang (blue-gray) 
                    r = 0.22; g = 0.36; bcol = 0.49;
                }

                vertices.push(x, y, z);
                vertices.push(r, g, bcol);
            }
        }
        // Generate faces (indices)
        for (var i = 0; i < stack; i++) {
            for (var j = 0; j < step; j++) {
                var first = i * (step + 1) + j;
                var second = first + 1;
                var third = first + (step + 1);
                var fourth = third + 1;
                faces.push(first, second, fourth);
                faces.push(first, fourth, third);
            }
        }
        return { vertices, faces };
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
}