<script lang="ts">
  import { onMount, createEventDispatcher } from "svelte";
  import * as THREE from "three";
  import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
  import gsap from "gsap";

  const dispatch = createEventDispatcher();

  let canvas: HTMLCanvasElement;
  let scene: THREE.Scene;
  let renderer: THREE.WebGLRenderer;
  let camera: THREE.PerspectiveCamera;
  let frame: number;

  onMount(() => {
    scene = new THREE.Scene();

    const distance = 50;
    const angleX = THREE.MathUtils.degToRad(-20);
    const angleY = THREE.MathUtils.degToRad(0);

    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.set(0, 30, distance);
    camera.rotation.set(angleX, angleY, 0);

    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);

    const hemi = new THREE.HemisphereLight(0xffffff, 0x222222, 2);
    scene.add(hemi);

    const texLoader = new THREE.TextureLoader();

    const texFloor = texLoader.load("/textures/floor.jpg");
    texFloor.wrapS = THREE.RepeatWrapping;
    texFloor.wrapT = THREE.RepeatWrapping;
    texFloor.repeat.set(5,5);

    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(500,500),
      new THREE.MeshStandardMaterial({ map: texFloor })
    );
    floor.rotation.x = -1;
    floor.position.y = -37.5;
    floor.position.z = -10;
    scene.add(floor);

    const texWall = texLoader.load("/textures/wall.jpg");
    const wall = new THREE.Mesh(
      new THREE.PlaneGeometry(500,500),
      new THREE.MeshStandardMaterial({ map: texWall })
    );
    wall.position.set(0, 0, -38);
    scene.add(wall);

    const loader = new GLTFLoader();

    loader.load("/models/table.glb", (gltf) => {
      const table = gltf.scene;
      table.scale.set(50,50,50);
      table.position.set(0, -0.5, -3);
      scene.add(table);

      loader.load("/models/macbook.glb", (gltf2) => {
        const macbook = gltf2.scene;
        macbook.scale.set(0.75, 0.75, 0.75);
        macbook.position.set(0, 0, 0);

        macbook.traverse((child: THREE.Object3D) => {
          if (child instanceof THREE.Mesh) {
            if (child.name === "Object_123") {
              child.material = new THREE.MeshBasicMaterial({ color: 0x000000 });
            }
          }
        });

        scene.add(macbook);

        loader.load("/models/coffee.glb", (gltf3) => {
          const coffee = gltf3.scene;
          coffee.scale.set(1.5,1.5,1.5);
          coffee.position.set(37.5, -38, -10);
          coffee.rotation.y += THREE.MathUtils.degToRad(180);
          scene.add(coffee);

          loader.load("/models/phone.glb", (gltf4) => {
            const phone = gltf4.scene;
            phone.scale.set(15,15,15);
            phone.position.set(-25, 0.25, 0);
            phone.rotation.x += THREE.MathUtils.degToRad(270);
            phone.rotation.z += THREE.MathUtils.degToRad(30);
            scene.add(phone);
          });
        });
      });
    });

    gsap.to(camera.position, {
      z: camera.position.z - 50,
      y: camera.position.y - 15,
      duration: 3,
      ease: "power1.inOut",
      onComplete: () => {
        dispatch("ready"); // <--- THIS
      }
    });

    const tick = () => {
      frame = requestAnimationFrame(tick);
      renderer.render(scene, camera);
    };
    tick();

    const resize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener("resize", resize);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      renderer.dispose();
      scene.clear();
    };
  });
</script>

<div class="w-full h-full bg-zinc-900">
  <canvas bind:this={canvas} class="w-full h-full" />
</div>
