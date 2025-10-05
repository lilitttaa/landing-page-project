'use client';

import { useEffect, useState, useRef, useReducer, useCallback } from 'react';
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

interface HistoryState {
  past: LandingPageData[];
  present: LandingPageData | null;
  future: LandingPageData[];
}

type HistoryAction = 
  | { type: 'PUSH'; payload: LandingPageData }
  | { type: 'UNDO' }
  | { type: 'REDO' }
  | { type: 'RESET'; payload: LandingPageData }
  | { type: 'CLEAR' };

function historyReducer(state: HistoryState, action: HistoryAction): HistoryState {
  switch (action.type) {
    case 'PUSH': {
      const { past, present } = state;
      if (!present) {
        return {
          past: [],
          present: action.payload,
          future: []
        };
      }
      
      // 防止重复记录相同的数据
      if (JSON.stringify(action.payload) === JSON.stringify(present)) {
        return state;
      }
      
      // 限制历史记录数量，避免内存溢出
      const newPast = present ? [...past.slice(-49), present] : past;
      
      return {
        past: newPast,
        present: action.payload,
        future: [] // 新操作会清空重做栈
      };
    }
    
    case 'UNDO': {
      const { past, present, future } = state;
      if (past.length === 0 || !present) return state;
      
      const previous = past[past.length - 1];
      const newPast = past.slice(0, past.length - 1);
      
      return {
        past: newPast,
        present: previous,
        future: [present, ...future]
      };
    }
    
    case 'REDO': {
      const { past, present, future } = state;
      if (future.length === 0 || !present) return state;
      
      const next = future[0];
      const newFuture = future.slice(1);
      
      return {
        past: [...past, present],
        present: next,
        future: newFuture
      };
    }
    
    case 'RESET': {
      return {
        past: [],
        present: action.payload,
        future: []
      };
    }
    
    case 'CLEAR': {
      return {
        past: [],
        present: null,
        future: []
      };
    }
    
    default:
      return state;
  }
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

  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const autoSaveTimer = useRef<NodeJS.Timeout | null>(null);

  // 历史管理状态 - 作为单一数据源
  const [historyState, historyDispatch] = useReducer(historyReducer, {
    past: [],
    present: null,
    future: []
  });

  // 使用历史状态作为当前数据
  const currentData = historyState.present;
  
  // 检查是否可以撤销/重做
  const canUndo = historyState.past.length > 0;
  const canRedo = historyState.future.length > 0;

  // 调试日志
  console.log('History state:', {
    pastLength: historyState.past.length,
    present: !!historyState.present,
    futureLength: historyState.future.length,
    canUndo,
    canRedo
  });

  useEffect(() => {
    if (project && project.landing_page_data) {
      // 初始化历史状态
      historyDispatch({ type: 'RESET', payload: project.landing_page_data });
    }
  }, [project]);

  // 统一的数据更新函数
  const updateData = useCallback((newData: LandingPageData) => {
    console.log('Data update:', newData);
    // 推送到历史记录，historyReducer会自动将当前数据推到past，新数据设为present
    historyDispatch({ type: 'PUSH', payload: newData });
  }, []);

  // Undo/Redo 操作 (使用useCallback避免重复渲染)
  const handleUndo = useCallback(() => {
    console.log('Undo clicked:', { canUndo, pastLength: historyState.past.length });
    
    if (!canUndo || historyState.past.length === 0) return;
    
    // 先获取要恢复的数据，再执行dispatch
    const previousData = historyState.past[historyState.past.length - 1];
    console.log('Undoing to:', previousData);
    
    // 执行undo操作
    historyDispatch({ type: 'UNDO' });
    
    // 通知iframe更新数据
    if (iframeRef.current) {
      setTimeout(() => {
        iframeRef.current.contentWindow?.postMessage({
          type: 'DATA_REPLACE',
          payload: previousData
        }, '*');
      }, 0);
    }
    
    // 自动保存undo后的数据
    setTimeout(() => {
      saveProject(previousData);
    }, 100);
  }, [canUndo, historyState.past.length]);

  const handleRedo = useCallback(() => {
    console.log('Redo clicked:', { canRedo, futureLength: historyState.future.length });
    
    if (!canRedo || historyState.future.length === 0) return;
    
    // 先获取要恢复的数据，再执行dispatch
    const nextData = historyState.future[0];
    console.log('Redoing to:', nextData);
    
    // 执行redo操作
    historyDispatch({ type: 'REDO' });
    
    // 通知iframe更新数据
    if (iframeRef.current) {
      setTimeout(() => {
        iframeRef.current.contentWindow?.postMessage({
          type: 'DATA_REPLACE',
          payload: nextData
        }, '*');
      }, 0);
    }
    
    // 自动保存redo后的数据
    setTimeout(() => {
      saveProject(nextData);
    }, 100);
  }, [canRedo, historyState.future.length]);

  // Array editing handlers
  const handleArrayInsert = useCallback((blockId: string, arrayPath: string, index: number, position: { x: number, y: number }) => {
    if (!currentData) return;

    // Get the array to determine the type of item to create
    const block = currentData.blocks[blockId];
    if (!block || !currentData.block_contents[block.content]) return;

    let current = currentData.block_contents[block.content];
    const keys = arrayPath.split('.');
    for (let i = 0; i < keys.length; i++) {
      if (i === keys.length - 1) {
        // This is the array
        if (Array.isArray(current[keys[i]])) {
          const array = current[keys[i]];
          let newItem: any;

          // Create new item based on array type
          if (array.length > 0) {
            // Clone the first item as template
            const template = array[0];
            if (typeof template === 'object' && template !== null) {
              newItem = JSON.parse(JSON.stringify(template));
              // Reset text values
              resetObjectTextValues(newItem);
            } else {
              newItem = typeof template === 'string' ? 'New Item' : template;
            }
          } else {
            // Default items for common array types
            if (arrayPath.includes('navLinks')) {
              newItem = { title: 'New Link', url: '#' };
            } else if (arrayPath.includes('buttons')) {
              newItem = { title: 'New Button', variant: 'primary', size: 'primary' };
            } else if (arrayPath.includes('subMenuLinks')) {
              newItem = { title: 'New Menu Item', url: '#' };
            } else {
              newItem = 'New Item';
            }
          }

          // Send the new item to iframe
          iframeRef.current?.contentWindow?.postMessage({
            type: 'ARRAY_INSERT_RESPONSE',
            payload: {
              blockId,
              arrayPath,
              index,
              newItem
            }
          }, '*');
        }
      } else {
        current = current[keys[i]];
      }
    }
  }, [currentData]);

  const handleArrayDelete = useCallback((blockId: string, arrayPath: string, index: number, position: { x: number, y: number }) => {
    if (!currentData) return;

    // Send delete request to iframe
    iframeRef.current?.contentWindow?.postMessage({
      type: 'ARRAY_DELETE_RESPONSE',
      payload: {
        blockId,
        arrayPath,
        index
      }
    }, '*');
  }, [currentData]);

  // Helper function to reset text values in cloned objects
  const resetObjectTextValues = (obj: any, prefix = '') => {
    for (const key in obj) {
      if (typeof obj[key] === 'string' && key !== 'url' && key !== 'variant' && key !== 'size') {
        obj[key] = `New ${key.charAt(0).toUpperCase() + key.slice(1)}`;
      } else if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
        resetObjectTextValues(obj[key], key);
      }
    }
  };

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
      } else if (event.data.type === 'ARRAY_INSERT_REQUEST') {
        const { blockId, arrayPath, index, position } = event.data.payload;
        handleArrayInsert(blockId, arrayPath, index, position);
      } else if (event.data.type === 'ARRAY_DELETE_REQUEST') {
        const { blockId, arrayPath, index, position } = event.data.payload;
        handleArrayDelete(blockId, arrayPath, index, position);
      } else if (event.data.type === 'DATA_UPDATE') {
        const newData = event.data.payload;
        updateData(newData); // 直接记录到历史
      } else if (event.data.type === 'MANUAL_SAVE_REQUEST') {
        if (currentData) {
          saveProject(currentData, true);
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [currentData, updateData]);

  // Auto-save logic
  useEffect(() => {
    if (autoSaveTimer.current) {
      clearTimeout(autoSaveTimer.current);
    }
    if (currentData && project && JSON.stringify(currentData) !== JSON.stringify(project.landing_page_data)) {
      autoSaveTimer.current = setTimeout(() => {
        saveProject(currentData);
      }, 1000);
    }

    return () => {
      if (autoSaveTimer.current) {
        clearTimeout(autoSaveTimer.current);
      }
    };
  }, [currentData, project]);

  // 键盘快捷键监听
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // 只在编辑模式下处理
      if (!isEditMode) return;
      
      // 检查是否在编辑弹窗中，如果是则忽略
      if (editingElement) return;
      
      if ((event.ctrlKey || event.metaKey) && !event.shiftKey && event.key === 'z') {
        event.preventDefault();
        handleUndo();
      } else if (
        ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'Z') ||
        ((event.ctrlKey || event.metaKey) && event.key === 'y')
      ) {
        event.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isEditMode, editingElement, handleUndo, handleRedo]);

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

  return (
    <div className="relative min-h-screen bg-gray-100">
      {/* 工具栏 */}
      <div className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-50 px-4 py-3">
        <div className="flex items-center justify-between">
          {/* 左侧 Undo/Redo 按钮 (仅在编辑模式显示) */}
          <div className="flex items-center space-x-2">
            {isEditMode && (
              <>
                <button
                  onClick={handleUndo}
                  disabled={!canUndo}
                  className={`p-2 rounded-md transition-colors ${
                    canUndo
                      ? 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                      : 'text-gray-400 cursor-not-allowed'
                  }`}
                  title={`Undo (Ctrl+Z)`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                  </svg>
                </button>
                <button
                  onClick={handleRedo}
                  disabled={!canRedo}
                  className={`p-2 rounded-md transition-colors ${
                    canRedo
                      ? 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                      : 'text-gray-400 cursor-not-allowed'
                  }`}
                  title={`Redo (Ctrl+Y)`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" />
                  </svg>
                </button>
              </>
            )}
          </div>
          
          {/* 居中的模式切换按钮 */}
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => {
                setIsEditMode(true);
                // 通知iframe切换到编辑模式
                if (iframeRef.current) {
                  iframeRef.current.contentWindow?.postMessage({
                    type: 'SET_MODE',
                    payload: { mode: 'edit' }
                  }, '*');
                }
              }}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                isEditMode
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Edit
            </button>
            <button
              onClick={() => {
                setIsEditMode(false);
                // 通知iframe切换到预览模式
                if (iframeRef.current) {
                  iframeRef.current.contentWindow?.postMessage({
                    type: 'SET_MODE',
                    payload: { mode: 'preview' }
                  }, '*');
                }
              }}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                !isEditMode
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Preview
            </button>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* 关闭按钮 */}
            <button
              onClick={() => window.close()}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* iframe容器 */}
      <div className="pt-16 h-screen">
        <iframe
          ref={iframeRef}
          src={`/edit-frame/${projectId}`}
          className="w-full h-full border-0"
          title={isEditMode ? "Edit Mode" : "Preview Mode"}
          onLoad={() => {
            // iframe加载完成后，发送当前模式
            if (iframeRef.current) {
              iframeRef.current.contentWindow?.postMessage({
                type: 'SET_MODE',
                payload: { mode: isEditMode ? 'edit' : 'preview' }
              }, '*');
            }
          }}
        />
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

      {/* 保存成功通知 */}
      {saveStatus === 'saved' && (
        <div className="fixed bottom-4 right-4 z-[70] bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center">
          <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          Saved successfully
        </div>
      )}
    </div>
  );
}