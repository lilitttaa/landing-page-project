'use client';

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export default function Home() {
  const [description, setDescription] = useState("");
  const router = useRouter();
  const { data: session } = useSession();

  const handleLaunchClick = () => {
    if (session) {
      router.push('/dashboard');
    } else {
      router.push('/auth/signin');
    }
  };

  const handleGenerate = async () => {
    if (!description.trim()) return;

    if (!session) {
      router.push('/auth/signin');
      return;
    }

    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          description: description.trim(),
        }),
      });

      if (response.ok) {
        router.push('/dashboard');
      } else {
        console.error('Failed to create project');
      }
    } catch (error) {
      console.error('Error creating project:', error);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <header className="flex justify-between items-center px-8 py-6 border-b border-gray-200">
        <h1 className="text-2xl font-bold text-gray-900">Landing Page Builder</h1>
        <button 
          onClick={handleLaunchClick}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
        >
          {session ? 'Dashboard' : 'Launch'}
        </button>
      </header>
      
      <main className="flex flex-col items-center justify-center px-8 py-20">
        <div className="max-w-2xl w-full text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">
            Create Beautiful Landing Pages
          </h2>
          <p className="text-xl text-gray-600 mb-12">
            Describe your project and let AI generate a stunning landing page for you
          </p>
          
          <div className="space-y-6">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your project or landing page idea..."
              className="w-full h-32 p-4 border border-gray-500 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            
            <button
              onClick={handleGenerate}
              disabled={!description.trim()}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-8 py-4 rounded-lg font-semibold text-lg transition-colors"
            >
              {session ? 'Generate Landing Page' : 'Sign In to Generate'}
            </button>
            
            {!session && (
              <p className="text-sm text-gray-500">
                You need to sign in to create and manage your projects
              </p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
