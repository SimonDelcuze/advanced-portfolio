<script lang="ts">
  export let label: string;
  export let image: string;
  export let selected = false;
  export let dragging = false;
</script>

<button
  class="desktop-icon"
  class:selected={selected}
  class:dragging={dragging}
  type="button"
  draggable="false"
>
  <span class="icon-thumb">
    <img src={image} alt={label} loading="lazy" decoding="async" />
  </span>
  <span class="icon-label">{label}</span>
</button>

<style>
  .desktop-icon {
    width: 120px;
    border: 2px solid transparent;
    border-radius: 8px;
    padding: 16px 14px 12px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    background: rgba(5, 8, 18, 0.2);
    transition: border-color 0.15s ease, background 0.2s ease, transform 0.1s ease;
    cursor: grab;
    outline: none;
    user-select: none;
  }

  .desktop-icon:hover {
    background: rgba(5, 8, 18, 0.35);
  }

  .desktop-icon.selected {
    border-color: rgba(255, 255, 255, 0.9);
    background: rgba(45, 88, 255, 0.35);
  }

  .desktop-icon.dragging {
    cursor: grabbing;
    opacity: 0.85;
  }

  .icon-thumb {
    width: 64px;
    height: 64px;
    display: grid;
    place-items: center;
  }

  .icon-thumb img {
    width: 58px;
    height: 58px;
    object-fit: contain;
    filter: drop-shadow(0 4px 10px rgba(0, 0, 0, 0.45));
  }

  .icon-label {
    text-align: center;
    font-size: 0.95rem;
    font-weight: 500;
    color: #ffffff;
    text-shadow: 0 2px 6px rgba(0, 0, 0, 0.7);
  }
</style>
