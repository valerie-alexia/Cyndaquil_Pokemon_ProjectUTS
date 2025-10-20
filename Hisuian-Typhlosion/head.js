export class HeadShape {
    GL = null;
    SHADER_PROGRAM = null;

    _position = null;
    _color = null;
    _MMatrix = null;

    OBJECTS = [];

    POSITION_MATRIX = LIBS.get_I4();
    MOVE_MATRIX = LIBS.get_I4();

    constructor(GL, SHADER_PROGRAM, _position, _color, _MMatrix) {
        this.GL = GL;
        this.SHADER_PROGRAM = SHADER_PROGRAM;
        this._position = _position;
        this._color = _color;
        this._MMatrix = _MMatrix;

        // ===== HEAD =====
        const head = this.createEllipsoid(1, 0.9, 1, 60, 60,
            [0.25, 0.2, 0.3],
            [0.9, 0.8, 0.6]
        );
        this.addObject(head.vertices, head.indices);

        // ===== SNOUT =====
        const snout = this.createEllipticParaboloid(0.8, 0.4, 0.7, 100,
            [0.25, 0.2, 0.3], [0.9, 0.8, 0.6]);
        const snoutMatrix = LIBS.get_I4();
        LIBS.translateY(snoutMatrix, 0.01);
        LIBS.translateZ(snoutMatrix, 1.8);
        LIBS.rotateX(snoutMatrix, Math.PI / 1);
        LIBS.rotateZ(snoutMatrix, 3.1);
        snoutMatrix[0] *= 1.1;
        snoutMatrix[5] *= 1.7;
        snoutMatrix[10] *= 0.7;
        this.addObject(snout.vertices, snout.indices, snoutMatrix);

        // ===== EARS =====
        const ears = this.createBluntCone(0.25, 0.1, 0.4, 120, [0.25, 0.2, 0.3]);
        let earsMatrix = LIBS.get_I4();
        LIBS.translateY(earsMatrix, 0.5);
        LIBS.translateX(earsMatrix, -0.8);
        LIBS.rotateZ(earsMatrix, 0.8);
        LIBS.rotateX(earsMatrix, -1);
        this.addObject(ears.vertices, ears.indices, earsMatrix);
        const earsMatrix2 = LIBS.get_I4();
        LIBS.translateY(earsMatrix2, 0.5);
        LIBS.translateX(earsMatrix2, 0.8);
        LIBS.rotateZ(earsMatrix2, -0.8);
        LIBS.rotateX(earsMatrix2, -1);
        this.addObject(ears.vertices, ears.indices, earsMatrix2);


        // ===== EYES =====
        // --- 3. MATA (BARU DITAMBAHKAN) ---
        const eyeGeo = this.createEllipsoid(0.15, 0.1, 0.05, 16, 16, [1, 0, 0], [1, 0, 0]); // Geometri mata sipit
        const eyeMatrix = LIBS.get_I4();
        LIBS.translateY(eyeMatrix, -0.02);
        LIBS.translateX(eyeMatrix, -0.67);
        LIBS.translateZ(eyeMatrix, 1.2);
        LIBS.rotateZ(eyeMatrix, 5);
        LIBS.rotateX(eyeMatrix, 0.6);
        // Mata Kiri
        this.addObject(eyeGeo.vertices, eyeGeo.indices, eyeMatrix);

        // Mata Kanan
        this.addObject(eyeGeo.vertices, eyeGeo.indices, eyeMatrix
        );

        console.log("head+snout:", this.OBJECTS);

        // === Final base transform ===
        LIBS.set_I4(this.POSITION_MATRIX);
        LIBS.translateY(this.POSITION_MATRIX, 0.5);
        LIBS.translateZ(this.POSITION_MATRIX, 0.55);
        LIBS.rotateX(this.POSITION_MATRIX, 0.1);
    }

    addObject(vertices, indices, localMatrix = null) {
        this.OBJECTS.push({ vertices, indices, localMatrix });
    }
    createTriangle(color) {
        const vertices = [-1.0, 1.0, 0.0, 1.0, 1.0, 0.0, 0.0, -1.0, 0.0];
        const indices = [0, 1, 2];
        const colors = [...color, ...color, ...color];
        return { vertices, indices, colors };
    }
    createHalfEllipticCone(radiusX, radiusZ, height, segments, color) {
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
    createSemicircle(radius, segments, color) {
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

    createEllipsoid(rx, ry, rz, lats, longs, topColor, bottomColor) {
        const vertices = [], indices = [];
        for (let i = 0; i <= lats; i++) {
            const latAngle = (Math.PI / lats) * i - Math.PI / 2;
            for (let j = 0; j <= longs; j++) {
                const longAngle = (j / longs) * 2 * Math.PI;
                const x = rx * Math.cos(longAngle) * Math.cos(latAngle);
                const y = ry * Math.sin(latAngle);
                const z = rz * Math.sin(longAngle) * Math.cos(latAngle);
                let c = y >= 0.2 ? topColor : bottomColor;
                if (z < -0 * rz) {
                    c = topColor;
                }
                vertices.push(x, y, z, ...c);
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
    // Ganti fungsi createBluntCone lama Anda dengan fungsi baru ini di dalam class HeadShape
    createBluntCone(bottomRadius, topRadius, height, segments, color) {
        const vertices = [];
        const indices = [];
        const halfHeight = height / 2;
        const stacks = Math.floor(segments / 2); // Jumlah tumpukan untuk tutup bulat

        // BAGIAN 1: Membuat Badan Kerucut Terpotong (Frustum)
        // Loop ini membuat cincin vertex di bagian atas dan bawah
        for (let i = 0; i <= segments; i++) {
            const angle = (i / segments) * 2 * Math.PI;
            const cosAngle = Math.cos(angle);
            const sinAngle = Math.sin(angle);

            // Lingkaran atas (tempat tutup bulat akan menempel)
            vertices.push(topRadius * cosAngle, halfHeight, topRadius * sinAngle, ...color);
            // Lingkaran bawah (alas)
            vertices.push(bottomRadius * cosAngle, -halfHeight, bottomRadius * sinAngle, ...color);
        }

        // Loop ini membuat sisi-sisi samping yang menghubungkan cincin atas dan bawah
        for (let i = 0; i < segments; i++) {
            const topLeft = i * 2;
            const topRight = topLeft + 2;
            const bottomLeft = topLeft + 1;
            const bottomRight = bottomLeft + 2;

            indices.push(topLeft, bottomLeft, topRight); // Segitiga pertama
            indices.push(topRight, bottomLeft, bottomRight); // Segitiga kedua
        }

        // BAGIAN 2: Membuat Tutup Atas yang Bulat (Hemisphere)
        let baseIndex = vertices.length / 6; // Index awal untuk vertex tutup bulat
        // Loop untuk membuat vertex setengah bola (hemisphere)
        for (let i = 0; i <= stacks; i++) {
            const u = i / stacks * (Math.PI / 2); // Hanya 90 derajat (setengah bola)
            for (let j = 0; j <= segments; j++) {
                const v = j / segments * 2 * Math.PI;

                // Kalkulasi posisi vertex di permukaan bola
                const x = topRadius * Math.cos(v) * Math.sin(u);
                const y = topRadius * Math.cos(u); // Sumbu Y adalah "atas"
                const z = topRadius * Math.sin(v) * Math.sin(u);

                // Pindahkan vertex ke puncak kerucut dan tambahkan ke array
                vertices.push(x, y + halfHeight, z, ...color);
            }
        }

        // Loop untuk membuat sisi-sisi (faces) dari tutup bulat
        for (let i = 0; i < stacks; i++) {
            for (let j = 0; j < segments; j++) {
                const first = baseIndex + i * (segments + 1) + j;
                const second = first + segments + 1;
                indices.push(first, second, first + 1);
                indices.push(second, second + 1, first + 1);
            }
        }

        // BAGIAN 3: Membuat Tutup Alas (agar tidak bolong)
        baseIndex = vertices.length / 6;
        vertices.push(0, -halfHeight, 0, ...color); // Titik tengah alas
        for (let i = 0; i < segments; i++) {
            const bottom = i * 2 + 1;
            const bottomRight = bottom + 2;
            indices.push(bottom, bottomRight, baseIndex);
        }

        return { vertices, indices };
    }

    createEllipticParaboloid(a, b, height, segments, topColor, bottomColor) {
        const vertices = [], indices = [];
        for (let i = 0; i <= segments; i++) {
            const u = i / segments;
            for (let j = 0; j <= segments; j++) {
                const v = (j / segments) * 2 * Math.PI;
                const x = a * u * Math.cos(v);
                const y = b * u * Math.sin(v);
                const z = height * 2.5 * u * u;
                const c = y >= 0.1 ? topColor : bottomColor;
                vertices.push(x, y, z, ...c);
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
        return { vertices, indices };
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
        // Fix urutan matrix agar sama dengan sistem body.js
        const MODEL_MATRIX = LIBS.multiply(PARENT_MATRIX, LIBS.multiply(this.POSITION_MATRIX, this.MOVE_MATRIX));

        this.OBJECTS.forEach(obj => {
            let M = MODEL_MATRIX;
            if (obj.localMatrix) M = LIBS.multiply(obj.localMatrix, MODEL_MATRIX);

            this.GL.useProgram(this.SHADER_PROGRAM);
            this.GL.uniformMatrix4fv(this._MMatrix, false, M);

            this.GL.bindBuffer(this.GL.ARRAY_BUFFER, obj.vertexBuffer);
            this.GL.vertexAttribPointer(this._position, 3, this.GL.FLOAT, false, 24, 0);
            this.GL.vertexAttribPointer(this._color, 3, this.GL.FLOAT, false, 24, 12);

            this.GL.bindBuffer(this.GL.ELEMENT_ARRAY_BUFFER, obj.indexBuffer);
            this.GL.drawElements(this.GL.TRIANGLES, obj.indices.length, this.GL.UNSIGNED_SHORT, 0);
        });
    }
}