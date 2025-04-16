const FlatColourShader = {
    name: 'FlatColourShader',
    
    uniforms: {
        'tDiffuse': { value: null },
    },

    vertexShader: `

    varying vec2 vUv;

    void main() {

        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

    }`,

    fragmentShader:`

    uniform sampler2D tDiffuse;

    varying vec2 vUv;

    void main() {
        vec4 col = texture2D(tDiffuse, vUv);
        float t = float((col.x + col.y + col.z) > 0.0000001);
        gl_FragColor = vec4(t, 0, 0, 1);
    }`
};

export {FlatColourShader};