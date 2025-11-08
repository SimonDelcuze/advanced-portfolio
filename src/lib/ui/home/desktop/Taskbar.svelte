<script lang="ts">
  import { createEventDispatcher, onMount } from "svelte";
  import { cubicOut } from "svelte/easing";
  import { slide } from "svelte/transition";

  export type TaskbarIcon = {
    id: string;
    label: string;
    image: string;
    href?: string;
  };

  export let icons: TaskbarIcon[] = [];

  const dispatch = createEventDispatcher<{ open: { icon: TaskbarIcon } }>();

  let startOpen = false;
  let taskbarEl: HTMLDivElement;

  const toggleStart = () => {
    startOpen = !startOpen;
  };

  const closeStart = () => {
    startOpen = false;
  };

  const handleGlobalClick = (event: PointerEvent) => {
    if (!startOpen) return;
    if (!taskbarEl.contains(event.target as Node)) {
      startOpen = false;
    }
  };

  onMount(() => {
    document.addEventListener("pointerdown", handleGlobalClick, true);
    return () => {
      document.removeEventListener("pointerdown", handleGlobalClick, true);
    };
  });

  const handleIconClick = (icon: TaskbarIcon) => {
    dispatch("open", { icon });
  };
</script>

<div class="taskbar" bind:this={taskbarEl}>
  <div class="taskbar-center">
    <button class="start-button" on:click={toggleStart} aria-label="Open start menu">
      <span class="start-logo">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 4875 4875" aria-hidden="true">
          <path fill="#0078d4" d="M0 0h2311v2310H0zm2564 0h2311v2310H2564zM0 2564h2311v2311H0zm2564 0h2311v2311H2564" />
        </svg>
      </span>
    </button>
    <div class="taskbar-icons">
      {#each icons as icon}
        <button
          class="taskbar-icon"
          on:click={() => handleIconClick(icon)}
          aria-label={`Ouvrir ${icon.label}`}
        >
          <img src={icon.image} alt={icon.label} />
        </button>
      {/each}
    </div>
  </div>

  {#if startOpen}
    <div class="start-menu floating" transition:slide={{ y: 30, duration: 200, easing: cubicOut }}>
      <div class="start-menu__header">Applications</div>
      <div class="start-menu__grid">
        {#each icons as icon}
          <button class="start-menu__tile" on:click={() => handleIconClick(icon)}>
            <img src={icon.image} alt={icon.label} />
            <span>{icon.label}</span>
          </button>
        {/each}
      </div>
    </div>
  {/if}
</div>

<style>
  .taskbar {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    height: 64px;
    padding: 0 1.5rem;
    background: rgba(5, 8, 18, 0.65);
    backdrop-filter: blur(18px);
    border-top: 1px solid rgba(255, 255, 255, 0.08);
    display: flex;
    align-items: center;
    gap: 1rem;
    z-index: 30;
    justify-content: center;
  }

  .taskbar-center {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .start-button {
    width: 46px;
    height: 46px;
    border-radius: 10px;
    border: none;
    background: rgba(255, 255, 255, 0.15);
    display: grid;
    place-items: center;
    color: #ffffff;
    font-size: 1.2rem;
    cursor: pointer;
    transition: background 0.2s ease;
  }

  .start-button:hover {
    background: rgba(255, 255, 255, 0.25);
  }

  .taskbar-icons {
    display: flex;
    gap: 0.75rem;
  }

  .start-logo svg {
    width: 30px;
    height: 30px;
  }

  .taskbar-icon {
    width: 42px;
    height: 42px;
    border-radius: 12px;
    border: none;
    background: transparent;
    cursor: pointer;
    display: grid;
    place-items: center;
    transition: background 0.2s ease;
  }

  .taskbar-icon:hover {
    background: rgba(255, 255, 255, 0.12);
  }

  .taskbar-icon img {
    width: 28px;
    height: 28px;
    object-fit: contain;
  }

  .start-menu {
    position: absolute;
    bottom: 64px;
    left: 50%;
    transform: translateX(-50%);
    width: min(540px, 80vw);
    background: rgba(5, 8, 18, 0.9);
    border-radius: 24px 24px 12px 12px;
    padding: 1.5rem;
    border: 1px solid rgba(255, 255, 255, 0.08);
    box-shadow: 0 40px 80px rgba(0, 0, 0, 0.6);
  }

  .start-menu__header {
    color: rgba(255, 255, 255, 0.75);
    font-size: 0.85rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    margin-bottom: 1rem;
  }

  .start-menu__grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: 0.75rem;
  }

  .start-menu__tile {
    background: rgba(255, 255, 255, 0.1);
    border: none;
    border-radius: 16px;
    padding: 0.75rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.75rem;
    cursor: pointer;
    color: white;
    transition: background 0.2s ease;
  }

  .start-menu__tile:hover {
    background: rgba(255, 255, 255, 0.18);
  }

  .start-menu__tile img {
    width: 36px;
    height: 36px;
  }

  .start-menu__tile span {
    font-size: 0.9rem;
  }
</style>
