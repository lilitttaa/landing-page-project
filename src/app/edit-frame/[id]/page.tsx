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
  const [isEditMode, setIsEditMode] = useState(true);
  const [landingPageData, setLandingPageData] = useState<LandingPageData | null>(null);

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

  // 处理编辑更新
  const handleUpdate = (path: string, value: any) => {
    if (!landingPageData) return;

    // 解析路径，找到对应的block和属性
    const newData = JSON.parse(JSON.stringify(landingPageData));
    
    // path格式现在是 "content_001.buttons.0" 这样的格式
    const pathParts = path.split('.');
    
    if (pathParts.length >= 2) {
      // 第一部分是contentId，后面是实际的属性路径
      const contentId = pathParts[0];
      const propertyPath = pathParts.slice(1);
      
      // 只更新指定的content
      const content = newData.block_contents[contentId];
      
      if (content) {
        // 更新嵌套属性
        let current = content;
        
        // 导航到最后一级的父对象
        for (let i = 0; i < propertyPath.length - 1; i++) {
          if (current[propertyPath[i]]) {
            current = current[propertyPath[i]];
          }
        }
        
        // 设置新值
        const lastKey = propertyPath[propertyPath.length - 1];
        if (current && current.hasOwnProperty(lastKey)) {
          current[lastKey] = value;
        }
      }
    } else {
      // 兼容旧的路径格式，更新所有block中的对应数据
      landingPageData.sitemap.forEach(blockId => {
        const block = landingPageData.blocks[blockId];
        const content = newData.block_contents[block.content];
        
        if (content) {
          // 更新嵌套属性
          const pathParts = path.split('.');
          let current = content;
          
          // 导航到最后一级的父对象
          for (let i = 0; i < pathParts.length - 1; i++) {
            if (current[pathParts[i]]) {
              current = current[pathParts[i]];
            }
          }
          
          // 设置新值
          const lastKey = pathParts[pathParts.length - 1];
          if (current && current.hasOwnProperty(lastKey)) {
            current[lastKey] = value;
          }
        }
      });
    }

    setLandingPageData(newData);
    
    // 通知父窗口数据更新
    window.parent.postMessage({ type: 'DATA_UPDATE', payload: newData }, '*');
  };

  // 监听来自父窗口的消息
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'DATA_REPLACE') {
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

  if (!project || !landingPageData) {
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
      {landingPageData.sitemap.map((blockId) => {
        const block = landingPageData.blocks[blockId];
        const content = landingPageData.block_contents[block.content];
        
        return (
          <div key={blockId} data-block-id={blockId}>
            <ValidatedBlockRenderer
              type={block.type}
              subtype={block.subtype}
              content={content}
              blockId={block.content}
              isEditMode={isEditMode}
              onUpdate={handleUpdate}
            />
          </div>
        );
      })}
    </div>
  );
}