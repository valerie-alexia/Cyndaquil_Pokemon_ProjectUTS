
function generateSphere(a, b, c, stack, step) {
    var vertices = [];
    var faces = [];

    // Generate vertices and colors
    for (var i = 0; i <= stack; i++) {
        // var u = i / stack * Math.PI - (Math.PI / 2); // Latitude
        var u = i / stack * Math.PI - (Math.PI / 2); // Latitude
        for (var j = 0; j <= step; j++) {
            // var v = j / step * 2 * Math.PI - Math.PI; // Longitude
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
                // Belakang (purple)
                r = 0.4; g = 0.2; bcol = 0.6;
            }
            // Push vertex position
            vertices.push(x, y, z);
            // Push color (same range and logic as body hyper1d)
            vertices.push(r, g, bcol);
        }
    }

    // Generate faces (indices)
    for (var i = 0; i < stack; i++) {
        for (var j = 0; j < step; j++) {
            // Index of the 4 vertices forming a quad
            var first = i * (step + 1) + j;
            var second = first + 1;
            var third = first + (step + 1);
            var fourth = third + 1;

            // Push two triangles to form the quad
            faces.push(first, second, fourth);
            faces.push(first, fourth, third);
        }
    }
    return { vertices, faces };
}
function generateHyper1d(a, b, c, stack, step, uBottomTrimRatio = 0) {
    var vertices = [];
    var faces = [];

    // Generate vertices and colors
    // Keep u away from +/- PI/2 so tan(u) remains finite
    var margin = 0.4; // radians kept away from the asymptotes (~8.6 deg)
    var uMax = (Math.PI / 2) - margin;
    // Raise the lower bound by a fraction to trim the bottom naturally
    var uMin = -uMax + (2 * uMax) * Math.max(0, Math.min(0.49, uBottomTrimRatio));


    // Biar smooth ke kepala
    function smoothstep(edge0, edge1, x) {
        var t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
        return t * t * (3 - 2 * t);
    }


    for (var i = 0; i <= stack / 2; i++) {
        // Map i in [0,stack] to u in [uMin, +uMax]
        var u = uMin + (uMax - uMin) * (i / stack);
        for (var j = 0; j <= step; j++) {
            var v = j / step * 2 * Math.PI - Math.PI; // Longitude

            var x = a * Math.cos(v) * 1 / Math.cos(u);
            var y = b * Math.tan(u);
            var z = c * Math.sin(v) * 1 / Math.cos(u);

            // Biar smooth ke kepala
            // i spans [0, stack/2], normalize to [0,1]
            var vertical01 = i / (stack / 2);
            var neckRegion = smoothstep(0.8, 1.0, vertical01); // 0 below 80%, 1 at the very top
            // Reduce radius up to ~35% at the very top using a gentle curve
            var neckScale = 1.0 - 0.35 * (neckRegion * neckRegion);
            x *= neckScale;
            z *= neckScale;


            let r, g, bcol;
            if (z >= 0) {
                r = 0.9 + y * 0.005;
                g = 0.8 + y * 0.01;
                bcol = 0.6 + y * 0.01;
            } else {
                // Belakang (purple)
                r = 0.4; g = 0.2; bcol = 0.6;
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
            // Index of the 4 vertices forming a quad
            var first = i * (step + 1) + j;
            var second = first + 1;
            var third = first + (step + 1);
            var fourth = third + 1;

            // Push two triangles to form the quad
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

    POSITION_MATRIX = LIBS.get_I4(); // Mpos
    MOVE_MATRIX = LIBS.get_I4(); // Mmove


    childs = [];

    constructor(GL, SHADER_PROGRAM, _position, _color, _Mmatrix) {//ambil parameter dari main.js nya
        this.GL = GL;
        this.SHADER_PROGRAM = SHADER_PROGRAM;
        this._position = _position;
        this._color = _color;
        this._MMatrix = _Mmatrix;

        // buat objek — trim bawah sedikit dengan memperkecil rentang u (tanpa flatten)
        const generated = generateHyper1d(1, 4, 1, 200, 200, 0.14);
        this.vertex = generated.vertices;
        this.faces = generated.faces;

        // Helper: merge another geometry with translation and proper index offset
        // Supports optional shading like body with small front (z) and light (y) biases
        const appendGeometry = (vertices, faces, tx = 0, ty = 0, tz = 0, overrideColor = null, shadeLikeBody = false, zFrontBias = 0, yLightBias = 0) => {
            var baseIndex = this.vertex.length / 6; // number of existing vertices
            // append translated vertices (stride 6: xyz rgb)
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
                        r = 0.4; g = 0.2; bcol = 0.6;
                    }
                } else if (overrideColor) {
                    r = overrideColor.r; g = overrideColor.g; bcol = overrideColor.b;
                } else {
                    r = vertices[i + 3];
                    g = vertices[i + 4];
                    bcol = vertices[i + 5];
                }
                this.vertex.push(x, y, z, r, g, bcol);
            }
            // append faces with index offset
            for (var j = 0; j < faces.length; j++) {
                this.faces.push(faces[j] + baseIndex);
            }
        };

        // Find approximate bottom Y of current body to place spheres just below
        var minY = Infinity;
        for (var vi = 1; vi < this.vertex.length; vi += 6) {
            if (this.vertex[vi] < minY) minY = this.vertex[vi];
        }

        // Create two bottom spheres and append properly
        var sphereL = generateSphere(1, 1, 1.4, 24, 20);
        var sphereR = generateSphere(1, 1, 1.4, 24, 20);

        // Positioning: slightly to left/right X, a bit below minY, slight forward Z
        var yOffset = minY - 0.2;
        // Small positive biases to better match hyper1d front cream and lightness
        appendGeometry(sphereL.vertices, sphereL.faces, -0.6, yOffset, 0, null, true, 0.1, 0.00);
        appendGeometry(sphereR.vertices, sphereR.faces, 0.6, yOffset, 0, null, true, 0.12, 0.03);

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