'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import ValidatedBlockRenderer from '@/components/renderers/ValidatedBlockRenderer';

interface LandingPageBlock {
  type: string;
  subtype: string;
  content: string;
}

interface LandingPageContent {
  [key: string]: any;
}

interface LandingPageData {
  sitemap: string[];
  blocks: {
    [key: string]: LandingPageBlock;
  };
  block_contents: {
    [key: string]: LandingPageContent;
  };
}

interface Project {
  id: string;
  userId: string;
  description: string;
  status: 'generating' | 'completed' | 'failed';
  name?: string;
  createdAt: string;
  updatedAt: string;
  landing_page_data?: LandingPageData;
}

export default function EditFrame() {
  const params = useParams();
  const projectId = params.id as string;
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const response = await fetch('/api/projects');
        if (!response.ok) {
          throw new Error('Failed to fetch projects');
        }
        
        const projects: Project[] = await response.json();
        const foundProject = projects.find(p => p.id === projectId);
        
        if (!foundProject) {
          throw new Error('Project not found');
        }
        
        setProject(foundProject);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    if (projectId) {
      fetchProject();
    }
  }, [projectId]);

  const [landingPageData, setLandingPageData] = useState<LandingPageData | null>(null);
  const [metadataCache, setMetadataCache] = useState<Record<string, any>>({});
  const [isEditMode, setIsEditMode] = useState(true); // 默认编辑模式

  useEffect(() => {
    if (project && project.landing_page_data) {
      setLandingPageData(project.landing_page_data);
    }
  }, [project]);

  // Fetch metadata
  useEffect(() => {
    const fetchMetadata = async () => {
      if (!landingPageData) return;
      const componentTypes = [...new Set(landingPageData.sitemap.map(id => landingPageData.blocks[id].subtype))];
      const newMetadata: Record<string, any> = {};
      for (const type of componentTypes) {
        try {
          const response = await fetch(`/api/meta/${type}`);
          if (response.ok) {
            newMetadata[type] = await response.json();
          }
        } catch (error) {
          console.error(`Failed to fetch metadata for ${type}`, error);
        }
      }
      setMetadataCache(newMetadata);
    };
    fetchMetadata();
  }, [landingPageData]);

  useEffect(() => {
    if (!landingPageData || Object.keys(metadataCache).length === 0) return;

    const setupEditMode = () => {
      landingPageData.sitemap.forEach(blockId => {
        const block = landingPageData.blocks[blockId];
        const componentType = block.subtype;
        const metadata = metadataCache[componentType];
        if (!metadata) return;

        const content = landingPageData.block_contents[block.content];
        const blockElement = document.querySelector(`[data-block-id="${blockId}"]`);
        if (!blockElement) return;

        const editableProperties = flattenObject(content);
        
        const unmappedTextElements = new Set(blockElement.querySelectorAll('h1, h2, h3, h4, h5, h6, p, span, a, button'));
        const unmappedImgElements = new Set(blockElement.querySelectorAll('img'));

        editableProperties.forEach(({ path, value }) => {
          if (typeof value !== 'string') return;

          // Match text content
          for (const el of unmappedTextElements) {
            if (el.textContent?.trim() === value.trim()) {
              addEditableAttributes(el, `${blockId}.${path}`, 'text');
              if (isEditMode) el.classList.add('edit-highlight');
              unmappedTextElements.delete(el);
              break; // Found a match, move to the next property
            }
          }

          // Match image src
          for (const el of unmappedImgElements) {
            if ((el as HTMLImageElement).src === value) {
              addEditableAttributes(el, `${blockId}.${path}`, 'image');
              if (isEditMode) el.classList.add('edit-highlight');
              unmappedImgElements.delete(el);
              break; // Found a match, move to the next property
            }
          }
        });
      });
    };

    const addEditableAttributes = (element: Element, path: string, type: string) => {
      // 始终添加数据属性
      element.setAttribute('data-editable', type);
      element.setAttribute('data-path', path);
      
      // 添加点击事件监听器，但在处理函数中检查模式
      const handleClick = (e: Event) => {
        // 只在编辑模式下处理点击
        if (!isEditMode) return;
        
        e.preventDefault();
        e.stopPropagation();
        
        const isLink = element.tagName === 'A';
        const payload = {
          elementType: isLink ? 'link' : type,
          elementPath: path,
          currentValue: type === 'image' 
            ? (element as HTMLImageElement).src 
            : element.textContent || '',
          currentUrl: isLink ? (element as HTMLAnchorElement).href : undefined,
          position: { x: (e as MouseEvent).clientX, y: (e as MouseEvent).clientY }
        };
        
        window.parent.postMessage({ type: 'EDIT_REQUEST', payload }, '*');
      };
      
      element.addEventListener('click', handleClick);
      // 存储处理函数引用以便后续移除
      (element as any)._editClickHandler = handleClick;
    };

    // Helper to flatten object for easier mapping
    const flattenObject = (obj: any, parentKey = '') => {
      let result: { path: string, value: any }[] = [];
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          const newKey = parentKey ? `${parentKey}.${key}` : key;
          if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
            result = result.concat(flattenObject(obj[key], newKey));
          } else if (Array.isArray(obj[key])) {
            obj[key].forEach((item: any, index: number) => {
              if (typeof item === 'object' && item !== null) {
                result = result.concat(flattenObject(item, `${newKey}.${index}`));
              } else {
                result.push({ path: `${newKey}.${index}`, value: item });
              }
            });
          } else {
            result.push({ path: newKey, value: obj[key] });
          }
        }
      }
      return result;
    };

    setTimeout(setupEditMode, 500); // Delay to ensure DOM is ready

    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'UPDATE_CONTENT') {
        const { elementPath, newValue } = event.data.payload;
        const [blockId, ...restPath] = elementPath.split('.');
        const contentKey = restPath.join('.');

        setLandingPageData(prevData => {
          if (!prevData) return null;

          const newData = JSON.parse(JSON.stringify(prevData));
          const block = newData.blocks[blockId];
          if (block && newData.block_contents[block.content]) {
            let current = newData.block_contents[block.content];
            const keys = contentKey.split('.');
            for (let i = 0; i < keys.length - 1; i++) {
              current = current[keys[i]];
            }
            current[keys[keys.length - 1]] = newValue;

            const element = document.querySelector(`[data-path="${elementPath}"]`);
            if (element) {
              if (element.tagName === 'IMG') {
                (element as HTMLImageElement).src = newValue;
              } else {
                element.textContent = newValue;
              }
            }
          }
          
          window.parent.postMessage({ type: 'DATA_UPDATE', payload: newData }, '*');
          return newData;
        });
      } else if (event.data.type === 'DATA_REPLACE') {
        // 处理Undo/Redo的全量数据替换
        const newData = event.data.payload;
        setLandingPageData(newData);
      } else if (event.data.type === 'SET_MODE') {
        // 处理模式切换
        const { mode } = event.data.payload;
        setIsEditMode(mode === 'edit');
        
        // 更新编辑高亮显示
        const editableElements = document.querySelectorAll('[data-editable]');
        editableElements.forEach(element => {
          if (mode === 'edit') {
            element.classList.add('edit-highlight');
          } else {
            element.classList.remove('edit-highlight');
          }
        });
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.key === 's') {
        event.preventDefault();
        window.parent.postMessage({ type: 'MANUAL_SAVE_REQUEST' }, '*');
      }
    };

    window.addEventListener('message', handleMessage);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('message', handleMessage);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [landingPageData, metadataCache, isEditMode]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!project || !project.landing_page_data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">No Data Available</h1>
          <p className="text-gray-600">This project doesn't have landing page data yet.</p>
        </div>
      </div>
    );
  }

  const { landing_page_data } = project;

  return (
    <div className="edit-mode-container min-h-screen bg-white">
      {/* 编辑模式样式 */}
      <style jsx global>{`
        .edit-highlight {
          outline: 2px dashed #3b82f6 !important;
          outline-offset: 2px !important;
          cursor: pointer !important;
          position: relative;
        }
        .edit-highlight:hover {
          outline-color: #1d4ed8 !important;
          background-color: rgba(59, 130, 246, 0.05) !important;
        }
        .edit-highlight::before {
          content: 'Click to edit';
          position: absolute;
          top: -30px;
          left: 0;
          background: #1f2937;
          color: white;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          z-index: 1000;
          opacity: 0;
          transition: opacity 0.2s;
          pointer-events: none;
        }
        .edit-highlight:hover::before {
          opacity: 1;
        }
      `}</style>
      
      {landingPageData && landingPageData.sitemap.map((blockId) => {
        const block = landingPageData.blocks[blockId];
        const content = landingPageData.block_contents[block.content];
        
        return (
          <div key={blockId} data-block-id={blockId}>
            <ValidatedBlockRenderer
              type={block.type}
              subtype={block.subtype}
              content={content}
            />
          </div>
        );
      })}
    </div>
  );
}