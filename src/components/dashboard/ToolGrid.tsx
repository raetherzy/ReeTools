"use client";

import { tools } from "@/lib/tools";
import { ToolCard } from "./ToolCard";

export function ToolGrid() {
  return (
    <section className="max-w-7xl mx-auto px-6 pb-32">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {tools.map((tool, index) => (
          <ToolCard key={tool.id} tool={tool} index={index} />
        ))}
      </div>
    </section>
  );
}
