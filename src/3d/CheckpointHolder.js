//holder can be created with array of checkpoints or
//array of objects with keys name, checkFunc, and optional actionFuncs array or
//object with name: checkfunc entries
export default class CheckpointHolder{
    constructor(checkpoints){
        this.checkpoints = {}

        if(Array.isArray(checkpoints)){
            for(const cp of checkpoints){
                this.addCheckpoint(cp)
            }
        } else { //name:checkfunc object
            for(const [name, checkFunc] of Object.entries(checkpoints)){
                this.addCheckpoint(new Checkpoint(name, checkFunc))
            }
        }
    }

    addCheckpoint(checkpoint){
        const cp = checkpoint
        if(cp instanceof Checkpoint){
            this.checkpoints[cp.name] = cp
        } else if(typeof checkpoint === 'object'){
            this.checkpoints[cp.name] = new Checkpoint(cp.name, cp.checkFunc, cp.actionFuncs)
        } else {
            //assuming name, checkFunc, actionFuncs
            console.log('todo!!')
        }
    }

    getCheckpointByName(name){
        if(name in this.checkpoints){
            return this.checkpoints[name]
        } else {
            return null
        }
    }

    addActionFuncByName(name, actionFunc){
        const cp = this.getCheckpointByName(name)
        cp.addActionFunc(actionFunc)
    }

    update(){
        for(const cp of Object.values(this.checkpoints)){
            cp.update()
        }
    }
}

class Checkpoint{
    constructor(name, checkFunc, actionFuncs){
        this.name = name
        this.checkFunc = checkFunc
        this.actionFuncs = []
        this.completed = false
        if(typeof ActionFuncs === 'array'){
            for(const actionFunc of actionFuncs){
                this.actionFuncs.push(actionFunc)
            }
        } else if(actionFuncs){
            //assuming it's a single function
            this.actionFuncs.push(actionFuncs)
        }
    }

    update(){
        if(this.completed){
            return
        }

        if(this.checkFunc()){
            this.completed = true
            this.runActionFuncs()
        }
    }

    addActionFunc(actionFunc){
        this.actionFuncs.push(actionFunc)

        //if func is added after completion, run
        if(this.completed){
            actionFunc()
        }
    }

    runActionFuncs(){
        for(const actionFunc of this.actionFuncs){
            actionFunc()
        }
    }
}