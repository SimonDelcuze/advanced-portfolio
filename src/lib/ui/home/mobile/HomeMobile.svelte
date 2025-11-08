<script lang="ts">
  import { onMount } from "svelte";
  import gsap from "gsap";

  let root: HTMLDivElement;

  onMount(() => {
    gsap.from(root, { y: 16, opacity: 0, duration: 0.4, ease: "power2.out" });
  });
</script>

<div bind:this={root} class="min-h-screen text-neutral-100">
  <section class="px-5 py-16 space-y-5">
    <p class="text-xs uppercase tracking-[0.4em] text-neutral-200">Portfolio</p>
    <h1 class="text-4xl font-semibold leading-tight drop-shadow-[0_3px_14px_rgba(0,0,0,0.5)]">
      Your Name — Creative Developer
    </h1>
    <p class="text-base text-neutral-200 leading-relaxed drop-shadow-[0_2px_12px_rgba(0,0,0,0.35)]">
      Portfolio starter. Replace this with your real hero / pitch. Smooth, minimal, confident.
    </p>
  </section>
</div>

