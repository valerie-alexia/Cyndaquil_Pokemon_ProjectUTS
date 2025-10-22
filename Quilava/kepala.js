/**
 * Character.js
 *
 * This single class builds and renders your entire character,
 * following your friend's template structure. It contains all the
 * geometry creation methods and object definitions inside.
 */
export class HeadShape {
    GL = null;
    SHADER_PROGRAM = null;

    // Attribute and Uniform locations
    _position = null;
    _color = null;
    _MMatrix = null;

    OBJECTS = [];

    // Main transformation matrices for the whole character
    POSITION_MATRIX = mat4.create(); // Positions the character in the world
    MOVE_MATRIX = mat4.create();     // Rotates the character based on mouse input

    constructor(GL, SHADER_PROGRAM, _position, _color, _MMatrix) {
        this.GL = GL;
        this.SHADER_PROGRAM = SHADER_PROGRAM;
        this._position = _position;
        this._color = _color;
        this._MMatrix = _MMatrix;

        // ===== Define Colors =====
        const topColor = [0.22, 0.36, 0.49]; // dark blue
        const bottomColor = [0.98, 0.94, 0.76]; // cream
        const scleraColor = [1.0, 1.0, 0.95]; // off-white
        const irisColor = [0.8, 0.1, 0.1]; // red
        const pupilColor = [0.0, 0.0, 0.0]; // black
        const highlightColor = [1.0, 1.0, 1.0]; // white

        // ===== Create Geometries =====
        const headGeo = this.createEllipsoid(0.9, 0.8, 0.8, 60, 60, topColor, bottomColor);
        const snoutGeo = this.createEllipticParaboloid(0.6, 0.4, 1.0, 20, topColor, bottomColor);
        const bodyGeo = this.createHyperboloidOneSheet(0.7, 0.9, 1.2, 30, 30, topColor, bottomColor);
        const earGeo = this.createHalfEllipticCone(0.5, 0.2, 1.0, 20, topColor);
        const innerEarGeo = this.createTriangle(irisColor);
        const scleraGeo = this.createSemicircle(1.0, 20, scleraColor);
        const irisGeo = this.createSemicircle(1.0, 20, irisColor);
        const pupilGeo = this.createSemicircle(1.0, 20, pupilColor);
        const highlightGeo = this.createSemicircle(1.0, 20, highlightColor);
        const baseEyeRotationZ = -Math.PI / 2;

        // ===== Create Transformation Matrices for each part =====
        const bodyMatrix = this.createTransformMatrix({ translation: [0, -0.9, 0.09], rotation: [-Math.PI / 2, 0, 0], scale: [0.7, 0.7, 0.5] });
        const headMatrix = this.createTransformMatrix({ translation: [0, 0, 0], rotation: [0, 1.5, 0], scale: [1, 1, 1] });
        const snoutMatrix = this.createTransformMatrix({ translation: [0, 0.01, 1.2], rotation: [Math.PI, 0, 3.1], scale: [1.1, 1.7, 0.7] });
        const leftEarMatrix = this.createTransformMatrix({ translation: [-0.6, 0.7, 0.1], rotation: [1, 2.3, -1], scale: [0.5, 0.4, 1.1] });
        const rightEarMatrix = this.createTransformMatrix({ translation: [0.6, 0.7, 0.1], rotation: [-1, 2.3, 1], scale: [0.5, 0.4, 1.1] });
        const leftInnerEarMatrix = this.createTransformMatrix({ translation: [-0.6, 0.7, 0.11], rotation: [3, 5.8, -0.7], scale: [0.15, 0.16, 2.2] });
        const rightInnerEarMatrix = this.createTransformMatrix({ translation: [0.6, 0.7, 0.11], rotation: [-3, 5.8, 0.7], scale: [0.15, 0.16, 2.2] });
        const leftScleraMatrix = this.createTransformMatrix({ translation: [-0.57, 0.1, 0.7], rotation: [0.05, -1, -1.7 + baseEyeRotationZ], scale: [0.3, 0.3, 0.1] });
        const leftIrisMatrix = this.createTransformMatrix({ translation: [-0.52, 0.09, 0.78], rotation: [0.05, -1, -1.7 + baseEyeRotationZ + 6.3], scale: [0.21, 0.27, 0.1] });
        const leftPupilMatrix = this.createTransformMatrix({ translation: [-0.47, 0.07, 0.86], rotation: [0.07, -1, -1.7 + baseEyeRotationZ + 6.33], scale: [0.12, 0.12, 0.1] });
        const leftHighlightMatrix = this.createTransformMatrix({ translation: [-0.52, 0.03, 0.78], rotation: [0.05, -1, -1.7 + baseEyeRotationZ], scale: [0.06, 0.06, 0.1] });
        const rightScleraMatrix = this.createTransformMatrix({ translation: [0.57, 0.1, 0.7], rotation: [0.05, 1, 4.85 + baseEyeRotationZ], scale: [0.3, 0.3, 0.1] });
        const rightIrisMatrix = this.createTransformMatrix({ translation: [0.52, 0.09, 0.78], rotation: [0.05, 1, 1.7 + baseEyeRotationZ + 3.1], scale: [0.21, 0.27, 0.1] });
        const rightPupilMatrix = this.createTransformMatrix({ translation: [0.47, 0.07, 0.86], rotation: [0.07, 1, 1.7 + baseEyeRotationZ + 3.1], scale: [0.12, 0.12, 0.1] });
        const rightHighlightMatrix = this.createTransformMatrix({ translation: [0.52, 0.03, 0.78], rotation: [0.05, 1, 1.7 + baseEyeRotationZ + 3.2], scale: [0.06, 0.06, 0.1] });

        // ===== Add all parts as objects =====
        this.addObject(bodyGeo.vertices, bodyGeo.indices, bodyMatrix);
        this.addObject(headGeo.vertices, headGeo.indices, headMatrix);
        this.addObject(snoutGeo.vertices, snoutGeo.indices, snoutMatrix);
        this.addObject(earGeo.vertices, earGeo.indices, leftEarMatrix);
        this.addObject(earGeo.vertices, earGeo.indices, rightEarMatrix);
        this.addObject(innerEarGeo.vertices, innerEarGeo.indices, leftInnerEarMatrix);
        this.addObject(innerEarGeo.vertices, innerEarGeo.indices, rightInnerEarMatrix);
        this.addObject(scleraGeo.vertices, scleraGeo.indices, leftScleraMatrix);
        this.addObject(irisGeo.vertices, irisGeo.indices, leftIrisMatrix);
        this.addObject(pupilGeo.vertices, pupilGeo.indices, leftPupilMatrix);
        this.addObject(highlightGeo.vertices, highlightGeo.indices, leftHighlightMatrix);
        this.addObject(scleraGeo.vertices, scleraGeo.indices, rightScleraMatrix);
        this.addObject(irisGeo.vertices, irisGeo.indices, rightIrisMatrix);
        this.addObject(pupilGeo.vertices, pupilGeo.indices, rightPupilMatrix);
        this.addObject(highlightGeo.vertices, highlightGeo.indices, rightHighlightMatrix);

        // Move the entire character back so we can see it
        mat4.translate(this.POSITION_MATRIX, this.POSITION_MATRIX, [0, 1.4, 0.0]);
    }

    addObject(vertices, indices, localMatrix = null) {
        if (localMatrix === null) localMatrix = mat4.create();
        this.OBJECTS.push({ vertices, indices, localMatrix });
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

    render(PARENT_MATRIX) {
        // Create the base model matrix for the whole character
        const MODEL_MATRIX = mat4.create();
        mat4.multiply(MODEL_MATRIX, this.POSITION_MATRIX, this.MOVE_MATRIX);
        mat4.multiply(MODEL_MATRIX, PARENT_MATRIX, MODEL_MATRIX);

        this.OBJECTS.forEach(obj => {
            // Apply each part's local transformation
            const M = mat4.create();
            mat4.multiply(M, MODEL_MATRIX, obj.localMatrix);

            this.GL.useProgram(this.SHADER_PROGRAM);
            this.GL.uniformMatrix4fv(this._MMatrix, false, M);

            this.GL.bindBuffer(this.GL.ARRAY_BUFFER, obj.vertexBuffer);
            // Setup pointers for the interleaved buffer (position and color)
            this.GL.vertexAttribPointer(this._position, 3, this.GL.FLOAT, false, 24, 0);
            this.GL.vertexAttribPointer(this._color, 3, this.GL.FLOAT, false, 24, 12);

            this.GL.bindBuffer(this.GL.ELEMENT_ARRAY_BUFFER, obj.indexBuffer);
            this.GL.drawElements(this.GL.TRIANGLES, obj.indices.length, this.GL.UNSIGNED_SHORT, 0);
        });
    }

    // --- All your geometry creation and helper functions are now methods of this class ---

    createTransformMatrix({ translation, rotation, scale }) {
        const matrix = mat4.create();
        mat4.translate(matrix, matrix, translation);
        mat4.rotateX(matrix, matrix, rotation[0]);
        mat4.rotateY(matrix, matrix, rotation[1]);
        mat4.rotateZ(matrix, matrix, rotation[2]);
        mat4.scale(matrix, matrix, scale);
        return matrix;
    }
    
    // NOTE: The following functions are your original ones, modified to create
    // a single interleaved "vertices" array with (X, Y, Z, R, G, B) data.
    
    createHyperboloidOneSheet(a, b, c, segmentsU, segmentsV, topColor, bottomColor) {
        const vertices = [], indices = [];
        for (let i = 0; i <= segmentsU; i++) {
            const u = -1.0 + (2.0 * i) / segmentsU;
            for (let j = 0; j <= segmentsV; j++) {
                const v = (j / segmentsV) * 2 * Math.PI;
                const x = a * Math.cosh(u) * Math.cos(v);
                const y = b * Math.cosh(u) * Math.sin(v);
                const z = c * Math.sinh(u);
                const color = y >= 0 ? topColor : bottomColor;
                vertices.push(x, y, z, ...color);
            }
        }
        for (let i = 0; i < segmentsU; i++) {
            for (let j = 0; j < segmentsV; j++) {
                const first = i * (segmentsV + 1) + j;
                const second = first + segmentsV + 1;
                indices.push(first, second, first + 1, second, second + 1, first + 1);
            }
        }
        return { vertices, indices };
    }

    createTriangle(color) {
        const v = [-1.0, 1.0, 0.0, ...color, 1.0, 1.0, 0.0, ...color, 0.0, -1.0, 0.0, ...color];
        return { vertices: v, indices: [0, 1, 2] };
    }

    createHalfEllipticCone(radiusX, radiusZ, height, segments, color) {
        const vertices = [], indices = [];
        vertices.push(0, height / 2, 0, ...color);
        for (let i = 0; i <= segments; i++) {
            const angle = (i / segments) * Math.PI - Math.PI / 2;
            const x = radiusX * Math.cos(angle);
            const z = radiusZ * Math.sin(angle);
            vertices.push(x, -height / 2, z, ...color);
        }
        for (let i = 1; i <= segments; i++) indices.push(0, i, i + 1);
        const backCenterIndex = (vertices.length / 6);
        vertices.push(0, -height / 2, 0, ...color);
        for (let i = 1; i < segments; i++) indices.push(backCenterIndex, i, i + 1);
        return { vertices, indices };
    }

    createSemicircle(radius, segments, color) {
        const vertices = [], indices = [];
        vertices.push(0, 0, 0, ...color);
        for (let i = 0; i <= segments; i++) {
            const angle = (i / segments) * Math.PI;
            vertices.push(radius * Math.cos(angle), radius * Math.sin(angle), 0, ...color);
        }
        for (let i = 1; i <= segments; i++) indices.push(0, i, i + 1);
        return { vertices, indices };
    }

    createEllipticParaboloid(a, b, height, segments, topColor, bottomColor) {
        const vertices = [], indices = [];
        for (let i = 0; i <= segments; i++) {
            const u = i / segments;
            for (let j = 0; j <= segments; j++) {
                const v = (j / segments) * 2 * Math.PI;
                const x = a * u * Math.cos(v), y = b * u * Math.sin(v), z = height * u * u;
                const color = y >= 0 ? topColor : bottomColor;
                vertices.push(x, y, z, ...color);
            }
        }
        for (let i = 0; i < segments; i++) {
            for (let j = 0; j < segments; j++) {
                const first = i * (segments + 1) + j, second = first + segments + 1;
                indices.push(first, second, first + 1, second, second + 1, first + 1);
            }
        }
        return { vertices, indices };
    }

    createEllipsoid(radiusX, radiusY, radiusZ, lats, longs, topColor, bottomColor) {
        const vertices = [], indices = [];
        for (let i = 0; i <= lats; i++) {
            const latAngle = (Math.PI / lats) * i - Math.PI / 2;
            for (let j = 0; j <= longs; j++) {
                const longAngle = (j / longs) * 2 * Math.PI;
                const x = radiusX * Math.cos(longAngle) * Math.cos(latAngle);
                const y = radiusY * Math.sin(latAngle);
                const z = radiusZ * Math.sin(longAngle) * Math.cos(latAngle);
                const color = y >= 0 ? topColor : bottomColor;
                vertices.push(x, y, z, ...color);
            }
        }
        for (let i = 0; i < lats; i++) {
            for (let j = 0; j < longs; j++) {
                const first = i * (longs + 1) + j, second = first + longs + 1;
                indices.push(first, second, first + 1, second, second + 1, first + 1);
            }
        }
        return { vertices, indices };
    }
}