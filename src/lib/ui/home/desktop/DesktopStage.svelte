<script lang="ts">
  import { onDestroy, onMount } from "svelte";
  import gsap from "gsap";
  import DesktopIcon from "./DesktopIcon.svelte";
  import DesktopInfoPanel from "./DesktopInfoPanel.svelte";

  const createIcon = (letter: string, color: string) => {
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='96' height='96' viewBox='0 0 96 96'><rect width='96' height='96' rx='18' fill='${color}'/><text x='50%' y='55%' dominant-baseline='middle' text-anchor='middle' font-family='Inter,Segoe UI,Arial' font-size='38' font-weight='600' fill='white'>${letter}</text></svg>`;
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  };

  const CELL_WIDTH = 150;
  const CELL_HEIGHT = 165;

  const initialIcons = [
    {
      id: "projets",
      label: "Projets",
      href: "/projets",
      image: "https://res.cloudinary.com/diree8d1h/image/upload/v1762635013/projets_qztnnh.png",
      col: 6,
      row: 2
    },
    {
      id: "github",
      label: "GitHub",
      href: "https://github.com/SimonDelcuze",
      image: "https://cdn.pixabay.com/photo/2022/01/30/13/33/github-6980894_960_720.png",
      col: 5,
      row: 2
    },
    {
      id: "linkedin",
      label: "LinkedIn",
      href: "https://www.linkedin.com/in/simon-delcuze/",
      image: "https://img.icons8.com/color/512/linkedin.png",
      col: 4,
      row: 2
    },
    {
      id: "contact",
      label: "Email",
      href: "mailto:contact@sdelcuze.fr",
      image: "https://images.icon-icons.com/2631/PNG/512/gmail_new_logo_icon_159149.png",
      col: 7,
      row: 2
    },
    {
      id: "about",
      label: "About me",
      href: "/about",
      image: "https://res.cloudinary.com/diree8d1h/image/upload/v1762635140/about_d9e30i.png",
      col: 8,
      row: 2
    }
  ];

  type IconConfig = typeof initialIcons[number];

  let icons: IconConfig[] = initialIcons;
  let selectedIds: Set<string> = new Set();
  let draggingIds: string[] = [];
  let draggingAnchorId: string | null = null;
  let draggingSet: Set<string> = new Set();
  let groupOrigins = new Map<string, { col: number; row: number }>();
  let activePointerId: number | null = null;
  let pointerStart = { x: 0, y: 0 };
  let captureElement: HTMLElement | null = null;
  let gridLimits = { cols: 8, rows: 12 };
  let restrictedArea: { x: number; y: number; width: number; height: number } | null = null;
  let gridRef: HTMLDivElement;
  let infoPanelRef: HTMLDivElement;
  let root: HTMLDivElement;
  let marquee = {
    active: false,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0
  };
  $: marqueeRect = getMarqueeRect();
  let isDraggingIcons = false;

  const iconStyle = (icon: IconConfig) =>
    `transform: translate3d(${icon.col * CELL_WIDTH}px, ${icon.row * CELL_HEIGHT}px, 0)`;

  const setSelection = (ids: string[]) => {
    selectedIds = new Set(ids);
  };

  const clearSelection = () => {
    setSelection([]);
  };

  const setDragging = (ids: string[]) => {
    draggingIds = ids;
    draggingSet = new Set(ids);
  };

  const handleSelect = (id: string) => {
    setSelection([id]);
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

  const isOccupied = (col: number, row: number, ignore?: Set<string>) =>
    icons.some((icon) => !(ignore?.has(icon.id)) && icon.col === col && icon.row === row);

  const isBlocked = (col: number, row: number, ignore?: Set<string>) =>
    intersectsRestricted(col, row) || isOccupied(col, row, ignore);

  const findNearestAllowedPosition = (col: number, row: number, ignore?: Set<string>) => {
    if (!isBlocked(col, row, ignore)) {
      return { col, row };
    }

    let best = { col, row };
    let bestDist = Number.POSITIVE_INFINITY;

    for (let c = 0; c <= gridLimits.cols; c++) {
      for (let r = 0; r <= gridLimits.rows; r++) {
        if (isBlocked(c, r, ignore)) continue;
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
    if (!draggingAnchorId || draggingIds.length === 0) return;
    const deltaX = clientX - pointerStart.x;
    const deltaY = clientY - pointerStart.y;
    const anchorBase = groupOrigins.get(draggingAnchorId);
    if (!anchorBase) return;

    const targetCol = clampGrid(
      Math.round((anchorBase.col * CELL_WIDTH + deltaX) / CELL_WIDTH),
      gridLimits.cols
    );
    const targetRow = clampGrid(
      Math.round((anchorBase.row * CELL_HEIGHT + deltaY) / CELL_HEIGHT),
      gridLimits.rows
    );

    if (draggingIds.length === 1) {
      const safe = findNearestAllowedPosition(targetCol, targetRow, draggingSet);
      icons = icons.map((icon) =>
        draggingSet.has(icon.id) ? { ...icon, col: safe.col, row: safe.row } : icon
      );
      return;
    }

    const offsetCol = targetCol - anchorBase.col;
    const offsetRow = targetRow - anchorBase.row;
    const newPositions = new Map<string, { col: number; row: number }>();
    const occupied = new Set<string>();
    let blocked = false;

    for (const id of draggingIds) {
      const base = groupOrigins.get(id);
      if (!base) continue;
      const col = clampGrid(base.col + offsetCol, gridLimits.cols);
      const row = clampGrid(base.row + offsetRow, gridLimits.rows);

      if (isBlocked(col, row, draggingSet) || occupied.has(`${col}:${row}`)) {
        blocked = true;
        break;
      }

      newPositions.set(id, { col, row });
      occupied.add(`${col}:${row}`);
    }

    if (blocked) return;

    icons = icons.map((icon) =>
      newPositions.has(icon.id) ? { ...icon, ...newPositions.get(icon.id)! } : icon
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
    draggingAnchorId = null;
    setDragging([]);
    isDraggingIcons = false;
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
    stopMarquee();
    const target = event.currentTarget as HTMLElement;
    target?.focus?.();

    const isAlreadySelected = selectedIds.has(icon.id);
    const dragGroup = isAlreadySelected && selectedIds.size
      ? Array.from(selectedIds)
      : [icon.id];

    if (!isAlreadySelected) {
      handleSelect(icon.id);
    }

    setDragging(dragGroup);
    groupOrigins = new Map();
    dragGroup.forEach((id) => {
      const matched = icons.find((ic) => ic.id === id);
      if (matched) {
        groupOrigins.set(id, { col: matched.col, row: matched.row });
      }
    });
    draggingAnchorId = icon.id;
    activePointerId = event.pointerId;
    pointerStart = { x: event.clientX, y: event.clientY };
    captureElement = event.currentTarget as HTMLElement;
    captureElement?.setPointerCapture?.(event.pointerId);
    updateGridLimits();
    isDraggingIcons = true;
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerCancel);
  };

  const getMarqueeRect = () => {
    if (!marquee.active) return null;
    const x = Math.min(marquee.startX, marquee.currentX);
    const y = Math.min(marquee.startY, marquee.currentY);
    const width = Math.abs(marquee.currentX - marquee.startX);
    const height = Math.abs(marquee.currentY - marquee.startY);
    if (width < 6 && height < 6) {
      return null;
    }
    return { x, y, width, height };
  };

  const updateMarqueeSelection = () => {
    if (!gridRef || !marquee.active) return;
    const rect = getMarqueeRect();
    if (!rect) {
      clearSelection();
      return;
    }
    const selected = icons
      .filter((icon) => {
        const iconRect = {
          x: icon.col * CELL_WIDTH,
          y: icon.row * CELL_HEIGHT,
          width: CELL_WIDTH,
          height: CELL_HEIGHT
        };
        return (
          iconRect.x < rect.x + rect.width &&
          iconRect.x + iconRect.width > rect.x &&
          iconRect.y < rect.y + rect.height &&
          iconRect.y + iconRect.height > rect.y
        );
      })
      .map((icon) => icon.id);

    setSelection(selected);
  };

  const handleMarqueeMove = (event: PointerEvent) => {
    if (!marquee.active || !gridRef) return;
    const bounds = gridRef.getBoundingClientRect();
    marquee = {
      ...marquee,
      currentX: event.clientX - bounds.left,
      currentY: event.clientY - bounds.top
    };
    updateMarqueeSelection();
  };

  const stopMarquee = () => {
    marquee = { active: false, startX: 0, startY: 0, currentX: 0, currentY: 0 };
    window.removeEventListener("pointermove", handleMarqueeMove);
    window.removeEventListener("pointerup", handleMarqueeUp);
  };

  const handleMarqueeUp = () => {
    stopMarquee();
  };

  const handleZonePointerDown = (event: PointerEvent) => {
    if (event.button !== 0) return;
    if ((event.target as HTMLElement).closest(".icon-hit")) return;
    if (!gridRef) return;
    event.preventDefault();
    clearSelection();
    const bounds = gridRef.getBoundingClientRect();
    marquee = {
      active: true,
      startX: event.clientX - bounds.left,
      startY: event.clientY - bounds.top,
      currentX: event.clientX - bounds.left,
      currentY: event.clientY - bounds.top
    };
    window.addEventListener("pointermove", handleMarqueeMove);
    window.addEventListener("pointerup", handleMarqueeUp);
  };

  const handleGlobalPointerDown = (event: PointerEvent) => {
    if (!root || isDraggingIcons) return;
    const target = event.target as HTMLElement;
    if (!root.contains(target)) {
      clearSelection();
      return;
    }
    if (target.closest(".icon-hit")) return;
    if (target.closest(".selection-rect")) return;
    if (event.button !== 0) return;
    clearSelection();
  };

  onMount(() => {
    gsap.from(root, { y: 24, opacity: 0, duration: 0.45, ease: "power2.out" });
    updateGridLimits();
    window.addEventListener("resize", updateGridLimits);
    window.addEventListener("pointerdown", handleGlobalPointerDown, true);
  });

  onDestroy(() => {
    cleanupPointer();
    window.removeEventListener("resize", updateGridLimits);
    stopMarquee();
    window.removeEventListener("pointerdown", handleGlobalPointerDown, true);
  });
</script>

<div bind:this={root} class="desktop-stage text-neutral-100">
  <div
    class="icons-zone"
    bind:this={gridRef}
    on:pointerdown={handleZonePointerDown}
  >
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
            selected={selectedIds.has(icon.id)}
            dragging={draggingSet.has(icon.id)}
          />
        </div>
      </div>
    {/each}
    {#if marqueeRect}
      <div
        class="selection-rect"
        style={`left:${marqueeRect.x}px;top:${marqueeRect.y}px;width:${marqueeRect.width}px;height:${marqueeRect.height}px;`}
      />
    {/if}
  </div>

  <section class="info-panel" bind:this={infoPanelRef}>
    <DesktopInfoPanel />
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

  .selection-rect {
    position: absolute;
    border: 1px solid rgba(99, 154, 255, 0.95);
    background: rgba(99, 154, 255, 0.35);
    box-shadow: 0 6px 24px rgba(32, 70, 180, 0.45);
    border-radius: 10px;
    pointer-events: none;
    z-index: 5;
    mix-blend-mode: screen;
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
