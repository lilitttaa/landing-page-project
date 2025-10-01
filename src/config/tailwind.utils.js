// Tailwind配置工具 - 用于编辑模式和部署时复用
import tailwindConfig from './tailwind.custom.config.js';

/**
 * 获取用于CDN Tailwind的配置字符串（编辑模式iframe使用）
 */
export function getTailwindConfigForCDN() {
  // 移除不兼容CDN的部分
  const { plugins, ...configWithoutPlugins } = tailwindConfig;
  
  return JSON.stringify(configWithoutPlugins);
}

/**
 * 获取完整的Tailwind配置（部署时使用）
 * @param {string[]} contentPaths - 内容文件路径
 */
export function getTailwindConfigForDeploy(contentPaths = []) {
  return {
    ...tailwindConfig,
    content: contentPaths.length > 0 ? contentPaths : tailwindConfig.content,
    // 在部署时会需要实际的plugin引用，暂时注释掉避免错误
    plugins: [
      // require("tailwindcss-animate"),
      // require("@tailwindcss/typography"),
      // ({ addComponents }) => {
      //   const newComponents = {
      //     ".animate-disable": {
      //       animationName: "none",
      //       animationDuration: "0s",
      //       "--tw-enter-opacity": "initial",
      //       "--tw-enter-scale": "initial",
      //       "--tw-enter-rotate": "initial",
      //       "--tw-enter-translate-x": "initial",
      //       "--tw-enter-translate-y": "initial",
      //     },
      //     ".no-scrollbar::-webkit-scrollbar": {
      //       display: "none",
      //     },
      //     ".no-scrollbar": {
      //       "-ms-overflow-style": "none",
      //       scrollbarWidth: "none",
      //     },
      //   };
      //   addComponents(newComponents);
      // },
    ],
  };
}

/**
 * 获取基础配置（仅theme部分）
 */
export function getTailwindThemeConfig() {
  return tailwindConfig.theme;
}