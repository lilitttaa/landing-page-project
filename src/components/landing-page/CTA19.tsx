import { Button } from "../common";
import type { ButtonProps } from "../common";
import { EditableText, EditableImage, EditableLink, EditableButton, EditableArray, EditableDropdownTitle, EditableMenuItem, EditProvider } from "../editable";
type Props = {
    heading: string;
    description: string;
    buttons: ButtonProps[];
};
export type Cta19Props = React.ComponentPropsWithoutRef<"section"> & Partial<Props>;
export const Cta19 = (props: Cta19Props & {
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
    const { heading, description, buttons } = {
        ...Cta19Defaults,
        ...props,
    };
    return (<EditProvider isEditMode={isEditMode} onUpdate={handleUpdate} basePath={basePath}><section id="relume" className="relative px-[5%] py-16 md:py-24 lg:py-28">
      <div className="container">
        <div className="w-full max-w-lg">
          <EditableText as="h2" path="heading" value={heading} className="mb-5 text-5xl font-bold md:mb-6 md:text-7xl lg:text-8xl">{heading}</EditableText>
          <EditableText as="p" path="description" value={description} className="md:text-md">{description}</EditableText>
          <div className="mt-6 flex flex-wrap gap-4 md:mt-8">
            <EditableArray path="buttons" as="fragment">{buttons.map((button, index) => (<EditableButton button={button} path="buttons" index={index} key={index} {...button} />))}</EditableArray>
          </div>
        </div>
      </div>
    </section></EditProvider>);
};
export const Cta19Defaults: Props = {
    heading: "Medium length heading goes here",
    description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse varius enim in eros elementum tristique.",
    buttons: [{ title: "Button" }, { title: "Button", variant: "secondary" }],
};

export default Cta19;
