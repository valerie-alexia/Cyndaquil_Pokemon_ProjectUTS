import { HeadShape } from "./head.js";
import { BodyShape } from "./body.js";
import { ArmShape } from "./arms.js";
import { LegsShape } from "./legs.js";
import { FlameCollar } from "./flame.js";
import { LIBS } from "./libs.js";

export class HisuianTyphlosion {
  GL = null;
  SHADER_PROGRAM = null;
  _position = null;
  _color = null;
  _MMatrix = null;

  // Model parts
  head = null;
  body = null;
  rightArm = null;
  leftArm = null;
  leftLeg = null;
  rightLeg = null;
  flameCollar = null;

  // Animation state variables
  nod = false;
  nodStartTime = 0;
  nodDuration = 1000;

  shakeHead = false;
  shakeStartTime = 0;
  shakeDuration = 1000;

  isJumping = false;
  jumpStartTime = 0;
  jumpDuration = 800; // Durasi lompat (ms)
  jumpHeight = 3.0; // Ketinggian lompat

  // Animation parameters
  breathSpeed = 0.003;
  breathScaleAmount = 0.003;
  breathSpeedTr = 0.0015;
  breathVerticalShift = 0.05;
  earWiggleSpeed = 0.0018;
  earWiggleAngle = 0.2;
  armWiggleSpeed = 0.0012;
  armWiggleAngle = 0.08;
  flameSpeed = 0.002;
  flameWobble = 0.2;

  constructor(GL, SHADER_PROGRAM, _position, _color, _Mmatrix) {
    this.GL = GL;
    this.SHADER_PROGRAM = SHADER_PROGRAM;
    this._position = _position;
    this._color = _color;
    this._MMatrix = _Mmatrix;

    // HEAD
    this.head = new HeadShape(GL, SHADER_PROGRAM, _position, _color, _Mmatrix);

    // BODY
    this.body = new BodyShape(GL, SHADER_PROGRAM, _position, _color, _Mmatrix);

    // ARMS (left and right)
    this.rightArm = new ArmShape(
      GL,
      SHADER_PROGRAM,
      _position,
      _color,
      _Mmatrix,
      +1
    );
    this.leftArm = new ArmShape(
      GL,
      SHADER_PROGRAM,
      _position,
      _color,
      _Mmatrix,
      -1
    );

    // LEGS (left and right)
    this.leftLeg = new LegsShape(
      GL,
      SHADER_PROGRAM,
      _position,
      _color,
      _Mmatrix,
      +1
    );
    this.rightLeg = new LegsShape(
      GL,
      SHADER_PROGRAM,
      _position,
      _color,
      _Mmatrix,
      -1
    );

    // FLAMES
    this.flameCollar = new FlameCollar(
      GL,
      SHADER_PROGRAM,
      _position,
      _color,
      _Mmatrix
    );

    // Hierarchy
    this.body.childs.push(this.head);
    this.body.childs.push(this.rightArm);
    this.body.childs.push(this.leftArm);
    this.body.childs.push(this.leftLeg);
    this.body.childs.push(this.rightLeg);
    this.body.childs.push(this.flameCollar);
  }

  setup() {
    // Calling setup on the body will recursively setup all its children
    this.body.setup();
  }

  render(PARENT_MATRIX) {
    // Calling render on the body will recursively render all its children
    this.body.render(PARENT_MATRIX);
  }

  // --- Animation Control Methods ---

  startNod() {
    this.nod = true;
    this.nodStartTime = performance.now();
  }

  startShake() {
    this.shakeHead = true;
    this.shakeStartTime = performance.now();
  }

  startJump() {
    if (!this.isJumping) {
      // Prevent re-jumping in mid-air
      this.isJumping = true;
      this.jumpStartTime = performance.now();
    }
  }

  animate(time) {
    // --- Reset all move matrices at the start of the frame ---
    LIBS.set_I4(this.body.MOVE_MATRIX);
    LIBS.set_I4(this.head.MOVE_MATRIX);
    LIBS.set_I4(this.rightArm.MOVE_MATRIX);
    LIBS.set_I4(this.leftArm.MOVE_MATRIX);
    LIBS.set_I4(this.rightLeg.MOVE_MATRIX);
    LIBS.set_I4(this.leftLeg.MOVE_MATRIX);
    LIBS.set_I4(this.flameCollar.MOVE_MATRIX);

    // --- 1. Breathing-Idle Animation ---
    const breathPhase = time * this.breathSpeed;
    const breathScaleFactor =
      1.0 + Math.sin(breathPhase) * this.breathScaleAmount;
    const breathPhaseTr = time * this.breathSpeedTr;
    const breathOffsetY = Math.sin(breathPhaseTr) * this.breathVerticalShift;

    // Body scales
    LIBS.scaleY(this.body.MOVE_MATRIX, breathScaleFactor);
    // Head, arms, and flames shift vertically
    LIBS.translateY(this.head.MOVE_MATRIX, breathOffsetY);
    LIBS.translateY(this.rightArm.MOVE_MATRIX, breathOffsetY);
    LIBS.translateY(this.leftArm.MOVE_MATRIX, breathOffsetY);
    LIBS.translateY(this.flameCollar.MOVE_MATRIX, breathOffsetY);

    // --- 2. Idle Ear Wiggle ---
    this.head.OBJECTS.forEach((obj) => {
      // Ensure we have a saved copy of the original matrix
      if (obj && !obj.initialLocalMatrix) {
        obj.initialLocalMatrix = LIBS.clone_matrix(
          obj.localMatrix || LIBS.get_I4()
        );
      }

      if (obj && (obj.tag === "leftEar" || obj.tag === "rightEar")) {
        const t = Math.sin(
          time * this.earWiggleSpeed * (obj.tag === "leftEar" ? 1.0 : 1.15)
        );
        const pivot = [0.0, 0.1, 0.0];
        const axis =
          obj.tag === "leftEar" ? [0.3, 0.9, 0.2] : [-0.3, 0.9, -0.2];

        const wiggleRotation = LIBS.get_I4();
        LIBS.translate(wiggleRotation, -pivot[0], -pivot[1], -pivot[2]);
        LIBS.rotate(wiggleRotation, t * this.earWiggleAngle, axis);
        LIBS.translate(wiggleRotation, pivot[0], pivot[1], pivot[2]);

        obj.localMatrix = LIBS.multiply(obj.initialLocalMatrix, wiggleRotation);
      } else if (obj && obj.initialLocalMatrix) {
        // Reset non-wiggling parts to their original local matrix
        obj.localMatrix = LIBS.clone_matrix(obj.initialLocalMatrix);
      }
    });

    // --- 3. Idle Arm Wiggle ---
    [this.rightArm, this.leftArm].forEach((arm) => {
      const t = Math.sin(
        time * this.armWiggleSpeed * (arm === this.leftArm ? 1.0 : 1.25)
      );
      const pivot = arm === this.leftArm ? [-0.9, 0.5, 0.0] : [0.9, 0.5, 0.0];
      const axis = arm === this.leftArm ? [0.2, 0.8, 0.1] : [-0.2, 0.8, -0.1];

      const localRotation = LIBS.get_I4();
      LIBS.translate(localRotation, -pivot[0], -pivot[1], -pivot[2]);
      LIBS.rotate(localRotation, t * this.armWiggleAngle, axis);
      LIBS.translate(localRotation, pivot[0], pivot[1], pivot[2]);

      // Apply arm wiggle *on top of* any other animations
      arm.MOVE_MATRIX = LIBS.multiply(localRotation, arm.MOVE_MATRIX);
    });

    // --- 4. Jump Animation ---
    let armSwingAngle = 0;
    let legTuckAngle = 0;
    if (this.isJumping) {
      const elapsedTime = time - this.jumpStartTime;
      if (elapsedTime < this.jumpDuration) {
        const t = elapsedTime / this.jumpDuration; // Progress 0 -> 1
        const jumpOffset = -4 * 3.0 * t * (t - 1); // Parabola Y offset
        LIBS.translateY(this.body.MOVE_MATRIX, jumpOffset);
        const maxArmSwing = -0.8;
        const maxLegTuck = 0.15;
        armSwingAngle = Math.sin(t * Math.PI) * maxArmSwing;
        legTuckAngle = Math.sin(t * Math.PI) * maxLegTuck;
      } else {
        this.isJumping = false;
      }
    }

    // Apply jump limb animations
    if (this.isJumping) {
      LIBS.rotateX(this.rightArm.MOVE_MATRIX, armSwingAngle);
      LIBS.rotateX(this.leftArm.MOVE_MATRIX, armSwingAngle);
      LIBS.rotateX(this.rightLeg.MOVE_MATRIX, legTuckAngle);
      LIBS.rotateX(this.leftLeg.MOVE_MATRIX, legTuckAngle);
    }

    // --- 5. Nod Animation ---
    if (this.nod) {
      const elapsedTime = time - this.nodStartTime;
      if (elapsedTime < this.nodDuration) {
        const nodPhase = elapsedTime * (this.nodDuration / 1000) * 0.002; // Adjusted speed
        LIBS.rotateX(
          this.head.MOVE_MATRIX,
          Math.sin(nodPhase * Math.PI * 2) * 0.2
        );
      } else {
        this.nod = false;
      }
    }

    // --- 6. Shake Head Animation ---
    if (this.shakeHead) {
      const elapsedTime = time - this.shakeStartTime;
      if (elapsedTime < this.shakeDuration) {
        const shakePhase =
          elapsedTime * (this.shakeDuration / 1000) * 0.002; // Adjusted speed
        LIBS.rotateY(
          this.head.MOVE_MATRIX,
          Math.sin(shakePhase * Math.PI * 2) * 0.2
        );
      } else {
        this.shakeHead = false;
      }
    }

    // --- 7. Flame Animation ---
    LIBS.rotateY(
      this.flameCollar.MOVE_MATRIX,
      Math.sin(time * this.flameSpeed) * this.flameWobble
    );
    LIBS.rotateX(
      this.flameCollar.MOVE_MATRIX,
      Math.cos(time * this.flameSpeed * 0.7) * this.flameWobble * 0.5
    );
  }
}
