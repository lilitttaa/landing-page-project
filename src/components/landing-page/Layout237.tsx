import { Button } from "../common";
import type { ButtonProps } from "../common";
import { RxChevronRight } from "react-icons/rx";
import { EditableText, EditableImage, EditableLink, EditableButton, EditableArray, EditableDropdownTitle, EditableMenuItem, EditProvider } from "../editable";
type ImageProps = {
    src: string;
    alt?: string;
};
type SectionProps = {
    icon: ImageProps;
    heading: string;
    description: string;
};
type Props = {
    tagline: string;
    heading: string;
    description: string;
    sections: SectionProps[];
    buttons: ButtonProps[];
};
export type Layout237Props = React.ComponentPropsWithoutRef<"section"> & Partial<Props>;
export const Layout237 = (props: Layout237Props & {
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
    const { tagline, heading, description, sections, buttons } = {
        ...props,
        ...Layout237Defaults,
    };
    return (<EditProvider isEditMode={isEditMode} onUpdate={handleUpdate} basePath={basePath}><section id="relume" className="px-[5%] py-16 md:py-24 lg:py-28">
      <div className="container">
        <div className="flex flex-col items-center">
          <div className="rb-12 mb-12 text-center md:mb-18 lg:mb-20">
            <div className="w-full max-w-lg">
              <EditableText as="p" path="tagline" value={tagline} className="mb-3 font-semibold md:mb-4">{tagline}</EditableText>
              <EditableText as="h2" path="heading" value={heading} className="rb-5 mb-5 text-5xl font-bold md:mb-6 md:text-7xl lg:text-8xl">{heading}</EditableText>
              <EditableText as="p" path="description" value={description} className="md:text-md">{description}</EditableText>
            </div>
          </div>
          <div className="grid grid-cols-1 items-start justify-center gap-y-12 md:grid-cols-3 md:gap-x-8 md:gap-y-16 lg:gap-x-12">
            <EditableArray path="sections" as="fragment">{sections.map((section, index) => (<div key={index} className="flex w-full flex-col items-center text-center">
                <div className="rb-5 mb-5 md:mb-6">
                  <EditableImage src={section.icon.src} path="section.icon" className="size-12" alt={section.icon.alt} />
                </div>
                <EditableText as="h3" path="section.heading" value={section.heading} className="mb-5 text-2xl font-bold md:mb-6 md:text-3xl md:leading-[1.3] lg:text-4xl">{section.heading}</EditableText>
                <EditableText as="p" path="section.description" value={section.description}>{section.description}</EditableText>
              </div>))}</EditableArray>
          </div>
          <div className="mt-10 flex items-center gap-4 md:mt-14 lg:mt-16">
            <EditableArray path="buttons" as="fragment">{buttons.map((button, index) => (<EditableButton button={button} path="buttons" index={index} key={index} {...button} />))}</EditableArray>
          </div>
        </div>
      </div>
    </section></EditProvider>);
};
export const Layout237Defaults: Props = {
    tagline: "Tagline",
    heading: "Medium length section heading goes here",
    description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse varius enim in eros elementum tristique. Duis cursus, mi quis viverra ornare, eros dolor interdum nulla, ut commodo diam libero vitae erat.",
    sections: [
        {
            icon: {
                src: "https://d22po4pjz3o32e.cloudfront.net/relume-icon.svg",
                alt: "Relume logo 1",
            },
            heading: "Medium length section heading goes here",
            description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse varius enim in eros elementum tristique. Duis cursus, mi quis viverra ornare, eros dolor interdum nulla.",
        },
        {
            icon: {
                src: "https://d22po4pjz3o32e.cloudfront.net/relume-icon.svg",
                alt: "Relume logo 2",
            },
            heading: "Medium length section heading goes here",
            description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse varius enim in eros elementum tristique. Duis cursus, mi quis viverra ornare, eros dolor interdum nulla.",
        },
        {
            icon: {
                src: "https://d22po4pjz3o32e.cloudfront.net/relume-icon.svg",
                alt: "Relume logo 3",
            },
            heading: "Medium length section heading goes here",
            description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse varius enim in eros elementum tristique. Duis cursus, mi quis viverra ornare, eros dolor interdum nulla.",
        },
    ],
    buttons: [
        { title: "Button", variant: "secondary" },
        {
            title: "Button",
            variant: "link",
            size: "link",
            iconRight: <RxChevronRight />,
        },
    ],
};
