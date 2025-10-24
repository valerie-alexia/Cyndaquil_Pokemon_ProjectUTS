import { LIBS } from "./libs.js";
function generateFlameGeometry(length, baseRadius, tipRadius, numSegments, numSpikes, colorStart, colorEnd) {
    const vertices = []; const faces = []; const stack = numSegments * 10; const step = 50;
    for (let i = 0; i <= stack; i++) {
        const u = i / stack; let currentRadius = baseRadius * (1 - u) + tipRadius * u;
        const waveFrequency = 4; const waveMagnitude = 0.2 * baseRadius * (1 + u);
        const waveX = waveMagnitude * Math.sin(u * Math.PI * waveFrequency);
        const waveZ = waveMagnitude * 0.5 * Math.sin(u * Math.PI * waveFrequency + Math.PI / 2);
        const rotationAngle = u * Math.PI * 3;
        for (let j = 0; j <= step; j++) {
            const v = (j / step) * 2 * Math.PI;
            let localX = currentRadius * Math.cos(v + rotationAngle);
            let localZ = currentRadius * Math.sin(v + rotationAngle) * 0.7;
            let x = localX + waveX; let y = length * u; let z = localZ + waveZ;
            if (numSpikes > 0) {
                const spikeDensity = numSpikes; const normalized_v = v / (2 * Math.PI);
                const phase = normalized_v * spikeDensity;
                const spikeVal = Math.pow(Math.max(0, Math.sin(phase * Math.PI * 2)), 4);
                const spikeFactor = 0.4 * currentRadius * spikeVal * (1 + u * 0.5);
                const spikeDirX = Math.cos(v + rotationAngle); const spikeDirZ = Math.sin(v + rotationAngle);
                x += spikeFactor * spikeDirX; z += spikeFactor * spikeDirZ; y += spikeFactor * 0.3;
            }
            let r_final = colorStart.r * (1 - u) + colorEnd.r * u;
            let g_final = colorStart.g * (1 - u) + colorEnd.g * u;
            let b_final = colorStart.b * (1 - u) + colorEnd.b * u;
            vertices.push(x, y, z, r_final, g_final, b_final);
        }
    }
    for (let i = 0; i < stack; i++) { // Faces (Urutan Dibalik)
        for (let j = 0; j < step; j++) {
            const first = i * (step + 1) + j; const second = first + 1;
            const third = first + (step + 1); const fourth = third + 1;
            faces.push(first, fourth, second); faces.push(first, third, fourth);
        }
    }
    return { vertices, faces };
}

function generateSphere(a, b, c, stack, step, color) {
    var vertices = [];
    var faces = [];

    for (var i = 0; i <= stack; i++) {
        var u = i / stack * Math.PI - (Math.PI / 2);
        for (var j = 0; j <= step; j++) {
            var v = j / step * 2 * Math.PI - Math.PI;
            var x = a * Math.cos(v) * Math.cos(u);
            var y = b * Math.sin(u);
            var z = c * Math.sin(v) * Math.cos(u);
            // Gunakan warna yang diberikan
            vertices.push(x, y, z, color.r, color.g, color.b); 
        }
    }

    // --- Pastikan Faces Dibalik ---
    for (var i = 0; i < stack; i++) {
        for (var j = 0; j < step; j++) {
            var first = i * (step + 1) + j;
            var second = first + 1;
            var third = first + (step + 1);
            var fourth = third + 1;
            faces.push(first, fourth, second); // Dibalik
            faces.push(first, third, fourth);  // Dibalik
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

    vertices = []; // Akan berisi GABUNGAN vertex dari semua api
    faces = [];    // Akan berisi GABUNGAN face dari semua api

    POSITION_MATRIX = LIBS.get_I4(); // Posisi KESELURUHAN collar relatif thd Body
    MOVE_MATRIX = LIBS.get_I4();    // Untuk animasi (jika ada)

    constructor(GL, SHADER_PROGRAM, _position, _color, _Mmatrix) {
        this.GL = GL;
        this.SHADER_PROGRAM = SHADER_PROGRAM;
        this._position = _position;
        this._color = _color;
        this._MMatrix = _Mmatrix;

        // --- Fungsi Helper untuk Menggabungkan Geometri ---
        const mergeGeometry = (newVertices, newFaces) => {
            const baseIndex = this.vertices.length / 6;
            this.vertices.push(...newVertices);
            for (let i = 0; i < newFaces.length; i++) {
                this.faces.push(newFaces[i] + baseIndex);
            }
        };

        // --- Parameter & Warna ---

        const flameColorBase = { r: 0.95, g: 0.4, b: 0.7 };
        const flameColorTip = { r: 0.5, g: 0.2, b: 0.7 };
        const flameLength = 2; const flameNeckRadius = 0.75; const flameNeckTipRadius = 0.03;
        const flameSegments = 8; const flameNumSpikes = 50;

        // Flame 1
        const flameGeo = generateFlameGeometry(
            flameLength + 0.7, flameNeckRadius, flameNeckTipRadius + 0.1,
            flameSegments, flameNumSpikes,
            flameColorBase, flameColorTip
        );

        const flame1Matrix = LIBS.get_I4();
        LIBS.translateX(flame1Matrix, -0.1);
        LIBS.translateZ(flame1Matrix, -0.6);
        LIBS.scaleX(flame1Matrix, 0.8);
        // Putar agar mengarah ke atas dan belakang
        LIBS.rotateX(flame1Matrix, Math.PI * -0.2);

        // Transformasi vertex API 1
        const transformedFlame1Vertices = [];
        for (let i = 0; i < flameGeo.vertices.length; i += 6) {
            const originalVertex = [flameGeo.vertices[i], flameGeo.vertices[i + 1], flameGeo.vertices[i + 2], 1];
            const transformedPoint = LIBS.multiply_vector(flame1Matrix, originalVertex);
            transformedFlame1Vertices.push(
                transformedPoint[0], transformedPoint[1], transformedPoint[2],
                flameGeo.vertices[i + 3], flameGeo.vertices[i + 4], flameGeo.vertices[i + 5]
            );
        }
        // Gabungkan API 1 ke vertices/faces utama
        mergeGeometry(transformedFlame1Vertices, flameGeo.faces);

        const flame3Matrix = LIBS.get_I4();
        LIBS.translateX(flame3Matrix, 0.55);
        LIBS.translateZ(flame3Matrix, -0.8);
        LIBS.scaleX(flame3Matrix, 0.8);
        // Putar agar mengarah ke atas dan belakang
        LIBS.rotateX(flame3Matrix, Math.PI * -0.2);
        LIBS.rotateY(flame3Matrix, -0.6)

        // Transformasi vertex API 1
        const transformedFlame3Vertices = [];
        for (let i = 0; i < flameGeo.vertices.length; i += 6) {
            const originalVertex = [flameGeo.vertices[i], flameGeo.vertices[i + 1], flameGeo.vertices[i + 2], 1];
            const transformedPoint = LIBS.multiply_vector(flame3Matrix, originalVertex);
            transformedFlame3Vertices.push(
                transformedPoint[0], transformedPoint[1], transformedPoint[2],
                flameGeo.vertices[i + 3], flameGeo.vertices[i + 4], flameGeo.vertices[i + 5]
            );
        }
        // Gabungkan API 1 ke vertices/faces utama
        mergeGeometry(transformedFlame3Vertices, flameGeo.faces);

        // Flame 2
        const flameGeo2 = generateFlameGeometry(
            flameLength, flameNeckRadius - 0.1, flameNeckTipRadius,
            flameSegments + 10, flameNumSpikes,
            flameColorBase, flameColorTip
        );

        // Matriks Flame 2
        const flame2Matrix = LIBS.get_I4();
        // Posisikan API 2 (misalnya sedikit ke kanan belakang)
        LIBS.translateX(flame2Matrix, -0.6);
        LIBS.translateZ(flame2Matrix, -0.6);
        // LIBS.rotateY(flame2Matrix, -Math.PI * 0.25); // Putar berlawanan
        LIBS.rotateX(flame2Matrix, Math.PI * -0.2); // Miringkan sedikit beda
        LIBS.rotateY(flame2Matrix, 0.7); // Miringkan sedikit beda

        // Transformasi vertex API 2
        const transformedFlame2Vertices = [];
        for (let i = 0; i < flameGeo2.vertices.length; i += 6) {
            const originalVertex = [flameGeo2.vertices[i], flameGeo2.vertices[i + 1], flameGeo2.vertices[i + 2], 1];
            const transformedPoint = LIBS.multiply_vector(flame2Matrix, originalVertex);
            transformedFlame2Vertices.push(
                transformedPoint[0], transformedPoint[1], transformedPoint[2],
                flameGeo2.vertices[i + 3], flameGeo2.vertices[i + 4], flameGeo2.vertices[i + 5]
            );
        }
        // Gabungkan API 2 ke vertices/faces utama
        mergeGeometry(transformedFlame2Vertices, flameGeo2.faces);

        // API 4
        const flame4Matrix = LIBS.get_I4();
        // Posisikan API 2 
        LIBS.translateX(flame4Matrix, 0.7);
        LIBS.translateZ(flame4Matrix, -0.6);
        // LIBS.rotateY(flame2Matrix, -Math.PI * 0.25); // Putar berlawanan
        LIBS.rotateX(flame4Matrix, Math.PI * -0.3);
        LIBS.rotateY(flame4Matrix, -0.8); 

        // Transformasi vertex API 2
        const transformedFlame4Vertices = [];
        for (let i = 0; i < flameGeo2.vertices.length; i += 6) {
            const originalVertex = [flameGeo2.vertices[i], flameGeo2.vertices[i + 1], flameGeo2.vertices[i + 2], 1];
            const transformedPoint = LIBS.multiply_vector(flame4Matrix, originalVertex);
            transformedFlame4Vertices.push(
                transformedPoint[0], transformedPoint[1], transformedPoint[2],
                flameGeo2.vertices[i + 3], flameGeo2.vertices[i + 4], flameGeo2.vertices[i + 5]
            );
        }
        // Gabungkan API 2 ke vertices/faces utama
        mergeGeometry(transformedFlame4Vertices, flameGeo2.faces);

        // Penutup api buat nempel
        const coverSphereRadiusX = 0.6;
        const coverSphereRadiusY = 0.3;
        const coverSphereRadiusZ = 0.5;
        const coverSphereColor = { r: 0.95, g: 0.4, b: 0.7 };

        const coverSphereGeo = generateSphere(
            coverSphereRadiusX,
            coverSphereRadiusY,
            coverSphereRadiusZ,
            20, // Detail sphere (stack)
            20, // Detail sphere (step)
            coverSphereColor
        );

        // Matriks untuk memposisikan sphere di pangkal api
        const coverSphereMatrix = LIBS.get_I4();
        // Posisikan di Y=0 (relatif thd collar) dan sedikit ke belakang
        // LIBS.translateY(coverSphereMatrix, 0.0); // Y=0 adalah pangkal api
        LIBS.translateX(coverSphereMatrix, -0.5);
        LIBS.translateZ(coverSphereMatrix, -0.2);
        // Miring sedikit agar pas
        LIBS.rotateX(coverSphereMatrix, Math.PI * 0.1);

        // Transformasi vertex sphere
        const transformedCoverSphereVertices = [];
        for (let i = 0; i < coverSphereGeo.vertices.length; i += 6) { // Stride 6
            const originalVertex = [coverSphereGeo.vertices[i], coverSphereGeo.vertices[i + 1], coverSphereGeo.vertices[i + 2], 1];
            const transformedPoint = LIBS.multiply_vector(coverSphereMatrix, originalVertex);
            transformedCoverSphereVertices.push(
                transformedPoint[0], transformedPoint[1], transformedPoint[2],
                coverSphereGeo.vertices[i + 3], coverSphereGeo.vertices[i + 4], coverSphereGeo.vertices[i + 5]
            );
        }
        // Gabungkan sphere ke vertices/faces utama
        mergeGeometry(transformedCoverSphereVertices, coverSphereGeo.faces);

        LIBS.translateX(coverSphereMatrix, -0.15);
        LIBS.translateZ(coverSphereMatrix, -0.2);

        const transformedCoverSphereVertices2 = [];
        for (let i = 0; i < coverSphereGeo.vertices.length; i += 6) { // Stride 6
            const originalVertex = [coverSphereGeo.vertices[i], coverSphereGeo.vertices[i + 1], coverSphereGeo.vertices[i + 2], 1];
            const transformedPoint = LIBS.multiply_vector(coverSphereMatrix, originalVertex);
            transformedCoverSphereVertices2.push(
                transformedPoint[0], transformedPoint[1], transformedPoint[2],
                coverSphereGeo.vertices[i + 3], coverSphereGeo.vertices[i + 4], coverSphereGeo.vertices[i + 5]
            );
        }
        // Gabungkan sphere ke vertices/faces utama
        mergeGeometry(transformedCoverSphereVertices2, coverSphereGeo.faces);

        LIBS.translateX(coverSphereMatrix, 1.2);
        LIBS.translateZ(coverSphereMatrix, -0);

        const transformedCoverSphereVertices3 = [];
        for (let i = 0; i < coverSphereGeo.vertices.length; i += 6) { // Stride 6
            const originalVertex = [coverSphereGeo.vertices[i], coverSphereGeo.vertices[i + 1], coverSphereGeo.vertices[i + 2], 1];
            const transformedPoint = LIBS.multiply_vector(coverSphereMatrix, originalVertex);
            transformedCoverSphereVertices3.push(
                transformedPoint[0], transformedPoint[1], transformedPoint[2],
                coverSphereGeo.vertices[i + 3], coverSphereGeo.vertices[i + 4], coverSphereGeo.vertices[i + 5]
            );
        }
        // Gabungkan sphere ke vertices/faces utama
        mergeGeometry(transformedCoverSphereVertices3, coverSphereGeo.faces);

        LIBS.translateX(coverSphereMatrix, -0.65);
        const transformedCoverSphereVertices4 = [];
        for (let i = 0; i < coverSphereGeo.vertices.length; i += 6) { // Stride 6
            const originalVertex = [coverSphereGeo.vertices[i], coverSphereGeo.vertices[i + 1], coverSphereGeo.vertices[i + 2], 1];
            const transformedPoint = LIBS.multiply_vector(coverSphereMatrix, originalVertex);
            transformedCoverSphereVertices4.push(
                transformedPoint[0], transformedPoint[1], transformedPoint[2],
                coverSphereGeo.vertices[i + 3], coverSphereGeo.vertices[i + 4], coverSphereGeo.vertices[i + 5]
            );
        }
        // Gabungkan sphere ke vertices/faces utama
        mergeGeometry(transformedCoverSphereVertices4, coverSphereGeo.faces);


        const sphere1 = generateSphere(
            0.15,
            0.15,
            0.15,
            20, // Detail sphere (stack)
            20, // Detail sphere (step)
            coverSphereColor
        );

        const sphereMatrix = LIBS.get_I4();
        LIBS.translateY(sphereMatrix, -0.4);
        LIBS.translateZ(sphereMatrix, 1);
        const transformedSphere1 = [];
        for (let i = 0; i < sphere1.vertices.length; i += 6) { // Stride 6
            const originalVertex = [sphere1.vertices[i], sphere1.vertices[i + 1], sphere1.vertices[i + 2], 1];
            const transformedPoint = LIBS.multiply_vector(sphereMatrix, originalVertex);
            transformedSphere1.push(
                transformedPoint[0], transformedPoint[1], transformedPoint[2],
                sphere1.vertices[i + 3], sphere1.vertices[i + 4], sphere1.vertices[i + 5]
            );
        }
        // Gabungkan sphere ke vertices/faces utama
        mergeGeometry(transformedSphere1, sphere1.faces);

        LIBS.translateX(sphereMatrix, -0.9);
        LIBS.translateY(sphereMatrix, 0.2);
        LIBS.translateZ(sphereMatrix, -0.6);
        const transformedSphere2 = [];
        for (let i = 0; i < sphere1.vertices.length; i += 6) { // Stride 6
            const originalVertex = [sphere1.vertices[i], sphere1.vertices[i + 1], sphere1.vertices[i + 2], 1];
            const transformedPoint = LIBS.multiply_vector(sphereMatrix, originalVertex);
            transformedSphere2.push(
                transformedPoint[0], transformedPoint[1], transformedPoint[2],
                sphere1.vertices[i + 3], sphere1.vertices[i + 4], sphere1.vertices[i + 5]
            );
        }
        // Gabungkan sphere ke vertices/faces utama
        mergeGeometry(transformedSphere2, sphere1.faces);

        LIBS.translateX(sphereMatrix, 1.8);
        const transformedSphere3 = [];
        for (let i = 0; i < sphere1.vertices.length; i += 6) { // Stride 6
            const originalVertex = [sphere1.vertices[i], sphere1.vertices[i + 1], sphere1.vertices[i + 2], 1];
            const transformedPoint = LIBS.multiply_vector(sphereMatrix, originalVertex);
            transformedSphere3.push(
                transformedPoint[0], transformedPoint[1], transformedPoint[2],
                sphere1.vertices[i + 3], sphere1.vertices[i + 4], sphere1.vertices[i + 5]
            );
        }
        // Gabungkan sphere ke vertices/faces utama
        mergeGeometry(transformedSphere3, sphere1.faces);




        // Transform 1 class
        LIBS.translateY(this.POSITION_MATRIX, -0.4); // Posisi Y di leher body
    }

    setup() {
        // Setup buffer untuk GABUNGAN vertices dan faces
        this.OBJECT_VERTEX = this.GL.createBuffer();
        this.GL.bindBuffer(this.GL.ARRAY_BUFFER, this.OBJECT_VERTEX);
        this.GL.bufferData(this.GL.ARRAY_BUFFER, new Float32Array(this.vertices), this.GL.STATIC_DRAW);

        this.OBJECT_FACES = this.GL.createBuffer();
        this.GL.bindBuffer(this.GL.ELEMENT_ARRAY_BUFFER, this.OBJECT_FACES);
        this.GL.bufferData(this.GL.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.faces), this.GL.STATIC_DRAW);
    }

    render(PARENT_MATRIX) {
        // Gabungkan matriks parent (body) dengan matriks posisi & gerak KESELURUHAN collar
        var LOCAL_COLLAR_MATRIX = LIBS.multiply(this.MOVE_MATRIX, this.POSITION_MATRIX);
        var FINAL_COLLAR_MATRIX = LIBS.multiply(LOCAL_COLLAR_MATRIX, PARENT_MATRIX,);

        this.GL.useProgram(this.SHADER_PROGRAM);
        this.GL.uniformMatrix4fv(this._MMatrix, false, FINAL_COLLAR_MATRIX); // Gunakan matriks gabungan

        // Bind buffer GABUNGAN
        this.GL.bindBuffer(this.GL.ARRAY_BUFFER, this.OBJECT_VERTEX);
        this.GL.vertexAttribPointer(this._position, 3, this.GL.FLOAT, false, 24, 0);
        this.GL.vertexAttribPointer(this._color, 3, this.GL.FLOAT, false, 24, 12);

        this.GL.bindBuffer(this.GL.ELEMENT_ARRAY_BUFFER, this.OBJECT_FACES);
        // Gambar SEMUA api yang sudah digabung
        this.GL.drawElements(this.GL.TRIANGLES, this.faces.length, this.GL.UNSIGNED_SHORT, 0);
    }
}