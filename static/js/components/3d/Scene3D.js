import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { shallowRef, onMounted, onBeforeUnmount } from 'vue';

export default {
    name: 'Scene3D',
    template: `
        <div ref="container" class="scene3d-container" style="width: 100%; height: 100%;"></div>
    `,
    props: {
        // Konfigurationsoptionen
        controls: {
            type: Boolean,
            default: true
        },
        backgroundColor: {
            type: String,
            default: '#f0f0f0'
        }
    },
    setup(props, { emit }) {
        const container = shallowRef(null);
        const engine = {
            scene: null,
            camera: null,
            renderer: null,
            controls: null,
            animationFrame: null
        };

        const init = () => {
            if (!container.value) return;
            
            // Scene
            engine.scene = new THREE.Scene();
            engine.scene.background = new THREE.Color(props.backgroundColor);
            
            // Camera
            const aspect = container.value.clientWidth / container.value.clientHeight;
            engine.camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000);
            engine.camera.position.set(5, 5, 5);
            engine.camera.lookAt(0, 0, 0);
            
            // Renderer
            engine.renderer = new THREE.WebGLRenderer({ 
                antialias: true,
                alpha: true
            });
            engine.renderer.setSize(container.value.clientWidth, container.value.clientHeight);
            container.value.appendChild(engine.renderer.domElement);
            
            // Controls
            if (props.controls) {
                engine.controls = new OrbitControls(engine.camera, engine.renderer.domElement);
                engine.controls.enableDamping = true;
                engine.controls.dampingFactor = 0.05;
            }
            
            // Emit scene ready event
            emit('scene-ready', {
                scene: engine.scene,
                camera: engine.camera,
                renderer: engine.renderer,
                controls: engine.controls
            });
            
            animate();
        };
        
        const animate = () => {
            engine.animationFrame = requestAnimationFrame(animate);
            
            if (engine.controls) {
                engine.controls.update();
            }
            
            engine.renderer.render(engine.scene, engine.camera);
            emit('animate');
        };
        
        const onResize = () => {
            if (!container.value || !engine.camera || !engine.renderer) return;
            
            const width = container.value.clientWidth;
            const height = container.value.clientHeight;
            
            engine.camera.aspect = width / height;
            engine.camera.updateProjectionMatrix();
            engine.renderer.setSize(width, height);
        };

        onMounted(() => {
            container.value = document.querySelector('.scene3d-container');
            init();
            window.addEventListener('resize', onResize);
        });

        onBeforeUnmount(() => {
            if (engine.animationFrame) {
                cancelAnimationFrame(engine.animationFrame);
            }

            window.removeEventListener('resize', onResize);
            
            if (engine.renderer) {
                engine.renderer.dispose();
                engine.renderer.domElement.remove();
            }
            
            if (engine.controls) {
                engine.controls.dispose();
            }
            
            // Clear references
            Object.keys(engine).forEach(key => {
                engine[key] = null;
            });
        });

        return {
            container
        };
    }
}; 