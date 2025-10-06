import { useLayoutEffect, useState, useCallback } from 'react';

interface Position {
  top: number;
  left: number;
}

interface UseSmartPositionOptions {
  isOpen: boolean;
  elementRef: React.RefObject<HTMLElement>;
  popupWidth?: number;
  popupHeight?: number;
  offset?: number;
}

export const useSmartPosition = ({
  isOpen,
  elementRef,
  popupWidth = 256,
  popupHeight = 200,
  offset = 8
}: UseSmartPositionOptions) => {
  const [position, setPosition] = useState<Position>({ top: 0, left: 0 });

  const calculatePosition = useCallback(() => {
    if (!isOpen || !elementRef.current) return;

    const element = elementRef.current;
    const rect = element.getBoundingClientRect();
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight
    };

    let top = rect.bottom + offset;
    let left = rect.left;

    // 如果下方空间不够，尝试放在上方
    if (top + popupHeight > viewport.height) {
      const topPosition = rect.top - popupHeight - offset;
      if (topPosition >= 0) {
        top = topPosition;
      } else {
        // 如果上下都放不下，放在可见区域内
        top = Math.max(offset, viewport.height - popupHeight - offset);
      }
    }

    // 如果右侧空间不够，调整到左边
    if (left + popupWidth > viewport.width) {
      left = Math.max(offset, rect.right - popupWidth);
    }

    // 确保不超出左边界
    if (left < offset) {
      left = offset;
    }

    // 确保不超出上边界
    if (top < offset) {
      top = offset;
    }

    setPosition({ top, left });
  }, [isOpen, popupWidth, popupHeight, offset]);

  useLayoutEffect(() => {
    calculatePosition();

    if (isOpen) {
      const handleResize = () => calculatePosition();
      const handleScroll = () => calculatePosition();

      window.addEventListener('resize', handleResize);
      window.addEventListener('scroll', handleScroll, true);

      return () => {
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('scroll', handleScroll, true);
      };
    }
  }, [isOpen, calculatePosition]);

  return position;
};