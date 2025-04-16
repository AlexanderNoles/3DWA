const GreyscaleShader = {
    name: 'GreyscaleShader',
    
    uniforms: {
        'tDiffuse': { value: null },
        'intensity': { value: 0},
    },

    vertexShader: `

    varying vec2 vUv;

    void main() {

        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

    }`,

    fragmentShader:`

    uniform sampler2D tDiffuse;
    uniform float intensity;

    varying vec2 vUv;

    void main() {
        vec4 col = texture2D(tDiffuse, vUv);
        float sum = (col.x + col.y + col.z) / 3.0;
        gl_FragColor = mix(col, vec4(sum, sum, sum, col.a), intensity);
    }`
};

export {GreyscaleShader};