import { Button } from "../common";
import type { ButtonProps } from "../common";
import { RxChevronRight } from "react-icons/rx";
import { EditableText, EditableImage, EditableLink, EditableButton, EditableArray, EditableDropdownTitle, EditableMenuItem, EditProvider } from "../editable";
type ImageProps = {
    src: string;
    alt?: string;
};
type CardBaseProps = {
    heading: string;
    description: string;
    icon: ImageProps;
};
type CardsSmallProps = CardBaseProps & {
    button: ButtonProps;
};
type CardBigProps = CardBaseProps & {
    buttons: ButtonProps[];
};
type Props = {
    tagline: string;
    heading: string;
    description: string;
    cardsSmall: CardsSmallProps[];
    cardBig: CardBigProps;
};
export type Layout373Props = React.ComponentPropsWithoutRef<"section"> & Partial<Props>;
export const Layout373 = (props: Layout373Props & {
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
    const { tagline, heading, description, cardsSmall, cardBig } = {
        ...Layout373Defaults,
        ...props,
    };
    return (<EditProvider isEditMode={isEditMode} onUpdate={handleUpdate} basePath={basePath}><section id="relume" className="px-[5%] py-16 md:py-24 lg:py-28">
      <div className="container">
        <div className="rb-12 mb-12 md:mb-18 lg:mb-20">
          <div className="mx-auto max-w-lg text-center">
            <EditableText as="p" path="tagline" value={tagline} className="mb-3 font-semibold md:mb-4">{tagline}</EditableText>
            <EditableText as="h2" path="heading" value={heading} className="mb-5 text-5xl font-bold md:mb-6 md:text-7xl lg:text-8xl">{heading}</EditableText>
            <EditableText as="p" path="description" value={description} className="md:text-md">{description}</EditableText>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-6 md:gap-8">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:gap-8 lg:grid-cols-4">
            <div className="grid grid-cols-1 border border-border-primary sm:col-span-2 sm:row-span-1">
              <div className="flex flex-1 flex-col justify-center p-6 md:p-8 lg:p-12">
                <div>
                  <div className="mb-5 md:mb-6">
                    <EditableImage src={cardBig.icon.src} path="cardBig.icon" className="size-12" alt={cardBig.icon.alt} />
                  </div>
                  <EditableText as="h3" path="cardBig.heading" value={cardBig.heading} className="mb-5 text-4xl font-bold leading-[1.2] md:mb-6 md:text-5xl lg:text-6xl">{cardBig.heading}</EditableText>
                  <EditableText as="p" path="cardBig.description" value={cardBig.description}>{cardBig.description}</EditableText>
                </div>
                <div className="mt-6 flex flex-wrap items-center gap-4 md:mt-8">
                  {cardBig.buttons.map((button, index) => (<EditableButton button={button} path="buttons" index={index} key={index} {...button} />))}
                </div>
              </div>
            </div>
            <EditableArray path="cardsSmall" as="fragment">{cardsSmall.map((card, index) => (<div key={index} className="flex flex-col border border-border-primary">
                <div className="flex h-full flex-col justify-between p-6 md:p-8 lg:p-6">
                  <div>
                    <div className="mb-3 md:mb-4">
                      <EditableImage src={card.icon.src} path="card.icon" className="size-12" alt={card.icon.alt} />
                    </div>
                    <EditableText as="h3" path="card.heading" value={card.heading} className="mb-2 text-xl font-bold md:text-2xl">{card.heading}</EditableText>
                    <EditableText as="p" path="card.description" value={card.description}>{card.description}</EditableText>
                  </div>
                  <div className="mt-5 flex flex-wrap items-center gap-4 md:mt-6">
                    <EditableButton button={card.button} path="buttons" index={index} key={index} {...card.button} />
                  </div>
                </div>
              </div>))}</EditableArray>
          </div>
        </div>
      </div>
    </section></EditProvider>);
};
export const Layout373Defaults: Props = {
    tagline: "Tagline",
    heading: "Short heading goes here",
    description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
    cardsSmall: [
        {
            icon: {
                src: "https://d22po4pjz3o32e.cloudfront.net/relume-icon.svg",
                alt: "Relume logo 1",
            },
            heading: "Medium length section heading goes here",
            description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
            button: {
                title: "Button",
                variant: "link",
                size: "link",
                iconRight: <RxChevronRight />,
            },
        },
        {
            icon: {
                src: "https://d22po4pjz3o32e.cloudfront.net/relume-icon.svg",
                alt: "Relume logo 2",
            },
            heading: "Medium length section heading goes here",
            description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
            button: {
                title: "Button",
                variant: "link",
                size: "link",
                iconRight: <RxChevronRight />,
            },
        },
    ],
    cardBig: {
        icon: {
            src: "https://d22po4pjz3o32e.cloudfront.net/relume-icon.svg",
            alt: "Relume logo 3",
        },
        heading: "Short heading here",
        description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse varius enim in eros elementum tristique.",
        buttons: [
            { title: "Button", variant: "secondary" },
            {
                title: "Button",
                variant: "link",
                size: "link",
                iconRight: <RxChevronRight />,
            },
        ],
    },
};

export default Layout373;
