"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 36);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const spring = reduceMotion
    ? { duration: 0.4, ease: "easeOut" as const }
    : { type: "spring" as const, stiffness: 160, damping: 24, mass: 0.7 };
  const quick = reduceMotion
    ? { duration: 0.1, ease: "easeOut" as const }
    : { type: "spring" as const, stiffness: 200, damping: 28, mass: 0.6 };

  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center px-3 pt-3 md:px-6">
      <motion.div
        layout
        transition={spring}
        className={[
          "pointer-events-auto relative flex items-center overflow-visible border border-white/20 text-white hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(0,0,0,0.4)]",
          "before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit] before:bg-gradient-to-b before:from-white/25 before:to-transparent before:opacity-60",
          "backdrop-blur-xl shadow-[0_8px_24px_rgba(0,0,0,0.32)]",
          isScrolled
            ? "h-12 w-[20rem] justify-between rounded-full bg-[#1e251f]/62 px-4 ring-1 ring-white/20"
            : "h-16 w-full max-w-6xl justify-between rounded-2xl bg-[#1e251f]/45 px-5 md:px-6",
        ].join(" ")}
      >
        <motion.div
          layout
          transition={spring}
          className="relative z-10 flex items-center gap-4"
        >
          <Link
          href="/"
          className={[
            "flex items-baseline tracking-[0.03em]",
            isScrolled ? "text-base" : "text-sm md:text-base",
          ].join(" ")}
        >
          <motion.span
            initial={false}
            animate={
              isScrolled
                ? { opacity: 0, x: 8 }
                : { opacity: 0.7, x: 0 }
            }
            transition={quick}
            className={[
              "inline-block overflow-hidden whitespace-nowrap",
              isScrolled ? "max-w-0" : "max-w-24",
            ].join(" ")}
            aria-hidden={isScrolled}
          >
            kevin
          </motion.span>
          <motion.span
            layout
            transition={quick}
            className="px-0.2 text-white font-extrabold tracking-[0.06em]"
          >
            acru
          </motion.span>
          <motion.span
            initial={false}
            animate={
              isScrolled
                ? { opacity: 0, x: -8 }
                : { opacity: 0.7, x: 0 }
            }
            transition={quick}
            className={[
              "inline-block overflow-hidden whitespace-nowrap",
              isScrolled ? "max-w-0" : "max-w-8",
            ].join(" ")}
            aria-hidden={isScrolled}
          >
            z
          </motion.span>
          </Link>
        </motion.div>

        <motion.div
          layout
          initial={false}
          animate={isScrolled ? { opacity: 1, x: 0 } : { opacity: 1, x: 0 }}
          transition={quick}
          className="relative z-10"
        >
          <NavigationMenu viewport>
            <NavigationMenuList className={isScrolled ? "gap-1" : "gap-2"}>
              <NavigationMenuItem>
                <NavigationMenuTrigger className="bg-transparent text-white hover:bg-white/10">
                  Work
                </NavigationMenuTrigger>

                <NavigationMenuContent className="bg-[#1e251f]/95 text-white border-white/10">
                  <ul className="w-56 p-2">
                    <li>
                      <NavigationMenuLink asChild>
                        <a
                          href="#projects"
                          className="block rounded px-3 py-2 text-sm hover:bg-white/10"
                        >
                          Projects
                        </a>
                      </NavigationMenuLink>
                    </li>
                    <li>
                      <NavigationMenuLink asChild>
                        <a
                          href="#certifications"
                          className="block rounded px-3 py-2 text-sm hover:bg-white/10"
                        >
                          Certifications
                        </a>
                      </NavigationMenuLink>
                    </li>
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <NavigationMenuLink asChild>
                  <a
                    href="#contact"
                    className={[
                      "text-sm text-white/90 hover:text-white",
                      isScrolled ? "px-2.5 py-1 rounded-full hover:bg-white/10" : "",
                    ].join(" ")}
                  >
                    Contact
                  </a>
                </NavigationMenuLink>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </motion.div>
      </motion.div>
    </header>
  );
}
