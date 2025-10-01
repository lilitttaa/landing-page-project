'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';

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

export default function LandingPagePreview() {
  const params = useParams();
  const projectId = params.id as string;
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(true); // 默认开启编辑模式
  const [editingElement, setEditingElement] = useState<any>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

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

  // 处理来自iframe的编辑请求
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'EDIT_REQUEST') {
        const { elementType, elementPath, currentValue, position } = event.data.payload;
        setEditingElement({
          type: elementType,
          path: elementPath,
          value: currentValue,
          position
        });
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // 处理内容更新
  const handleContentUpdate = (newValue: string) => {
    if (!editingElement || !iframeRef.current) return;

    // 向iframe发送更新消息
    iframeRef.current.contentWindow?.postMessage({
      type: 'UPDATE_CONTENT',
      payload: {
        elementPath: editingElement.path,
        newValue
      }
    }, '*');

    // TODO: 这里应该调用API更新项目数据
    // updateProjectContent(projectId, editingElement.path, newValue);

    setEditingElement(null);
  };

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
    <div className="relative min-h-screen bg-gray-100">
      {/* 编辑模式工具栏 */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-lg font-semibold">Edit Mode</h1>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsEditMode(!isEditMode)}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                isEditMode 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {isEditMode ? 'Exit Edit' : 'Edit Mode'}
            </button>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors">
            Save Changes
          </button>
          <button 
            onClick={() => window.close()}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>

      {/* iframe容器 */}
      <div className="pt-16 h-screen">
        {isEditMode ? (
          <iframe
            ref={iframeRef}
            src={`/edit-frame/${projectId}`}
            className="w-full h-full border-0"
            title="Edit Mode"
          />
        ) : (
          <iframe
            src={`/preview-static/${projectId}`}
            className="w-full h-full border-0"
            title="Preview Mode"
          />
        )}
      </div>

      {/* 编辑弹窗 */}
      {editingElement && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-lg p-6 w-96 max-w-[90vw]">
            <h3 className="text-lg font-semibold mb-4">
              Edit {editingElement.type}
            </h3>
            
            {editingElement.type === 'image' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Image URL
                </label>
                <input
                  type="url"
                  defaultValue={editingElement.value}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleContentUpdate((e.target as HTMLInputElement).value);
                    }
                  }}
                  placeholder="Enter image URL"
                />
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Text Content
                </label>
                <textarea
                  defaultValue={editingElement.value}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={4}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.ctrlKey) {
                      handleContentUpdate((e.target as HTMLTextAreaElement).value);
                    }
                  }}
                />
              </div>
            )}
            
            <div className="flex justify-end space-x-2 mt-4">
              <button
                onClick={() => setEditingElement(null)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const input = editingElement.type === 'image' 
                    ? document.querySelector('input[type="url"]') as HTMLInputElement
                    : document.querySelector('textarea') as HTMLTextAreaElement;
                  if (input) {
                    handleContentUpdate(input.value);
                  }
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Update
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}