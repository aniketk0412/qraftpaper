"use client";

import { AnimatePresence, motion } from "motion/react";
import { Plus } from "lucide-react";
import { useState } from "react";
import { Reveal } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/ui/section-heading";
import { easeOut } from "@/lib/motion";
import { faqs } from "@/lib/faqs";
import { cn } from "@/lib/utils";

export function Faq() {
  const [open, setOpen] = useState(0);

  return (
    <section id="faq" className="section-pad scroll-mt-24">
      <div className="mx-auto max-w-3xl px-5 sm:px-8">
        <SectionHeading
          align="center"
          eyebrow="Questions"
          title="Everything else you might ask"
        />

        <div className="mt-12 flex flex-col gap-2.5">
          {faqs.map((item, i) => {
            const isOpen = open === i;
            return (
              <Reveal key={item.q} delay={i * 0.04}>
                <div
                  className={cn(
                    "overflow-hidden rounded-xl border transition-colors duration-300",
                    isOpen
                      ? "border-line-strong bg-tint/[0.035]"
                      : "border-line bg-tint/[0.015]",
                  )}
                >
                  <button
                    type="button"
                    onClick={() => setOpen(isOpen ? -1 : i)}
                    className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                  >
                    <span className="text-[0.95rem] font-medium">{item.q}</span>
                    <span
                      className={cn(
                        "grid h-7 w-7 shrink-0 place-items-center rounded-full border border-line transition-all duration-300",
                        isOpen && "rotate-45 border-violet/40 bg-violet/15 text-violet-bright",
                      )}
                    >
                      <Plus className="h-4 w-4" />
                    </span>
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.32, ease: easeOut }}
                      >
                        <p className="px-5 pb-5 text-[0.88rem] leading-relaxed text-fg-muted">
                          {item.a}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
