// environment/terrain.js
import {LIBS} from "./libs.js";

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

        // --- Colors ---
        const grassColor = [0.2, 0.6, 0.2];

        // --- Geometry ---
        // 1. Ground Circle (Grass)
        const groundRadius = radius * 0.95; 
        const groundGeo = this.generateCircle(groundRadius, 64, grassColor);
        const groundMatrix = LIBS.get_I4();
        LIBS.translateY(groundMatrix, this.groundLevel);
        LIBS.rotateX(groundMatrix, -Math.PI / 2); 

        // --- Add Objects ---
        this.addObject(groundGeo.vertices, groundGeo.indices, groundMatrix);
    }

    addObject(vertices, indices, localMatrix) {
        this.OBJECTS.push({ vertices, indices, localMatrix, vertexBuffer: null, indexBuffer: null });
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

    // --- Geometry Functions ---
    generateCircle(radius, segments, color) {
        const vertices = [];
        const indices = [];
        // Center vertex
        vertices.push(0, 0, 0, ...color); 

        // Outer vertices
        for (let i = 0; i <= segments; i++) {
            const angle = (i / segments) * Math.PI * 2;
            const x = radius * Math.cos(angle);
            const y = radius * Math.sin(angle); 
            vertices.push(x, y, 0, ...color);
        }

        for (let i = 1; i <= segments; i++) {
            indices.push(0, i, i + 1);
        }

        return { vertices, indices };
    }
}