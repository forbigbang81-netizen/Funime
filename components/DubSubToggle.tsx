"use client";

import { useState } from "react";

export default function DubSubToggle() {
  const [dub, setDub] = useState(true);

  return (
    <div className="flex gap-2">
      <button
        onClick={() => setDub(true)}
        className={
          dub
            ? "bg-purple-600 px-4 py-2 rounded-lg"
            : "bg-zinc-700 px-4 py-2 rounded-lg"
        }
      >
        Dub
      </button>

      <button
        onClick={() => setDub(false)}
        className={
          !dub
            ? "bg-purple-600 px-4 py-2 rounded-lg"
            : "bg-zinc-700 px-4 py-2 rounded-lg"
        }
      >
        Sub
      </button>
    </div>
  );
}