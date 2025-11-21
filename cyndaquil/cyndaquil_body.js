// cyndaquil_body.js
// Asumsi LIBS diimpor melalui Shape.js (LIBS_CYNDAQUIL)

export class BodyShape {
    /**
     * Konstruktor untuk BodyShape.
     * @param {WebGLRenderingContext} GL - Konteks WebGL.
     * @param {WebGLProgram} SHADER_PROGRAM - Program shader yang digunakan.
     * @param {number} _position - Lokasi atribut posisi.
     * @param {number} _color - Lokasi atribut warna.
     * @param {WebGLUniformLocation} _Mmatrix - Lokasi uniform matriks model.
     */
    constructor(GL, SHADER_PROGRAM, _position, _color, _Mmatrix) {
        this.GL = GL;
        this.SHADER_PROGRAM = SHADER_PROGRAM;
        this._position = _position;
        this._color = _color;
        this._Mmatrix = _Mmatrix;

        this.childs = [];
        // Asumsi this.identityMatrix() adalah fungsi yang tersedia
        this.POSITION_MATRIX = this.identityMatrix();

        this.vertices = [];
        this.colors = [];
        this.normals = [];
        this.indices = [];

        // 1. Membangun geometri badan Cyndaquil (seperti kapsul/silinder meruncing)
        this.buildCapsuleBody();
        // 2. Menginisialisasi buffer WebGL
        this.initBuffers();

        // 3. Transformasi Awal (Posisi dan Orientasi Default Badan)
        // MEMPERTAHANKAN Y_OFFSET = 4.0 (Offset Statis Internal)
        // Koordinat (0.3, 4.0, -3.0) dan rotasi Z -25 derajat
        const translateDown = this.translateMatrix(0.3, 4.0, -3.0);
        const rotateZ = this.rotateZMatrix(-25 * Math.PI / 180);
        this.POSITION_MATRIX = this.multiplyMatrix(translateDown, rotateZ);
    }

    animate(time) {
        // Metode ini dipanggil oleh mainenv.js.
        // Logika animasi y (bobbing/jump) diterapkan di MOVE_MATRIX dari mainenv.js.
    }

    /**
     * Membangun geometri (vertices, normals, colors, indices) untuk badan berbentuk kapsul.
     */
    buildCapsuleBody() {
        const segmentsAround = 40; // Jumlah segmen horizontal
        const segmentsY = 24; // Jumlah segmen vertikal
        const radius = 2.5;
        const height = 5.5;
        const centerY = 0.0;

        // Definisi Warna
        const colorTop = [0.0, 0.32, 0.35]; // Warna punggung/api (Hijau kebiruan gelap)
        const BASE_CREAM_COLOR = [0.98, 0.92, 0.75]; // Warna Krem/kuning pucat
        const DARKENING_FACTOR = 0.85;

        // Warna dasar bagian bawah yang sedikit lebih gelap
        const colorBottomBase = [
            BASE_CREAM_COLOR[0] * DARKENING_FACTOR,
            BASE_CREAM_COLOR[1] * DARKENING_FACTOR,
            BASE_CREAM_COLOR[2] * DARKENING_FACTOR
        ];

        // --- Perulangan untuk Jaring Utama Silinder/Kapsul ---
        for (let iy = 0; iy <= segmentsY; iy++) {
            const v = iy / segmentsY; // Nilai vertikal (0.0 di bawah, 1.0 di atas)
            const y = centerY + (v - 0.5) * height;

            // Logika Tapering (meruncing/membulat) di tengah, menjadi silinder/kapsul.
            // Membentuk bentuk tubuh yang sedikit cembung.
            const taper = 1.0 - 0.3 * Math.pow(v - 0.5, 2) * 4;
            const r = radius * taper;

            for (let ix = 0; ix <= segmentsAround; ix++) {
                const u = ix / segmentsAround; // Nilai horizontal (0.0 hingga 1.0)
                let theta = u * Math.PI * 2; // Sudut horizontal (0 hingga 2*PI)

                // Jika melebihi 2*PI (untuk segmen terakhir), sesuaikan (redundant jika ix <= segmentsAround)
                if (theta > Math.PI * 2) theta -= Math.PI * 2;

                const x = Math.cos(theta) * r;
                const z = Math.sin(theta) * r;

                this.vertices.push(x, y, z);

                // Normal (Untuk pencahayaan, arahnya keluar dari permukaan silinder)
                const nx = Math.cos(theta);
                const nz = Math.sin(theta);
                this.normals.push(nx, 0.0, nz);

                // --- Logika Penentuan Warna (Campuran Warna Belakang/Api dan Warna Dasar) ---
                let angleDeg = theta * 180 / Math.PI;

                // Batasan Sudut untuk Warna Punggung/Api (90 hingga 270 derajat)
                const BACK_LIMIT_START = 90;
                const BACK_LIMIT_END = 270;

                let mixFactor = 0.0;

                // 1. Tentukan apakah berada di area punggung/api
                if (angleDeg > BACK_LIMIT_START && angleDeg < BACK_LIMIT_END) {
                    mixFactor = 1.0;
                }

                // 2. Pengecualian dan Peredupan di bagian bawah (kaki/dasar)
                if (v < 0.2) { // Bagian sangat bawah (0% hingga 20% ketinggian)
                    mixFactor = 0.0;
                } else if (v < 0.4 && mixFactor > 0.5) { // Transisi di bagian bawah (20% hingga 40% ketinggian)
                    const t = (v - 0.2) / 0.2; // Faktor transisi linier dari 0.0 ke 1.0
                    mixFactor *= t;
                }

                // Hitung warna akhir dengan interpolasi (lerp)
                const c = [
                    colorTop[0] * mixFactor + colorBottomBase[0] * (1 - mixFactor),
                    colorTop[1] * mixFactor + colorBottomBase[1] * (1 - mixFactor),
                    colorTop[2] * mixFactor + colorBottomBase[2] * (1 - mixFactor)
                ];
                this.colors.push(...c);
            }
        }

        // --- Pembentukan Indices untuk Jaring Utama (Quads menjadi Triangles) ---
        for (let iy = 0; iy < segmentsY; iy++) {
            for (let ix = 0; ix < segmentsAround; ix++) {
                const a = iy * (segmentsAround + 1) + ix;
                const b = a + segmentsAround + 1;
                const c = b + 1;
                const d = a + 1;
                // Dua segitiga membentuk satu quad (permukaan jaring)
                this.indices.push(a, b, d); // Segitiga 1
                this.indices.push(b, c, d); // Segitiga 2
            }
        }

        // --- Penutupan Basis Bawah (Base Cap) ---
        const startIndexBottom = 0; // Mulai dari iy=0
        const yBottomCenter = this.vertices[1]; // Ambil koordinat Y dari titik pertama

        let centerIndex = this.vertices.length / 3; // Indeks titik tengah baru

        // Tambahkan titik tengah bawah
        this.vertices.push(0.0, yBottomCenter, 0.0);
        this.colors.push(...colorBottomBase);
        this.normals.push(0.0, -1.0, 0.0); // Normal menunjuk ke bawah

        for (let i = 0; i < segmentsAround; i++) {
            const p1 = startIndexBottom + i;
            const p2 = startIndexBottom + i + 1;
            const p3 = centerIndex;
            // Tutup dengan segitiga yang berpusat di centerIndex
            this.indices.push(p1, p2, p3);
        }

        // --- Penutupan Basis Atas (Top Cap) ---
        const startIndexTop = segmentsY * (segmentsAround + 1); // Mulai dari iy=segmentsY

        const yTopCenter = this.vertices[startIndexTop * 3 + 1];

        centerIndex = this.vertices.length / 3; // Indeks titik tengah baru

        // Tambahkan titik tengah atas
        this.vertices.push(0.0, yTopCenter, 0.0);
        this.colors.push(...colorTop); // Menggunakan warna atas/api
        this.normals.push(0.0, 1.0, 0.0); // Normal menunjuk ke atas

        for (let i = 0; i < segmentsAround; i++) {
            const p1 = startIndexTop + i;
            const p2 = startIndexTop + i + 1;
            const p3 = centerIndex;
            // Tutup dengan segitiga yang berpusat di centerIndex (urutan p2, p1 untuk orientasi normal)
            this.indices.push(p2, p1, p3);
        }
    }

    /**
     * Membuat dan mengisi WebGL buffer dengan data vertices, normals, colors, dan indices.
     */
    initBuffers() {
        const GL = this.GL;
        const interleaved = [];
        const numVertices = this.vertices.length / 3;

        // Menggabungkan data (Posisi, Normal, Warna)
        for (let i = 0; i < numVertices; i++) {
            // Posisi (3 floats)
            interleaved.push(this.vertices[i * 3 + 0], this.vertices[i * 3 + 1], this.vertices[i * 3 + 2]);
            // Normal (3 floats)
            interleaved.push(this.normals[i * 3 + 0], this.normals[i * 3 + 1], this.normals[i * 3 + 2]);
            // Warna (3 floats)
            interleaved.push(this.colors[i * 3 + 0], this.colors[i * 3 + 1], this.colors[i * 3 + 2]);
        }
        // Stride (total ukuran data per vertex: 3 Pos + 3 Normal + 3 Color = 9 floats * 4 bytes/float = 36 bytes)
        const STRIDE = 36;

        // Vertex Buffer (Interleaved Data)
        this.vertexBuffer = GL.createBuffer();
        GL.bindBuffer(GL.ARRAY_BUFFER, this.vertexBuffer);
        GL.bufferData(GL.ARRAY_BUFFER, new Float32Array(interleaved), GL.STATIC_DRAW);

        // Index Buffer
        this.indexBuffer = GL.createBuffer();
        GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        GL.bufferData(GL.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.indices), GL.STATIC_DRAW);

        this.nPoints = this.indices.length;
    }

    // --- FUNGSI MATRIKS BANTUAN (Asumsi berasal dari library atau kelas dasar) ---

    /**
     * Mengembalikan Matriks Identitas 4x4.
     */
    identityMatrix() {
        return new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
    }

    /**
     * Mengalikan dua matriks 4x4 (a * b).
     */
    multiplyMatrix(a, b) {
        const r = new Float32Array(16);
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                r[i * 4 + j] =
                    a[i * 4 + 0] * b[0 * 4 + j] + a[i * 4 + 1] * b[1 * 4 + j] +
                    a[i * 4 + 2] * b[2 * 4 + j] + a[i * 4 + 3] * b[3 * 4 + j];
            }
        }
        return r;
    }

    /**
     * Membuat Matriks Translasi.
     */
    translateMatrix(x, y, z) {
        return new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, x, y, z, 1]);
    }

    /**
     * Membuat Matriks Rotasi di sekitar sumbu Z.
     * @param {number} angle - Sudut dalam radian.
     */
    rotateZMatrix(angle) {
        const c = Math.cos(angle);
        const s = Math.sin(angle);
        return new Float32Array([c, s, 0, 0, -s, c, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
    }

    // --- METODE RENDER ---

    setup() {
        for (let child of this.childs) {
            child.setup?.();
        }
    }

    /**
     * Merender bentuk dan anak-anaknya.
     * @param {Float32Array} parentMatrix - Matriks Model dari objek induk.
     */
    render(parentMatrix) {
        const GL = this.GL;

        // Hitung Matriks Model lokal: M_global = M_parent * M_local
        const localMatrix = this.multiplyMatrix(parentMatrix, this.POSITION_MATRIX);
        GL.uniformMatrix4fv(this._Mmatrix, false, localMatrix); // Kirim ke shader

        const STRIDE = 36; // Stride 36 bytes

        // Bind Buffer dan Tentukan Pointer Atribut
        GL.bindBuffer(GL.ARRAY_BUFFER, this.vertexBuffer);
        // Posisi: Offset 0
        GL.vertexAttribPointer(this._position, 3, GL.FLOAT, false, STRIDE, 0);
        // Warna: Offset 24 (3 Pos + 3 Normal = 6 floats * 4 bytes/float = 24 bytes)
        GL.vertexAttribPointer(this._color, 3, GL.FLOAT, false, STRIDE, 24);
        // Normal (Asumsi ada, jika tidak, perlu diatur: Offset 12)

        GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        GL.drawElements(GL.TRIANGLES, this.nPoints, GL.UNSIGNED_SHORT, 0);

        // Render anak-anak
        for (let child of this.childs) {
            child.render(localMatrix);
        }
    }
}