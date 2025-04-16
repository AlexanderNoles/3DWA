const PixelationShader = {
    name: 'PixelationShader',
    
    uniforms: {
        'tDiffuse': { value: null },
        'pixelsPerUnit': { value: 16 }
    },

    vertexShader: `

    varying vec2 vUv;

    void main() {

        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

    }`,

    fragmentShader:`

    uniform sampler2D tDiffuse;
    uniform float pixelsPerUnit;
    varying vec2 vUv;

    void main() {
        float res = 0.1 / pixelsPerUnit;
        vec2 clampedUv = vec2(round(vUv.x / res), round(vUv.y / res)) * res;

        vec4 col = texture2D(tDiffuse, clampedUv);
        gl_FragColor = col;
    }`
};

export {PixelationShader};