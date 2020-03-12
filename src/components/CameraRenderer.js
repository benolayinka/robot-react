import * as THREE from 'three'
import React from 'react'
import Stats from 'three/examples/jsm/libs/stats.module.js'
import {getQuery} from '../scripts/utils'
import CannonDebugRenderer from '../scripts/cannonDebugRenderer'

const NEAR = 0.1, FAR = 600, FOV = 40, ASPECT = 16/9

class CameraRenderer extends React.Component {
    constructor(props) {
        super(props)
        this.cannonScene = props.cannonScene
        this.scene = this.cannonScene.scene
    }

    shouldComponentUpdate() {
        //Do not render() when props change, as props.scene changes should not result in DOM changes.
        return false
    }

    componentDidMount() {
        // Renderer
        this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, canvas: this.refs.canvas });

        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setClearColor( this.scene.background.color, 1 );
        this.renderer.shadowMap.enabled = false;

        var width = this.refs.canvas.clientWidth;
        var height = this.refs.canvas.clientHeight;

        // Camera
        this.camera = new THREE.PerspectiveCamera(
            FOV, //Field of view
            ASPECT,
            NEAR, //Near plane
            FAR, //Far plane
        );

        //Default birds-eye view
        this.camera.up.set(0,0,1);
        this.camera.position.copy( this.props.position );
        this.camera.lookAt( this.scene.position );

        this.resizeCanvasToDisplaySize()

        //prevent canvas scrolling
        var canvas = this.renderer.domElement

        //resize is handled in parent component
        window.addEventListener( 'resize', this.resizeCanvasToDisplaySize );
        this.step = this.step.bind(this);
        this.step();

        canvas.addEventListener("touchstart",  function(event) {event.preventDefault()}, { passive: false })
        canvas.addEventListener("touchmove",   function(event) {event.preventDefault()}, { passive: false })
        canvas.addEventListener("touchend",    function(event) {event.preventDefault()}, { passive: false })
        canvas.addEventListener("touchcancel", function(event) {event.preventDefault()}, { passive: false })

        //display stats if query parameter includes ?debug=true
        const query = getQuery();
        this.debug = 'debug' in query
        if(this.debug) {
            var stats = this.stats = new Stats();
            stats.showPanel( 0 );
            document.body.appendChild( stats.domElement );

            //debug renderer displays wireframe of cannon bodies
            //it gets updated in step function
            this.CannonDebugRenderer = new CannonDebugRenderer( this.cannonScene.scene, this.cannonScene.world );
        }
    }

    componentWillUnmount() {
        window.removeEventListener( 'resize', this.resizeCanvasToDisplaySize );
        cancelAnimationFrame(this.raf)
    }

    resizeCanvasToDisplaySize = ()=> {
        const canvas = this.renderer.domElement;
        // look up the size the canvas is being displayed
        const width = canvas.clientWidth;
        const height = canvas.clientHeight;

        // adjust displayBuffer size to match
        if (canvas.width !== width || canvas.height !== height) {
            // you must pass false here or three.js sadly fights the browser
            this.renderer.setSize(width, height, false);
            this.camera.aspect = width / height;
            this.camera.updateProjectionMatrix();
        }
    }

    step() {
        if(this.debug){
            this.stats.end()
            this.stats.begin()
            this.CannonDebugRenderer.update()
        }
        
        this.renderer.render(
            this.scene,
            this.camera
        );

        this.cannonScene.step()

        this.raf = requestAnimationFrame(this.step)
    }

    onClick = () => {
        //placeholder
    }

    render(){
        let canvasStyle = {
            width:'100%',
            height:'100%',
            position: 'absolute',
        }
        
        return (
            <canvas style={canvasStyle} ref='canvas' onClick={this.onClick}/>
        )
    }
}

CameraRenderer.defaultProps = {
  position: new THREE.Vector3(180, 100, 10),
};

export default CameraRenderer;