'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import ValidatedBlockRenderer from '@/components/renderers/ValidatedBlockRenderer';
import { EditableStyles } from '@/components/editable';

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
  const [landingPageData, setLandingPageData] = useState<LandingPageData | null>(null);
  const [isEditMode, setIsEditMode] = useState(true); // 默认编辑模式

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
        if (foundProject.landing_page_data) {
          setLandingPageData(foundProject.landing_page_data);
        }
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

  useEffect(() => {
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
  }, []);

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

  return (
    <div className="edit-mode-container min-h-screen bg-white">
      {/* 编辑模式样式 */}
      <style jsx global>{EditableStyles}</style>
      
      {/* 隐藏滚动条的样式 */}
      <style jsx global>{`
        .hide-scrollbar {
          scrollbar-width: none; /* Firefox */
          -ms-overflow-style: none; /* IE and Edge */
        }
        
        .hide-scrollbar::-webkit-scrollbar {
          display: none; /* Chrome, Safari, Opera */
        }
        
        /* EditableButton hover效果 */
        .editable-button-hover {
          transition: all 0.2s ease;
        }
        
        .editable-button-hover:hover {
          outline: 2px dashed #3b82f6 !important;
          outline-offset: 2px !important;
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
              blockId={blockId}
              isEditMode={isEditMode}
            />
          </div>
        );
      })}
    </div>
  );
}