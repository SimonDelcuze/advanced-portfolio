<script lang="ts">
  import { onMount, createEventDispatcher } from "svelte";
  import * as THREE from "three";
  import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
  import gsap from "gsap";
  import { beginLoading, endLoading, setLoadingProgress } from "$lib/stores/loading";

  const dispatch = createEventDispatcher();

  let canvas: HTMLCanvasElement;
  let scene: THREE.Scene;
  let renderer: THREE.WebGLRenderer;
  let camera: THREE.PerspectiveCamera;
  let frame: number;
  let cameraTimeline: gsap.core.Timeline | null = null;
  let autoCompleteTimeout: ReturnType<typeof setTimeout> | null = null;
  let scrollProgress = 0;
  let fakeScrollValue = 0;
  let animationFinished = false;
  let showScrollHint = false;
  let hintTimeout: ReturnType<typeof setTimeout> | null = null;
  let sceneActivated = false;
  let listenersAttached = false;
  let loadingCompleted = false;
  let reportedProgress = 0;
  let fakeProgressInterval: ReturnType<typeof setInterval> | null = null;
  const LOADER_ID = "start-animation-desktop";

  const VIRTUAL_SCROLL_DISTANCE = 2500;
  const AUTO_COMPLETE_DELAY = 5000;
  const SCROLL_SENSITIVITY = 1;

  const setProgress = (value: number) => {
    if (!cameraTimeline) return;
    const clamped = gsap.utils.clamp(0, 1, value);
    scrollProgress = clamped;
    cameraTimeline.progress(clamped);
    if (clamped >= 1 && !animationFinished) {
      completeAnimation();
    }
  };

  const handleWheel = (event: WheelEvent) => {
    if (animationFinished || !cameraTimeline) return;
    event.preventDefault();
    fakeScrollValue = gsap.utils.clamp(
      0,
      VIRTUAL_SCROLL_DISTANCE,
      fakeScrollValue + event.deltaY * SCROLL_SENSITIVITY
    );
    setProgress(fakeScrollValue / VIRTUAL_SCROLL_DISTANCE);
    if (showScrollHint) {
      showScrollHint = false;
    }
  };

  const addInteractionListeners = () => {
    if (listenersAttached) return;
    window.addEventListener("wheel", handleWheel, { passive: false });
    listenersAttached = true;
  };

  const removeInteractionListeners = () => {
    if (!listenersAttached) return;
    window.removeEventListener("wheel", handleWheel);
    listenersAttached = false;
  };

  const forceCompleteAnimation = () => {
    if (animationFinished || !cameraTimeline) return;
    removeInteractionListeners();
    const proxy = { value: scrollProgress };
    gsap.to(proxy, {
      value: 1,
      duration: 0.8,
      ease: "power1.inOut",
      onUpdate: () => setProgress(proxy.value),
      onComplete: completeAnimation
    });
  };

  const completeAnimation = () => {
    if (animationFinished) return;
    animationFinished = true;
    removeInteractionListeners();
    if (autoCompleteTimeout) {
      clearTimeout(autoCompleteTimeout);
      autoCompleteTimeout = null;
    }
    if (hintTimeout) {
      clearTimeout(hintTimeout);
      hintTimeout = null;
    }
    showScrollHint = false;
    dispatch("ready");
  };

  const startRenderLoop = () => {
    const renderFrame = () => {
      frame = requestAnimationFrame(renderFrame);
      renderer.render(scene, camera);
    };
    renderFrame();
  };

  const activateScene = () => {
    if (sceneActivated) return;
    sceneActivated = true;
    showScrollHint = true;
    addInteractionListeners();
    autoCompleteTimeout = window.setTimeout(forceCompleteAnimation, AUTO_COMPLETE_DELAY);
    hintTimeout = window.setTimeout(() => {
      showScrollHint = false;
    }, 1500);
    startRenderLoop();
  };

  onMount(() => {
    beginLoading(LOADER_ID);
    setLoadingProgress(LOADER_ID, 0);
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

    const pushProgress = (value: number) => {
      reportedProgress = Math.max(reportedProgress, value);
      setLoadingProgress(LOADER_ID, reportedProgress);
    };

    const startFakeProgress = () => {
      if (fakeProgressInterval) return;
      fakeProgressInterval = window.setInterval(() => {
        if (loadingCompleted) return;
        pushProgress(Math.min(reportedProgress + 0.01, 0.92));
      }, 120);
    };

    const stopFakeProgress = () => {
      if (!fakeProgressInterval) return;
      clearInterval(fakeProgressInterval);
      fakeProgressInterval = null;
    };

    pushProgress(0.02);
    startFakeProgress();

    const loadingManager = new THREE.LoadingManager();
    loadingManager.onProgress = (_, loaded, total) => {
      if (total) {
        pushProgress(Math.min(0.95, loaded / total));
      }
    };
    loadingManager.onLoad = () => {
      loadingCompleted = true;
      stopFakeProgress();
      pushProgress(1);
      endLoading(LOADER_ID);
      activateScene();
    };

    const texLoader = new THREE.TextureLoader(loadingManager);

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

    const targetPosition = {
      z: camera.position.z - 50,
      y: camera.position.y - 15
    };

    cameraTimeline = gsap.timeline({ paused: true });
    cameraTimeline.to(camera.position, {
      z: targetPosition.z,
      y: targetPosition.y,
      duration: 2.5,
      ease: "power1.inOut"
    });

    const loader = new GLTFLoader(loadingManager);

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

    const resize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener("resize", resize);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      removeInteractionListeners();
      if (autoCompleteTimeout) {
        clearTimeout(autoCompleteTimeout);
        autoCompleteTimeout = null;
      }
      if (hintTimeout) {
        clearTimeout(hintTimeout);
        hintTimeout = null;
      }
      stopFakeProgress();
      cameraTimeline?.kill();
      renderer.dispose();
      scene.clear();
      if (!loadingCompleted) {
        endLoading(LOADER_ID);
      }
    };
  });
</script>

<div class="relative w-full h-full bg-zinc-900">
  <canvas bind:this={canvas} class="w-full h-full" />
  {#if showScrollHint}
    <div class="scroll-hint pointer-events-none">
      <span class="scroll-hint__label">Scroll down</span>
      <svg class="hint-arrow" width="20" height="40" viewBox="0 0 20 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M3 15L10 22L17 15" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
        <line x1="10" y1="4" x2="10" y2="22" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" />
      </svg>
    </div>
  {/if}
</div>

<style>
  .scroll-hint {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.75rem;
    color: #ffffff;
    animation: fadeOut 0.3s ease forwards;
    animation-delay: 1s;
  }

  .scroll-hint__label {
    font-size: clamp(1rem, 2vw, 1.5rem);
    text-transform: uppercase;
    letter-spacing: 0.35em;
    font-weight: 600;
  }

  .hint-arrow {
    animation: arrowBounce 1.2s ease-in-out infinite;
  }

  @keyframes arrowBounce {
    0% {
      transform: translateY(0);
      opacity: 0.4;
    }
    50% {
      transform: translateY(6px);
      opacity: 1;
    }
    100% {
      transform: translateY(0);
      opacity: 0.4;
    }
  }

  @keyframes fadeOut {
    to {
      opacity: 0;
    }
  }
</style>
