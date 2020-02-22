# React Robot Server

### `npm start`

If running locally, the app is available at localhost:3000. <br />
If running on the server, nginx should redirect dev.benolayinka.com to benolayinka.com:3000 where the app is listening.

The page will reload if you make edits.<br />
If you're editing via ssh, sometimes the number of file listeners exceeds the system capacity. Google the error to fix it, or just deal with lack of hot reloading.

### Modifying the scene in ../src/3d/CannonScene.js
CannonScene uses Three.js to render, and Cannon.js to simulate physics.
Check the CannonScene constructor function to see how things are created.
Look at objects like Cloud or Sun for simple examples.
Most objects in the world have a 
this.mesh - the visual object 
this.body - the physics body

If you don't need physics for an element (like the Clouds and Sun) it's okay to just have a this.mesh

CannonScene has a this.addObject() method you should use, which automatically adds the object to the THREE Scene, the body to the CANNON World (if the body exists), and handles copying the data from the CANNON to THREE at each this.step()

If you add a .update function to a thing's prototype and use this.addObject, the simulation will automatically call that function at each this.step(), which can be useful for animating stuff. See Sky for an example

For easier debugging of cannon bodies, enable cannonDebugRenderer.update in step(). It's set to enable automatically if you use dev.goodrobot.live or localhost.

## todo
### sim things to fix
set character upright on fall - see Robot.prototype.update, orientation detection is there<br />
create a nicer looking billboard<br />
create a more interesting level<br />
add points system and HUD<br />
