export class ArmShape {
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

    // side: +1 for right arm, -1 for left arm (mirror along X)
    constructor(GL, SHADER_PROGRAM, _position, _color, _Mmatrix, side = 1) {
        this.GL = GL;
        this.SHADER_PROGRAM = SHADER_PROGRAM;
        this._position = _position;
        this._color = _color;
        this._MMatrix = _Mmatrix;

        // Basic proportions
        var shoulderCenter = { x: 1 * side, y: -0.2, z: 0.15 };
        var upperLen = 1.3;
        // Panjang telapak tangan
        var foreLen = 0.4;
        var handLen = 0.2;
        var armDirY = -1; // pointing downward

        // Colors (match cream tone of head/body)
        var armColor = { r: 0.9, g: 0.8, b: 0.6 }; 
        // var armColor = { r: 0.9, g: 0.0, b: 0.0 }; 
        var clawColor = { r: 0.9, g: 0.8, b: 0.6 };

        // 1) Shoulder ellipse
        this.addEllipsoid(0.55, 0.28, 0.55, 24, 32, shoulderCenter, armColor);

        // 2) Upper arm (elliptical cylinder, lebih tebal di bahu)
        var upperCenter = { 
            x: shoulderCenter.x, 
            y: shoulderCenter.y + armDirY * (upperLen / 2), 
            z: shoulderCenter.z
        };
        this.addEllipticalCylinder(
            0.32, 0.28,  // rxTop, rzTop
            0.50, 0.54,  // rxBottom, rzBottom
            upperLen, 
            28, 1, 
            upperCenter, 
            armColor
        );

        // 3) Elbow ellipse
        var elbowCenter = { 
            x: upperCenter.x, 
            y: upperCenter.y + armDirY * (upperLen / 2), 
            z: upperCenter.z
        };
        this.addEllipsoid(0.34, 0.2, 0.22, 20, 28, elbowCenter, armColor);

        // 4) Forearm (lebih ramping & pipih)
        var foreCenter = { 
            x: elbowCenter.x, 
            y: elbowCenter.y + armDirY * (foreLen / 2), 
            z: elbowCenter.z
        };
        this.addEllipticalCylinder(
            0.25    , 0.15,   // rxTop, rzTop
            0.24, 0.20,   // rxBottom, rzBottom
            foreLen, 
            28, 1, 
            foreCenter, 
            armColor
        );

        // 5a) Hand ellipse
        var handCenter = { 
            x: foreCenter.x, 
            y: foreCenter.y + armDirY * (handLen / 2), 
            z: foreCenter.z
        };
        this.addEllipsoid(0.18, 0.1, 0.18, 28, 28, handCenter, clawColor);

        // 5) Fingers (3 claws, sedikit beda panjang + pipih)
        var wristY = foreCenter.y + armDirY * (foreLen / 2 + 0.);
        var spread = 0.20;
        var fingerBaseZ = foreCenter.z + 0.02;

        this.addCone(0.06, 0.30, 24, {x: foreCenter.x - spread*side, y: wristY, z: fingerBaseZ}, clawColor, armDirY); 
        this.addCone(0.065, 0.34, 24, {x: foreCenter.x, y: wristY, z: fingerBaseZ+0.02}, clawColor, armDirY); 
        this.addCone(0.055, 0.28, 24, {x: foreCenter.x + spread*side, y: wristY, z: fingerBaseZ}, clawColor, armDirY); 

        LIBS.rotateZ(this.POSITION_MATRIX, 0.7*side);
    }

    // === Geometry helpers ===

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

    // New: elliptical cylinder
    addEllipticalCylinder(rxTop, rzTop, rxBottom, rzBottom, height, radialSegments, heightSegments, center, color) {
        var baseIndex = this.vertices.length / 6;
        for (var yIdx = 0; yIdx <= heightSegments; yIdx++) {
            var t = yIdx / heightSegments;
            var y = (-height / 2 + t * height) + center.y;
            var rx = rxTop + (rxBottom - rxTop) * t;
            var rz = rzTop + (rzBottom - rzTop) * t;
            for (var i = 0; i <= radialSegments; i++) {
                var theta = (i / radialSegments) * Math.PI * 2;
                var x = Math.cos(theta) * rx + center.x;
                var z = Math.sin(theta) * rz + center.z;
                this.vertices.push(x, y, z, color.r, color.g, color.b);
            }
        }
        for (var yIdx = 0; yIdx < heightSegments; yIdx++) {
            for (var i = 0; i < radialSegments; i++) {
                var row = radialSegments + 1;
                var a = baseIndex + yIdx * row + i;
                var b = a + 1;
                var c = a + row;
                var d = c + 1;
                this.faces.push(a, b, d, a, d, c);
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

        // semakin besar semakin atas
        LIBS.translateY(this.POSITION_MATRIX, -0.4);
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
