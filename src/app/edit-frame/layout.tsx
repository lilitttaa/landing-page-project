import { getTailwindConfigForCDN } from '@/config/tailwind.utils.js';

export default function EditFrameLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Edit Mode</title>
        
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
      </head>
      <body className="edit-mode-container">
        {children}
      </body>
    </html>
  )
}