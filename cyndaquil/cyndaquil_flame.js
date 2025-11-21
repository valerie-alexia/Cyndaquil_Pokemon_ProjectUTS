import { LIBS_CYNDAQUIL as LIBS } from "../environment/libs2.js";
import { Shape } from "./shape.js";
import { mat4, vec3 } from "https://cdn.jsdelivr.net/npm/gl-matrix@3.4.3/esm/index.js";


const X_SHIFT_ALL = 0.0;
const GL_TRIANGLES = 4;


export class FlameShape extends Shape {
   constructor(GL, SHADER_PROGRAM, _position, _color, _MMatrix) {
       super(GL, SHADER_PROGRAM, _position, _color, _MMatrix);
       LIBS.set_I4(this.POSITION_MATRIX);


       const X_OFFSET = 1.5;
       const Y_OFFSET = 3.2;
       const Z_OFFSET = -2.5;


       LIBS.set_position(this.POSITION_MATRIX, X_SHIFT_ALL + X_OFFSET, Y_OFFSET, Z_OFFSET);


       const TILT_X = LIBS.degToRad(15);
       const ROTATE_Z = LIBS.degToRad(90);
       mat4.rotateX(this.POSITION_MATRIX, this.POSITION_MATRIX, TILT_X);
       mat4.rotateZ(this.POSITION_MATRIX, this.POSITION_MATRIX, ROTATE_Z);


       this.createFlameGeometry();
   }


   createFlameGeometry() {
       let vertices = [];
       let colors = [];
       let faces = [];


       const layerData = [
           { height: 3.0, width: 4.0, color: [0.9, 0.1, 0.1] },
           { height: 3.3, width: 3.0, color: [1.0, 0.55, 0.05] },
           { height: 3.8, width: 2.2, color: [1.0, 0.9, 0.0] }
       ];


       let globalIndex = 0;


       const flamePlanes = 12;
       for (let p = 0; p < flamePlanes; p++) {
           const angleY = (p / flamePlanes) * Math.PI;
           const zOffset = (Math.random() - 0.5) * 0.6;
           const rotMat = mat4.create();
           mat4.rotateY(rotMat, rotMat, angleY);


           layerData.forEach((layer) => {
               const { height, width, color } = layer;
               const segments = 10 + Math.floor(Math.random() * 5);
               const baseIndex = vertices.length / 3;


               for (let i = 0; i < segments; i++) {
                   const x0 = (i / segments - 0.5) * width;
                   const x1 = ((i + 1) / segments - 0.5) * width;


                   const randomPeak = Math.random() * 0.4 + 0.9;
                   const y0 = 0;
                   const y1 = 0;
                   const yPeak = height * randomPeak;


                   const tri = [
                       [x0, y0, zOffset],
                       [x1, y1, zOffset],
                       [(x0 + x1) / 2, yPeak, zOffset]
                   ];


                   tri.forEach(([x, y, z]) => {
                       const pos = vec3.fromValues(x, y, z);
                       vec3.transformMat4(pos, pos, rotMat);
                       vertices.push(pos[0], pos[1], pos[2]);
                       colors.push(...color);
                   });


                   faces.push(globalIndex, globalIndex + 1, globalIndex + 2);
                   globalIndex += 3;
               }
           });
       }
      
       const geo = this.interleaveData(vertices, colors);
       this.addObject(geo.vertices, faces, LIBS.get_I4(), GL_TRIANGLES);
   }
}