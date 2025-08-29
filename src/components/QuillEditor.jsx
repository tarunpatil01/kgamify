import { useEffect, useState, useRef } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import PropTypes from 'prop-types';

const QuillEditor = ({ value, onChange, isDarkMode, placeholder = "Enter description..." }) => {
  const quillRef = useRef(null);
  const [editorContent, setEditorContent] = useState(value || '');
  
  // Update local state when prop value changes
  useEffect(() => {
    if (value !== editorContent) {
      setEditorContent(value || '');
    }
  }, [value, editorContent]);

  // Handle internal editor changes then propagate to parent
  const handleEditorChange = (content) => {
    setEditorContent(content);
    if (onChange) {
      onChange(content);
    }
  };
  
  // Module configuration with safer defaults to avoid DOM mutation warnings
  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike', 'blockquote'],
      [{ 'list': 'ordered' }, { 'list': 'bullet' }],
      ['link'],
      ['clean']
    ],
    clipboard: {
      // Disable paste formatting by default to avoid DOM mutations
      matchVisual: false
    }
  };
  
  const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike', 'blockquote',
    'list', 'bullet',
    'link'
  ];

  // Add custom CSS to prevent editor-related layout shift
  const editorStyle = {
    minHeight: '200px',
    marginBottom: '50px'
  };

  return (
    <div className={`quill-wrapper ${isDarkMode ? 'react-quill-dark' : ''}`}>
      <ReactQuill
        ref={quillRef}
        theme="snow"
        modules={modules}
        formats={formats}
        value={editorContent}
        onChange={handleEditorChange}
        placeholder={placeholder}
        className={isDarkMode ? 'rounded' : 'bg-white rounded'}
        style={editorStyle}
      />
    </div>
  );
};

QuillEditor.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func,
  isDarkMode: PropTypes.bool,
  placeholder: PropTypes.string
};

export default QuillEditor;
