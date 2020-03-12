//TODO - move objects from CannonScene here and convert to functions
//which return a new CSObject

const characterSize = 2, //character box side
    trashbagSize = 1, //trashbag radius + height
    trashSize = 0.5, //single trash cube size
    bottleRadius = 0.1,
    billboardSize = 8,

Class CSObject{
    constructor(opts){
        // handle parameter polymorphism
        if( arguments.length === 1 && opts instanceof THREE.Object3D )	opts	= {mesh:opts};
        // handle parameters optional value
        opts		= opts	|| {};
        var mesh	= opts.mesh !== undefined	? opts.mesh	: console.assert(false)
        var mass	= opts.mass !== undefined 	? opts.mass	: null;
        var shape	= opts.shape !== undefined 	? opts.shape	: null;
        var material	= opts.material !== undefined	? opts.material	: undefined;
        var geometry	= opts.geometry || mesh.geometry
        var cannon2three= opts.cannon2three !== undefined ? opts.cannon2three : true

        if( geometry instanceof THREE.SphereGeometry ){
            geometry.computeBoundingBox()
            var boundingBox	= geometry.boundingBox
            var radius	= ((boundingBox.max.x - boundingBox.min.x)* mesh.scale.x) /2
            if( shape === null )	shape	= new CANNON.Sphere(radius)
            if( mass === null )	mass	= 4/3 * Math.PI * Math.pow(radius, 3)
        }else if( geometry instanceof THREE.CubeGeometry ){
            geometry.computeBoundingBox()
            var boundingBox	= geometry.boundingBox
            var width 	= (boundingBox.max.x - boundingBox.min.x) * mesh.scale.x
            var height 	= (boundingBox.max.y - boundingBox.min.y) * mesh.scale.y
            var depth 	= (boundingBox.max.z - boundingBox.min.z) * mesh.scale.z		
            if( shape === null )	shape	= new CANNON.Box(new CANNON.Vec3(width/2, height/2, depth/2))
            if( mass === null )	mass	= Math.pow(width*width + height*height + depth*depth, 1/3)
        }else console.assert(false, 'unknown geometry type')

        var body	= new CANNON.RigidBody(mass, shape, material)
	    this.body	= body

        // copy mesh.position to body.position
        body.position.x		= mesh.position.x
        body.position.y		= mesh.position.y
        body.position.z		= mesh.position.z
        // copy mesh.quaternion to body.quaternion
        body.quaternion.x	= mesh.quaternion.x
        body.quaternion.y	= mesh.quaternion.y
        body.quaternion.z	= mesh.quaternion.z
        body.quaternion.w	= mesh.quaternion.w
    }

    function addBody(body){
        this.body = body
        // copy mesh.position to body.position
        body.position.x		= this.mesh.position.x
        body.position.y		= this.mesh.position.y
        body.position.z		= this.mesh.position.z
        // copy mesh.quaternion to body.quaternion
        body.quaternion.x	= this.mesh.quaternion.x
        body.quaternion.y	= this.mesh.quaternion.y
        body.quaternion.z	= this.mesh.quaternion.z
        body.quaternion.w	= this.mesh.quaternion.w
    }

    function addAnimation(func){
        this.update = ()=>func(this)
    }
}

function Racetrack() {
    const shape = new THREE.Shape();

    shape.moveTo(150, 50);
    shape.lineTo(150, 150);
    shape.quadraticCurveTo(150, 175, 100, 175);
    shape.quadraticCurveTo(50, 175, 50, 150);
    shape.lineTo(50, 50);
    shape.quadraticCurveTo(50, 25, 100, 25);
    shape.quadraticCurveTo(150, 25, 150, 50);

    const innerShape = new THREE.Path();

    innerShape.moveTo(140, 40);
    innerShape.lineTo(140, 140);
    innerShape.quadraticCurveTo(140, 165, 90, 165);
    innerShape.quadraticCurveTo(60, 165, 60, 140);
    innerShape.lineTo(60, 50);
    innerShape.quadraticCurveTo(60, 35, 110, 35);
    innerShape.quadraticCurveTo(140, 35, 140, 60);

    shape.holes.push(innerShape);

    var mesh = new THREE.Mesh(
        new THREE.ShapeGeometry(shape),
        new THREE.MeshLambertMaterial({ color: Colors.white })
    );

    return new CSObject(mesh)
}

function Bottle() {
    const radius = 1
    const height = 3

    var geoms = []

    var nCyls = 2
    for(var i = 0; i<nCyls; i++){
        let radius = radius / (i + 1)
        let height = height / (i + 1)
        var geom = new THREE.CylinderBufferGeometry(radius, radius, height, 6)

        //move section over
        geom.translate(0, i*height, 0)

        geoms.push(geom)
    }

    const mergedGeometry = BufferGeometryUtils.mergeBufferGeometries(
      geoms, false);

	var material = new THREE.MeshLambertMaterial({
        color:Colors.white
    })

    var mesh = new THREE.Mesh(mergedGeometry, material)

    return new CSObject(mesh)
}

function Trashbag() {
    var geoms = []

    const material = new THREE.MeshLambertMaterial({color:Colors.brownDark})

    const bottomGeometry = new THREE.ConeBufferGeometry(trashbagSize, trashbagSize)
    bottomGeometry.rotateX(Math.PI)
    geoms.push(bottomGeometry)

    var topGeometry = new THREE.ConeBufferGeometry(trashbagSize / 2, trashbagSize, 4)
    topGeometry.rotateX(Math.PI/2 + Math.PI) //upside down
    topGeometry.translate(0,0,trashbagSize/2)

    const mergedGeometry = BufferGeometryUtils.mergeBufferGeometries(
      geoms, false);

    const mesh = new THREE.Mesh(mergedGeometry, material)

    return new CSObject(mesh)
}

function Billboard(words) {
    this.mesh = new THREE.Object3D()

    const he = billboardSize / 2
    const mass = 0

    var geometry = new RoundedBoxGeometry( size, size, size , 2 , 5 )
    
    //basic material
    var material = new THREE.MeshLambertMaterial( { color: Colors.pink } );

    var board = new THREE.Mesh( geometry, material ) ;

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

        var text = Text(words, font, options) //words, color, size, font

        text.mesh.rotation.x = Math.PI/2
        text.mesh.rotation.y = -Math.PI/2

        text.mesh.position.x = -this.size / 2
        this.mesh.add(text.mesh)
    })

    return new CSObject(mesh)
}