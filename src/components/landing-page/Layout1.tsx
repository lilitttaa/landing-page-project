interface Layout1Props {
  title: string;
  desc: string;
  button1: string;
  button2: string;
}

export default function Layout1({ title, desc, button1, button2 }: Layout1Props) {
  return (
    <section className="bg-gradient-to-b from-gray-50 to-white py-20 lg:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 mb-6">
            {title}
          </h1>
          <p className="text-xl lg:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
            {desc}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg text-lg font-medium transition-colors shadow-lg hover:shadow-xl">
              {button1}
            </button>
            <button className="border-2 border-gray-300 hover:border-gray-400 text-gray-700 hover:text-gray-900 px-8 py-3 rounded-lg text-lg font-medium transition-colors">
              {button2}
            </button>
          </div>
        </div>
        
        <div className="mt-16 lg:mt-20">
          <div className="relative">
            <div className="bg-gray-100 rounded-lg aspect-video flex items-center justify-center shadow-2xl">
              <div className="text-center">
                <div className="w-16 h-16 bg-gray-300 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-gray-500 text-sm">Preview Image</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}