const FlatColourShader = {
    name: 'FlatColourShader',
    
    uniforms: {
        'tDiffuse': { value: null },
        'maskStrength' : {value: 10}
    },

    vertexShader: `

    varying vec2 vUv;

    void main() {

        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

    }`,

    fragmentShader:`

    uniform sampler2D tDiffuse;
    uniform float maskStrength;

    varying vec2 vUv;

    void main() {
        vec4 col = texture2D(tDiffuse, vUv);
        float epsilon = 1.0 / (maskStrength * 100.0);
        float t = float((col.x + col.y + col.z) > epsilon);
        gl_FragColor = vec4(t, 0, 0, 1);
    }`
};

export {FlatColourShader};