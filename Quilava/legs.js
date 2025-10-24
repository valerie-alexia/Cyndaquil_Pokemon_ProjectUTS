export class LegsShape {
    GL = null;
    SHADER_PROGRAM = null;
    _position = null;
    _color = null;
    _MMatrix = null;
    OBJECT_VERTEX = null;
    OBJECT_FACES = null;
    vertices = [];
    faces = [];
    POSITION_MATRIX = LIBS.get_I4();
    MOVE_MATRIX = LIBS.get_I4();
    childs = [];

    // side: +1 (right leg), -1 (left leg)
    // constructor ------------------------------------
    constructor(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, side = 1) {
        this.GL = GL;
        this.SHADER_PROGRAM = SHADER_PROGRAM;
        this._position = _position;
        this._color = _color;
        this._MMatrix = _Mmatrix;
        var hipCenter = { x: 1.2 * side, y: -3.5, z: 0.2 };
        var legLen = 0.8;
        var legDirY = -1;
        var legColor = { r: 0.98, g: 0.94, b: 0.76 };

        // 1) Upper Leg (Thigh) thick ellipsoid
        this.addEllipsoid(0.8, 1.2, 0.8, 24, 32, hipCenter, legColor);

        // 2) Lower Leg (Foot/Ankle area)
        var footCenter = {
            x: hipCenter.x,
            y: hipCenter.y + legDirY * (legLen / 2) - 0.7,
            z: hipCenter.z + 0.3
        };
        this.addEllipsoid(0.45, 0.2, 0.7, 20, 28, footCenter, legColor);

        // 3) Toes (3 Bumps)
        const toeRadius = { rx: 0.15, ry: 0.15, rz: 0.2 };
        const toeStacks = 8;
        const toeSlices = 8;
        const toeYOffset = legDirY * 0.01; 
        const toeZOffset = 0.5;        
        const spread = 0.2;      

        // Jari Tengah
        this.addEllipsoid(toeRadius.rx, toeRadius.ry, toeRadius.rz, toeStacks, toeSlices, {
            x: footCenter.x,
            y: footCenter.y + toeYOffset,
            z: footCenter.z + toeZOffset + 0.1 // Paling depan
        }, legColor);
        // Jari Samping 1
        this.addEllipsoid(toeRadius.rx, toeRadius.ry, toeRadius.rz, toeStacks, toeSlices, {
            x: footCenter.x - spread * side, // Geser ke samping
            y: footCenter.y + toeYOffset,
            z: footCenter.z + toeZOffset
        }, legColor);
        // Jari Samping 2
        this.addEllipsoid(toeRadius.rx, toeRadius.ry, toeRadius.rz, toeStacks, toeSlices, {
            x: footCenter.x + spread * side, // Geser ke samping lain
            y: footCenter.y + toeYOffset,
            z: footCenter.z + toeZOffset
        }, legColor);
        LIBS.translateY(this.POSITION_MATRIX, -1.3);
    }

    // SETUP ---------------------------------------------------------------
    setup() {
        this.OBJECT_VERTEX = this.GL.createBuffer();
        this.GL.bindBuffer(this.GL.ARRAY_BUFFER, this.OBJECT_VERTEX);
        this.GL.bufferData(this.GL.ARRAY_BUFFER, new Float32Array(this.vertices), this.GL.STATIC_DRAW);
        this.OBJECT_FACES = this.GL.createBuffer();
        this.GL.bindBuffer(this.GL.ELEMENT_ARRAY_BUFFER, this.OBJECT_FACES);
        this.GL.bufferData(this.GL.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.faces), this.GL.STATIC_DRAW);
    }

    // RENDER ---------------------------------------------------------------
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

    // FUNCTIONS ------------------------------------
    addEllipsoid(rx, ry, rz, stacks, slices, center, color) {
        var baseIndex = this.vertices.length / 6;
        for (var i = 0; i <= stacks; i++) {
            var u = i / stacks * Math.PI - (Math.PI / 2);
            for (var j = 0; j <= slices; j++) {
                var v = j / slices * 2 * Math.PI - Math.PI;
                var x = rx * Math.cos(v) * Math.cos(u) + center.x;
                var y = ry * Math.sin(u) + center.y;
                var z = rz * Math.sin(v) * Math.cos(u) + center.z;
                this.vertices.push(x, y, z, color.r, color.g, color.b);
            }
        }
        for (var i = 0; i < stacks; i++) {
            for (var j = 0; j < slices; j++) {
                var first = baseIndex + i * (slices + 1) + j;
                var second = first + 1;
                var third = first + (slices + 1);
                var fourth = third + 1;
                this.faces.push(first, second, fourth, first, fourth, third);
            }
        }
    }
}