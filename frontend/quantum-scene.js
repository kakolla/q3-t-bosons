class QuantumScene {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.quantumComputer = null;
        this.particles = null;
        this.animationId = null;
        this.mouseX = 0;
        this.mouseY = 0;
        this.targetRotationX = 0;
        this.targetRotationY = 0;
        
        this.init();
        this.loadQuantumComputer();
        this.createParticles();
        this.animate();
        this.setupEventListeners();
    }

    init() {
        // Scene setup
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.Fog(0xF0EEE6, 10, 50);

        // Camera setup
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.camera.position.set(0, 0, 2); // Start zoomed into the quantum chip

        // Renderer setup
        this.renderer = new THREE.WebGLRenderer({ 
            antialias: true, 
            alpha: true 
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setClearColor(0xF0EEE6, 0);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.outputEncoding = THREE.sRGBEncoding;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.2;

        // Add renderer to DOM
        const container = document.getElementById('quantum-bg');
        container.appendChild(this.renderer.domElement);

        // Lighting setup
        this.setupLighting();
    }

    setupLighting() {
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
        this.scene.add(ambientLight);

        // Main directional light
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(10, 10, 5);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.near = 0.5;
        directionalLight.shadow.camera.far = 50;
        this.scene.add(directionalLight);

        // Accent lights for quantum effect
        const blueLight = new THREE.PointLight(0x4a90e2, 0.8, 20);
        blueLight.position.set(-5, 3, 2);
        this.scene.add(blueLight);

        const purpleLight = new THREE.PointLight(0x8e44ad, 0.6, 15);
        purpleLight.position.set(5, -2, -3);
        this.scene.add(purpleLight);

        // Rim light
        const rimLight = new THREE.DirectionalLight(0x74b9ff, 0.3);
        rimLight.position.set(-10, 0, -10);
        this.scene.add(rimLight);
    }

    loadQuantumComputer() {
        const loader = new THREE.GLTFLoader();
        
        // Add error handling and debugging
        console.log('Attempting to load quantum computer model...');
        
        loader.load(
            '/models/microsoft_quantum_chip_3d_model/scene.gltf',
            (gltf) => {
                console.log('Model loaded successfully:', gltf);
                this.quantumComputer = gltf.scene;
                
                // Scale and position the model for close-up view
                this.quantumComputer.scale.set(2, 2, 2);
                this.quantumComputer.position.set(0, 0, 0);
                this.quantumComputer.rotation.y = 0;
                this.quantumComputer.rotation.z = 0;
                this.quantumComputer.rotation.x = Math.PI * 0.5;


                // Enable shadows
                this.quantumComputer.traverse((child) => {
                    if (child.isMesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                        
                        // Enhance materials for better visual appeal
                        if (child.material) {
                            child.material.envMapIntensity = 0.8;
                            if (child.material.metalness !== undefined) {
                                child.material.metalness = Math.min(child.material.metalness + 0.2, 1);
                            }
                        }
                    }
                });

                this.scene.add(this.quantumComputer);
                console.log('Quantum computer model loaded successfully');
            },
            (progress) => {
                console.log('Loading progress:', (progress.loaded / progress.total * 100) + '%');
            },
            (error) => {
                console.error('Error loading quantum computer model:', error);
                console.log('Falling back to procedural model...');
                this.createFallbackModel();
            }
        );
    }

    createFallbackModel() {
        // Create a detailed fallback quantum computer representation
        const group = new THREE.Group();
        
        // Main chassis - sleek design
        const chassisGeometry = new THREE.BoxGeometry(3, 2, 1.5);
        const chassisMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x1a1a2e,
            shininess: 100,
            specular: 0x444444
        });
        const chassis = new THREE.Mesh(chassisGeometry, chassisMaterial);
        chassis.castShadow = true;
        chassis.receiveShadow = true;
        group.add(chassis);

        // Quantum processing units - glowing cylinders
        for (let i = 0; i < 5; i++) {
            const qpuGeometry = new THREE.CylinderGeometry(0.12, 0.12, 1.2);
            const qpuMaterial = new THREE.MeshPhongMaterial({ 
                color: 0x00d4ff,
                transparent: true,
                opacity: 0.9,
                emissive: 0x0066cc,
                emissiveIntensity: 0.3
            });
            const qpu = new THREE.Mesh(qpuGeometry, qpuMaterial);
            qpu.position.set((i - 2) * 0.5, 0.3, 0);
            qpu.castShadow = true;
            
            // Add inner glow effect
            const innerGlow = new THREE.Mesh(
                new THREE.CylinderGeometry(0.08, 0.08, 1.0),
                new THREE.MeshBasicMaterial({ 
                    color: 0x66ccff,
                    transparent: true,
                    opacity: 0.6
                })
            );
            qpu.add(innerGlow);
            group.add(qpu);
        }

        // Control panels
        for (let i = 0; i < 2; i++) {
            const panelGeometry = new THREE.BoxGeometry(0.8, 0.6, 0.05);
            const panelMaterial = new THREE.MeshPhongMaterial({ 
                color: 0x16213e,
                emissive: 0x0f3460,
                emissiveIntensity: 0.1
            });
            const panel = new THREE.Mesh(panelGeometry, panelMaterial);
            panel.position.set((i - 0.5) * 2, 0, 0.78);
            group.add(panel);

            // Add screen effect
            const screenGeometry = new THREE.BoxGeometry(0.6, 0.4, 0.01);
            const screenMaterial = new THREE.MeshBasicMaterial({ 
                color: 0x00ff88,
                transparent: true,
                opacity: 0.7
            });
            const screen = new THREE.Mesh(screenGeometry, screenMaterial);
            screen.position.set(0, 0, 0.01);
            panel.add(screen);
        }

        // Cooling vents
        for (let i = 0; i < 6; i++) {
            const ventGeometry = new THREE.BoxGeometry(0.1, 1.8, 0.05);
            const ventMaterial = new THREE.MeshPhongMaterial({ 
                color: 0x333333
            });
            const vent = new THREE.Mesh(ventGeometry, ventMaterial);
            vent.position.set(-1.3 + (i * 0.2), 0, -0.78);
            group.add(vent);
        }

        // Base platform
        const baseGeometry = new THREE.CylinderGeometry(2.2, 2.2, 0.2);
        const baseMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x2c3e50,
            metalness: 0.8,
            roughness: 0.2
        });
        const base = new THREE.Mesh(baseGeometry, baseMaterial);
        base.position.set(0, -1.1, 0);
        base.receiveShadow = true;
        group.add(base);

        group.scale.set(0.6, 0.6, 0.6);
        group.position.set(0, -1, 0);
        this.quantumComputer = group;
        this.scene.add(group);
        
        console.log('Fallback quantum computer model created');
    }

    createParticles() {
        const particleCount = 200;
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        const sizes = new Float32Array(particleCount);

        for (let i = 0; i < particleCount; i++) {
            // Position particles in a sphere around the scene
            const radius = 15 + Math.random() * 10;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI;

            positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
            positions[i * 3 + 1] = radius * Math.cos(phi);
            positions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);

            // Dark purple colors
            colors[i * 3] = 0.3;     // Dark purple red component
            colors[i * 3 + 1] = 0.1; // Dark purple green component  
            colors[i * 3 + 2] = 0.4; // Dark purple blue component

            sizes[i] = Math.random() * 2 + 1;
        }

        const particleGeometry = new THREE.BufferGeometry();
        particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        particleGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

        const particleMaterial = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 }
            },
            vertexShader: `
                attribute float size;
                attribute vec3 color;
                varying vec3 vColor;
                uniform float time;
                
                void main() {
                    vColor = color;
                    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                    gl_PointSize = size * (300.0 / -mvPosition.z) * (1.0 + 0.5 * sin(time + position.x));
                    gl_Position = projectionMatrix * mvPosition;
                }
            `,
            fragmentShader: `
                varying vec3 vColor;
                
                void main() {
                    float distance = length(gl_PointCoord - vec2(0.5));
                    if (distance > 0.5) discard;
                    
                    float alpha = 1.0 - distance * 2.0;
                    gl_FragColor = vec4(vColor, alpha * 0.6);
                }
            `,
            transparent: true,
            blending: THREE.AdditiveBlending
        });

        this.particles = new THREE.Points(particleGeometry, particleMaterial);
        this.scene.add(this.particles);
    }

    setupEventListeners() {
        // Mouse movement for interactive rotation
        document.addEventListener('mousemove', (event) => {
            this.mouseX = (event.clientX / window.innerWidth) * 2 - 1;
            this.mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
        });

        // Scroll-based camera animation
        window.addEventListener('scroll', () => {
            const scrollPercent = window.scrollY / (document.body.scrollHeight - window.innerHeight);
            this.updateCameraFromScroll(scrollPercent);
        });

        // Window resize
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
    }

    updateCameraFromScroll(scrollPercent) {
        // Smooth camera transition based on scroll
        const progress = Math.min(scrollPercent * 2, 1); // First half of scroll controls camera
        
        // Camera position interpolation
        const startPos = { x: 0, y: 0, z: 2 };     // Close-up view
        const endPos = { x: 0, y: 2, z: 8 };       // Overview with UI visible
        
        this.camera.position.x = startPos.x + (endPos.x - startPos.x) * progress;
        this.camera.position.y = startPos.y + (endPos.y - startPos.y) * progress;
        this.camera.position.z = startPos.z + (endPos.z - startPos.z) * progress;
        
        // Model scale and position adjustment
        if (this.quantumComputer) {
            const startScale = 2;
            const endScale = 0.8;
            const scale = startScale + (endScale - startScale) * progress;
            this.quantumComputer.scale.set(scale, scale, scale);
            
            const startY = 0;
            const endY = -1;
            const posY = startY + (endY - startY) * progress;
            this.quantumComputer.position.y = posY;
        }
        
        // Adjust particle opacity based on scroll
        if (this.particles) {
            const particleOpacity = Math.max(0.3, 1 - progress);
            this.particles.material.uniforms.opacity = { value: particleOpacity };
        }
    }

    animate() {
        this.animationId = requestAnimationFrame(() => this.animate());

        const time = Date.now() * 0.001;

        // Rotate quantum computer
        if (this.quantumComputer) {
            this.targetRotationY = this.mouseX * 0.3;
            this.targetRotationX = (this.mouseY * 0.1) + (Math.PI * 0.5); // Preserve initial X rotation
            
            this.quantumComputer.rotation.y += (this.targetRotationY - this.quantumComputer.rotation.y) * 0.02;
            this.quantumComputer.rotation.x += (this.targetRotationX - this.quantumComputer.rotation.x) * 0.02;
            this.quantumComputer.rotation.y += 0.005; // Continuous slow rotation
        }

        // Animate particles
        if (this.particles) {
            this.particles.rotation.y += 0.001;
            this.particles.material.uniforms.time.value = time;
        }

        // Look at the quantum computer
        this.camera.lookAt(0, 0, 0);

        this.renderer.render(this.scene, this.camera);
    }

    destroy() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        
        if (this.renderer) {
            this.renderer.dispose();
        }
    }
}

// Initialize the quantum scene when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.quantumScene = new QuantumScene();
});
