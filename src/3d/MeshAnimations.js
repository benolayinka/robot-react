import {TweenMax, Linear} from 'gsap'

export function Appear(mesh){
    const scale = 1
    mesh.visible = true
    TweenMax.to(mesh.scale, 1, {ease: Linear, x:scale, y:scale, z:scale})
}

export function Vanish(mesh){
    const scale = 0.001
    TweenMax.to(mesh.scale, 1, {ease: Linear, x:scale, y:scale, z:scale, onComplete: ()=>{
        mesh.visible = false
    }})
}