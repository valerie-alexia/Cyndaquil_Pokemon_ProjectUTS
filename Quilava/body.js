// body.js
export class BodyShape {
    GL = null;
    SHADER_PROGRAM = null;
    _position = null;
    _color = null;
    _MMatrix = null;
    // ===== MODIFIKASI: Menggunakan struktur OBJECTS seperti kepala.js =====
    OBJECTS = []; // { vertices, indices, localMatrix, vertexBuffer, indexBuffer }
    
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
        // ===== MODIFIKASI: Tambahkan badan utama sebagai objek pertama =====
        this.addObject(generated.vertices, generated.faces, LIBS.get_I4());

            var minY = Infinity;
        // ===== MODIFIKASI: Baca dari 'generated.vertices' =====
        for (var vi = 1; vi < generated.vertices.length; vi += 6) {
        if (generated.vertices[vi] < minY) minY = generated.vertices[vi];
        }
        // ======================================================

        var sphereL = this.generateSphere(1.4, 1.2, 1.5, 24, 20);
        var sphereR = this.generateSphere(1.4, 1.2, 1.5, 24, 20);
        var yOffset = minY - 0.2;
        
        // ===== MODIFIKASI: Gunakan addObject dengan matriks transformasi =====
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

        // ** BARU: Api 2D untuk Punggung (Body Flames) **
        // (Disalin dari kepala.js)
        // ===================================================================
        const flameOuterColor = [1.0, 0.6, 0.1]; // Orange
        const flameInnerColor = [1.0, 0.9, 0.2]; // Yellow

        const triangleGeoOuter = this.createTriangle(flameOuterColor);
        const triangleGeoInner = this.createTriangle(flameInnerColor);

        // !! PENTING: Rotasi Y dasar badan adalah 0 (tidak seperti kepala yg 1.5)
        const baseRotationY = 0.0;
        const rotationFlip = Math.PI; // 180 derajat untuk membalik segitiga

        // Data paku api (Disalin PERSIS dari kepala.js, hanya baseRotationY yg diubah)
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
        // Outer flame part (orange)
        const outerMatrix = this.createTransformMatrixLIBS({
            translation: [spike.t[0], spike.t[1], spike.t[2] - 0.01], // Geser sedikit ke belakang (untuk layering)
            rotation: spike.r,
            scale: spike.s,
        });
        this.addObject(
            triangleGeoOuter.vertices,
            triangleGeoOuter.indices,
            outerMatrix
        );
        // Inner flame part (yellow right)
        const innerMatrixRight = this.createTransformMatrixLIBS({
            translation: [spike.t[0], spike.t[1], spike.t[2] + 0.01], // Geser sedikit ke depan (untuk layering)
            rotation: spike.r,
            scale: [spike.s[0] * 0.7, spike.s[1] * 0.7, spike.s[2]], // Skala lebih kecil
        });
        this.addObject(
            triangleGeoInner.vertices,
            triangleGeoInner.indices,
            innerMatrixRight
        );

        // Inner flame part (yellow left)
        const innerMatrixLeft = this.createTransformMatrixLIBS({
            translation: [spike.t[0] - 0.01, spike.t[1], spike.t[2] + 0.01], // Geser sedikit ke depan (untuk layering)
            rotation: spike.r,
            scale: [spike.s[0] * 0.7, spike.s[1] * 0.7, spike.s[2]], // Skala lebih kecil
        });
        this.addObject(
            triangleGeoInner.vertices,
            triangleGeoInner.indices,
            innerMatrixLeft
        );
        });
        // ===================================================================

        this.MOVE_MATRIX = LIBS.get_I4();
    }

    // ===== BARU: Fungsi addObject (disalin dari kepala.js) =====
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
        this.childs.forEach((child) => child.setup());
    }

    
        // ===== MODIFIKASI: render (disalin dari kepala.js) =====
    // Ini akan menggambar setiap objek (badan, kaki, api) satu per satu
    render(PARENT_MATRIX) {
        const MODEL_MATRIX = LIBS.multiply(
        PARENT_MATRIX,
        LIBS.multiply(this.POSITION_MATRIX, this.MOVE_MATRIX)
        );

        // Blok aneh dari kepala.js - kita salin saja untuk konsistensi
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
        this.childs.forEach((child) => child.render(MODEL_MATRIX));
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
                    bcol = 0.76 + y * 0.002; //const bottomColor = [0.98, 0.94, 0.76]; // cream
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