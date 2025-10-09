import { EditableText, EditableImage, EditableLink, EditableButton, EditableArray, EditableDropdownTitle, EditableMenuItem, EditProvider } from "../editable";
type ImageProps = {
    src: string;
    alt?: string;
};
type SubHeadingProps = {
    title: string;
    description: string;
};
type Props = {
    heading: string;
    description: string;
    image: ImageProps;
    subHeadings: SubHeadingProps[];
};
export type Layout197Props = React.ComponentPropsWithoutRef<"section"> & Partial<Props>;
export const Layout197 = (props: Layout197Props & {
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
    const { heading, description, image, subHeadings } = {
        ...Layout197Defaults,
        ...props,
    };
    return (<EditProvider isEditMode={isEditMode} onUpdate={handleUpdate} basePath={basePath}><section id="relume" className="px-[5%] py-16 md:py-24 lg:py-28">
      <div className="container">
        <div className="grid grid-cols-1 items-center gap-12 md:grid-cols-2 lg:gap-x-20">
          <div className="order-2 md:order-1">
            <EditableImage src={image.src} path="image" className="w-full object-cover" alt={image.alt} />
          </div>
          <div className="order-1 md:order-2">
            <EditableText as="h3" path="heading" value={heading} className="mb-5 text-4xl font-bold leading-[1.2] md:mb-6 md:text-5xl lg:text-6xl">{heading}</EditableText>
            <EditableText as="p" path="description" value={description} className="mb-6 md:mb-8 md:text-md">{description}</EditableText>
            <div className="grid grid-cols-1 gap-6 py-2 sm:grid-cols-2">
              <EditableArray path="subHeadings" as="fragment">{subHeadings.map((subHeading, index) => (<div key={index}>
                  <EditableText as="h6" path="subHeading.title" value={subHeading.title} className="mb-3 text-md font-bold leading-[1.4] md:mb-4 md:text-xl">{subHeading.title}</EditableText>
                  <EditableText as="p" path="subHeading.description" value={subHeading.description}>{subHeading.description}</EditableText>
                </div>))}</EditableArray>
            </div>
          </div>
        </div>
      </div>
    </section></EditProvider>);
};
export const Layout197Defaults: Props = {
    heading: "Long heading is what you see here in this feature section",
    description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse varius enim in eros elementum tristique. Duis cursus, mi quis viverra ornare, eros dolor interdum nulla, ut commodo diam libero vitae erat.",
    image: {
        src: "https://d22po4pjz3o32e.cloudfront.net/placeholder-image.svg",
        alt: "Relume placeholder image",
    },
    subHeadings: [
        {
            title: "Subheading one",
            description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse varius enim in eros.",
        },
        {
            title: "Subheading two",
            description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse varius enim in eros.",
        },
    ],
};

export default Layout197;
