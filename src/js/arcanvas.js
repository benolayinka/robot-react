function render() {

	var renderer	= new THREE.WebGLRenderer({
		canvas: document.getElementById("canvas"),
		antialias: true,
		alpha: true
	});

	renderer.setClearColor(new THREE.Color('lightgrey'), 0)

	var cWidth = document.getElementById("canvasdiv").offsetWidth;
	var cHeight = document.getElementById("canvasdiv").offsetHeight;
	renderer.setSize( cWidth, cHeight );

	// array of functions for the rendering loop
	var onRenderFcts= [];

	// init scene and camera
	var scene	= new THREE.Scene();

	//////////////////////////////////////////////////////////////////////////////////
	//		Initialize a basic camera
	//////////////////////////////////////////////////////////////////////////////////

	// Create a camera
	var camera = new THREE.Camera();
	//scene.add(camera);

	////////////////////////////////////////////////////////////////////////////////
	//          handle arToolkitSource
	////////////////////////////////////////////////////////////////////////////////

	//empty init since we are hacking dom element
	var arToolkitSource = new THREEx.ArToolkitSource({})

	arToolkitSource.domElement = document.getElementById("streamingremotevideo");

	//this event tells the ar toolkit to render
	arToolkitSource.ready = true;
	window.dispatchEvent(new CustomEvent('arjs-video-loaded', {
        detail: {
            component: document.querySelector('#streamingremotevideo'),
        },
    }));

	// handle resize
	window.addEventListener('resize', function(){
		onResize()
	})

	function onResize(){
		var cWidth = document.getElementById("canvasdiv").offsetWidth;
		var cHeight = document.getElementById("canvasdiv").offsetHeight;
		renderer.setSize( cWidth, cHeight );
	}
	////////////////////////////////////////////////////////////////////////////////
	//          initialize arToolkitContext
	////////////////////////////////////////////////////////////////////////////////


	// create atToolkitContext
	var arToolkitContext = new THREEx.ArToolkitContext({
		// cameraParametersUrl: 'data/camera_para.dat',
		cameraParametersUrl: '/data/markers/camera_para.dat',
		detectionMode: 'mono',
	})
	// initialize it
	arToolkitContext.init(function onCompleted(){
		// copy projection matrix to camera
		camera.projectionMatrix.copy( arToolkitContext.getProjectionMatrix() );
	})

	// update artoolkit on every frame
	onRenderFcts.push(function(){
		if( arToolkitSource.ready === false )	return

		arToolkitContext.update( arToolkitSource.domElement )

		// update scene.visible if the marker is seen
		scene.visible = camera.visible
	})

	////////////////////////////////////////////////////////////////////////////////
	//          Create a ArMarkerControls
	////////////////////////////////////////////////////////////////////////////////

	// init controls for camera
	var markerControls = new THREEx.ArMarkerControls(arToolkitContext, camera, {
		type : 'pattern',
		patternUrl : '/data/markers/patt.kanji',
		// patternUrl : THREEx.ArToolkitContext.baseURL + '../data/data/patt.kanji',
		// as we controls the camera, set changeMatrixMode: 'cameraTransformMatrix'
		changeMatrixMode: 'cameraTransformMatrix'
	})
	// as we do changeMatrixMode: 'cameraTransformMatrix', start with invisible scene
	scene.visible = false

	//////////////////////////////////////////////////////////////////////////////////
	//		add an object in the scene
	//////////////////////////////////////////////////////////////////////////////////

	// add a torus knot
	var geometry	= new THREE.CubeGeometry(1,1,1);
	var material	= new THREE.MeshNormalMaterial({
		transparent : true,
		opacity: 0.5,
		side: THREE.DoubleSide
	});
	var mesh	= new THREE.Mesh( geometry, material );
	mesh.position.y	= geometry.parameters.height/2
	scene.add( mesh );


	// Create a material
	var textureLoader = new THREE.TextureLoader();
	var map = textureLoader.load('/assets/texture.png');
	var material = new THREE.MeshPhongMaterial({map: map});

	var objLoader = new THREE.OBJLoader();
	objLoader.load('/assets/stitch.OBJ', function ( object ) {

		// For any meshes in the model, add our material.
		object.traverse( function ( node ) {

			if ( node.isMesh ) {
				node.material = material;
			}

		} );

		object.scale.x = .2
		object.scale.y = .2
		object.scale.z = .2

		// Add the model to the scene.
		scene.add( object );

		onRenderFcts.push(function(delta){
			object.rotation.y += Math.PI*delta
		})
	} );

	//////////////////////////////////////////////////////////////////////////////////
	//		ben add a static ortho object scene for HUD
	//////////////////////////////////////////////////////////////////////////////////

	var static_scene = new THREE.Scene();

	var static_camera = new THREE.OrthographicCamera( cWidth / -1, cWidth / 1, cHeight / 1, cHeight / -1, -50, 100 );

	var side = 0.1 * cWidth;

	var static_material	= new THREE.MeshNormalMaterial({
		transparent : true,
		opacity: 0.5,
		side: THREE.DoubleSide
	});

    var text_mesh

    var fontLoader = new THREE.FontLoader();

	fontLoader.load( '/data/fonts/Bebas_regular.typeface.json', function ( font ) {

		var text_geometry = new THREE.TextGeometry( 'Good Robot', {
			font: font,
			size: cWidth > 400 ? 50 : 16,
			height: 5,
			curveSegments: 12,
			bevelEnabled: true,
			bevelThickness: 10,
			bevelSize: 8,
			bevelOffset: 0,
			bevelSegments: 5
		} );

		text_geometry.computeBoundingBox();
		text_geometry.computeVertexNormals();

		var centerOffset = - 0.5 * ( text_geometry.boundingBox.max.x - text_geometry.boundingBox.min.x );

		text_mesh = new THREE.Mesh( text_geometry, static_material );
		text_mesh.position.x = cWidth / - 1 + side;
		text_mesh.position.y = cHeight / 1 - side * 1.5;
		text_mesh.position.z = 0;

		text_mesh.rotation.x = 0;
		text_mesh.rotation.y = Math.PI * 2;

		static_scene.add( text_mesh )

		//wait for text to load to animate
		var anim = function () {
			requestAnimationFrame( anim );

			onRenderFcts.forEach(function(onRenderFct){
				onRenderFct()
			})
		};

		anim()

	} );


	onRenderFcts.push(function(delta){
			text_mesh.rotation.x += .01;
			renderer.autoClear = false;
			renderer.render(static_scene, static_camera );
		})


	//////////////////////////////////////////////////////////////////////////////////
	//		render the whole thing on the page
	//////////////////////////////////////////////////////////////////////////////////

	// render the scene
	onRenderFcts.push(function(){
		renderer.render( scene, camera );
	})
}