<script lang="ts">
  import StartAnimationDesktop from '$lib/os/StartAnimationDesktop.svelte';
  import BootScreen from '$lib/os/BootScreen.svelte';
  import HomeLayout from '$lib/ui/HomeLayout.svelte';

  // 0 = start anim 3D
  // 1 = boot screen terminal
  // 2 = homepage UI
  let phase = 0;

  function onStartDone(){
    phase = 1;
  }

  function onBootDone(){
    phase = 2;
  }
</script>

{#if phase === 0}
  <StartAnimationDesktop on:ready={onStartDone} />
{:else if phase === 1}
  <BootScreen on:done={onBootDone} />
{:else if phase === 2}
  <HomeLayout />
{/if}
