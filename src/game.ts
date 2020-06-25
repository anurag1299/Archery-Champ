import { GameUtils } from './game-utils';
import * as BABYLON from 'babylonjs';
import * as GUI from 'babylonjs-gui';
import { Camera, Vector3, VertexData } from 'babylonjs';
import { debug } from 'webpack';

export class Game {

    private _canvas: HTMLCanvasElement;
    private _engine: BABYLON.Engine;
    private _scene: BABYLON.Scene;
    private _camera: BABYLON.FreeCamera;
    private _light: BABYLON.Light;
    private _light2: BABYLON.Light;
    private _BowMesh: BABYLON.AbstractMesh;
    private _ArrowMesh: BABYLON.AbstractMesh;
    private _Score: number = 0;
    private _SightMesh: BABYLON.AbstractMesh;
    private _TargetMesh: BABYLON.AbstractMesh;
    private _CrossHair: BABYLON.Mesh;
    private _arrowDirection: BABYLON.Ray;
    private _arrowHit: BABYLON.PickingInfo;
    private _txtScore: { txtScore: GUI.TextBlock } = null;
    private _Aiming: boolean = false;
    private _Shoot: boolean = false;
    private _ArrowStart: BABYLON.Vector3;
    private _ArrowRotation: BABYLON.Vector3;
    private _ArrowEnd: BABYLON.Vector3;
    //private _sharkMesh: BABYLON.AbstractMesh;
    //private _sharkAnimationTime = 0;
    //private _swim: boolean = false;
    //private _txtCoordinates: { txtX: GUI.TextBlock, txtY: GUI.TextBlock, txtZ: GUI.TextBlock } = null;

    constructor(canvasElement: string) {
        // Create canvas and engine
        this._canvas = <HTMLCanvasElement>document.getElementById(canvasElement);
        this._engine = new BABYLON.Engine(this._canvas, true);
    }

    /**
     * Creates the BABYLONJS Scene
     */
    createScene(): void {
        // create a basic BJS Scene object
        this._scene = new BABYLON.Scene(this._engine);
        let gravity = new BABYLON.Vector3(0, -0.9, 0);
        this._scene.enablePhysics(gravity, new BABYLON.CannonJSPlugin());
        this._scene.collisionsEnabled = true;
        // create a FreeCamera, and set its position to (x:0, y:5, z:-10)
        this._camera = new BABYLON.FreeCamera("Camera", new BABYLON.Vector3(0,5,0), this._scene);
        this._camera.attachControl(this._canvas, true);
        this._camera.rotation = new BABYLON.Vector3(0,0, 0);
        this._camera.minZ = -1;
        
        //this._camera.keysUp.pop();
        //this._camera.keysDown.pop();
        //this._camera.keysLeft.pop();
        //this._camera.keysRight.pop();
        //this._camera.position = new BABYLON.Vector3(0, 10, 0);
        // create a basic light, aiming 0,1,0 - meaning, to the sky
        this._light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), this._scene);
        this._light2 = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, -Math.PI/4, -1), this._scene);
        this._light2.intensity = 0.5;
        this._light2.shadowEnabled = true;
        // create the skybox
        let skybox = GameUtils.createSkybox("skybox", "./assets/texture/skybox/TropicalSunnyDay", this._scene);
        // creates the sandy ground
        let ground = GameUtils.createGround(this._scene);
        ground.physicsImpostor = new BABYLON.PhysicsImpostor(ground, BABYLON.PhysicsImpostor.BoxImpostor, { mass: 0, restitution: 0 }, this._scene);
        ground.checkCollisions = true;
        
        this._CrossHair = GameUtils.createCrosshair(this._scene);
        this._CrossHair.parent = this._camera;
        this._CrossHair.checkCollisions = false;
        // creates the watermaterial and adds the relevant nodes to the renderlist
        //let waterMaterial = GameUtils.createWater(this._scene);
        //waterMaterial.addToRenderList(skybox);
        //waterMaterial.addToRenderList(ground);
        // create a shark mesh from a .obj file
        //GameUtils.createShark(this._scene)
        //    .subscribe(sharkMesh => {
        //        this._sharkMesh = sharkMesh;
        //        this._sharkMesh.getChildren().forEach(
        //            mesh => {
        //                waterMaterial.addToRenderList(mesh);
        //            }
        //        );
        //    });
        //Create bow from a .obj file
        GameUtils.createBow(this._scene)
            .subscribe(BowMesh => {
                this._BowMesh = BowMesh; 
                this._BowMesh.parent = this._camera;
            });
        GameUtils.createSight(this._scene)
            .subscribe(sightMesh => {
                this._SightMesh = sightMesh;
                this._SightMesh.checkCollisions = false;
                this._SightMesh.parent = this._camera;

            });
        GameUtils.createArrow(this._scene)
            .subscribe(arrowMesh => {
                this._ArrowMesh = arrowMesh;
                this._ArrowStart = arrowMesh.position;
                this._ArrowMesh.position.copyFrom(this._SightMesh.position.subtract(new BABYLON.Vector3(-0.05,-0.9,-4)));
                this._ArrowMesh.parent = this._camera;
                //this._ArrowMesh.physicsImpostor = new BABYLON.PhysicsImpostor(this._ArrowMesh, BABYLON.PhysicsImpostor.BoxImpostor, { mass: 1, restitution: 0 }, this._scene);
                this._ArrowMesh.checkCollisions = true;
                
            });
       
        GameUtils.createTarget(this._scene)
            .subscribe(targetMesh => {
                this._TargetMesh = targetMesh;
                //this._TargetMesh.physicsImpostor = new BABYLON.PhysicsImpostor(this._TargetMesh, BABYLON.PhysicsImpostor.MeshImpostor, { mass: 5, restitution: 0 }, this._scene);
                this._TargetMesh.checkCollisions = true;


                
            });
        
        this._scene.onPointerObservable.add((pointerInfo) => {
            switch (pointerInfo.type) {
                case BABYLON.PointerEventTypes.POINTERDOWN:
                    console.log("POINTER DOWN");
                    
                    //this.takeAim();
                    this._Aiming = true;
                    break;
                case BABYLON.PointerEventTypes.POINTERUP:
                    console.log("POINTER UP");
                    this._Aiming = false;
                    this._Shoot = true;
                    break;
                
            }
        });


        
        // finally the new ui
        let guiTexture = GameUtils.createGUI();
        
        // Button to start shark animation
        //GameUtils.createButtonSwim(guiTexture, "Start Swimming",
        //    (btn) => {
        //        let textControl = btn.children[0] as GUI.TextBlock;
        //        this._swim = !this._swim;
        //        if (this._swim) {
        //            textControl.text = "Stop Swimming";
        //        }
        //        else {
        //            this._sharkAnimationTime = 0;
        //            textControl.text = "Start Swimming";
        //        }
        //    });

        // Debug Text for Shark coordinates
        //this._txtCoordinates = GameUtils.createCoordinatesText(guiTexture);
        this._txtScore = GameUtils.createScoreCoordinates(guiTexture);

        // Physics engine also works
        
    }

    
    

    /**
     * Starts the animation loop.
     */
    animate(): void {
        this._scene.registerBeforeRender(() => {
            let deltaTime: number = (1 / this._engine.getFps());
            //this.animateShark(deltaTime);
            this.takeAim(deltaTime);
            this.shoot(deltaTime);
            //this.cameraConstraints();
        });

        // run the render loop
        this._engine.runRenderLoop(() => {
            //console.log(this._camera.rotation)

            this._txtScore.txtScore.text = "Score : " + this._Score;
            this._scene.render();
        });

        // the canvas/window resize event handler
        window.addEventListener('resize', () => {
            this._engine.resize();
        });
    }


    cameraConstraints(): void {
        if (this._camera.rotation.x > 0.7) {
            this._camera.rotation.x = 0.7;
        } else if (this._camera.rotation.x < -0.7) {
            this._camera.rotation.x = -0.7;
        }

        if (this._camera.rotation.y > 0.5) {
            this._camera.rotation.y = 0.5;
        } else if (this._camera.rotation.y < -0.5) {
            this._camera.rotation.y = -0.5;
        }
    }

    takeAim(deltaTime: number): void {

        if (this._ArrowMesh && this._Aiming && this._ArrowMesh.position.z >= 4.0) {
            this._ArrowMesh.translate(BABYLON.Axis.Z, -deltaTime*8, BABYLON.Space.WORLD);
            //console.log(this._ArrowMesh.position);
            
        }
        if (this._BowMesh && this._Aiming && this._BowMesh.position.z >= 3.0) {
            this._BowMesh.translate(BABYLON.Axis.Z, -deltaTime*16, BABYLON.Space.WORLD);
            //console.log(this._BowMesh.position);
        }
        if (this._SightMesh && this._Aiming && this._SightMesh.position.z >= 3.0) {
            this._SightMesh.translate(BABYLON.Axis.Z, -deltaTime * 16, BABYLON.Space.WORLD);

            //console.log(this._SightMesh.position);
        }
        if (this._CrossHair && this._Aiming && this._CrossHair.position.z >= 4.0) {
            this._CrossHair.translate(BABYLON.Axis.Z, -deltaTime*16, BABYLON.Space.WORLD);
            //console.log(this._CrossHair.position);
        }
        if (this._Aiming) {
            this._arrowDirection = this._camera.getForwardRay(1000);

            this._arrowHit = this._scene.pickWithRay(this._arrowDirection);
            this._ArrowEnd = this._arrowHit.pickedPoint;
            
            //this._ArrowMesh.parent = null;
            //this._ArrowMesh.position = this._ArrowStart.add(new BABYLON.Vector3(0,5,0));
            console.log("ray", this._arrowHit.pickedPoint);
            console.log("target", this._TargetMesh.position);
        }
    }

    shoot(deltaTime: number): void {
        if (this._Shoot) {
            
            
            //if (this._BowMesh && this._Shoot && this._BowMesh.position.z <= 5.0) {
            //    this._BowMesh.translate(BABYLON.Axis.Z, deltaTime * 16, BABYLON.Space.WORLD);
            //    //console.log(this._BowMesh.position);
            //}
            //if (this._SightMesh && this._Shoot && this._SightMesh.position.z <= 5.0) {
            //    this._SightMesh.translate(BABYLON.Axis.Z, deltaTime * 16, BABYLON.Space.WORLD);

            //    //console.log(this._SightMesh.position);
            //}
            //if (this._CrossHair && this._Shoot && this._CrossHair.position.z <= 6.0) {
            //    this._CrossHair.translate(BABYLON.Axis.Z, deltaTime * 16, BABYLON.Space.WORLD);
            //    //console.log(this._CrossHair.position);
            //}
            if (this._ArrowMesh.parent != null) {
                this._ArrowMesh.parent = null;
                this._ArrowStart.copyFrom(this._camera.position.subtract(new BABYLON.Vector3(0, 1.5, 0)));
                this._ArrowRotation = this._camera.rotation;
                this._ArrowMesh.position = this._ArrowStart.clone();
                this._ArrowMesh.rotation = this._ArrowRotation.clone();
                //this._ArrowMesh.physicsImpostor = new BABYLON.PhysicsImpostor(this._ArrowMesh, BABYLON.PhysicsImpostor.BoxImpostor, { mass: 1, restitution: 0 }, this._scene);
            }
            this._ArrowMesh.translate(this._ArrowEnd.subtract(this._ArrowMesh.position), deltaTime * 8, BABYLON.Space.WORLD);
            if (this._ArrowMesh.intersectsPoint(this._ArrowEnd)) {
                //console.log("hit");
                let x = this._TargetMesh.position.x;
                let y = this._TargetMesh.position.y;
                //:NOTE = ADD a check for target z postion also
                if (this._ArrowEnd.x > (x + 1.0) || this._ArrowEnd.y > (y + 1.0) || this._ArrowEnd.x < (x - 1.0) || this._ArrowEnd.y < (y - 1.0)) {
                    console.log("Missed");
                } else if (this._ArrowEnd.x > (x + 0.9) || this._ArrowEnd.y > (y + 0.9) || this._ArrowEnd.x < (x - 0.9) || this._ArrowEnd.y < (y - 0.9)) {
                    console.log("2 points");
                    this._Score += 2;
                } else if (this._ArrowEnd.x > (x + 0.7) || this._ArrowEnd.y > (y + 0.7) || this._ArrowEnd.x < (x - 0.7) || this._ArrowEnd.y < (y - 0.7)) {
                    console.log("4 points");
                    this._Score += 4;
                } else if (this._ArrowEnd.x > (x + 0.4) || this._ArrowEnd.y > (y + 0.4) || this._ArrowEnd.x < (x - 0.4) || this._ArrowEnd.y < (y - 0.4)) {
                    console.log("6 points");
                    this._Score += 6;
                }
                else if (this._ArrowEnd.x > (x + 0.2) || this._ArrowEnd.y > (y + 0.2) || this._ArrowEnd.x < (x - 0.2) || this._ArrowEnd.y < (y - 0.2)) {
                    console.log("8 points");
                    this._Score += 8;
                } else if (this._ArrowEnd.x > (x + 0.1) || this._ArrowEnd.y > (y + 0.1) || this._ArrowEnd.x < (x - 0.1) || this._ArrowEnd.y < (y - 0.1)) {
                    console.log("9 points");
                    this._Score += 9;
                } else {
                    console.log("10 points");
                    this._Score += 10;
                }
                this._ArrowMesh.isPickable = false;
                
                GameUtils.createArrow(this._scene)
                    .subscribe(arrowMesh => {
                        this._ArrowMesh = arrowMesh;
                        this._ArrowStart = arrowMesh.position;
                        this._ArrowMesh.position.copyFrom(this._SightMesh.position.subtract(new BABYLON.Vector3(-0.05, -0.9, -4)));
                        this._ArrowMesh.parent = this._camera;
                        //this._ArrowMesh.physicsImpostor = new BABYLON.PhysicsImpostor(this._ArrowMesh, BABYLON.PhysicsImpostor.BoxImpostor, { mass: 1, restitution: 0 }, this._scene);
                        this._ArrowMesh.checkCollisions = true;

                    });
                this._Shoot = false;
                this._Aiming = false;

            }

            //console.log(this._ArrowMesh.physicsImpostor);
            //this._ArrowMesh.physicsImpostor.applyImpulse(BABYLON.Axis.Z, this._ArrowMesh.absolutePosition);
            //this._Shoot = false;
            //let duration = 10.0;
            
            //let progress = (deltaTime) / duration;
            //let currentPosition = BABYLON.Vector3.Lerp(this._ArrowStart, this._ArrowEnd, progress);
            //this._ArrowMesh.position = currentPosition;
        }
    }
    //animateShark(deltaTime: number): void {
    //    this.debugFirstMeshCoordinate(this._sharkMesh as BABYLON.Mesh);
    //    if (this._sharkMesh && this._swim) {
    //        this._sharkAnimationTime += deltaTime;
    //        this._sharkMesh.getChildren().forEach(
    //            mesh => {
    //                let realMesh = <BABYLON.Mesh> mesh;
    //                let vertexData = BABYLON.VertexData.ExtractFromMesh(realMesh);
    //                let positions = vertexData.positions;
    //                let numberOfPoints = positions.length / 3;
    //                for (let i = 0; i < numberOfPoints; i++) {
    //                    let vertex = new BABYLON.Vector3(positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2]);
    //                    vertex.x += (Math.sin(0.15 * vertex.z + this._sharkAnimationTime * 4 - 1.6) * 0.05);
    //                    positions[i * 3] = vertex.x;
                        
    //                }
    //                vertexData.applyToMesh(mesh as BABYLON.Mesh);
    //            }
    //        );
    //    }
    //}

    /**
     * Prints the coordinates of the first vertex of a mesh
     */
    //public debugFirstMeshCoordinate(mesh: BABYLON.Mesh) {
    //    if(!mesh || !mesh.getChildren()) {
    //        return;
    //    }
    //    let firstMesh = (mesh.getChildren()[0] as BABYLON.Mesh) 
    //    let vertexData = BABYLON.VertexData.ExtractFromMesh(firstMesh);
    //    let positions = vertexData.positions;
    //    let firstVertex = new BABYLON.Vector3(positions[0], positions[1], positions[3]);
    //    this.updateCoordinateTexture(firstVertex);
    //}

    /**
     * Prints the given Vector3
     * @param coordinates 
     */
    //public updateCoordinateTexture(coordinates: BABYLON.Vector3) {
    //    if(!coordinates) {
    //        return;
    //    }
    //    this._txtCoordinates.txtX.text = "X: " + coordinates.x;
    //    this._txtCoordinates.txtY.text = "Y: " + coordinates.y;
    //    this._txtCoordinates.txtZ.text = "Z: " + coordinates.z;
    //}

}