import React from 'react';

interface StructuredTextProps {
  text: string;
}

const FormattedText: React.FC<{ text: string }> = ({ text }) => {
    if (!text) return null;
    // This regex is more robust. It splits the string by <u> tags,
    // capturing the content inside them.
    const parts = text.split(/<u>(.*?)<\/u>/g);
    
    return (
        <>
            {parts.map((part, index) => {
                // The captured (underlined) content will be at odd indices.
                if (index % 2 === 1) {
                    return <u key={index}>{part}</u>;
                }
                // The surrounding text will be at even indices.
                return part;
            })}
        </>
    );
};

const StructuredText: React.FC<StructuredTextProps> = ({ text }) => {
  if (!text) return null;

  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let currentList: string[] = [];
  
  // This regex robustly detects common list item markers (e.g., '-', '*', '1.', 'A)', 'B.')
  const listItemRegex = /^\s*([-*]|\d+\.|\w[.)])\s+/;

  const flushList = () => {
    if (currentList.length > 0) {
      elements.push(
        <ul key={`ul-${elements.length}`}>
          {currentList.map((item, index) => (
            <li key={index}><FormattedText text={item} /></li>
          ))}
        </ul>
      );
      currentList = [];
    }
  };

  lines.forEach((line, index) => {
    const match = line.match(listItemRegex);
    if (match) {
      // It's a list item, so push its content without the marker
      currentList.push(line.substring(match[0].length));
    } else {
      // It's not a list item, so flush any existing list
      flushList();
      // And if the line isn't empty, add it as a paragraph
      if (line.trim()) {
        elements.push(<p key={`p-${index}`}><FormattedText text={line} /></p>);
      }
    }
  });

  flushList(); // Flush any remaining list items at the end

  return <>{elements}</>;
};

export default StructuredText;