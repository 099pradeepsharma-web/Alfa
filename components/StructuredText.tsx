import React from 'react';

interface StructuredTextProps {
  text: string;
  renderText: (text: string) => React.ReactNode;
}

const StructuredText: React.FC<StructuredTextProps> = ({ text, renderText }) => {
  if (!text) return null;

  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let currentList: string[] = [];

  const flushList = () => {
    if (currentList.length > 0) {
      elements.push(
        <ul key={`ul-${elements.length}`} className="styled-list">
          {currentList.map((item, index) => (
            <li key={index}>{renderText(item)}</li>
          ))}
        </ul>
      );
      currentList = [];
    }
  };

  lines.forEach((line, index) => {
    const trimmedLine = line.trim();
    if (trimmedLine.startsWith('- ')) {
      currentList.push(trimmedLine.substring(2).trim());
    } else {
      flushList();
      if (trimmedLine) {
        elements.push(<p key={`p-${index}`}>{renderText(trimmedLine)}</p>);
      }
    }
  });

  flushList(); // Flush any remaining list items at the end

  return <>{elements}</>;
};

export default StructuredText;
