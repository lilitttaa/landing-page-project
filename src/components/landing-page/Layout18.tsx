import { EditableText, EditableImage, EditableLink, EditableButton, EditableArray, EditableDropdownTitle, EditableMenuItem, EditProvider } from "../editable";
type ImageProps = {
    src: string;
    alt?: string;
};
type FeaturesProps = {
    icon: ImageProps;
    paragraph: string;
};
type Props = {
    heading: string;
    description: string;
    features: FeaturesProps[];
    image: ImageProps;
};
export type Layout18Props = React.ComponentPropsWithoutRef<"section"> & Partial<Props>;
export const Layout18 = (props: Layout18Props & {
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
    const { heading, description, features, image } = {
        ...Layout18Defaults,
        ...props,
    };
    return (<EditProvider isEditMode={isEditMode} onUpdate={handleUpdate} basePath={basePath}><section id="relume" className="px-[5%] py-16 md:py-24 lg:py-28">
      <div className="container">
        <div className="grid grid-cols-1 gap-y-12 md:grid-cols-2 md:items-center md:gap-x-12 lg:gap-x-20">
          <div>
            <EditableText as="h3" path="heading" value={heading} className="mb-5 text-4xl font-bold leading-[1.2] md:mb-6 md:text-5xl lg:text-6xl">{heading}</EditableText>
            <EditableText as="p" path="description" value={description} className="mb-5 md:mb-6 md:text-md">{description}</EditableText>
            <ul className="grid grid-cols-1 gap-4 py-2">
              <EditableArray path="features" as="fragment">{features.map((feature, index) => (<li key={index} className="flex self-start">
                  <div className="mr-4 flex-none self-start">
                    <EditableImage src={feature.icon.src} path="feature.icon" alt={feature.icon.alt} className="size-6" />
                  </div>
                  <EditableText as="p" path="feature.paragraph" value={feature.paragraph}>{feature.paragraph}</EditableText>
                </li>))}</EditableArray>
            </ul>
          </div>
          <EditableImage src={image.src} path="image" className="w-full object-cover" alt={image.alt} />
        </div>
      </div>
    </section></EditProvider>);
};
export const Layout18Defaults: Props = {
    heading: "Long heading is what you see here in this feature section",
    description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse varius enim in eros elementum tristique. Duis cursus, mi quis viverra ornare, eros dolor interdum nulla, ut commodo diam libero vitae erat.",
    features: [
        {
            icon: { src: "https://d22po4pjz3o32e.cloudfront.net/relume-icon.svg", alt: "Relume logo 1" },
            paragraph: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
        },
        {
            icon: { src: "https://d22po4pjz3o32e.cloudfront.net/relume-icon.svg", alt: "Relume logo 2" },
            paragraph: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
        },
        {
            icon: { src: "https://d22po4pjz3o32e.cloudfront.net/relume-icon.svg", alt: "Relume logo 3" },
            paragraph: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
        },
    ],
    image: {
        src: "https://d22po4pjz3o32e.cloudfront.net/placeholder-image.svg",
        alt: "Relume placeholder image",
    },
};

export default Layout18;
