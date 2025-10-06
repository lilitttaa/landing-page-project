'use client';

import React, { useState, useRef } from 'react';
import { useEditContext } from './EditContext';
import { useSmartPosition } from './useSmartPosition';
import { AnimatePresence, motion } from "framer-motion";
import { RxChevronDown } from "react-icons/rx";

interface SubNavLink {
  url: string;
  title: string;
}

interface NavLink {
  url: string;
  title: string;
  subMenuLinks?: SubNavLink[];
}

interface EditableMenuItemProps {
  navLink: NavLink;
  index: number;
  isMobile: boolean;
  className?: string;
}

export const EditableMenuItem: React.FC<EditableMenuItemProps> = ({
  navLink,
  index,
  isMobile,
  className = ''
}) => {
  const { isEditMode, onUpdate, basePath } = useEditContext();
  const [isEditing, setIsEditing] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  // 编辑状态
  const [editTitle, setEditTitle] = useState(navLink.title);
  const [editUrl, setEditUrl] = useState(navLink.url);
  const [isSubMenu, setIsSubMenu] = useState(!!navLink.subMenuLinks);
  const [editSubMenuLinks, setEditSubMenuLinks] = useState<SubNavLink[]>(
    navLink.subMenuLinks || []
  );
  
  const elementRef = useRef<HTMLDivElement>(null);
  const fullPath = basePath ? `${basePath}.navLinks.${index}` : `navLinks.${index}`;

  const position = useSmartPosition({
    isOpen: isEditing,
    elementRef: elementRef,
    popupWidth: 320,
    popupHeight: isSubMenu ? 400 : 200
  });

  const handleEditClick = (e: React.MouseEvent) => {
    if (isEditMode) {
      e.preventDefault();
      e.stopPropagation();
      setIsEditing(true);
    }
  };

  const handleSave = () => {
    if (isSubMenu) {
      // 保存为子菜单
      onUpdate(fullPath, {
        title: editTitle,
        url: editUrl,
        subMenuLinks: editSubMenuLinks
      });
    } else {
      // 保存为普通链接
      onUpdate(fullPath, {
        title: editTitle,
        url: editUrl
      });
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditTitle(navLink.title);
    setEditUrl(navLink.url);
    setIsSubMenu(!!navLink.subMenuLinks);
    setEditSubMenuLinks(navLink.subMenuLinks || []);
    setIsEditing(false);
  };

  const handleAddSubMenuItem = () => {
    setEditSubMenuLinks([...editSubMenuLinks, { title: 'New Item', url: '#' }]);
  };

  const handleRemoveSubMenuItem = (subIndex: number) => {
    setEditSubMenuLinks(editSubMenuLinks.filter((_, i) => i !== subIndex));
  };

  const handleSubMenuItemChange = (subIndex: number, field: 'title' | 'url', value: string) => {
    const updated = editSubMenuLinks.map((item, i) => 
      i === subIndex ? { ...item, [field]: value } : item
    );
    setEditSubMenuLinks(updated);
  };

  const handleTypeChange = (toSubMenu: boolean) => {
    setIsSubMenu(toSubMenu);
    if (toSubMenu && editSubMenuLinks.length === 0) {
      setEditSubMenuLinks([{ title: 'New Item', url: '#' }]);
    }
  };

  // 渲染编辑对话框
  const renderEditDialog = () => (
    <>
      <div 
        className="fixed bg-white border border-gray-300 rounded p-4 shadow-xl z-[9999]"
        style={{
          top: `${position.top}px`,
          left: `${position.left}px`,
        }}
      >
        <div className="space-y-4 w-80">
          <h3 className="font-medium text-gray-900">Edit Menu Item</h3>
          
          {/* 类型选择 */}
          <div className="flex gap-4">
            <label className="flex items-center">
              <input
                type="radio"
                checked={!isSubMenu}
                onChange={() => handleTypeChange(false)}
                className="mr-2"
              />
              Regular Link
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                checked={isSubMenu}
                onChange={() => handleTypeChange(true)}
                className="mr-2"
              />
              Dropdown Menu
            </label>
          </div>

          {/* 标题 */}
          <div>
            <label className="block text-xs font-medium text-gray-700">Title:</label>
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
              placeholder="Menu title"
            />
          </div>

          {/* URL (仅普通链接) */}
          {!isSubMenu && (
            <div>
              <label className="block text-xs font-medium text-gray-700">URL:</label>
              <input
                type="text"
                value={editUrl}
                onChange={(e) => setEditUrl(e.target.value)}
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                placeholder="https://example.com or #anchor"
              />
            </div>
          )}

          {/* 子菜单项 */}
          {isSubMenu && (
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">Sub-menu Items:</label>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {editSubMenuLinks.map((subItem, subIndex) => (
                  <div key={subIndex} className="flex gap-1 items-center">
                    <input
                      type="text"
                      value={subItem.title}
                      onChange={(e) => handleSubMenuItemChange(subIndex, 'title', e.target.value)}
                      className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs"
                      placeholder="Title"
                    />
                    <input
                      type="text"
                      value={subItem.url}
                      onChange={(e) => handleSubMenuItemChange(subIndex, 'url', e.target.value)}
                      className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs"
                      placeholder="URL"
                    />
                    <button
                      onClick={() => handleRemoveSubMenuItem(subIndex)}
                      className="bg-red-500 text-white px-2 py-1 rounded text-xs"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
              <button
                onClick={handleAddSubMenuItem}
                className="w-full mt-2 bg-blue-500 text-white px-2 py-1 rounded text-xs"
              >
                + Add Item
              </button>
            </div>
          )}

          {/* 按钮 */}
          <div className="flex gap-2">
            <button 
              onClick={handleSave}
              className="bg-green-500 text-white px-3 py-1 rounded text-sm"
            >
              Save
            </button>
            <button 
              onClick={handleCancel}
              className="bg-red-500 text-white px-3 py-1 rounded text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
      <div 
        className="fixed inset-0 bg-black bg-opacity-25 z-[9998]"
        onClick={handleCancel}
      />
    </>
  );

  // 普通模式渲染
  if (!isEditMode) {
    if (navLink.subMenuLinks && navLink.subMenuLinks.length > 0) {
      return (
        <div
          onMouseEnter={() => !isMobile && setIsDropdownOpen(true)}
          onMouseLeave={() => !isMobile && setIsDropdownOpen(false)}
        >
          <button
            className={`flex w-full items-center justify-between gap-2 py-3 text-left text-md lg:flex-none lg:justify-start lg:px-4 lg:py-2 lg:text-base ${className}`}
            onClick={() => setIsDropdownOpen((prev) => !prev)}
          >
            <span>{navLink.title}</span>
            <motion.span
              variants={{
                rotated: { rotate: 180 },
                initial: { rotate: 0 },
              }}
              animate={isDropdownOpen ? "rotated" : "initial"}
              transition={{ duration: 0.3 }}
            >
              <RxChevronDown />
            </motion.span>
          </button>
          {isDropdownOpen && (
            <AnimatePresence>
              <motion.nav
                variants={{
                  open: {
                    visibility: "visible",
                    opacity: "var(--opacity-open, 100%)",
                    y: 0,
                  },
                  close: {
                    visibility: "hidden",
                    opacity: "var(--opacity-close, 0)",
                    y: "var(--y-close, 0%)",
                  },
                }}
                animate={isDropdownOpen ? "open" : "close"}
                initial="close"
                exit="close"
                transition={{ duration: 0.2 }}
                className="bg-background-primary lg:absolute lg:z-50 lg:border lg:border-border-primary lg:p-2 lg:[--y-close:25%]"
              >
                {navLink.subMenuLinks?.map((subLink, subIndex) => (
                  <a
                    key={subIndex}
                    href={subLink.url}
                    className="block py-3 pl-[5%] text-md lg:px-4 lg:py-2 lg:text-base"
                  >
                    {subLink.title}
                  </a>
                ))}
              </motion.nav>
            </AnimatePresence>
          )}
        </div>
      );
    } else {
      return (
        <a
          href={navLink.url}
          className={`block py-3 text-md first:pt-7 lg:px-4 lg:py-2 lg:text-base first:lg:pt-2 ${className}`}
        >
          {navLink.title}
        </a>
      );
    }
  }

  // 编辑模式渲染
  if (isEditing) {
    return (
      <>
        <div 
          ref={elementRef}
          className={`block py-3 text-md first:pt-7 lg:px-4 lg:py-2 lg:text-base first:lg:pt-2 border-2 border-blue-500 rounded ${className}`}
        >
          {navLink.title}
          {navLink.subMenuLinks && ' ▼'}
        </div>
        {renderEditDialog()}
      </>
    );
  }

  // 编辑模式 hover 状态
  if (navLink.subMenuLinks && navLink.subMenuLinks.length > 0) {
    return (
      <div
        ref={elementRef}
        onMouseEnter={() => !isMobile && setIsDropdownOpen(true)}
        onMouseLeave={() => !isMobile && setIsDropdownOpen(false)}
        className="cursor-pointer hover:outline hover:outline-2 hover:outline-blue-300 rounded"
        onClick={handleEditClick}
        title="Right-click to edit menu item"
        onContextMenu={(e) => {
          e.preventDefault();
          handleEditClick(e);
        }}
      >
        <button
          className={`flex w-full items-center justify-between gap-2 py-3 text-left text-md lg:flex-none lg:justify-start lg:px-4 lg:py-2 lg:text-base ${className}`}
          onClick={() => setIsDropdownOpen((prev) => !prev)}
        >
          <span>{navLink.title}</span>
          <motion.span
            variants={{
              rotated: { rotate: 180 },
              initial: { rotate: 0 },
            }}
            animate={isDropdownOpen ? "rotated" : "initial"}
            transition={{ duration: 0.3 }}
          >
            <RxChevronDown />
          </motion.span>
        </button>
        {isDropdownOpen && (
          <AnimatePresence>
            <motion.nav
              variants={{
                open: {
                  visibility: "visible",
                  opacity: "var(--opacity-open, 100%)",
                  y: 0,
                },
                close: {
                  visibility: "hidden",
                  opacity: "var(--opacity-close, 0)",
                  y: "var(--y-close, 0%)",
                },
              }}
              animate={isDropdownOpen ? "open" : "close"}
              initial="close"
              exit="close"
              transition={{ duration: 0.2 }}
              className="bg-background-primary lg:absolute lg:z-50 lg:border lg:border-border-primary lg:p-2 lg:[--y-close:25%]"
            >
              {navLink.subMenuLinks?.map((subLink, subIndex) => (
                <a
                  key={subIndex}
                  href={subLink.url}
                  className="block py-3 pl-[5%] text-md lg:px-4 lg:py-2 lg:text-base"
                >
                  {subLink.title}
                </a>
              ))}
            </motion.nav>
          </AnimatePresence>
        )}
      </div>
    );
  } else {
    return (
      <a
        ref={elementRef}
        href={navLink.url}
        className={`block py-3 text-md first:pt-7 lg:px-4 lg:py-2 lg:text-base first:lg:pt-2 cursor-pointer hover:outline hover:outline-2 hover:outline-blue-300 rounded ${className}`}
        onClick={handleEditClick}
        title="Right-click to edit menu item"
        onContextMenu={(e) => {
          e.preventDefault();
          handleEditClick(e);
        }}
      >
        {navLink.title}
      </a>
    );
  }
};