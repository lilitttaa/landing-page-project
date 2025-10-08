import { Button } from "../common";
import type { ButtonProps } from "../common";
import { RxChevronRight } from "react-icons/rx";
import { EditableText, EditableImage, EditableLink, EditableButton, EditableArray, EditableDropdownTitle, EditableMenuItem, EditProvider } from "../editable";
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
export const Layout1 = (props: Layout1Props & {
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
    const { tagline, heading, description, buttons, image } = {
        ...Layout1Defaults,
        ...props,
    };
    return (<EditProvider isEditMode={isEditMode} onUpdate={handleUpdate} basePath={basePath}><section id="relume" className="px-[5%] py-16 md:py-24 lg:py-28">
      <div className="container">
        <div className="grid grid-cols-1 gap-y-12 md:grid-cols-2 md:items-center md:gap-x-12 lg:gap-x-20">
          <div>
            <EditableText as="p" path="tagline" value={tagline} className="mb-3 font-semibold md:mb-4">{tagline}</EditableText>
            <EditableText as="h1" path="heading" value={heading} className="rb-5 mb-5 text-5xl font-bold md:mb-6 md:text-7xl lg:text-8xl">{heading}</EditableText>
            <EditableText as="p" path="description" value={description} className="md:text-md">{description}</EditableText>
            <div className="mt-6 flex flex-wrap items-center gap-4 md:mt-8">
              <EditableArray path="buttons" as="fragment">{buttons.map((button, index) => (<EditableButton button={button} path="buttons" index={index} key={index} {...button} />))}</EditableArray>
            </div>
          </div>
          <div>
            <EditableImage src={image.src} path="image" className="w-full object-cover" alt={image.alt} />
          </div>
        </div>
      </div>
    </section></EditProvider>);
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
