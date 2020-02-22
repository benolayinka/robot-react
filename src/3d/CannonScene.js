import * as CANNON from 'cannon'
import * as THREE from 'three'
import Colors from '../scripts/colors'
import CannonDebugRenderer from '../scripts/cannonDebugRenderer'
import GamepadControls from '../scripts/GamepadControls'
import images from '../images'

var textureLoader = new THREE.TextureLoader()
var fontLoader = new THREE.FontLoader()

const FREQUENCY = 60

const ARENA_RADIUS = 300
const SKY_RADIUS = 400

var particlesPool = []
var particlesInUse = []

var up = new THREE.Vector3(0,0,1)

function Checkpoint(conditionFunc){
    this.completed = false
    this.conditionFunc = conditionFunc
}

Checkpoint.prototype.update = function(){
    if(this.conditionFunc()){
        this.completed = true
        this.update = null
    }
}

function Billboard(image1, image2) {

    this.mesh = new THREE.Object3D()

    this.angle = 0

    var size = this.size = 20
    var he = size / 2
    this.mass = 0

    var heightOffset = size / 10

	var cubeGeometry = new THREE.BoxGeometry(size,size,size);

    var textureText = textureLoader.load( image1 );

    var texturePic = textureLoader.load( image2 );

    var blankMaterial = new THREE.MeshBasicMaterial({color: Colors.white})

    var cubeMaterials = [
        new THREE.MeshLambertMaterial({map: texturePic}),  // Left side
        new THREE.MeshLambertMaterial({map: texturePic}), // Right side
        blankMaterial, // Top side
        blankMaterial,  // Bottom side
        new THREE.MeshLambertMaterial({map: textureText}), // Front side
        new THREE.MeshLambertMaterial({map: textureText}), // Back side
    ];

    var board = new THREE.Mesh(cubeGeometry,cubeMaterials);
    board.position.set(0, 0, heightOffset * 2)
    board.rotation.set(Math.PI/2, Math.PI/4, 0)

    this.board = board //save the sub object so we can rotate it later
    this.mesh.add(board)

    //create a shape equal to the geometry
    var vec = new CANNON.Vec3(he,he,he);
    var boxShape = new CANNON.Box(vec);

    this.body = new CANNON.Body({
        mass: this.mass,
    });

    //position the box at a 45 degree angle, and raised above the ground
    var offsetVec = new CANNON.Vec3(board.position.x, board.position.y, board.position.z)
    var offsetQuat = new CANNON.Quaternion(board.quaternion.x, board.quaternion.y, board.quaternion.z, board.quaternion.w)
    this.body.addShape(boxShape, offsetVec, offsetQuat)

    //posts
    var cylinderMaterial = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        })

    var faces = 12
    var cylinderGeom = new THREE.CylinderGeometry(this.size / 6, this.size / 6, this.size + heightOffset, faces)
    var cylinderMeshR = new THREE.Mesh(cylinderGeom, cylinderMaterial)
    cylinderMeshR.rotation.set(Math.PI/2, 0, 0)
    var cylinderMeshL = cylinderMeshR.clone()
    cylinderMeshR.position.set(size, 0, 0)
    this.mesh.add(cylinderMeshR)
    cylinderMeshL.position.set(-size, 0, 0)
    this.mesh.add(cylinderMeshL)

    var cylinderShape = new CANNON.Cylinder(this.size / 6, this.size / 6, this.size + heightOffset, faces)
    var m = cylinderMeshR
    offsetVec.set(m.position.x, m.position.y, m.position.z)
    //there's a bug here - are cannon and threejs rotation systems different?
    offsetQuat.setFromEuler(m.rotation.x + Math.PI/2, m.rotation.y, m.rotation.z)
    this.body.addShape(cylinderShape, offsetVec, offsetQuat)
    offsetVec.set(-m.position.x, m.position.y, m.position.z)
    this.body.addShape(cylinderShape, offsetVec, offsetQuat)
}

Billboard.prototype.update = function(){

    //rotate board mesh within object
    this.board.rotation.y += 0.001

    //copy board mesh to body
    var q = this.board.quaternion
    this.body.shapeOrientations[0].set(q.x, q.y, q.z, q.w)
    this.angle += .001
}

function Text(words, color, size, loadedFont) {

    this.mesh = new THREE.Object3D() //create parent object to center mesh

    var geometry = new THREE.TextGeometry( words, {
        font: loadedFont,
        size: size,
        height: 3,
        curveSegments: 12,
        //bevelEnabled: true,
        //bevelThickness: 1,
        //bevelSize: 1,
        //bevelOffset: 0,
        //bevelSegments: 5
    } );

    geometry.computeBoundingBox();
    geometry.computeVertexNormals();

    this.centerOffsetX = - 0.5 * ( geometry.boundingBox.max.x - geometry.boundingBox.min.x );
    this.centerOffsetY = - 0.5 * ( geometry.boundingBox.max.y - geometry.boundingBox.min.y );

    var mat = new THREE.MeshLambertMaterial({
        color:color,
    });

    this.textMesh = new THREE.Mesh(geometry, mat)
    this.textMesh.position.x = (this.centerOffsetX)
    this.textMesh.position.y = (this.centerOffsetY)
    this.mesh.add(this.textMesh)
}

Text.prototype.addAnimation = function(animationFunc, checkpoint){
    this.update = () => {
        if(checkpoint.completed){
            this.update = animationFunc
        }
    }
}

function ExplosionParticle(){
    var geom = new THREE.TetrahedronGeometry(3,0);
    var mat = new THREE.MeshBasicMaterial({
        color:0x009999,
        //shininess:0,
        //specular:0xffffff,
        //flatShading:true
    });
    this.mesh = new THREE.Mesh(geom,mat);
}

ExplosionParticle.prototype.explode = function(pos, color, scale){
  this.mesh.material.color = new THREE.Color( color);
  this.mesh.material.needsUpdate = true;
  this.mesh.scale.set(scale, scale, scale);
  let targetX = pos.x + (-1 + Math.random()*2)*10;
  let targetY = pos.y + (-1 + Math.random()*2)*10;
  let targetZ = pos.z + (-1 + Math.random()*2)*10;
  this.targetPosition = new THREE.Vector3(targetX, targetY, targetZ)
  this.speed = .1+Math.random()*.1;
  this.targetQuat = {x:Math.random()*12, y:Math.random()*12, z:Math.random()*12, w:Math.random()*12}
  this.targetScale = new THREE.Vector3(0.1, 0.1, 0.1)
  this.life = 100
}

ExplosionParticle.prototype.update = function(){
    this.life--
    this.mesh.scale.lerp(this.targetScale, this.speed)
    //this.mesh.quaternion.slerp(this.targetQuat, this.speed) //quats destroy the geometry
    this.mesh.position.lerp(this.targetPosition, this.speed)
    if(!this.life) {
        //movement is finished
        var parent = this.mesh.parent
        if(parent) parent.remove(this.mesh)
        this.mesh.scale.set(1,1,1)
        particlesPool.unshift(this)
        this.mesh.visible = false
    }
}

function Explosion(){
    this.mesh = new THREE.Object3D();
    particlesInUse = [];
}

Explosion.prototype.explode = function(pos, density, color, scale) {
    var nParticles = density;
    for (var i=0; i<nParticles; i++){
        var particle;
        if (particlesPool.length) {
            particle = particlesPool.pop();
        }else{
            particle = new ExplosionParticle();
        }
        particlesInUse.push(particle)
        this.mesh.add(particle.mesh);
        particle.mesh.visible = true;
        particle.mesh.position.y = pos.y;
        particle.mesh.position.x = pos.x;
        particle.mesh.position.z = pos.z;
        particle.explode(pos,color,scale);
    }
}

Explosion.prototype.update = function() {
    var nParticles = particlesInUse.length
    for (var i=0; i<nParticles; i++){
        var particle = particlesInUse[i]
        if(particle.mesh.visible)
        {
            particle.update()
        }
    }
}

function Sun(){

    //create a mesh to group sun and sunlight
    this.mesh = new THREE.Object3D()

    this.size = 20
    var geom = new THREE.SphereGeometry(this.size, 3, 3) //radius, hSegments, wSegments
    // create a material; a simple white material will do the trick
	var mat = new THREE.MeshBasicMaterial({
		color:Colors.white,
        //flatShading:true,
	});

    var sun = new THREE.Mesh(geom, mat)
    this.mesh.add(sun)

    var sunlight = new THREE.DirectionalLight(Colors.white, 0.5)
    sunlight.position.set(-SKY_RADIUS/4, -SKY_RADIUS/4, SKY_RADIUS/4)
    // sunlight.castShadow = true;
    // sunlight.shadow.camera.left = -10
    // sunlight.shadow.camera.right = 10
    // sunlight.shadow.camera.top = 10
    // sunlight.shadow.camera.bottom = -10
    // sunlight.shadow.camera.near = 1;
    // sunlight.shadow.camera.far = SKY_RADIUS
    // sunlight.shadow.mapSize.width = 8192/4;
    // sunlight.shadow.mapSize.height = 8192/4;
    this.mesh.add(sunlight)
}

function Cloud(){
	// Create an empty container that will hold the different parts of the cloud
	this.mesh = new THREE.Object3D();

    this.size = 10

	// create a cube geometry;
	// this shape will be duplicated to create the cloud
	//var geom = new THREE.BoxGeometry(this.size,this.size,this.size);
    var geom = new THREE.SphereGeometry(this.size)

	// create a material; a simple white material will do the trick
	var mat = new THREE.MeshLambertMaterial({
		color:Colors.red,
	});

	// duplicate the geometry a random number of times
	var nBlocs = 3+Math.floor(Math.random()*3);
	for (var i=0; i<nBlocs; i++ ){

		// create the mesh by cloning the geometry
		var m = new THREE.Mesh(geom, mat);

		// set the position and the rotation of each cube randomly
		m.position.x = i*15;
		m.position.y = Math.random()*10;
		m.position.z = Math.random()*10;
		m.rotation.z = Math.random()*Math.PI*2;
		m.rotation.y = Math.random()*Math.PI*2;

		// set the size of the cube randomly
		var s = .1 + Math.random()*.9;
		m.scale.set(s,s,s);

		// allow each cube to cast and to receive shadows
		m.castShadow = true;
		m.receiveShadow = true;

		// add the cube to the container we first created
		this.mesh.add(m);
	}
}

// Define a Sky Object
function Sky(){

    this.update = () => {
        this.angle += 0.005

        //move the sun in the sky
        this.sun.mesh.position.z = Math.sin(this.angle)*SKY_RADIUS - 50;
	    this.sun.mesh.position.x = Math.cos(this.angle)*SKY_RADIUS - 50;
        this.sun.mesh.rotation.z = this.angle

        //clouds drift up and down
        this.clouds.forEach((cloud) => {
            cloud.mesh.position.z += Math.cos(this.angle)*0.05;
        })
    }

    this.angle = 0

	// Create an empty container
	this.mesh = new THREE.Object3D();

    // add the sun
    this.sun = new Sun()
    this.sun.mesh.position.z = Math.sin(this.angle)*SKY_RADIUS;
	this.sun.mesh.position.x = Math.cos(this.angle)*SKY_RADIUS;
    this.mesh.add(this.sun.mesh)

    // Store clouds to move them in the sky
    this.clouds = []

	// choose a number of clouds to be scattered in the sky
	this.nClouds = 40;

	// To distribute the clouds consistently,
	// we need to place them according to a uniform angle
	var stepAngle = Math.PI / this.nClouds;

	// create the clouds
	for(var i=0; i<this.nClouds; i++){
		var c = new Cloud();

        this.clouds.push(c)

		// set the rotation and the position of each cloud;
		// for that we use a bit of trigonometry
		var a = stepAngle*i; // this is the final angle of the cloud
		var h = SKY_RADIUS //+ Math.random()*10; // this is the distance between the center of the axis and the cloud itself

		// Trigonometry!!! I hope you remember what you've learned in Math :)
		// in case you don't:
		// we are simply converting polar coordinates (angle, distance) into Cartesian coordinates (x, y)
		c.mesh.position.z = Math.sin(a)*h;
		c.mesh.position.x = Math.cos(a)*h;

		// rotate the cloud according to its position
		c.mesh.rotation.z = a + Math.PI/2;

		// for a better result, we position the clouds
		// at random horizontal depths inside of the scene
		c.mesh.position.y = 200-Math.random()*400;

		// we also set a random scale for each cloud
		var s = 1+Math.random()*2;
		c.mesh.scale.set(s,s,s);

		// do not forget to add the mesh of each cloud in the scene
		this.mesh.add(c.mesh);
	}
}

function Trash(){
    this.mesh = new THREE.Object3D();

    var size = this.size = 1
    var he = size / 2

    this.mass = 0.001

	// create a cube geometry;
	var geom = new THREE.BoxGeometry(size,size,size);

	var mat = new THREE.MeshBasicMaterial({
		color:Colors.white,
        //flatshading:true,
	});

    this.body = new CANNON.Body({
        mass: this.mass,
         });

    this.body.linearDamping = 0.9;
    this.body.angularDamping = 0.9

	// duplicate the geometry a random number of times
	var nBlocs = 3;
	for (var i=0; i<nBlocs; i++ ){

		// create the mesh by cloning the geometry
		var m = new THREE.Mesh(geom, mat);

		// set the position and the rotation of each cube randomly
		m.position.x = i;
		//m.position.y = Math.random()*10;
		//m.position.z = Math.random()*10;
		m.rotation.z = Math.random()*Math.PI*2;
		m.rotation.y = Math.random()*Math.PI*2;

		// set the size of the cube randomly
		var s = .1 + Math.random()*.9;
		m.scale.set(s,s,s);

		// allow each cube to cast and to receive shadows
		m.castShadow = true;
		m.receiveShadow = true;

		// add the cube to the container we first created
		this.mesh.add(m);

        //create a shape equal to the geometry
        var vec = new CANNON.Vec3(he*s,he*s,he*s);
        var boxShape = new CANNON.Box(vec);

        // create scaled shape
        var mVec = new CANNON.Vec3(m.position.x,m.position.y,m.position.z)
        var mQuat = new CANNON.Quaternion(m.quaternion.x, m.quaternion.y, m.quaternion.z, m.quaternion.w)
        this.body.addShape(boxShape, mVec, mQuat)
	}
}

function Ground(){
    // Create a matrix of height values
    var matrix = [];
    var sizeX = 64,
        sizeY = sizeX;
    for (var i = 0; i < sizeX; i++) {
        matrix.push([]);
        for (var j = 0; j < sizeY; j++) {
            var height = Math.cos(i/sizeX * Math.PI * 4) * Math.cos(j/sizeY * Math.PI * 4) * 2 + 4;
            if(i===0 || i === sizeX-1 || j===0 || j === sizeY-1)
                height = 20; //make walls tall
            matrix[i].push(height);
        }
    }

    // Create the heightfield
    var shape = new CANNON.Heightfield(matrix, {
        elementSize: ARENA_RADIUS * 2 / sizeX
    });

    var body = new CANNON.Body({ mass: 0 });

    body.addShape(shape);
    body.position.set(-sizeX * shape.elementSize / 2, sizeY * shape.elementSize / 2, 0);
    body.quaternion.setFromAxisAngle(
            new CANNON.Vec3(0, 0, 1),
            -Math.PI / 2
        );

    this.body = body

    var geometry = new THREE.Geometry();

    // create the material
	var material = new THREE.MeshLambertMaterial({
		color:Colors.blue,
		transparent:true,
		opacity:.6,
		//flatShading:true,
	});

    var v0 = new CANNON.Vec3();
    var v1 = new CANNON.Vec3();
    var v2 = new CANNON.Vec3();
    for (var xi = 0; xi < shape.data.length - 1; xi++) {
        for (var yi = 0; yi < shape.data[xi].length - 1; yi++) {
            for (var k = 0; k < 2; k++) {
                shape.getConvexTrianglePillar(xi, yi, k===0);
                v0.copy(shape.pillarConvex.vertices[0]);
                v1.copy(shape.pillarConvex.vertices[1]);
                v2.copy(shape.pillarConvex.vertices[2]);
                v0.vadd(shape.pillarOffset, v0);
                v1.vadd(shape.pillarOffset, v1);
                v2.vadd(shape.pillarOffset, v2);
                geometry.vertices.push(
                    new THREE.Vector3(v0.x, v0.y, v0.z),
                    new THREE.Vector3(v1.x, v1.y, v1.z),
                    new THREE.Vector3(v2.x, v2.y, v2.z)
                );
                var i = geometry.vertices.length - 3;
                geometry.faces.push(new THREE.Face3(i, i+1, i+2));
            }
        }
    }

    geometry.computeBoundingSphere();
    geometry.computeFaceNormals();

    this.mesh = new THREE.Mesh(geometry, material)

    // Allow the grounds to receive shadows
	this.mesh.receiveShadow = true;
}

function Tail(){
    var size = this.size = 5
    var he = size / 2

    var geometry = new THREE.BoxGeometry( size / 3, size / 3, size / 3);
    var material = new THREE.MeshLambertMaterial({
        color: Colors.red,
        //flatshading:true,
        });

    this.mesh = new THREE.Mesh(geometry, material)

    var vec = new CANNON.Vec3(he / 3, he / 3, he / 3)
    var shape = new CANNON.Box(vec)
    this.body = new CANNON.Body({
        mass: 0.0001,
        shape: shape,
        linearDamping: 0.01,
        angularDamping: 0.01,
    })
    this.body.position.set(-size,0,size)
}

function Robot(){
    //create group
    this.mesh = new THREE.Object3D()

    var size = 5
    var halfExtent = size / 2
    //create character box
    var boxBody = new CANNON.Body({
        mass: 100,
        position: new CANNON.Vec3(0, 0, 10),
        shape: new CANNON.Box(new CANNON.Vec3(halfExtent, halfExtent, halfExtent))
    });

    boxBody.linearDamping = 0.9;
    boxBody.angularDamping = 0.9

    //set body
    this.body = boxBody

    //body
    var geometry = new THREE.BoxGeometry( size, size, size );

    //bottom left, looking at rear
    geometry.vertices[4].y -= size / 6;
    //geometry.vertices[4].z += size / 6;

    //top left
    geometry.vertices[5].y -= size / 6;
    geometry.vertices[5].z -= size / 6;

    //bottom right
    geometry.vertices[6].y += size / 6;
    //geometry.vertices[6].z -= size / 6;

    //top right
    geometry.vertices[7].y += size / 6;
    geometry.vertices[7].z -= size / 6;

    var material = new THREE.MeshLambertMaterial({
        color: Colors.white,
        //flatshading:true,
        });

    var box = new THREE.Mesh( geometry, material );
    box.castShadow = true;
    box.receiveShadow = true;
    this.mesh.add(box)

    //head
    var geometry = new THREE.BoxGeometry( size / 2, size / 2, size / 2);
    var material = new THREE.MeshLambertMaterial({
        color: Colors.red,
        //flatshading:true,
        });
    var head = new THREE.Mesh( geometry, material )
    head.position.set(size/2,0,size/2)
    head.rotation.y = (Math.PI / 6)
    head.castShadow = true;
    head.receiveShadow = true;
    this.mesh.add(head)

    //feet
    var geometry = new THREE.BoxGeometry( size / 2, size, size / 3);
    var material = new THREE.MeshLambertMaterial({
        color: Colors.brownDark,
        //flatshading:true,
        });
    var footL = new THREE.Mesh( geometry, material )
    footL.position.set(0,size/2,-size/3)
    footL.rotation.z = (Math.PI / 2 + Math.PI / 12)
    this.mesh.add(footL)
    var footR = new THREE.Mesh( geometry, material )
    footR.position.set(0,-size/2,-size/3)
    footR.rotation.z = (Math.PI / 2 - Math.PI / 12)
    this.mesh.add(footR)
    footL.castShadow = footR.castShadow = true;
    footL.receiveShadow = footR.receiveShadow = true;

    //pointy spinner
    var geomPropeller = new THREE.BoxGeometry(size/6, size/6, size/6);
    geomPropeller.vertices[4].y-=size/12;
    geomPropeller.vertices[4].z+=size/12;
    geomPropeller.vertices[5].y-=size/12;
    geomPropeller.vertices[5].z-=size/12;
    geomPropeller.vertices[6].y+=size/12;
    geomPropeller.vertices[6].z+=size/12;
    geomPropeller.vertices[7].y+=size/12;
    geomPropeller.vertices[7].z-=size/12;
    var matPropeller = new THREE.MeshLambertMaterial({
        color:Colors.red,
        //flatShading:true
    });
    this.propeller = new THREE.Mesh(geomPropeller, matPropeller);
    this.propeller.position.set(0,size/2,0);
    this.mesh.add(this.propeller);

    this.propeller.castShadow = true;
    this.propeller.receiveShadow = true;

    //cross spinner
    this.blade = new THREE.Object3D()

    var geomBlade = new THREE.BoxGeometry(size/20,size/8,size/4);
    var matBlade = new THREE.MeshLambertMaterial({
        color:Colors.brownDark,
        //flatShading:true
    });
    var blade1 = new THREE.Mesh(geomBlade, matBlade);

    blade1.castShadow = true;
    blade1.receiveShadow = true;

    var blade2 = blade1.clone();
    blade2.rotation.x = Math.PI/2;

    blade2.castShadow = true;
    blade2.receiveShadow = true;

    this.blade.add(blade1);
    this.blade.add(blade2);
    this.blade.rotation.z = (Math.PI/2)
    this.blade.position.set(0,-size/2,0);
    this.mesh.add(this.blade)

    //cast and receive shadows
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;

    this.angle = 0

    this.vectorUp = new THREE.Vector3()
}

Robot.prototype.update = function(){

    //rotate mesh elements on the robot for animation
    this.angle += 0.02
    this.blade.rotation.y = this.angle
    this.propeller.rotation.y = -this.angle

    //monitor robot orientation and fix if tipping over
    this.vectorUp.set(0,0,1)
    this.vectorUp.applyQuaternion( this.mesh.quaternion )
    if(this.vectorUp.dot(up) < 0.5){ // TODO: also check if we are on the ground to allow some airtime tricks
        console.log('im falling over!')

        // Approach 1. This kind of works but you can still get stuck in weird positions
        // let av = this.body.angularVelocity
        // let factor = -0.9
        // this.body.angularVelocity.set(av.x * factor, av.y * factor, av.z * factor)
        // console.log(this.body.angularVelocity)


        // Approach 2. This works but is a bit awkward
        this.body.quaternion.set(0, 0, 0, 1) // force upright


        // Approach 3. Bounce back. This probably would work but I don't know physics
        // TODO: bounce back
        // let f = this.body.force
        // let quaternion = this.body.quaternion
        // let q = new CANNON.Vec3(quaternion.x, quaternion.y, quaternion.z)
        // let q_up = new CANNON.Vec3(0, 0, 0)
        //
        // // calculate worldPoint such that q moves in the direction of q_up
        // let worldPoint = new CANNON.Vec3(0, 0, 0)
        // console.log(f)
        //
        // // calculate
        // let f_apply = q.scale(-0.5);
        //
        // console.log('apply', f_apply)
        //
        // this.body.applyForce(f_apply, worldPoint)
    }

    // monitor robot out of bounds
    if (Math.abs(this.body.position.x) > ARENA_RADIUS || Math.abs(this.body.position.y) > ARENA_RADIUS) {
      console.log('im out of bounds!')
      this.respawn('random')
    }
}

Robot.prototype.respawn = function(position = 'random', looseTail = true){
  // respawns the robot
  // args:
  // - position: 'random', 'center', 'keep' or an object like {x: 10, y: 10, z: 10}
  // - bool looseTail: loose your tail or not when you respawn

  let z = 10 // spawn from the air
  let x, y

  if (position === 'center') {
    x = 0
    y = 0
  }
  else if (position === 'keep') {
    x = this.body.position.x
    y = this.body.position.y
  }
  else if (typeof(position) === 'object') {
    x = position.x
    y = position.y
    z = position.z ? position.z : z
  }
  else { // position is 'random' or undefined
    x = Math.random(-1 * (ARENA_RADIUS - 10), ARENA_RADIUS - 10)
    y = Math.random(-1 * (ARENA_RADIUS - 10), ARENA_RADIUS - 10)
  }

  if (looseTail) {
    // TODO
  }

  this.body.quaternion.set(0, 0, 0, 1)
  this.body.position.set(x, y, z)
  console.log('respawn at ', x, y, z)
}

export default class CannonScene{

    constructor(gamepadData){

        //stuff for controls
        this.gamepadData = gamepadData
        this.time = Date.now()

        this.objects = []
        this.checkpoints = []
        this.createScene()
        this.createWorld()
        this.createCharacter()
        this.createText()
        this.createExplosion()
        this.createTrash()
        this.createLights()
        this.createGround()
        this.createSky()
        this.createBillboards()
        this.createControls() //controls depend on some objects, create last

        //debug renderer displays wireframe of cannon bodies
        //it gets updated in step function
        this.CannonDebugRenderer = new CannonDebugRenderer( this.scene, this.world );
    }

    step() {
        this.updateVisuals()
        this.updatePhysics()
        this.updateCheckpoints()
        this.updateControls()
        var loc = document.location.href
        if(loc.includes('dev') || loc.includes('localhost')) {
            this.CannonDebugRenderer.update();
        }
    }

    //checkpoints are created with an update function that returns true when complete
    updateCheckpoints() {
        for(const checkpoint of this.checkpoints) {
            if(checkpoint.update)
                checkpoint.update()
        }
    }

    updateVisuals() {
        for (const object of this.objects) {
            const mesh = object.mesh
            const body = object.body
            const update = object.update

            //copy physics if object has a body
            if(body){
                mesh.position.copy(body.position)
                if(body.quaternion) {
                    mesh.quaternion.copy(body.quaternion)
                }
            }

            //run update function if it exists
            if(update && typeof(update) === 'function'){
                object.update()
            }
        }
    }

    updatePhysics() {
        var timeStep = 1 / FREQUENCY;
        this.world.step(timeStep)
    }

    updateControls() {
        if(!this.gamepadControls)
            return

        this.gamepadControls.update(Date.now() - this.time, this.gamepadData)
        this.time = Date.now();
    }

    addObject(obj) {
        this.objects.push(obj)
        if(obj.mesh){
            this.scene.add(obj.mesh)
        }

        if(obj.body)
            this.world.addBody(obj.body)
    }

    addCheckpoint(checkpoint) {
        this.checkpoints.push(checkpoint)
    }

    createControls(){
        this.gamepadControls = new GamepadControls(this.controlBody, this.controlObject)
        this.followObject = this.gamepadControls.getLookObject()
    }

    createScene(){
        var scene = this.scene = new THREE.Scene()
        scene.background = new THREE.Color(Colors.pink)
        scene.fog = new THREE.Fog(Colors.pink, ARENA_RADIUS, SKY_RADIUS + 100)
    }

    createWorld(){
        var world = this.world = new CANNON.World()
        world.gravity.set(0,0,-9.8)
        world.broadphase = new CANNON.NaiveBroadphase();
        world.solver.iterations = 10;

        world.defaultContactMaterial.contactEquationStiffness = 1e9;
        world.defaultContactMaterial.contactEquationRelaxation = 4;
        world.defaultContactMaterial.friction = 0
    }

    //todo move all billboards to single landscape element function
    createBillboards(){
        var imageText = images['slide1-text.png']
        var imagePic = images['slide1-pic.jpg']
        var billboard = new Billboard(imageText, imagePic)
        billboard.body.position.x = ARENA_RADIUS / 2
        //billboard.body.position.y = ARENA_RADIUS / 2
        billboard.body.position.z = billboard.size - billboard.size / 4
        this.addObject(billboard)

        var imageText = images['slide2-text.png']
        var imagePic = images['slide2-pic.png']
        var billboard2 = new Billboard(imageText, imagePic)
        billboard2.body.position.x = -ARENA_RADIUS / 2
        //billboard.body.position.y = ARENA_RADIUS / 2
        billboard2.body.position.z = billboard2.size - billboard2.size / 4
        this.addObject(billboard2)
    }

    //todo clean this up.. use helper functions
    createText(){
        fontLoader.load('/fonts/helvetiker_regular.typeface.json', ( font ) => {

            var words
            if('ontouchstart' in document.documentElement)
                words = 'use\ncontrols to\nmove around!\nvv'
            else
                words = 'use\nW,A,S,D to\nmove around!'

            var textDiana = new Text(words, Colors.white, 2, font) //words, color, size, font

            textDiana.animationFunc = function() {
                if(this.mesh.position.z > 100) {
                    this.mesh.parent.remove(this.mesh)
                    this.mesh.visible = false
                    this.update = null
                    return
                }
                this.mesh.position.z += 0.1
                this.mesh.rotation.z += 0.001
            }

            var checkpointFunc = () => {
                if(Math.abs(this.controlBody.position.x) > 1 || Math.abs(this.controlBody.position.y) > 1)
                    return true

                return false
            }

            var checkpoint = new Checkpoint(checkpointFunc)
            this.addCheckpoint(checkpoint)

            textDiana.addAnimation(textDiana.animationFunc, checkpoint)

            textDiana.mesh.rotation.x = Math.PI/2
            textDiana.mesh.rotation.y = -Math.PI/2
            textDiana.mesh.position.set(0, 0, 25)
            this.addObject(textDiana)
        } )

    }

    createExplosion(){
        for (var i=0; i<10; i++){
            var particle = new ExplosionParticle();
            particlesPool.push(particle);
        }
        this.explosion = new Explosion();
        this.addObject(this.explosion)
    }

    createTrash(){
        var nTrash = 20
        for(var i=0; i<nTrash; i++){
            var t = new Trash()
            var x = ARENA_RADIUS - Math.random() * ARENA_RADIUS * 2
            var y = ARENA_RADIUS - Math.random() * ARENA_RADIUS * 2
            t.body.position.set(x, y, 5)
            this.addObject(t)
            t.body.object = t

            t.body.callback = (e) => {
                if(e.body === this.controlBody) {
                    e.target.removeEventListener("collide", e.target.callback)
                    this.explosion.explode(e.target.position, 10, Colors.white, 1) //position, density, color, scale
                    let size = this.lastObject.size
                    let targetPosition = this.lastObject.mesh.localToWorld(new THREE.Vector3(-size, 0, 0))
                    e.target.position.set(targetPosition.x, targetPosition.y, targetPosition.z)
                    e.target.velocity.set(0,0,0)
                    e.target.angularVelocity.set(0,0,0)

                    let c1 = new CANNON.PointToPointConstraint(this.lastObject.body,new CANNON.Vec3(0,0,0),e.target, new CANNON.Vec3(-5,0,0));
                    this.world.addConstraint(c1);

                    this.lastObject = e.target.object;
                }
            }

            //attach box if it collides with controlBody
            t.body.addEventListener("collide", t.body.callback);

        }
    }

    createCharacter(){
        var character = new Robot()
        var tail = new Tail()

        this.addObject(character)
        this.addObject(tail)

        //attach tail to body with constraint to allow physics
        var c1 = new CANNON.ConeTwistConstraint(character.body, tail.body, {
            pivotA: new CANNON.Vec3(-5, 0, 0),
            pivotB: new CANNON.Vec3(-1, 0, 0),
            angle: Math.PI/4
        })
        this.world.addConstraint(c1);

        //set scene objects for follower
        this.controlObject = character.mesh
        this.controlBody = character.body

        this.lastObject = tail
    }

    createSky(){
        var sky = new Sky();
        this.addObject(sky)
    }

    createGround(){
        var ground = new Ground()
        this.addObject(ground)
    }

    createLights(){
        var hemisphereLight = new THREE.HemisphereLight(Colors.white,Colors.brownDark, 0.9)
        hemisphereLight.position.set(0,0,1) //set z coord up
        //this.scene.add(hemisphereLight)

        var ambient = new THREE.AmbientLight( Colors.white );
        this.scene.add( ambient );
    }
}
