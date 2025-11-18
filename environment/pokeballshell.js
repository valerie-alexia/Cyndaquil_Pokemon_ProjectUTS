// environment/pokeballshell.js
import { LIBS } from './libs.js'; 
export class PokeballShell {
    GL = null; SHADER_PROGRAM = null; _position = null; _color = null; _MMatrix = null;
    
    topHalf = null;
    staticParts = []; 

    radius = 15.0;
    bandHeight = 0;

    constructor(GL, SHADER_PROGRAM, _position, _color, _MMatrix) {
        this.GL = GL;
        this.SHADER_PROGRAM = SHADER_PROGRAM;
        this._position = _position;
        this._color = _color;
        this._MMatrix = _MMatrix;

        this.radius = 15.0;
        this.bandHeight = this.radius * 0.15;

        const buttonOuterRadius = this.radius * 0.25;
        const buttonInnerRadius = this.radius * 0.18;
        const buttonDetailRadius = this.radius * 0.08;
        const buttonDepth = this.bandHeight * 1.3;

        const redColor = [0.8, 0.1, 0.1];
        const whiteColor = [0.95, 0.95, 0.95];
        const blackColor = [0.1, 0.1, 0.1];
        const grayColor = [0.6, 0.6, 0.6];

        // --- Geometry Generation ---
        const topHalfGeo = this.generateHemisphere(this.radius, 32, 32, false, redColor);
        const topMatrix = LIBS.get_I4();
        LIBS.translateY(topMatrix, this.bandHeight / 2);
        this.topHalf = this.createBufferObject(topHalfGeo.vertices, topHalfGeo.indices, topMatrix);

        const bottomHalfGeo = this.generateHemisphere(this.radius, 32, 32, true, whiteColor);
        const bottomMatrix = LIBS.get_I4();
        LIBS.translateY(bottomMatrix, -this.bandHeight / 2);
        this.staticParts.push(this.createBufferObject(bottomHalfGeo.vertices, bottomHalfGeo.indices, bottomMatrix));

        const bandGeo = this.generateCylinder(this.radius, this.radius, this.bandHeight, 32, 1, blackColor);
        const bandMatrix = LIBS.get_I4();
        this.staticParts.push(this.createBufferObject(bandGeo.vertices, bandGeo.indices, bandMatrix));

        //Button Parts
        const rotationAngle = Math.PI / 2; 

        //Button Base (black)
        const buttonBaseGeo = this.generateClosedCylinder(buttonOuterRadius, buttonOuterRadius, buttonDepth, 32, blackColor);
        const buttonBaseMatrix = LIBS.get_I4();
        LIBS.translateZ(buttonBaseMatrix, this.radius);
        LIBS.rotateX(buttonBaseMatrix, rotationAngle);
        this.staticParts.push(this.createBufferObject(buttonBaseGeo.vertices, buttonBaseGeo.indices, buttonBaseMatrix));

        //Button Top (white)
        const buttonTopGeo = this.generateClosedCylinder(buttonInnerRadius, buttonInnerRadius, buttonDepth, 32, whiteColor);
        const buttonTopMatrix = LIBS.get_I4();
        LIBS.translateZ(buttonTopMatrix, this.radius + 0.15); 
        LIBS.rotateX(buttonTopMatrix, rotationAngle);
        this.staticParts.push(this.createBufferObject(buttonTopGeo.vertices, buttonTopGeo.indices, buttonTopMatrix));
    }

    createBufferObject(vertices, indices, localMatrix) {
        return { vertices, indices, localMatrix, vertexBuffer: null, indexBuffer: null };
    }

    setup() {
        const setupObj = (obj) => {
            obj.vertexBuffer = this.GL.createBuffer();
            this.GL.bindBuffer(this.GL.ARRAY_BUFFER, obj.vertexBuffer);
            this.GL.bufferData(this.GL.ARRAY_BUFFER, new Float32Array(obj.vertices), this.GL.STATIC_DRAW);

            obj.indexBuffer = this.GL.createBuffer();
            this.GL.bindBuffer(this.GL.ELEMENT_ARRAY_BUFFER, obj.indexBuffer);
            this.GL.bufferData(this.GL.ELEMENT_ARRAY_BUFFER, new Uint16Array(obj.indices), this.GL.STATIC_DRAW);
        };

        setupObj(this.topHalf);
        this.staticParts.forEach(setupObj);
    }

    render(PARENT_MATRIX, openAngle) {
        this.staticParts.forEach(obj => {
            const M = LIBS.multiply(PARENT_MATRIX, obj.localMatrix);
            this.GL.uniformMatrix4fv(this._MMatrix, false, M);
            this.bindAndDraw(obj);
        });

        this.GL.disable(this.GL.CULL_FACE);

        const pivotX = 0;
        const pivotY = this.bandHeight / 2;
        const pivotZ = this.radius; 

        const M_local_closed = this.topHalf.localMatrix;

        let M_pivot_inv = LIBS.translate(-pivotX, -pivotY, -pivotZ);
        let M_rot = LIBS.get_I4();
        LIBS.rotateX(M_rot, -openAngle);
        let M_pivot = LIBS.translate(pivotX, pivotY, pivotZ);

        let M_anim = LIBS.get_I4();
        M_anim = LIBS.multiply(M_pivot, M_rot);
        M_anim = LIBS.multiply(M_anim, M_pivot_inv);
        M_anim = LIBS.multiply(M_anim, M_local_closed);

        const M_final = LIBS.multiply(PARENT_MATRIX, M_anim);
        this.GL.uniformMatrix4fv(this._MMatrix, false, M_final);
        this.bindAndDraw(this.topHalf);

        this.GL.enable(this.GL.CULL_FACE);
    }

    bindAndDraw(obj) {
        this.GL.bindBuffer(this.GL.ARRAY_BUFFER, obj.vertexBuffer);
        this.GL.vertexAttribPointer(this._position, 3, this.GL.FLOAT, false, 24, 0);
        this.GL.vertexAttribPointer(this._color, 3, this.GL.FLOAT, false, 24, 12);
        this.GL.bindBuffer(this.GL.ELEMENT_ARRAY_BUFFER, obj.indexBuffer);
        this.GL.drawElements(this.GL.TRIANGLES, obj.indices.length, this.GL.UNSIGNED_SHORT, 0);
    }

    // ======== GEOMETRY GENERATORS ========

    generateHemisphere(radius, stacks, slices, isBottom, color) {
        const vertices = [];
        const indices = [];
        const latStart = isBottom ? -Math.PI / 2 : 0;
        const latEnd = isBottom ? 0 : Math.PI / 2;

        for (let i = 0; i <= stacks; i++) {
            const latAngle = latStart + (latEnd - latStart) * (i / stacks);
            const xy = radius * Math.cos(latAngle);
            const y = radius * Math.sin(latAngle);

            for (let j = 0; j <= slices; j++) {
                const longAngle = (j / slices) * 2 * Math.PI;
                const x = xy * Math.cos(longAngle);
                const z = xy * Math.sin(longAngle);
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

    generateCylinder(topRadius, bottomRadius, height, radialSubdiv, heightSubdiv, color) {
        const vertices = [];
        const indices = [];

        for (let y = 0; y <= heightSubdiv; y++) {
            const currY = -height / 2 + (y / heightSubdiv) * height;
            const radius = bottomRadius + (y / heightSubdiv) * (topRadius - bottomRadius);
            for (let i = 0; i <= radialSubdiv; i++) {
                const theta = (i / radialSubdiv) * 2 * Math.PI;
                const x = radius * Math.cos(theta);
                const z = radius * Math.sin(theta);
                vertices.push(x, currY, z, ...color);
            }
        }

        for (let y = 0; y < heightSubdiv; y++) {
            for (let i = 0; i < radialSubdiv; i++) {
                const first = y * (radialSubdiv + 1) + i;
                const second = first + radialSubdiv + 1;
                indices.push(first, second, first + 1);
                indices.push(second, second + 1, first + 1);
            }
        }

        return { vertices, indices };
    }
    
    generateClosedCylinder(topRadius, bottomRadius, height, segments, color) {
        const vertices = [];
        const indices = [];
        vertices.push(0, height / 2, 0, ...color); 
        for (let i = 0; i <= segments; i++) {
            const angle = (i / segments) * 2 * Math.PI;
            const x = topRadius * Math.cos(angle);
            const z = topRadius * Math.sin(angle);
            vertices.push(x, height / 2, z, ...color);
        }
        const bottomCenterIndex = vertices.length / 6; 
        vertices.push(0, -height / 2, 0, ...color);
        for (let i = 0; i <= segments; i++) {
            const angle = (i / segments) * 2 * Math.PI;
            const x = bottomRadius * Math.cos(angle);
            const z = bottomRadius * Math.sin(angle);
            vertices.push(x, -height / 2, z, ...color);
        }
        for (let i = 1; i <= segments; i++) {
            indices.push(0, i, i + 1);
        }
        const startBottom = bottomCenterIndex + 1;
        for (let i = 0; i < segments; i++) {
            indices.push(bottomCenterIndex, startBottom + i + 1, startBottom + i);
        }
        for (let i = 0; i < segments; i++) {
            const top1 = 1 + i;
            const top2 = 1 + i + 1;
            const bot1 = startBottom + i;
            const bot2 = startBottom + i + 1;
            indices.push(top1, bot1, top2);
            indices.push(bot1, bot2, top2);
        }

        return { vertices, indices };
    }
}
