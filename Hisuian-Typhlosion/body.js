// body.js

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
            if (z >= 0) {
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

    // Generate faces (indices)
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

function generateHyper1d(a, b, c, stack, step, uBottomTrimRatio = 0) {
    var vertices = [];
    var faces = [];

    var margin = 0.4;
    var uMax = (Math.PI / 2) - margin;
    var uMin = -uMax + (2 * uMax) * Math.max(0, Math.min(0.49, uBottomTrimRatio));

    function smoothstep(edge0, edge1, x) {
        var t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
        return t * t * (3 - 2 * t);
    }

    for (var i = 0; i <= stack / 2; i++) {
        var u = uMin + (uMax - uMin) * (i / stack);
        for (var j = 0; j <= step; j++) {
            var v = j / step * 2 * Math.PI - Math.PI;

            var x = a * Math.cos(v) * 1 / Math.cos(u);
            var y = b * Math.tan(u);
            var z = c * Math.sin(v) * 1 / Math.cos(u);

            var vertical01 = i / (stack / 2);
            var neckRegion = smoothstep(0.6, 1.0, vertical01);
            var neckScale = 1.0 - 0.35 * (neckRegion * neckRegion);
            x *= neckScale;
            z *= neckScale;

            let r, g, bcol;
            if (z >= 0) {
                r = 0.9 + y * 0.005;
                g = 0.8 + y * 0.01;
                bcol = 0.6 + y * 0.01;
            } else {
                // Belakang (purple-gray) - UPDATED COLOR
                r = 0.25; g = 0.2; bcol = 0.3;
            }

            vertices.push(x, y, z);
            vertices.push(r, g, bcol);
        }
    }

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

        const generated = generateHyper1d(1, 4, 1, 200, 200, 0.14);
        this.vertex = generated.vertices;
        this.faces = generated.faces;

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

        var minY = Infinity;
        for (var vi = 1; vi < this.vertex.length; vi += 6) {
            if (this.vertex[vi] < minY) minY = this.vertex[vi];
        }

        var sphereL = generateSphere(1, 1, 1.4, 24, 20);
        var sphereR = generateSphere(1.3, 1.3, 1.55, 24, 20);
        var yOffset = minY - 0.2;
        // -0.6 sama 0.6 sebelumnya
        // appendGeometry(sphereL.vertices, sphereL.faces, -0.1, yOffset, 0, null, true, 0.1, 0.00);
        appendGeometry(sphereR.vertices, sphereR.faces, 0.1, yOffset, 0, null, true, 0.12, 0.03);

        // ===== NEW: ADD FLAME COLLAR =====
        const numFlames = 9;
        const neckRadius = 1;
        const neckHeight = -0.4;
        const flameColor = { r: 0.5, g: 0.2, b: 0.7 };
        const flameGeometry = generateSphere(0.4, 0.3, 0.4, 12, 12); // elongated sphere for flame

        for (let i = 0; i < numFlames; i++) {
            const angle = (i / numFlames) * 2 * Math.PI;
            const x = Math.cos(angle) * neckRadius;
            // Place flames slightly further back
            const z = Math.sin(angle) * neckRadius - 0.5;
            // Stagger height slightly
            const y = neckHeight + Math.sin(angle * 2) * 0.1;
            appendGeometry(flameGeometry.vertices, flameGeometry.faces, x, y, z, flameColor);
        }

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