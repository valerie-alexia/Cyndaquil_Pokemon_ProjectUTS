export class BodyShape {
   constructor(GL, SHADER_PROGRAM, _position, _color, _Mmatrix) {
       this.GL = GL;
       this.SHADER_PROGRAM = SHADER_PROGRAM;
       this._position = _position;
       this._color = _color;
       this._Mmatrix = _Mmatrix;


       this.childs = [];
       this.POSITION_MATRIX = this.identityMatrix();


       this.vertices = [];
       this.colors = [];
       this.normals = [];
       this.indices = [];


       this.buildCapsuleBody();
       this.initBuffers();


       const translateDown = this.translateMatrix(0.3, -3.0, 0.0);
       const rotateZ = this.rotateZMatrix(-25 * Math.PI / 180);   
       this.POSITION_MATRIX = this.multiplyMatrix(translateDown, rotateZ);
   }


   buildCapsuleBody() {
       const segmentsAround = 40;
       const segmentsY = 24;
       const radius = 2.5;  
       const height = 5.5;  
       const centerY = 0.0;


       const colorTop = [0.0, 0.32, 0.35];
       const BASE_CREAM_COLOR = [0.98, 0.92, 0.75];
       const DARKENING_FACTOR = 0.85;


       const colorBottomBase = [
           BASE_CREAM_COLOR[0] * DARKENING_FACTOR,
           BASE_CREAM_COLOR[1] * DARKENING_FACTOR,
           BASE_CREAM_COLOR[2] * DARKENING_FACTOR
       ];
      
       for (let iy = 0; iy <= segmentsY; iy++) {
           const v = iy / segmentsY;
           const y = centerY + (v - 0.5) * height;
           const taper = 1.0 - 0.3 * Math.pow(v - 0.5, 2) * 4;
           const r = radius * taper;


           for (let ix = 0; ix <= 40; ix++) {
               const u = ix / 40;
               let theta = u * Math.PI * 2;
              
               if (theta > Math.PI * 2) theta -= Math.PI * 2;
              
               const x = Math.cos(theta) * r;
               const z = Math.sin(theta) * r;


               this.vertices.push(x, y, z);
              
               const nx = Math.cos(theta);
               const nz = Math.sin(theta);
               this.normals.push(nx, 0.0, nz);


               let angleDeg = theta * 180 / Math.PI;
              
               const BACK_LIMIT_START = 90;
               const BACK_LIMIT_END = 270;
              
               let mixFactor = 0.0;
              
               if (angleDeg > BACK_LIMIT_START && angleDeg < BACK_LIMIT_END) {
                   mixFactor = 1.0;
               }
              
               if (v < 0.2) {
                   mixFactor = 0.0;
               } else if (v < 0.4 && mixFactor > 0.5) {
                   const t = (v - 0.2) / 0.2;
                   mixFactor *= t;
               }


               const c = [
                   colorTop[0] * mixFactor + colorBottomBase[0] * (1 - mixFactor),
                   colorTop[1] * mixFactor + colorBottomBase[1] * (1 - mixFactor),
                   colorTop[2] * mixFactor + colorBottomBase[2] * (1 - mixFactor)
               ];
               this.colors.push(...c);
           }
       }


       for (let iy = 0; iy < segmentsY; iy++) {
           for (let ix = 0; ix < 40; ix++) {
               const a = iy * (41) + ix;
               const b = a + 41;
               const c = b + 1;
               const d = a + 1;
               this.indices.push(a, b, d);
               this.indices.push(b, c, d);
           }
       }


       const startIndexBottom = 0;
       const yBottomCenter = this.vertices[1];


       let centerIndex = this.vertices.length / 3;


       this.vertices.push(0.0, yBottomCenter, 0.0);
       this.colors.push(...colorBottomBase);
       this.normals.push(0.0, -1.0, 0.0);


       for (let i = 0; i < 40; i++) {
           const p1 = startIndexBottom + i;
           const p2 = startIndexBottom + i + 1;
           const p3 = centerIndex;


           this.indices.push(p1, p2, p3);
       }


       const startIndexTop = segmentsY * (segmentsAround + 1);


       const yTopCenter = this.vertices[startIndexTop * 3 + 1];
      
       centerIndex = this.vertices.length / 3;
       this.vertices.push(0.0, yTopCenter, 0.0);


       this.colors.push(...colorTop);
       this.normals.push(0.0, 1.0, 0.0);
      
       for (let i = 0; i < segmentsAround; i++) {
           const p1 = startIndexTop + i;
           const p2 = startIndexTop + i + 1;
           const p3 = centerIndex;


           this.indices.push(p2, p1, p3);
       }
   }


   initBuffers() {
       const GL = this.GL;
        const interleaved = [];
       const numVertices = this.vertices.length / 3;
       for (let i = 0; i < numVertices; i++) {
           interleaved.push(this.vertices[i * 3 + 0], this.vertices[i * 3 + 1], this.vertices[i * 3 + 2]); // Pos (0-11)
           interleaved.push(this.normals[i * 3 + 0], this.normals[i * 3 + 1], this.normals[i * 3 + 2]); // Normal (12-23)
           interleaved.push(this.colors[i * 3 + 0], this.colors[i * 3 + 1], this.colors[i * 3 + 2]); // Color (24-35)
       }
       const STRIDE = 36;


       this.vertexBuffer = GL.createBuffer();
       GL.bindBuffer(GL.ARRAY_BUFFER, this.vertexBuffer);
       GL.bufferData(GL.ARRAY_BUFFER, new Float32Array(interleaved), GL.STATIC_DRAW);


       this.indexBuffer = GL.createBuffer();
       GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
       GL.bufferData(GL.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.indices), GL.STATIC_DRAW);


       this.nPoints = this.indices.length;
   }


   identityMatrix() {
       return new Float32Array([
           1,0,0,0,
           0,1,0,0,
           0,0,1,0,
           0,0,0,1
       ]);
   }


   multiplyMatrix(a, b) {
       const r = new Float32Array(16);
       for (let i = 0; i < 4; i++) {
           for (let j = 0; j < 4; j++) {
               r[i * 4 + j] =
                   a[i * 4 + 0] * b[0 * 4 + j] +
                   a[i * 4 + 1] * b[1 * 4 + j] +
                   a[i * 4 + 2] * b[2 * 4 + j] +
                   a[i * 4 + 3] * b[3 * 4 + j];
           }
       }
       return r;
   }


   translateMatrix(x, y, z) {
       return new Float32Array([
           1,0,0,0,
           0,1,0,0,
           0,0,1,0,
           x,y,z,1
       ]);
   }


   rotateZMatrix(angle) {
       const c = Math.cos(angle);
       const s = Math.sin(angle);
       return new Float32Array([
           c, s, 0, 0,
          -s, c, 0, 0,
           0, 0, 1, 0,
           0, 0, 0, 1
       ]);
   }


   setup() {
       for (let child of this.childs) {
           child.setup?.();
       }
   }


   render(parentMatrix) {
       const GL = this.GL;
       const localMatrix = this.multiplyMatrix(parentMatrix, this.POSITION_MATRIX);
       GL.uniformMatrix4fv(this._Mmatrix, false, localMatrix);
      
       const STRIDE = 36;


       GL.bindBuffer(GL.ARRAY_BUFFER, this.vertexBuffer);
       GL.vertexAttribPointer(this._position, 3, GL.FLOAT, false, STRIDE, 0);
       GL.vertexAttribPointer(this._color, 3, GL.FLOAT, false, STRIDE, 24);


       GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
       GL.drawElements(GL.TRIANGLES, this.nPoints, GL.UNSIGNED_SHORT, 0);


       for (let child of this.childs) {
           child.render(localMatrix);
       }
   }
}




