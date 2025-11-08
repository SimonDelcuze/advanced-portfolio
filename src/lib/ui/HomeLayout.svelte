<script lang="ts">
  import { onMount } from 'svelte';
  import gsap from 'gsap';

  let root: HTMLDivElement;

  onMount(() => {
    gsap.from(root, { y: 24, opacity: 0, duration: 0.45, ease: 'power2.out' });
  });
</script>

<div bind:this={root} class="min-h-screen bg-neutral-950 text-neutral-100">
  <section class="max-w-5xl mx-auto px-6 py-20">
    <h1 class="text-5xl font-semibold tracking-tight">Your Name — Creative Developer</h1>
    <p class="mt-4 text-neutral-400 max-w-4xl">
      Portfolio starter. Replace this with your real hero / pitch. Smooth, minimal, confident.
    </p>
  </section>
</div>
