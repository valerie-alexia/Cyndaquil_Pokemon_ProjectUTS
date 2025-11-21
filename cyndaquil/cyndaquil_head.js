import { LIBS_CYNDAQUIL as LIBS } from "../environment/libs2.js";
import { Shape } from "./shape.js";
import { getBezierPoint } from "./bezier.js";
import { mat4 } from "https://cdn.jsdelivr.net/npm/gl-matrix@3.4.3/esm/index.js";

const Y_BASE_OFFSET = 1.2;
const X_SHIFT_ALL = -6.0;
const X_SHIFT_SN = X_SHIFT_ALL;
const X_SHIFT_HD = -4.8 - 2.0;
const Y_NECK_START = Y_BASE_OFFSET - 2.5;
const Y_GLOBAL_TO_LOCAL_CORRECTION = 1.5;

const GL_TRIANGLES = 4;
const GL_LINE_STRIP = 3;

export class HeadShape extends Shape {
   constructor(GL, SHADER_PROGRAM, _position, _color, _MMatrix) {
       super(GL, SHADER_PROGRAM, _position, _color, _MMatrix);
       LIBS.set_I4(this.POSITION_MATRIX);

       this.LOCAL_MATRIX = mat4.create();
       mat4.identity(this.LOCAL_MATRIX);

       const HEAD_LEAN_FORWARD = LIBS.degToRad(-1);
       mat4.rotateZ(this.POSITION_MATRIX, this.POSITION_MATRIX, HEAD_LEAN_FORWARD);

       this.createHeadGeometry();
   }

   draw(parentMatrix, VMatrix, PMatrix) {
       let localFinalMatrix = mat4.create();
       mat4.multiply(localFinalMatrix, this.POSITION_MATRIX, this.LOCAL_MATRIX);

       let MMatrix = mat4.create();
       mat4.multiply(MMatrix, parentMatrix, localFinalMatrix);

       super.draw(MMatrix, VMatrix, PMatrix);

       for (const child of this.childs) {
           child.draw(MMatrix, VMatrix, PMatrix);
       }
   }

   createHeadGeometry() {
       const color_blue = [0.0, 0.3, 0.35];
       const color_cream = [0.96, 0.9, 0.72];
       const color_black = [0.0, 0.0, 0.0];

       var vertices_snout = [];
       var faces_snout = [];
       var colors_snout = [];
      
       var circle_sections = [
           [-0.8, 2.0],
           [0.0, 1.8], 
           [1.0, 1.5], 
           [2.0, 1.0], 
           [3.0, 0.6], 
           [4.0, 0.3]  
       ];
       var num_sections = circle_sections.length;
       var circle_segments = 60;

       var top_points = [];
       var bottom_points = [];

       const snout_y_offset = Y_BASE_OFFSET - 1.5;
       for (var i = 0; i < num_sections; i++) {
           var x = circle_sections[i][0] + X_SHIFT_SN;
           var r = circle_sections[i][1];


           top_points.push([x, snout_y_offset + r]);
           bottom_points.push([x, snout_y_offset - r * 0.3]);
       }

       var p_top_0 = top_points[0];
       var p_top_3 = top_points[num_sections - 1];
       var p_top_1 = [p_top_0[0] + 1.5, p_top_0[1] + 0.8];
       var p_top_2 = [p_top_3[0] - 1.5, p_top_3[1] + 0.3];

       var p_bottom_0 = bottom_points[0];
       var p_bottom_3 = bottom_points[num_sections - 1];
       var p_bottom_1 = [p_bottom_0[0] + 1.5, p_bottom_0[1] - 0.5];
       var p_bottom_2 = [p_bottom_3[0] - 1.5, p_bottom_3[1] - 0.05];

       for (var i = 0; i < num_sections; i++) {
           var x_pos = circle_sections[i][0] + X_SHIFT_SN;


           var t_norm = (x_pos - p_top_0[0]) / (p_top_3[0] - p_top_0[0]);
           t_norm = Math.max(0, Math.min(1, t_norm));


           var top_p = getBezierPoint(t_norm, p_top_0, p_top_1, p_top_2, p_top_3);
           var bottom_p = getBezierPoint(t_norm, p_bottom_0, p_bottom_1, p_bottom_2, p_bottom_3);


           var y_center = (top_p[1] + bottom_p[1]) / 2;
           var y_radius = (top_p[1] - bottom_p[1]) / 2;
           var z_scale = 1.0;


           for (var j = 0; j <= circle_segments; j++) {
               var angle = j / circle_segments * 2 * Math.PI;
               var x = x_pos;
              
               var y = y_center + y_radius * Math.cos(angle) + Y_GLOBAL_TO_LOCAL_CORRECTION;
               var z = y_radius * Math.sin(angle) * z_scale;


               vertices_snout.push(x, y, z);
              
               const y_center_snout_corrected = y_center + Y_GLOBAL_TO_LOCAL_CORRECTION;
               if (y > y_center_snout_corrected + y_radius * 0.1) {
                   colors_snout.push(...color_blue);
               } else {
                   colors_snout.push(...color_cream);
               }
           }
       }


       var last_section_index = num_sections - 1;
       var x_pos_tip = circle_sections[last_section_index][0] + X_SHIFT_SN;
       var tip_center_index = vertices_snout.length / 3;


       var t_norm_tip = 1.0;
       var top_p_tip = getBezierPoint(t_norm_tip, p_top_0, p_top_1, p_top_2, p_top_3);
       var bottom_p_tip = getBezierPoint(t_norm_tip, p_bottom_0, p_bottom_1, p_bottom_2, p_bottom_3);
       var y_center_tip = (top_p_tip[1] + bottom_p_tip[1]) / 2;


       vertices_snout.push(x_pos_tip, y_center_tip + Y_GLOBAL_TO_LOCAL_CORRECTION, 0.0);
       colors_snout.push(...color_cream);


       const start_index_last_section = (num_sections - 1) * (circle_segments + 1);
       for (var j = 0; j < circle_segments; j++) {
           var p1 = start_index_last_section + j;
           var p2 = start_index_last_section + j + 1;
           var p3 = tip_center_index;
           faces_snout.push(p1, p3, p2);
       }


       for (var i = 0; i < num_sections - 1; i++) {
           for (var j = 0; j < circle_segments; j++) {
               var p1 = i * (circle_segments + 1) + j;
               var p2 = (i + 1) * (circle_segments + 1) + j;
               var p3 = (i + 1) * (circle_segments + 1) + j + 1;
               var p4 = i * (circle_segments + 1) + j + 1;


               faces_snout.push(p1, p2, p4);
               faces_snout.push(p2, p3, p4);
           }
       }


       const snoutGeo = this.interleaveData(vertices_snout, colors_snout);
       this.addObject(snoutGeo.vertices, faces_snout, LIBS.get_I4(), GL_TRIANGLES);


       var circleVertices = [];
       var circleColors = [];
       var circleFaces = [];
       var r = 2.0;


       const skull_overlap = 0.18;
       var head_y_offset = Y_NECK_START + r - skull_overlap + Y_GLOBAL_TO_LOCAL_CORRECTION;


       var slices = 80, stacks = 80;
       for (var i = 0; i <= slices; i++) {
           var theta = i * Math.PI / slices;
           for (var j = 0; j <= stacks; j++) {
               var phi = j * 2 * Math.PI / stacks;


               var x = r * Math.sin(theta) * Math.cos(phi) + X_SHIFT_HD;
               var y = r * Math.cos(theta) + head_y_offset;
               var z = r * Math.sin(theta) * Math.sin(phi);


               circleVertices.push(x, y, z);
               if (y > head_y_offset) {
                   circleColors.push(...color_blue);
               } else {
                   circleColors.push(...color_cream);
               }
           }
       }


       for (var i = 0; i < slices; i++) {
           for (var j = 0; j < stacks; j++) {
               var p1 = i * (stacks + 1) + j;
               var p2 = p1 + (stacks + 1);
               var p3 = p2 + 1;
               var p4 = p1 + 1;


               circleFaces.push(p1, p2, p4);
               circleFaces.push(p2, p3, p4);
           }
       }


       const skullGeo = this.interleaveData(circleVertices, circleColors);
       this.addObject(skullGeo.vertices, circleFaces, LIBS.get_I4(), GL_TRIANGLES);


       const eyeVertices = [];
       const eyeColors = [];
       const eyeFaces = [];


       const eye_y_center = head_y_offset + 0.5;
       const eye_x_base = X_SHIFT_HD + 0.8;
       const eye_z_offset = 1.9;
       const arc_radius = 0.5;
       const tube_radius = 0.09; 
       const num_arc_segments = 36;
       const num_circle_segments = 24;
       const color_eye = [0.0, 0.0, 0.0];


       function addEye(z_sign = 1) {
           const startIndex = eyeVertices.length / 3;
           for (let i = 0; i <= num_arc_segments; i++) {
               const angle_arc = Math.PI * (i / num_arc_segments);
               const cx = eye_x_base - arc_radius * (1 - Math.cos(angle_arc));
               const cy = eye_y_center + arc_radius * Math.sin(angle_arc);
               const cz = eye_z_offset * z_sign;


               for (let j = 0; j <= num_circle_segments; j++) {
                   const angle_circ = (j / num_circle_segments) * 2 * Math.PI;
                   const x = cx + tube_radius * Math.cos(angle_circ);
                   const y = cy + tube_radius * Math.sin(angle_circ);
                   const z = cz + tube_radius * 0.2 * Math.sin(angle_circ);
                   eyeVertices.push(x, y, z);
                   eyeColors.push(...color_eye);
               }
           }


           for (let i = 0; i < num_arc_segments; i++) {
               for (let j = 0; j < num_circle_segments; j++) {
                   const p1 = startIndex + i * (num_circle_segments + 1) + j;
                   const p2 = p1 + (num_circle_segments + 1);
                   const p3 = p2 + 1;
                   const p4 = p1 + 1;
                   eyeFaces.push(p1, p2, p4);
                   eyeFaces.push(p2, p3, p4);
               }
           }
       }


       addEye(1);
       addEye(-1);


       const eyeGeo = this.interleaveData(eyeVertices, eyeColors);
       this.addObject(eyeGeo.vertices, eyeFaces, LIBS.get_I4(), GL_TRIANGLES);
   }
}