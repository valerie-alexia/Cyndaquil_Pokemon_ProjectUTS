// flame.js

export class FlameShape {
    GL = null;
    SHADER_PROGRAM = null;

    _position = null;
    _Pmatrix = null;
    _Vmatrix = null;
    _Mmatrix = null;
    _time = null;
    _color1 = null;
    _color2 = null;

    OBJECT_VERTEX = null;
    OBJECT_FACES = null;
    vertices = [];
    faces = [];
    flameMatrices = []; // Array untuk menyimpan matriks transformasi setiap api

    constructor(GL, SHADER_PROGRAM, _position, _Pmatrix, _Vmatrix, _Mmatrix) {
        this.GL = GL;
        this.SHADER_PROGRAM = SHADER_PROGRAM;
        this._position = _position;
        this._Pmatrix = _Pmatrix;
        this._Vmatrix = _Vmatrix;
        this._MMatrix = _Mmatrix;

        this._time = GL.getUniformLocation(SHADER_PROGRAM, "time");
        this._color1 = GL.getUniformLocation(SHADER_PROGRAM, "color1");
        this._color2 = GL.getUniformLocation(SHADER_PROGRAM, "color2");

        // --- BUAT GEOMETRI HANYA UNTUK SATU API ---
        const flameGeo = this.createCone(0.15, 0.8, 8); // radius, height, segments
        this.vertices = flameGeo.vertices;
        this.faces = flameGeo.indices;

        // --- BUAT DAN SIMPAN MATRIKS TRANSFORMASI UNTUK SETIAP API ---
        const numFlames = 9;
        const neckRadius = 0.85;
        const neckHeight = 2.4;
        
        for (let i = 0; i < numFlames; i++) {
            const angle = -0.7 * Math.PI + (i / (numFlames - 1)) * 1.4 * Math.PI;

            const transformMatrix = LIBS.get_I4();
            LIBS.rotateX(transformMatrix, 1.3); // Miring ke belakang
            LIBS.rotateY(transformMatrix, Math.cos(angle) * -0.6); // Mekar ke samping
            
            const x = Math.cos(angle) * neckRadius;
            const y = neckHeight + Math.sin(angle + Math.PI/2) * 0.3;
            const z = Math.sin(angle) * neckRadius - 0.3;
            LIBS.translate(transformMatrix, x, y, z);
            
            this.flameMatrices.push(transformMatrix); // Simpan matriks
        }
    }
    
    createCone(radius, height, segments) {
        const vertices = [0, height/2, 0]; // Puncak (Hanya XYZ)
        const indices = [];
        for (let i = 0; i <= segments; i++) {
            const angle = (i / segments) * 2 * Math.PI;
            vertices.push(radius * Math.cos(angle), -height/2, radius * Math.sin(angle));
        }
        for (let i = 1; i <= segments; i++) {
            indices.push(0, i, i + 1);
        }
        return { vertices, indices };
    }

    setup() {
        this.OBJECT_VERTEX = this.GL.createBuffer();
        this.GL.bindBuffer(this.GL.ARRAY_BUFFER, this.OBJECT_VERTEX);
        this.GL.bufferData(this.GL.ARRAY_BUFFER, new Float32Array(this.vertices), this.GL.STATIC_DRAW);

        this.OBJECT_FACES = this.GL.createBuffer();
        this.GL.bindBuffer(this.GL.ELEMENT_ARRAY_BUFFER, this.OBJECT_FACES);
        this.GL.bufferData(this.GL.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.faces), this.GL.STATIC_DRAW);
    }

    render(PROJMATRIX, VIEWMATRIX, MOVEMATRIX, time) {
        const GL = this.GL;
        GL.useProgram(this.SHADER_PROGRAM);

        GL.enable(GL.BLEND);
        GL.blendFunc(GL.SRC_ALPHA, GL.ONE);
        GL.depthMask(false);

        GL.uniformMatrix4fv(this._Pmatrix, false, PROJMATRIX);
        GL.uniformMatrix4fv(this._Vmatrix, false, VIEWMATRIX);
        GL.uniform1f(this._time, time / 1000.0);
        GL.uniform3fv(this._color1, [0.41, 0.05, 0.86]);
        GL.uniform3fv(this._color2, [1.0, 0.0, 1.0]);

        GL.bindBuffer(GL.ARRAY_BUFFER, this.OBJECT_VERTEX);
        GL.vertexAttribPointer(this._position, 3, GL.FLOAT, false, 12, 0); // Stride 12 (XYZ)
        GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, this.OBJECT_FACES);

        // Loop dan gambar setiap api dengan matriksnya sendiri
        this.flameMatrices.forEach(localMatrix => {
            const finalFlameMatrix = LIBS.multiply(MOVEMATRIX, localMatrix);
            GL.uniformMatrix4fv(this._MMatrix, false, finalFlameMatrix);
            GL.drawElements(GL.TRIANGLES, this.faces.length, GL.UNSIGNED_SHORT, 0);
        });
        
        GL.depthMask(true);
        GL.disable(GL.BLEND);
    }
}