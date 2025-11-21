// environment/terrain.js
import { LIBS } from "./libs.js";

export class Terrain {
    GL = null; SHADER_PROGRAM = null; _position = null; _color = null; _MMatrix = null;
    OBJECTS = []; 
    groundLevel = 0;

    constructor(GL, SHADER_PROGRAM, _position, _color, _MMatrix, radius) {
        this.GL = GL;
        this.SHADER_PROGRAM = SHADER_PROGRAM;
        this._position = _position;
        this._color = _color;
        this._MMatrix = _MMatrix;
        this.groundLevel = 0; 
        
        const grassColor = [0.2, 0.6, 0.2]; // Hijau dasar
        const rockColor = [0.5, 0.5, 0.55]; // Abu batu

        // 1. Green Base Ground (Alas Hijau)
        const groundRadius = radius * 0.95; 
        const groundGeo = this.generateCircle(groundRadius, 64, grassColor);
        const groundMatrix = LIBS.get_I4();
        LIBS.translateY(groundMatrix, this.groundLevel);
        LIBS.rotateX(groundMatrix, -Math.PI / 2); 
        
        this.addObject(groundGeo.vertices, groundGeo.indices, groundMatrix, false);

        // --- POSISI HARDCODED (Agar tersebar rapi) ---
        
        // Posisi Batu (X, Z, Scale, Rotation)
        const rockPositions = [
            { x: -9, z: -6, s: 3.0, r: 0.5 },  // Kiri Belakang (Besar)
            { x: 10, z: -5, s: 2.5, r: 1.2 },  // Kanan Belakang
            { x: -11, z: 4, s: 1.1, r: 2.5 },  // Kiri Samping
            { x: 8, z: 7, s: 1.8, r: 0.2 },    // Kanan Depan
            { x: 0, z: -11, s: 3.5, r: 0.8 },  // Belakang Tengah (Jauh)
            { x: -6, z: 8, s: 2, r: 3.0 },   // Kiri Depan
            { x: 12, z: 2, s: 2.2, r: 1.5 }    // Kanan Samping
        ];

        // Posisi Rumput (X, Z) - Disebar di sela-sela batu
        const grassPositions = [
            // Sekitar Batu Kiri Belakang
            { x: -7, z: -5 }, { x: -10, z: -4 }, { x: -8, z: -7 },
            // Sekitar Batu Kanan
            { x: 8, z: -4 }, { x: 11, z: -6 }, { x: 9, z: -3 },
            // Area Depan
            { x: -4, z: 7 }, { x: 4, z: 6 }, { x: 0, z: 8 }, { x: -2, z: 9 }, { x: 2, z: 9 },
            // Samping Luar
            { x: -12, z: 0 }, { x: -13, z: 2 }, 
            { x: 13, z: 0 }, { x: 11, z: 4 },
            // Belakang Jauh
            { x: -3, z: -10 }, { x: 3, z: -10 }, { x: 0, z: -9 }
        ];

        // 2. Generate Rocks
        rockPositions.forEach(p => {
            const rockGeo = this.generateRock(p.s, rockColor);
            const rockMatrix = LIBS.get_I4();
            
            // FIX: Gunakan Translate Terpisah agar posisi benar
            LIBS.translateX(rockMatrix, p.x);
            LIBS.translateY(rockMatrix, 1); // Tanam sedikit ke tanah
            LIBS.translateZ(rockMatrix, p.z);
            
            LIBS.rotateY(rockMatrix, p.r);
            
            this.addObject(rockGeo.vertices, rockGeo.indices, rockMatrix, false);
        });

        // 3. Generate Grass
        grassPositions.forEach(p => {
            // Variasi warna rumput (Biar tidak monoton)
            const variantColor = [
                grassColor[0] + (Math.random()-0.5)*0.15,
                grassColor[1] + (Math.random()-0.5)*0.15,
                grassColor[2] + (Math.random()-0.5)*0.15
            ];

            // Variasi ukuran (Tinggi/Lebar)
            const w = 1.0 + Math.random() * 0.8;
            const h = 2.0 + Math.random() * 2.0;

            const grassGeo = this.generateGrassTuft(w, h, variantColor);
            const grassMatrix = LIBS.get_I4();
            
            // FIX: Gunakan Translate Terpisah
            LIBS.translateX(grassMatrix, p.x);
            LIBS.translateY(grassMatrix, 0); // Pas di permukaan
            LIBS.translateZ(grassMatrix, p.z);

            LIBS.rotateY(grassMatrix, Math.random() * Math.PI * 2);

            this.addObject(grassGeo.vertices, grassGeo.indices, grassMatrix, true);
        });
    }

    addObject(vertices, indices, localMatrix, isAnimated = false) {
        this.OBJECTS.push({ 
            vertices, indices, localMatrix, 
            baseMatrix: isAnimated ? LIBS.clone(localMatrix) : null,
            isAnimated: isAnimated,
            animationOffset: Math.random() * 10,
            vertexBuffer: null, indexBuffer: null 
        });
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

    animate(time) {
        this.OBJECTS.forEach(obj => {
            if (obj.isAnimated) {
                const M = LIBS.clone(obj.baseMatrix);
                const swayZ = Math.sin(time * 2.0 + obj.animationOffset) * 0.15;
                const swayX = Math.cos(time * 1.5 + obj.animationOffset) * 0.05;
                LIBS.rotateZ(M, swayZ);
                LIBS.rotateX(M, swayX);
                obj.localMatrix = M;
            }
        });
    }

    render(PARENT_MATRIX) {
        this.OBJECTS.forEach(obj => {
            const M = LIBS.multiply(PARENT_MATRIX, obj.localMatrix);
            this.GL.uniformMatrix4fv(this._MMatrix, false, M);
            this.GL.bindBuffer(this.GL.ARRAY_BUFFER, obj.vertexBuffer);
            this.GL.vertexAttribPointer(this._position, 3, this.GL.FLOAT, false, 24, 0);
            this.GL.vertexAttribPointer(this._color, 3, this.GL.FLOAT, false, 24, 12);
            this.GL.bindBuffer(this.GL.ELEMENT_ARRAY_BUFFER, obj.indexBuffer);
            this.GL.drawElements(this.GL.TRIANGLES, obj.indices.length, this.GL.UNSIGNED_SHORT, 0);
        });
    }

    // --- GEOMETRY GENERATORS ---

    generateCircle(radius, segments, color) {
        const vertices = []; const indices = [];
        vertices.push(0, 0, 0, ...color); 
        for (let i = 0; i <= segments; i++) {
            const angle = (i / segments) * Math.PI * 2;
            vertices.push(radius * Math.cos(angle), radius * Math.sin(angle), 0, ...color);
        }
        for (let i = 1; i <= segments; i++) indices.push(0, i, i + 1);
        return { vertices, indices };
    }

    // BATU YANG LEBIH REALISTIS (Lebih acak bentuknya)
    generateRock(radius, color) {
        const vertices = []; const indices = [];
        const stacks = 5; const slices = 7; // Low poly style
        
        // Variasi warna batu sedikit
        const rockTone = [
            color[0] + (Math.random()-0.5)*0.1,
            color[1] + (Math.random()-0.5)*0.1,
            color[2] + (Math.random()-0.5)*0.1,
        ];

        for (let i = 0; i <= stacks; i++) {
            const lat = (i / stacks) * (Math.PI / 2); 
            const y = (radius * 0.6) * Math.sin(lat); // Agak gepeng
            const rBase = radius * Math.cos(lat);
            
            for (let j = 0; j <= slices; j++) {
                const lon = (j / slices) * Math.PI * 2;
                
                // Noise yang lebih kasar biar bentuknya "batu banget"
                const noise = 0.7 + Math.random() * 0.4; 
                
                const x = rBase * Math.cos(lon) * noise;
                const z = rBase * Math.sin(lon) * noise;
                
                vertices.push(x, y, z, ...rockTone);
            }
        }
        for (let i = 0; i < stacks; i++) {
            for (let j = 0; j < slices; j++) {
                const first = i * (slices + 1) + j;
                const second = first + slices + 1;
                indices.push(first, second, first + 1);
                indices.push(second, second + 1, first + 1);
            }
        }
        return { vertices, indices };
    }

    // RUMPUT YANG LEBIH BAGUS (Gradasi Warna & Lebih Rimbun)
    generateGrassTuft(avgWidth, avgHeight, color) {
        const vertices = [];
        const indices = [];
        let vIndex = 0;

        // Warna dasar (lebih gelap & sedikit coklat tanah)
        const darkColor = [color[0] * 0.3, color[1] * 0.35, color[2] * 0.25];
        // Warna ujung (lebih terang & kekuningan kena matahari)
        const lightColor = [color[0] * 1.2, color[1] * 1.3, color[2] * 1.1];

        const numBlades = 5 + Math.floor(Math.random() * 3); // 5 sampai 7 helai per rumpun

        for (let b = 0; b < numBlades; b++) {
            // 1. Randomisasi properti per helai
            const currentHeight = avgHeight * (0.7 + Math.random() * 0.6); // Variasi tinggi
            const currentBaseWidth = avgWidth * (0.8 + Math.random() * 0.4); // Variasi lebar dasar
            
            // Posisi awal acak sedikit di sekitar pusat rumpun
            const startX = (Math.random() - 0.5) * avgWidth * 0.5;
            const startZ = (Math.random() - 0.5) * avgWidth * 0.5;

            // Arah lengkungan acak
            const leanAngle = Math.random() * Math.PI * 2; 
            // Seberapa jauh melengkung
            const leanAmount = currentHeight * (0.2 + Math.random() * 0.3); 

            // 2. Membuat helai dari segmen-segmen (agar bisa melengkung)
            const segments = 4; 
            for (let i = 0; i <= segments; i++) {
                // t berjalan dari 0.0 (bawah) ke 1.0 (atas)
                const t = i / segments; 
                
                // Lebar mengecil ke atas (tapering)
                const width = currentBaseWidth * (1.0 - t); 
                
                // Posisi Y naik sesuai t
                let y = t * currentHeight;

                // Kalkulasi lengkungan (Curve) menggunakan fungsi kuadratik sederhana
                // Semakin ke atas (t membesar), semakin jauh offsetnya
                const curveOffset = leanAmount * (t * t);
                let xOffset = Math.cos(leanAngle) * curveOffset;
                let zOffset = Math.sin(leanAngle) * curveOffset;

                // Gradasi warna berdasarkan ketinggian (t)
                const r = darkColor[0] * (1 - t) + lightColor[0] * t;
                const g = darkColor[1] * (1 - t) + lightColor[1] * t;
                const b_col = darkColor[2] * (1 - t) + lightColor[2] * t;
                const segmentColor = [r, g, b_col];

                // Vertex Kiri (relatif terhadap garis tengah helai)
                // Kita perlu sedikit rotasi agar bilah menghadap arah yang bervariasi
                const bladeFaceAngle = leanAngle + Math.PI/2; // Tegak lurus arah lengkung
                const dx = Math.cos(bladeFaceAngle) * width / 2;
                const dz = Math.sin(bladeFaceAngle) * width / 2;

                // Push Vertex Kiri dan Kanan di ketinggian ini
                vertices.push(startX + xOffset - dx, y, startZ + zOffset - dz, ...segmentColor);
                vertices.push(startX + xOffset + dx, y, startZ + zOffset + dz, ...segmentColor);
            }

            // 3. Membuat Index untuk menghubungkan segmen menjadi jaring (Triangle Strip like)
            for (let i = 0; i < segments; i++) {
                const base = vIndex + i * 2;
                // Segitiga 1
                indices.push(base, base + 1, base + 2);
                // Segitiga 2
                indices.push(base + 2, base + 1, base + 3);
                
                // Tambahkan sisi belakang agar terlihat dari dua arah (optional, tapi bagus)
                indices.push(base, base + 2, base + 1);
                indices.push(base + 2, base + 3, base + 1);
            }
            // Update index global untuk helai berikutnya
            vIndex += (segments + 1) * 2;
        }

        return { vertices, indices };
    }
}