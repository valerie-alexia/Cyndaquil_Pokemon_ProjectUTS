import { LIBS_CYNDAQUIL as LIBS } from "../environment/libs2.js";
import { Shape } from "./shape.js";
import { mat4 } from "https://cdn.jsdelivr.net/npm/gl-matrix@3.4.3/esm/index.js";


const X_SHIFT_ALL = 0.0;
const GL_TRIANGLES = 4;


export class ArmsShape extends Shape {
   constructor(GL, SHADER_PROGRAM, _position, _color, _MMatrix, side) {
       super(GL, SHADER_PROGRAM, _position, _color, _MMatrix);
       LIBS.set_I4(this.POSITION_MATRIX);
      
       const SCALE = 0.7;
       const Y_OFFSET = -1.5;
       const X_OFFSET = -3.0;
       const Z_OFFSET = 2.2;
      
       LIBS.set_position(
           this.POSITION_MATRIX,
           X_SHIFT_ALL + X_OFFSET,
           Y_OFFSET,
           Z_OFFSET * side
       );


       const TILT_Z = LIBS.degToRad(-10 * side);
       mat4.rotateZ(this.POSITION_MATRIX, this.POSITION_MATRIX, TILT_Z);


       this.SCALE = SCALE;
       this.side = side;
       this.rotationAngle = 0.0;


       this.createArmGeometry();
   }


   setRotation(angle) {
       this.rotationAngle = angle;
   }


   draw(MMatrix) {
       let finalMatrix = mat4.clone(this.POSITION_MATRIX);


       mat4.rotateX(finalMatrix, finalMatrix, this.rotationAngle * this.side);


       super.draw(MMatrix, finalMatrix);
   }


   createArmGeometry() {
       const color_cream = [0.96, 0.9, 0.72];


       let vertices = [];
       let colors = [];
       let faces = [];


       const baseRadius = 1.5 * this.SCALE;
       const stacks = 20;
       const slices = 20;


       const Y_SCALE = 0.8;
       const X_SCALE = 1.5;
       const Z_SCALE = 0.4;


       for (let i = 0; i <= stacks; i++) {
           const v = i / stacks;
           const phi = v * Math.PI;
          
           const r_base = baseRadius * Math.sin(phi);


           const y = baseRadius * Math.cos(phi);


           for (let j = 0; j <= slices; j++) {
               const u = j / slices;
               const theta = u * 2 * Math.PI;


               const x = r_base * Math.cos(theta) * X_SCALE;
               const z = r_base * Math.sin(theta) * Z_SCALE;


               vertices.push(x, y * Y_SCALE, z);
               colors.push(...color_cream);
           }
       }


       for (let i = 0; i < stacks; i++) {
           for (let j = 0; j < slices; j++) {
               const first = i * (slices + 1) + j;
               const second = first + slices + 1;
               faces.push(first, second, first + 1);
               faces.push(second, second + 1, first + 1);
           }
       }


       const geo = this.interleaveData(vertices, colors);
       this.addObject(geo.vertices, faces, LIBS.get_I4(), GL_TRIANGLES);
   }
}