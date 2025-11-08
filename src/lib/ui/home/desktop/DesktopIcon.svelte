<script lang="ts">
  export let label: string;
  export let image: string;
  export let selected = false;
  export let dragging = false;
  export let featured = false;

  $: baseClasses = [
    "group w-[120px] rounded-xl border-2 border-transparent bg-white/10 backdrop-blur px-4 flex flex-col items-center gap-2 transition duration-150 ease-out select-none",
    featured ? "pb-" : "py-3",
    dragging ? "cursor-grabbing opacity-80" : "cursor-grab",
    selected ? "border-white/90 bg-blue-500/40" : featured ? "hover:bg-blue-500/20" : "hover:bg-white/20",
    featured ? "shadow-[0_30px_55px_rgba(20,80,255,0.55),0_0_35px_rgba(64,135,255,0.65)] border-white/70" : ""
  ]
    .filter(Boolean)
    .join(" ");

  $: iconWrapperClasses = featured
    ? "grid place-items-center w-28 h-24 transition duration-200"
    : "grid place-items-center w-16 h-16 transition duration-150";

  $: iconImgClasses = featured
    ? "w-24 h-28 drop-shadow-[0_10px_20px_rgba(15,15,20,0.45)] transition duration-200 group-hover:scale-110"
    : "w-14 h-14 drop-shadow-[0_4px_10px_rgba(15,15,20,0.45)] transition duration-150";
</script>

<button class={baseClasses} type="button" draggable="false">
  <span class={iconWrapperClasses}>
    <img src={image} alt={label} loading="lazy" decoding="async" class={iconImgClasses} />
  </span>
  <span class="text-center text-sm font-semibold tracking-tight text-white drop-shadow-md">{label}</span>
</button>
