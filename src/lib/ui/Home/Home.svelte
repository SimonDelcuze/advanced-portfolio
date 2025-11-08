<script lang="ts">
  import { onMount } from "svelte";
  import HomeDesktop from "$lib/ui/Home/HomeDesktop.svelte";
  import HomeMobile from "$lib/ui/Home/HomeMobile.svelte";

  const MOBILE_QUERY = "(max-width: 900px)";

  let isMobile = false;
  let mounted = false;

  onMount(() => {
    const mq = window.matchMedia(MOBILE_QUERY);
    const handleChange = (event: MediaQueryListEvent) => {
      isMobile = event.matches;
    };

    isMobile = mq.matches;
    mq.addEventListener("change", handleChange);
    mounted = true;

    return () => {
      mq.removeEventListener("change", handleChange);
    };
  });

  $: backgroundUrl = isMobile
    ? "/textures/home_background_mobile.jpeg"
    : "/textures/home_background_desktop.webp";
</script>

<div
  class="home-shell"
  style={`background-image: url(${backgroundUrl});`}
>
  <div class="home-overlay">
    {#if mounted}
      {#if isMobile}
        <HomeMobile />
      {:else}
        <HomeDesktop />
      {/if}
    {:else}
      <HomeDesktop />
    {/if}
  </div>
</div>

<style>
  .home-shell {
    min-height: 100vh;
    width: 100%;
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
  }

  .home-overlay {
    min-height: inherit;
    width: 100%;
    display: flex;
    flex-direction: column;
  }
</style>
