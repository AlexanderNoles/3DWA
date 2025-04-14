const PixelationShader = {
    name: 'PixelationShader',
    
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
        const float res = 0.00625;
        vec2 clampedUv = vec2(round(vUv.x / res), round(vUv.y / res)) * res;

        vec4 col = texture2D(tDiffuse, clampedUv);
        gl_FragColor = col;
    }`
};

export {PixelationShader};