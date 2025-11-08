<script lang="ts">
  import { onMount, createEventDispatcher } from "svelte";

  const dispatch = createEventDispatcher();

  let lines:string[] = [];
  let showPrompt = false;
  let message = "";

  let selected = "yes"; // yes | no

  function push(line:string, delay:number){
    return new Promise((resolve)=>{
      setTimeout(()=>{
        lines = [...lines, line];
        resolve(true);
      }, delay);
    })
  }

  function start(){
    dispatch("done");
  }

  async function refuse(){
    showPrompt = false;
    message = "Starting anyway...";
    await new Promise(r=>setTimeout(r,1200));
    dispatch("done");
  }

  onMount(async ()=>{

    await push("[BOOT] Initializing kernel...", 250);
    await push("[BOOT] Mounting filesystem...", 350);
    await push("[BOOT] Checking services...", 300);
    await push("[BOOT] Loading GPU stack...", 300);
    await push("[BOOT] Loading UI runtime...", 350);
    await push("[BOOT] Handshake with pipeline...", 250);

    setTimeout(()=>{ showPrompt = true },700);

    // auto start 5s
    setTimeout(()=>{
      if(!message && showPrompt){
        start();
      }
    },5000);

    window.addEventListener("keydown",(e)=>{
      if(!showPrompt) return;

      if(e.code==="ArrowLeft" || e.code==="ArrowRight"){
        selected = selected==="yes" ? "no" : "yes";
      }

      if(e.code==="Enter"){
        if(selected==="yes") start();
        else refuse();
      }
    });
  });
</script>

<div class="w-full h-screen bg-black text-neutral-300 font-mono flex flex-col items-center justify-center p-10 select-none">
  <div class="max-w-3xl w-full flex flex-col gap-2 text-xl text-center">
    {#each lines as l}
      <div>{l}</div>
    {/each}

    {#if showPrompt}
      <div class="mt-6 text-green-400 font-extrabold text-4xl">Boot ready</div>

      <div class="mt-4 flex items-center justify-center gap-6 text-white text-2xl">
        <span>Start ?</span>

        <button
          on:click={start}
          class="px-6 py-2 font-bold rounded bg-green-600 text-black
          {selected==='yes' ? 'ring-4 ring-green-300 scale-105' : ''}">
          Yes
        </button>

        <button
          on:click={refuse}
          class="px-6 py-2 rounded font-bold text-white bg-red-700
          {selected==='no' ? 'ring-4 ring-red-400 scale-105' : ''}">
          No
        </button>
      </div>
    {/if}

    {#if message}
      <div class="mt-6 text-yellow-400 text-3xl">{message}</div>
    {/if}
  </div>
</div>
