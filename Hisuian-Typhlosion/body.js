
function generateCustomTail(length, baseRadius, tipRadius, numSegments, numSpikes, topColor) { 
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

    // Generate faces (faces)
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
// Ganti fungsi generateHyper1d yang lama dengan yang ini

function generateHyper1d(a, b, c, stack, step, uBottomTrimRatio = 0) {
    var vertices = [];
    var faces = [];

    var margin = 0.4;
    var uMax = (Math.PI / 2) - margin;
    var uMin = -uMax + (2 * uMax) * Math.max(0, Math.min(0.49, uBottomTrimRatio));
    // Perkirakan rentang Z maksimum dan minimum (penting untuk normalisasi)
    // Nilai Z maksimum kira-kira c / cos(uMax)
    const maxPossibleZ = c / Math.cos(uMax);
    const minPossibleZ = -maxPossibleZ;

    function smoothstep(edge0, edge1, x) {
        var t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
        return t * t * (3 - 2 * t);
    }

    // --- Parameter Kalung ---
    // Posisi Y tengah kalung
    const centerNeckY_front = -1.4; // Tengah kalung di depan (z positif)
    const centerNeckY_back = 0.6;  // Tengah kalung di belakang (z negatif, lebih naik)
    // Lebar vertikal kalung
    const neckHeight_front = 0.6;   // Lebar kalung di depan
    const neckHeight_back = 0.1;    // Lebar kalung di belakang

    // Warna
    const backColorR = 0.25;
    const backColorG = 0.2;
    const backColorB = 0.3;

    for (var i = 0; i <= stack / 2; i++) {
        var u = uMin + (uMax - uMin) * (i / stack);
        for (var j = 0; j <= step; j++) {
            var v = j / step * 2 * Math.PI - Math.PI;

            var x = a * Math.cos(v) * 1 / Math.cos(u);
            var y = b * Math.tan(u);
            var z = c * Math.sin(v) * 1 / Math.cos(u);

            var vertical01 = i / (stack / 2);
            var neckRegion = smoothstep(0.8, 1.0, vertical01);
            var neckScale = 1.0 - 0.35 * (neckRegion * neckRegion);
            x *= neckScale;
            z *= neckScale;

            let r, g, bcol;

            // --- Logika Pewarnaan Kalung Berdasarkan Z ---
            // Faktor interpolasi 't': 0 di depan (z maks), 1 di belakang (z min)
            // Normalisasi z ke rentang [0, 1]
            let t = (z - maxPossibleZ) / (minPossibleZ - maxPossibleZ);
            t = Math.max(0, Math.min(1, t)); // Pastikan t tetap di [0, 1]

            // Hitung posisi Y tengah dan lebar kalung saat ini
            let currentCenterNeckY = centerNeckY_front + t * (centerNeckY_back - centerNeckY_front);
            let currentNeckHeight = neckHeight_front + t * (neckHeight_back - neckHeight_front);

            // Hitung batas atas dan bawah kalung saat ini
            let currentNeckBandTop = currentCenterNeckY + currentNeckHeight / 2.0;
            let currentNeckBandBottom = currentCenterNeckY - currentNeckHeight / 2.0;

            // Warna depan (di luar kalung)
            const frontColorR = 0.9 + y * 0.005;
            const frontColorG = 0.8 + y * 0.01;
            const frontColorB = 0.6 + y * 0.01;

            // Cek apakah vertex berada di rentang kalung
            if (y < currentNeckBandTop && y > currentNeckBandBottom) {
                // Daerah Kalung
                r = backColorR; g = backColorG; bcol = backColorB;
            } else {
                // Di Luar Kalung
                if (z >= -0.2) { // Depan
                    r = frontColorR; g = frontColorG; bcol = frontColorB;
                } else { // Belakang
                    r = backColorR; g = backColorG; bcol = backColorB;
                }
            }
            // --- Akhir Logika Pewarnaan ---

            vertices.push(x, y, z);
            vertices.push(r, g, bcol);
        }
    }

    // Pembuatan faces (tidak berubah)
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
        const generated = generateHyper1d(1, 4, 1, 300, 300, 0.14);
        this.vertex = generated.vertices;
        this.faces = generated.faces;

        var minY = Infinity;
        for (var vi = 1; vi < this.vertex.length; vi += 6) {
            if (this.vertex[vi] < minY) minY = this.vertex[vi];
        }

        // Bola penutup
        // var sphereL = generateSphere(1, 1, 1.4, 24, 20);
        var sphereR = generateSphere(1.5, 1.5, 1.55, 24, 20);
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
            10,   // Jumlah tonjolan/spikes
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