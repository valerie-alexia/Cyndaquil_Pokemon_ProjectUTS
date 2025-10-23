// flame_collar.js

// --- FUNGSI generateCustomTail DIMODIFIKASI UNTUK API ---
// Kita letakkan di sini agar class FlameCollarShape bisa menggunakannya
function generateFlameGeometry(
    length, baseRadius, tipRadius,
    numSegments, numSpikes,
    colorStart, colorEnd
) {
    const vertices = [];
    const faces = [];
    const stack = numSegments * 10;
    const step = 50;

    for (let i = 0; i <= stack; i++) {
        const u = i / stack; // 0 (pangkal) ke 1 (ujung)
        let currentRadius = baseRadius * (1 - u) + tipRadius * u; // Linear taper

        // --- Bentuk Gelombang & Putaran ---
        const waveFrequency = 4;
        const waveMagnitude = 0.2 * baseRadius * (1 + u); // Gelombang membesar ke ujung
        const waveX = waveMagnitude * Math.sin(u * Math.PI * waveFrequency);
        const waveZ = waveMagnitude * 0.5 * Math.sin(u * Math.PI * waveFrequency + Math.PI / 2);
        const rotationAngle = u * Math.PI * 3;

        for (let j = 0; j <= step; j++) {
            const v = (j / step) * 2 * Math.PI;

            let localX = currentRadius * Math.cos(v + rotationAngle);
            let localZ = currentRadius * Math.sin(v + rotationAngle) * 0.7; // Pipih

            let x = localX + waveX;
            let y = length * u; // Tumbuh ke ATAS (+Y)
            let z = localZ + waveZ;

            // --- Spikes (muncul di sekeliling, lebih runcing) ---
            if (numSpikes > 0) {
                const spikeDensity = numSpikes;
                const normalized_v = v / (2 * Math.PI);
                const phase = normalized_v * spikeDensity;
                // Gunakan pangkat lebih tinggi untuk spike lebih tajam
                const spikeVal = Math.pow(Math.max(0, Math.sin(phase * Math.PI * 2)), 4); 

                const spikeFactor = 0.4 * currentRadius * spikeVal * (1 + u * 0.5); // Spike membesar ke ujung

                const spikeDirX = Math.cos(v + rotationAngle);
                const spikeDirZ = Math.sin(v + rotationAngle);
                x += spikeFactor * spikeDirX;
                z += spikeFactor * spikeDirZ;
                y += spikeFactor * 0.3; // Dorong Y juga
            }

            // --- Warna Gradasi ---
            let r_final = colorStart.r * (1 - u) + colorEnd.r * u;
            let g_final = colorStart.g * (1 - u) + colorEnd.g * u;
            let b_final = colorStart.b * (1 - u) + colorEnd.b * u;

            vertices.push(x, y, z, r_final, g_final, b_final);
        }
    }

    // --- Faces (Urutan sudah benar - CCW dari luar) ---
    for (let i = 0; i < stack; i++) {
        for (let j = 0; j < step; j++) {
            const first = i * (step + 1) + j;
            const second = first + 1;
            const third = first + (step + 1);
            const fourth = third + 1;
            faces.push(first, fourth, second);
            faces.push(first, third, fourth);
        }
    }
    return { vertices, faces };
}


export class FlameCollar {
    GL = null;
    SHADER_PROGRAM = null;

    _position = null;
    _color = null;
    _MMatrix = null;

    OBJECT_VERTEX = null;
    OBJECT_FACES = null;

    vertices = [];
    faces = [];

    POSITION_MATRIX = LIBS.get_I4(); // Posisi relatif terhadap parent (Body)
    MOVE_MATRIX = LIBS.get_I4();    // Untuk animasi (jika ada)

    childs = []; // Biasanya tidak punya child

    constructor(GL, SHADER_PROGRAM, _position, _color, _Mmatrix) {
        this.GL = GL;
        this.SHADER_PROGRAM = SHADER_PROGRAM;
        this._position = _position;
        this._color = _color;
        this._MMatrix = _Mmatrix;

        // --- Parameter Api Leher ---
        const flameColorBase = { r: 0.8, g: 0.1, b: 0.4 }; // Merah-magenta di pangkal
        const flameColorTip  = { r: 0.95, g: 0.4, b: 0.7 };// Pink terang di ujung
        const flameLength = 1.6;
        const flameNeckRadius = 0.4;
        const flameNeckTipRadius = 0.03;
        const flameSegments = 8;
        const flameNumSpikes = 100;

        // --- Buat Geometri Api ---
        const flameGeo = generateFlameGeometry(
            flameLength,
            flameNeckRadius,
            flameNeckTipRadius,
            flameSegments,
            flameNumSpikes,
            flameColorBase,
            flameColorTip
        );
        this.vertices = flameGeo.vertices;
        this.faces = flameGeo.faces;

        // LIBS.translateY(this.POSITION_MATRIX, 4); // Sesuaikan Y leher
        LIBS.translateZ(this.POSITION_MATRIX, -1); // Sedikit ke belakang
        LIBS.scaleX(this.POSITION_MATRIX, 0.8);
        // Putar agar mengarah ke atas dan belakang
        LIBS.rotateX(this.POSITION_MATRIX, Math.PI * -0.3);
    }

    setup() {
        this.OBJECT_VERTEX = this.GL.createBuffer();
        this.GL.bindBuffer(this.GL.ARRAY_BUFFER, this.OBJECT_VERTEX);
        this.GL.bufferData(this.GL.ARRAY_BUFFER, new Float32Array(this.vertices), this.GL.STATIC_DRAW);

        this.OBJECT_FACES = this.GL.createBuffer();
        this.GL.bindBuffer(this.GL.ELEMENT_ARRAY_BUFFER, this.OBJECT_FACES);
        this.GL.bufferData(this.GL.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.faces), this.GL.STATIC_DRAW);

        // Tidak perlu setup childs
    }

    render(PARENT_MATRIX) {
        // Gabungkan matriks parent (body) dengan matriks posisi & gerak api leher
        var LOCAL_MODEL_MATRIX = LIBS.multiply(this.MOVE_MATRIX, this.POSITION_MATRIX);
        var FINAL_MODEL_MATRIX = LIBS.multiply( LOCAL_MODEL_MATRIX, PARENT_MATRIX); // Urutan penting!

        this.GL.useProgram(this.SHADER_PROGRAM);
        this.GL.uniformMatrix4fv(this._MMatrix, false, FINAL_MODEL_MATRIX);

        this.GL.bindBuffer(this.GL.ARRAY_BUFFER, this.OBJECT_VERTEX);
        this.GL.vertexAttribPointer(this._position, 3, this.GL.FLOAT, false, 24, 0); // Stride 24 (XYZRGB)
        this.GL.vertexAttribPointer(this._color, 3, this.GL.FLOAT, false, 24, 12); // Offset 12

        this.GL.bindBuffer(this.GL.ELEMENT_ARRAY_BUFFER, this.OBJECT_FACES);
        this.GL.drawElements(this.GL.TRIANGLES, this.faces.length, this.GL.UNSIGNED_SHORT, 0);

        // Tidak perlu render childs
    }
}