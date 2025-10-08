"use client";

import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { RxChevronDown } from "react-icons/rx";

interface SubNavLink {
  url: string;
  title: string;
}

interface NavLink {
  url: string;
  title: string;
  subMenuLinks?: SubNavLink[];
}

export interface EditableMenuItemProps {
  navLink: NavLink;
  index?: number;
  isMobile: boolean;
  className?: string;
}

export const EditableMenuItem: React.FC<EditableMenuItemProps> = ({
  navLink,
  isMobile,
  className = ""
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  if (navLink.subMenuLinks && navLink.subMenuLinks.length > 0) {
    return (
      <div
        onMouseEnter={() => !isMobile && setIsDropdownOpen(true)}
        onMouseLeave={() => !isMobile && setIsDropdownOpen(false)}
        className={className}
      >
        <button
          type="button"
          className="flex w-full items-center justify-between gap-2 py-3 text-left text-md lg:flex-none lg:justify-start lg:px-4 lg:py-2 lg:text-base"
          onClick={() => setIsDropdownOpen((prev) => !prev)}
        >
          <span>{navLink.title}</span>
          <motion.span
            variants={{
              rotated: { rotate: 180 },
              initial: { rotate: 0 }
            }}
            animate={isDropdownOpen ? "rotated" : "initial"}
            transition={{ duration: 0.3 }}
          >
            <RxChevronDown />
          </motion.span>
        </button>
        <AnimatePresence>
          {isDropdownOpen && (
            <motion.nav
              variants={{
                open: {
                  visibility: "visible",
                  opacity: "var(--opacity-open, 100%)",
                  y: 0
                },
                close: {
                  visibility: "hidden",
                  opacity: "var(--opacity-close, 0)",
                  y: "var(--y-close, 0%)"
                }
              }}
              animate={isDropdownOpen ? "open" : "close"}
              initial="close"
              exit="close"
              transition={{ duration: 0.2 }}
              className="bg-background-primary lg:absolute lg:z-50 lg:border lg:border-border-primary lg:p-2 lg:[--y-close:25%]"
            >
              {navLink.subMenuLinks?.map((subLink, index) => (
                <a
                  key={index}
                  href={subLink.url}
                  className="block py-3 pl-[5%] text-md lg:px-4 lg:py-2 lg:text-base"
                >
                  {subLink.title}
                </a>
              ))}
            </motion.nav>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <a
      href={navLink.url}
      className={`block py-3 text-md first:pt-7 lg:px-4 lg:py-2 lg:text-base first:lg:pt-2 ${className}`}
    >
      {navLink.title}
    </a>
  );
};
