import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import GUI from 'three/examples/jsm/libs/lil-gui.module.min.js';

//Post processing
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';

import {GreyscaleShader} from '/shaders/Greyscale.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
//

/* Copied (with bug fix modification) from https://threejs.org/manual/#en/lights*/
class ColorGUIHelper {
    constructor(object, prop) {
      this.object = object;
      this.prop = prop;
    }
    get value() {
      return this.object[this.prop].getHexString();
    }

    set value(hexString) {
      this.object[this.prop].set(hexString);
    }
}

var scene, camera, clock, renderer, mixer, isWireframe, gui, composer;
const actions = []; //Actions array triggered by play button

function init(){

    //Setup switch model callbacks for buttons
    //Only do this on original init, otherwise things will be registered more than once
    const model1Button = document.getElementById("model1");
    model1Button.addEventListener('click', function(){
        load('ship.glb');
    })

    const model2Button = document.getElementById("model2");
    model2Button.addEventListener('click', function(){
        load('skull.glb');
    })

    const model3Button = document.getElementById("model3");
    model3Button.addEventListener('click', function(){
        load('creature.glb');
    })

    //Animation control buttons
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

    //Wireframe control button
    const wireframeButton = document.getElementById("wireBtn");
    wireframeButton.addEventListener('click', function(){
        setWireframe(!isWireframe);
    })

    //Default load ship
    load('ship.glb');
}

init();


function load(modelName){
    scene = new THREE.Scene();

    var startPos = new THREE.Vector3(0, 0, 10);
    var lightPos = new THREE.Vector3(-1, 1, 0);

    //Maintain camera position across model loading
    if(isRealValue(camera)){
        startPos = camera.position;

        //Normalize and match standard zoom, only maintain angle
        startPos.normalize();
        startPos.multiplyScalar(10);
    }

    camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
    clock = new THREE.Clock(); //Add animation timing clock

    //Apply render to render canvas
    if(isRealValue(renderer)){
        renderer.dispose();
    }

    renderer = new THREE.WebGLRenderer({antialias: true, canvas: renderCanvas});
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.setAnimationLoop( render );


    //Setup orbital camera
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 0, 0);
    //Match start pos
    camera.position.x = startPos.x;
    camera.position.y = startPos.y;
    camera.position.z = startPos.z;
    controls.update();

    //Add light
    const color = 0xFFFFFF;
    const ambientLight = new THREE.AmbientLight(color, 0.1);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(color, 1);
    //Match light pos
    directionalLight.position.x = lightPos.x;
    directionalLight.position.y = lightPos.y;
    directionalLight.position.z = lightPos.z;
    scene.add(directionalLight)

    //Create light editing GUI
    if(isRealValue(gui)){
        gui.destroy();
    }

    gui = new GUI();
    const ambientFolder = gui.addFolder("Ambient Light");
    ambientFolder.addColor(new ColorGUIHelper(ambientLight, 'color'), 'value').name('color');
    ambientFolder.add(ambientLight, 'intensity', 0.1, 1, 0.01);
    ambientFolder.open();

    const directionalFolder = gui.addFolder("Directional Light");
    directionalFolder.addColor(new ColorGUIHelper(directionalLight, 'color'), 'value').name('color');
    directionalFolder.add(directionalLight, 'intensity', 0.1, 5, 0.01);
    directionalFolder.open();

    //By default have wireframe mode disabled
    setWireframe(false);

    //load model
    const loader = new GLTFLoader();
    loader.load(modelName, function (gltf) {
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

    //Setup post processing
    if(isRealValue(composer)){
        composer.dispose();
    }

    composer = new EffectComposer(renderer);

    //Add default pass
    composer.addPass(new RenderPass(scene, camera));

    //Add the effect passes
    //By default have them disabled
    const effectPass = new ShaderPass(GreyscaleShader);
    composer.addPass(effectPass);

    //Add an output pass
    const outputPass = new OutputPass();
    composer.addPass(outputPass);
}

//Resizing
window.addEventListener('resize', resize, false)

function resize()
{
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);
}

//Animation
function render() 
{
    //Update animations
    if (mixer) {
        mixer.update(clock.getDelta());
    }

    composer.render();
}

//Wireframe
function setWireframe(enable)
{
    isWireframe = enable;

    //Traverse the scene setting their wireframe flag based on input
    scene.traverse(function(object)
    {
        if (object.isMesh)
        {
            object.material.wireframe = enable;
        }
    });
}

//Helper functions
function isRealValue(obj)
{
    return obj && obj !== 'null' && obj !== 'undefined';
}