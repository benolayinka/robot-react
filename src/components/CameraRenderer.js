import * as THREE from 'three'
import React from 'react'
import Stats from 'three/examples/jsm/libs/stats.module.js'

const NEAR = 0.1, FAR = 600, FOV = 40

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
            width / height, //Aspect ratio
            NEAR, //Near plane
            FAR, //Far plane
        );

        //Default birds-eye view
        this.camera.up.set(0,0,1);
        const { position } = this.props;
        this.camera.position.set( position[0], position[1], position[2] );
        this.camera.lookAt( this.scene.position );

        this.resizeCanvasToDisplaySize()

        //prevent canvas scrolling
        var canvas = this.renderer.domElement

        canvas.addEventListener( 'resize', this.resizeCanvasToDisplaySize );
        this.step = this.step.bind(this);
        this.step();

        canvas.addEventListener("touchstart",  function(event) {event.preventDefault()}, { passive: false })
        canvas.addEventListener("touchmove",   function(event) {event.preventDefault()}, { passive: false })
        canvas.addEventListener("touchend",    function(event) {event.preventDefault()}, { passive: false })
        canvas.addEventListener("touchcancel", function(event) {event.preventDefault()}, { passive: false })

        var loc = document.location.href
        if(loc.includes('dev') || loc.includes('localhost')) {
            var stats = this.stats = new Stats();
            stats.showPanel( 0 );
            document.body.appendChild( stats.domElement );
        }
    }

    componentWillUnmount() {
        var canvas = this.renderer.domElement
        canvas.removeEventListener( 'resize', this.resizeCanvasToDisplaySize );
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
        this.raf = requestAnimationFrame(this.step)

        if(this.stats)
            this.stats.begin()
        
        this.renderer.render(
            this.scene,
            this.camera
        );

        this.cannonScene.step()

        if(this.stats)
            this.stats.end()
    }

    onClick = () => {
        //placeholder
    }

    render(){
        let canvasStyle = {
            width:'100%',
            height:'100%',
        }
        
        return (
            <canvas style={canvasStyle} ref='canvas' onClick={this.onClick}/>
        )
    }
}

CameraRenderer.defaultProps = {
  position: [180, 100, 10],
};

export default CameraRenderer;