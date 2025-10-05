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
        const arrayProperties = findArrayProperties(content);
        
        const unmappedTextElements = new Set(blockElement.querySelectorAll('h1, h2, h3, h4, h5, h6, p, span, a, button'));
        const unmappedImgElements = new Set(blockElement.querySelectorAll('img'));

        // Handle regular text/image editing
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

        // Handle array editing
        arrayProperties.forEach(({ path, items }) => {
          setupArrayEditing(blockElement, blockId, path, items);
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

    // Helper to find array properties in content
    const findArrayProperties = (obj: any, parentKey = '') => {
      let result: { path: string, items: any[] }[] = [];
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          const newKey = parentKey ? `${parentKey}.${key}` : key;
          if (Array.isArray(obj[key])) {
            result.push({ path: newKey, items: obj[key] });
          } else if (typeof obj[key] === 'object' && obj[key] !== null) {
            result = result.concat(findArrayProperties(obj[key], newKey));
          }
        }
      }
      return result;
    };

    // Setup array editing for a specific array
    const setupArrayEditing = (containerElement: Element, blockId: string, arrayPath: string, items: any[]) => {
      // Create array container for this specific array
      const arraySelector = `[data-array-path="${blockId}.${arrayPath}"]`;
      let arrayContainer = containerElement.querySelector(arraySelector);

      if (!arrayContainer) {
        // Try to find the container based on the array items content
        arrayContainer = findArrayContainer(containerElement, items);
        
        if (arrayContainer) {
          arrayContainer.setAttribute('data-array-path', `${blockId}.${arrayPath}`);
          arrayContainer.setAttribute('data-array-editable', 'true');
        }
      }

      if (!arrayContainer) return;

      // Add array editing capabilities
      if (isEditMode) {
        arrayContainer.classList.add('array-edit-container');
        
        // Add hover events for array container
        const handleArrayMouseEnter = () => {
          if (!isEditMode) return;
          arrayContainer?.classList.add('array-hover');
          showArrayInsertButtons(arrayContainer as Element, blockId, arrayPath, items.length);
        };

        const handleArrayMouseLeave = () => {
          arrayContainer?.classList.remove('array-hover');
          hideArrayInsertButtons(arrayContainer as Element);
        };

        arrayContainer.addEventListener('mouseenter', handleArrayMouseEnter);
        arrayContainer.addEventListener('mouseleave', handleArrayMouseLeave);

        // Store event handlers for cleanup
        (arrayContainer as any)._arrayHoverHandlers = {
          mouseenter: handleArrayMouseEnter,
          mouseleave: handleArrayMouseLeave
        };

        // Setup item hover for delete buttons
        const itemElements = arrayContainer.querySelectorAll('[data-array-item]');
        itemElements.forEach((itemElement, index) => {
          const handleItemMouseEnter = () => {
            if (!isEditMode) return;
            showArrayDeleteButton(itemElement, blockId, arrayPath, index);
          };

          const handleItemMouseLeave = () => {
            hideArrayDeleteButton(itemElement);
          };

          itemElement.addEventListener('mouseenter', handleItemMouseEnter);
          itemElement.addEventListener('mouseleave', handleItemMouseLeave);

          // Store handlers for cleanup
          (itemElement as any)._arrayItemHoverHandlers = {
            mouseenter: handleItemMouseEnter,
            mouseleave: handleItemMouseLeave
          };
        });
      }
    };

    // Find array container based on content matching
    const findArrayContainer = (containerElement: Element, items: any[]): Element | null => {
      // Try to find a container that contains all array items
      const possibleContainers = containerElement.querySelectorAll('ul, ol, div, nav');
      let bestContainer: Element | null = null;
      let bestScore = 0;
      
      for (const container of possibleContainers) {
        let matchCount = 0;
        let exactMatches = 0;
        const childElements = Array.from(container.children);
        
        // Skip if container has too few children compared to array length
        if (childElements.length === 0) continue;
        
        for (const item of items) {
          if (typeof item === 'object' && item !== null) {
            // For objects, try to match by text content of properties
            const itemTexts = extractTextFromObject(item);
            for (const text of itemTexts) {
              for (const child of childElements) {
                if (child.textContent?.trim() === text.trim()) {
                  exactMatches++;
                  matchCount++;
                  break;
                } else if (child.textContent?.includes(text)) {
                  matchCount++;
                  break;
                }
              }
            }
          } else if (typeof item === 'string') {
            // For strings, match directly
            for (const child of childElements) {
              if (child.textContent?.trim() === item.trim()) {
                exactMatches++;
                matchCount++;
                break;
              } else if (child.textContent?.includes(item)) {
                matchCount++;
                break;
              }
            }
          }
        }

        // Calculate score: prefer containers with more exact matches and appropriate child count
        const matchRatio = matchCount / items.length;
        const exactRatio = exactMatches / items.length;
        const childCountScore = Math.abs(childElements.length - items.length) <= 2 ? 1 : 0.5;
        
        const score = matchRatio * 0.4 + exactRatio * 0.4 + childCountScore * 0.2;
        
        // Only consider containers that match most of the items
        if (matchRatio >= 0.7 && score > bestScore) {
          bestScore = score;
          bestContainer = container;
        }
      }

      // Debug logging
      if (bestContainer) {
        console.log(`Found array container:`, bestContainer, `Score: ${bestScore}`);
        // Add data attributes to child elements for array item identification
        const childElements = Array.from(bestContainer.children);
        childElements.forEach((child, index) => {
          if (index < items.length) {
            child.setAttribute('data-array-item', 'true');
          }
        });
      } else {
        console.log(`No suitable array container found for items:`, items);
      }

      return bestContainer;
    };

    // Extract text values from object for matching
    const extractTextFromObject = (obj: any): string[] => {
      const texts: string[] = [];
      for (const key in obj) {
        if (typeof obj[key] === 'string' && obj[key].length > 0) {
          texts.push(obj[key]);
        } else if (typeof obj[key] === 'object' && obj[key] !== null) {
          texts.push(...extractTextFromObject(obj[key]));
        }
      }
      return texts;
    };

    // Show insert buttons for array
    const showArrayInsertButtons = (container: Element, blockId: string, arrayPath: string, itemCount: number) => {
      // Remove existing insert buttons
      hideArrayInsertButtons(container);

      // If no items, add one insert button in the center
      if (itemCount === 0) {
        const insertButton = createInsertButton(blockId, arrayPath, 0, true);
        container.appendChild(insertButton);
        return;
      }

      // For each array item, add hover listeners to show insert buttons
      const items = container.querySelectorAll('[data-array-item]');
      items.forEach((item, index) => {
        const handleItemMouseEnter = () => {
          if (!isEditMode) return;
          
          // Clear any pending removal timers
          if ((container as any)._insertButtonRemovalTimer) {
            clearTimeout((container as any)._insertButtonRemovalTimer);
            delete (container as any)._insertButtonRemovalTimer;
          }
          
          // Remove any existing insert buttons first
          container.querySelectorAll('.dynamic-insert-button').forEach(btn => btn.remove());
          
          // For all items, add insert button before it
          const beforeButton = createInsertButton(blockId, arrayPath, index, false);
          beforeButton.classList.add('dynamic-insert-button');
          item.parentNode?.insertBefore(beforeButton, item);
          
          // For all items, add insert button after it
          const afterButton = createInsertButton(blockId, arrayPath, index + 1, false);
          afterButton.classList.add('dynamic-insert-button');
          if (item.nextSibling) {
            item.parentNode?.insertBefore(afterButton, item.nextSibling);
          } else {
            item.parentNode?.appendChild(afterButton);
          }
        };

        const handleItemMouseLeave = () => {
          // Clear any existing timer
          if ((container as any)._insertButtonRemovalTimer) {
            clearTimeout((container as any)._insertButtonRemovalTimer);
          }
          
          // Set a new timer
          (container as any)._insertButtonRemovalTimer = setTimeout(() => {
            const insertButtons = container.querySelectorAll('.dynamic-insert-button');
            let shouldRemove = true;
            
            // Check if mouse is over any insert button or any array item
            insertButtons.forEach(btn => {
              if (btn.matches(':hover')) {
                shouldRemove = false;
              }
            });
            
            // Check if mouse is over any array item
            const arrayItems = container.querySelectorAll('[data-array-item]');
            arrayItems.forEach(arrayItem => {
              if (arrayItem.matches(':hover')) {
                shouldRemove = false;
              }
            });
            
            if (shouldRemove) {
              insertButtons.forEach(btn => btn.remove());
              delete (container as any)._insertButtonRemovalTimer;
            }
          }, 150);
        };

        item.addEventListener('mouseenter', handleItemMouseEnter);
        item.addEventListener('mouseleave', handleItemMouseLeave);

        // Store handlers for cleanup
        (item as any)._arrayItemHoverHandlers = {
          mouseenter: handleItemMouseEnter,
          mouseleave: handleItemMouseLeave
        };
      });
    };

    // Hide all insert buttons
    const hideArrayInsertButtons = (container: Element) => {
      const insertButtons = container.querySelectorAll('.array-insert-button, .dynamic-insert-button');
      insertButtons.forEach(button => button.remove());
      
      // Remove item hover listeners
      const items = container.querySelectorAll('[data-array-item]');
      items.forEach(item => {
        const handlers = (item as any)._arrayItemHoverHandlers;
        if (handlers) {
          item.removeEventListener('mouseenter', handlers.mouseenter);
          item.removeEventListener('mouseleave', handlers.mouseleave);
          delete (item as any)._arrayItemHoverHandlers;
        }
      });
    };

    // Create insert button
    const createInsertButton = (blockId: string, arrayPath: string, index: number, isFirst: boolean) => {
      const button = document.createElement('div');
      button.className = 'array-insert-button flex justify-center py-0.5 transition-all duration-200';
      button.innerHTML = `
        <button class="h-4 w-4 text-xs border-dashed border-blue-400 bg-blue-50 text-blue-600 rounded-full transition-all duration-200 hover:shadow-sm hover:bg-blue-100 flex items-center justify-center">
          <svg class="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </button>
      `;

      const buttonElement = button.querySelector('button');
      if (buttonElement) {
        buttonElement.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          
          window.parent.postMessage({
            type: 'ARRAY_INSERT_REQUEST',
            payload: {
              blockId,
              arrayPath,
              index,
              position: { x: e.clientX, y: e.clientY }
            }
          }, '*');
        });
      }

      return button;
    };

    // Show delete button for array item
    const showArrayDeleteButton = (itemElement: Element, blockId: string, arrayPath: string, index: number) => {
      // Remove existing delete button
      hideArrayDeleteButton(itemElement);

      const deleteButton = document.createElement('div');
      deleteButton.className = 'array-delete-button absolute top-1 right-1 z-10';
      deleteButton.innerHTML = `
        <button class="h-4 w-4 p-0 rounded-full shadow-lg opacity-90 hover:opacity-100 transition-all duration-200 bg-red-500 hover:bg-red-600 text-white border-red-500 flex items-center justify-center" title="Remove item">
          <svg class="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      `;

      const buttonElement = deleteButton.querySelector('button');
      if (buttonElement) {
        buttonElement.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          
          window.parent.postMessage({
            type: 'ARRAY_DELETE_REQUEST',
            payload: {
              blockId,
              arrayPath,
              index,
              position: { x: e.clientX, y: e.clientY }
            }
          }, '*');
        });
      }

      // Ensure the item has relative positioning
      if (getComputedStyle(itemElement).position === 'static') {
        (itemElement as HTMLElement).style.position = 'relative';
      }

      itemElement.appendChild(deleteButton);
    };

    // Hide delete button for array item
    const hideArrayDeleteButton = (itemElement: Element) => {
      const deleteButton = itemElement.querySelector('.array-delete-button');
      if (deleteButton) {
        deleteButton.remove();
      }
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
      } else if (event.data.type === 'ARRAY_INSERT_RESPONSE') {
        // Handle array item insertion from parent
        const { blockId, arrayPath, index, newItem } = event.data.payload;
        
        setLandingPageData(prevData => {
          if (!prevData) return null;

          const newData = JSON.parse(JSON.stringify(prevData));
          const block = newData.blocks[blockId];
          if (block && newData.block_contents[block.content]) {
            let current = newData.block_contents[block.content];
            const keys = arrayPath.split('.');
            for (let i = 0; i < keys.length; i++) {
              if (i === keys.length - 1) {
                // This is the array
                if (Array.isArray(current[keys[i]])) {
                  current[keys[i]].splice(index, 0, newItem);
                }
              } else {
                current = current[keys[i]];
              }
            }
          }
          
          window.parent.postMessage({ type: 'DATA_UPDATE', payload: newData }, '*');
          return newData;
        });
      } else if (event.data.type === 'ARRAY_DELETE_RESPONSE') {
        // Handle array item deletion from parent
        const { blockId, arrayPath, index } = event.data.payload;
        
        setLandingPageData(prevData => {
          if (!prevData) return null;

          const newData = JSON.parse(JSON.stringify(prevData));
          const block = newData.blocks[blockId];
          if (block && newData.block_contents[block.content]) {
            let current = newData.block_contents[block.content];
            const keys = arrayPath.split('.');
            for (let i = 0; i < keys.length; i++) {
              if (i === keys.length - 1) {
                // This is the array
                if (Array.isArray(current[keys[i]])) {
                  current[keys[i]].splice(index, 1);
                }
              } else {
                current = current[keys[i]];
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

        /* Array editing styles */
        .array-edit-container {
          position: relative;
        }
        
        .array-edit-container.array-hover {
          outline: 1px dashed #10b981 !important;
          outline-offset: 4px !important;
        }

        .array-insert-button {
          opacity: 0;
          transition: opacity 0.2s ease-in-out;
        }

        .array-edit-container.array-hover .array-insert-button {
          opacity: 1;
        }

        .array-delete-button {
          opacity: 0;
          transition: opacity 0.2s ease-in-out;
        }

        .array-delete-button.show {
          opacity: 1;
        }

        /* Ensure array items can have relative positioning for delete buttons */
        [data-array-item] {
          position: relative;
        }

        /* Improve hover states for array items */
        [data-array-item]:hover .array-delete-button {
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