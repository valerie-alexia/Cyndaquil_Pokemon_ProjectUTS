// --- FUNGSI generateCustomTail DIMODIFIKASI UNTUK API JUGA ---
function generateCustomTail(
    length, baseRadius, tipRadius, 
    numSegments, numSpikes, 
    colorStart, colorEnd, // Terima dua warna
    growDirectionY = -1 // -1 untuk ekor (bawah), +1 untuk api (atas)
) { 
    const vertices = [];
    const faces = [];
    const stack = numSegments * 10; 
    const step = 50; 

    for (let i = 0; i <= stack; i++) {
        const u = i / stack; // 0 (pangkal) ke 1 (ujung)
        let currentRadius = baseRadius - u * (baseRadius - tipRadius);
        
        // --- Bentuk Gelombang & Putaran (biarkan seperti setelan ekor) ---
        const waveFrequency = 4; 
        const waveMagnitude = 0.2 * baseRadius; 
        const waveX = waveMagnitude * Math.sin(u * Math.PI * waveFrequency);
        const waveZ = waveMagnitude * 0.5 * Math.sin(u * Math.PI * waveFrequency + Math.PI / 2); 
        const rotationAngle = u * Math.PI * 3; 
        
        for (let j = 0; j <= step; j++) {
            const v = (j / step) * 2 * Math.PI;
            
            let localX = currentRadius * Math.cos(v + rotationAngle);
            let localZ = currentRadius * Math.sin(v + rotationAngle) * 0.7; // Pipih
            
            let x = localX + waveX;
            // --- Arah Pertumbuhan (BARU) ---
            let y = length * u * growDirectionY; // Tumbuh ke atas atau bawah
            let z = localZ + waveZ;

            // --- Spikes (muncul di sekeliling) ---
            if (numSpikes > 0) {
                const spikeDensity = numSpikes; 
                const normalized_v = v / (2 * Math.PI); 
                const phase = normalized_v * spikeDensity;
                // Modifikasi spikeVal agar lebih runcing
                const spikeVal = Math.pow(Math.max(0, Math.sin(phase * Math.PI * 2)), 2); 
                
                const spikeFactor = 0.4 * currentRadius * spikeVal; // Besarkan sedikit spikeFactor
                
                // --- Aplikasikan spike ke arah luar dari pusat lokal ---
                const spikeDirX = Math.cos(v + rotationAngle);
                const spikeDirZ = Math.sin(v + rotationAngle);
                x += spikeFactor * spikeDirX;
                z += spikeFactor * spikeDirZ;
                y += spikeFactor * 0.3 * growDirectionY; // Sedikit dorong Y juga
                // HAPUS: if (z > 0) { ... } 
            }

            // --- Warna Gradasi (BARU) ---
            let r_final = colorStart.r * (1 - u) + colorEnd.r * u;
            let g_final = colorStart.g * (1 - u) + colorEnd.g * u;
            let b_final = colorStart.b * (1 - u) + colorEnd.b * u;

            vertices.push(x, y, z, r_final, g_final, b_final);
        }
    }

    // --- Faces (Pastikan urutan sudah benar) ---
    for (let i = 0; i < stack; i++) {
        for (let j = 0; j < step; j++) {
            const first = i * (step + 1) + j;
            const second = first + 1;
            const third = first + (step + 1);
            const fourth = third + 1;
            // Urutan dibalik agar menghadap keluar
            faces.push(first, fourth, second);
            faces.push(first, third, fourth);
        }
    }
    return { vertices, faces };
}
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
        const head = this.createEllipsoid(1, 0.9, 1, 200, 200,
            [0.25, 0.2, 0.3],
            [0.9, 0.8, 0.6]
        );
        this.addObject(head.vertices, head.indices);

        // ===== SNOUT =====
        const snout = this.createEllipticParaboloid(0.8, 0.42, 0.7, 250,
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


        // Anda bisa terus menambahkan lebih banyak elemen api dengan posisi, rotasi, dan skala yang berbeda
        // untuk mencapai bentuk yang diinginkan.

        // ===== EYES =====
        const eyeGeo = this.createTriangle([1.0, 1.0, 0.95], [0, 0.1, 0], [0, -0.1, 0.1], [-0.9, 0, 0]); // Geometri mata sipit
        const eyeMatrix = LIBS.get_I4();
        LIBS.translateX(eyeMatrix, 0.8);
        LIBS.translateZ(eyeMatrix, 0.8);
        LIBS.rotateX(eyeMatrix, 0.2);
        LIBS.rotateY(eyeMatrix, 1.2);
        // Mata Kanan
        this.addObject(eyeGeo.vertices, eyeGeo.indices, eyeMatrix);
        // Kelopak
        const kelopak = this.createSemicircle(0.45, 10, [0.25, 0.2, 0.3]);
        const kelopakMatrix = LIBS.get_I4();
        LIBS.translateY(kelopakMatrix, 0.07);
        LIBS.translateX(kelopakMatrix, 0.68);
        LIBS.translateZ(kelopakMatrix, 1.2);
        LIBS.rotateX(kelopakMatrix, -0.2);
        LIBS.rotateY(kelopakMatrix, 1.2);
        LIBS.rotateZ(kelopakMatrix, 0.2);
        this.addObject(kelopak.vertices, kelopak.indices, kelopakMatrix);
        // Pupil
        const pupil = this.createShape(0.1, 10, [1.84, 0.32, 0.35]);
        const pupilMatrix = LIBS.get_I4();
        LIBS.scaleX(pupilMatrix, 0.9);
        LIBS.scaleY(pupilMatrix, 0.7);
        LIBS.translateX(pupilMatrix, 0.68);
        LIBS.translateY(pupilMatrix, -0.02);
        LIBS.translateZ(pupilMatrix, 1.22);
        LIBS.rotateX(pupilMatrix, -0.2);
        LIBS.rotateY(pupilMatrix, 1.2);
        LIBS.rotateZ(pupilMatrix, 0.2);
        this.addObject(pupil.vertices, pupil.indices, pupilMatrix);
        const pupil0 = this.createShape(0.1, 10, [0, 0, 0]);
        const pupilMatrix0 = LIBS.get_I4();
        LIBS.scaleX(pupilMatrix0, 0.3);
        LIBS.scaleY(pupilMatrix0, 0.2);
        LIBS.translateX(pupilMatrix0, 0.68);
        LIBS.translateY(pupilMatrix0, -0.012);
        LIBS.translateZ(pupilMatrix0, 1.24);
        LIBS.rotateX(pupilMatrix0, -0.2);
        LIBS.rotateY(pupilMatrix0, 1.2);
        LIBS.rotateZ(pupilMatrix0, 0.2);
        this.addObject(pupil0.vertices, pupil0.indices, pupilMatrix0);
        const pupil1 = this.createShape(0.1, 10, [1, 1, 1]);
        const pupilMatrix1 = LIBS.get_I4();
        LIBS.scaleX(pupilMatrix1, 0.32);
        LIBS.scaleY(pupilMatrix1, 0.27);
        LIBS.translateX(pupilMatrix1, 0.7);
        LIBS.translateY(pupilMatrix1, -0.02);
        LIBS.translateZ(pupilMatrix1, 1.21);
        LIBS.rotateX(pupilMatrix1, -0.2);
        LIBS.rotateY(pupilMatrix1, 1.2);
        LIBS.rotateZ(pupilMatrix1, 0.2);
        this.addObject(pupil1.vertices, pupil1.indices, pupilMatrix1);



        // Mata Kanan
        const reyeGeo = this.createTriangle([1.0, 1.0, 0.95], [0, 0.1, 0], [0, -0.1, 0.1], [-0.9, 0, 0]); // Geometri mata sipit
        const reyeMatrix = LIBS.get_I4();
        LIBS.translateX(reyeMatrix, -0.9);
        LIBS.translateZ(reyeMatrix, 0.8);
        LIBS.rotateX(reyeMatrix, 0.2);
        LIBS.rotateY(reyeMatrix, 2);
        // Mata Kanan
        this.addObject(reyeGeo.vertices, reyeGeo.indices, reyeMatrix);
        // Kelopak
        const rkelopak = this.createSemicircle(0.45, 10, [0.25, 0.2, 0.3]);
        const rkelopakMatrix = LIBS.get_I4();
        LIBS.translateY(rkelopakMatrix, 0.07);
        LIBS.translateX(rkelopakMatrix, -0.68);
        LIBS.translateZ(rkelopakMatrix, 1.2);
        LIBS.rotateX(rkelopakMatrix, -0.2);
        LIBS.rotateY(rkelopakMatrix, -1.2);
        LIBS.rotateZ(rkelopakMatrix, -0.2);
        this.addObject(rkelopak.vertices, rkelopak.indices, rkelopakMatrix);
        // Pupil
        const rpupil = this.createShape(0.1, 10, [1.84, 0.32, 0.35]);
        const rpupilMatrix = LIBS.get_I4();
        LIBS.scaleX(rpupilMatrix, 0.9);
        LIBS.scaleY(rpupilMatrix, 0.7);
        LIBS.translateX(rpupilMatrix, -0.7);
        LIBS.translateY(rpupilMatrix, -0.02);
        LIBS.translateZ(rpupilMatrix, 1.22);
        LIBS.rotateX(rpupilMatrix, -0.2);
        LIBS.rotateY(rpupilMatrix, -1.2);
        LIBS.rotateZ(rpupilMatrix, -0.2);
        this.addObject(rpupil.vertices, rpupil.indices, rpupilMatrix);
        const rpupil0 = this.createShape(0.1, 10, [0, 0, 0]);
        const rpupilMatrix0 = LIBS.get_I4();
        LIBS.scaleX(rpupilMatrix0, 0.3);
        LIBS.scaleY(rpupilMatrix0, 0.2);
        LIBS.translateX(rpupilMatrix0, -0.7);
        LIBS.translateY(rpupilMatrix0, -0.012);
        LIBS.translateZ(rpupilMatrix0, 1.24);
        LIBS.rotateX(rpupilMatrix0, -0.2);
        LIBS.rotateY(rpupilMatrix0, -1.2);
        LIBS.rotateZ(rpupilMatrix0, -0.2);
        this.addObject(rpupil0.vertices, rpupil0.indices, rpupilMatrix0);
        const rpupil1 = this.createShape(0.1, 10, [1, 1, 1]);
        const rpupilMatrix1 = LIBS.get_I4();
        LIBS.scaleX(rpupilMatrix1, 0.32);
        LIBS.scaleY(rpupilMatrix1, 0.27);
        LIBS.translateX(rpupilMatrix1, -0.72);
        LIBS.translateY(rpupilMatrix1, -0.02);
        LIBS.translateZ(rpupilMatrix1, 1.21);
        LIBS.rotateX(rpupilMatrix1, -0.2);
        LIBS.rotateY(rpupilMatrix1, -1.2);
        LIBS.rotateZ(rpupilMatrix1, -0.2);
        this.addObject(rpupil1.vertices, rpupil1.indices, rpupilMatrix1);
        

        
        // ===== DETAILS =====
        // const eyeGeo = this.createSemicircle(0.4, 20, [1.0, 1.0, 0.95]); // Geometri mata sipit
        // const eyeMatrix = LIBS.get_I4();
        // LIBS.translateY(eyeMatrix, 0.2);
        // LIBS.translateX(eyeMatrix, -0.67);
        // LIBS.translateZ(eyeMatrix, 1);
        // LIBS.rotateZ(eyeMatrix, 3.2);
        // LIBS.rotateX(eyeMatrix, 0.3);
        // LIBS.rotateY(eyeMatrix, 2.1)

        // ===== DEBUG =====
        // console.log("head+snout:", this.OBJECTS);


        // === Final base transform ===
        LIBS.set_I4(this.POSITION_MATRIX);
        LIBS.translateY(this.POSITION_MATRIX, 0.5);
        LIBS.translateZ(this.POSITION_MATRIX, 0.55);
        LIBS.rotateX(this.POSITION_MATRIX, 0.1);
    }

    addObject(vertices, indices, localMatrix = null) {
        this.OBJECTS.push({ vertices, indices, localMatrix });
    }

    createSemicircle(radius, segments, color) {
        const vertices = [];
        const indices = [];

        // Center vertex (origin) with color
        vertices.push(0, 0, 0, ...color);

        // Edge vertices for the arc
        for (let i = 0; i <= segments; i++) {
            const angle = (i / segments) * Math.PI; // 0 to PI
            const x = radius * Math.cos(angle);
            const y = radius * Math.sin(angle) * radius / 2;
            vertices.push(x, y, 0, ...color);
        }

        // Indices to form triangles
        for (let i = 1; i <= segments; i++) {
            indices.push(0, i, i + 1);
        }

        return { vertices, indices };
    }
    createShape(radius, segments, color) {
        const vertices = [0, 0, 0, ...color]; // Center vertex (x,y,z, r,g,b)
        const indices = [];
        for (let i = 0; i <= segments; i++) {
            const angle = (i / segments) * 2 * Math.PI; // Full circle
            const x = radius * Math.cos(angle);
            const y = radius * Math.sin(angle);
            vertices.push(x, y, 0, ...color);
        }
        // Indices form a triangle fan originating from the center (vertex 0)
        for (let i = 1; i <= segments; i++) {
            indices.push(0, i, i + 1);
        }
        return { vertices, indices };
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
                // --- Blok Logika Warna yang Benar ---
                let c;
                if (z < 0) {
                    // Bagian belakang (z negatif) selalu topColor (ungu)
                    c = topColor;
                } else {
                    // Bagian depan (z >= 0), kita buat batas "U"

                    // Atur tinggi batas di "pipi" (samping, z=0)
                    const boundary_y_at_side = 0.6 * rz;
                    // Atur tinggi batas di "moncong" (depan, z=rz)
                    const boundary_y_at_front = -0.3 * rz;

                    let boundary_y = boundary_y_at_side;
                    if (ry > 0) {
                        // Kurva kuadratik untuk membuat lengkungan
                        const z_norm_sq = (y / ry) * (y / ry); // (z/rz)^2
                        boundary_y = boundary_y_at_side - (boundary_y_at_side - boundary_y_at_front) * z_norm_sq;
                    }

                    // Terapkan warna berdasarkan batas lengkung
                    if (y >= boundary_y) {
                        c = topColor; // Di atas batas (dahi)
                    } else {
                        c = bottomColor; // Di bawah batas (moncong)
                    }
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

    createEllipticParaboloid(a, b, height, segments, topColor, bottomColor) {
        const vertices = [], indices = [];
        for (let i = 0; i <= segments; i++) {
            const u = i / segments;
            const u_sq = u * u;
            for (let j = 0; j <= segments; j++) {
                const v = (j / segments) * 2 * Math.PI;
                const x = a * u * Math.cos(v);
                const y = b * u * Math.sin(v);
                const z = height * 2.5 * u * u;
                // Atur batas Y di "samping" moncong (saat x maksimum)
                // Gunakan u_sq agar naiknya lebih cepat di pangkal
                const boundary_y_at_side = 1 * b * u_sq;

                // Atur batas Y di "tengah" moncong (saat x = 0)
                // Kita juga buat ini naik, tapi mungkin lebih lambat
                const boundary_y_at_front = 0.0 * b * u; // Biarkan ini linear (atau ganti u_sq jika mau)

                let boundary_y = boundary_y_at_side;

                const max_x = a * u; // Radius 'a' (lebar) saat ini
                if (max_x > 0.001) { // Hindari pembagian dengan nol di ujung
                    // x_norm_sq = 0 di tengah (x=0), 1 di samping (x=max_x)
                    const x_norm_sq = (x / max_x) * (x / max_x);
                    // Interpolasi kuadratik untuk membuat lengkungan "U"
                    boundary_y = boundary_y_at_front + (boundary_y_at_side - boundary_y_at_front) * x_norm_sq;
                } else {
                    boundary_y = boundary_y_at_front; // Tepat di ujung
                }

                let c;
                if (y >= boundary_y) {
                    c = topColor; // Bagian atas moncong (ungu)
                } else {
                    c = bottomColor; // Bagian bawah moncong (krem)
                }
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

    createTriangle(color, v1 = [-0.1, 0.3, 0], v2 = [0.1, -0.3, 0], v3 = [-0.7, 0, 0]) {
        // Data vertex sekarang interleaved (x,y,z,r,g,b)
        const vertices = [
            ...v1, ...color, // Titik 1 (Base top, sedikit ke kiri)
            ...v2, ...color, // Titik 2 (Base bottom, sedikit ke kanan)
            ...v3, ...color  // Titik 3 (Tip, jauh ke kiri)
        ];
        const indices = [0, 1, 2];
        return { vertices, indices };
    }
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
    createFlameElement(baseRadius, tipRadius, height, segments, primaryColor, secondaryColor) {
        const vertices = [];
        const indices = [];

        // Mirip dengan kerucut tumpul, tapi dengan pewarnaan gradien
        for (let i = 0; i <= segments; i++) {
            const u = i / segments; // 0 di bawah, 1 di atas
            for (let j = 0; j <= segments; j++) {
                const v = (j / segments) * 2 * Math.PI;

                const radius = baseRadius * (1 - u) + tipRadius * u; // Radius dari besar ke kecil
                const x = radius * Math.cos(v);
                const y = height * u; // Memanjang ke atas
                const z = radius * Math.sin(v);

                // Warna gradien: primaryColor di bawah, secondaryColor di atas
                let c = [
                    primaryColor[0] * (1 - u) + secondaryColor[0] * u,
                    primaryColor[1] * (1 - u) + secondaryColor[1] * u,
                    primaryColor[2] * (1 - u) + secondaryColor[2] * u
                ];
                vertices.push(x, y, z, ...c);
            }
        }

        // Indeks sama seperti kerucut/silinder
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