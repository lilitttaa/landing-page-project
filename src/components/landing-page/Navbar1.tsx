"use client";
import { EditableLink, EditableButton } from "@/components/editable";
import { useState } from "react";
import { Button, useMediaQuery } from "../common";
import type { ButtonProps } from "../common";
import { AnimatePresence, motion } from "framer-motion";
import { RxChevronDown } from "react-icons/rx";
type ImageProps = {
    url?: string;
    src: string;
    alt?: string;
};
type SubNavLink = {
    url: string;
    title: string;
};
type NavLink = {
    url: string;
    title: string;
    subMenuLinks?: SubNavLink[];
};
type Props = {
    logo: ImageProps;
    navLinks: NavLink[];
    buttons: ButtonProps[];
};
export type Navbar1Props = React.ComponentPropsWithoutRef<"section"> & Partial<Props>;
export const Navbar1 = (props: Navbar1Props) => {
    const { logo, navLinks, buttons } = {
        ...Navbar1Defaults,
        ...props,
    };
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const isMobile = useMediaQuery("(max-width: 991px)");
    return (<section id="relume" className="z-[999] flex w-full items-center border-b border-border-primary bg-background-primary lg:min-h-18 lg:px-[5%]">
      <div className="size-full lg:flex lg:items-center lg:justify-between">
        <div className="flex min-h-16 items-center justify-between px-[5%] md:min-h-18 lg:min-h-full lg:px-0">
          <EditableLink textPath="link_0.text" urlPath="link_0.url" href={logo.url}><img src={logo.src} alt={logo.alt}/></EditableLink>
          <button className="-mr-2 flex size-12 flex-col items-center justify-center lg:hidden" onClick={() => setIsMobileMenuOpen((prev) => !prev)}>
            <motion.span className="my-[3px] h-0.5 w-6 bg-black" animate={isMobileMenuOpen ? ["open", "rotatePhase"] : "closed"} variants={topLineVariants}/>
            <motion.span className="my-[3px] h-0.5 w-6 bg-black" animate={isMobileMenuOpen ? "open" : "closed"} variants={middleLineVariants}/>
            <motion.span className="my-[3px] h-0.5 w-6 bg-black" animate={isMobileMenuOpen ? ["open", "rotatePhase"] : "closed"} variants={bottomLineVariants}/>
          </button>
        </div>
        <motion.div variants={{
            open: {
                height: "var(--height-open, 100dvh)",
            },
            close: {
                height: "var(--height-closed, 0)",
            },
        }} initial="close" exit="close" animate={isMobileMenuOpen ? "open" : "close"} transition={{ duration: 0.4 }} className="overflow-hidden px-[5%] lg:flex lg:items-center lg:px-0 lg:[--height-closed:auto] lg:[--height-open:auto]">
          {navLinks.map((navLink, index) => navLink.subMenuLinks && navLink.subMenuLinks.length > 0 ? (<SubMenu key={index} navLink={navLink} isMobile={isMobile}/>) : (<EditableLink textPath="link_1.text" urlPath="link_1.url" key={index} className="block py-3 text-md first:pt-7 lg:px-4 lg:py-2 lg:text-base first:lg:pt-2" href={navLink.url}>{navLink.title}</EditableLink>))}
          <div className="mt-6 flex flex-col items-center gap-4 lg:ml-4 lg:mt-0 lg:flex-row">
            {buttons.map((button, index) => (<EditableButton textPath="button_2.text" as="Button" key={index} {...button} className="w-full"></EditableButton>))}
          </div>
        </motion.div>
      </div>
    </section>);
};
const SubMenu = ({ navLink, isMobile }: {
    navLink: NavLink;
    isMobile: boolean;
}) => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    return (<div onMouseEnter={() => !isMobile && setIsDropdownOpen(true)} onMouseLeave={() => !isMobile && setIsDropdownOpen(false)}>
      <button className="flex w-full items-center justify-between gap-2 py-3 text-left text-md lg:flex-none lg:justify-start lg:px-4 lg:py-2 lg:text-base" onClick={() => setIsDropdownOpen((prev) => !prev)}>
        <span>{navLink.title}</span>
        <motion.span variants={{
            rotated: { rotate: 180 },
            initial: { rotate: 0 },
        }} animate={isDropdownOpen ? "rotated" : "initial"} transition={{ duration: 0.3 }}>
          <RxChevronDown />
        </motion.span>
      </button>
      {isDropdownOpen && (<AnimatePresence>
          <motion.nav variants={{
                open: {
                    visibility: "visible",
                    opacity: "var(--opacity-open, 100%)",
                    y: 0,
                },
                close: {
                    visibility: "hidden",
                    opacity: "var(--opacity-close, 0)",
                    y: "var(--y-close, 0%)",
                },
            }} animate={isDropdownOpen ? "open" : "close"} initial="close" exit="close" transition={{ duration: 0.2 }} className="bg-background-primary lg:absolute lg:z-50 lg:border lg:border-border-primary lg:p-2 lg:[--y-close:25%]">
            {navLink.subMenuLinks?.map((navLink, index) => (<EditableLink textPath="link_3.text" urlPath="link_3.url" key={index} className="block py-3 pl-[5%] text-md lg:px-4 lg:py-2 lg:text-base" href={navLink.url}>{navLink.title}</EditableLink>))}
          </motion.nav>
        </AnimatePresence>)}
    </div>);
};
export const Navbar1Defaults: Props = {
    logo: {
        url: "#",
        src: "https://d22po4pjz3o32e.cloudfront.net/logo-image.svg",
        alt: "Logo image",
    },
    navLinks: [
        { title: "Link One", url: "#" },
        { title: "Link Two", url: "#" },
        { title: "Link Three", url: "#" },
        {
            title: "Link Four",
            url: "#",
            subMenuLinks: [
                { title: "Link Five", url: "#" },
                { title: "Link Six", url: "#" },
                { title: "Link Seven", url: "#" },
            ],
        },
    ],
    buttons: [
        {
            title: "Button",
            variant: "secondary",
            size: "sm",
        },
        {
            title: "Button",
            size: "sm",
        },
    ],
};
const topLineVariants = {
    open: {
        translateY: 8,
        transition: { delay: 0.1 },
    },
    rotatePhase: {
        rotate: -45,
        transition: { delay: 0.2 },
    },
    closed: {
        translateY: 0,
        rotate: 0,
        transition: { duration: 0.2 },
    },
};
const middleLineVariants = {
    open: {
        width: 0,
        transition: { duration: 0.1 },
    },
    closed: {
        width: "1.5rem",
        transition: { delay: 0.3, duration: 0.2 },
    },
};
const bottomLineVariants = {
    open: {
        translateY: -8,
        transition: { delay: 0.1 },
    },
    rotatePhase: {
        rotate: 45,
        transition: { delay: 0.2 },
    },
    closed: {
        translateY: 0,
        rotate: 0,
        transition: { duration: 0.2 },
    },
};
export default Navbar1;
