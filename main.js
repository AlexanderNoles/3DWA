import * as THREE from '/build/three.module.js';
import { OrbitControls } from '/jsm/controls/OrbitControls.js';
import { GLTFLoader } from '/jsm/loaders/GLTFLoader.js';
import GUI from '/jsm/libs/lil-gui.module.min.js';

//Post processing
import { EffectComposer } from '/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from '/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from '/jsm/postprocessing/ShaderPass.js';

import {GreyscaleShader} from '/shaders/Greyscale.js';
import {FlatColourShader} from '/shaders/FlatColour.js';
import {PixelationShader} from '/shaders/Pixelation.js';

import { OutputPass } from '/jsm/postprocessing/OutputPass.js';
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

var scene, camera, clock, renderer, mixer, isWireframe, gui, composer, shaderSettings, activePassIndex;
var buttonClick, explanationText;
const actions = []; //Actions array triggered by play button

function init(){

    //Load sound effects
    buttonClick = new Audio("/public/ButtonClick.wav");

    //Get explanation text
    explanationText = document.getElementById("explanationText");

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

    //Shader switching buttons
    //Needs to match the number of passes
    //If we have one post-proceess pass only look for first button
    //
    //We also set the explanation for this pass
    const passButton1 = document.getElementById("pass1");
    passButton1.addEventListener('click', function(){
        togglePass(1, "Value is the sum of all colours of a given pixel (i.e., (r + g + b)/3). This is useful for determining the contrast of an image or determing procedural colours that work well together. This effect works best on the 3rd model as it has prominent colours.");
    })

    const passButton3 = document.getElementById("pass2");
    passButton3.addEventListener('click', function(){
        togglePass(2, "This effect replaces all colours with a singular colour (red), utilizing the sum of the colours as a mask. This is an example of an effect you can create with only colour data.");
    })

    const passButton2 = document.getElementById("pass3");
    passButton2.addEventListener('click', function(){
        togglePass(3, "This Pixelation effect works by manipulating screen UVs. UVs are a type of coordinate system used for texture lookups, in this case the screen texture. By clamping UVs to cell centers we can get a single colour for a given cell or 'pixel'.");
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
        playButtonClick();
    })

    //Wireframe control button
    const wireframeButton = document.getElementById("wireBtn");
    wireframeButton.addEventListener('click', function(){
        setWireframe(!isWireframe);
        playButtonClick();
    })

    //Default load ship
    load('ship.glb', false);
}

init();

function load(modelName, playSound = true){

    modelName = "/public/" + modelName;

    //Play button click sound, unless we have been explicitly told not too
    if (playSound)
    {
        playButtonClick();
    }

    //Reset explanantion text
    explanationText.innerHTML = "";

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

    //Create shader settings, for use with lil gui
    const effectsFolder = gui.addFolder("Effects");

    //Create an object to be edited by lil-gui
    shaderSettings = {
        greyscaleIntensity: 1,
        maskStrength: 10,
        pixelsPerUnit: 16
    }

    //Add the effect passes
    //By default have them disabled

    //Value effect pass
    const greyscalePass = new ShaderPass(GreyscaleShader);
    greyscalePass.uniforms.intensity.value = 1;
    greyscalePass.enabled = false;
    composer.addPass(greyscalePass);

    const greyscaleFolder = effectsFolder.addFolder("Value");
    greyscaleFolder.add(shaderSettings, 'greyscaleIntensity', 0.0, 1.0, 0.01).name("Intensity").onChange(
        value => {
            greyscalePass.uniforms.intensity.value = value;
        }
    );
    greyscaleFolder.open();
    //

    //Flat colour pass
    const flatColourPass = new ShaderPass(FlatColourShader);
    flatColourPass.uniforms.maskStrength.value = 10;
    flatColourPass.enabled = false;
    composer.addPass(flatColourPass);

    const flatColourFolder = effectsFolder.addFolder("Flat Colour");
    flatColourFolder.add(shaderSettings, 'maskStrength', 0.0, 10, 0.01).name("Masking").onChange(
        value => {
            flatColourPass.uniforms.maskStrength.value = value;
        }
    );
    //
    
    //Pixelation Pass
    const pixelationPass = new ShaderPass(PixelationShader);
    pixelationPass.uniforms.pixelsPerUnit.value = 16;
    pixelationPass.enabled = false;
    composer.addPass(pixelationPass);

    const pixelationFolder = effectsFolder.addFolder("Pixelation");
    pixelationFolder.add(shaderSettings, 'pixelsPerUnit', 1, 64, 1).name("Pixels Per Unit").onChange(
        value => {
            pixelationPass.uniforms.pixelsPerUnit.value = value;
        }
    );
    //


    //Add an output pass
    const outputPass = new OutputPass();
    composer.addPass(outputPass);

    //Currently no active shader pass
    activePassIndex = -1;
}

//Toggle render pass function
//Passes an index which is used to lookup into a passes array on the composer
//Shader passes include all passes but the first (normal pass) and last (output pass)
//Store the current active pass so we can disable it when setting a new one active
function togglePass(newIndex, passExplanation)
{
    if(!isRealValue(composer)){
        return 0;
    }

    //Play sound
    playButtonClick();

    if(activePassIndex != -1){
        //Deactivate current shader pass
        composer.passes[activePassIndex].enabled = false;

        //Reset explanation text
        explanationText.innerHTML = "";
    }

    //Activate new pass
    //If within range of shader passes...
    if(newIndex > 0 && newIndex < (composer.passes.length-1)){
        //...and is not pass just disabled. Inside scope of first check so we can set activePassIndex back to -1 only in appropriate cases

        if(activePassIndex != newIndex)
        {
            composer.passes[newIndex].enabled = true;
            //Set current active pass index
            activePassIndex = newIndex;

            explanationText.innerHTML = passExplanation;
        }
        else
        {
            activePassIndex = -1;
        }
    }
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

function playButtonClick(){
    //Want to restart if sound is already playing, so buttons always produce some feeback
    if (buttonClick.paused) 
    {
        buttonClick.play();
    }
    else
    {
        buttonClick.currentTime = 0
    }
}