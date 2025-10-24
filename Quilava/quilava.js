// Inside Quilava/Quilava.js (or modify Quilava/main.js)

// Import parts using relative paths WITHIN the Quilava folder
import { HeadShape } from './kepala.js'; 
import { BodyShape } from './body.js';
import { ArmShape } from './arms.js';
import { LegsShape } from './legs.js';

export class QuilavaShape {
    GL = null; SHADER_PROGRAM = null; /* ... etc ... */
    root = null; // The main part, likely the body

    constructor(GL, SHADER_PROGRAM, _position, _color, _MMatrix) {
        this.GL = GL; /* ... store params ... */

        // Create the parts
        const body = new BodyShape(GL, SHADER_PROGRAM, _position, _color, _MMatrix);
        const head = new HeadShape(GL, SHADER_PROGRAM, _position, _color, _MMatrix);
        const leftArm = new ArmShape(GL, SHADER_PROGRAM, _position, _color, _MMatrix, -1);
        const rightArm = new ArmShape(GL, SHADER_PROGRAM, _position, _color, _MMatrix, 1);
        const leftLeg = new LegsShape(GL, SHADER_PROGRAM, _position, _color, _MMatrix, -1);
        const rightLeg = new LegsShape(GL, SHADER_PROGRAM, _position, _color, _MMatrix, 1);

        // Build hierarchy
        body.childs.push(head);
        body.childs.push(leftArm);
        body.childs.push(rightArm);
        body.childs.push(leftLeg);
        body.childs.push(rightLeg);

        this.root = body; // Store the root object

        // You might need a POSITION_MATRIX for the whole Quilava model
        this.POSITION_MATRIX = LIBS.get_I4(); 
    }

    setup() {
        this.root.setup(); // Setup cascades through children
    }

    render(PARENT_MATRIX) {
        // Apply the whole model's position matrix
        const M = LIBS.multiply(PARENT_MATRIX, this.POSITION_MATRIX);
        this.root.render(M); // Render cascades
    }

    animate(time) {
        this.root.animate(time); // Animate cascades
    }

    toggleCrawlState() {
         // You might need to call this on the root and potentially children
         if(this.root.toggleCrawlState) {
             this.root.toggleCrawlState();
         }
         this.root.childs.forEach(child => {
             if (child.toggleCrawlState) child.toggleCrawlState();
         });
    }
}