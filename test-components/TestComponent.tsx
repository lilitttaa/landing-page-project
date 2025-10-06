import React from 'react';

interface TestComponentProps {
  title: string;
  description: string;
  imageUrl: string;
  linkUrl: string;
  buttonText: string;
}

export const TestComponent: React.FC<TestComponentProps> = ({
  title,
  description,
  imageUrl,
  linkUrl,
  buttonText
}) => {
  return (
    <div className="test-component">
      <h1 className="text-4xl font-bold">{title}</h1>
      <p className="text-lg text-gray-600">{description}</p>
      <img src={imageUrl} alt="Test image" className="w-full h-64 object-cover" />
      <a href={linkUrl} className="text-blue-500 hover:underline">
        Learn more
      </a>
      <button className="bg-blue-500 text-white px-4 py-2 rounded">
        {buttonText}
      </button>
    </div>
  );
};

export default TestComponent;