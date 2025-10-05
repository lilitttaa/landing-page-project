"use client";

import { useState } from 'react';
import NavLinksEditor from '@/components/common/NavLinksEditor';
import ArrayEditor from '@/components/common/ArrayEditor';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Label } from '@/components/common/Label';
import { Textarea } from '@/components/common/Textarea';

interface NavLink {
  title: string;
  url: string;
}

interface ButtonItem {
  title: string;
  variant: string;
  size: string;
}

export default function ArrayEditorTestPage() {
  const [navLinks, setNavLinks] = useState<NavLink[]>([
    { title: 'Home', url: '/' },
    { title: 'About', url: '/about' },
    { title: 'Contact', url: '/contact' }
  ]);

  const [buttons, setButtons] = useState<ButtonItem[]>([
    { title: 'Get Started', variant: 'primary', size: 'primary' },
    { title: 'Learn More', variant: 'secondary', size: 'sm' }
  ]);

  const [simpleItems, setSimpleItems] = useState<string[]>([
    'First item',
    'Second item',
    'Third item'
  ]);

  // Button editor functions
  const handleButtonAdd = (index: number, newItem: ButtonItem) => {
    const newButtons = [...buttons];
    newButtons.splice(index, 0, newItem);
    setButtons(newButtons);
  };

  const handleButtonRemove = (index: number) => {
    const newButtons = buttons.filter((_, i) => i !== index);
    setButtons(newButtons);
  };

  const handleButtonUpdate = (index: number, updatedItem: ButtonItem) => {
    const newButtons = [...buttons];
    newButtons[index] = updatedItem;
    setButtons(newButtons);
  };

  const createNewButton = (): ButtonItem => ({
    title: 'New Button',
    variant: 'primary',
    size: 'primary'
  });

  const renderButton = (item: ButtonItem, index: number) => (
    <div className="p-4 border border-gray-200 rounded-lg bg-white hover:bg-gray-50 transition-colors duration-200">
      <div className="space-y-3">
        <div>
          <Label htmlFor={`btn-title-${index}`} className="text-sm font-medium">
            Button Title
          </Label>
          <Input
            id={`btn-title-${index}`}
            value={item.title}
            onChange={(e) => handleButtonUpdate(index, { ...item, title: e.target.value })}
            className="mt-1"
            placeholder="Enter button title"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor={`btn-variant-${index}`} className="text-sm font-medium">
              Variant
            </Label>
            <select
              id={`btn-variant-${index}`}
              value={item.variant}
              onChange={(e) => handleButtonUpdate(index, { ...item, variant: e.target.value })}
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="primary">Primary</option>
              <option value="secondary">Secondary</option>
              <option value="tertiary">Tertiary</option>
              <option value="ghost">Ghost</option>
              <option value="link">Link</option>
            </select>
          </div>
          <div>
            <Label htmlFor={`btn-size-${index}`} className="text-sm font-medium">
              Size
            </Label>
            <select
              id={`btn-size-${index}`}
              value={item.size}
              onChange={(e) => handleButtonUpdate(index, { ...item, size: e.target.value })}
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="primary">Primary</option>
              <option value="sm">Small</option>
              <option value="link">Link</option>
              <option value="icon">Icon</option>
            </select>
          </div>
        </div>
        <div className="pt-2">
          <Label className="text-sm font-medium text-gray-600">Preview:</Label>
          <div className="mt-1">
            <Button
              variant={item.variant as any}
              size={item.size as any}
              className="pointer-events-none"
            >
              {item.title}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  // Simple items editor functions
  const handleSimpleAdd = (index: number, newItem: string) => {
    const newItems = [...simpleItems];
    newItems.splice(index, 0, newItem);
    setSimpleItems(newItems);
  };

  const handleSimpleRemove = (index: number) => {
    const newItems = simpleItems.filter((_, i) => i !== index);
    setSimpleItems(newItems);
  };

  const handleSimpleUpdate = (index: number, updatedItem: string) => {
    const newItems = [...simpleItems];
    newItems[index] = updatedItem;
    setSimpleItems(newItems);
  };

  const createNewSimpleItem = (): string => `New item ${simpleItems.length + 1}`;

  const renderSimpleItem = (item: string, index: number) => (
    <div className="p-3 border border-gray-200 rounded-lg bg-white hover:bg-gray-50 transition-colors duration-200">
      <Input
        value={item}
        onChange={(e) => handleSimpleUpdate(index, e.target.value)}
        placeholder="Enter item text"
        className="border-0 p-0 focus:ring-0 bg-transparent"
      />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Array Editor Test Page</h1>
          <p className="text-gray-600">
            Hover over arrays to see insert buttons, hover over items to see delete buttons
          </p>
        </div>

        {/* Navigation Links Editor */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <NavLinksEditor
            navLinks={navLinks}
            onChange={setNavLinks}
          />
        </div>

        {/* Button Editor */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Buttons</Label>
              <span className="text-sm text-gray-500">{buttons.length} items</span>
            </div>
            
            <ArrayEditor
              items={buttons}
              onAdd={handleButtonAdd}
              onRemove={handleButtonRemove}
              onUpdate={handleButtonUpdate}
              renderItem={renderButton}
              createNewItem={createNewButton}
              className="space-y-2"
              itemClassName="relative"
            />
          </div>
        </div>

        {/* Simple Text Items Editor */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Simple Text Items</Label>
              <span className="text-sm text-gray-500">{simpleItems.length} items</span>
            </div>
            
            <ArrayEditor
              items={simpleItems}
              onAdd={handleSimpleAdd}
              onRemove={handleSimpleRemove}
              onUpdate={handleSimpleUpdate}
              renderItem={renderSimpleItem}
              createNewItem={createNewSimpleItem}
              className="space-y-2"
              itemClassName="relative"
            />
          </div>
        </div>

        {/* Current Data Display */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold mb-4">Current Data</h3>
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Navigation Links:</Label>
              <pre className="mt-1 p-3 bg-gray-100 rounded text-sm overflow-auto">
                {JSON.stringify(navLinks, null, 2)}
              </pre>
            </div>
            <div>
              <Label className="text-sm font-medium">Buttons:</Label>
              <pre className="mt-1 p-3 bg-gray-100 rounded text-sm overflow-auto">
                {JSON.stringify(buttons, null, 2)}
              </pre>
            </div>
            <div>
              <Label className="text-sm font-medium">Simple Items:</Label>
              <pre className="mt-1 p-3 bg-gray-100 rounded text-sm overflow-auto">
                {JSON.stringify(simpleItems, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}