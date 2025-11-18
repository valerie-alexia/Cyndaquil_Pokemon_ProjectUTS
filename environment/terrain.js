// environment/terrain.js
import { LIBS } from "./libs.js";

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
        
        const grassColor = [0.2, 0.6, 0.2];
        const rockColor = [0.5, 0.5, 0.55];

        //Green Base Ground
        const groundRadius = radius * 0.95; 
        const groundGeo = this.generateCircle(groundRadius, 64, grassColor);
        const groundMatrix = LIBS.get_I4();
        LIBS.translateY(groundMatrix, this.groundLevel);
        LIBS.rotateX(groundMatrix, -Math.PI / 2); 
        
        this.addObject(groundGeo.vertices, groundGeo.indices, groundMatrix, false);

        const minSpawnRadius = 8.0; 
        const maxSpawnRadius = radius * 0.9;

        //Rocks
        const rockCount = 8;
        for(let i=0; i<rockCount; i++) {
            const pos = this.getRandomPosition(minSpawnRadius, maxSpawnRadius);
            const scale = 2.0 + Math.random() * 2.0;
            
            const rockGeo = this.generateRock(scale, rockColor);
            const rockMatrix = LIBS.get_I4();
            LIBS.translate(rockMatrix, pos.x, 0, pos.z);
            LIBS.rotateY(rockMatrix, Math.random() * Math.PI);
            
            this.addObject(rockGeo.vertices, rockGeo.indices, rockMatrix, false);
        }

        //Grass
        const grassCount = 4;
        for(let i=0; i<grassCount; i++) {
            const pos = this.getRandomPosition(minSpawnRadius, maxSpawnRadius);
            
            const variantColor = [
                grassColor[0] + (Math.random()-0.5)*0.1,
                grassColor[1] + (Math.random()-0.5)*0.1,
                grassColor[2] + (Math.random()-0.5)*0.1
            ];

            const grassGeo = this.generateGrassTuft(1.5, 4.5, variantColor);
            
            const grassBaseMatrix = LIBS.get_I4();
            LIBS.translate(grassBaseMatrix, pos.x, 0, pos.z);
            LIBS.rotateY(grassBaseMatrix, Math.random() * Math.PI * 2);

            this.addObject(grassGeo.vertices, grassGeo.indices, grassBaseMatrix, true);
        }
    }

    getRandomPosition(minR, maxR) {
        const angle = Math.random() * Math.PI * 2;
        const r = Math.sqrt(Math.random() * (maxR**2 - minR**2) + minR**2); 
        return {
            x: r * Math.cos(angle),
            z: r * Math.sin(angle)
        };
    }

    addObject(vertices, indices, localMatrix, isAnimated = false) {
        this.OBJECTS.push({ 
            vertices, 
            indices, 
            localMatrix, 
            baseMatrix: isAnimated ? LIBS.clone(localMatrix) : null,
            isAnimated: isAnimated,
            animationOffset: Math.random() * 10,
            vertexBuffer: null, 
            indexBuffer: null 
        });
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

    animate(time) {
        this.OBJECTS.forEach(obj => {
            if (obj.isAnimated) {
                const M = LIBS.clone(obj.baseMatrix);
                const swayAngle = Math.sin(time * 2.0 + obj.animationOffset) * 0.15;
                LIBS.rotateZ(M, swayAngle);
                obj.localMatrix = M;
            }
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

    generateCircle(radius, segments, color) {
        const vertices = [];
        const indices = [];
        vertices.push(0, 0, 0, ...color); 
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

    generateRock(radius, color) {
        const vertices = [];
        const indices = [];
        const stacks = 5;
        const slices = 8; 
        for (let i = 0; i <= stacks; i++) {
            const lat = (i / stacks) * (Math.PI / 2); 
            const y = (radius * 0.6) * Math.sin(lat);
            const r = radius * Math.cos(lat);
            for (let j = 0; j <= slices; j++) {
                const lon = (j / slices) * Math.PI * 2;
                const noise = 0.9 + Math.random() * 0.2; 
                const x = r * Math.cos(lon) * noise;
                const z = r * Math.sin(lon) * noise;
                vertices.push(x, y, z, ...color);
            }
        }
        for (let i = 0; i < stacks; i++) {
            for (let j = 0; j < slices; j++) {
                const first = i * (slices + 1) + j;
                const second = first + slices + 1;
                indices.push(first, second, first + 1);
                indices.push(second, second + 1, first + 1);
            }
        }
        return { vertices, indices };
    }

    generateGrassTuft(width, height, color) {
        const vertices = [];
        const indices = [];
        const darkColor = [color[0]*0.5, color[1]*0.5, color[2]*0.5];
        const blades = 3;
        for(let i=0; i<blades; i++) {
            const angle = (i / blades) * Math.PI;
            const c = Math.cos(angle);
            const s = Math.sin(angle);
            vertices.push(-width * c, 0, -width * s, ...darkColor);
            vertices.push(width * c, 0, width * s, ...darkColor);
            vertices.push(0, height, 0, ...color);
            const offset = i * 3;
            indices.push(offset, offset + 1, offset + 2);
            indices.push(offset + 2, offset + 1, offset); 
        }
        return { vertices, indices };
    }
}