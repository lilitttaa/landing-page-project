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

  // 设置编辑模式交互
  useEffect(() => {
    if (!project) return;

    const setupEditMode = () => {
      // 为所有可编辑元素添加编辑功能
      const addEditableAttributes = (element: Element, path: string, type: string) => {
        element.setAttribute('data-editable', type);
        element.setAttribute('data-path', path);
        element.classList.add('edit-highlight');
        
        element.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          
          const currentValue = type === 'image' 
            ? (element as HTMLImageElement).src 
            : element.textContent || '';
          
          // 向父页面发送编辑请求
          window.parent.postMessage({
            type: 'EDIT_REQUEST',
            payload: {
              elementType: type,
              elementPath: path,
              currentValue,
              position: {
                x: e.clientX,
                y: e.clientY
              }
            }
          }, '*');
        });
      };

      // 使用setTimeout确保DOM完全渲染
      setTimeout(() => {
        // 为文本元素添加编辑属性
        document.querySelectorAll('h1, h2, h3, h4, h5, h6, p').forEach((element, index) => {
          const tagName = element.tagName.toLowerCase();
          addEditableAttributes(element, `${tagName}_${index}`, 'text');
        });

        // 为图片添加编辑属性
        document.querySelectorAll('img').forEach((element, index) => {
          addEditableAttributes(element, `image_${index}`, 'image');
        });

        // 为按钮添加编辑属性
        document.querySelectorAll('button').forEach((element, index) => {
          addEditableAttributes(element, `button_${index}`, 'button');
        });
      }, 100);
    };

    setupEditMode();

    // 监听来自父页面的内容更新
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'UPDATE_CONTENT') {
        const { elementPath, newValue } = event.data.payload;
        const element = document.querySelector(`[data-path="${elementPath}"]`);
        if (element) {
          if (element.tagName === 'IMG') {
            (element as HTMLImageElement).src = newValue;
          } else {
            element.textContent = newValue;
          }
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [project]);

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
      
      {landing_page_data.sitemap.map((blockId) => {
        const block = landing_page_data.blocks[blockId];
        const content = landing_page_data.block_contents[block.content];
        
        return (
          <ValidatedBlockRenderer
            key={blockId}
            type={block.type}
            subtype={block.subtype}
            content={content}
          />
        );
      })}
    </div>
  );
}