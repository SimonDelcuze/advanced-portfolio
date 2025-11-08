<script lang="ts">
  import { onDestroy, onMount } from "svelte";
  import gsap from "gsap";
  import DesktopIcon from "$lib/ui/Home/DesktopIcon.svelte";

  const createIcon = (letter: string, color: string) => {
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='96' height='96' viewBox='0 0 96 96'><rect width='96' height='96' rx='18' fill='${color}'/><text x='50%' y='55%' dominant-baseline='middle' text-anchor='middle' font-family='Inter,Segoe UI,Arial' font-size='38' font-weight='600' fill='white'>${letter}</text></svg>`;
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  };

  const CELL_WIDTH = 150;
  const CELL_HEIGHT = 165;

  const initialIcons = [
    {
      id: "portfolio",
      label: "Portfolio",
      href: "https://example.com",
      image: createIcon("P", "#4cc9f0"),
      col: 0,
      row: 0
    },
    {
      id: "github",
      label: "GitHub",
      href: "https://github.com",
      image: createIcon("G", "#ff6b6b"),
      col: 1,
      row: 0
    },
    {
      id: "linkedin",
      label: "LinkedIn",
      href: "https://linkedin.com",
      image: createIcon("L", "#7b68ee"),
      col: 0,
      row: 1
    },
    {
      id: "contact",
      label: "Contact",
      href: "mailto:hello@example.com",
      image: createIcon("C", "#ffd166"),
      col: 1,
      row: 1
    }
  ];

  type IconConfig = typeof initialIcons[number];

  let icons: IconConfig[] = initialIcons;
  let selectedId: string | null = null;
  let draggingId: string | null = null;
  let activePointerId: number | null = null;
  let pointerStart = { x: 0, y: 0 };
  let origin = { col: 0, row: 0 };
  let captureElement: HTMLElement | null = null;
  let gridLimits = { cols: 8, rows: 12 };
  let restrictedArea: { x: number; y: number; width: number; height: number } | null = null;
  let gridRef: HTMLDivElement;
  let infoPanelRef: HTMLDivElement;
  let root: HTMLDivElement;

  const iconStyle = (icon: IconConfig) =>
    `transform: translate3d(${icon.col * CELL_WIDTH}px, ${icon.row * CELL_HEIGHT}px, 0)`;

  const handleSelect = (id: string) => {
    selectedId = id;
  };

  const handleOpen = (icon: IconConfig) => {
    if (!icon.href) return;
    window.open(icon.href, "_blank", "noopener,noreferrer");
  };

  const clampGrid = (value: number, max: number) => Math.max(0, Math.min(value, max));

  const intersectsRestricted = (col: number, row: number) => {
    if (!restrictedArea) return false;
    const rect = {
      x: col * CELL_WIDTH,
      y: row * CELL_HEIGHT,
      width: CELL_WIDTH,
      height: CELL_HEIGHT
    };
    const area = restrictedArea;
    return (
      rect.x < area.x + area.width &&
      rect.x + rect.width > area.x &&
      rect.y < area.y + area.height &&
      rect.y + rect.height > area.y
    );
  };

  const isOccupied = (col: number, row: number, ignoreId?: string | null) =>
    icons.some((icon) => icon.id !== ignoreId && icon.col === col && icon.row === row);

  const isBlocked = (col: number, row: number, ignoreId?: string | null) =>
    intersectsRestricted(col, row) || isOccupied(col, row, ignoreId);

  const findNearestAllowedPosition = (col: number, row: number, ignoreId?: string | null) => {
    if (!isBlocked(col, row, ignoreId)) {
      return { col, row };
    }

    let best = { col, row };
    let bestDist = Number.POSITIVE_INFINITY;

    for (let c = 0; c <= gridLimits.cols; c++) {
      for (let r = 0; r <= gridLimits.rows; r++) {
        if (isBlocked(c, r, ignoreId)) continue;
        const dist = Math.hypot(c - col, r - row);
        if (dist < bestDist) {
          best = { col: c, row: r };
          bestDist = dist;
        }
      }
    }

    return best;
  };

  const updateDraggingPosition = (clientX: number, clientY: number) => {
    if (!draggingId) return;
    const deltaX = clientX - pointerStart.x;
    const deltaY = clientY - pointerStart.y;
    const targetCol = clampGrid(
      Math.round((origin.col * CELL_WIDTH + deltaX) / CELL_WIDTH),
      gridLimits.cols
    );
    const targetRow = clampGrid(
      Math.round((origin.row * CELL_HEIGHT + deltaY) / CELL_HEIGHT),
      gridLimits.rows
    );

    const safe = findNearestAllowedPosition(targetCol, targetRow, draggingId);

    icons = icons.map((icon) =>
      icon.id === draggingId ? { ...icon, col: safe.col, row: safe.row } : icon
    );
  };

  const updateGridLimits = () => {
    if (!gridRef) return;
    const bounds = gridRef.getBoundingClientRect();
    const cols = Math.max(0, Math.floor(bounds.width / CELL_WIDTH) - 1);
    const rows = Math.max(0, Math.floor(bounds.height / CELL_HEIGHT) - 1);
    gridLimits = { cols, rows };

    if (infoPanelRef) {
      const infoBounds = infoPanelRef.getBoundingClientRect();
      restrictedArea = {
        x: infoBounds.left - bounds.left,
        y: infoBounds.top - bounds.top,
        width: infoBounds.width,
        height: infoBounds.height
      };
    } else {
      restrictedArea = null;
    }
  };

  const cleanupPointer = () => {
    window.removeEventListener("pointermove", handlePointerMove);
    window.removeEventListener("pointerup", handlePointerUp);
    window.removeEventListener("pointercancel", handlePointerCancel);
    if (captureElement && activePointerId !== null) {
      try {
        captureElement.releasePointerCapture(activePointerId);
      } catch {
        // ignore
      }
    }
    captureElement = null;
    activePointerId = null;
    draggingId = null;
  };

  const handlePointerMove = (event: PointerEvent) => {
    if (event.pointerId !== activePointerId) return;
    event.preventDefault();
    updateDraggingPosition(event.clientX, event.clientY);
  };

  const handlePointerUp = (event: PointerEvent) => {
    if (event.pointerId !== activePointerId) return;
    updateDraggingPosition(event.clientX, event.clientY);
    cleanupPointer();
  };

  const handlePointerCancel = (event: PointerEvent) => {
    if (event.pointerId !== activePointerId) return;
    cleanupPointer();
  };

  const handlePointerDown = (event: PointerEvent, icon: IconConfig) => {
    if (event.button !== 0) return;
    event.stopPropagation();
    event.preventDefault();
    handleSelect(icon.id);
    draggingId = icon.id;
    activePointerId = event.pointerId;
    pointerStart = { x: event.clientX, y: event.clientY };
    origin = { col: icon.col, row: icon.row };
    captureElement = event.currentTarget as HTMLElement;
    captureElement?.setPointerCapture?.(event.pointerId);
    updateGridLimits();
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerCancel);
  };

  onMount(() => {
    gsap.from(root, { y: 24, opacity: 0, duration: 0.45, ease: "power2.out" });
    updateGridLimits();
    window.addEventListener("resize", updateGridLimits);
  });

  onDestroy(() => {
    cleanupPointer();
    window.removeEventListener("resize", updateGridLimits);
  });
</script>

<div bind:this={root} class="desktop-stage text-neutral-100">
  <div class="icons-zone" bind:this={gridRef} on:click={() => (selectedId = null)}>
    {#each icons as icon (icon.id)}
      <div class="icon-wrapper" style={iconStyle(icon)}>
        <div
          class="icon-hit"
          on:click|stopPropagation={() => handleSelect(icon.id)}
          on:dblclick|stopPropagation={() => handleOpen(icon)}
          on:pointerdown={(event) => handlePointerDown(event, icon)}
        >
          <DesktopIcon
            label={icon.label}
            image={icon.image}
            selected={icon.id === selectedId}
            dragging={icon.id === draggingId}
          />
        </div>
      </div>
    {/each}
  </div>

  <section class="info-panel" bind:this={infoPanelRef}>
    <h1>Simon Delcuze</h1>
    <p>
      Je suis développeur Web. Je cherche un stage de 4 mois, d'avril à juillet 2026,
      pour mettre en pratique mes compétences et contribuer à des projets innovants.
    </p>
  </section>
</div>

<style>
  .desktop-stage {
    position: relative;
    min-height: 100vh;
    width: 100%;
    padding: clamp(1.5rem, 3vw, 3rem);
    overflow: hidden;
  }

  .icons-zone {
    position: absolute;
    inset: clamp(1.5rem, 3vw, 3rem);
    border-radius: 24px;
  }

  .icon-wrapper {
    position: absolute;
    transition: transform 0.12s ease;
  }

  .icon-hit {
    width: max-content;
    height: max-content;
  }

  .info-panel {
    position: absolute;
    right: clamp(2rem, 4vw, 4rem);
    bottom: clamp(2rem, 4vw, 3rem);
    width: min(420px, 35vw);
    padding: 2rem 2.5rem;
    backdrop-filter: blur(12px);
    background: rgba(3, 10, 25, 0.45);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 18px;
    box-shadow: 0 30px 80px rgba(0, 0, 0, 0.55);
  }

  .info-panel h1 {
    font-size: clamp(2.75rem, 4vw, 3.75rem);
    font-weight: 600;
    margin-bottom: 1rem;
    text-shadow: 0 10px 36px rgba(0, 0, 0, 0.6);
  }

  .info-panel p {
    color: rgba(255, 255, 255, 0.85);
    font-size: 1.05rem;
    line-height: 1.7;
    max-width: 32rem;
  }

  @media (max-width: 1200px) {
    .desktop-stage {
      grid-template-columns: 1fr;
    }

    .info-panel {
      order: -1;
    }
  }
</style>
