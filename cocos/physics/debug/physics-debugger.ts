import { Material, System, director, Director, GFXCommandBuffer, GFXDevice, GFXCommandBufferType, GFXClearFlag, Node, ModelComponent, utils, game, GFXPrimitiveMode } from "../../core";
import { box } from "../../core/primitive";
import { PassOverrides } from "../../core/renderer/core/pass";
import { RenderPriority } from "../../core/pipeline/define";

if (!CC_EDITOR) {
    class PhysicsDebugger extends System {
        public static instance: PhysicsDebugger;
        public static ID: 'PHYSICS-DEBUGGER';

        public debugNode!: Node;

        public testNode!: Node;
        public modelCom!: ModelComponent;
        public material!: Material;

        public init () {

            this.debugNode = new Node('PHYSICS-DEBUGGER-ROOT');
            game.addPersistRootNode(this.debugNode);

            this.testNode = new Node('TEST');
            this.modelCom = this.testNode.addComponent(ModelComponent) as ModelComponent;

            this.material = new Material();
            this.material.initialize({
                effectName: "builtin-unlit"
            });
            const overrides: PassOverrides = {
                'priority': RenderPriority.MAX,
                // 'depthStencilState': {}
            }
            this.material.overridePipelineStates(overrides, 0);

            this.modelCom.material = this.material;
            this.modelCom.mesh = utils.createMesh(box({ width: 1, height: 1, length: 1 }));

            this.debugNode.addChild(this.testNode);
        }

        public postUpdate () {

        }
    }

    cc.PhysicsDebugger = PhysicsDebugger;

    director.on(Director.EVENT_INIT, function () {
        let sys = new PhysicsDebugger();
        PhysicsDebugger.instance = sys;
        director.registerSystem(PhysicsDebugger.ID, sys, 0);
    });
}
