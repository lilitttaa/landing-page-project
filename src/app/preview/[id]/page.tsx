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

  const [landingPageData, setLandingPageData] = useState<LandingPageData | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const autoSaveTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (project && project.landing_page_data) {
      setLandingPageData(project.landing_page_data);
    }
  }, [project]);

  const saveProject = async (data: LandingPageData, isManual = false) => {
    if (!projectId) return;
    setSaveStatus('saving');

    try {
      const response = await fetch(`/api/projects/${projectId}/content`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ landing_page_data: data }),
      });

      if (!response.ok) {
        throw new Error('Failed to save project');
      }

      if (isManual) {
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      } else {
        setSaveStatus('idle');
      }
    } catch (error) {
      console.error('Error saving project:', error);
      setSaveStatus('idle'); // Or 'error' state
    }
  };

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'EDIT_REQUEST') {
        const { elementType, elementPath, currentValue, currentUrl, position } = event.data.payload;
        setEditingElement({
          type: elementType,
          path: elementPath,
          value: currentValue,
          url: currentUrl,
          position
        });
      } else if (event.data.type === 'DATA_UPDATE') {
        const newData = event.data.payload;
        setLandingPageData(newData);
      } else if (event.data.type === 'MANUAL_SAVE_REQUEST') {
        if (landingPageData) {
          saveProject(landingPageData, true);
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [landingPageData, saveProject]);

  // Auto-save logic
  useEffect(() => {
    if (autoSaveTimer.current) {
      clearTimeout(autoSaveTimer.current);
    }
    if (landingPageData && project && JSON.stringify(landingPageData) !== JSON.stringify(project.landing_page_data)) {
      autoSaveTimer.current = setTimeout(() => {
        saveProject(landingPageData);
      }, 1000);
    }

    return () => {
      if (autoSaveTimer.current) {
        clearTimeout(autoSaveTimer.current);
      }
    };
  }, [landingPageData, project, saveProject]);

  const handleContentUpdate = (updates: Array<{ path: string; value: string }>) => {
    if (!iframeRef.current) return;

    updates.forEach(({ path, value }) => {
      iframeRef.current.contentWindow?.postMessage({
        type: 'UPDATE_CONTENT',
        payload: {
          elementPath: path,
          newValue: value
        }
      }, '*');
    });

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
      {/* ... toolbar ... */}

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
            
            {editingElement.type === 'link' ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Link Text</label>
                  <input
                    type="text"
                    id="linkText"
                    defaultValue={editingElement.value}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Link URL</label>
                  <input
                    type="url"
                    id="linkUrl"
                    defaultValue={editingElement.url}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            ) : editingElement.type === 'image' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Image URL</label>
                <input
                  type="url"
                  id="imageUrl"
                  defaultValue={editingElement.value}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Text Content</label>
                <textarea
                  id="textContent"
                  defaultValue={editingElement.value}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={4}
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
                  const updates = [];
                  if (editingElement.type === 'link') {
                    const textInput = document.getElementById('linkText') as HTMLInputElement;
                    const urlInput = document.getElementById('linkUrl') as HTMLInputElement;
                    const urlPath = editingElement.path.replace(/\.title$/, '.url'); // Assuming title and url are siblings
                    updates.push({ path: editingElement.path, value: textInput.value });
                    updates.push({ path: urlPath, value: urlInput.value });
                  } else if (editingElement.type === 'image') {
                    const input = document.getElementById('imageUrl') as HTMLInputElement;
                    updates.push({ path: editingElement.path, value: input.value });
                  } else {
                    const textarea = document.getElementById('textContent') as HTMLTextAreaElement;
                    updates.push({ path: editingElement.path, value: textarea.value });
                  }
                  handleContentUpdate(updates);
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