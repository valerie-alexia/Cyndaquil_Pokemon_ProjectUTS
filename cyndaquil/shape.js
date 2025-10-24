export class Shape {
   GL = null;
   SHADER_PROGRAM = null;


   _position = null;
   _color = null;
   _MMatrix = null;


   OBJECTS = [];
   childs = [];


   POSITION_MATRIX = LIBS.get_I4();
   MOVE_MATRIX = LIBS.get_I4();


   constructor(GL, SHADER_PROGRAM, _position, _color, _MMatrix) {
       this.GL = GL;
       this.SHADER_PROGRAM = SHADER_PROGRAM;
       this._position = _position;
       this._color = _color;
       this._MMatrix = _MMatrix;
   }


   addObject(vertices, indices, localMatrix, mode, vertexCount = 0) {
       if (localMatrix === null) localMatrix = LIBS.get_I4();
       this.OBJECTS.push({
           vertices,
           indices,
           localMatrix,
           mode,
           vertexCount: vertexCount > 0 ? vertexCount : indices.length
       });
   }


   interleaveData(pos, colors) {
       const interleaved = [];
       const numVertices = pos.length / 3;
       for (let i = 0; i < numVertices; i++) {
           interleaved.push(pos[i * 3 + 0], pos[i * 3 + 1], pos[i * 3 + 2]);
           interleaved.push(colors[i * 3 + 0], colors[i * 3 + 1], colors[i * 3 + 2]);
       }
       return { vertices: interleaved };
   }


   setup() {
       this.OBJECTS.forEach(obj => {
           obj.vertexBuffer = this.GL.createBuffer();
           this.GL.bindBuffer(this.GL.ARRAY_BUFFER, obj.vertexBuffer);
           this.GL.bufferData(this.GL.ARRAY_BUFFER, new Float32Array(obj.vertices), this.GL.STATIC_DRAW);


           if (obj.indices.length > 0) {
               obj.indexBuffer = this.GL.createBuffer();
               this.GL.bindBuffer(this.GL.ELEMENT_ARRAY_BUFFER, obj.indexBuffer);
               this.GL.bufferData(this.GL.ELEMENT_ARRAY_BUFFER, new Uint16Array(obj.indices), this.GL.STATIC_DRAW);
           }
       });
      
       this.childs.forEach(child => child.setup());
   }


   render(PARENT_MATRIX) {
       const MODEL_MATRIX = LIBS.get_I4();


       LIBS.multiply(MODEL_MATRIX, PARENT_MATRIX);
        LIBS.multiply(MODEL_MATRIX, this.POSITION_MATRIX);
        LIBS.multiply(MODEL_MATRIX, this.MOVE_MATRIX);


       this.OBJECTS.forEach(obj => {
           const M = LIBS.get_I4();
           LIBS.multiply(M, MODEL_MATRIX);
           LIBS.multiply(M, obj.localMatrix);


           this.GL.useProgram(this.SHADER_PROGRAM);
           this.GL.uniformMatrix4fv(this._MMatrix, false, M);


           this.GL.bindBuffer(this.GL.ARRAY_BUFFER, obj.vertexBuffer);
           this.GL.vertexAttribPointer(this._position, 3, this.GL.FLOAT, false, 24, 0);
           this.GL.vertexAttribPointer(this._color, 3, this.GL.FLOAT, false, 24, 12);
          
           if (obj.indices.length > 0) {
               this.GL.bindBuffer(this.GL.ELEMENT_ARRAY_BUFFER, obj.indexBuffer);
               this.GL.drawElements(obj.mode, obj.indices.length, this.GL.UNSIGNED_SHORT, 0);
           } else {
               this.GL.drawArrays(obj.mode, 0, obj.vertexCount);
           }
       });
      
       this.childs.forEach(child => child.render(MODEL_MATRIX));
   }
}



