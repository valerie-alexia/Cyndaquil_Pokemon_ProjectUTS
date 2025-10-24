// pake mat4
export class HeadShape {
    GL = null;
    SHADER_PROGRAM = null;

    // Attribute and Uniform locations
    _position = null;
    _color = null;
    _MMatrix = null;

    OBJECTS = [];

    
    POSITION_MATRIX = mat4.create(); 
    MOVE_MATRIX = mat4.create();     

    constructor(GL, SHADER_PROGRAM, _position, _color, _MMatrix) {
        this.GL = GL;
        this.SHADER_PROGRAM = SHADER_PROGRAM;
        this._position = _position;
        this._color = _color;
        this._MMatrix = _MMatrix;

        // ===== warna
        const topColor = [0.12, 0.2, 0.36]; // blue
        const bottomColor = [0.98, 0.94, 0.7]; // cream
        const scleraColor = [1.0, 1.0, 0.95]; // off-white
        const irisColor = [0.8, 0.1, 0.1]; // red
        const pupilColor = [0.0, 0.0, 0.0]; // black
        const highlightColor = [1.0, 1.0, 1.0]; // white

        // =====Geometries =====
        const headGeo = this.createEllipsoid(1, 0.85, 0.8, 60, 60, topColor, bottomColor);
        const snoutGeo = this.createEllipticParaboloid(0.7, 0.45, 1, 20, topColor, bottomColor); 
        const bodyGeo = this.createHyperboloidOneSheet(0.2, 0.5, 0.6, 30, 30, topColor, bottomColor); //leher
        // const earGeo = this.createHalfEllipticCone(0.5, 0.2, 1.0, 20, topColor);
        const ears = this.createBluntCone(0.2, 0.05, 0.6, 120, topColor);
        const innerEarGeo = this.createTriangle(irisColor);
        const scleraGeo = this.createSemicircle(1.2, 20, scleraColor);
        const irisGeo = this.createSemicircle(1.0, 20, irisColor);
        const pupilGeo = this.createSemicircle(1.0, 20, pupilColor);
        const highlightGeo = this.createSemicircle(1.0, 20, highlightColor);
        const baseEyeRotationZ = -Math.PI / 2;


        // ===== Transformation Matrices =====
        const bodyMatrix = this.createTransformMatrix({ translation: [0, -0.9, 0.09], rotation: [-Math.PI / 2, 0, 0], scale: [0.7, 0.7, 0.5] });
        const headMatrix = this.createTransformMatrix({ translation: [0, -0.06, -0.06], rotation: [0, 1.5, 0], scale: [1, 1, 1] });

        const snoutMatrix = this.createTransformMatrix({ translation: [0, 0.01, 1.4], rotation: [Math.PI, 0, 3.12], scale: [1, 1.9, 1.7] });
        
        // MATA
        const leftScleraMatrix = this.createTransformMatrix({ translation: [-0.6, 0.1, 0.7], rotation: [0.05, -1, -1.7 + baseEyeRotationZ], scale: [0.3, 0.3, 0.1] });
        const leftIrisMatrix = this.createTransformMatrix({ translation: [-0.6, 0.09, 0.78], rotation: [0.05, -1, -1.7 + baseEyeRotationZ + 6.3], scale: [0.21, 0.27, 0.1] });
        const leftPupilMatrix = this.createTransformMatrix({ translation: [-0.57, 0.07, 0.86], rotation: [0.07, -1, -1.7 + baseEyeRotationZ + 6.33], scale: [0.12, 0.12, 0.1] });
        const leftHighlightMatrix = this.createTransformMatrix({ translation: [-0.65, 0.03, 0.78], rotation: [0.05, -1, -1.7 + baseEyeRotationZ], scale: [0.06, 0.06, 0.1] });

        const rightScleraMatrix = this.createTransformMatrix({ translation: [0.6, 0.1, 0.7], rotation: [0.05, 1, 4.85 + baseEyeRotationZ], scale: [0.3, 0.3, 0.1] });
        const rightIrisMatrix = this.createTransformMatrix({ translation: [0.6, 0.09, 0.78], rotation: [0.05, 1, 1.7 + baseEyeRotationZ + 3.1], scale: [0.21, 0.27, 0.1] });
        const rightPupilMatrix = this.createTransformMatrix({ translation: [0.57, 0.07, 0.86], rotation: [0.07, 1, 1.7 + baseEyeRotationZ + 3.1], scale: [0.12, 0.12, 0.1] });
        const rightHighlightMatrix = this.createTransformMatrix({ translation: [0.65, 0.03, 0.78], rotation: [0.05, 1, 1.7 + baseEyeRotationZ + 3.2], scale: [0.06, 0.06, 0.1] });

        const earsMatrixL = mat4.create();
        // LEFT EAR 
        mat4.rotateX(earsMatrixL, earsMatrixL, -1); // <- tambah miring ke belakang (dulu -1.0)
        mat4.rotateY(earsMatrixL, earsMatrixL,  0.22); // sedikit yaw ke luar kiri
        mat4.rotateZ(earsMatrixL, earsMatrixL,  0.7); // splay keluar (boleh 0.6–0.9)
        mat4.translate(earsMatrixL, earsMatrixL, [-0.5, 0.6, 0.2]);
        this.addObject(ears.vertices, ears.indices, earsMatrixL);

        // RIGHT EAR 
        const earsMatrixR = mat4.create();
        mat4.rotateX(earsMatrixR, earsMatrixR, -1); 
        mat4.rotateY(earsMatrixR, earsMatrixR, -0.22); 
        mat4.rotateZ(earsMatrixR, earsMatrixR, -0.70); 
        mat4.translate(earsMatrixR, earsMatrixR, [ 0.5, 0.6, 0.2]);
        this.addObject(ears.vertices, ears.indices, earsMatrixR);


        // ===== Add all parts as objects =====
        this.addObject(bodyGeo.vertices, bodyGeo.indices, bodyMatrix);
        this.addObject(headGeo.vertices, headGeo.indices, headMatrix);
        this.addObject(snoutGeo.vertices, snoutGeo.indices, snoutMatrix);
        this.addObject(ears.vertices, ears.indices, earsMatrixL);
        this.addObject(ears.vertices, ears.indices, earsMatrixR);
        this.addObject(scleraGeo.vertices, scleraGeo.indices, leftScleraMatrix);
        this.addObject(irisGeo.vertices, irisGeo.indices, leftIrisMatrix);
        this.addObject(pupilGeo.vertices, pupilGeo.indices, leftPupilMatrix);
        this.addObject(highlightGeo.vertices, highlightGeo.indices, leftHighlightMatrix);
        this.addObject(scleraGeo.vertices, scleraGeo.indices, rightScleraMatrix);
        this.addObject(irisGeo.vertices, irisGeo.indices, rightIrisMatrix);
        this.addObject(pupilGeo.vertices, pupilGeo.indices, rightPupilMatrix);
        this.addObject(highlightGeo.vertices, highlightGeo.indices, rightHighlightMatrix);

        mat4.translate(this.POSITION_MATRIX, this.POSITION_MATRIX, [0, 1.4, 0.0]);
    }

    addObject(vertices, indices, localMatrix = null) {
        if (localMatrix === null) localMatrix = mat4.create();
        this.OBJECTS.push({ vertices, indices, localMatrix });
    }

    setup() {
        this.OBJECTS.forEach(obj => {
            obj.vertexBuffer = this.GL.createBuffer();
            this.GL.bindBuffer(this.GL.ARRAY_BUFFER, obj.vertexBuffer);
            this.GL.bufferData(this.GL.ARRAY_BUFFER, new Float32Array(obj.vertices), this.GL.STATIC_DRAW);

            obj.indexBuffer = this.GL.createBuffer();
            this.GL.bindBuffer(this.GL.ELEMENT_ARRAY_BUFFER, obj.indexBuffer);
            this.GL.bufferData(this.GL.ELEMENT_ARRAY_BUFFER, new Uint16Array(obj.indices), this.GL.STATIC_DRAW);
        });
    }

    render(PARENT_MATRIX) {
        // Create the base model matrix for the whole character
        const MODEL_MATRIX = mat4.create();
        mat4.multiply(MODEL_MATRIX, this.POSITION_MATRIX, this.MOVE_MATRIX);
        mat4.multiply(MODEL_MATRIX, PARENT_MATRIX, MODEL_MATRIX);

        this.OBJECTS.forEach(obj => {
            // Apply each part's local transformation
            const M = mat4.create();
            mat4.multiply(M, MODEL_MATRIX, obj.localMatrix);

            this.GL.useProgram(this.SHADER_PROGRAM);
            this.GL.uniformMatrix4fv(this._MMatrix, false, M);

            this.GL.bindBuffer(this.GL.ARRAY_BUFFER, obj.vertexBuffer);
            // Setup pointers for the interleaved buffer (position and color)
            this.GL.vertexAttribPointer(this._position, 3, this.GL.FLOAT, false, 24, 0);
            this.GL.vertexAttribPointer(this._color, 3, this.GL.FLOAT, false, 24, 12);

            this.GL.bindBuffer(this.GL.ELEMENT_ARRAY_BUFFER, obj.indexBuffer);
            this.GL.drawElements(this.GL.TRIANGLES, obj.indices.length, this.GL.UNSIGNED_SHORT, 0);
        });
    }


    createTransformMatrix({ translation, rotation, scale }) {
        const matrix = mat4.create();
        mat4.translate(matrix, matrix, translation);
        mat4.rotateX(matrix, matrix, rotation[0]);
        mat4.rotateY(matrix, matrix, rotation[1]);
        mat4.rotateZ(matrix, matrix, rotation[2]);
        mat4.scale(matrix, matrix, scale);
        return matrix;
    }
    
    
    createHyperboloidOneSheet(a, b, c, segmentsU, segmentsV, topColor, bottomColor) {
        const vertices = [], indices = [];
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
        const v = [-1.0, 1.0, 0.0, ...color, 1.0, 1.0, 0.0, ...color, 0.0, -1.0, 0.0, ...color];
        return { vertices: v, indices: [0, 1, 2] };
    }

    createHalfEllipticCone(radiusX, radiusZ, height, segments, color) {
        const vertices = [], indices = [];
        vertices.push(0, height / 2, 0, ...color);
        for (let i = 0; i <= segments; i++) {
            const angle = (i / segments) * Math.PI - Math.PI / 2;
            const x = radiusX * Math.cos(angle);
            const z = radiusZ * Math.sin(angle);
            vertices.push(x, -height / 2, z, ...color);
        }
        for (let i = 1; i <= segments; i++) indices.push(0, i, i + 1);
        const backCenterIndex = (vertices.length / 6);
        vertices.push(0, -height / 2, 0, ...color);
        for (let i = 1; i < segments; i++) indices.push(backCenterIndex, i, i + 1);
        return { vertices, indices };
    }

    createSemicircle(radius, segments, color) {
        const vertices = [], indices = [];
        vertices.push(0, 0, 0, ...color);
        for (let i = 0; i <= segments; i++) {
            const angle = (i / segments) * Math.PI;
            vertices.push(radius * Math.cos(angle), radius * Math.sin(angle), 0, ...color);
        }
        for (let i = 1; i <= segments; i++) indices.push(0, i, i + 1);
        return { vertices, indices };
    }

    createEllipticParaboloid(a, b, height, segments, topColor, bottomColor) {
        const vertices = [], indices = [];
        for (let i = 0; i <= segments; i++) {
            const u = i / segments;
            for (let j = 0; j <= segments; j++) {
                const v = (j / segments) * 2 * Math.PI;
                const x = a * u * Math.cos(v), y = b * u * Math.sin(v), z = height * u * u;
                const color = y >= 0 ? topColor : bottomColor;
                vertices.push(x, y, z, ...color);
            }
        }
        for (let i = 0; i < segments; i++) {
            for (let j = 0; j < segments; j++) {
                const first = i * (segments + 1) + j, second = first + segments + 1;
                indices.push(first, second, first + 1, second, second + 1, first + 1);
            }
        }
        return { vertices, indices };
    }

    createEllipsoid(radiusX, radiusY, radiusZ, lats, longs, topColor, bottomColor) {
        const vertices = [], indices = [];
        for (let i = 0; i <= lats; i++) {
            const latAngle = (Math.PI / lats) * i - Math.PI / 2;
            for (let j = 0; j <= longs; j++) {
                const longAngle = (j / longs) * 2 * Math.PI;
                const x = radiusX * Math.cos(longAngle) * Math.cos(latAngle);
                const y = radiusY * Math.sin(latAngle);
                const z = radiusZ * Math.sin(longAngle) * Math.cos(latAngle);
                const color = y >= 0 || x >=0 ? topColor : bottomColor;
                // const color = x >= 0 ? topColor : bottomColor;
                vertices.push(x, y, z, ...color);
            }
        }
        for (let i = 0; i < lats; i++) {
            for (let j = 0; j < longs; j++) {
                const first = i * (longs + 1) + j, second = first + longs + 1;
                indices.push(first, second, first + 1, second, second + 1, first + 1);
            }
        }
        return { vertices, indices };
    }
    
    
    createBluntCone(bottomRadius, topRadius, height, segments, color) {
        const vertices = [];
        const indices  = [];
        const halfHeight = height / 2;
        const stacks = Math.floor(segments / 2); // untuk hemisphere cap

        // === Frustum (badan kerucut terpotong) ===
        for (let i = 0; i <= segments; i++) {
            const angle = (i / segments) * 2 * Math.PI;
            const c = Math.cos(angle);
            const s = Math.sin(angle);

            // ring atas & bawah 
            vertices.push(topRadius    * c,  halfHeight, topRadius    * s, ...color);
            vertices.push(bottomRadius * c, -halfHeight, bottomRadius * s, ...color);
        }

        for (let i = 0; i < segments; i++) {
            const topLeft = i * 2;
            const topRight = topLeft + 2;
            const bottomLeft = topLeft + 1;
            const bottomRight = bottomLeft + 2;

            indices.push(topLeft, bottomLeft, topRight);
            indices.push(topRight, bottomLeft, bottomRight);
        }

        // === Tutup atas setengah bola (hemisphere) ===
        let baseIndex = vertices.length / 6;
        for (let i = 0; i <= stacks; i++) {
            const u = (i / stacks) * (Math.PI / 2);
            for (let j = 0; j <= segments; j++) {
            const v = (j / segments) * 2 * Math.PI;
            const x = topRadius * Math.cos(v) * Math.sin(u);
            const y = topRadius * Math.cos(u);
            const z = topRadius * Math.sin(v) * Math.sin(u);
            vertices.push(x, y + halfHeight, z, ...color);
            }
        }

        for (let i = 0; i < stacks; i++) {
            for (let j = 0; j < segments; j++) {
            const first = baseIndex + i * (segments + 1) + j;
            const second = first + segments + 1;
            indices.push(first, second, first + 1);
            indices.push(second, second + 1, first + 1);
            }
        }

        // === Tutup bawah (cap) ===
        baseIndex = vertices.length / 6;
        vertices.push(0, -halfHeight, 0, ...color); 
        for (let i = 0; i < segments; i++) {
            const bottom = i * 2 + 1;
            const bottomRight = bottom + 2;
            indices.push(bottom, bottomRight, baseIndex);
        }

        return { vertices, indices };
    }

}



 