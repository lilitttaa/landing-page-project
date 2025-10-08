"use client";
import { useState } from "react";
import { Button, useMediaQuery } from "../common";
import type { ButtonProps } from "../common";
import { AnimatePresence, motion } from "framer-motion";
import { RxChevronDown } from "react-icons/rx";
import { EditableText, EditableImage, EditableLink, EditableButton, EditableArray, EditableDropdownTitle, EditableMenuItem, EditProvider } from "../editable";
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
export const Navbar1 = (props: Navbar1Props & {
    isEditMode?: boolean;
    onUpdate?: (path: string, value: any) => void;
    basePath?: string;
}) => {
    const { isEditMode = false, onUpdate = () => {
    }, basePath } = props;
    const handleUpdate = (path: string, value: any) => {
        console.log("Update:", path, value);
        if (onUpdate) {
            onUpdate(path, value);
        }
    };
    const { logo, navLinks, buttons } = {
        ...Navbar1Defaults,
        ...props,
    };
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const isMobile = useMediaQuery("(max-width: 991px)");
    return (<EditProvider isEditMode={isEditMode} onUpdate={handleUpdate} basePath={basePath}><section id="relume" className="z-[999] flex w-full items-center border-b border-border-primary bg-background-primary lg:min-h-18 lg:px-[5%]">
      <div className="size-full lg:flex lg:items-center lg:justify-between">
        <div className="flex min-h-16 items-center justify-between px-[5%] md:min-h-18 lg:min-h-full lg:px-0">
          <a href={logo.url}>
            <EditableImage src={logo.src} path="logo" alt={logo.alt} />
          </a>
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
          <EditableArray path="navLinks" as="fragment">{navLinks.map((navLink, index) => navLink.subMenuLinks && navLink.subMenuLinks.length > 0 ? (<SubMenu key={index} navLink={navLink} parentIndex={index} isMobile={isMobile} />) : (<EditableLink href={navLink.url}path={`navLinks.${index}.url`} textPath={`navLinks.${index}.title`} text={navLink.title} key={index}  className="block py-3 text-md first:pt-7 lg:px-4 lg:py-2 lg:text-base first:lg:pt-2">{navLink.title}</EditableLink>))}</EditableArray>
          <div className="mt-6 flex flex-col items-center gap-4 lg:ml-4 lg:mt-0 lg:flex-row">
            <EditableArray path="buttons" as="fragment">{buttons.map((button, index) => (<EditableButton button={button} path="buttons" index={index} key={index} {...button} className="w-full" />))}</EditableArray>
          </div>
        </motion.div>
      </div>
    </section></EditProvider>);
};
const SubMenu = ({ navLink, parentIndex, isMobile }: { navLink: NavLink; parentIndex: number; isMobile: boolean }) => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    return (<div onMouseEnter={() => !isMobile && setIsDropdownOpen(true)} onMouseLeave={() => !isMobile && setIsDropdownOpen(false)}>
      <button className="flex w-full items-center justify-between gap-2 py-3 text-left text-md lg:flex-none lg:justify-start lg:px-4 lg:py-2 lg:text-base" onClick={() => setIsDropdownOpen((prev) => !prev)}>
        <EditableDropdownTitle title={navLink.title} path={`navLinks.${parentIndex}.title`} as="span" value={navLink.title}>{navLink.title}</EditableDropdownTitle>
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
            {navLink.subMenuLinks?.map((navLink, index) => (<EditableLink href={navLink.url}path={`navLinks.${parentIndex}.subMenuLinks.${index}.url`} textPath={`navLinks.${parentIndex}.subMenuLinks.${index}.title`} text={navLink.title} key={index}  className="block py-3 pl-[5%] text-md lg:px-4 lg:py-2 lg:text-base">{navLink.title}</EditableLink>))}
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
