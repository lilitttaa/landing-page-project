import { Navbar1 } from '../landing-page/Navbar1';
import { Layout1 } from '../landing-page/Layout1';
import { EditableProvider } from '../editable';

const componentMap = {
  Navbar1,
  Layout1,
};

interface BlockRendererProps {
  type: string;
  subtype: string;
  content: any;
  blockId?: string;
  isEditMode?: boolean;
}

export default function ValidatedBlockRenderer({ type, subtype, content, blockId = 'block', isEditMode = false }: BlockRendererProps) {
  const Component = componentMap[subtype as keyof typeof componentMap];
  
  if (!Component) {
    return (
      <div className="p-4 bg-red-100 border border-red-300 rounded-md">
        <p className="text-red-600">Component {subtype} not found</p>
      </div>
    );
  }

  // 直接使用传入的内容，假设服务端已经进行了校验和合并
  return (
    <EditableProvider blockId={blockId} isEditMode={isEditMode}>
      <Component {...content} />
    </EditableProvider>
  );
}