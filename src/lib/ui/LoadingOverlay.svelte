<script lang="ts">
  import { loadingState } from "$lib/stores/loading";
  import { tweened } from "svelte/motion";
  import { cubicOut } from "svelte/easing";

  const progressTween = tweened(0, { duration: 300, easing: cubicOut });

  $: active = $loadingState.active;
  $: progressValue = $loadingState.progress;
  $: progressTween.set(progressValue);
  $: displayedProgress = Math.round($progressTween * 100);

  const radius = 80;
  const circumference = 2 * Math.PI * radius;
</script>

{#if active}
  <div class="loading-overlay">
    <div class="loading-card">
      <svg class="progress-ring" viewBox="0 0 220 220">
        <circle class="ring-bg" cx="110" cy="110" r={radius} />
        <circle
          class="ring-progress"
          cx="110"
          cy="110"
          r={radius}
          stroke-dasharray={circumference}
          stroke-dashoffset={circumference - $progressTween * circumference}
        />
        <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle">{displayedProgress}%</text>
      </svg>
      <p class="hint">Chargement</p>
    </div>
  </div>
{/if}

<style>
  .loading-overlay {
    position: fixed;
    inset: 0;
    display: grid;
    place-items: center;
    background: #050508;
    pointer-events: auto;
    z-index: 9999;
  }

  .loading-card {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1.5rem;
    color: white;
  }

  .progress-ring {
    width: min(320px, 60vw);
    height: min(320px, 60vw);
  }

  .ring-bg {
    fill: none;
    stroke: rgba(255, 255, 255, 0.12);
    stroke-width: 8;
  }

  .ring-progress {
    fill: none;
    stroke: white;
    stroke-width: 8;
    stroke-linecap: round;
    transform-origin: center;
    transform: rotate(-90deg);
    transition: stroke-dashoffset 0.2s ease;
  }

  text {
    font-size: 3rem;
    font-weight: 600;
    letter-spacing: 0.05em;
    fill: #ffffff;
  }

  .hint {
    text-transform: uppercase;
    letter-spacing: 0.5em;
    font-size: 0.85rem;
    color: rgba(255, 255, 255, 0.65);
  }
</style>
