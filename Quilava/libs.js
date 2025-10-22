var LIBS = {
    multiply: function (m1, m2) {
        var rm = this.get_I4();
        var N = 4;
        for (var i = 0; i < N; i++) {
            for (var j = 0; j < N; j++) {
                rm[i * N + j] = 0;
                for (var k = 0; k < N; k++) {
                    rm[i * N + j] += m1[i * N + k] * m2[k * N + j];
                }
            }
        }
        return rm;
    },
    scaleX: function (m, t) {
        m[0] *= t;
    },
    scaleY: function (m, t) {
        m[5] *= t;
    },
    scaleZ: function (m, t) {
        m[10] *= t;
    },
    scale: function (x, y, z) {
        return [
            x, 0, 0, 0,
            0, y, 0, 0,
            0, 0, z, 0,
            0, 0, 0, 1
        ];
    },
    multiply: function (m1, m2) {
        var rm = this.get_I4();
        var N = 4;
        for (var i = 0; i < N; i++) {
            for (var j = 0; j < N; j++) {
                rm[i * N + j] = 0;
                for (var k = 0; k < N; k++)
                    rm[i * N + j] += m1[i * N + k] * m2[k * N + j];
            }
        }
        return rm;
    },

    multiply_vector: function (mat, vec) {
        var result = [0, 0, 0, 0];
        var x = vec[0], y = vec[1], z = vec[2], w = vec[3];

        // This is column-major multiplication, which is standard for WebGL
        result[0] = mat[0] * x + mat[4] * y + mat[8] * z + mat[12] * w;
        result[1] = mat[1] * x + mat[5] * y + mat[9] * z + mat[13] * w;
        result[2] = mat[2] * x + mat[6] * y + mat[10] * z + mat[14] * w;
        result[3] = mat[3] * x + mat[7] * y + mat[11] * z + mat[15] * w;

        return result;
    },

    degToRad: function (angle) {
        return (angle * Math.PI / 180);
    },


    get_projection: function (angle, a, zMin, zMax) {
        var tan = Math.tan(LIBS.degToRad(0.5 * angle)),
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
            0, 0, 0, 1];
    },


    set_I4: function (m) {
        m[0] = 1, m[1] = 0, m[2] = 0, m[3] = 0,
            m[4] = 0, m[5] = 1, m[6] = 0, m[7] = 0,
            m[8] = 0, m[9] = 0, m[10] = 1, m[11] = 0,
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
    translate: function (x, y, z) {
        return [
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            x, y, z, 1
        ];
    },
    clone: function (a) {
        let out = new Float32Array(16);
        out[0] = a[0];
        out[1] = a[1];
        out[2] = a[2];
        out[3] = a[3];
        out[4] = a[4];
        out[5] = a[5];
        out[6] = a[6];
        out[7] = a[7];
        out[8] = a[8];
        out[9] = a[9];
        out[10] = a[10];
        out[11] = a[11];
        out[12] = a[12];
        out[13] = a[13];
        out[14] = a[14];
        out[15] = a[15];
        return out;
    },


    set_position: function (m, x, y, z) {
        m[12] = x, m[13] = y, m[14] = z;
    }


};