"use client";

import { useEffect, useState } from "react";
import type { TimelineEntry } from "@/lib/walkthrough";
import {
  computeRenderLines,
  countCurrentLines,
  type RenderLine,
} from "./code-lines";

interface CodeViewerProps {
  sourceCode: string;
  timeline: TimelineEntry[];
  currentIndex: number;
  onJumpToStep: (index: number) => void;
}

const REVEAL_CADENCE_MS = 180;

const STATUS_LABEL: Record<RenderLine["status"], string> = {
  current: "current step",
  completed: "reviewed",
  upcoming: "upcoming",
  idle: "",
};

export default function CodeViewer({
  sourceCode,
  timeline,
  currentIndex,
  onJumpToStep,
}: CodeViewerProps) {
  const lines = computeRenderLines(sourceCode, timeline, currentIndex);
  const currentCount = countCurrentLines(lines);

  // Progressive reveal of the active step's lines. Starts at 0 on every step
  // change; the initial deterministic state (0) matches on server + client, and
  // the animation is driven entirely from an effect after mount — hydration-safe.
  const [revealed, setRevealed] = useState(0);

  useEffect(() => {
    setRevealed(0);
    if (currentCount === 0) {
      return;
    }
    let n = 0;
    let timer: number;
    const tick = () => {
      n += 1;
      setRevealed(n);
      if (n < currentCount) {
        timer = window.setTimeout(tick, REVEAL_CADENCE_MS);
      }
    };
    timer = window.setTimeout(tick, REVEAL_CADENCE_MS);
    return () => window.clearTimeout(timer);
  }, [currentIndex, currentCount]);

  return (
    <section className="code-viewer" aria-label="Unit test source code">
      <header className="code-viewer__chrome" aria-hidden="true">
        <span className="code-viewer__dot" />
        <span className="code-viewer__dot" />
        <span className="code-viewer__dot" />
        <span className="code-viewer__filename">unit.test.ts</span>
      </header>
      <ol className="code-lines">
        {lines.map((line) => {
          const revealHidden =
            line.status === "current" &&
            line.currentOrder >= 0 &&
            line.currentOrder >= revealed;
          const isHotspot = line.hotspotIndex !== null;

          const classNames = [
            "code-line",
            `code-line--${line.status}`,
            revealHidden ? "code-line--pending" : "",
            isHotspot ? "code-line--hotspot" : "",
            line.isTestName ? "code-line--testname" : "",
          ]
            .filter(Boolean)
            .join(" ");

          const handleActivate = () => {
            if (line.hotspotIndex !== null) {
              onJumpToStep(line.hotspotIndex);
            }
          };

          return (
            <li
              key={line.number}
              className={classNames}
              role={isHotspot ? "button" : undefined}
              tabIndex={isHotspot ? 0 : undefined}
              aria-label={
                isHotspot
                  ? `Line ${line.number}, jump to this step`
                  : undefined
              }
              onClick={isHotspot ? handleActivate : undefined}
              onKeyDown={
                isHotspot
                  ? (event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        handleActivate();
                      }
                    }
                  : undefined
              }
            >
              <span className="code-line__gutter" aria-hidden="true">
                {line.number}
              </span>
              <code className="code-line__text">
                {line.text === "" ? " " : line.text}
              </code>
              {line.isTestName ? (
                <span className="code-line__cue" title="Test name">
                  test name
                </span>
              ) : null}
              {line.isCurrentBadgeAnchor ? (
                <span className="code-line__badge">
                  <span aria-hidden="true">●</span> {STATUS_LABEL.current}
                </span>
              ) : null}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
