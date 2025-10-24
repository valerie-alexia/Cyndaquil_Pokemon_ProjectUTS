export class BodyShape {
    GL = null;
    SHADER_PROGRAM = null;
    _position = null;
    _color = null;
    _MMatrix = null;
    OBJECTS = [];
    FLAME_OBJECTS = [];
    POSITION_MATRIX = LIBS.get_I4();
    MOVE_MATRIX = LIBS.get_I4();
    childs = [];

    // State animasi
    animationState = "STANDING"; // "STANDING", "TO_CRAWL", "CRAWLING", "TO_STAND"
    animationProgress = 0.0;     // 0.0 sampai 1.0 
    animationDuration = 1.5;     
    animationStartTime = 0.0;
    isAnimating = false;
    needsToToggleState = false;
    standRotX = 0.0;
    standPosY = 0.0;
    standPosZ = 0.0;
    crawlRotX = Math.PI / 2.5; 
    crawlPosY = -3;        
    crawlPosZ = 4.5;
    standOuterColor = [1.0, 0.6, 0.1]; // Orange
    crawlOuterColor = [1.0, 0.3, 0.0]; // Merah
    standInnerColor = [1.0, 0.9, 0.2]; // Kuning
    crawlInnerColor = [1.0, 0.6, 0.1]; // Orange
    _tempFlameVertices = [];

    constructor(GL, SHADER_PROGRAM, _position, _color, _MMatrix) {
        this.GL = GL;
        this.SHADER_PROGRAM = SHADER_PROGRAM;
        this._position = _position;
        this._color = _color;
        this._MMatrix = _MMatrix;

        // Body Main Object
        const generated = this.generateHyper1d(1, 4, 1, 200, 200, 0.14);
        this.addObject(generated.vertices, generated.faces, LIBS.get_I4());
            var minY = Infinity;
        for (var vi = 1; vi < generated.vertices.length; vi += 6) {
        if (generated.vertices[vi] < minY) minY = generated.vertices[vi];
        }

        // Body bagian bawah (sphere)
        var sphereL = this.generateSphere(1.4, 1.2, 1.5, 24, 20);
        var sphereR = this.generateSphere(1.4, 1.2, 1.5, 24, 20);
        var yOffset = minY - 0.5; 
        const sphereLMatrix = this.createTransformMatrixLIBS({
        translation: [-0.1, yOffset, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
        });
        this.addObject(sphereL.vertices, sphereL.faces, sphereLMatrix);
        const sphereRMatrix = this.createTransformMatrixLIBS({
        translation: [0.1, yOffset, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
        });
        this.addObject(sphereR.vertices, sphereR.faces, sphereRMatrix);

        // BODY FLAMES ------------------------------------------------
        const triangleGeo = this.createTrianglePositions();
        const baseRotationY = 0.0;
        const rotationFlip = Math.PI; 
        const baseRotationX = -0.7;
        const flameSpikes = [
            { t: [0.0, -2.3, -2], r: [baseRotationX, baseRotationY, rotationFlip], s: [1, 2, 1] },
            { t: [1.5, -2.6, -1.7], r: [baseRotationX, baseRotationY, -0.6 + rotationFlip], s: [1, 1.5, 1] },
            { t: [-1.5, -2.6, -1.7], r: [baseRotationX, baseRotationY, 0.6 + rotationFlip], s: [1, 1.5, 1] },
            { t: [2, -3.3, -1], r: [baseRotationX, baseRotationY, -0.8 + rotationFlip], s: [0.4, 1.2, 1] },
            { t: [-2, -3.3, -1], r: [baseRotationX, baseRotationY, 0.8 + rotationFlip], s: [0.4, 1.2, 1] },
            { t: [0.7, -2.3, -2], r: [baseRotationX, baseRotationY, -0.3 + rotationFlip], s: [0.3, 1, 1] }, 
            { t: [-0.7, -2.3, -2], r: [baseRotationX, baseRotationY, 0.3 + rotationFlip], s: [0.3, 1, 1] }
        ];
        flameSpikes.forEach((spike) => {
            const outerTranslation = [spike.t[0], spike.t[1], spike.t[2] - 0.01];
            const outerRotation = spike.r;
            const outerScale = spike.s;
            this.FLAME_OBJECTS.push({
                positions: triangleGeo.positions,
                indices: triangleGeo.indices,
                colorType: 'outer',
                localMatrix: this.createTransformMatrixLIBS({
                    translation: outerTranslation, rotation: outerRotation, scale: outerScale
                }),
                baseTranslation: outerTranslation,
                baseRotation: outerRotation,
                baseScale: outerScale
            });
            const innerRightTranslation = [spike.t[0], spike.t[1], spike.t[2] + 0.01];
            const innerRightRotation = spike.r;
            const innerRightScale = [spike.s[0] * 0.7, spike.s[1] * 0.7, spike.s[2]];
            this.FLAME_OBJECTS.push({
                positions: triangleGeo.positions,
                indices: triangleGeo.indices,
                colorType: 'inner',
                localMatrix: this.createTransformMatrixLIBS({
                    translation: innerRightTranslation, rotation: innerRightRotation, scale: innerRightScale
                }),
                baseTranslation: innerRightTranslation,
                baseRotation: innerRightRotation,
                baseScale: innerRightScale
            });
            const innerLeftTranslation = [spike.t[0] - 0.01, spike.t[1], spike.t[2] + 0.01];
            const innerLeftRotation = spike.r;
            const innerLeftScale = [spike.s[0] * 0.7, spike.s[1] * 0.7, spike.s[2]];
            this.FLAME_OBJECTS.push({
                positions: triangleGeo.positions,
                indices: triangleGeo.indices,
                colorType: 'inner',
                localMatrix: this.createTransformMatrixLIBS({
                translation: innerLeftTranslation, rotation: innerLeftRotation, scale: innerLeftScale
                }),
                baseTranslation: innerLeftTranslation,
                baseRotation: innerLeftRotation,
                baseScale: innerLeftScale
            });
        });
        this.MOVE_MATRIX = LIBS.get_I4();
    }

    // SETUP ------------------------------------------------
    setup() {
        this.OBJECTS.forEach((obj) => {
            obj.vertexBuffer = this.GL.createBuffer();
            this.GL.bindBuffer(this.GL.ARRAY_BUFFER, obj.vertexBuffer);
            this.GL.bufferData(
                this.GL.ARRAY_BUFFER,
                new Float32Array(obj.vertices),
                this.GL.STATIC_DRAW
            );

            obj.indexBuffer = this.GL.createBuffer();
            this.GL.bindBuffer(this.GL.ELEMENT_ARRAY_BUFFER, obj.indexBuffer);
            this.GL.bufferData(
                this.GL.ELEMENT_ARRAY_BUFFER,
                new Uint16Array(obj.indices),
                this.GL.STATIC_DRAW
            );
        });
        this.FLAME_OBJECTS.forEach((obj) => {
            obj.vertexBuffer = this.GL.createBuffer();
            this.GL.bindBuffer(this.GL.ARRAY_BUFFER, obj.vertexBuffer);
            const initialColor = (obj.colorType === 'outer') ? this.standOuterColor : this.standInnerColor;
            const initialVertices = [];
            for (let i = 0; i < obj.positions.length; i += 3) {
                initialVertices.push(obj.positions[i], obj.positions[i+1], obj.positions[i+2]);
                initialVertices.push(...initialColor);
            }
            
            this.GL.bufferData(
                this.GL.ARRAY_BUFFER,
                new Float32Array(initialVertices),
                this.GL.DYNAMIC_DRAW
            );
            obj.indexBuffer = this.GL.createBuffer();
            this.GL.bindBuffer(this.GL.ELEMENT_ARRAY_BUFFER, obj.indexBuffer);
            this.GL.bufferData(this.GL.ELEMENT_ARRAY_BUFFER, new Uint16Array(obj.indices), this.GL.STATIC_DRAW);
        });
        this.childs.forEach((child) => child.setup());
    }

    // RENDER ------------------------------------------------
    render(PARENT_MATRIX) {
        const LOCAL_BODY_TRANSFORM = LIBS.multiply(this.POSITION_MATRIX, this.MOVE_MATRIX);
        const MODEL_MATRIX = LIBS.multiply(LOCAL_BODY_TRANSFORM, PARENT_MATRIX);
        this.OBJECTS.forEach((obj) => {
            let M = MODEL_MATRIX;
            if (obj.localMatrix) {
                 M = LIBS.multiply(obj.localMatrix, MODEL_MATRIX);
            }
            this.GL.useProgram(this.SHADER_PROGRAM);
            this.GL.uniformMatrix4fv(this._MMatrix, false, M);
            this.GL.bindBuffer(this.GL.ARRAY_BUFFER, obj.vertexBuffer);
            this.GL.vertexAttribPointer(this._position, 3, this.GL.FLOAT, false, 24, 0);
            this.GL.vertexAttribPointer(this._color, 3, this.GL.FLOAT, false, 24, 12);
            this.GL.bindBuffer(this.GL.ELEMENT_ARRAY_BUFFER, obj.indexBuffer);
            this.GL.drawElements(
                this.GL.TRIANGLES,
                obj.indices.length,
                this.GL.UNSIGNED_SHORT,
                0
            );
        });
        
        this.FLAME_OBJECTS.forEach((obj) => {
            let M = LIBS.multiply(obj.localMatrix, MODEL_MATRIX);
            this.GL.useProgram(this.SHADER_PROGRAM);
            this.GL.uniformMatrix4fv(this._MMatrix, false, M);
            this.GL.bindBuffer(this.GL.ARRAY_BUFFER, obj.vertexBuffer);
            this.GL.vertexAttribPointer(this._position, 3, this.GL.FLOAT, false, 24, 0);
            this.GL.vertexAttribPointer(this._color, 3, this.GL.FLOAT, false, 24, 12);
            this.GL.bindBuffer(this.GL.ELEMENT_ARRAY_BUFFER, obj.indexBuffer);
            this.GL.drawElements(
                this.GL.TRIANGLES,
                obj.indices.length,
                this.GL.UNSIGNED_SHORT,
                0
            );
        });
        this.childs.forEach((child) => child.render(MODEL_MATRIX));
    } 

    // ANIMATION ------------------------------------------------
    animate(time) {
        // 0. Cek bendera transisi ---
        if (this.needsToToggleState) {
            this.isAnimating = true;
            this.animationStartTime = time; 
            this.animationProgress = 0.0;
            if (this.animationState === "STANDING") {
                this.animationState = "TO_CRAWL";
            } else if (this.animationState === "CRAWLING") {
                this.animationState = "TO_STAND";
            }
            this.needsToToggleState = false; 
        }
        
        // 1. Animasi Api  ---
        const flickerSpeed = 6.0;  // Kecepatan kedipan
        const flickerAmount = 0.2; // Intensitas kedipan
        this.FLAME_OBJECTS.forEach((obj, i) => {
            // Nilai 0 sampai 1
            const actualFlicker = 0.5 + 0.5 * Math.sin(time * flickerSpeed + i * 0.5);
            const animatedScaleY = obj.baseScale[1] * (1.0 + actualFlicker * flickerAmount); 
            const animatedScale = [obj.baseScale[0], animatedScaleY, obj.baseScale[2]];
            obj.localMatrix = this.createTransformMatrixLIBS({
                translation: obj.baseTranslation,
                rotation: obj.baseRotation,
                scale: animatedScale,  
            });    
        });

        // 2. Animasi Bernapas  ---
        const breathSpeed = 3; 
        const moveAmount = 0.05;
        const breathFactor = Math.sin(time * breathSpeed); 
        const moveY_breath = breathFactor * moveAmount;

        // 3. Animasi Transisi Berdiri/Merangkak ---
        let crawlAmount = 0.0; // 0.0 = berdiri, 1.0 = merangkak
        if (this.isAnimating) {
            const elapsedTime = time - this.animationStartTime;
            this.animationProgress = Math.min(elapsedTime / this.animationDuration, 1.0);
            if (this.animationProgress >= 1.0) { // transisi selesai
                this.isAnimating = false;
                if (this.animationState === "TO_CRAWL") {
                    this.animationState = "CRAWLING";
                    crawlAmount = 1.0;
                } else if (this.animationState === "TO_STAND") {
                    this.animationState = "STANDING";
                    crawlAmount = 0.0;
                }
            } else { // Sedang dalam transisi
                if (this.animationState === "TO_CRAWL") {
                    crawlAmount = this.animationProgress; // 0 -> 1
                } else if (this.animationState === "TO_STAND") {
                    crawlAmount = 1.0 - this.animationProgress; // 1 -> 0
                }
            }
        } else { // Tidak sedang animasi, tahan pose saat ini
            if (this.animationState === "CRAWLING") {
                crawlAmount = 1.0;
            } else { // STANDING
                crawlAmount = 0.0;
            }
        }

        // 4. Hitung Nilai Interpolasi ---
        const t = crawlAmount * crawlAmount * (3 - 2 * crawlAmount);
        const currentRotationX = this._lerp(this.standRotX, this.crawlRotX, t);
        const currentPositionY = this._lerp(this.standPosY, this.crawlPosY, t);
        const currentPositionZ = this._lerp(this.standPosZ, this.crawlPosZ, t);

        // 1. MODIFIKASI: Animasi Api ---
        const standFlickerSpeed = 6.0;  // Kecepatan normal
        const crawlFlickerSpeed = 20.0; // Kecepatan tinggi
        const standFlickerAmount = 0.2; // Intensitas normal
        const crawlFlickerAmount = 0.5; // Intensitas lebih besar 
        const currentFlickerSpeed = this._lerp(standFlickerSpeed, crawlFlickerSpeed, crawlAmount);
        const currentFlickerAmount = this._lerp(standFlickerAmount, crawlFlickerAmount, crawlAmount); 
        const currentOuterColor = this._lerpColor(this.standOuterColor, this.crawlOuterColor, crawlAmount);
        const currentInnerColor = this._lerpColor(this.standInnerColor, this.crawlInnerColor, crawlAmount);
        
        this.FLAME_OBJECTS.forEach((obj, i) => {
            // A. Update Animasi Flicker (Skala) ---
            const actualFlicker = 0.5 + 0.5 * Math.sin(time * currentFlickerSpeed + i * 0.5); 
            const animatedScaleY = obj.baseScale[1] * (1.0 + actualFlicker * currentFlickerAmount); 
            const animatedScale = [obj.baseScale[0], animatedScaleY, obj.baseScale[2]];
            obj.localMatrix = this.createTransformMatrixLIBS({
                translation: obj.baseTranslation,
                rotation: obj.baseRotation,
                scale: animatedScale,
                }); 

            // B. Update Warna Api ---
            this._tempFlameVertices.length = 0; // Kosongkan array
            const colorToUse = (obj.colorType === 'outer') ? currentOuterColor : currentInnerColor;
            for (let v = 0; v < obj.positions.length; v += 3) {
                this._tempFlameVertices.push(obj.positions[v], obj.positions[v+1], obj.positions[v+2]);
                this._tempFlameVertices.push(...colorToUse);
            }
            this.GL.bindBuffer(this.GL.ARRAY_BUFFER, obj.vertexBuffer);
            this.GL.bufferSubData(this.GL.ARRAY_BUFFER, 0, new Float32Array(this._tempFlameVertices));
        });

        // --- 5. SEMUA Transformasi ke MOVE_MATRIX ---
        LIBS.set_I4(this.MOVE_MATRIX); 
        LIBS.translateY(this.MOVE_MATRIX, moveY_breath); // bernapas y
        LIBS.translateY(this.MOVE_MATRIX, currentPositionY); // turun badan
        LIBS.translateZ(this.MOVE_MATRIX, currentPositionZ); // majuk badan
        LIBS.rotateX(this.MOVE_MATRIX, currentRotationX); // rotasi badan
    }

    // FUNCTIONS ------------------------------------------------
    // interpolasi linear
    _lerp(a, b, t) {
        return a + (b - a) * t;
    }
    _lerpColor(colorA, colorB, t) {
        const r = this._lerp(colorA[0], colorB[0], t);
        const g = this._lerp(colorA[1], colorB[1], t);
        const b = this._lerp(colorA[2], colorB[2], t);
        return [r, g, b];
    }
    toggleCrawlState() {
        if (this.isAnimating) return; 
        this.needsToToggleState = true;
    }
    addObject(vertices, indices, localMatrix = null) {
        if (localMatrix === null) localMatrix = LIBS.get_I4();
        this.OBJECTS.push({ vertices, indices, localMatrix });
    }
    createTransformMatrixLIBS({ translation, rotation, scale }) {
        // ... (Fungsi createTransformMatrixLIBS() Anda tidak berubah) ...
        const matrix = LIBS.get_I4();
        LIBS.scaleX(matrix, scale[0]);
        LIBS.scaleY(matrix, scale[1]);
        LIBS.scaleZ(matrix, scale[2]);
        LIBS.rotateZ(matrix, rotation[2]);
        LIBS.rotateY(matrix, rotation[1]);
        LIBS.rotateX(matrix, rotation[0]);
        LIBS.translateX(matrix, translation[0]);
        LIBS.translateY(matrix, translation[1]);
        LIBS.translateZ(matrix, translation[2]);
        return matrix;
    }
    
    generateSphere(a, b, c, stack, step) { // dipakai untuk badan bawah
        var vertices = [];
        var faces = [];
        for (var i = 0; i <= stack; i++) {
            var u = i / stack * Math.PI - (Math.PI / 2); // Latitude
            for (var j = 0; j <= step; j++) {
                var v = j / step * 2 * Math.PI - Math.PI; // Longitude
                var x = a * Math.cos(v) * Math.cos(u);
                var y = b * Math.sin(u);
                var z = c * Math.sin(v) * Math.cos(u);
                let r, g, bcol;
                if (z >= 0) {
                    r = 1 + y * 0.002;
                    g = 0.94 + y * 0.002;
                    bcol = 0.76 + y * 0.002; // cream
                } else {
                    r = 0.22; g = 0.36; bcol = 0.49; 
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

    generateHyper1d(a, b, c, stack, step, uBottomTrimRatio = 0) { // dipakai untuk badan utama
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
                var neckScale = 1.0 - 0.09 * (neckRegion * neckRegion);
                x *= neckScale;
                z *= neckScale;
                let r, g, bcol;
                if (z >= 0) {
                    r = 0.98 + y * 0.002;
                    g = 0.94 + y * 0.002;
                    bcol = 0.76 + y * 0.002;
                } else {
                    r = 0.22; g = 0.36; bcol = 0.49;
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

    createTrianglePositions() { // dipakai untuk body flames
        const v = [
            // x,   y,   z
            -1.0, 1.0, 0.0, 
             1.0, 1.0, 0.0, 
             0.0, -1.0, 0.0 
        ];
        return { positions: v, indices: [0, 1, 2] };
    }
}