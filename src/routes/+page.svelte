<script lang="ts">
  import { onMount } from "svelte";

  import StartAnimationDesktop from '$lib/os/StartAnimationDesktop.svelte';
  import StartAnimationMobile from '$lib/os/StartAnimationMobile.svelte';
  import BootScreen from '$lib/os/BootScreen.svelte';
  import HomeLayout from '$lib/ui/HomeLayout.svelte';

  // 0 = start animation
  // 1 = bootscreen
  // 2 = homepage
  let phase = 0;

  let isMobile = false;

  onMount(() => {
    const mq = window.matchMedia("(max-width: 900px)");
    isMobile = mq.matches;

    mq.addEventListener("change", (e) => {
      isMobile = e.matches;
    });
  });

  function onStartDone(){
    phase = 1;
  }

  function onBootDone(){
      phase = 2;
  }
</script>

{#if phase === 0}
  {#if isMobile}
    <StartAnimationMobile on:ready={onStartDone} />
  {:else}
    <StartAnimationDesktop on:ready={onStartDone} />
  {/if}
{:else if phase === 1}
  <BootScreen on:done={onBootDone} />
{:else if phase === 2}
  <HomeLayout />
{/if}
