import React, { useState, useEffect, useRef } from "react";


interface LinkifiedInputBoxProps {
  value: string;
  onChange: (value: string) => void;
  onChangeComplete?: () => void;
  className?: string;
  placeholder?: string;
  minHeight?: string;
}

export function LinkifiedInputBox({
  value,
  onChange,
  onChangeComplete,
  className = "",
  placeholder = "Enter text...",
  minHeight = "80px"
}: LinkifiedInputBoxProps) {
  const divRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  // Improved URL regex: https://, http://, www., or any word containing .com/.in
  const urlRegex = /((https?:\/\/|http?:\/\/|www\.)[^\s<>'"()]+|\b[^\s<>'"()]*\.(com|in)\b[^\s<>'"()]*)/gi;

  // Convert plain text to HTML with links
  const linkify = (text: string): string => {
    if (!text) return "";

    // Escape HTML to prevent XSS
    const escapeHtml = (str: string) =>
      str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");

    const escaped = escapeHtml(text);
    
    // Replace URLs with anchor tags
    return escaped.replace(urlRegex, (url) => {
      const decodedUrl = url
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"');
      // Add protocol if missing for www. or .com/.in
      let href = decodedUrl;
      if (!/^https?:\/\//i.test(href)) {
        href = 'https://' + href.replace(/^www\./i, 'www.');
      }
      return `<a href="${href}" target="_blank" rel="noopener noreferrer" style="color:#2563eb;text-decoration:underline;word-break:break-all;">${url}</a>`;
    }).replace(/\n/g, "<br>");
  };

  // Get cursor position
  const getCursorPosition = (): number => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || !divRef.current) return 0;
    
    const range = selection.getRangeAt(0);
    const preCaretRange = range.cloneRange();
    preCaretRange.selectNodeContents(divRef.current);
    preCaretRange.setEnd(range.endContainer, range.endOffset);
    
    return preCaretRange.toString().length;
  };

  // Set cursor position
  const setCursorPosition = (position: number) => {
    const selection = window.getSelection();
    if (!selection || !divRef.current) return;

    let charCount = 0;
    const nodeStack: Node[] = [divRef.current];
    let node: Node | undefined;
    let foundPosition = false;

    while ((node = nodeStack.pop())) {
      if (node.nodeType === Node.TEXT_NODE) {
        const textLength = node.textContent?.length || 0;
        if (charCount + textLength >= position) {
          const range = document.createRange();
          range.setStart(node, Math.min(position - charCount, textLength));
          range.collapse(true);
          selection.removeAllRanges();
          selection.addRange(range);
          foundPosition = true;
          break;
        }
        charCount += textLength;
      } else {
        const children = Array.from(node.childNodes).reverse();
        nodeStack.push(...children);
      }
    }

    if (!foundPosition && divRef.current) {
      const range = document.createRange();
      range.selectNodeContents(divRef.current);
      range.collapse(false);
      selection.removeAllRanges();
      selection.addRange(range);
    }
  };

  // Handle input changes
  const handleInput = () => {
    if (!divRef.current) return;
    
    const cursorPos = getCursorPosition();
    const plainText = divRef.current.innerText || "";
    
    // Update parent immediately
    onChange(plainText);
    
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // Debounce the linkify update
    timeoutRef.current = setTimeout(() => {
      if (divRef.current && document.activeElement === divRef.current) {
        const currentText = divRef.current.innerText || "";
        divRef.current.innerHTML = linkify(currentText);
        setCursorPosition(cursorPos);
      }
    }, 800);
  };

  // Handle key down for Enter key
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        range.deleteContents();
        
        const textNode = document.createTextNode("\n");
        range.insertNode(textNode);
        
        range.setStartAfter(textNode);
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);
        
        if (divRef.current) {
          const event = new Event('input', { bubbles: true });
          divRef.current.dispatchEvent(event);
        }
      }
    }
  };

  // Handle link double-clicks
  const handleDoubleClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.tagName === "A") {
      e.preventDefault();
      const href = target.getAttribute("href");
      if (href) {
        window.open(href, "_blank", "noopener,noreferrer");
      }
    }
  };

  // Update content when value changes externally and not focused
  useEffect(() => {
    if (divRef.current && !isFocused) {
      divRef.current.innerHTML = linkify(value);
    }
  }, [value, isFocused]);

  // Set initial content
  useEffect(() => {
    if (divRef.current && !divRef.current.innerHTML) {
      divRef.current.innerHTML = linkify(value);
    }
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <div
      className={`border rounded-md p-3 bg-white transition-all ${
        isFocused ? "ring-2 ring-blue-400" : ""
      } ${className}`}
      style={{ minHeight }}
    >
      <div
        ref={divRef}
        className="whitespace-pre-wrap break-words outline-none text-gray-900"
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        onDoubleClick={handleDoubleClick}
        onFocus={() => setIsFocused(true)}
        onBlur={() => {
          setIsFocused(false);
          // Apply linkification immediately on blur
          if (divRef.current) {
            const plainText = divRef.current.innerText || "";
            divRef.current.innerHTML = linkify(plainText);
          }
          onChangeComplete?.();
        }}
        style={{
          minHeight,
          caretColor: "#000000",
        }}
        data-placeholder={!value ? placeholder : undefined}
      />
      <style jsx>{`
        [contenteditable][data-placeholder]:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          pointer-events: none;
        }
      `}</style>
    </div>
  );
}

/**
 * Safe Linkified Text Display Component (Read-only)
 */
interface LinkifiedTextSafeProps {
  text: string;
  className?: string;
}

export function LinkifiedTextSafe({ text, className = "" }: LinkifiedTextSafeProps) {
  if (!text) return null;

  // Improved URL regex: https://, http://, www., or any word containing .com/.in
  const urlRegex = /((https?:\/\/|http?:\/\/|www\.)[^\s<>'"()]+|\b[^\s<>'"()]*\.(com|in)\b[^\s<>'"()]*)/gi;
  const parts: React.ReactNode[] = [];
  let key = 0;

  // Split text into lines
  const lines = text.split("\n");

  lines.forEach((line, lineIndex) => {
    let lastIndex = 0;
    urlRegex.lastIndex = 0;
    let match;

    while ((match = urlRegex.exec(line)) !== null) {
      // Add text before the link
      if (match.index > lastIndex) {
        parts.push(
          <span key={`text-${key++}`}>
            {line.substring(lastIndex, match.index)}
          </span>
        );
      }
      // Add the link
      let href = match[0];
      if (!/^https?:\/\//i.test(href)) {
        href = 'https://' + href.replace(/^www\./i, 'www.');
      }
      parts.push(
        <a
          key={`link-${key++}`}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline break-all"
        >
          {match[0]}
        </a>
      );
      lastIndex = match.index + match[0].length;
    }

    // Add remaining text after the last link
    if (lastIndex < line.length) {
      parts.push(
        <span key={`text-${key++}`}>
          {line.substring(lastIndex)}
        </span>
      );
    }

    // Add line break except for the last line
    if (lineIndex < lines.length - 1) {
      parts.push(<br key={`br-${key++}`} />);
    }
  });

  return (
    <div className={`whitespace-pre-wrap break-words ${className}`}>
      {parts.length > 0 ? parts : <span className="text-gray-400">No content</span>}
    </div>
  );
}