"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import styles from "./ResizableWorkspace.module.css";

interface Props {
  children: ReactNode;
  panel: ReactNode;
  title: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  className?: string;
  panelPosition?: "start" | "end";
  initialPanelSize?: number;
  mobileExclusive?: boolean;
  hideClosedToolbar?: boolean;
  stackedTabs?: boolean;
  primaryLabel?: string;
  panelLabel?: string;
  /** A parent-owned compact view; keeps both panes mounted without a second toolbar. */
  activePane?: "primary" | "panel";
}

/** Keeps both workspaces mounted while resizing, hiding, or expanding a panel. */
export function ResizableWorkspace({
  children,
  panel,
  title,
  open,
  onOpenChange,
  className = "",
  panelPosition = "end",
  initialPanelSize = 45,
  mobileExclusive = false,
  hideClosedToolbar = false,
  stackedTabs = false,
  primaryLabel = "Editor",
  panelLabel = "Preview",
  activePane,
}: Props) {
  const root = useRef<HTMLDivElement>(null);
  const panelId = useId();
  const body = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(
    Math.max(25, Math.min(75, initialPanelSize)),
  );
  const [height, setHeight] = useState(45);
  const [stacked, setStacked] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [stackedPane, setStackedPane] = useState<"primary" | "panel">("primary");
  const drag = useRef(false);

  useEffect(() => {
    const element = root.current;
    if (!element) return;
    const observe = () =>
      setStacked(element.getBoundingClientRect().width <= 760);
    observe();
    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", observe);
      return () => window.removeEventListener("resize", observe);
    }
    const observer = new ResizeObserver(observe);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!expanded) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setExpanded(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [expanded]);

  const resize = (amount: number) => {
    if (stacked)
      setHeight((value) => Math.max(25, Math.min(75, value + amount)));
    else setWidth((value) => Math.max(25, Math.min(75, value + amount)));
  };
  const close = () => {
    setExpanded(false);
    onOpenChange(false);
  };
  const controlledPane = activePane !== undefined;
  const mobileFull = !controlledPane && open && stacked && mobileExclusive;
  const full = !controlledPane && open && (expanded || mobileFull);
  const tabbed = !controlledPane && open && stacked && stackedTabs && !full;
  useEffect(() => {
    const element = root.current;
    if (controlledPane || !open || !expanded || mobileFull || !element || typeof element.showPopover !== "function") return;
    try {
      if (!element.matches(":popover-open")) element.showPopover();
    } catch {
      // Browsers without stable popover support retain the in-layout expanded panel.
      return;
    }
    return () => {
      try {
        if (element.matches(":popover-open")) element.hidePopover();
      } catch {
        // The node may already have unmounted during navigation.
      }
    };
  }, [open, expanded, mobileFull, controlledPane]);

  return (
    <div
      ref={root}
      style={full ? { display: "flex" } : undefined}
      popover={!controlledPane && open && expanded && !mobileFull ? "manual" : undefined}
      className={`${styles.root} ${mobileFull ? styles.mobileExclusive : ""} ${!controlledPane && open && expanded ? styles.fullScreen : ""} ${className}`}
    >
      <div className={styles.toolbar} hidden={controlledPane || (!open && hideClosedToolbar)}>
        <span className={`${styles.title} ${tabbed ? styles.tabbedTitle : ""}`}>{title}</span>
        {open ? (
          <>
            {tabbed ? <div role="group" aria-label={`${title} view`} className={styles.viewTabs}>
              <button type="button" aria-pressed={stackedPane === "primary"} aria-controls={`${panelId}-primary`} onClick={() => setStackedPane("primary")}>{primaryLabel}</button>
              <button type="button" aria-pressed={stackedPane === "panel"} aria-controls={panelId} onClick={() => setStackedPane("panel")}>{panelLabel}</button>
            </div> : !mobileFull && <>
            <button
              type="button"
              onClick={() => resize(-5)}
              disabled={expanded}
              aria-label={`Make ${title} smaller`}
            >
              Smaller
            </button>
            <button
              type="button"
              onClick={() => resize(5)}
              disabled={expanded}
              aria-label={`Make ${title} bigger`}
            >
              Bigger
            </button>
            <button
              type="button"
              onClick={() => setExpanded((value) => !value)}
              aria-pressed={expanded}
            >
              {expanded ? "Restore split view" : "Expand panel"}
            </button>
            </>}
            {!tabbed && <button
              type="button"
              onClick={close}
              aria-controls={panelId}
              aria-expanded
            >
              {mobileFull ? "Back to chat" : `Close ${title}`}
            </button>}
          </>
        ) : (
          <button
            type="button"
            onClick={() => onOpenChange(true)}
            aria-controls={panelId}
            aria-expanded={false}
          >
            Open {title}
          </button>
        )}
      </div>
      <div
        ref={body}
        className={`${styles.body} ${panelPosition === "start" ? styles.panelStart : ""} ${open ? styles.open : ""} ${full ? styles.expanded : ""} ${tabbed || controlledPane ? styles.tabbed : ""}`}
        style={
          {
            "--panel-width": `${width}%`,
            "--panel-height": `${height}%`,
          } as CSSProperties
        }
      >
        <div id={`${panelId}-primary`} className={styles.primary} hidden={controlledPane ? activePane === "panel" : full || (tabbed && stackedPane === "panel")}>
          {children}
        </div>
        {open && !full && !tabbed && !controlledPane && (
          <div
            role="separator"
            tabIndex={0}
            aria-label={`Resize ${title}`}
            aria-controls={panelId}
            aria-orientation={stacked ? "horizontal" : "vertical"}
            aria-valuemin={25}
            aria-valuemax={75}
            aria-valuenow={stacked ? height : width}
            aria-valuetext={
              stacked ? `${height} percent tall` : `${width} percent wide`
            }
            className={styles.separator}
            onKeyDown={(event) => {
              const amount = ["ArrowLeft", "ArrowUp"].includes(event.key)
                ? 5
                : ["ArrowRight", "ArrowDown"].includes(event.key)
                  ? -5
                  : 0;
              if (amount) {
                event.preventDefault();
                resize(panelPosition === "start" ? -amount : amount);
              }
              if (event.key === "Home" || event.key === "End") {
                event.preventDefault();
                if (stacked) setHeight(event.key === "Home" ? 25 : 75);
                else setWidth(event.key === "Home" ? 25 : 75);
              }
            }}
            onPointerDown={(event) => {
              if (event.button !== 0) return;
              event.preventDefault();
              drag.current = true;
              event.currentTarget.setPointerCapture(event.pointerId);
              setDragging(true);
            }}
            onPointerMove={(event) => {
              if (!drag.current || !body.current) return;
              const rect = body.current.getBoundingClientRect();
              const size = stacked ? rect.height : rect.width;
              if (!size) return;
              const remaining =
                panelPosition === "start"
                  ? stacked
                    ? event.clientY - rect.top
                    : event.clientX - rect.left
                  : stacked
                    ? rect.bottom - event.clientY
                    : rect.right - event.clientX;
              const percentage = Math.max(
                25,
                Math.min(75, Math.round((remaining / size) * 100)),
              );
              if (stacked) setHeight(percentage);
              else setWidth(percentage);
            }}
            onPointerUp={(event) => {
              drag.current = false;
              setDragging(false);
              if (event.currentTarget.hasPointerCapture(event.pointerId))
                event.currentTarget.releasePointerCapture(event.pointerId);
            }}
            onPointerCancel={() => {
              drag.current = false;
              setDragging(false);
            }}
            onLostPointerCapture={() => {
              drag.current = false;
              setDragging(false);
            }}
          >
            <span aria-hidden>⋮</span>
          </div>
        )}
        <section
          id={panelId}
          aria-label={title}
          className={styles.secondary}
          hidden={controlledPane ? activePane === "primary" : !open || (tabbed && stackedPane === "primary")}
        >
          {panel}
        </section>
        {dragging && <div className={styles.dragShield} />}
      </div>
    </div>
  );
}

