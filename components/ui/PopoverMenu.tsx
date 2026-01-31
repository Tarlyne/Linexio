import React, { useRef, useEffect } from 'react';

interface PopoverMenuProps {
  isOpen: boolean;
  onClose: () => void;
  anchorEl: HTMLElement | null;
  children: React.ReactNode;
}

const PopoverMenu: React.FC<PopoverMenuProps> = ({ isOpen, onClose, anchorEl, children }) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && anchorEl && menuRef.current) {
      const anchorRect = anchorEl.getBoundingClientRect();
      const menuRect = menuRef.current.getBoundingClientRect();
      
      let top = anchorRect.bottom + 8;
      let left = anchorRect.left;

      if (top + menuRect.height > window.innerHeight) {
        top = anchorRect.top - menuRect.height - 8;
      }
      if (left + menuRect.width > window.innerWidth) {
        left = window.innerWidth - menuRect.width - 16;
      }

      menuRef.current.style.top = `${top}px`;
      menuRef.current.style.left = `${left}px`;
    }
  }, [isOpen, anchorEl]);

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div
        ref={menuRef}
        className="fixed z-50 w-64 bg-[var(--color-ui-secondary)]/80 backdrop-blur-lg rounded-lg shadow-2xl shadow-[var(--color-shadow)] border border-[var(--color-border)]/50 p-2 animate-fade-in"
        role="menu"
        aria-orientation="vertical"
        aria-labelledby="menu-button"
      >
        {children}
      </div>
    </>
  );
};

export default PopoverMenu;