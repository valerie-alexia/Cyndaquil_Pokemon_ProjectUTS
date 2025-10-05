export class HeadShape {
    GL = null;
    SHADER_PROGRAM = null;

    _position = null;
    _color = null;
    _MMatrix = null;

    OBJECT_VERTEX = null;
    OBJECT_FACES = null;

    vertex = [];
    faces = [];

    POSITION_MATRIX = LIBS.get_I4(); // Mpos
    MOVE_MATRIX = LIBS.get_I4(); // Mmove

    childs = [];

    constructor(GL, SHADER_PROGRAM, _position, _color, _Mmatrix) {
        this.GL = GL;
        this.SHADER_PROGRAM = SHADER_PROGRAM;
        this._position = _position;
        this._color = _color;
        this._MMatrix = _Mmatrix;
        this.vertices = [];
        this.faces = [];

        // Bentuk ellipsoid (kepala)
        var a = 1;
        var b = 1;
        var c = 1.5;
        var stack = 200;
        var step = 300;

        // Posisi kedua mata
        var eyeY = 0.1;         // posisi tinggi mata
        var eyeZ = 1.0;         // posisi ke depan
        var eyeXoffset = 0.5;   // jarak kanan kiri
        var scleraRx = 0.25;    // lebar horizontal sclera
        var scleraRy = (eyeY < 0.4) ? 0.15 : 0.08;    // tinggi vertikal sclera
        var pupilR = 0.08;     // radius pupil

        var rightEye = { x: eyeXoffset, y: eyeY, z: eyeZ };
        var leftEye = { x: -eyeXoffset, y: eyeY, z: eyeZ };

        function inEyeRegion(x, y, z, eye) {
            let dx = (x - eye.x) / scleraRx;
            let dy = (y - eye.y) / scleraRy;
            let dz = (z - eye.z) / 0.25;   // normalize z too
            return dx * dx + dy * dy + dz * dz < 1;
        }

        // Loop vertex
        for (var i = 0; i <= stack; i++) {
            var u = i / stack * Math.PI - (Math.PI / 2);
            for (var j = 0; j <= step; j++) {
                var v = j / step * 2 * Math.PI - Math.PI;

                var x = a * Math.cos(v) * Math.cos(u);
                var y = b * Math.sin(u);
                var z = c * Math.sin(v) * Math.cos(u);

                var r, g, bcol;

                // Warna dasar kepala
                if (y > 0.3) {
                    // Top
                    r = 0.4 + y * 0.2;
                    g = 0.2 + y * 0.1;
                    bcol = 0.5 + y * 0.3;
                } else {
                    // bottom
                    r = 0.9 + y * 0.05;
                    g = 0.8 + y * 0.1;
                    bcol = 0.6 + y * 0.1;
                }

                // Cek kanan/kiri
                let inRight = inEyeRegion(x, y, z, rightEye);
                let inLeft = inEyeRegion(x, y, z, leftEye);

                if (inRight || inLeft) {
                    // sclera putih
                    r = 0.95; g = 0.95; bcol = 0.95;

                    let eye = inRight ? rightEye : leftEye;

                    // cek pupil: pakai X & Y saja biar tepat di tengah sclera
                    let dx = (x - eye.x);
                    let dy = (y - eye.y);
                    let pupilDist2D = Math.sqrt(dx * dx + dy * dy);

                    if (pupilDist2D < pupilR * 2) { // sedikit lebih besar biar kelihatan
                        r = 0.8; g = 0.0; bcol = 0.0;  // pupil merah
                    }

                    // outline sclera hitam tipis
                    let dxn = (x - eye.x) / scleraRx;
                    let dyn = (y - eye.y) / scleraRy;
                    let edge = dxn * dxn + dyn * dyn;
                    if (edge > 0.9 && edge < 1.1) {
                        r = 0.05; g = 0.05; bcol = 0.05;
                    }
                }


                this.vertices.push(x, y, z, r, g, bcol);
            }
        }

        // Faces
        for (var i = 0; i < stack; i++) {
            for (var j = 0; j < step; j++) {
                var first = i * (step + 1) + j;
                var second = first + 1;
                var third = first + (step + 1);
                var fourth = third + 1;

                this.faces.push(first, second, fourth);
                this.faces.push(first, fourth, third);
            }
        }

        
        // Position head relative to parent body
        LIBS.set_I4(this.POSITION_MATRIX);
        // Move head up and slightly forward where the neck should be
        // LIBS.translateX(this.POSITION_MATRIX, 2);
        // semakin besar semakin atas
        LIBS.translateY(this.POSITION_MATRIX, 0.01);
        // semakin besar semakin maju
        LIBS.translateZ(this.POSITION_MATRIX, 0.55);
        // Slight downward tilt
        LIBS.rotateX(this.POSITION_MATRIX, 0.1);

        // Scale to be smaller than body
        // Apply simple uniform scaling by multiplying diagonal terms
        // this.POSITION_MATRIX[0] *= 0.65;
        // this.POSITION_MATRIX[5] *= 0.65;
        // this.POSITION_MATRIX[10] *= 0.65;
    }

    setup() {
        this.OBJECT_VERTEX = this.GL.createBuffer();
        this.GL.bindBuffer(this.GL.ARRAY_BUFFER, this.OBJECT_VERTEX);
        this.GL.bufferData(this.GL.ARRAY_BUFFER, new Float32Array(this.vertices), this.GL.STATIC_DRAW);

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
