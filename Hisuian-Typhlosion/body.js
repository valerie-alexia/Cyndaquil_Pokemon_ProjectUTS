function generateFlame(baseRadius, tipRadius, height, numSegments, numSlices, color) {
    const vertices = [];
    const faces = [];

    // Base circle
    for (let i = 0; i <= numSlices; i++) {
        const theta = (i / numSlices) * Math.PI * 2;
        const x = baseRadius * Math.cos(theta);
        const y = 0;
        const z = baseRadius * Math.sin(theta);
        vertices.push(x, y, z, color.r, color.g, color.b);
    }

    // Body
    for (let i = 1; i <= numSegments; i++) {
        const u = i / numSegments;
        const currentRadius = baseRadius * (1 - u) + tipRadius * u;
        const currentY = height * u; // Api tumbuh ke ATAS (Y positif)

        for (let j = 0; j <= numSlices; j++) {
            const theta = (j / numSlices) * Math.PI * 2;
            let x = currentRadius * Math.cos(theta);
            let z = currentRadius * Math.sin(theta);
            const spikeModifier = 0.05 * baseRadius * Math.sin(theta * 3 + u * Math.PI * 2);
            x += spikeModifier * Math.cos(theta);
            z += spikeModifier * Math.sin(theta);
            vertices.push(x, currentY, z, color.r, color.g, color.b);
        }
    }

    // --- PERBAIKAN BUG TERBALIK ---
    for (let i = 0; i < numSegments + 1; i++) {
        for (let j = 0; j < numSlices; j++) {
            const first = i * (numSlices + 1) + j;
            const second = first + 1;
            const third = (i + 1) * (numSlices + 1) + j;
            const fourth = third + 1;
            if (i < numSegments) {
                faces.push(first, fourth, second); // Urutan dibalik
                faces.push(first, third, fourth); // Urutan dibalik
            }
        }
    }
    return { vertices, faces };
}
function generateCustomTail(length, baseRadius, tipRadius, numSegments, numSpikes, topColor) { // Hapus bottomColor dari parameter
    const vertices = [];
    const faces = [];
    const stack = numSegments * 10;
    const step = 50; // Meningkatkan 'step' agar lebih halus di sekeliling

    for (let i = 0; i <= stack; i++) {
        const u = i / stack; // dari 0 (pangkal) ke 1 (ujung)
        let currentRadius = baseRadius - u * (baseRadius - tipRadius);

        // --- Modifikasi Bentuk Gelombang dan Putaran ---
        const waveFrequency = 4; // Berapa kali ekor bergelombang
        const waveMagnitude = 0.2 * baseRadius; // Seberapa besar gelombangnya

        // Gelombang di sumbu X (kiri-kanan)
        const waveX = waveMagnitude * Math.sin(u * Math.PI * waveFrequency);
        // Gelombang di sumbu Z (atas-bawah)
        const waveZ = waveMagnitude * 0.5 * Math.sin(u * Math.PI * waveFrequency + Math.PI / 2); // Fase berbeda

        // Putaran ekor seiring panjangnya
        const rotationAngle = u * Math.PI * 3; // Berapa kali ekor berputar (3 putaran penuh)

        // --- Modifikasi Radius untuk Membuat Bentuk Tidak Seragam ---
        // Membuat ekor terlihat lebih "gemuk" atau "tipis" di titik-titik tertentu
        // Misalnya, lebih tebal di tengah, lebih tipis di pangkal dan ujung
        // const radiusModifier = 0.8 + 0.2 * Math.sin(u * Math.PI * 2); // Gelombang radius
        // currentRadius *= radiusModifier;


        for (let j = 0; j <= step; j++) {
            const v = (j / step) * 2 * Math.PI;

            // Posisi di lingkaran/elips dengan putaran
            let localX = currentRadius * Math.cos(v + rotationAngle);
            let localZ = currentRadius * Math.sin(v + rotationAngle) * 0.7; // Agak pipih

            // Terapkan gelombang ke posisi global
            let x = localX + waveX;
            let y = -length * u; // Ekor tumbuh ke bawah
            let z = localZ + waveZ;

            // --- Tonjolan/Spikes (Disesuaikan agar lebih halus) ---
            if (numSpikes > 0) {
                const spikeDensity = numSpikes; // Contoh: 3 spike per bagian utama
                const normalized_v = v / (2 * Math.PI); // 0-1
                const phase = normalized_v * spikeDensity;
                const spikeVal = Math.max(0, Math.sin(phase * Math.PI * 2)); // Bentuk gelombang untuk spike

                // Hanya tonjolkan ke arah luar (Z positif) dan sedikit ke Y
                const spikeFactor = 0.8 * currentRadius * spikeVal;
                if (z > 0) { // Hanya tonjolkan di sisi "atas/punggung"
                    z += spikeFactor;
                    y += spikeFactor * 0.5; // Sedikit naik juga
                }
            }


            vertices.push(x, y, z, topColor.r, topColor.g, topColor.b);
        }
    }

    // Generate faces 
    for (let i = 0; i < stack; i++) {
        for (let j = 0; j < step; j++) {
            const first = i * (step + 1) + j;
            const second = first + 1;
            const third = first + (step + 1);
            const fourth = third + 1;
            faces.push(first, second, fourth);
            faces.push(first, fourth, third);
        }
    }
    return { vertices, faces };
}
function generateSphere(a, b, c, stack, step) {
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
            if (z >= -1) {
                r = 0.9 + y * 0.005;
                g = 0.8 + y * 0.01;
                bcol = 0.6 + y * 0.01;
            } else {
                // Belakang (purple-gray)
                r = 0.25; g = 0.2; bcol = 0.3;
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

function generateHyper1d(a, b, c, stack, step, uBottomTrimRatio = 0) {
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

            var vertical01 = i / (stack / 2);
            var neckRegion = smoothstep(0.6, 1.0, vertical01);
            var neckScale = 1.0 - 0.35 * (neckRegion * neckRegion);
            x *= neckScale;
            z *= neckScale;

            let r, g, bcol;
            // 1. Tentukan rentang Y untuk kalung ungu
            const neckBandTop = -0.2; // Batas atas leher
            const neckBandBottom = -0.6; // Batas bawah leher

            // 2. Cek apakah vertex ini ada di dalam rentang kalung
            if (y < neckBandTop && y > neckBandBottom) {
            //     // JIKA IYA: Warnai ungu (warna kalung)
                r = 0.25; g = 0.2; bcol = 0.3;
            } else {
            if (z >= 0) {
                // Depan (krem)
                r = 0.9 + y * 0.005;
                g = 0.8 + y * 0.01;
                bcol = 0.6 + y * 0.01;
            } else {
                // Belakang (ungu)
                r = 0.25; g = 0.2; bcol = 0.3;
            }
            }

            vertices.push(x, y, z);
            vertices.push(r, g, bcol);
        }
    }

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

export class BodyShape {
    GL = null;
    SHADER_PROGRAM = null;
    _position = null;
    _color = null;
    _MMatrix = null;
    OBJECT_VERTEX = null;
    OBJECT_FACES = null;
    vertex = [];
    faces = [];
    POSITION_MATRIX = LIBS.get_I4();
    MOVE_MATRIX = LIBS.get_I4();
    childs = [];

    constructor(GL, SHADER_PROGRAM, _position, _color, _Mmatrix) {
        this.GL = GL;
        this.SHADER_PROGRAM = SHADER_PROGRAM;
        this._position = _position;
        this._color = _color;
        this._MMatrix = _Mmatrix;

        const appendGeometry = (vertices, faces, tx = 0, ty = 0, tz = 0, overrideColor = null, shadeLikeBody = false, zFrontBias = 0, yLightBias = 0) => {
            var baseIndex = this.vertex.length / 6;
            for (var i = 0; i < vertices.length; i += 6) {
                var x = vertices[i] + tx;
                var y = vertices[i + 1] + ty;
                var z = vertices[i + 2] + tz;
                var r, g, bcol;
                if (shadeLikeBody) {
                    if (z + zFrontBias >= 0) {
                        var yLit = y + yLightBias;
                        r = 0.9 + yLit * 0.005;
                        g = 0.8 + yLit * 0.01;
                        bcol = 0.6 + yLit * 0.01;
                    } else {
                        // UPDATED COLOR
                        r = 0.25; g = 0.2; bcol = 0.3;
                    }
                } else if (overrideColor) {
                    r = overrideColor.r; g = overrideColor.g; bcol = overrideColor.b;
                } else {
                    r = vertices[i + 3]; g = vertices[i + 4]; bcol = vertices[i + 5];
                }
                this.vertex.push(x, y, z, r, g, bcol);
            }
            for (var j = 0; j < faces.length; j++) {
                this.faces.push(faces[j] + baseIndex);
            }
        };

        // Body memanjang
        const generated = generateHyper1d(1, 4, 1, 200, 200, 0.14);
        this.vertex = generated.vertices;
        this.faces = generated.faces;

        var minY = Infinity;
        for (var vi = 1; vi < this.vertex.length; vi += 6) {
            if (this.vertex[vi] < minY) minY = this.vertex[vi];
        }

        // Bola penutup
        // var sphereL = generateSphere(1, 1, 1.4, 24, 20);
        var sphereR = generateSphere(1.3, 1.3, 1.55, 24, 20);
        var yOffset = minY - 0.2;
        // -0.6 sama 0.6 sebelumnya
        // appendGeometry(sphereL.vertices, sphereL.faces, -0.1, yOffset, 0, null, true, 0.1, 0.00);
        appendGeometry(sphereR.vertices, sphereR.faces, 0.1, yOffset, 0, null, true, 0.12, 0.03);

         // ===== ADD TAIL (CUSTOM SHAPE) =====
        const tailTopColor = { r: 0.25, g: 0.2, b: 0.3 }; // Warna ungu gelap

        const customTailGeo = generateCustomTail(
            1.5, // Panjang total ekor
            0.6, // Radius dasar ekor
            0.1, // Radius ujung ekor
            10,   // Jumlah segmen utama
            3,   // Jumlah tonjolan/spikes
            tailTopColor
        );

        // Buat matriks transformasi untuk menempatkan dan memutar ekor
        const tailMatrix = LIBS.get_I4();
        LIBS.translateY(tailMatrix, -5.5);
        LIBS.translateZ(tailMatrix, -1.6);
        // Sedikit menekuk ke bawah
        LIBS.rotateX(tailMatrix, 0.5);
        LIBS.rotateZ(tailMatrix, -0.32);

        // Terapkan transformasi ke vertex ekor
        const transformedFlame = [];
        for (let i = 0; i < customTailGeo.vertices.length; i += 6) {
            const originalVertex = [
                customTailGeo.vertices[i],
                customTailGeo.vertices[i + 1],
                customTailGeo.vertices[i + 2],
                1 // W
            ];
            // Kalikan vertex dengan matriks transformasi
            const transformedPoint = LIBS.multiply_vector(tailMatrix, originalVertex);

            transformedFlame.push(
                transformedPoint[0], transformedPoint[1], transformedPoint[2],
                customTailGeo.vertices[i + 3], // r
                customTailGeo.vertices[i + 4], // g
                customTailGeo.vertices[i + 5]  // b
            );
        }
        // Gunakan appendGeometry untuk menggabungkan vertex ekor yang sudah ditransformasi
        appendGeometry(transformedTailVertices, customTailGeo.faces);

        // // 4. TAMBAHKAN API LEHER (DI POSISI ATAS)
        // const numFlames = 10; 
        // const neckRadius = 1.0; 
        // const neckVerticalPosition = -0.4; // <-- POSISI ATAS (DI LEHER)
        // const flameHeight = 1.0; // <-- DIPERPENDEK AGAR TIDAK SAMPAI PUNGGUNG
        // const flameBaseRadius = 0.3; 
        // const flameTipRadius = 0.05; 
        // const flameColorBase = { r: 0.8, g: 0.1, b: 0.4 }; 
        // const flameColorTip = { r: 0.9, g: 0.3, b: 0.6 }; 

        // for (let i = 0; i < numFlames; i++) {
        //     const angle = (i / numFlames) * 2 * Math.PI; 
        //     const flameX = Math.cos(angle) * neckRadius;
        //     const flameZ = Math.sin(angle) * neckRadius;
        //     const flameY = neckVerticalPosition; // y = -0.4

        //     const flameGeo = generateFlame(flameBaseRadius, flameTipRadius, flameHeight, 5, 8, flameColorBase);

        //     const flameMatrix = LIBS.get_I4();
        //     LIBS.translateY(flameMatrix, flameY);
        //     LIBS.translateX(flameMatrix, flameX);
        //     LIBS.translateZ(flameMatrix, flameZ);

        //     LIBS.rotateY(flameMatrix, angle + Math.PI / 2); 

        //     // --- PERBAIKAN ARAH API ---
        //     // Arahkan ke ATAS dan BELAKANG, BUKAN ke bawah
        //     LIBS.rotateX(flameMatrix, -Math.PI * 0.4); // <-- Putar ke belakang

        //     var transformedFlameVertices = [];
        //     for (let j = 0; j < flameGeo.vertices.length; j += 6) {
        //         const originalVertex = [flameGeo.vertices[j], flameGeo.vertices[j+1], flameGeo.vertices[j+2], 1];
        //         const transformedPoint = LIBS.multiply_vector(flameMatrix, originalVertex);

        //         let r_final, g_final, b_final;
        //         const normalizedHeight = flameGeo.vertices[j+1] / flameHeight; 
        //         r_final = flameColorBase.r * (1 - normalizedHeight) + flameColorTip.r * normalizedHeight;
        //         g_final = flameColorBase.g * (1 - normalizedHeight) + flameColorTip.g * normalizedHeight;
        //         b_final = flameColorBase.b * (1 - normalizedHeight) + flameColorTip.b * normalizedHeight;

        //         transformedFlameVertices.push(
        //             transformedPoint[0], transformedPoint[1], transformedPoint[2],
        //             r_final, g_final, b_final
        //         );
        //     }
        //     appendGeometry(transformedFlameVertices, flameGeo.faces);
        // }

        // ===== ADD TAIL (CUSTOM SHAPE) =====
        const tailTopColor = { r: 0.25, g: 0.2, b: 0.3 }; // Warna ungu gelap

        const customTailGeo = generateCustomTail(
            1.5, // Panjang total ekor
            0.6, // Radius dasar ekor
            0.1, // Radius ujung ekor
            10,   // Jumlah segmen utama
            3,   // Jumlah tonjolan/spikes
            tailTopColor
        );

        // Buat matriks transformasi untuk menempatkan dan memutar ekor
        const tailMatrix = LIBS.get_I4();
        LIBS.translateY(tailMatrix, -5.5);
        LIBS.translateZ(tailMatrix, -1.6);
        // Sedikit menekuk ke bawah
        LIBS.rotateX(tailMatrix, 0.5);
        LIBS.rotateZ(tailMatrix, -0.32);

        // Terapkan transformasi ke vertex ekor
        const transformedTailVertices = [];
        for (let i = 0; i < customTailGeo.vertices.length; i += 6) {
            const originalVertex = [
                customTailGeo.vertices[i],
                customTailGeo.vertices[i + 1],
                customTailGeo.vertices[i + 2],
                1 // W
            ];
            // Kalikan vertex dengan matriks transformasi
            const transformedPoint = LIBS.multiply_vector(tailMatrix, originalVertex);

            transformedTailVertices.push(
                transformedPoint[0], transformedPoint[1], transformedPoint[2],
                customTailGeo.vertices[i + 3], // r
                customTailGeo.vertices[i + 4], // g
                customTailGeo.vertices[i + 5]  // b
            );
        }
        // Gunakan appendGeometry untuk menggabungkan vertex ekor yang sudah ditransformasi
        appendGeometry(transformedTailVertices, customTailGeo.faces);

        this.MOVE_MATRIX = LIBS.get_I4();
    }

    setup() {
        this.OBJECT_VERTEX = this.GL.createBuffer();
        this.GL.bindBuffer(this.GL.ARRAY_BUFFER, this.OBJECT_VERTEX);
        this.GL.bufferData(this.GL.ARRAY_BUFFER, new Float32Array(this.vertex), this.GL.STATIC_DRAW);

        this.OBJECT_FACES = this.GL.createBuffer();
        this.GL.bindBuffer(this.GL.ELEMENT_ARRAY_BUFFER, this.OBJECT_FACES);
        this.GL.bufferData(this.GL.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.faces), this.GL.STATIC_DRAW);

        this.childs.forEach(child => child.setup());
    }

    render(PARENT_MATRIX) {
        this.MODEL_MATRIX = LIBS.multiply(this.MOVE_MATRIX, this.POSITION_MATRIX);
        this.MODEL_MATRIX = LIBS.multiply(this.MODEL_MATRIX, PARENT_MATRIX);

        this.GL.useProgram(this.SHADER_PROGRAM);
        this.GL.uniformMatrix4fv(this._MMatrix, false, this.MODEL_MATRIX);

        this.GL.bindBuffer(this.GL.ARRAY_BUFFER, this.OBJECT_VERTEX);
        this.GL.vertexAttribPointer(this._position, 3, this.GL.FLOAT, false, 24, 0);
        this.GL.vertexAttribPointer(this._color, 3, this.GL.FLOAT, false, 24, 12);

        this.GL.bindBuffer(this.GL.ELEMENT_ARRAY_BUFFER, this.OBJECT_FACES);
        this.GL.drawElements(this.GL.TRIANGLES, this.faces.length, this.GL.UNSIGNED_SHORT, 0);

        this.childs.forEach(child => child.render(this.MODEL_MATRIX));
    }
}