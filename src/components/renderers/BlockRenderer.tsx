import { Navbar1 } from '../landing-page/Navbar1';
import { Layout1 } from '../landing-page/Layout1';

const componentMap = {
  Navbar1,
  Layout1,
};

interface BlockRendererProps {
  type: string;
  subtype: string;
  content: any;
}

export default function BlockRenderer({ type, subtype, content }: BlockRendererProps) {
  const Component = componentMap[subtype as keyof typeof componentMap];
  
  if (!Component) {
    return (
      <div className="p-4 bg-red-100 border border-red-300 rounded-md">
        <p className="text-red-600">Component {subtype} not found</p>
      </div>
    );
  }
  
  return <Component {...content} />;
}