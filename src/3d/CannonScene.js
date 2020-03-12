import * as CANNON from 'cannon'
import * as THREE from 'three'
import CheckpointHolder from './CheckpointHolder'
import { Line2 } from 'three/examples/jsm/lines/Line2.js';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';
import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry.js';
import { GeometryUtils } from 'three/examples/jsm/utils/GeometryUtils.js';
import {BufferGeometryUtils} from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import GamepadControls from '../scripts/GamepadControls'
import {TweenMax, Linear} from 'gsap'
import Colors from '../styles/Colors.scss'
import {Appear, Vanish} from './MeshAnimations'
var RoundedBoxGeometry = require('three-rounded-box')(THREE)

const texturePromiseLoader = promisifyLoader(new THREE.TextureLoader())
const fontPromiseLoader = promisifyLoader(new THREE.FontLoader())

const NEAR = 0.1, FAR = 600, FOV = 40, ASPECT = 16/9

const FREQUENCY = 60

const ARENA_RADIUS = 300
const SKY_RADIUS = 400

const FOLLOW_DISTANCE = 45
const FOLLOW_ANGLE = Math.PI / 8

var particlesPool = []
var particlesInUse = []

var up = new THREE.Vector3(0,0,1)

var groundMaterial = new CANNON.Material("groundMaterial");
var frictionMaterial = new CANNON.Material("frictionMaterial")

//set a follow distance and angle and get height, minimum visible dist
//this should be a class function for CSObjects
function calculateFollowParams(followObj){
        if(!followObj.followParams || !followObj.followParams.distance || !followObj.followParams.angle) {
            console.error('follow params not set')
            return
        }
        const params = followObj.followParams
        const dist = params.distance
        const angle = params.angle
        let height = params.height = Math.tan(angle) * dist

        //get angle to highest, furthest point of object
        let a = height - followObj.size.height / 2
        let b = dist + followObj.size.depth / 2
        let viewAngle = Math.atan(a/b)

        let bigHeight = height + followObj.size.height / 2
        let bigD = bigHeight / Math.tan(viewAngle)

        //min view distance is where object stops blocking ground in front
        params.minViewDistance = bigD - dist
    }

function calculateSizeFromGeometry(geometry){
    geometry.computeBoundingBox()
    return {
        width: geometry.boundingBox.max.x - geometry.boundingBox.min.x,
        height: geometry.boundingBox.max.y - geometry.boundingBox.min.y,
        depth: geometry.boundingBox.max.z - geometry.boundingBox.min.z
    }
}

function promisifyLoader ( loader, onProgress ) {
  function promiseLoader ( url ) {
    return new Promise( ( resolve, reject ) => {
      loader.load( url, resolve, onProgress, reject );
    } );
  }

  return {
    originalLoader: loader,
    load: promiseLoader,
  };
}

function Platform() {
    const length = 50
    const width = length
    const depth = 5
    var geometry = new RoundedBoxGeometry( width, length, depth , 2 , 5 )
    var material = new THREE.MeshLambertMaterial( { color: Colors.pink } );
    this.mesh = new THREE.Mesh(geometry, material)

    this.body = new CANNON.Body({
        mass: 0,
        shape: new CANNON.Box(new CANNON.Vec3(width/2, length/2, depth/2)),
        material: groundMaterial,
    })

}

function Hippo() {
    var torsoSize = 5
    var torsoHe = torsoSize / 2
    var torsoMass = 10

    this.mesh = new THREE.Object3D()

    const geoms = []
    var material = new THREE.MeshLambertMaterial({color: Colors.blue})
    const eyeWhiteMaterial = new THREE.MeshLambertMaterial({color: Colors.white})
    const eyeBrownMaterial = new THREE.MeshLambertMaterial({color: Colors.brownDark})

    //shape translation vec
    const mVec = new CANNON.Vec3()

    //torso
    var shape = new CANNON.Box(new CANNON.Vec3(torsoHe, torsoHe, torsoHe))
    var torsoBody = this.body = new CANNON.Body({
        mass: torsoMass,
        shape: shape,
        //linearDamping: 0.5,
        //angularDamping: 0.5,
        material: frictionMaterial,
    })

    var torsoGeometry = new THREE.BoxBufferGeometry(torsoSize, torsoSize, torsoSize)
    geoms.push(torsoGeometry)
    
    //legs
    const numLegs = 4
    const legSize = torsoSize/5
    const legHe = legSize / 2
    const legShape = new CANNON.Box(new CANNON.Vec3(legHe, legHe, legHe))

    const legGeom = new THREE.BoxBufferGeometry(legSize)

    for (var i=0; i<numLegs; i++){
        const x = i % 2 === 0 ? -torsoHe + legHe : torsoHe - legHe
        const y = i < numLegs/2 ? -torsoHe + legHe : torsoHe - legHe
        mVec.set(x, y, - torsoHe - legHe)
        this.body.addShape(legShape, mVec)

        var geom = legGeom.clone()
        geom.translate(mVec.x, mVec.y, mVec.z)

        geoms.push(geom)
    }

    //lower jaw
    const lowerJawGeom = new THREE.BoxBufferGeometry(torsoSize, torsoSize, 1/8 * torsoSize)
    const ly = torsoSize
    let lz = -torsoSize / 3

    const lowerJawShape = new CANNON.Box(new CANNON.Vec3(torsoHe, torsoHe, 1/8 * torsoHe))
    mVec.set(0, ly, lz)
    this.body.addShape(lowerJawShape, mVec)

    lowerJawGeom.translate(mVec.x, mVec.y, mVec.z)
    geoms.push(lowerJawGeom)

    //upper jaw
    const upperJawGeom = new THREE.BoxBufferGeometry(torsoSize, torsoSize, 3/4 * torsoSize)
    let y = torsoSize
    let z = torsoSize / 3

    const upperJawShape = new CANNON.Box(new CANNON.Vec3(torsoHe, torsoHe, 3/4 * torsoHe))
    mVec.set(0, y, z)
    this.body.addShape(upperJawShape, mVec)

    upperJawGeom.translate(mVec.x, mVec.y, mVec.z)
    geoms.push(upperJawGeom)

    //nostrils
    const numNose = 2
    const noseSize = legSize
    const noseHe = noseSize/2

    const noseGeom = new THREE.BoxBufferGeometry(noseSize, noseSize, noseSize)
    const noseShape = new CANNON.Box(new CANNON.Vec3(noseHe, noseHe, noseHe))

    for (var i=0; i<numNose; i++){
        const x = i % 2 === 0 ? -torsoHe + noseHe : torsoHe - noseHe
        const y = torsoSize + torsoSize / 2 - noseSize/2
        const z = torsoSize / 3 + (3/4 * torsoSize) / 2 + noseSize / 2
        mVec.set(x, y, z)
        this.body.addShape(legShape, mVec)

        var geom = legGeom.clone()
        geom.translate(mVec.x, mVec.y, mVec.z)

        geoms.push(geom)
    }

    //head
    const headSize = torsoSize/2
    const headHe = headSize/2

    const headShape = new CANNON.Box(new CANNON.Vec3(torsoHe, headHe, headHe))
    mVec.set(0, headSize, torsoSize/2 + headSize/2)
    this.body.addShape(headShape, mVec)

    const headGeom = new THREE.BoxBufferGeometry(torsoSize, headSize, headSize)
    headGeom.translate(mVec.x, mVec.y, mVec.z)
    geoms.push(headGeom)

    //eyes
    const numEyes = 2
    const eyeSize = legSize * 1.5
    const eyeHe = eyeSize/2

    const eye = new THREE.Object3D()
    const eyeGeom = new THREE.CircleBufferGeometry(eyeHe)
    eyeGeom.rotateX(Math.PI + Math.PI/2).translate(0,0.01, 0) //z fighting
    const eyeOuter = new THREE.Mesh(eyeGeom, eyeWhiteMaterial)
    const innerGeom = eyeGeom.clone().scale(0.5,1,1).translate(0,0.1,0)
    const eyeInner = new THREE.Mesh(innerGeom, eyeBrownMaterial)
    eye.add(eyeOuter)
    eye.add(eyeInner)
    for (var i=0; i<numEyes; i++){
        const x = i % 2 === 0 ? -eyeSize : eyeSize
        const y = torsoSize/2 + headSize/2
        const z = torsoSize/2 + headSize/2
        var eyeMesh = eye.clone()
        eyeMesh.position.set(x,y,z)
        this.mesh.add(eyeMesh)
    }

    //ears
    const numEars = 2
    const earSize = legSize
    const earHe = eyeSize/2

    const earGeom = new THREE.BoxBufferGeometry(earSize, earSize, earSize)
    const earShape = new CANNON.Box(new CANNON.Vec3(earHe, earHe, earHe))

    for (var i=0; i<numEars; i++){
        const x = i % 2 === 0 ? -earSize : earSize
        mVec.set(x, headSize, torsoSize/2 + headSize + earSize/2) //use head position
        this.body.addShape(legShape, mVec)

        var geom = legGeom.clone()
        geom.translate(mVec.x, mVec.y, mVec.z)

        geoms.push(geom)
    }

    //merge all geoms and create mesh

    const mergedGeometry = BufferGeometryUtils.mergeBufferGeometries(
      geoms, false);
    
    const mesh = new THREE.Mesh(mergedGeometry, material)
    this.mesh.add(mesh)

}

function Line(to, from){

    // Position and THREE.Color Data

    var positions = [];
    var colors = [];

    for(var i = 0; i<100; i++) {
        positions.push(i, Math.cos(i), 0)
    }

    // positions.push(from.x, from.y, from.z)
    // positions.push(to.x, to.y, to.z)
    // positions.push(to.x * 2, to.y*2, to.z*2)

    // Line2 ( LineGeometry, LineMaterial )

    var geometry = this.geometry = new LineGeometry();
    geometry.setPositions( positions );

    geometry.maxInstancedCount = 0

    var matLine = new LineMaterial( {

        color: Colors.white,
        linewidth: 5, // in pixels
        resolution:  new THREE.Vector2(window.innerWidth, window.innerHeight),// to be set by renderer, eventually
        dashed: true,

    } );

    var line = new Line2( geometry, matLine );
    line.computeLineDistances();
    line.scale.set( 1, 1, 1 );

    this.mesh = line
}

function Billboard(words) {
    this.mesh = new THREE.Object3D()

    this.angle = 0

    var size = this.size = 20
    var he = size / 2
    this.mass = 0

    var heightOffset = this.size / 6

    var geometry = new RoundedBoxGeometry( size, size, size , 2 , 5 )
    
    //basic material
    var material = new THREE.MeshLambertMaterial( { color: Colors.pink } );

    var board = new THREE.Mesh( geometry, material ) ;

    this.board = board //save the sub object so we can rotate it later
    this.board.position.z = heightOffset
    this.mesh.add(board)

    if(!words)
        return

    fontPromiseLoader.load('/fonts/roboto_mono_bold.typeface.json')
    .then( ( font ) => {

        var options = ({
            size: 1,
            height: 2,
            color: Colors.white,
        })

        var text = new Text(words, font, options) //words, color, size, font

        text.mesh.rotation.x = Math.PI/2
        text.mesh.rotation.y = -Math.PI/2

        text.mesh.position.x = -this.size / 2
        text.mesh.position.z = heightOffset
        this.mesh.add(text.mesh)

    })
}

Billboard.prototype.update = function(){
    //rotate board mesh
    this.mesh.rotation.z += 0.001
}

function IntroText(font){
    var words
    if('ontouchstart' in document.documentElement)
        words = 'use\ncontrols to\nmove around!\nvv'
    else
        words = 'use\nW,A,S,D keys to\nmove around!'

    var options = ({
        size: 2,
        height: 2,
        color: Colors.white,
    })

    return new Text(words, font, options) //words, color, size, font
}

function HippoText(font){
    const words = 'Humans litter\n32 million\ntons of\nplastic per\nyear.\nThats 12.8M\nHippos!'
    var options = ({
        size: 2,
        height: 2,
        color: Colors.white,
    })
    return new Text(words, font, options) //words, color, size, font
}

function Text(words, loadedFont, options) {

    options	= options || {
        color: Colors.white,
		size		: 3,
		height		: 0.4,
	}

    //must specify font
    options.font = loadedFont

	// create the geometry
	var geometry = new THREE.TextGeometry(words, options)

	// center the geometry
    geometry.computeBoundingBox();
	geometry.center()

    this.size = calculateSizeFromGeometry(geometry)

	// create a mesh with it
	var material	= new THREE.MeshLambertMaterial({color:options.color})
	this.mesh	= new THREE.Mesh(geometry, material)
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
    this.size = 10

    //create a merged geometry to reduce the number of meshes drawn
    var geoms = []

	// duplicate the geometry a random number of times
	var nBlocs = 3+Math.floor(Math.random()*3);
	for (var i=0; i<nBlocs; i++ ){

        // create a cube geometry;
        // this shape will be duplicated to create the cloud
        //var geom = new THREE.BoxGeometry(this.size,this.size,this.size);
        var geom = new THREE.SphereBufferGeometry(this.size)
        geom.translate(i*15, Math.random()*10, Math.random()*10)

        //rotation doesn't matter for sphere
        //geom.rotateX(Math.random()*Math.PI*2)

        //scale randomly
        var s = .1 + Math.random()*.9;
        geom.scale(s,s,s);

        geoms.push(geom)
	}

    const mergedGeometry = BufferGeometryUtils.mergeBufferGeometries(
      geoms, false);

	var mat = new THREE.MeshLambertMaterial({
		color:Colors.red,
	});

    this.mesh = new THREE.Mesh(mergedGeometry, mat)

}

// Define a Sky Object
function Sky(){

    this.angle = Math.PI/2 + Math.PI/4 //sun starting pos

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

		var a = stepAngle*i; // this is the final angle of the cloud
		var h = SKY_RADIUS // this is the distance between the center of the axis and the cloud itself

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

Sky.prototype.update = function(){
    this.angle += 0.005

    //move the sun in the sky
    //this.sun.mesh.position.z = Math.sin(this.angle)*SKY_RADIUS - 50;
    //this.sun.mesh.position.x = Math.cos(this.angle)*SKY_RADIUS - 50;
    this.sun.mesh.position.z += Math.cos(this.angle)*0.1
    this.sun.mesh.rotation.z = this.angle

    //clouds drift up and down
    this.clouds.forEach((cloud) => {
        cloud.mesh.position.z += Math.cos(this.angle)*0.05;
    })
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
	});

    this.body = new CANNON.Body({
        mass: this.mass,
         });

    this.body.linearDamping = 0.9;
    this.body.angularDamping = 0.9

	// duplicate the geometry
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
            //var height = Math.cos(i/sizeX * Math.PI * 4) * Math.cos(j/sizeY * Math.PI * 4) * 2 + 4;
            //a bumpy floor causes occasional weirdness between box and surface
            var height = 0
            if(i===0 || i === sizeX-1 || j===0 || j === sizeY-1)
                height = 20; //make walls tall
            matrix[i].push(height);
        }
    }

    // Create the heightfield
    var shape = new CANNON.Heightfield(matrix, {
        elementSize: ARENA_RADIUS * 2 / sizeX
    });

    var body = new CANNON.Body({ mass: 0, material: groundMaterial });

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

    var size = this.size = 5
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

    this.size = calculateSizeFromGeometry(geometry)

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

    var box = new THREE.Mesh( geometry, material )
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
    this.mesh.add(head)

    //feet
    var geometry = new THREE.BoxGeometry( size / 2, size, size / 3);
    var material = new THREE.MeshLambertMaterial({
        color: Colors.brownDark,
        //flatshading:true,
        });
    var footL = new THREE.Mesh( geometry, material )
    footL.position.set(0,size/2,-size/3 -0.001) //offset z to prevent z fighting
    footL.rotation.z = (Math.PI / 2 + Math.PI / 12)
    this.mesh.add(footL)
    var footR = footL.clone()
    footR.position.set(0,-size/2,-size/3-0.001)
    footR.rotation.z = (Math.PI / 2 - Math.PI / 12)
    this.mesh.add(footR)

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

    //cross spinner
    this.blade = new THREE.Object3D()

    var geomBlade = new THREE.BoxGeometry(size/20,size/8,size/4);
    var matBlade = new THREE.MeshLambertMaterial({
        color:Colors.brownDark,
        //flatShading:true
    });
    var blade1 = new THREE.Mesh(geomBlade, matBlade);

    var blade2 = blade1.clone();
    blade2.rotation.x = Math.PI/2;

    this.blade.add(blade1);
    this.blade.add(blade2);
    this.blade.rotation.z = (Math.PI/2)
    this.blade.position.set(0,-size/2,0);
    this.mesh.add(this.blade)

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

    constructor(gamepadData, onLoaded){

        //callback when scene is loaded
        this.onLoaded = onLoaded || function(){}

        //stuff for controls
        this.gamepadData = gamepadData
        this.time = Date.now()

        this.init()
    }

    init() {
        THREE.Object3D.DefaultUp = up

        THREE.DefaultLoadingManager.onStart = function ( url, itemsLoaded, itemsTotal ) {
            console.log( 'Started loading file: ' + url + '.\nLoaded ' + itemsLoaded + ' of ' + itemsTotal + ' files.' );
        };

        THREE.DefaultLoadingManager.onProgress = function ( url, itemsLoaded, itemsTotal ) {
            console.log( 'Loaded file: ' + url + '.\nLoaded ' + itemsLoaded + ' of ' + itemsTotal + ' files.' );
        };

        THREE.DefaultLoadingManager.onError = function ( url ) {
            console.log( 'There was an error loading ' + url );
        };

        //trigger onLoaded callback when all assets are loaded
        THREE.DefaultLoadingManager.onLoad = () => {
            console.log( 'Done loading ');
            this.onLoaded()
        };

        this.cameraProps = {
            near: NEAR,
            far: FAR,
            fov: FOV,
        }

        this.objects = []
        this.createScene()
        this.createWorld()
        this.createCheckpoints()
        this.createCharacter()
        this.createHippoPlatform()
        this.createText()
        //this.createLine()
        this.createExplosion()
        this.createTrash()
        this.createLights()
        this.createGround()
        this.createSky()
        this.createBillboards()
        this.createControls() //controls depend on some objects, create last
    }

    step() {
        this.updatePhysics()
        this.updateVisuals()
        this.updateCheckpoints()
        this.updateControls()
    }

    //checkpoints are created with an update function that returns true when complete
    updateCheckpoints() {
        this.checkpointHolder.update()
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

    createControls(){
        this.gamepadControls = new GamepadControls(this.controlBody, this.controlObject)
        this.followObject = this.gamepadControls.getLookObject()
        this.followObject.followParams = this.character.followParams
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

        // Adjust constraint equation parameters for ground/ground contact
        var ground_ground_cm = new CANNON.ContactMaterial(groundMaterial, groundMaterial, {
            friction: 0.4,
            restitution: 0.3,
            contactEquationStiffness: 1e8,
            contactEquationRelaxation: 3,
            frictionEquationStiffness: 1e8,
            frictionEquationRegularizationTime: 3,
        });

        // Add contact material to the world
        world.addContactMaterial(ground_ground_cm);

        var ground_friction_cm = new CANNON.ContactMaterial(groundMaterial, frictionMaterial, {
            friction: 0.4,
            restitution: 0.01,
            contactEquationStiffness: 1e8,
            contactEquationRelaxation: 3,
            frictionEquationStiffness: 1e8,
            frictionEquationRegularizationTime: 3,
        });
        world.addContactMaterial(ground_friction_cm)
    }

    //todo move all billboards to single landscape element function
    createBillboards(){
            var nBillboards = 4
            const offsetAngle = Math.PI/10
            var stepAngle = 2 * Math.PI / nBillboards
            for(var i = 0; i<nBillboards; i++){
                var billboard = new Billboard('the\nworld\nhas\na\nplastic\nproblem')
                var angle = i * stepAngle + offsetAngle
                billboard.mesh.position.x = ARENA_RADIUS / 2 * Math.sin(angle)
                billboard.mesh.position.y = ARENA_RADIUS / 2 * Math.cos(angle)
                billboard.mesh.position.z = billboard.size - billboard.size / 4
                this.addObject(billboard)
            }
    }

    createHippoPlatform(){

        const xPos = ARENA_RADIUS / 2
        const yPos = ARENA_RADIUS / 10
        const zPos = 5

        const platform = new Platform()
        platform.body.position.x = xPos
        platform.body.position.y = yPos
        platform.body.position.z = zPos
        this.addObject(platform)

        const numHippos = 20
        const hippoBerth = 10 //radius approximation
        const zMax = numHippos * hippoBerth
        const step = Math.PI * 2 / numHippos
        var angle = 0

        //create a downward spiraling cone of hippos
        //x = cos * z, y=sin*z, z = z
        for(var i = 0; i<numHippos; i++){
            const hippo = new Hippo()
            const z = zMax - i * hippoBerth + zPos
            const x = Math.cos(angle) * hippoBerth + xPos
            const y = Math.sin(angle) * hippoBerth + yPos
            hippo.body.position.set(x, y, z)
            this.addObject(hippo)
            angle += step
        }
    }

    createCheckpoints(){
        const checkpoints =
            {
            'landed': ()=>{
                    return (Math.abs(this.controlBody.position.z) <= this.character.size.height )
                },
            'moved': ()=>{
                    return (this.controlBody.position.x >= 1 || this.controlBody.position.x >= 1)
                }
            }

        this.checkpointHolder = new CheckpointHolder(checkpoints) 
    }

    //todo clean this up..
    createText(){
        fontPromiseLoader.load('/fonts/roboto_mono_bold.typeface.json')
        .then( ( font ) => {

            const introText = IntroText(font)
            const hippoText = HippoText(font)

            const small = 0.001

            //set text upright
            //introText.mesh.rotation.x = hippoText.mesh.rotation.x = Math.PI/2
            //introText.mesh.rotation.y = hippoText.mesh.rotation.y =  -Math.PI/2

            //make text tiny and invisible
            introText.mesh.visible = hippoText.mesh.visible = false
            introText.mesh.scale.set(small,small,small)
            hippoText.mesh.scale.set(small,small,small)

            const corner = this.character.followParams.minViewDistance
            
            introText.mesh.position.set(corner,corner/2,introText.size.height / 2)
            introText.mesh.lookAt(0,0,introText.size.height / 2)
            this.addObject(introText)

            this.checkpointHolder.addActionFuncByName('landed', Appear.bind(this, introText.mesh))

            this.checkpointHolder.addActionFuncByName('moved', Vanish.bind(this, introText.mesh))

            const xPos = ARENA_RADIUS / 2
            const yPos = ARENA_RADIUS / 10
            const zPos = 5

            hippoText.mesh.position.set(xPos - 30, yPos, hippoText.size.height / 2)
            hippoText.mesh.lookAt(0,0,hippoText.size.height / 2)
            this.addObject(hippoText)

            this.checkpointHolder.addActionFuncByName('moved', Appear.bind(this, hippoText.mesh))
            // this.checkpointHolder.addActionFuncByName('moved', ()=>{
            //     setTimeout(
            //         ()=>{Appear.bind(this, hippoText.mesh)}
            //         ,1000)
            // })
        } )
    }

    createLine(){
        const from = {x:0, y:0, z:0.5}
        const to = {x:100, y:0, z:0.5}
        const line = new Line(from, to)
        this.addObject(line)
        TweenMax.to(line.geometry, 10, {ease: Linear, maxInstancedCount:99})
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
        this.character = character
        var p = this.character.followParams = {}
        p.distance = FOLLOW_DISTANCE
        p.angle = FOLLOW_ANGLE
        calculateFollowParams(this.character)
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
