import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

var scene, camera, clock, renderer, mixer;
const actions = []; //Actions array triggered by play button

init();

function init(){

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
    clock = new THREE.Clock(); //Add animation timing clock

    renderer = new THREE.WebGLRenderer();
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.setAnimationLoop( render );
    document.body.appendChild( renderer.domElement );

    //Setup orbital camera
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 0, 0);
    controls.update();
    camera.position.z = 10;

    //Add light
    const color = 0xFFFFFF;
    const ambientLight = new THREE.AmbientLight(color, 0.1);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(color, 1);
    scene.add(directionalLight)

    //Animation control button
    const playButton = document.getElementById("playBtn");
    playButton.addEventListener('click', function(){
        actions.forEach(action => {
            action.timeScale = 1;
            action.clampWhenFinished = true;
            action.setLoop(0, 1);
            action.reset();
            action.play();
            });
    })

    //load model
    const loader = new GLTFLoader();
    loader.load('ship.glb', function (gltf) {
        const model = gltf.scene;
        scene.add(model);

        mixer = new THREE.AnimationMixer(model);
        const animations = gltf.animations;

        animations.forEach(clip => {
            const action = mixer.clipAction(clip);
            actions.push(action);
        });

    }, undefined, function (error) {

      console.error(error);

    });
}

//Resizing
window.addEventListener('resize', resize, false)

function resize()
{
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

//Animation
function render() 
{
    //Update animations
    if (mixer) {
        mixer.update(clock.getDelta());
    }

    renderer.render( scene, camera );
}

