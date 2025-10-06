import { getTailwindConfigForCDN } from '@/config/tailwind.utils.js';

export default function EditFrameLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      {/* 编辑模式特定样式 */}
      <style dangerouslySetInnerHTML={{
        __html: `
          .edit-mode-container {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
          }
          
          /* 隐藏滚动条但保持滚动功能 */
          body {
            scrollbar-width: none;
            -ms-overflow-style: none;
          }
          body::-webkit-scrollbar {
            display: none;
          }
        `
      }} />
      
      {/* 使用CDN版本的Tailwind来应用自定义配置 */}
      <script src="https://cdn.tailwindcss.com"></script>
      <script
        dangerouslySetInnerHTML={{
          __html: `
            // 应用自定义Tailwind配置
            tailwind.config = ${getTailwindConfigForCDN()};
          `,
        }}
      />
      
      <div className="edit-mode-container">
        {children}
      </div>
    </>
  )
}