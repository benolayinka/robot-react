import React, {useState} from 'react';
import * as THREE from 'three'
import * as CANNON from 'cannon-es'
import ThreeSceneRenderer from '@bit/benolayinka.benolayinka.three-scene-renderer'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { setContent, showEdges, setEdgeColor, setEdgeWidth } from '@bit/benolayinka.benolayinka.utils'
import ReactNipple from 'react-nipple'
import Loading from "../components/Loading"
import Colors from '../styles/Colors.scss'
import { threeToCannon } from 'three-to-cannon';

const NEAR = 0.01, FAR = 1000, FOV = 60, ASPECT = 16/9

var canvas, renderer, scene, camera, clock, mixer, controls

const gamepadData = {
    driveJoystickData: {x:0, y:0},
    lookJoystickData: {x:0, y:0},
    buttonsPressed: {0:false, 1:false, 2:false},
    keysPressed: {},
}

export default function Sim(){

    const [sceneLoaded, setSceneLoaded] = useState(false);

	function onGamepadEvent(evt, data){
        if(evt === 'driveJoystick'){
            this.gamepadData.driveJoystickData = data
        }
        else if(evt === 'lookJoystick'){
            this.gamepadData.lookJoystickData = data
        }
        else if(evt === 'button'){
            this.gamepadData.buttonsPressed[data.button] = data.pressed
        }
        else if(evt === 'mouse'){
            //placeholder
        }
        else if(evt === 'key'){
            this.gamepadData.keysPressed[data.key] = data.pressed
        }
	}

    function extendScene(props){

  		//trigger onLoaded callback when all assets are loaded
	    THREE.DefaultLoadingManager.onLoad = () => {
            setSceneLoaded(true)
		};

		({canvas, renderer} = props)

		scene = new THREE.Scene()

	  	camera = new THREE.PerspectiveCamera(FOV, ASPECT, NEAR, FAR);

	  	controls = new OrbitControls(camera, renderer.domElement);

		clock = new THREE.Clock()

	  	let loader = new GLTFLoader()

	  	loader.load('assets/goodrobot.glb', (gltf)=>{

            gltf.scene.traverse((child)=>{
                if(child.userData.ground){
                    console.log(threeToCannon(child))
                }
            })

			scene.add(gltf.scene)

			controls.zoomSpeed = 0.2
			controls.rotateSpeed = 0.2
			controls.enableKeys = false
			camera.near = 0.01
			camera.updateProjectionMatrix()
			camera.position.z += 6

			setContent(scene, camera, controls)

	  	})

	  	let spotLight = new THREE.SpotLight('white', 1)
	  	spotLight.position.set(45, 50, 15);
	  	scene.add(spotLight);

	  	let pointLight = new THREE.PointLight('white', 1)
	  	spotLight.position.set(0, 5, -5);
	  	scene.add(spotLight);

	  	var ambientLight = new THREE.AmbientLight('white', 1)
	  	scene.add(ambientLight)

	  	var light = new THREE.HemisphereLight( 'white', 'pink', 1 );
	  	scene.add(light)

		window.addEventListener('resize', handleWindowResize)

	  	handleWindowResize()

	  	animate()
  	}

    function animate(){

		var delta = clock.getDelta();

		if(mixer){
	  		mixer.update(delta)
		}

    	if(controls){
    		controls.update();
    	}

		renderer.render(scene, camera)

		requestAnimationFrame(animate)
  	}

    function handleWindowResize(){
        let width = canvas.clientWidth;
        let height = canvas.clientHeight;
        camera.aspect = width/height;
        camera.updateProjectionMatrix();
    }

    return (
        <div className='Sim' >
            <Loading loaded={sceneLoaded} timeout={1200}/>
            <div>
                <ThreeSceneRenderer 
                    className='h-100 w-100 position-absolute' 
                    adaptToDeviceRatio 
                    onMount={extendScene}
                />
            </div>
        </div>
    )
}