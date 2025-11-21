import { LIBS_CYNDAQUIL as LIBS } from "../environment/libs2.js";
import { Shape } from "./shape.js";
import { mat4 } from "https://cdn.jsdelivr.net/npm/gl-matrix@3.4.3/esm/index.js";


const X_SHIFT_ALL = 3.0;
const GL_TRIANGLES = 4;


export class LegsShape extends Shape {
   constructor(GL, SHADER_PROGRAM, _position, _color, _MMatrix, side, scaleConfig = {}) {
       super(GL, SHADER_PROGRAM, _position, _color, _MMatrix);
       LIBS.set_I4(this.POSITION_MATRIX);


       const SCALE = 0.8;


       var Y_OFFSET = 2.0;
       var X_OFFSET = -0.5;
       var Z_OFFSET = 1.9;
       const DEPTH_OFFSET = -3.2;

       LIBS.set_position(
           this.POSITION_MATRIX,
           X_SHIFT_ALL + X_OFFSET,
           Y_OFFSET,
           (Z_OFFSET * side)+DEPTH_OFFSET
       );


       const TILT_Y = LIBS.degToRad(15 * side);
       mat4.rotateY(this.POSITION_MATRIX, this.POSITION_MATRIX, TILT_Y);


       this.SCALE = SCALE;
       this.side = side;


       this.X_SCALE = scaleConfig.xScale ?? 1.7;
       this.Y_SCALE = scaleConfig.yScale ?? 1.5;
       this.Z_SCALE = scaleConfig.zScale ?? 0.8;
       this.rotationAngle = 0.0;


       this.createLegGeometry();
   }


   setRotation(angle) {
       this.rotationAngle = angle;
   }


   draw(MMatrix) {
       let finalMatrix = mat4.clone(this.POSITION_MATRIX);


       mat4.rotateX(finalMatrix, finalMatrix, this.rotationAngle * this.side);


       super.draw(MMatrix, finalMatrix);
   }


   createLegGeometry() {
       const color_cream = [0.96, 0.9, 0.72];
       const color_pad = [0.92, 0.85, 0.68]; 
       const color_claw = [0.85, 0.82, 0.75];


       let vertices = [], colors = [], faces = [];


       const baseRadius = 1.4 * this.SCALE;
       const stacks = 20;
       const slices = 20;


       const X_SCALE = this.X_SCALE;
       const Y_SCALE = this.Y_SCALE;
       const Z_SCALE = this.Z_SCALE;


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


       const footRadius = baseRadius * 0.3;
       const footThickness = 0.1;


       const FOOT_LIFT_ADJUST = 0.1;


       const footBaseY = (-baseRadius * this.Y_SCALE) + FOOT_LIFT_ADJUST;


       const footStart = vertices.length / 3;


       for (let j = 0; j <= slices; j++) {
           const theta = (j / slices) * 2 * Math.PI;
           const x = Math.cos(theta) * footRadius * X_SCALE;
           const z = Math.sin(theta) * footRadius * Z_SCALE;


           vertices.push(x, footBaseY, z);
           colors.push(...color_pad);


           vertices.push(x, footBaseY - footThickness, z);
           colors.push(...color_pad);
       }


       for (let j = 0; j < slices; j++) {
           const i0 = footStart + j * 2;
           const i1 = i0 + 1;
           const i2 = i0 + 2;
           const i3 = i2 + 1;


           faces.push(i0, i2, i1);
           faces.push(i1, i2, i3);
       }


       const clawBaseX = footRadius * X_SCALE - 0.1;
       const clawLength = 1.0; 
       const clawWidth = 0.4;  
       const clawHeight = 0.4; 


       const clawStart = vertices.length / 3;


       const clawVerts = [
           clawBaseX, footBaseY - 0.1, 0.0,          
           clawBaseX, footBaseY + clawHeight,  clawWidth, 
           clawBaseX, footBaseY + clawHeight, -clawWidth,  


           clawBaseX + clawLength, footBaseY, 0.0
       ];


       for (let i = 0; i < 4; i++) colors.push(...color_claw);
       vertices.push(...clawVerts);


       faces.push(
           clawStart, clawStart + 1, clawStart + 3,
           clawStart, clawStart + 2, clawStart + 3,
           clawStart + 1, clawStart + 2, clawStart + 3
       );


       const geo = this.interleaveData(vertices, colors);
       this.addObject(geo.vertices, faces, LIBS.get_I4(), GL_TRIANGLES);
   }
}