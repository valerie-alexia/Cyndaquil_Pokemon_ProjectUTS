// legs.js

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

    // side: +1 for right leg, -1 for left leg
    constructor(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, side = 1) {
        this.GL = GL;
        this.SHADER_PROGRAM = SHADER_PROGRAM;
        this._position = _position;
        this._color = _color;
        this._MMatrix = _Mmatrix;

        // Proportions
        var hipCenter = { x: 1.2 * side, y: -3.5, z: 0.2 };
        var legLen = 0.8;
        var legDirY = -1;

        // Colors0.98, 0.94, 0.76
        var legColor = { r: 0.84, g: 0.74, b: 0.56 };

        // 1) Upper Leg (Thigh) - A thick ellipsoid
        this.addEllipsoid(0.8, 1.2, 0.8, 24, 32, hipCenter, legColor);

        // 2) Lower Leg (Foot/Ankle area)
        var footCenter = {
            x: hipCenter.x,
            y: hipCenter.y + legDirY * (legLen / 2) - 0.7,
            z: hipCenter.z + 0.1
        };
        this.addEllipsoid(0.45, 0.2, 0.5, 20, 28, footCenter, legColor);

        // 3) Claws
        var clawBaseY = footCenter.y - 0.1;
        var spread = 0.25;
        var clawBaseZ = footCenter.z + 0.3;
        this.addCone(0.08, 0.20, 12, { x: footCenter.x - spread * side, y: clawBaseY, z: clawBaseZ }, legColor, legDirY);
        this.addCone(0.09, 0.23, 12, { x: footCenter.x, y: clawBaseY, z: clawBaseZ + 0.05 }, legColor, legDirY);
        this.addCone(0.08, 0.20, 12, { x: footCenter.x + spread * side, y: clawBaseY, z: clawBaseZ }, legColor, legDirY);
        // semakin besar semakin atas
        LIBS.translateY(this.POSITION_MATRIX, -1.3);
        // --- FIX: Add rotation to the entire leg for better posture ---
        LIBS.rotateY(this.POSITION_MATRIX, 0.2 * side); // Splay legs outwards
        LIBS.rotateX(this.POSITION_MATRIX, -0.1);      // Tilt forward
    }

    // === Geometry helpers (copied from arms.js for self-containment) ===

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

    addCone(radius, height, radialSegments, baseCenter, color, dirY = -1) {
        var baseIndex = this.vertices.length / 6;
        var tipY = baseCenter.y + dirY * height;

        for (var i = 0; i <= radialSegments; i++) {
            var theta = (i / radialSegments) * Math.PI * 2;
            var x = Math.cos(theta) * radius + baseCenter.x;
            var z = Math.sin(theta) * radius + baseCenter.z;
            this.vertices.push(x, baseCenter.y, z, color.r, color.g, color.b);
        }
        this.vertices.push(baseCenter.x, tipY, baseCenter.z, color.r, color.g, color.b);
        var tipIndex = baseIndex + radialSegments + 1;

        for (var i = 0; i < radialSegments; i++) {
            var a = baseIndex + i;
            var b = baseIndex + i + 1;
            this.faces.push(a, b, tipIndex);
        }
    }

    setup() {
        this.OBJECT_VERTEX = this.GL.createBuffer();
        this.GL.bindBuffer(this.GL.ARRAY_BUFFER, this.OBJECT_VERTEX);
        this.GL.bufferData(this.GL.ARRAY_BUFFER, new Float32Array(this.vertices), this.GL.STATIC_DRAW);

        this.OBJECT_FACES = this.GL.createBuffer();
        this.GL.bindBuffer(this.GL.ELEMENT_ARRAY_BUFFER, this.OBJECT_FACES);
        this.GL.bufferData(this.GL.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.faces), this.GL.STATIC_DRAW);
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