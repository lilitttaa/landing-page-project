import { EditableText, EditableButton, EditableImage } from "@/components/editable";
import { Button } from "../common";
import type { ButtonProps } from "../common";
import { RxChevronRight } from "react-icons/rx";
type ImageProps = {
    src: string;
    alt?: string;
};
type Props = {
    tagline: string;
    heading: string;
    description: string;
    buttons: ButtonProps[];
    image: ImageProps;
};
export type Layout1Props = React.ComponentPropsWithoutRef<"section"> & Partial<Props>;
export const Layout1 = (props: Layout1Props) => {
    const { tagline, heading, description, buttons, image } = {
        ...Layout1Defaults,
        ...props,
    };
    return (<section id="relume" className="px-[5%] py-16 md:py-24 lg:py-28">
      <div className="container">
        <div className="grid grid-cols-1 gap-y-12 md:grid-cols-2 md:items-center md:gap-x-12 lg:gap-x-20">
          <div>
            <EditableText path="text_0" as="p" className="mb-3 font-semibold md:mb-4">{tagline}</EditableText>
            <EditableText path="text_1" as="h1" className="rb-5 mb-5 text-5xl font-bold md:mb-6 md:text-7xl lg:text-8xl">{heading}</EditableText>
            <EditableText path="text_2" as="p" className="md:text-md">{description}</EditableText>
            <div className="mt-6 flex flex-wrap items-center gap-4 md:mt-8">
              {buttons.map((button, index) => (<EditableButton textPath="button_3.text" as="Button" key={index} {...button}></EditableButton>))}
            </div>
          </div>
          <div>
            <EditableImage path="image_4" src={image.src} className="w-full object-cover" alt={image.alt}></EditableImage>
          </div>
        </div>
      </div>
    </section>);
};
export const Layout1Defaults: Props = {
    tagline: "Tagline",
    heading: "Medium length section heading goes here",
    description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse varius enim in eros elementum tristique. Duis cursus, mi quis viverra ornare, eros dolor interdum nulla, ut commodo diam libero vitae erat.",
    buttons: [
        { title: "Button", variant: "secondary" },
        {
            title: "Button",
            variant: "link",
            size: "link",
            iconRight: <RxChevronRight />,
        },
    ],
    image: {
        src: "https://d22po4pjz3o32e.cloudfront.net/placeholder-image.svg",
        alt: "Relume placeholder image",
    },
};
export default Layout1;
