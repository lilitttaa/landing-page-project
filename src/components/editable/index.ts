export { EditableProvider, useEditable } from './EditableContext';
export { 
  EditableText, 
  EditableImage, 
  EditableLink, 
  EditableButton 
} from './EditableElements';
export { EditableArray } from './EditableArray';

// CSS for edit mode highlighting
export const EditableStyles = `
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
`;