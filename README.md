#  Pokémon Evolution: 3D WebGL Scene

**Pokemon\_MidtermProject\_Grafkom** is a Computer Graphics midterm project that renders the complete evolution line of **Cyndaquil** in a 3D environment. The project demonstrates core graphics concepts by constructing complex character models entirely out of mathematical geometric primitives (quadric objects).

##  The Evolution Line

The scene features fully modeled 3D representations of:

1.  **Cyndaquil** (Base Form)
2.  **Quilava** (Stage 1)
3.  **Typhlosion** (Stage 2)
4.  **Hisuian Typhlosion** (Regional Variant)

##  Technical Implementation

This project eschews pre-made 3D models (`.obj` / `.fbx`) in favor of manual construction using **WebGL**, demonstrating mastery of:

### 1\. Quadric Objects & Primitives

Every part of the Pokémon—from their bodies to their flames—is built using raw geometric shapes and mathematical formulas, including:

  * **Ellipsoids & Spheres:** Used for heads, bodies, and eyes.
  * **Hyperboloids:** Used to create the dynamic shape of the flames.
  * **Cones & Cylinders:** Used for limbs, snouts, and claws.
  * **Torus:** Used for neck rings or decorative features.
  * etc.

### 2\. Hierarchical Modeling (Scene Graph)

The characters are built using a **hierarchical parent-child structure**.

  * *Example:* Moving a character's "Torso" automatically moves the "Arms," "Legs," and "Head" attached to it.
  * This ensures that animations look natural and body parts stay connected during transformation.

### 3\. Animation & Transformation

  * **Idle Animations:** Characters feature breathing or floating movements using scaling and translation.
  * **Flame Effects:** The flames (hyperboloids) animate to simulate flickering fire.
  * **Interactive Controls:** The scene includes transformation logic (Rotation, Translation, Scaling) to view the models from different angles.
  * etc.

##  Built With

  * **Language:** JavaScript (ES6)
  * **API:** WebGL (Raw or Utility Libraries)
  * **Math:** Matrix manipulation for rendering and transformations.
