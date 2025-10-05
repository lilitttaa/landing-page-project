"use client";

import { useState } from 'react';
import ArrayEditor from './ArrayEditor';
import { Input } from './Input';
import { Label } from './Label';

interface NavLink {
  title: string;
  url: string;
}

interface NavLinksEditorProps {
  navLinks: NavLink[];
  onChange: (navLinks: NavLink[]) => void;
}

export function NavLinksEditor({ navLinks, onChange }: NavLinksEditorProps) {
  const handleAdd = (index: number, newItem: NavLink) => {
    const newNavLinks = [...navLinks];
    newNavLinks.splice(index, 0, newItem);
    onChange(newNavLinks);
  };

  const handleRemove = (index: number) => {
    const newNavLinks = navLinks.filter((_, i) => i !== index);
    onChange(newNavLinks);
  };

  const handleUpdate = (index: number, updatedItem: NavLink) => {
    const newNavLinks = [...navLinks];
    newNavLinks[index] = updatedItem;
    onChange(newNavLinks);
  };

  const createNewItem = (): NavLink => ({
    title: 'New Link',
    url: '#'
  });

  const renderItem = (item: NavLink, index: number) => (
    <div className="p-4 border border-gray-200 rounded-lg bg-white hover:bg-gray-50 transition-colors duration-200">
      <div className="space-y-3">
        <div>
          <Label htmlFor={`title-${index}`} className="text-sm font-medium">
            Link Title
          </Label>
          <Input
            id={`title-${index}`}
            value={item.title}
            onChange={(e) => handleUpdate(index, { ...item, title: e.target.value })}
            className="mt-1"
            placeholder="Enter link title"
          />
        </div>
        <div>
          <Label htmlFor={`url-${index}`} className="text-sm font-medium">
            Link URL
          </Label>
          <Input
            id={`url-${index}`}
            value={item.url}
            onChange={(e) => handleUpdate(index, { ...item, url: e.target.value })}
            className="mt-1"
            placeholder="Enter link URL"
          />
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base font-semibold">Navigation Links</Label>
        <span className="text-sm text-gray-500">{navLinks.length} items</span>
      </div>
      
      <ArrayEditor
        items={navLinks}
        onAdd={handleAdd}
        onRemove={handleRemove}
        onUpdate={handleUpdate}
        renderItem={renderItem}
        createNewItem={createNewItem}
        className="space-y-2"
        itemClassName="relative"
      />
      
      {navLinks.length === 0 && (
        <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
          <p>No navigation links yet</p>
          <p className="text-sm mt-1">Hover to add your first link</p>
        </div>
      )}
    </div>
  );
}

export default NavLinksEditor;