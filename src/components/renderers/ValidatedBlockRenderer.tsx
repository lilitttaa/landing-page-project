import { Navbar1 } from '../landing-page/Navbar1';
import { Layout1 } from '../landing-page/Layout1';
import { Header3 } from '../landing-page/Header3';

const componentMap = {
  Navbar1,
  Layout1,
  Header3,
};

interface BlockRendererProps {
  type: string;
  subtype: string;
  content: any;
  blockId?: string;
  isEditMode?: boolean;
  onUpdate?: (path: string, value: any) => void;
}

export default function ValidatedBlockRenderer({ 
  type, 
  subtype, 
  content, 
  blockId,
  isEditMode = false, 
  onUpdate 
}: BlockRendererProps) {
  const Component = componentMap[subtype as keyof typeof componentMap];
  
  if (!Component) {
    return (
      <div className="p-4 bg-red-100 border border-red-300 rounded-md">
        <p className="text-red-600">Component {subtype} not found</p>
      </div>
    );
  }

  // 传递编辑相关的属性到组件，包括basePath
  return <Component {...content} isEditMode={isEditMode} onUpdate={onUpdate} basePath={blockId} />;
}
