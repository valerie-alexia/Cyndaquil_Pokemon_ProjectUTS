export const LIBS_CYNDAQUIL = {
    degToRad: function (angle) {
        return (angle * Math.PI / 180);
    },

    get_projection: function (angle, a, zMin, zMax) {
        // Mengakses properti objek ini secara internal menggunakan 'this.'
        var tan = Math.tan(this.degToRad(0.5 * angle)),
            A = -(zMax + zMin) / (zMax - zMin),
            B = (-2 * zMax * zMin) / (zMax - zMin);

        return [
            0.5 / tan, 0, 0, 0,
            0, 0.5 * a / tan, 0, 0,
            0, 0, A, -1,
            0, 0, B, 0
        ];
    },

    get_I4: function () {
        return [1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1
        ];
    },

    set_I4: function (m) {
        m[0] = 1, m[1] = 0, m[2] = 0, m[3] = 0;
        m[4] = 0, m[5] = 1, m[6] = 0, m[7] = 0;
        m[8] = 0, m[9] = 0, m[10] = 1, m[11] = 0;
        m[12] = 0, m[13] = 0, m[14] = 0, m[15] = 1;
    },

    rotateX: function (m, angle) {
        var c = Math.cos(angle);
        var s = Math.sin(angle);
        var mv1 = m[1], mv5 = m[5], mv9 = m[9];
        m[1] = m[1] * c - m[2] * s;
        m[5] = m[5] * c - m[6] * s;
        m[9] = m[9] * c - m[10] * s;

        m[2] = m[2] * c + mv1 * s;
        m[6] = m[6] * c + mv5 * s;
        m[10] = m[10] * c + mv9 * s;
    },

    rotateY: function (m, angle) {
        var c = Math.cos(angle);
        var s = Math.sin(angle);
        var mv0 = m[0], mv4 = m[4], mv8 = m[8];
        m[0] = c * m[0] + s * m[2];
        m[4] = c * m[4] + s * m[6];
        m[8] = c * m[8] + s * m[10];

        m[2] = c * m[2] - s * mv0;
        m[6] = c * m[6] - s * mv4;
        m[10] = c * m[10] - s * mv8;
    },

    rotateZ: function (m, angle) {
        var c = Math.cos(angle);
        var s = Math.sin(angle);
        var mv0 = m[0], mv4 = m[4], mv8 = m[8];
        m[0] = c * m[0] - s * m[1];
        m[4] = c * m[4] - s * m[5];
        m[8] = c * m[8] - s * m[9];

        m[1] = c * m[1] + s * mv0;
        m[5] = c * m[5] + s * mv4;
        m[9] = c * m[9] + s * mv8;
    },

    translateZ: function (m, t) {
        m[14] += t;
    },
    translateX: function (m, t) {
        m[12] += t;
    },
    translateY: function (m, t) {
        m[13] += t;
    },

    multiply: function (m1, m2) {
        var a0 = m1[0], a1 = m1[1], a2 = m1[2], a3 = m1[3],
            a4 = m1[4], a5 = m1[5], a6 = m1[6], a7 = m1[7],
            a8 = m1[8], a9 = m1[9], a10 = m1[10], a11 = m1[11],
            a12 = m1[12], a13 = m1[13], a14 = m1[14], a15 = m1[15];

        var b0 = m2[0], b1 = m2[1], b2 = m2[2], b3 = m2[3],
            b4 = m2[4], b5 = m2[5], b6 = m2[6], b7 = m2[7],
            b8 = m2[8], b9 = m2[9], b10 = m2[10], b11 = m2[11],
            b12 = m2[12], b13 = m2[13], b14 = m2[14], b15 = m2[15];

        m1[0] = a0 * b0 + a1 * b4 + a2 * b8 + a3 * b12;
        m1[1] = a0 * b1 + a1 * b5 + a2 * b9 + a3 * b13;
        m1[2] = a0 * b2 + a1 * b6 + a2 * b10 + a3 * b14;
        m1[3] = a0 * b3 + a1 * b7 + a2 * b11 + a3 * b15;

        m1[4] = a4 * b0 + a5 * b4 + a6 * b8 + a7 * b12;
        m1[5] = a4 * b1 + a5 * b5 + a6 * b9 + a7 * b13;
        m1[6] = a4 * b2 + a5 * b6 + a6 * b10 + a7 * b14;
        m1[7] = a4 * b3 + a5 * b7 + a6 * b11 + a7 * b15;

        m1[8] = a8 * b0 + a9 * b4 + a10 * b8 + a11 * b12;
        m1[9] = a8 * b1 + a9 * b5 + a10 * b9 + a11 * b13;
        m1[10] = a8 * b2 + a9 * b6 + a10 * b10 + a11 * b14;
        m1[11] = a8 * b3 + a9 * b7 + a10 * b11 + a11 * b15;

        m1[12] = a12 * b0 + a13 * b4 + a14 * b8 + a15 * b12;
        m1[13] = a12 * b1 + a13 * b5 + a14 * b9 + a15 * b13;
        m1[14] = a12 * b2 + a13 * b6 + a14 * b10 + a15 * b14;
        m1[15] = a12 * b3 + a13 * b7 + a14 * b11 + a15 * b15;
    },

    set_position: function (m, x, y, z) {
        m[12] = x, m[13] = y, m[14] = z;
    },
    
    // Fungsi Tambahan yang Dibutuhkan Cyndaquil/Shape.js
    lerp: (start, end, t) => start * (1 - t) + end * t,

    clone: function (a) {
        let out = []; // Menggunakan array biasa karena LIBS asli juga menggunakan array
        for (let i = 0; i < 16; i++) {
            out[i] = a[i];
        }
        return out;
    }
};