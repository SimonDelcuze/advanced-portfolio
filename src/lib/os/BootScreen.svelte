<script lang="ts">
  import { onMount, createEventDispatcher } from 'svelte';
  import gsap from 'gsap';

  export let lines: string[] = [];

  const dispatch = createEventDispatcher();
  let container: HTMLDivElement;
  let rows: HTMLDivElement[] = [];

  onMount(() => {
    const valid = rows.filter(Boolean);
    valid.forEach((el) => (el.style.opacity = '0'));

    const tl = gsap.timeline({
      defaults: { ease: 'power2.out' },
      onComplete: () => {
        dispatch('done');
      }
    });

    tl.to(valid, {
      opacity: 1,
      duration: 10,
      stagger: 0.12
    });
  });
</script>

<div bind:this={container} class="font-mono text-[13px] leading-tight text-neutral-200">
  {#each lines as line, i (i)}
    <div
      bind:this={rows[i]}
      class="opacity-0 select-none"
      aria-hidden="true"
    >
      {line}
    </div>
  {/each}
</div>
